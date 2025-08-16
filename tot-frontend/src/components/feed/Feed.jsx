import React from "react";
import CreatePostForm from "./CreatePostForm.jsx";

export default function Feed({ user, posts, onCreatePost }) {
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
          posts.map((post) => (
            <article key={post.id} className="post-card">
              <header>
                <strong>{post.user.name}</strong> 
                <small>({post.user.email})</small>
              </header>
              <p>{post.body}</p>
              <footer>
                <small>
                  Posted: {new Date(post.created_at).toLocaleString()}
                </small>
              </footer>
            </article>
          ))
        ) : (
          <p>No posts yet. Be the first!</p>
        )}
      </div>
    </section>
  );
}