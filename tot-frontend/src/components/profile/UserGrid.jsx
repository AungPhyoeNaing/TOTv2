import React from "react";

export default function UserGrid({ 
  users, 
  currentUser, 
  onFollow, 
  onUnfollow, 
  onViewProfile, 
  showFollowButton = true 
}) {
  const validUsers = Array.isArray(users) ? users : [];
  
  return (
    <div className="user-grid">
      {validUsers.length === 0 ? (
        <p className="no-users">No users found</p>
      ) : (
        validUsers.map(user => (
          <div key={user.id} className="user-card">
            <div 
              className="user-avatar" 
              onClick={() => onViewProfile(user.id)}
            >
              <img 
                src="https://placehold.co/50" 
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
                className={`follow-button small ${user.is_following ? 'following' : ''}`}
                onClick={() => 
                  user.is_following 
                    ? onUnfollow(user.id) 
                    : onFollow(user.id)
                }
              >
                {user.is_following ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}