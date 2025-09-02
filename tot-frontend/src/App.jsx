// src/App.jsx
import React, { useState, useEffect } from "react";
import io from "socket.io-client"; // <-- Import Socket.IO Client
import apiClient from "./api/apiClient";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";
import Feed from "./components/feed/Feed.jsx";
import UserList from "./components/profile/UserList.jsx";
import ProfileView from "./components/profile/ProfileView.jsx";
import Chat from "./components/chat/Chat.jsx";
import { logout } from "./api/authService";
import { deletePost } from "./api/postService";
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
  const [chatWithUser, setChatWithUser] = useState(null);
  const [profileData, setProfileData] = useState({
    followers: [],
    following: []
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // --- State for Socket.IO connection ---
  const [socket, setSocket] = useState(null);
  // --- End Socket.IO state ---

  // Auth check on initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      apiClient.get("/user")
        .then(response => {
            setUser(response.data);
            // --- Establish Socket.IO connection after successful auth ---
            const newSocket = io("http://localhost:3001", { // Adjust URL to your chat server
                auth: {
                    token: token // Pass Sanctum token for authentication
                }
            });
            setSocket(newSocket);

            // --- Listen for real-time events ---
            newSocket.on("connect", () => {
                console.log("Connected to Socket.IO server for real-time updates");
            });

            newSocket.on("reactionUpdated", (data) => {
                console.log("Real-time reaction update received:", data);
                // Update the posts state with the new reaction counts and user reaction
                setPosts(prevPosts =>
                    prevPosts.map(post => {
                        if (post.id === data.post_id) {
                            return {
                                ...post,
                                likes_count: data.likes_count,
                                sads_count: data.sads_count,
                                angries_count: data.angries_count,
                                reactions_count: data.reactions_count,
                                user_reaction: data.user_reaction // Reflects the current user's reaction for this post
                            };
                        }
                        return post;
                    })
                );
            });

            newSocket.on("commentAdded", (newComment) => {
                console.log("Real-time comment added:", newComment);
                // Update the comment count for the relevant post
                setPosts(prevPosts =>
                    prevPosts.map(post => {
                        if (post.id === newComment.post_id) {
                            return {
                                ...post,
                                comments_count: (post.comments_count || 0) + 1
                            };
                        }
                        return post;
                    })
                );
                // Note: The actual comment content isn't added to the feed's state here.
                // The Post component should fetch comments when opened or use its own real-time listener.
            });

            newSocket.on("connect_error", (err) => {
                 console.error("Socket.IO Connection Error:", err.message);
                 setError("Real-time updates unavailable.");
            });

             newSocket.on("disconnect", (reason) => {
                 console.log("Disconnected from Socket.IO server:", reason);
                 // Handle disconnection if needed
            });

            // --- End real-time event listeners ---
        })
        .catch(() => {
          localStorage.removeItem("token");
          setError("Session expired. Please login again.");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Cleanup function for useEffect - disconnect socket on unmount
    return () => {
        if (socket) {
            socket.disconnect();
            console.log("Socket.IO disconnected on App unmount");
        }
    };
  }, []); // Run only once on mount

  // Fetch data when authenticated/view changes
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
  }, [user, currentView]); // Depend on user and currentView

  const handleAuthSuccess = (token, user) => {
    localStorage.setItem("token", token);
    setUser(user);
    setError(null);
    setAuthView('login');
    // Socket connection is established by the first useEffect when `user` state changes
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      // --- Disconnect Socket.IO on logout ---
      if (socket) {
          socket.disconnect();
          setSocket(null);
          console.log("Socket.IO disconnected on logout");
      }
      // --- End Socket.IO disconnect ---
      localStorage.removeItem("token");
      setUser(null);
      setPosts([]);
      setUsersList([]);
      setCurrentView('feed');
      setChatWithUser(null);
      setProfileUser(null);
      setProfileData({ followers: [], following: [] });
      setProfileLoading(false);
    }
  };

  const handleCreatePost = (body) => {
    apiClient.post("/posts", { body })
      .then(response => {
        setPosts(prev => [response.data, ...prev]);
      })
      .catch(() => setError("Failed to create post"));
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deletePost(postId);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      setError("Failed to delete post.");
    }
  };

   const initiateChat = (userToChatWith) => {
     setChatWithUser(userToChatWith);
     setCurrentView('chat');
  };

  const viewProfile = async (userId) => {
    setProfileLoading(true);
    setCurrentView('profile');

    try {
      let profileUserData = null;

      if (userId === user?.id) { // Add optional chaining for safety
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
        onGoToChat={() => setCurrentView('chat')}
        onLogout={handleLogout}
      />

      <main className="centered-main">
        {error && <div className="error-message">{error}</div>}

        {user ? (
          currentView === 'feed' ? (
            <>
              /* Pass the socket instance to Feed */
              <Feed
                user={user}
                posts={posts}
                onCreatePost={handleCreatePost}
                onDeletePost={handleDeletePost}
                socket={socket} 
              />
              <UserList
                users={usersList}
                currentUser={user}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onViewProfile={viewProfile}
                onChat={initiateChat}
              />
            </>
          ) : currentView === 'profile' ? (
            <ProfileView
              profileUser={profileUser}
              profileData={profileData}
              currentUser={user}
              loading={profileLoading}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              onViewProfile={viewProfile}
              onChat={initiateChat}
            />
          ) : currentView === 'chat' ? (
            chatWithUser && chatWithUser.id ? (
              <Chat
                sanctumToken={localStorage.getItem("token")}
                currentUserId={user.id}
                otherUserId={chatWithUser?.id}
                otherUserName={chatWithUser?.name}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <h3>You have no recent chats</h3>
                <p>Select a user to start a conversation.</p>
                <button onClick={() => setCurrentView('feed')} className="secondary">
                  Back
                </button>
              </div>
            )
          ) : null
        ) : (authView === 'login' ? (
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