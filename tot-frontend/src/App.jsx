// src/App.jsx
import React, { useState, useEffect } from "react";
import apiClient from "./api/apiClient";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";
import Feed from "./components/feed/Feed.jsx";
import UserList from "./components/profile/UserList.jsx";
import ProfileView from "./components/profile/ProfileView.jsx";
import { logout } from "./api/authService";
// --- Import the deletePost function ---
import { deletePost } from "./api/postService"; // <-- Added Import
// --- End import ---
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [currentView, setCurrentView] = useState('feed');
  const [profileUser, setProfileUser] = useState(null);
  const [profileData, setProfileData] = useState({
    followers: [],
    following: []
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Auth check on initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      apiClient.get("/user")
        .then(response => setUser(response.data))
        .catch(() => {
          localStorage.removeItem("token");
          setError("Session expired. Please login again.");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [postsRes, usersRes] = await Promise.all([
          apiClient.get("/posts"),
          apiClient.get("/users")
        ]);

        setPosts(postsRes.data);
        setUsersList(Array.isArray(usersRes.data) ? usersRes.data : []);
      } catch (err) {
        setError("Failed to load data. Please refresh.");
        console.error("Data fetch error:", err);
      }
    };

    if (currentView === 'feed') {
      fetchData();
    }
  }, [user, currentView]);

  const handleAuthSuccess = (token, user) => {
    localStorage.setItem("token", token);
    setUser(user);
    setError(null);
    setAuthView('login');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setPosts([]);
      setUsersList([]);
      setCurrentView('feed');
    }
  };

  const handleCreatePost = (body) => {
    apiClient.post("/posts", { body })
      .then(response => {
        setPosts(prev => [response.data, ...prev]);
      })
      .catch(() => setError("Failed to create post"));
  };

  // --- New Function: Handle Post Deletion ---
  const handleDeletePost = async (postId) => {
    // Basic confirmation (you might want a better UI confirmation)
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      // --- Call the API function to delete the post on the backend ---
      await deletePost(postId);
      // --- End API call ---

      // --- Update state: Remove the deleted post from the main list ---
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      // --- End state update ---
    } catch (err) {
      console.error("Error deleting post:", err);
      // Check for specific error status if needed (e.g., 403 for unauthorized, 404 for not found)
      // if (err.response && err.response.status === 403) {
      //   setError("You are not authorized to delete this post.");
      // } else {
        setError("Failed to delete post.");
      // }
    }
  };
  // --- End New Function ---

  const viewProfile = async (userId) => {
    setProfileLoading(true);
    setCurrentView('profile');

    try {
      let profileUserData = null;

      if (userId === user.id) {
        profileUserData = user;
      } else {
        const usersRes = await apiClient.get("/users");
        profileUserData = Array.isArray(usersRes.data)
          ? usersRes.data.find(u => u.id === userId)
          : null;
      }

      setProfileUser(profileUserData || { id: userId, name: 'User' });

      const [followersRes, followingRes] = await Promise.all([
        apiClient.get(`/followers/${userId}`),
        apiClient.get(`/following/${userId}`)
      ]);

      const followersData = followersRes.data.data ||
        (Array.isArray(followersRes.data) ? followersRes.data : []);
      const followingData = followingRes.data.data ||
        (Array.isArray(followingRes.data) ? followingRes.data : []);

      setProfileData({
        followers: followersData,
        following: followingData
      });

    } catch (err) {
      setError("Failed to load profile");
      console.error("Profile error:", err);
      setProfileUser({ id: userId, name: 'User' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await apiClient.post(`/follow/${userId}`);
      setUsersList(prev => prev.map(u =>
        u.id === userId ? { ...u, is_following: true } : u
      ));

      if (currentView === 'profile' && profileUser?.id === userId) {
        viewProfile(userId);
      }
    } catch (err) {
      setError("Failed to follow user");
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await apiClient.post(`/unfollow/${userId}`);
      setUsersList(prev => prev.map(u =>
        u.id === userId ? { ...u, is_following: false } : u
      ));

      if (currentView === 'profile' && profileUser?.id === userId) {
        viewProfile(userId);
      }
    } catch (err) {
      setError("Failed to unfollow user");
    }
  };

  if (loading) {
    return (
      <div className="centered-container">
        <Header />
        <main className="centered-main">
          <article aria-busy="true"></article>
          <p>Loading TOT....</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="centered-container">
      <Header
        user={user}
        currentView={currentView}
        onGoToFeed={() => setCurrentView('feed')}
        onGoToMyProfile={() => user && viewProfile(user.id)}
        onLogout={handleLogout}
      />

      <main className="centered-main">
        {error && <div className="error-message">{error}</div>}

        {user ? (
          currentView === 'feed' ? (
            <>
              <Feed
                user={user}
                posts={posts}
                onCreatePost={handleCreatePost}
                // --- Pass the new handler function as a prop ---
                onDeletePost={handleDeletePost} // <-- Added Prop
                // ---
              />
              <UserList
                users={usersList}
                currentUser={user}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onViewProfile={viewProfile}
              />
            </>
          ) : (
            <ProfileView
              profileUser={profileUser}
              profileData={profileData}
              currentUser={user}
              loading={profileLoading}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              onViewProfile={viewProfile}
            />
          )
        ) : (
          authView === 'login' ? (
            <Login
              onLogin={handleAuthSuccess}
              onSwitchToRegister={() => setAuthView('register')}
            />
          ) : (
            <Register
              onRegister={handleAuthSuccess}
              onSwitchToLogin={() => setAuthView('login')}
            />
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
