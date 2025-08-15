import React, { useState, useEffect } from "react";
import axios from "axios";
// =================================================================
// 1. IMPORT THE CUSTOM CSS
// =================================================================
import "./App.css"; // Adjust the path if your CSS file is named differently or located elsewhere

// =================================================================
// API CLIENT CONFIGURATION
// =================================================================
const apiClient = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    withCredentials: true,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

// =================================================================
// MAIN APP COMPONENT
// =================================================================
export default function App() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [usersList, setUsersList] = useState([]); // State for list of users
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // State for general errors
    const [authView, setAuthView] = useState('login'); // 'login' or 'register'
    const [currentView, setCurrentView] = useState('feed'); // 'feed' or 'profile'
    const [profileUser, setProfileUser] = useState(null);
    const [profileData, setProfileData] = useState({ followers: [], following: [] });
    const [profileLoading, setProfileLoading] = useState(false);

    // Check for token and fetch authenticated user on initial load
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            apiClient.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${token}`;
            apiClient
                .get("/user")
                .then((response) => {
                    setUser(response.data);
                })
                .catch((error) => {
                    console.error("Authentication error:", error);
                    setError("Failed to authenticate. Please log in again.");
                    localStorage.removeItem("token");
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    // Fetch posts and users list once authenticated
    useEffect(() => {
        if (user && currentView === 'feed') {
            // Fetch posts
            apiClient
                .get("/posts")
                .then((response) => {
                    setPosts(response.data);
                })
                .catch((error) =>
                    console.error("Error fetching posts:", error)
                );

            // Fetch users list
            apiClient
                .get("/users")
                .then((response) => {
                    console.log("Users response:", response.data);
                    setUsersList(Array.isArray(response.data) ? response.data : []);
                })
                .catch((error) => {
                    console.error("Error fetching users:", error);
                    setError("Failed to load user list.");
                    setUsersList([]); // Set to empty array on error
                });
        }
    }, [user, currentView]);

    const handleLogin = (email, password) => {
        setError(null); // Clear previous errors
        axios
            .get("http://127.0.0.1:8000/sanctum/csrf-cookie", {
                withCredentials: true,
            })
            .then(() => {
                apiClient
                    .post("/login", { email, password })
                    .then((response) => {
                        const token = response.data.token;
                        localStorage.setItem("token", token);
                        apiClient.defaults.headers.common[
                            "Authorization"
                        ] = `Bearer ${token}`;
                        setUser(response.data.user);
                        setError(null); // Clear any login errors on success
                        setAuthView('login'); // Switch back to login view on success if needed elsewhere
                    })
                    .catch((error) => {
                        console.error(
                            "Login failed:",
                            error.response?.data || error.message
                        );
                        // Handle Laravel validation errors (422)
                        if (error.response?.status === 422) {
                             const errors = error.response.data.errors;
                             let errorMessage = "Login failed:";
                             for (const key in errors) {
                                 if (errors.hasOwnProperty(key)) {
                                     errorMessage += ` ${errors[key][0]}`;
                                 }
                             }
                             setError(errorMessage);
                        } else {
                            setError("Login failed. Please check your credentials.");
                        }
                    });
            })
            .catch((error) => {
                console.error("CSRF Cookie error:", error);
                setError("Failed to initiate login. Please try again.");
            });
    };

    const handleRegister = (name, email, password, passwordConfirmation) => {
        setError(null); // Clear previous errors
        axios
            .get("http://127.0.0.1:8000/sanctum/csrf-cookie", {
                withCredentials: true,
            })
            .then(() => {
                apiClient
                    .post("/register", { name, email, password, password_confirmation: passwordConfirmation })
                    .then((response) => {
                        const token = response.data.token;
                        localStorage.setItem("token", token);
                        apiClient.defaults.headers.common[
                            "Authorization"
                        ] = `Bearer ${token}`;
                        setUser(response.data.user);
                        setError(null); // Clear any registration errors on success
                        setAuthView('login'); // Switch to login view or directly log in
                         alert("Registration successful! You are now logged in.");
                    })
                    .catch((error) => {
                        console.error(
                            "Registration failed:",
                            error.response?.data || error.message
                        );
                         // Handle Laravel validation errors (422)
                        if (error.response?.status === 422) {
                             const errors = error.response.data.errors;
                             let errorMessage = "Registration failed:";
                             for (const key in errors) {
                                 if (errors.hasOwnProperty(key)) {
                                     errorMessage += ` ${errors[key][0]}`;
                                 }
                             }
                             setError(errorMessage);
                        } else {
                             setError("Registration failed. Please try again.");
                        }
                    });
            })
            .catch((error) => {
                console.error("CSRF Cookie error (register):", error);
                setError("Failed to initiate registration. Please try again.");
            });
    };

    const handleLogout = () => {
        apiClient
            .post("/logout")
            .then(() => {
                localStorage.removeItem("token");
                delete apiClient.defaults.headers.common["Authorization"];
                setUser(null);
                setPosts([]);
                setUsersList([]); // Clear users list on logout
                setError(null); // Clear errors on logout
                setCurrentView('feed'); // Reset to feed view
            })
            .catch((error) => {
                console.error("Logout error:", error);
                // Even if logout fails on backend, clear local state
                localStorage.removeItem("token");
                delete apiClient.defaults.headers.common["Authorization"];
                setUser(null);
                setPosts([]);
                setUsersList([]);
                setError("Logout encountered an issue, but you are signed out.");
                setCurrentView('feed'); // Reset to feed view
            });
    };

    const handleCreatePost = (body) => {
        apiClient
            .post("/posts", { body })
            .then((response) => {
                setPosts((prevPosts) => [response.data, ...prevPosts]);
            })
            .catch((error) => {
                console.error("Error creating post:", error);
                alert("Failed to create post.");
            });
    };

    // Function to view user profile
    const viewProfile = async (userId) => {
        console.log("Viewing profile for user ID:", userId);
        setProfileLoading(true);
        setCurrentView('profile');
        
        try {
            let profileUserData = null;
            
            // If viewing own profile, get data from current user
            if (userId === user.id) {
                profileUserData = user;
            } else {
                // Get all users first to find the specific user
                const usersResponse = await apiClient.get("/users");
                console.log("Users response:", usersResponse.data);
                
                profileUserData = Array.isArray(usersResponse.data) 
                    ? usersResponse.data.find(u => u.id === userId)
                    : null;
            }
            
            console.log("Found user:", profileUserData);
            
            // If user not found in users list, create a minimal user object
            if (!profileUserData) {
                profileUserData = { id: userId, name: 'User', email: '' };
            }
            
            setProfileUser(profileUserData);
            
            // Fetch followers and following
            console.log("Fetching followers for user:", userId);
            const followersResponse = await apiClient.get(`/followers/${userId}`);
            console.log("Followers response:", followersResponse.data);
            
            console.log("Fetching following for user:", userId);
            const followingResponse = await apiClient.get(`/following/${userId}`);
            console.log("Following response:", followingResponse.data);
            
            // Handle paginated responses
            const followersData = followersResponse.data.data || 
                                (Array.isArray(followersResponse.data) ? followersResponse.data : []);
            const followingData = followingResponse.data.data || 
                                (Array.isArray(followingResponse.data) ? followingResponse.data : []);
            
            setProfileData({
                followers: followersData,
                following: followingData
            });
            
        } catch (error) {
            console.error("Error fetching profile ", error);
            handleError(error, "Failed to load profile.");
            // Set minimal profile data to avoid blank screen
            setProfileUser({ id: userId, name: 'User', email: '' });
            setProfileData({ followers: [], following: [] });
        } finally {
            setProfileLoading(false);
        }
    };

    // Function to go back to feed
    const goToFeed = () => {
        setCurrentView('feed');
    };

    // Function to go to own profile
    const goToMyProfile = () => {
        if (user) {
            viewProfile(user.id);
        }
    };

    // Function to follow a user
    const handleFollow = async (userIdToFollow) => {
        try {
            const response = await apiClient.post(`/follow/${userIdToFollow}`);
            console.log("Follow response:", response.data);

            // Update UI state: Mark user as followed in usersList
            setUsersList(prevUsers =>
                prevUsers.map(u =>
                    u.id === userIdToFollow ? { ...u, is_following: true } : u
                )
            );

            // If we're on a profile page, refresh it
            if (currentView === 'profile' && profileUser && profileUser.id === userIdToFollow) {
                viewProfile(profileUser.id);
            }

        } catch (error) {
            handleError(error, "Failed to follow user.");
        }
    };

    // Function to unfollow a user
    const handleUnfollow = async (userIdToUnfollow) => {
        try {
            const response = await apiClient.post(`/unfollow/${userIdToUnfollow}`);
            console.log("Unfollow response:", response.data);

            // Update UI state: Mark user as not followed in usersList
            setUsersList(prevUsers =>
                prevUsers.map(u =>
                    u.id === userIdToUnfollow ? { ...u, is_following: false } : u
                )
            );

            // If we're on a profile page, refresh it
            if (currentView === 'profile' && profileUser && profileUser.id === userIdToUnfollow) {
                viewProfile(profileUser.id);
            }

        } catch (error) {
             handleError(error, "Failed to unfollow user.");
        }
    };

    // Helper function for consistent error handling
    const handleError = (error, defaultMessage) => {
        if (error.response) {
            console.error("API Error Response:", error.response.data);
            // Use specific message from backend if available
            alert(error.response.data.message || error.response.data.error || defaultMessage);
        } else if (error.request) {
            console.error("API Error Request:", error.request);
            alert("Network error. Please check your connection and try again.");
        } else {
            console.error("API Error Message:", error.message);
            alert(defaultMessage);
        }
    };


    if (loading) {
        return (
            <div className="centered-container">
                <header>
                    <h1>TOT</h1>
                </header>
                <main className="centered-main">
                    <article aria-busy="true"></article>
                    <p style={{ textAlign: "center" }}>
                        Loading TOT....
                    </p>
                </main>
            </div>
        );
    }

    return (
        <div className="centered-container">
            <header>
                <nav className="navbar">
                    <ul>
                        <li>
                            <strong>TOT</strong>
                        </li>
                    </ul>
                    {user && (
                        <ul>
                            {currentView === 'profile' ? (
                                <li>
                                    <button
                                        className="secondary outline"
                                        onClick={goToFeed}
                                        style={{ marginRight: '10px' }}
                                    >
                                        Back to Feed
                                    </button>
                                </li>
                            ) : (
                                <li>
                                    <button
                                        className="secondary outline"
                                        onClick={goToMyProfile}
                                        style={{ marginRight: '10px' }}
                                    >
                                        My Profile
                                    </button>
                                </li>
                            )}
                            <li>
                                <button
                                    className="secondary outline logout-button"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </li>
                        </ul>
                    )}
                </nav>
            </header>

            <main className="centered-main">
                {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display general errors */}
                {user ? (
                    currentView === 'feed' ? (
                        <>
                            <Feed
                                user={user}
                                posts={posts}
                                onCreatePost={handleCreatePost}
                            />
                             {/* Display list of users to follow/unfollow */}
                            <UserList
                                users={Array.isArray(usersList) ? usersList : []}
                                currentUser={user}
                                onFollow={handleFollow}
                                onUnfollow={handleUnfollow}
                                onViewProfile={viewProfile} // Pass viewProfile function
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
                        <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />
                    ) : (
                        <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} />
                    )
                )}
            </main>

            <footer className="centered-footer">
                <small>Built with React and custom CSS</small>
            </footer>
        </div>
    );
}

// =================================================================
// CHILD COMPONENTS
// =================================================================

function Login({ onLogin, onSwitchToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <section>
            <h2 style={{ textAlign: "center" }}>Welcome to MiniFeed</h2>
            <p style={{ textAlign: "center" }}>Please log in to continue.</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    aria-label="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    aria-label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            <p style={{ textAlign: "center", marginTop: "1rem" }}>
                Don't have an account?{" "}
                <button
                    type="button"
                    onClick={onSwitchToRegister}
                    style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                >
                    Register here
                </button>
            </p>
        </section>
    );
}

function Register({ onRegister, onSwitchToLogin }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password !== passwordConfirmation) {
            alert("Passwords do not match.");
            return;
        }
        onRegister(name, email, password, passwordConfirmation);
    };

    return (
        <section>
            <h2 style={{ textAlign: "center" }}>Register for MiniFeed</h2>
            <p style={{ textAlign: "center" }}>Create a new account.</p>
            <form onSubmit={handleSubmit}>
                 <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    aria-label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    aria-label="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    aria-label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="8"
                />
                 <input
                    type="password"
                    name="password_confirmation"
                    placeholder="Confirm Password"
                    aria-label="Confirm Password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                />
                <button type="submit">Register</button>
            </form>
             <p style={{ textAlign: "center", marginTop: "1rem" }}>
                Already have an account?{" "}
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                >
                    Login here
                </button>
            </p>
        </section>
    );
}


function Feed({ user, posts, onCreatePost }) {
    return (
        <>
            <header>
                <h3>Hello, {user.name}!</h3>
            </header>
            <CreatePostForm onCreatePost={onCreatePost} />
            <hr />
            <h4>Feed</h4>
            <div className="posts-grid">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <article key={post.id}>
                            <header>
                                <strong>{post.user.name}</strong>{" "}
                                <small>({post.user.email})</small>
                            </header>
                            <p>{post.body}</p>
                            <footer>
                                <small>
                                    Posted:{" "}
                                    {new Date(post.created_at).toLocaleString()}
                                </small>
                            </footer>
                        </article>
                    ))
                ) : (
                    <p>No posts yet. Be the first!</p>
                )}
            </div>
        </>
    );
}

function CreatePostForm({ onCreatePost }) {
    const [body, setBody] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (body.trim()) {
            onCreatePost(body);
            setBody("");
        }
    };

    return (
        <article>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What's on your mind?"
                    aria-label="Create a new post"
                    required
                    rows="3"
                ></textarea>
                <button type="submit">Post</button>
            </form>
        </article>
    );
}

// Updated UserList Component with profile view button
function UserList({ users, currentUser, onFollow, onUnfollow, onViewProfile }) {
    const validUsers = Array.isArray(users) ? users : [];
    
    if (validUsers.length === 0) {
        return <p>No other users found.</p>;
    }

    return (
        <section>
            <h4>Users</h4>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {validUsers.map((user) => {
                    // Don't show follow button for the current user
                    if (user.id === currentUser.id) return null;

                    return (
                         <li key={user.id} style={{ marginBottom: '10px', padding: '5px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <strong>{user.name}</strong> ({user.email})
                                <button
                                    onClick={() => {
                                        console.log("View profile clicked for user:", user.id);
                                        onViewProfile(user.id);
                                    }}
                                    style={{ marginLeft: '10px' }}
                                    className="secondary"
                                >
                                    View Profile
                                </button>
                            </div>
                            {/* Check if the current user is already following this user */}
                            {user.is_following !== undefined ? ( // Check if status is available
                                user.is_following ? (
                                    <button
                                        onClick={() => onUnfollow(user.id)}
                                        style={{ marginLeft: '10px' }}
                                        className="secondary" // Example class
                                    >
                                        Unfollow
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onFollow(user.id)}
                                        style={{ marginLeft: '10px' }}
                                    >
                                        Follow
                                    </button>
                                )
                            ) : (
                                // If status is unknown, you might show a loading indicator or fetch it
                                <span style={{ marginLeft: '10px', color: 'gray' }}>Loading...</span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

// New ProfileView Component
function ProfileView({ profileUser, profileData, currentUser, loading, onFollow, onUnfollow, onViewProfile }) {
    const [activeTab, setActiveTab] = useState('following');

    console.log("ProfileView props:", { profileUser, profileData, loading });

    if (loading) {
        return <p style={{ textAlign: "center", padding: "20px" }}>Loading profile...</p>;
    }

    if (!profileUser) {
        return <p style={{ textAlign: "center", padding: "20px" }}>User not found</p>;
    }

    const isOwnProfile = profileUser.id === currentUser.id;
    const isFollowing = profileUser.is_following || false;

    const handleFollowAction = () => {
        if (isFollowing) {
            onUnfollow(profileUser.id);
        } else {
            onFollow(profileUser.id);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                <div className="profile-avatar">
                    <img 
                        src={'https://placehold.co/120'} 
                        alt={profileUser.name} 
                        style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginRight: '30px' }}
                    />
                </div>
                <div className="profile-info">
                    <h1 style={{ margin: '0 0 10px 0' }}>{profileUser.name || 'Unknown User'}</h1>
                    <p style={{ margin: '5px 0', color: '#666' }}>@{profileUser.email || 'No email'}</p>
                    
                    <div className="profile-stats" style={{ display: 'flex', gap: '20px', margin: '15px 0' }}>
                        <span><strong>{Array.isArray(profileData.following) ? profileData.following.length : 0}</strong> Following</span>
                        <span><strong>{Array.isArray(profileData.followers) ? profileData.followers.length : 0}</strong> Followers</span>
                    </div>

                    {!isOwnProfile && (
                        <button 
                            className={`follow-button ${isFollowing ? 'following' : ''}`}
                            onClick={handleFollowAction}
                            style={{
                                backgroundColor: isFollowing ? '#fff' : '#1da1f2',
                                color: isFollowing ? '#1da1f2' : '#fff',
                                border: isFollowing ? '1px solid #1da1f2' : 'none',
                                padding: '10px 20px',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                    )}
                </div>
            </div>

            <div className="profile-tabs" style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
                <button 
                    className={activeTab === 'following' ? 'active' : ''}
                    onClick={() => setActiveTab('following')}
                    style={{
                        padding: '15px 20px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        color: activeTab === 'following' ? '#1da1f2' : '#666',
                        borderBottom: activeTab === 'following' ? '3px solid #1da1f2' : '3px solid transparent'
                    }}
                >
                    Following ({Array.isArray(profileData.following) ? profileData.following.length : 0})
                </button>
                <button 
                    className={activeTab === 'followers' ? 'active' : ''}
                    onClick={() => setActiveTab('followers')}
                    style={{
                        padding: '15px 20px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        color: activeTab === 'followers' ? '#1da1f2' : '#666',
                        borderBottom: activeTab === 'followers' ? '3px solid #1da1f2' : '3px solid transparent'
                    }}
                >
                    Followers ({Array.isArray(profileData.followers) ? profileData.followers.length : 0})
                </button>
            </div>

            <div className="profile-content">
               {activeTab === 'following' && (
    <UserGrid 
        users={Array.isArray(profileData.following) ? profileData.following : []} 
        currentUser={currentUser}
        onFollow={onFollow}
        onUnfollow={onUnfollow}
        onViewProfile={onViewProfile}
        showFollowButton={false} // Don't show follow buttons for users you're already following
    />
)}
{activeTab === 'followers' && (
    <UserGrid 
        users={Array.isArray(profileData.followers) ? profileData.followers : []} 
        currentUser={currentUser}
        onFollow={onFollow}
        onUnfollow={onUnfollow}
        onViewProfile={onViewProfile}
        showFollowButton={true} // Show follow buttons for followers (who might not be followed yet)
    />
)}
            </div>
        </div>
    );
}

// User Grid Component for displaying followers/following
// User Grid Component for displaying followers/following
function UserGrid({ users, currentUser, onFollow, onUnfollow, onViewProfile, showFollowButton = true }) {
    console.log("UserGrid users:", users);
    
    // Ensure users is an array
    const validUsers = Array.isArray(users) ? users : [];
    
    return (
        <div className="user-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {validUsers.length === 0 ? (
                <p>No users found</p>
            ) : (
                validUsers.map(user => (
                    <div key={user.id} className="user-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', border: '1px solid #eee', borderRadius: '8px', background: '#fff', textAlign: 'center' }}>
                        <div 
                            className="user-avatar" 
                            onClick={() => onViewProfile(user.id)}
                            style={{ marginBottom: '15px', cursor: 'pointer' }}
                        >
                            <img 
                                src={'https://placehold.co/50'} 
                                alt={user.name} 
                                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        </div>
                        <div className="user-details">
                            <h3 onClick={() => onViewProfile(user.id)} style={{ margin: '0 0 5px 0', fontSize: '1.1rem', cursor: 'pointer' }}>
                                {user.name || 'Unknown User'}
                            </h3>
                            <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '0.9rem' }}>@{user.email || 'No email'}</p>
                        </div>
                        {/* Only show follow button if explicitly requested (e.g., in followers list) and not viewing own profile */}
                        {showFollowButton && user.id !== currentUser.id && (
                            <button 
                                className={`follow-button small ${user.is_following ? 'following' : ''}`}
                                onClick={() => {
                                    if (user.is_following) {
                                        onUnfollow(user.id);
                                    } else {
                                        onFollow(user.id);
                                    }
                                }}
                                style={{
                                    backgroundColor: user.is_following ? '#fff' : '#1da1f2',
                                    color: user.is_following ? '#1da1f2' : '#fff',
                                    border: user.is_following ? '1px solid #1da1f2' : 'none',
                                    padding: '5px 15px',
                                    borderRadius: '25px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {user.is_following ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}