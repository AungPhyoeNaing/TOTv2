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

  // --- Modified useEffect Hook: Auth check, data fetch, and Socket.IO setup ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true; // Flag to prevent state updates if component unmounts
    let newSocketInstance = null; // Keep track of the socket instance locally for cleanup

    const initializeApp = async () => {
      try {
        // 1. Authenticate and fetch user data
        const userResponse = await apiClient.get("/user");
        if (!isMounted) return; // Stop if component unmounted

        setUser(userResponse.data);

        // 2. Establish Socket.IO connection
        newSocketInstance = io("http://localhost:3001", {
          auth: {
            token: token // Pass Sanctum token for authentication
          }
        });

        // Update state with the new socket instance
        setSocket(newSocketInstance);

        // --- Define named listener functions for explicit cleanup ---
        const handleConnect = () => {
          console.log("[Socket] Connected to Socket.IO server for real-time updates");
        };

        const handleReactionUpdated = (data) => {
          console.log("[Socket] Real-time reaction update received:", data);
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
        };

        const handleCommentAdded = (newComment) => {
          console.log("[Socket] Real-time comment added (Global Listener):", newComment);
          // Update the comment count for the relevant post
          setPosts(prevPosts =>
            prevPosts.map(post => {
              if (post.id === newComment.post_id) {
                // --- FIX: Ensure count is treated as a number ---
                const currentCount = Number(post.comments_count) || 0;
                const newCount = currentCount + 1;
                console.log(`[Socket] Incrementing comment count for post ${post.id}. Old: ${currentCount}, New: ${newCount}`);
                return {
                  ...post,
                  comments_count: newCount // Store the incremented number
                };
              }
              return post;
            })
          );
        };

        const handleConnectError = (err) => {
          console.error("[Socket] Connection Error:", err.message);
          if (isMounted) {
            setError("Real-time updates unavailable.");
          }
        };

        const handleDisconnect = (reason) => {
          console.log("[Socket] Disconnected from Socket.IO server:", reason);
        };

        // --- Attach the listeners to the new socket instance ---
        newSocketInstance.on("connect", handleConnect);
        newSocketInstance.on("reactionUpdated", handleReactionUpdated);
        newSocketInstance.on("commentAdded", handleCommentAdded);
        newSocketInstance.on("connect_error", handleConnectError);
        newSocketInstance.on("disconnect", handleDisconnect);

        console.log("[App.jsx] Socket.IO connection established and listeners attached.");

        // 3. Fetch initial data (posts, users)
        const [postsRes, usersRes] = await Promise.all([
          apiClient.get("/posts"),
          apiClient.get("/users")
        ]);

        if (!isMounted) return;

        setPosts(postsRes.data);
        setUsersList(Array.isArray(usersRes.data) ? usersRes.data : []);

      } catch (error) {
        console.error("App initialization error:", error);
        if (!isMounted) return;
        localStorage.removeItem("token");
        setError("Session expired. Please login again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeApp();

    // --- Cleanup function for useEffect ---
    return () => {
      isMounted = false; // Set flag on unmount
      console.log("[App.jsx useEffect Cleanup] Running...");

      if (newSocketInstance) {
        // --- Explicitly remove listeners using the named functions ---
        // This is the key part of the fix to prevent duplication
        newSocketInstance.off("connect", handleConnect);
        newSocketInstance.off("reactionUpdated", handleReactionUpdated);
        newSocketInstance.off("commentAdded", handleCommentAdded);
        newSocketInstance.off("connect_error", handleConnectError);
        newSocketInstance.off("disconnect", handleDisconnect);

        newSocketInstance.disconnect();
        console.log("[App.jsx useEffect Cleanup] Socket.IO listeners removed and disconnected.");

        // Ensure state is also cleared if this was the active socket
        // Check if the socket in state is the one we are cleaning up
        if (socket === newSocketInstance) {
            setSocket(null);
        }
      }
    };
  }, []); // Run only once on mount

  // --- useEffect Hook: Fetch data when authenticated/view changes ---
  // This useEffect remains largely unchanged, but now relies on the robust socket setup above
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

  // --- Handler Functions ---
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

  const handleCreatePost = async (postData) => {
  try {
    const response = await apiClient.post("/posts", postData);
    setPosts(prev => [response.data, ...prev]);
  } catch (err) {
    console.error("Create post error:", err);
    setError("Failed to create post");
  }
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

    if (userId === user?.id) {
      profileUserData = user;
    } else {
      // Fetch user list to find the profile user (or use a dedicated endpoint if available)
      const usersRes = await apiClient.get("/users");
      profileUserData = Array.isArray(usersRes.data)
        ? usersRes.data.find(u => u.id === userId)
        : null;
    }

    setProfileUser(profileUserData || { id: userId, name: 'User' });

    // --- FETCH FOLLOWERS, FOLLOWING, POSTS ---
    const [followersRes, followingRes, postsRes] = await Promise.all([
      apiClient.get(`/followers/${userId}`),
      apiClient.get(`/following/${userId}`),
      apiClient.get(`/users/${userId}/posts`)
    ]);

    const followersData = followersRes.data.data ||
      (Array.isArray(followersRes.data) ? followersRes.data : []);
    const followingData = followingRes.data.data ||
      (Array.isArray(followingRes.data) ? followingRes.data : []);
    const userPosts = Array.isArray(postsRes.data) ? postsRes.data : [];

    // --- FETCH MUTUAL FOLLOW STATUS SEPARATELY ---
    let isMutualFollow = false; // Default value
    if (userId !== user?.id) { // Only check if not viewing own profile
        try {
            // Call the mutual follow endpoint
            const mutualFollowResponse = await apiClient.get(`/users/${userId}/is-mutual-follow/${user.id}`);
            // Extract the status, defaulting to false if not present
            isMutualFollow = mutualFollowResponse.data?.is_mutual_follow ?? false;
        } catch (followCheckError) {
            // Handle potential errors (e.g., network issues, 403 from backend if user tries self-check)
            console.error("Error checking mutual follow status:", followCheckError);
            // isMutualFollow remains false
        }
    }
    // If viewing own profile, isMutualFollow should logically be false or irrelevant, default is fine.

    // --- UPDATE STATE ---
    setProfileData({
      followers: followersData,
      following: followingData,
      posts: userPosts,
      // ADD the mutual follow status to profileData
      isMutualFollow: isMutualFollow
    });

  } catch (err) {
    setError("Failed to load profile");
    console.error("Profile error:", err);
    setProfileUser({ id: userId, name: 'User' });
    // Ensure profileData has isMutualFollow even on error
    setProfileData(prevData => ({ ...prevData, isMutualFollow: false }));
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
  // --- End Handler Functions ---

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
              {/* Pass the socket instance to Feed */}
              <Feed
                user={user}
                posts={posts}
                onCreatePost={handleCreatePost}
                onDeletePost={handleDeletePost}
                socket={socket} 
                onViewProfile={viewProfile}
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
                onViewProfile={viewProfile}
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