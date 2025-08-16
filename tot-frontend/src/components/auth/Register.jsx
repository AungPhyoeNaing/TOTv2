import React, { useState } from "react";
import { getCsrfToken, register as authServiceRegister } from "../../api/authService";

export default function Register({ onRegister, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }

    try {
      await getCsrfToken();
      const response = await authServiceRegister(
        name,
        email,
        password,
        passwordConfirmation
      );
      onRegister(response.data.token, response.data.user);
    } catch (err) {
      const errorMsg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : "Registration failed. Please try again.";
      setError(errorMsg);
    }
  };

  return (
    <section className="auth-section">
      <h2>Register for MiniFeed</h2>
      <p>Create a new account.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          minLength="8"
        />
        <input
          type="password"
          name="password_confirmation"
          placeholder="Confirm Password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      
      <p className="switch-link">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin}>
          Login here
        </button>
      </p>
    </section>
  );
}