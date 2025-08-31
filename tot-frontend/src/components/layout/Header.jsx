// src/components/layout/Header.jsx
import React from "react";

export default function Header({ 
  user, 
  currentView, // Receive currentView prop
  onGoToFeed, 
  onGoToMyProfile, 
  onGoToChat, // Receive the function
  onLogout 
}) {
  // If no user is logged in, don't render the header content
  if (!user) return null;

  return (
    <header>
      <nav className="navbar">
        <ul>
          <li><strong>TOT</strong></li>
        </ul>
        <ul>
          {/* Conditional rendering based on currentView */}
          {currentView === 'profile' ? (
            // Show 'Back to Feed' when on Profile
            <li>
              <button 
                className="secondary outline" 
                onClick={onGoToFeed}
              >
                Back to Feed
              </button>
            </li>
          ) : currentView === 'chat' ? (
            // Show 'Back to Feed' when on Chat
            <li>
              <button 
                className="secondary outline" 
                onClick={onGoToFeed}
              >
                Back to Feed
              </button>
            </li>
           ) : (
            // Show 'My Profile' and 'Messages' when on Feed (default/main view)
            <>
              <li>
                <button 
                  className="secondary outline" 
                  onClick={onGoToMyProfile}
                >
                  My Profile
                </button>
              </li>
              <li>
                <button 
                  className="secondary outline" 
                  onClick={onGoToChat}
                >
                  Messages
                </button>
              </li>
            </>
          )}
          {/* Always show Logout */}
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