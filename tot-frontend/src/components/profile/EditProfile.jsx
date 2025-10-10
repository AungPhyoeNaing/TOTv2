// src/components/EditProfile.jsx
import React, { useState } from 'react';
import './EditProfile.css'; // Optional: Import CSS for styling

const EditProfile = ({ user, onUpdateProfile, onGoToMyProfile }) => { // Receive user data and update function
  const [formData, setFormData] = useState({
    username: user.name || '', // Use 'name' from user object
    profilePicture: null, // For the new image file
  });
  const [previewUrl, setPreviewUrl] = useState(user.profilePicture || ''); // For image preview
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic validation (optional)
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // Example: 2MB limit
         setError('Image size should be less than 2MB.');
         return;
      }
      setError(''); // Clear any previous error

      setFormData((prevData) => ({
        ...prevData,
        profilePicture: file,
      }));

      // Create a preview URL for the selected file
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Clean up the URL object when component unmounts or a new image is selected
      return () => URL.revokeObjectURL(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare data to send
      // If no new image is selected, send the existing URL or null
      // If a new image is selected, you might need to handle file upload separately
      // This example assumes the parent handles the file upload logic if needed
      // and passes back the updated URL or handles the update internally.
      // Here, we'll just pass the formData which includes the file object if changed.
      await onUpdateProfile({ ...formData }); // Pass the new data to the parent

      // Optionally, show a success message or redirect back to profile
      onGoToMyProfile(); // Navigate back to the profile view after saving
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="edit-profile-container">
      <h2>Edit Profile</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            // Removed 'required' attribute to make it optional
          />
        </div>
        <div className="form-group">
          <label htmlFor="profilePicture">Profile Picture:</label>
          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="Profile Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
          )}
          <input
            type="file"
            id="profilePicture"
            name="profilePicture"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>
        <div className="form-actions">
          <button type="button" onClick={onGoToMyProfile} className="secondary outline">
            Cancel
          </button>
          <button type="submit" className="primary">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;