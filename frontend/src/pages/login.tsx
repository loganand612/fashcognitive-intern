import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './login.css';
import { postData, fetchData } from '../utils/api';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setPasswordVisible((prev) => !prev);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            // Our API utility will handle CSRF token automatically
            const responseData = await postData("users/login/", { email, password });
            console.log("Login successful!", responseData);

            // Store user information in localStorage
            localStorage.setItem("username", email);

            // Store user role if available
            if (responseData.user && responseData.user.user_role) {
                localStorage.setItem("user_role", responseData.user.user_role);
                console.log("User role stored:", responseData.user.user_role);
            }

            // Verify authentication immediately after login
            try {
                const authStatus = await fetchData("users/auth-status/");
                console.log("Authentication verified:", authStatus);
            } catch (authError) {
                console.warn("Auth verification warning:", authError);
                // Continue anyway since we just logged in
            }

            navigate("/dashboard");
        } catch (error: any) {
            console.error("Login error:", error);

            // Extract error message from the response if available
            const errorMessage = error.response?.data?.error ||
                                error.message ||
                                "Login failed. Please check your credentials and try again.";

            setError(errorMessage);
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="login-left">
                    <div className="logo-section">
                        <div className="welcome-text">
                            <h1 className='text1'>Welcome Back to<br />Streamlineer<span className="accent-dot">.</span></h1>
                            <p className='text2'>Build smarter checklists and conduct flawless inspections with our intuitive platform.</p>
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
