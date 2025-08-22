// src/components/feed/Post.jsx
import React, { useState, useEffect } from "react"; // Ensure useState and useEffect are imported
import {
  toggleReaction,
  addComment,
  getComments,
  sharePost,
} from "../../api/postService"; // Ensure the path is correct
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

const Post = ({ post, currentUser, onDeletePost }) => {
  // --- State initialization ---
  const [counts, setCounts] = useState({
    reactions: post.reactions_count || 0,
    comments: post.comments_count || 0,
    shares: post.shares_count || 0,
  });

  // Initialize local reactions state from props
  const [reactions, setReactions] = useState({
    like: post.likes_count || 0,
    sad: post.sads_count || 0,
    angry: post.angries_count || 0,
  });

  // Initialize userReaction state from props
  const [userReaction, setUserReaction] = useState(post.user_reaction || null);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPostAuthor = currentUser && post.user_id === currentUser.id;
  // --- End State ---

  // --- useEffect Hook: Sync local 'reactions' state with prop changes ---
  useEffect(() => {
    setReactions({
      like: post.likes_count || 0,
      sad: post.sads_count || 0,
      angry: post.angries_count || 0,
    });
  }, [post.likes_count, post.sads_count, post.angries_count]);
  // --- End useEffect ---

  // --- useEffect Hook: Sync local 'userReaction' state with prop changes ---
  useEffect(() => {
    setUserReaction(post.user_reaction || null);
  }, [post.user_reaction]);
  // --- End useEffect ---

  // --- Handler Functions ---
  const handleReactionClick = async (type) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await toggleReaction(post.id, type);
      console.log("Reaction API Response:", response.data);

      if (response.data.message === 'Reaction removed') {
        // Update local counts state with data from backend
        setReactions({
          like: response.data.counts.likes_count,
          sad: response.data.counts.sads_count,
          angry: response.data.counts.angries_count,
        });
        // Update local user reaction state
        setUserReaction(null);

      } else if (response.data.reaction) {
        // Update local counts state with data from backend
        setReactions({
          like: response.data.counts.likes_count,
          sad: response.data.counts.sads_count,
          angry: response.data.counts.angries_count,
        });
        // Update local user reaction state
        setUserReaction(type);
      }
      // Clear any previous error related to reactions
      setError(null);
    } catch (err) {
      // Handle potential 429 error or other network issues
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
      setComments(prev => [...prev, response.data]);
      setNewComment('');
      setCounts(prev => ({ ...prev, comments: prev.comments + 1 }));
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
      // Optionally, you could add the new shared post to the global feed state
      // via a prop function from App.jsx if needed.
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
      {/* Display error messages */}
      {error && <div className="post-error">{error}</div>}

      {/* Post Header */}
      <header className="post-header">
        <div>
          <strong>{post.user?.name}</strong>
          {/* Check for shared post using snake_case as per API response */}
          {post.shared_post_id && <span className="shared-indicator"> shared a post</span>}
        </div>
        {isPostAuthor && (
          <button onClick={handleDelete} className="delete-button" aria-label="Delete post">
            Delete
          </button>
        )}
      </header>

      {/* Post Body */}
      <div className="post-body">
        <p>{post.body}</p>
        {/* Display shared post snippet using snake_case */}
        {post.shared_post && (
          <div className="shared-post-snippet">
            <p><strong>{post.shared_post.user?.name}:</strong> {post.shared_post.body}</p>
          </div>
        )}
      </div>

      {/* Post Stats - Uses the 'reactions' state kept in sync */}
      <div className="post-stats">
        <span>{reactions.like} Likes</span>
        <span>{reactions.sad} Sads</span>
        <span>{reactions.angry} Angries</span>
        <span>{counts.comments} Comments</span>
        <span>{counts.shares} Shares</span>
      </div>

      {/* Reaction Buttons - Uses 'userReaction' state kept in sync */}
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

      {/* Action Buttons */}
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

      {/* Comments Section */}
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

      {/* Action Loading Indicator */}
      {actionLoading && <div className="action-loading">Processing...</div>}
    </article>
  );
  // --- End Render Return ---
};

export default Post;