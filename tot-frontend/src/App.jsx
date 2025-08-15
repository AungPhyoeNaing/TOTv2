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
        if (user) {
            // Fetch posts
            apiClient
                .get("/posts")
                .then((response) => {
                    setPosts(response.data);
                })
                .catch((error) =>
                    console.error("Error fetching posts:", error)
                );

            // Fetch users list (you need an endpoint for this)
            apiClient
                .get("/users") // Adjust endpoint as needed
                .then((response) => {
                    setUsersList(response.data);
                })
                .catch((error) => {
                    console.error("Error fetching users:", error);
                    setError("Failed to load user list.");
                });
        }
    }, [user]);

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


    // Function to follow a user
    const handleFollow = async (userIdToFollow) => {
        try {
            const response = await apiClient.post(`/follow/${userIdToFollow}`);
            console.log(response.data.message);

            // Update UI state: Mark user as followed in usersList
            setUsersList(prevUsers =>
                prevUsers.map(u =>
                    u.id === userIdToFollow ? { ...u, is_following: true } : u
                )
            );

        } catch (error) {
            handleError(error, "Failed to follow user.");
        }
    };

    // Function to unfollow a user
    const handleUnfollow = async (userIdToUnfollow) => {
        try {
            const response = await apiClient.post(`/unfollow/${userIdToUnfollow}`); // Assuming POST for unfollow as per your controller
            console.log(response.data.message);

            // Update UI state: Mark user as not followed in usersList
            setUsersList(prevUsers =>
                prevUsers.map(u =>
                    u.id === userIdToUnfollow ? { ...u, is_following: false } : u
                )
            );

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
                    <>
                        <Feed
                            user={user}
                            posts={posts}
                            onCreatePost={handleCreatePost}
                        />
                         {/* Display list of users to follow/unfollow */}
                        <UserList
                            users={usersList}
                            currentUser={user}
                            onFollow={handleFollow}
                            onUnfollow={handleUnfollow}
                        />
                    </>
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
            {/* Keep the footer content if needed, or remove for cleaner login */}
            {/* <footer style={{ marginTop: "2rem" }}> ... </footer> */}
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

// New Component: Display a list of users with follow/unfollow buttons
function UserList({ users, currentUser, onFollow, onUnfollow }) {
    if (users.length === 0) {
        return <p>No other users found.</p>;
    }

    return (
        <section>
            <h4>Users</h4>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {users.map((user) => {
                    // Don't show follow button for the current user
                    if (user.id === currentUser.id) return null;

                    return (
                         <li key={user.id} style={{ marginBottom: '10px', padding: '5px', border: '1px solid #ccc' }}>
                            <strong>{user.name}</strong> ({user.email})
                            {/* Check if the current user is already following this user */}
                            {/* This assumes your user object includes an 'is_following' boolean.
                                 If not, you might need to manage it locally or fetch status. */}
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