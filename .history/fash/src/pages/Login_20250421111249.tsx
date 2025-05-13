import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Login.css';
import logs from "./assets/logs.png";

const Login: React.FC = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible((prev) => !prev);
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="login-left">
                    <div className="logo-section">
                        <img src={logs} alt="Fashcognitive Logo" className="company-logo" />
                        <div className="welcome-text">
                            <h1 className='text1'>Welcome Back to<br />Fashcognitive</h1>
                            <p className='text2'>Manage your assets and operations, all in one place with our AI-powered solutions.</p>
                        </div>
                    </div>
                </div>
                
                <div className="login-right">
                    <form className="login-form">
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

                        <div className="form-options">
                            <Link to="/forgot-password" className="forgot-password">
                                Forgot Password?
                            </Link>
                        </div>
                        <a href="/dashboard" className="submit-btn">Sign In</a>
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