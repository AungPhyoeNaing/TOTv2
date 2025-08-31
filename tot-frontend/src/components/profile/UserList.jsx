import React from "react";

export default function UserList({ 
  users, 
  currentUser, 
  onFollow, 
  onUnfollow, 
  onViewProfile,
  onChat // <-- 1. Accept the onChat prop
}) {
  const validUsers = Array.isArray(users) ? users : [];
    
  if (validUsers.length === 0) {
    return <p className="no-users">No other users found.</p>;
  }

  return (
    <section className="user-list">
      <h4>Users</h4>
      <ul>
        {validUsers
          .filter(user => user.id !== currentUser.id)
          .map((user) => (
            <li key={user.id} className="user-item">
              <div className="user-info">
                <strong>{user.name}</strong> ({user.email})
                <button 
                  className="secondary view-profile-btn"
                  onClick={() => onViewProfile(user.id)}
                >
                  View Profile
                </button>
                 {/* 2. Add the Message button */}
                <button 
                  className="secondary message-btn" // You can add specific CSS classes if needed
                  onClick={() => onChat(user)} // <-- Call onChat with the user object
                >
                  Message
                </button>
              </div>
                
              {user.is_following !== undefined && (
                user.is_following ? (
                  <button 
                    className="secondary unfollow-btn"
                    onClick={() => onUnfollow(user.id)}
                  >
                    Unfollow
                  </button>
                ) : (
                  <button 
                    className="follow-btn"
                    onClick={() => onFollow(user.id)}
                  >
                    Follow
                  </button>
                )
              )}
            </li>
          ))}
      </ul>
    </section>
  );
}