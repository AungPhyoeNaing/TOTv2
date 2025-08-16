import React from "react";

export default function Header({ 
  user, 
  currentView, 
  onGoToFeed, 
  onGoToMyProfile, 
  onLogout 
}) {
  if (!user) return null;

  return (
    <header>
      <nav className="navbar">
        <ul>
          <li><strong>TOT</strong></li>
        </ul>
        <ul>
          {currentView === 'profile' ? (
            <li>
              <button 
                className="secondary outline" 
                onClick={onGoToFeed}
              >
                Back to Feed
              </button>
            </li>
          ) : (
            <li>
              <button 
                className="secondary outline" 
                onClick={onGoToMyProfile}
              >
                My Profile
              </button>
            </li>
          )}
          <li>
            <button 
              className="secondary outline logout-button" 
              onClick={onLogout}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}