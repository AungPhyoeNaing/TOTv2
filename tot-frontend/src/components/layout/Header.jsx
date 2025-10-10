// src/components/layout/Header.jsx (Refined)
import React from "react";

// Define the mapping between views and their header buttons
// Each button definition includes the text and the *name* of the handler prop
const viewButtonMap = {
  feed: [
    { text: 'My Profile', handlerName: 'onGoToMyProfile' },
    { text: 'Messages', handlerName: 'onGoToChat' }
  ],
  profile: [
    { text: 'Edit Profile', handlerName: 'onGoToEditProfile' },
    { text: 'Back to Feed', handlerName: 'onGoToFeed' }
  ],
  editProfile: [
    { text: 'Back to Feed', handlerName: 'onGoToFeed' }
  ],
  chat: [
    { text: 'Back to Feed', handlerName: 'onGoToFeed' }
  ]
};

export default function Header({
  user,
  currentView, // Receive currentView prop
  onGoToFeed,
  onGoToMyProfile,
  onGoToEditProfile, // Receive the new function
  onGoToChat, // Receive the function
  onLogout
}) {
  // If no user is logged in, don't render the header content
  if (!user) return null;

  // Get the button configuration for the current view
  const buttons = viewButtonMap[currentView] || viewButtonMap.feed; // Fallback to feed buttons

  // Create a mapping object for handler functions to make dynamic access easier
  const handlerMap = {
    onGoToFeed,
    onGoToMyProfile,
    onGoToEditProfile,
    onGoToChat
  };

  return (
    <header>
      <nav className="navbar">
        <ul>
          <li><strong>TOT</strong></li>
        </ul>
        <ul>
          {buttons.map((buttonDef, index) => (
            <li key={index}>
              <button
                className="secondary outline"
                onClick={handlerMap[buttonDef.handlerName]} // Dynamically access the handler function
              >
                {buttonDef.text}
              </button>
            </li>
          ))}
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