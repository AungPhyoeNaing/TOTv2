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
      // Call the new API endpoint
      await requestPasswordReset(formData);
      setSuccessMessage("Your password reset request has been submitted successfully. An admin will process it soon.");
      // Optionally reset the form
      setFormData({
        email: "",
        recovery_email: "",
        account_creation_date: "",
        message: "",
      });
    } catch (err) {
      console.error("Error submitting request:", err);
      const errorMsg = err.response?.data?.message
        ? err.response.data.message
        : "An error occurred while submitting your request. Please try again.";
      setError(errorMsg);
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
        <input
          type="email"
          name="email"
          placeholder="@tot.com Email Address"
          value={formData.email}
          onChange={handleChange}
          required
          pattern=".*@tot\.com$" // Basic pattern to enforce @tot.com domain
          title="Please enter a valid @tot.com email address"
        />
        <input
          type="email"
          name="recovery_email"
          placeholder="Recovery Email (e.g., yourname@gmail.com)"
          value={formData.recovery_email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="account_creation_date"
          placeholder="Approximate Account Creation Date (e.g., Jan 2024)"
          value={formData.account_creation_date}
          onChange={handleChange}
        />
        <textarea
          name="message"
          placeholder="Additional details or reason for reset (optional)"
          rows="4"
          value={formData.message}
          onChange={handleChange}
        ></textarea>
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