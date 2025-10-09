// src/components/feed/Feed.jsx
import React, { useState, useEffect } from "react";
import CreatePostForm from "./CreatePostForm.jsx";
import Post from "./Post.jsx";
import "./Feed.css";

// Accept the socket prop
const Feed = ({ user, posts, onCreatePost, onDeletePost, socket, onViewProfile}) => { 
  const [selectedPost, setSelectedPost] = useState(null);

  // Auto-scroll to top when selectedPost changes
  useEffect(() => {
    if (selectedPost) {
      // Scroll to top smoothly
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [selectedPost]);

  const handleViewOriginalPost = (postId) => {
    // First try to find in current posts
    const originalPost = posts.find(p => p.id === postId);
    if (originalPost) {
      setSelectedPost(originalPost);
    } else {
      // If not found, create a placeholder with just the ID
      setSelectedPost({ id: postId, loading: true });
    }
  };

  const handleBackToFeed = () => {
    setSelectedPost(null);
  };

  if (selectedPost) {
    // Show single post view
    return (
      <div className="single-post-view">
        <div className="post-view-header">
          <button onClick={handleBackToFeed} className="back-button">
            ← Back to Feed
          </button>
          <h3>Original Post</h3>
        </div>
        <Post
          post={selectedPost}
          currentUser={user}
          onDeletePost={onDeletePost}
          onViewProfile={onViewProfile}
          onViewOriginalPost={handleViewOriginalPost}
          socket={socket}
        />
      </div>
    );
  }

  // Show regular feed
  return (
    <section className="feed">
      <header>
        <h3>Hello, {user?.name}!</h3>
      </header>
      <CreatePostForm onCreatePost={onCreatePost} />
      <hr />
      <h4>Feed</h4>

      <div className="posts-grid">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              currentUser={user}
              onDeletePost={onDeletePost}
              onViewProfile={onViewProfile}
              onViewOriginalPost={handleViewOriginalPost}
              socket={socket} 
            />
          ))
        ) : (
          <p>No posts yet. Be the first!</p>
        )}
      </div>
    </section>
  );
};

export default Feed;