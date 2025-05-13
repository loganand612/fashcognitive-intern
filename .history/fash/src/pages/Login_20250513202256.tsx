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
            {/* Custom cursor */}
            <div ref={cursorRef} className={`custom-cursor ${cursorVariant}`}>
                <MousePointer size={12} />
            </div>

            <div className="login-content">
                <div className="login-left">
                    <div className="logo-section">
                        <img src={logs} alt="Fashcognitive Logo" className="company-logo" />
                        <div className="welcome-text">
                            <h1 className='text1'>Welcome Back to<br />Fashcognitive<span className="accent-dot">.</span></h1>
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
                                onMouseEnter={enterButton}
                                onMouseLeave={leaveHover}
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
                                onMouseEnter={enterButton}
                                onMouseLeave={leaveHover}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={togglePasswordVisibility}
                                aria-label={passwordVisible ? "Hide password" : "Show password"}
                                onMouseEnter={enterButton}
                                onMouseLeave={leaveHover}
                            >
                                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="form-options">
                            <Link
                                to="/forgot-password"
                                className="forgot-password"
                                onMouseEnter={enterLink}
                                onMouseLeave={leaveHover}
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        <a
                            href="/dashboard"
                            className="submit-btn"
                            onMouseEnter={enterButton}
                            onMouseLeave={leaveHover}
                        >
                            Sign In
                        </a>
                        <p className="signup-link">
                            Don't have an account? <Link
                                to="/register"
                                onMouseEnter={enterLink}
                                onMouseLeave={leaveHover}
                            >
                                Sign up
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;