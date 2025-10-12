import React from "react";
//import "./Post.css"; // 👈 Reuse existing Post styling
import "./PostCardStatic.css"; // 👈 New CSS for PostCardStatic

const PostCardStatic = ({ post }) => {
  const likes = post.likes_count || 0;
  const sads = post.sads_count || 0;
  const angries = post.angries_count || 0;
  const comments = post.comments_count || 0;
  const shares = post.shares_count || 0;

  // Get first letter of username for avatar
  const userInitial = post.user?.name?.charAt(0).toUpperCase() || '?';
  const isShared = !!post.shared_post_id;

  // ✅ NEW: Media rendering function (updated to handle both current and shared post media)
  const renderMedia = () => {
    // First render current post media if it exists
    if (post.media_url) {
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
    }

    // If no current post media but it's a shared post, render shared post media
    if (!post.media_url && post.shared_post && post.shared_post.media_url) {
      switch (post.shared_post.media_type) {
        case "image":
          return (
            <div className="post-media">
              <img
                src={post.shared_post.media_url}
                alt="Shared post media"
                className="media-preview"
              />
            </div>
          );
        case "video":
          return (
            <div className="post-media">
              <video
                controls
                src={post.shared_post.media_url}
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
              <audio controls src={post.shared_post.media_url} className="audio-player">
                Your browser does not support the audio tag.
              </audio>
            </div>
          );
        default:
          return null;
      }
    }

    return null;
  };
  // ✅ END NEW

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-header">
        <div>
          <div className="post-avatar">
           <img
                      src={post.user.avatar || "https://placehold.co/80x80  "} 
                      alt={`${post.user.name}'s avatar`}
                      className="user-avatar"
                    />
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
        {/* Current post body (only if exists and is not a share) */}
        {post.body && !post.shared_post_id && <p>{post.body}</p>}
        
        {/* Current post media */}
        {post.media_url && renderMedia()}

        {/* Shared post content (only if this is a shared post) */}
        {post.shared_post && (
          <div className="shared-post-container">
            <div className="shared-post-header" style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={post.shared_post.user?.avatar} 
                  alt={`${post.shared_post.user?.name} avatar`}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
                />
                <strong style={{ fontSize: '16px' }}>{post.shared_post.user?.name}</strong>
              </div>
              <span style={{ color: '#65676B', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                Original Post
              </span>
            </div>
            
            <div className="shared-post-content">
              {post.shared_post.body && <p>{post.shared_post.body}</p>}
              
              {/* Shared post media */}
              {!post.media_url && post.shared_post.media_url && (
                <div className="post-media">
                  {post.shared_post.media_type === 'image' && (
                    <img
                      src={post.shared_post.media_url}
                      alt="Shared post media"
                      className="media-preview"
                    />
                  )}

                  {post.shared_post.media_type === 'video' && (
                    <video
                      controls
                      src={post.shared_post.media_url}
                      className="media-preview"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}

                  {post.shared_post.media_type === 'audio' && (
                    <div className="audio-player">
                      <audio controls src={post.shared_post.media_url}>
                        Your browser does not support the audio tag.
                      </audio>
                    </div>
                  )}
                </div>
              )}
            </div>
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