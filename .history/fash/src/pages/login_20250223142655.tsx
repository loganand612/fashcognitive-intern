import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css"; // Use the new CSS file
import goBooksLogo from "./assets/logo.jpg"; // Replace with your actual image path

const Login: React.FC = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible((prev) => !prev);
    };

    return (
        <div className="login-container">
            <div className="left-panel">
                <img src={goBooksLogo} alt="GoBooks Logo" className="logo" />
                <h2 className="font">Manage your assets and operations, all in one place</h2>
            </div>
            <div className="right-panel">
                <div className="login-card">
                    <h1>Hello Again!</h1>
                    <p>Welcome Back</p>

                    <form>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id="email" name="email" required placeholder="Enter your email" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <input
                                    type={passwordVisible ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    required
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={togglePasswordVisibility}
                                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                                >
                                    {passwordVisible ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="login-button">
                            Login
                        </button>

                        <div className="bottom-links">
                            <Link to="#">Forgot Password?</Link>
                            <Link to="/register" className="signup-button">
                                Sign Up
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;