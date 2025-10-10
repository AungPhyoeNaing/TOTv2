// src/api/authService.js
import apiClient from "./apiClient";
import axios from "axios"; // Keep axios for CSRF if needed

const BASE_URL = "http://127.0.0.1:8000";

export const getCsrfToken = () => 
  axios.get(`${BASE_URL}/sanctum/csrf-cookie`, { withCredentials: true });

export const login = (email, password) => 
  apiClient.post("/login", { email, password });

export const register = (name, email, recovery_email, password, passwordConfirmation) => 
  apiClient.post("/register", { 
    name, 
    email, 
    recovery_email, 
    password, 
    password_confirmation: passwordConfirmation 
  });

// Remove /api prefix from the endpoint path
export const requestPasswordReset = async (data) => {
  const response = await apiClient.post("/submit-password-reset-request", data); // Removed /api/
  return response;
};

// Remove /api prefix from the endpoint path
export const reportUser = async (data) => {
  const response = await apiClient.post("/submit-user-report", data); // Removed /api/
  return response;
};

export const logout = () => 
  apiClient.post("/logout");

// --- NEW FUNCTION: Update user profile ---
export const updateProfile = async (profileData) => {
  const formData = new FormData();
  // Only append username if it's defined and different from the current name (handled in component)
  if (profileData.username !== undefined) {
      formData.append('name', profileData.username);
  }
  // Only append profilePicture if it's a File object (handled in component)
  if (profileData.profilePicture instanceof File) {
      formData.append('profile_picture', profileData.profilePicture);
  }

  // apiClient should handle the base URL and authentication token
  const response = await apiClient.post('/user/update', formData, {
      headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
      },
  });

  return response; // Return the full response object
};
// --- END NEW FUNCTION ---