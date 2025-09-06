

// src/components/feed/Post.jsx
import React, { useState, useEffect } from "react";
import {
  toggleReaction,
  addComment,
  getComments,
  sharePost,
} from "../../api/postService";
import "./Post.css";

// --- ReactionButton Component ---
const ReactionButton = ({ type, count, isActive, onClick, disabled, ariaLabel }) => (
  <button
    className={`reaction-button ${type.toLowerCase()} ${isActive ? 'active' : ''}`}
    onClick={() => onClick(type.toLowerCase())}
    disabled={disabled}
    aria-label={ariaLabel}
  >
    {type} ({count})
  </button>
);
// --- End ReactionButton ---

// Accept the socket prop
const Post = ({ post, currentUser, onDeletePost, socket, onViewProfile }) => { // <-- Accept socket prop
  // --- State initialization ---
  const [counts, setCounts] = useState({
    reactions: post.reactions_count || 0,
    comments: post.comments_count || 0,
    shares: post.shares_count || 0,
  });

  const [reactions, setReactions] = useState({
    like: post.likes_count || 0,
    sad: post.sads_count || 0,
    angry: post.angries_count || 0,
  });

  const [userReaction, setUserReaction] = useState(post.user_reaction || null);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPostAuthor = currentUser && post.user_id === currentUser.id;

  useEffect(() => {
    setReactions({
      like: post.likes_count || 0,
      sad: post.sads_count || 0,
      angry: post.angries_count || 0,
    });
    
    setCounts({
        reactions: post.reactions_count || 0,
        comments: post.comments_count || 0,
        shares: post.shares_count || 0,
    });
   
    // setUserReaction(post.user_reaction || null);
  }, [post.likes_count, post.sads_count, post.angries_count, post.reactions_count, post.comments_count, post.shares_count, post.user_reaction]);
  
  useEffect(() => {
    
    if (socket && isCommentsVisible && !isLoadingComments) {
        const handleNewComment = (newCommentData) => {
            // Check if the comment belongs to this specific post
            if (newCommentData.post_id === post.id) {
                console.log("Real-time comment received in Post component:", newCommentData);
                // Add the new comment to the local comments list
                setComments(prevComments => [...prevComments, newCommentData]);
                // Optionally, update the local counts state (though App.jsx already did this)
                // setCounts(prev => ({ ...prev, comments: prev.comments + 1 }));
            }
        };

        // Attach the listener
        socket.on('commentAdded', handleNewComment);

        // Cleanup listener on unmount or when dependencies change
        return () => {
            socket.off('commentAdded', handleNewComment);
        };
    }
  }, [socket, isCommentsVisible, isLoadingComments, post.id]); // Re-run if these change
  // --- End real-time comment listener ---

  // --- Handler Functions ---
  const handleReactionClick = async (type) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await toggleReaction(post.id, type);
      console.log("Reaction API Response:", response.data);

      // --- Emit event to Node.js server for real-time update ---
      // Do this *after* the successful API call
      if (socket) { // Check if socket is available
        socket.emit('postReactionUpdated', { postId: post.id });
        console.log(`Emitted 'postReactionUpdated' for post ${post.id}`);
      }
      // --- End emit event ---

      // Update local state based on the API response (as before)
      if (response.data.message === 'Reaction removed') {
        setReactions({
          like: response.data.counts.likes_count,
          sad: response.data.counts.sads_count,
          angry: response.data.counts.angries_count,
        });
        setUserReaction(null);
      } else if (response.data.reaction) {
        setReactions({
          like: response.data.counts.likes_count,
          sad: response.data.counts.sads_count,
          angry: response.data.counts.angries_count,
        });
        setUserReaction(type);
      }
      setError(null);
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setError("Too many requests. Please wait and try again.");
        console.error("Rate limit exceeded for reaction toggle.");
      } else {
        console.error("Reaction error:", err);
        setError("Failed to update reaction. Please try again.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const toggleComments = async () => {
    if (isCommentsVisible) {
      setIsCommentsVisible(false);
    } else {
      if (comments.length === 0) {
        setIsLoadingComments(true);
        setError(null);
        try {
          const response = await getComments(post.id);
          setComments(response.data);
        } catch (err) {
          console.error("Comments fetch error:", err);
          setError("Failed to load comments.");
        } finally {
          setIsLoadingComments(false);
        }
      }
      setIsCommentsVisible(true);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || actionLoading) return;

    setActionLoading(true);
    setError(null);
    try {
      const response = await addComment(post.id, newComment);
      // Clear the input field immediately
      setNewComment('');

      // --- Emit event to Node.js server for real-time update ---
      // Send the postId and the newly created comment data
      if (socket && response.data) { // Check if socket is available and response has data
        socket.emit('postCommentAdded', { postId: post.id, comment: response.data });
        console.log(`Emitted 'postCommentAdded' for post ${post.id}`, response.data);
      }
      // --- End emit event ---

      // Note: The local comment list and count are now updated by the
      // real-time listeners in useEffect and App.jsx, so we don't need to do it here.
      // setComments(prev => [...prev, response.data]); // Removed
      // setCounts(prev => ({ ...prev, comments: prev.comments + 1 })); // Removed

    } catch (err) {
      console.error("Add comment error:", err);
      setError("Failed to add comment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await sharePost(post.id);
      console.log("Share response:", response.data);
      setCounts(prev => ({ ...prev, shares: prev.shares + 1 }));
      alert("Post shared!");
    } catch (err) {
      console.error("Share error:", err);
      setError("Failed to share post.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    if (onDeletePost) {
      onDeletePost(post.id);
    }
  };
  // --- End Handler Functions ---

  // --- Render Return ---
  return (
    <article className="post-card">
      {error && <div className="post-error">{error}</div>}

      <header className="post-header">
        <div>
          <strong
          onClick={() => {
              if (onViewProfile) {
                onViewProfile(post.user_id); // Call onViewProfile with the author's ID
              }
            }}
            style={{ cursor: 'pointer', color: 'blue' }} 
          >{post.user?.name}</strong>
          {post.shared_post_id && <span className="shared-indicator"> shared a post</span>}
        </div>
        {isPostAuthor && (
          <button onClick={handleDelete} className="delete-button" aria-label="Delete post">
            Delete
          </button>
        )}
      </header>

      <div className="post-body">
        <p>{post.body}</p>
        {post.shared_post && (
          <div className="shared-post-snippet">
            <p><strong>{post.shared_post.user?.name}:</strong> {post.shared_post.body}</p>
          </div>
        )}
      </div>

      <div className="post-stats">
        <span>{reactions.like} Likes</span>
        <span>{reactions.sad} Sads</span>
        <span>{reactions.angry} Angries</span>
        <span>{counts.comments} Comments</span>
        <span>{counts.shares} Shares</span>
      </div>

      <div className="post-reactions">
        <ReactionButton
          type="Like"
          count={reactions.like}
          isActive={userReaction === 'like'}
          onClick={handleReactionClick}
          disabled={actionLoading}
          ariaLabel="Like this post"
        />
        <ReactionButton
          type="Sad"
          count={reactions.sad}
          isActive={userReaction === 'sad'}
          onClick={handleReactionClick}
          disabled={actionLoading}
          ariaLabel="Sad reaction"
        />
        <ReactionButton
          type="Angry"
          count={reactions.angry}
          isActive={userReaction === 'angry'}
          onClick={handleReactionClick}
          disabled={actionLoading}
          ariaLabel="Angry reaction"
        />
      </div>

      <div className="post-actions">
        <button
          onClick={toggleComments}
          disabled={actionLoading}
          aria-expanded={isCommentsVisible}
        >
          {isCommentsVisible ? 'Hide Comments' : `Comment (${counts.comments})`}
        </button>
        <button onClick={handleShare} disabled={actionLoading} aria-label="Share post">
          Share ({counts.shares})
        </button>
      </div>

      {isCommentsVisible && (
        <div className="post-comments-section">
          <form onSubmit={handleAddComment} className="add-comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              aria-label="Add a comment"
              disabled={actionLoading}
            />
            <button type="submit" disabled={actionLoading || !newComment.trim()}>
              Post
            </button>
          </form>

          {isLoadingComments && <p>Loading comments...</p>}
          {comments.length > 0 ? (
            <ul className="comments-list">
              {comments.map((comment) => (
                <li key={comment.id} className="comment-item">
                  <strong>{comment.user?.name}:</strong> {comment.body}
                </li>
              ))}
            </ul>
          ) : (
            !isLoadingComments && <p>No comments yet.</p>
          )}
        </div>
      )}

      {actionLoading && <div className="action-loading">Processing...</div>}
    </article>
  );
  // --- End Render Return ---
};

export default Post;