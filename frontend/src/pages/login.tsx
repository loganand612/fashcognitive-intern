import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/login.css";
import logs from "../assets/img/logs.png";
import { fetchCSRFToken } from "../utils/csrf";
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';


const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setPasswordVisible((prev) => !prev);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const csrfToken = await fetchCSRFToken();

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

            console.log("Login successful!");
            localStorage.setItem("username", email);
            navigate("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            setError("Login failed. Please check your credentials and try again.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="login-left">
                    <div className="logo-section">
                        <img src={logs} alt="Fashcognitive Logo" className="company-logo" />
                        <div className="welcome-text">
                            <h1 className="text1">Welcome Back to<br />Fashcognitive</h1>
                            <p className="text2">Manage your assets and operations, all in one place with our AI-powered solutions.</p>
                        </div>
                    </div>
                </div>

                <div className="login-right">
                    <form className="login-form" onSubmit={handleSubmit}>
                        <h2>Sign In</h2>
                        <p className="subtitle">Welcome back! Please enter your details.</p>

                        <div className="input-group">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <Lock className="input-icon" size={18} />
                            <input
                                type={passwordVisible ? "text" : "password"}
                                id="password"
                                name="password"
                                required
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={togglePasswordVisibility}
                                aria-label={passwordVisible ? "Hide password" : "Show password"}
                            >
                                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}

                        <div className="form-options">
                            <Link to="/forgot-password" className="forgot-password">
                                Forgot Password?
                            </Link>
                        </div>

                        <button type="submit" className="submit-btn">Sign In</button>

                        <p className="signup-link">
                            Don't have an account? <Link to="/register">Sign up</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
