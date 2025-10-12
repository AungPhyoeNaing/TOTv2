// src/components/auth/PasswordResetRequest.jsx
import React, { useState } from "react";
import { requestPasswordReset } from "../../api/authService"; // You'll need to add this API call

export default function PasswordResetRequest({ onBackToLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    recovery_email: "",
    account_creation_date: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Log the data being sent
      console.log("Submitting password reset request with data:", formData);
      
      // Call the new API endpoint
      const response = await requestPasswordReset(formData);
      console.log("Password reset request submitted successfully:", response); // Log successful response
      
      setSuccessMessage("Your password reset request has been submitted successfully. An admin will process it soon.");
      // Optionally reset the form
      setFormData({
        email: "",
        recovery_email: "",
        account_creation_date: "",
        message: "",
      });
    } catch (err) {
      // Detailed error logging
      console.error("Error submitting password reset request:", err);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response Error:", {
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          data: err.response.data,
        });
        
        // Try to get the error message from the response body
        const errorMsg = err.response.data?.message 
                         ? err.response.data.message 
                         : `Server Error: ${err.response.status} - ${err.response.statusText}`;
        setError(errorMsg);
        
      } else if (err.request) {
        // The request was made but no response was received
        console.error("Request Error (No Response):", err.request);
        setError("Network error. Please check your connection and try again.");
        
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("General Error:", err.message);
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <h2>Password Reset Request</h2>
      <p>Please provide your details to request a password reset.</p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        {/* Email Input */}
        <div className="input-group"> {/* Optional: Wrap for styling */}
          <label htmlFor="email" className="sr-only"> @tot.com Email Address </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="@tot.com Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            pattern=".*@tot\.com$" // Basic pattern to enforce @tot.com domain
            title="Please enter a valid @tot.com email address"
          />
        </div>

        {/* Recovery Email Input */}
        <div className="input-group">
          <label htmlFor="recovery_email" className="sr-only"> Recovery Email </label>
          <input
            id="recovery_email"
            type="email"
            name="recovery_email"
            placeholder="Recovery Email (e.g., yourname@gmail.com)"
            value={formData.recovery_email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Account Creation Date Input */}
        <div className="input-group">
          <label htmlFor="account_creation_date" className="sr-only"> Account Creation Date </label>
          <input
            id="account_creation_date"
            type="text"
            name="account_creation_date"
            placeholder="Approximate Account Creation Date (e.g., Jan 2024)"
            value={formData.account_creation_date}
            onChange={handleChange}
          />
        </div>

        {/* Message Textarea */}
        <div className="input-group">
          <label htmlFor="message" className="sr-only"> Additional Details </label>
          <textarea
            id="message"
            name="message"
            placeholder="Additional details or reason for reset (optional)"
            rows="4"
            value={formData.message}
            onChange={handleChange}
          ></textarea>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>

      <p className="switch-link">
        <button type="button" onClick={onBackToLogin}>
          Back to Login
        </button>
      </p>
    </section>
  );
}