// src/components/profile/UserList.jsx
import React from "react";
// Remove the useSocket import since we're passing data directly
// import { useSocket } from '../../SocketContext'; // Adjust path as necessary
import './UserList.css'; // Create this CSS file for styling

export default function UserList({ 
  users, 
  currentUser, 
  onFollow, 
  onUnfollow, 
  onViewProfile,
  onChat,
  onReportUser,
  // --- RECEIVE THE NEW PROP ---
  onlineUsers
  // --- END RECEIVE ---
}) {
  // --- CHECK IF USER IS ONLINE ---
  const isUserOnline = (userId) => {
    return onlineUsers?.has(userId); // Use optional chaining if onlineUsers might be null initially
  };
  // --- END CHECK ---

  const validUsers = Array.isArray(users) ? users : [];
    
  if (validUsers.length === 0) {
    return <p className="no-users">No other users found.</p>;
  }

  return (
    <section className="user-list">
      <h4>Users</h4>
      <ul className="users-grid">
        {validUsers
          .filter(user => user.id !== currentUser.id)
          .map((user) => {
            // Determine online status using the helper function and the passed state
            const online = isUserOnline(user.id);
            return (
              <li key={user.id} className="user-card">
                <button 
                  className="profile-link"
                  onClick={() => onViewProfile(user.id)}
                  aria-label={`View profile of ${user.name}`}
                >
                  <div className="user-avatar-container">
                    <img
                      src={user.avatar || "https://placehold.co/80x80  "} 
                      alt={`${user.name}'s avatar`}
                      className="user-avatar"
                    />
                    {/* Apply the dynamically determined online status */}
                    <div className={`online-status ${online ? 'online' : 'offline'}`}>
                      <span className="status-indicator"></span>
                      <span className="status-text">{online ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                  
                  <div className="user-details">
                    <h3 className="username">{user.name}</h3>
                    <p className="email">@{user.email}</p>
                  </div>
                </button>
              </li>
            );
          })}
      </ul>
    </section>
  );
}