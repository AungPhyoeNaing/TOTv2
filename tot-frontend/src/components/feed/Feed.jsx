// src/components/feed/Feed.jsx
import React from "react";
import CreatePostForm from "./CreatePostForm.jsx";
// --- Import the new Post component ---
import Post from "./Post.jsx";
// --- End import ---
import "./Feed.css"; // Optional CSS

const Feed = ({ user, posts, onCreatePost, onDeletePost }) => { // Accept onDeletePost prop
  return (
    <section className="feed">
      <header>
        <h3>Hello, {user.name}!</h3>
      </header>
      <CreatePostForm onCreatePost={onCreatePost} />
      <hr />
      <h4>Feed</h4>

      <div className="posts-grid">
        {posts.length > 0 ? (
          // --- Render Post components instead of inline JSX ---
          posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              currentUser={user} // Pass current user for auth checks (e.g., delete)
              onDeletePost={onDeletePost} // Pass the delete handler function
            />
          ))
          // --- End rendering Post components ---
        ) : (
          <p>No posts yet. Be the first!</p>
        )}
      </div>
    </section>
  );
};

export default Feed;