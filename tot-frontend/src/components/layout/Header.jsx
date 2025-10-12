// src/components/layout/Header.jsx (Updated)
import React from "react";

// Define the mapping between views and their header buttons
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
  currentView,
  onGoToFeed,
  onGoToMyProfile,
  onGoToEditProfile,
  onGoToChat,
  onLogout,
  categories,
  selectedCats,
  toggleCat,
  showPills,
  setShowPills
}) {
  // If no user is logged in, don't render the header content
  if (!user) return null;

  // Get the button configuration for the current view
  const buttons = viewButtonMap[currentView] || viewButtonMap.feed;

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
          {/* Category filter button - only show on feed view */}
          {currentView === 'feed' && categories && categories.length > 0 && (
            <li>
              <button
                className="secondary outline cat-glass-trigger"
                onMouseEnter={() => setShowPills(true)}
                onClick={() => setShowPills((v) => !v)}
              >
                Categories
              </button>
              
              {/* Category pills dropdown */}
              <div className="glass-pills-list">
                {categories.map((c, i) => (
                  <label
                    key={c.id}
                    className={`glass-pill ${showPills ? "pop" : ""}`}
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCats.includes(c.id)}
                      onChange={() => toggleCat(c.id)}
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </li>
          )}
          
          {buttons.map((buttonDef, index) => (
            <li key={index}>
              <button
                className="secondary outline"
                onClick={handlerMap[buttonDef.handlerName]}
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