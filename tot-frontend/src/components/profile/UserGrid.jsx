import React, { useState, useEffect } from "react";

export default function UserGrid({ 
  users, 
  currentUser, 
  onFollow, 
  onUnfollow, 
  onViewProfile, 
  showFollowButton = true 
}) {
  const validUsers = Array.isArray(users) ? users : [];
  
  // Local state to track follow status
  const [followStates, setFollowStates] = useState({});

  // Initialize follow states from users data
  useEffect(() => {
    const initialStates = {};
    validUsers.forEach(user => {
      initialStates[user.id] = user.is_following || false;
    });
    setFollowStates(initialStates);
  }, [users]); // Re-run when users array changes

  const handleFollowToggle = async (userId, currentlyFollowing) => {
    try {
      // Optimistically update UI
      setFollowStates(prev => ({
        ...prev,
        [userId]: !currentlyFollowing
      }));

      // Call the appropriate action
      if (currentlyFollowing) {
        await onUnfollow(userId);
      } else {
        await onFollow(userId);
      }
    } catch (error) {
      // Rollback on error
      setFollowStates(prev => ({
        ...prev,
        [userId]: currentlyFollowing
      }));
      console.error('Follow action failed:', error);
    }
  };

  return (
    <div className="user-grid">
      {validUsers.length === 0 ? (
        <p className="no-users">No users found</p>
      ) : (
        validUsers.map(user => {
          // Check if we have local state for this user, otherwise use prop value
          const isFollowing = followStates.hasOwnProperty(user.id) 
            ? followStates[user.id] 
            : (user.is_following || false);
          
          return (
            <div key={user.id} className="user-card">
              <div 
                className="user-avatar" 
                onClick={() => onViewProfile(user.id)}
              >
                <img 
                  src={user.avatar || "https://placehold.co/50"} 
                  alt={user.name} 
                />
              </div>
              <div className="user-details">
                <h3 onClick={() => onViewProfile(user.id)}>
                  {user.name || 'Unknown User'}
                </h3>
                <p>@{user.email || 'No email'}</p>
              </div>
              
              {showFollowButton && user.id !== currentUser.id && (
                <button 
                  className={`follow-button small ${isFollowing ? 'following' : ''}`}
                  onClick={() => handleFollowToggle(user.id, isFollowing)}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}