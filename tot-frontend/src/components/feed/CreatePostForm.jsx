import React, { useState } from "react";

export default function CreatePostForm({ onCreatePost }) {
  const [body, setBody] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (body.trim()) {
      onCreatePost(body);
      setBody("");
    }
  };

  return (
    <article className="create-post-form">
      <form onSubmit={handleSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's on your mind?"
          required
          rows="3"
        ></textarea>
        <button type="submit">Post</button>
      </form>
    </article>
  );
}