import React, { useState, useRef, useEffect } from "react";
import apiClient from "../../api/apiClient";
import "./CreatePostForm.css"; // ✅ We'll create this

export default function CreatePostForm({ onCreatePost }) {
  const [body, setBody] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false); // ✅ New: prevent double post
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const readerRef = useRef(null); // ✅ To abort FileReader if needed

  // ✅ Cleanup FileReader on unmount
  useEffect(() => {
    return () => {
      if (readerRef.current) {
        readerRef.current.abort();
      }
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    // Validate file size
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large (max 20MB)");
      return;
    }

    setSelectedFile(file);

    // Generate preview for images/videos
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      readerRef.current = new FileReader();
      readerRef.current.onloadend = () => {
        setPreview(readerRef.current.result);
        readerRef.current = null; // cleanup ref
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
      const response = await apiClient.post("/media/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { url, type } = response.data.data;
      setMediaUrl(url);
      setMediaType(type);
      setSelectedFile(null);
      setPreview(null);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const postData = {
      body: body.trim() || null,
      media_url: mediaUrl || null,
      media_type: mediaType || null,
    };

    console.log("Submitting post data:", postData);

    if (!postData.body && !postData.media_url) {
      setError("Please add text or upload media.");
      return;
    }

    setPosting(true); // ✅ Disable button during API call
    setError(null); // ✅ Clear previous errors

    try {
      await onCreatePost(postData);
      // ✅ Reset everything on success
      setBody("");
      setMediaUrl(null);
      setMediaType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // ✅ Clear file input
      }
    } catch (err) {
      console.error("Post creation error:", err);
      setError("Failed to create post. Please try again.");
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

  const handleButtonClick = () => {
    fileInputRef.current?.click(); // ✅ Trigger file input programmatically
  };

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

        {/* File Upload UI */}
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
            style={{ display: "none" }} // ✅ Hide native input, use button instead
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

        {/* Preview or Uploaded Media */}
        {(preview || mediaUrl) && (
          <div className="media-preview-container">
            {preview && !mediaUrl && (
              <>
                {selectedFile?.type.startsWith("image/") && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="media-preview"
                  />
                )}
                {selectedFile?.type.startsWith("video/") && (
                  <video
                    controls
                    src={preview}
                    className="media-preview"
                    aria-label="Video preview"
                  />
                )}
              </>
            )}

            {mediaUrl && (
              <>
                {mediaType === "image" && (
                  <img
                    src={mediaUrl}
                    alt="Uploaded media"
                    className="media-preview"
                  />
                )}
                {mediaType === "video" && (
                  <video
                    controls
                    src={mediaUrl}
                    className="media-preview"
                    aria-label="Uploaded video"
                  />
                )}
                {mediaType === "audio" && (
                  <audio
                    controls
                    src={mediaUrl}
                    className="audio-player"
                    aria-label="Uploaded audio"
                  />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="remove-media-btn"
                  aria-label="Remove media"
                >
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