// src/components/feed/Feed.jsx
import React from "react";
import CreatePostForm from "./CreatePostForm.jsx";
import Post from "./Post.jsx";
import "./Feed.css";

// Accept the socket prop
const Feed = ({ user, posts, onCreatePost, onDeletePost, socket, onViewProfile}) => { // <-- Accept socket prop
  return (
    <section className="feed">
      <header>
        <h3>Hello, {user?.name}!</h3> {/* Optional chaining for safety */}
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
              // Pass the socket instance down to each Post component
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