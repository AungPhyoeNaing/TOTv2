import React, { useState } from "react";
import UserGrid from "./UserGrid.jsx";

export default function ProfileView({ 
  profileUser, 
  profileData, 
  currentUser, 
  loading, 
  onFollow, 
  onUnfollow, 
  onViewProfile 
}) {
  const [activeTab, setActiveTab] = useState('following');

  if (loading) {
    return <p className="loading">Loading profile...</p>;
  }

  if (!profileUser) {
    return <p className="error">User not found</p>;
  }

  const isOwnProfile = profileUser.id === currentUser.id;
  const isFollowing = profileUser.is_following || false;

  const handleFollowAction = () => {
    isFollowing ? onUnfollow(profileUser.id) : onFollow(profileUser.id);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <img 
            src="https://placehold.co/120" 
            alt={profileUser.name} 
          />
        </div>
        <div className="profile-info">
          <h1>{profileUser.name || 'Unknown User'}</h1>
          <p>@{profileUser.email || 'No email'}</p>
          
          <div className="profile-stats">
            <span><strong>{profileData.following.length}</strong> Following</span>
            <span><strong>{profileData.followers.length}</strong> Followers</span>
          </div>

          {!isOwnProfile && (
            <button 
              className={`follow-button ${isFollowing ? 'following' : ''}`}
              onClick={handleFollowAction}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          className={activeTab === 'following' ? 'active' : ''}
          onClick={() => setActiveTab('following')}
        >
          Following ({profileData.following.length})
        </button>
        <button 
          className={activeTab === 'followers' ? 'active' : ''}
          onClick={() => setActiveTab('followers')}
        >
          Followers ({profileData.followers.length})
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'following' && (
          <UserGrid 
            users={profileData.following} 
            currentUser={currentUser}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            onViewProfile={onViewProfile}
            showFollowButton={true}
          />
        )}
        {activeTab === 'followers' && (
          <UserGrid 
            users={profileData.followers} 
            currentUser={currentUser}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            onViewProfile={onViewProfile}
            showFollowButton={true}
          />
        )}
      </div>
    </div>
  );
}