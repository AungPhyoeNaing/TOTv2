import React, { useState, useRef, useEffect } from "react";
import apiClient from "../../api/apiClient";
import "./CreatePostForm.css";

export default function CreatePostForm({ onCreatePost, categories }) {
  const [body, setBody] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [error, setError] = useState(null);
  const [categoryId, setCategoryId] = useState("");

  const fileInputRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (readerRef.current) readerRef.current.abort();
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large (max 20MB)");
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      readerRef.current = new FileReader();
      readerRef.current.onloadend = () => {
        setPreview(readerRef.current.result);
        readerRef.current = null;
      };
      readerRef.current.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const { data } = await apiClient.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMediaUrl(data.data.url);
      setMediaType(data.data.type);
      setSelectedFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) {
      setError("Please choose a category.");
      return;
    }
    const postData = {
      body: body.trim() || null,
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      category_id: Number(categoryId),
    };
    if (!postData.body && !postData.media_url) {
      setError("Please add text or media.");
      return;
    }
    setPosting(true);
    setError(null);
    try {
      await onCreatePost(postData);
      setBody("");
      setMediaUrl(null);
      setMediaType(null);
      setCategoryId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError("Failed to create post.");
    } finally {
      setPosting(false);
    }
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  const handleButtonClick = () => fileInputRef.current?.click();

  return (
    <article className="create-post-form">
      <form onSubmit={handleSubmit} aria-label="Create new post">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's on your mind?"
          rows="3"
          maxLength="1000"
          className="post-textarea"
          aria-label="Post content"
        />

        {/* ---- CATEGORY PICKER ---- */}
        <div className="category-picker">
          <label htmlFor="cat">Category *</label>
          <select
            id="cat"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="" disabled>Select category…</option>
            {categories?.length > 0 && categories.map((c) => (
  <option key={c.id} value={c.id}>
    {c.name}
  </option>
))}
          </select>
        </div>

        <div className="file-upload-section">
          <button
            type="button"
            onClick={handleButtonClick}
            className="choose-file-btn"
            disabled={uploading || posting}
            aria-label="Choose media file to upload"
          >
            📷 Choose Media
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*,audio/*,video/*"
            disabled={uploading || posting}
            style={{ display: "none" }}
            aria-hidden="true"
          />
          {selectedFile && !mediaUrl && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || posting}
              className={`upload-btn ${uploading ? "loading" : ""}`}
              aria-label="Upload selected media"
            >
              {uploading ? "⏳ Uploading..." : "⬆️ Upload Media"}
            </button>
          )}
          {error && <p className="error-message">{error}</p>}
        </div>

        {(preview || mediaUrl) && (
          <div className="media-preview-container">
            {preview && !mediaUrl && (
              <>
                {selectedFile?.type.startsWith("image/") && (
                  <img src={preview} alt="Preview" className="media-preview" />
                )}
                {selectedFile?.type.startsWith("video/") && (
                  <video controls src={preview} className="media-preview" aria-label="Video preview" />
                )}
              </>
            )}
            {mediaUrl && (
              <>
                {mediaType === "image" && <img src={mediaUrl} alt="Uploaded media" className="media-preview" />}
                {mediaType === "video" && (
                  <video controls src={mediaUrl} className="media-preview" aria-label="Uploaded video" />
                )}
                {mediaType === "audio" && (
                  <audio controls src={mediaUrl} className="audio-player" aria-label="Uploaded audio" />
                )}
                <button type="button" onClick={removeMedia} className="remove-media-btn" aria-label="Remove media">
                  ×
                </button>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || posting}
          className={`post-btn ${posting ? "loading" : ""}`}
          aria-label="Publish post"
        >
          {posting ? "🚀 Posting..." : "🚀 Post"}
        </button>
      </form>
    </article>
  );
}