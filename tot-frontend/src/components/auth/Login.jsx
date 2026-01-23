// src/components/auth/Login.jsx
import React, { useState } from "react";
import { getCsrfToken, login as authServiceLogin } from "../../api/authService";

export default function Login({ onLogin, onSwitchToRegister, onSwitchToPasswordResetRequest }) { // Add onSwitchToPasswordResetRequest prop
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      await getCsrfToken();
      const response = await authServiceLogin(email, password);
      onLogin(response.data.token, response.data.user);
    } catch (err) {
      const errorMsg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : "Login failed. Please check your credentials.";
      setError(errorMsg);
    }
  };

  return (
    <section className="auth-section">
      <h2>Welcome to MiniFeed</h2>
      <p>Please log in to continue.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      
      {/* Link to Password Reset Request page */}
      <p className="switch-link">
        <button type="button" onClick={onSwitchToPasswordResetRequest}>
          Forgot Password?
        </button>
      </p>

      <p className="switch-link">
        Don't have an account?{" "}
        <button type="button" onClick={onSwitchToRegister}>
          Register here
        </button>
      </p>
    </section>
  );
}