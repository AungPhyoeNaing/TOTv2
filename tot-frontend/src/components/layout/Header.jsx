import React from "react";
import newsIcon from "../../assets/icons/news.png";
import memesIcon from "../../assets/icons/memes.png";
import entertainmentIcon from "../../assets/icons/entertainment.png";
import studyIcon from "../../assets/icons/study.png";
import announcementsIcon from "../../assets/icons/announcements.png";
import "./Header.css"; 

const categoryIconMap = {
  'News': newsIcon,
  'Memes': memesIcon,
  'Entertainment': entertainmentIcon,
  'Study': studyIcon,
  'Announcement': announcementsIcon,
};

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
  if (!user) return null;

  const buttons = viewButtonMap[currentView] || viewButtonMap.feed;

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
          {currentView === 'feed' && categories && categories.length > 0 && (
            <li>
              <button
                className="secondary outline cat-glass-trigger"
                onMouseEnter={() => setShowPills(true)}
                onClick={() => setShowPills((v) => !v)}
              >
                Categories
              </button>
              
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
                      className="glass-pill-checkbox"
                    />
                    <span className="icon-span">
                      <img 
                        src={categoryIconMap[c.name]} 
                        alt={`${c.name} icon`} 
                        className="category-icon" 
                      />
                    </span>
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