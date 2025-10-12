import React from 'react';
import './AvatarWithDot.css';

export default function AvatarWithDot({ user, onlineIds = new Set(), size = 40 }) {
  const isOnline = onlineIds.has(user.id);
  return (
    <div className="avatar-dot-wrapper" style={{ width: size, height: size }}>
      <img
        src={user.avatar || user.profile_picture || `https://placehold.co/${size}`}
        alt={user.name}
        className="avatar-img"
        style={{ width: size, height: size }}
      />
      <span className={`status-dot ${isOnline ? 'on' : ''}`} />
    </div>
  );
}