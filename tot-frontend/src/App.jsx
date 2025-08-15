import React, { useState, useEffect } from "react";
import axios from "axios";
// =================================================================
// 1. IMPORT THE CUSTOM CSS
// =================================================================
import "./App.css"; // Adjust the path if your CSS file is named differently or located elsewhere

// =================================================================
// API CLIENT CONFIGURATION (No changes here)
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
    const [loading, setLoading] = useState(true);

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
                    localStorage.removeItem("token");
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            apiClient
                .get("/posts")
                .then((response) => {
                    setPosts(response.data);
                })
                .catch((error) =>
                    console.error("Error fetching posts:", error)
                );
        }
    }, [user]);

    const handleLogin = (email, password) => {
        axios
            .get("http://127.0.0.1:8000/sanctum/csrf-cookie", {
                withCredentials: true,
            })
            .then(() => {
                apiClient
                    .post("/login", { email, password })
                    .then((response) => {
                        localStorage.setItem("token", response.data.token);
                        apiClient.defaults.headers.common[
                            "Authorization"
                        ] = `Bearer ${response.data.token}`;
                        setUser(response.data.user);
                    })
                    .catch((error) =>
                        console.error(
                            "Login failed:",
                            error.response?.data || error.message
                        )
                    );
            })
            .catch((error) => console.error("CSRF Cookie error:", error));
    };

    const handleLogout = () => {
        apiClient
            .post("/logout")
            .then(() => {
                localStorage.removeItem("token");
                delete apiClient.defaults.headers.common["Authorization"];
                setUser(null);
                setPosts([]);
            })
            .catch((error) => console.error("Logout error:", error));
    };

    const handleCreatePost = (body) => {
        apiClient
            .post("/posts", { body })
            .then((response) => {
                setPosts((prevPosts) => [response.data, ...prevPosts]);
            })
            .catch((error) => console.error("Error creating post:", error));
    };

    if (loading) {
        return (
            // USE THE CUSTOM CSS CLASS FOR CENTERING
            <div className="centered-container">
                <header>
                    <h1>TOT</h1>
                </header>
                <main className="centered-main">
                    <article aria-busy="true"></article>
                    <p style={{ textAlign: "center" }}>
                        Loading TOT....
                    </p>{" "}
                    {/* Center text */}
                </main>
            </div>
        );
    }

    return (
        // USE THE CUSTOM CSS CLASS FOR CENTERING
        <div className="centered-container">
            <header>
                {/* USE THE CUSTOM NAVBAR CLASS */}
                <nav className="navbar">
                    <ul>
                        <li>
                            <strong>TOT</strong>
                        </li>
                    </ul>
                    {user && (
                        <ul>
                            <li>
                                {/* Apply the logout button class if needed */}
                                <button
                                    className="secondary outline logout-button" // Added class
                                    onClick={handleLogout}
                                    // Removed inline marginLeft style
                                >
                                    Logout
                                </button>
                            </li>
                        </ul>
                    )}
                </nav>
            </header>

            <main className="centered-main">
                {user ? (
                    <Feed
                        user={user}
                        posts={posts}
                        onCreatePost={handleCreatePost}
                    />
                ) : (
                    <Login onLogin={handleLogin} />
                )}
            </main>

            {/* Apply the centered footer class */}
            <footer className="centered-footer">
                <small>Built with React and custom CSS</small>
            </footer>
        </div>
    );
}

// =================================================================
// CHILD COMPONENTS (Minimal changes for consistency)
// =================================================================

function Login({ onLogin }) {
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
            {/* Form styles are handled by CSS now */}
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
            <footer style={{ marginTop: "2rem" }}>
                <h3>
                    <strong>Don't have an account?</strong>
                </h3>
                <p>
                    You'll need to register a user via an API tool first. This
                    is a great way to learn how APIs work!
                </p>
                <ol>
                    <li>
                        Download a tool like{" "}
                        <a
                            href="https://www.postman.com/downloads/  "
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Postman
                        </a>{" "}
                        or{" "}
                        <a
                            href="https://insomnia.rest/download  "
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Insomnia
                        </a>
                        .
                    </li>
                    <li>
                        Create a new <strong>POST</strong> request to{" "}
                        <code>http://127.0.0.1:8000/api/register</code>.
                    </li>
                    <li>In the "Body" tab, select "JSON" and enter this:</li>
                </ol>
                <pre>
                    <code>{`{
    "name": "Your Name",
    "email": "your@email.com",
    "password": "password",
    "password_confirmation": "password"
}`}</code>
                </pre>
            </footer>
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
            {/* Use the custom grid class */}
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
            {/* Form styles are handled by CSS now */}
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
