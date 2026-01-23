// src/components/auth/ReportUser.jsx
import React, { useState } from "react";
import { reportUser } from "../../api/authService"; // You'll need to add this API call

export default function ReportUser({ onBackToHome, reportedUserName, reportedUserId }) { // Accept both name and ID
  const [formData, setFormData] = useState({
    reported_user_id: reportedUserId || "", // Store the ID for submission
    reported_user_name: reportedUserName || "", // Store the name for display (optional, but can be sent if backend expects it)
    reason: "",
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
      // Call the new API endpoint, sending the ID (and potentially the name if backend expects it)
      await reportUser(formData);
      setSuccessMessage("Your report has been submitted successfully. An admin will review it soon.");
      // Optionally reset the form
      setFormData({
        reported_user_id: reportedUserId || "", // Keep pre-filled ID if applicable
        reported_user_name: reportedUserName || "", // Keep pre-filled name if applicable
        reason: "",
      });
    } catch (err) {
      console.error("Error submitting report:", err);
      const errorMsg = err.response?.data?.message
        ? err.response.data.message
        : "An error occurred while submitting your report. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <h2>Report User</h2>
      <p>Please provide details about the user you are reporting.</p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="hidden" // Hide the ID field, it's for submission only
          name="reported_user_id"
          value={formData.reported_user_id}
          onChange={handleChange} // Still handle change for state consistency if needed, though hidden
        />
        {/* Display the Name as a disabled input or text */}
        <input
          type="text"
          name="reported_user_name" // This field is just for display, can be disabled
          placeholder="User Name to Report"
          value={formData.reported_user_name} // Show the name
          onChange={handleChange} // Handle change for state consistency if needed, though disabled
          disabled // Make it read-only so user sees the name but can't edit it
          required // Keep required if backend validation requires it, otherwise remove
        />
        {/* Alternative: Show name as plain text instead of input */}
        {/* <p><strong>Reporting User:</strong> {formData.reported_user_name}</p> */}
        <textarea
          name="reason"
          placeholder="Reason for reporting this user (e.g., inappropriate content, harassment)"
          rows="6"
          value={formData.reason}
          onChange={handleChange}
          required
        ></textarea>
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>

      <p className="switch-link">
        <button type="button" onClick={onBackToHome}>
          Back to Home
        </button>
      </p>
    </section>
  );
}