// src/components/profile/ProfileView.jsx
import React, { useState } from "react";
import UserGrid from "./UserGrid.jsx";
import PostCardStatic from "../feed/PostCardStatic.jsx";
import './ProfileView.css';

export default function ProfileView({
  profileUser,
  profileData,
  currentUser,
  loading,
  onFollow,
  onUnfollow,
  onViewProfile,
  onChat // <-- Accept the onChat prop for initiating chats
}) {
  const [activeTab, setActiveTab] = useState('following');

  if (loading) {
    return <p className="loading">Loading profile...</p>;
  }

  if (!profileUser) {
    return <p className="error">User not found</p>;
  }

  // Determine if the profile being viewed is the current user's own profile
  const isOwnProfile = profileUser.id === currentUser.id;

  // Determine if the current user is following the profile user
  // Use optional chaining and nullish coalescing for safety
  const isFollowing = profileUser.is_following ?? false;

  // Handler for follow/unfollow button click
  const handleFollowAction = () => {
    if (isFollowing) {
      onUnfollow(profileUser.id);
    } else {
      onFollow(profileUser.id);
    }
  };

  return (
    <div className="profile-container">
      {/* Profile Header Section */}
      <div className="profile-header">
        {/* Profile Avatar/Image */}
        <div className="profile-avatar">
          <img
            src="https://placehold.co/120" // Placeholder image, replace with actual user avatar if available
            alt={`${profileUser.name}'s avatar`}
          />
        </div>

        {/* Profile Information */}
        <div className="profile-info">
          {/* User's Name and Handle */}
          <h1>{profileUser.name || 'Unknown User'}</h1>
          <p>@{profileUser.email || 'No email'}</p>

          {/* Followers/Following Stats */}
          <div className="profile-stats">
            <span><strong>{profileData.following?.length ?? 0}</strong> Following</span>
            <span><strong>{profileData.followers?.length ?? 0}</strong> Followers</span>
            <span><strong>{profileData.posts?.length ?? 0}</strong> Posts</span>
          </div>

          {/* Action Buttons (Follow/Unfollow and Message) */}
          {/* Only show action buttons if it's not the user's own profile */}
          {!isOwnProfile && (
            <div className="profile-actions"> {/* Container for buttons */}
              {/* Follow/Unfollow Button */}
              <button
                className={`follow-button ${isFollowing ? 'following' : ''}`}
                onClick={handleFollowAction}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>

              {/* Message Button */}
              {/* Added onClick handler to initiate chat with this user */}
              <button
                className="message-button" // You can style this class in your CSS
                onClick={() => onChat(profileUser)} // Pass the entire profileUser object
              >
                Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="profile-tabs">
        <button
          className={activeTab === 'following' ? 'active' : ''}
          onClick={() => setActiveTab('following')}
        >
          Following ({profileData.following?.length ?? 0})
        </button>
        <button
          className={activeTab === 'followers' ? 'active' : ''}
          onClick={() => setActiveTab('followers')}
        >
          Followers ({profileData.followers?.length ?? 0})
        </button>
        {/* 👇 ADD THIS — Posts Tab Button */}
        <button
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={() => setActiveTab('posts')}
        >
          Posts ({profileData.posts?.length ?? 0})
        </button>
      </div>

      {/* Tab Content Area */}

      <div className="profile-content">
        {/* Display list of users being followed */}
       
        {activeTab === 'following' && (
          <UserGrid
            users={profileData.following ?? []}
            currentUser={currentUser}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            onViewProfile={onViewProfile}
            showFollowButton={true}
          />
        )}

        {/* Display list of followers */}
        {activeTab === 'followers' && (
          <UserGrid
            users={profileData.followers ?? []}
            currentUser={currentUser}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            onViewProfile={onViewProfile}
            showFollowButton={true}
          />
        )}

        {activeTab === 'posts' && (
          <div className="posts-grid">
            {profileData.posts && profileData.posts.length > 0 ? (
              profileData.posts.map(post => (
                <PostCardStatic key={post.id} post={post} />
              ))
            ) : (
              <p className="no-posts">No posts yet.</p>
            )}
          </div>
        )}

        
      </div>
    </div>
  );
}