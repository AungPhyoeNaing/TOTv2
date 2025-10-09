// src/api/postService.js
import apiClient from './apiClient';

// --- Reactions ---
export const toggleReaction = (postId, reactionType) => {
  return apiClient.post(`/posts/${postId}/reactions/toggle`, { type: reactionType });
};

// --- Comments ---
export const addComment = (postId, commentBody) => {
  return apiClient.post(`/posts/${postId}/comments`, { body: commentBody });
};

export const getComments = (postId) => {
  return apiClient.get(`/posts/${postId}/comments`);
};

// Optional: Implement update and delete for comments if needed later
// export const updateComment = (commentId, commentBody) => {
//   return apiClient.put(`/comments/${commentId}`, { body: commentBody });
// };
// export const deleteComment = (commentId) => {
//   return apiClient.delete(`/comments/${commentId}`);
// };

// --- Share ---
export const sharePost = (postId) => {
  return apiClient.post(`/posts/${postId}/share`);
};



// --- Delete ---
// Note: Delete is often handled by passing the function down from App,
// but you can also define it here and call it directly in Post.jsx if preferred.
export const deletePost = (postId) => {
  return apiClient.delete(`/posts/${postId}`);
};


export const getMyReaction = (postId) => {
  return apiClient.get(`/posts/${postId}/my-reaction`);
};