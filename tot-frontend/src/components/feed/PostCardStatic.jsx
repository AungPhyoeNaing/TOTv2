import React from "react";
import "./Post.css"; // 👈 Reuse existing Post styling

const PostCardStatic = ({ post }) => {
  const likes = post.likes_count || 0;
  const sads = post.sads_count || 0;
  const angries = post.angries_count || 0;
  const comments = post.comments_count || 0;
  const shares = post.shares_count || 0;

  // Get first letter of username for avatar
  const userInitial = post.user?.name?.charAt(0).toUpperCase() || '?';
  const isShared = !!post.shared_post_id;

  // ✅ NEW: Media rendering function (copied from Post.jsx)
  const renderMedia = () => {
    if (!post.media_url) return null;

    switch (post.media_type) {
      case "image":
        return (
          <div className="post-media">
            <img
              src={post.media_url}
              alt="Post media"
              className="media-preview"
            />
          </div>
        );
      case "video":
        return (
          <div className="post-media">
            <video
              controls
              src={post.media_url}
              className="media-preview"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case "audio":
        return (
          <div className="post-media">
            <audio controls src={post.media_url} className="audio-player">
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      default:
        return null;
    }
  };
  // ✅ END NEW

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-header">
        <div>
          <div className="post-avatar">
            {userInitial}
          </div>
          <div className="post-header-info">
            <strong>{post.user?.name || 'Unknown User'}</strong>
            <small>{new Date(post.created_at).toLocaleString()}</small>
          </div>
          {isShared && (
            <span className="shared-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Shared
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="post-body">
        <p>{post.body}</p>

        {/* ✅ INSERT MEDIA RENDERING HERE */}
        {renderMedia()}
        {/* ✅ END MEDIA RENDERING */}

        {post.shared_post && (
          <div className="shared-post-snippet">
            <p>
              <strong>{post.shared_post.user?.name}:</strong> {post.shared_post.body}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="post-stats">
        <span>
          <span className="stat-number">{likes}</span> Likes
        </span>
        <span>
          <span className="stat-number">{sads}</span> Sads
        </span>
        <span>
          <span className="stat-number">{angries}</span> Angries
        </span>
        <span>
          <span className="stat-number">{comments}</span> Comments
        </span>
        <span>
          <span className="stat-number">{shares}</span> Shares
        </span>
      </div>
    </article>
  );
};

export default PostCardStatic;