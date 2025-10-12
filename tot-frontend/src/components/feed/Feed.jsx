// src/components/Feed.jsx (Updated - no more category filtering UI)
import React, { useState, useEffect } from "react";
import CreatePostForm from "./CreatePostForm.jsx";
import Post from "./Post.jsx";
import "./Feed.css";

const Feed = ({
  user,
  posts,
  onCreatePost,
  onDeletePost,
  socket,
  onViewProfile,
  categories,
  selectedCats // Receive filtered posts from parent
}) => {
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (selectedPost) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedPost]);

  // Filter posts based on selected categories passed from parent
  const filtered =
    selectedCats.length === 0
      ? posts
      : posts.filter((p) => selectedCats.includes(p.category_id));

  const handleViewOriginalPost = (postId) => {
    const originalPost = posts.find((p) => p.id === postId);
    if (originalPost) {
      setSelectedPost(originalPost);
    } else {
      setSelectedPost({ id: postId, loading: true });
    }
  };

  const handleBackToFeed = () => setSelectedPost(null);

  if (selectedPost) {
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

  return (
    <section className="feed">
      <header>
        <h3>Hello, {user?.name}!</h3>
      </header>
      <CreatePostForm onCreatePost={onCreatePost} categories={categories} />
      <hr />
      <h4>Feed</h4>

      {/* Removed the category filter UI - now in Header */}
      <div className="posts-grid">
        {filtered.length ? (
          filtered.map((post) => (
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
          <p>No posts match the selected categories.</p>
        )}
      </div>
    </section>
  );
};

export default Feed;