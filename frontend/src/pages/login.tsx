import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/login.css";
import logs from "../assets/img/flag.jpg";
import { fetchCSRFToken } from "../utils/csrf";

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(""); // Used for error handling
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
      
        try {
          // 1. First, get a fresh CSRF token
          const csrfToken = await fetchCSRFToken();
      
          // 2. Make the login request with the fresh token
          const loginResponse = await fetch("http://localhost:8000/api/users/login/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrfToken,
            },
            body: JSON.stringify({ email, password }),
            credentials: "include",
          });
      
          if (!loginResponse.ok) {
            const errorData = await loginResponse.json();
            throw new Error(errorData.error || "Login failed");
          }
      
          // Success handling
          console.log("Login successful!");
          localStorage.setItem("username", email);
          navigate("/dashboard");
          
        } catch (error) {
          console.error("Login error:", error);
          setError("Login failed. Please check your credentials and try again."); // Set error message
        }
    };

    return (
        <div className="login-container">
            <div className="left-panel">
                <img src={logs} alt="Logo" className="logo" />
                <h2 className="font">Manage your assets and operations, all in one place</h2>
            </div>
            <div className="right-panel">
                <div className="login-card">
                    <h1>Hello Again!</h1>
                    <p>Welcome Back</p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="login-button">Login</button>

                        {error && <p style={{ color: "red" }}>{error}</p>} {/* Display error message */}

                        <div className="bottom-links">
                            <Link to="#">Forgot Password?</Link>
                            <Link to="/register" className="signup-button">Sign Up</Link>                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;