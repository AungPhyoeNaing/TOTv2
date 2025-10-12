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


const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - postTime) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const value = Math.floor(diffInSeconds / seconds);
    if (value >= 1) {
      return `${value} ${unit}${value > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
};


// Accept the socket prop
const Post = ({ post, currentUser, onDeletePost, socket, onViewProfile, onViewOriginalPost }) => { // <-- Added onViewOriginalPost prop
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
           
            if (newCommentData.post_id === post.id) {
                console.log("Real-time comment received in Post component:", newCommentData);
             
                setComments(prevComments => [...prevComments, newCommentData]);
                
            }
        };

        // Attach the listener
        socket.on('commentAdded', handleNewComment);

       
        return () => {
            socket.off('commentAdded', handleNewComment);
        };
    }
  }, [socket, isCommentsVisible, isLoadingComments, post.id]); 
 
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
      // Determine the ID of the *original* post to share.
      // If the current post is a share wrapper (has 'shared_post'), get the ID of the original post inside it.
      // Otherwise, the current post *is* the original, so use its ID.
      const originalPostIdToShare = post.shared_post ? post.shared_post.id : post.id;

      console.log(`Attempting to share original post with ID: ${originalPostIdToShare} (from displayed post ID: ${post.id})`);
      
      const response = await sharePost(originalPostIdToShare); // Share the original post
      
      console.log("Share API response:", response.data);
      
      // Update the share count for the *currently displayed* post in the UI.
      // This provides visual feedback for the action taken on the post visible to the user.
      // The backend should handle incrementing the original post's share count internally,
      // potentially via triggers or application logic linked to the originalPostIdToShare.
      setCounts(prev => ({ ...prev, shares: prev.shares + 1 }));
      
      // Optional: Emit a real-time update event for the *currently displayed* post's share count
      // if your application updates it via websockets.
      // if (socket) {
      //   socket.emit('postShared', { postId: post.id }); // Or maybe originalPostIdToShare if backend handles it
      // }

      alert("Original post shared!");
    } catch (err) {
      console.error("Share error:", err);
      if (err.response && err.response.status === 429) {
        setError("Too many requests. Please wait and try again.");
      } else {
        setError("Failed to share post.");
      }
    } finally {
      setActionLoading(false);
    }
  };
  const handleDelete = () => {
    if (onDeletePost) {
      onDeletePost(post.id);
    }
  };

  const handleViewOriginalPost = () => {
  if (onViewOriginalPost) {
    onViewOriginalPost(post.shared_post.id); // ✅ Use the shared post's ID
  }
};

  // --- Render Return ---
  return (
    <article className="post-card">
      {error && <div className="post-error">{error}</div>}

      <header className="post-header">
        {/* Author Avatar and Name */}
        <div className="post-author" onClick={() => onViewProfile && onViewProfile(post.user_id)} style={{ cursor: 'pointer' }}>
          <img
            src={post.user?.avatar || post.user?.profile_picture || "https://placehold.co/40"} // Use avatar or profile_picture, fallback to placeholder
            alt={`${post.user?.name || 'User'}'s avatar`}
            className="post-author-avatar"
          />
          
          <div>
            <strong>{post.user?.name || 'Unknown User'}</strong>
            <div className="post-time">
  {formatTimeAgo(post.created_at)}
</div>
            {post.shared_post_id && (
              <span className="shared-indicator">
                <span> shared </span>
                <strong
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering parent onClick
                    onViewProfile && onViewProfile(post.shared_post?.user_id);
                  }}
                  style={{ cursor: 'pointer', color: 'blue' }}
                >
                  {post.shared_post?.user?.name}
                </strong>'s post
              </span>
            )}
          </div>
        </div>
        {post.category && <span className="cat-badge">{post.category.name}</span>}

        {/* Delete Button (only for author) */}
        {isPostAuthor && (
          <button onClick={handleDelete} className="delete-button" aria-label="Delete post">
            &times;
          </button>
        )}
      </header>

      <div className="post-body">
        {/* Current post body (only if exists and is not a share) */}
        {post.body && !post.shared_post_id && <p>{post.body}</p>}
        
        {/* Current post media */}
        {post.media_url && (
          <div className="post-media" style={{ marginTop: '12px', marginBottom: '12px' }}>
            {post.media_type === 'image' && (
              <img
                src={post.media_url}
                alt="Post media"
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                }}
              />
            )}

            {post.media_type === 'video' && (
              <video
                controls
                src={post.media_url}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  borderRadius: '8px',
                }}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            )}

            {post.media_type === 'audio' && (
              <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <audio controls src={post.media_url} style={{ width: '100%' }}>
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}
          </div>
        )}

        {/* Shared post content (only if this is a shared post) */}
        {post.shared_post && (
          <div className="shared-post-container">
            <div className="shared-post-header">
              <div
                onClick={() => onViewProfile && onViewProfile(post.shared_post.user_id)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <img
                  src={post.shared_post.user?.avatar || post.shared_post.user?.profile_picture || "https://placehold.co/32"} // Avatar for shared post author
                  alt={`${post.shared_post.user?.name || 'User'} avatar`}
                  className="shared-post-author-avatar" // Different class for sizing if needed
                  style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '8px' }}
                />
                <strong>{post.shared_post.user?.name}</strong>
              </div>
            </div>
            
            <div className="shared-post-content">
              {post.shared_post.body && <p>{post.shared_post.body}</p>}
              
              {/* Shared post media */}
              {post.shared_post.media_url && (
                <div className="post-media" style={{ marginTop: '12px', marginBottom: '12px' }}>
                  {post.shared_post.media_type === 'image' && (
                    <img
                      src={post.shared_post.media_url}
                      alt="Shared post media"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        borderRadius: '8px',
                        objectFit: 'contain',
                      }}
                    />
                  )}

                  {post.shared_post.media_type === 'video' && (
                    <video
                      controls
                      src={post.shared_post.media_url}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        borderRadius: '8px',
                      }}
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}

                  {post.shared_post.media_type === 'audio' && (
                    <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                      <audio controls src={post.shared_post.media_url} style={{ width: '100%' }}>
                        Your browser does not support the audio tag.
                      </audio>
                    </div>
                  )}
                </div>
              )}
              
              {/* View Original Post Button */}
              <div className="view-original-post-section">
                <button 
                  className="view-original-post-btn"
                  onClick={handleViewOriginalPost}
                  aria-label="View original post"
                >
                  View Original Post
                </button>
              </div>
            </div>
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
                  {/* Comment Author Avatar */}
                  <div className="comment-author">
                    <img
                      src={comment.user?.avatar || comment.user?.profile_picture || "https://placehold.co/24"} // Avatar for comment author
                      alt={`${comment.user?.name || 'User'} avatar`}
                      className="comment-author-avatar" // Different class for sizing if needed
                      style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '8px' }}
                    />
                    <strong>{comment.user?.name}:</strong>
                  </div>
                  <span>{comment.body}</span>
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