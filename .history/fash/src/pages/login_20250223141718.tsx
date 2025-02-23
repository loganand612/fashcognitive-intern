import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

const Login = () => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    return (
        <div className="login-container">
            <div className="logo-container">
                <img src="/path-to-your-logo/flag.jpg" alt="Logo" className="logo" />
                <h2>FASHCOGNITIVE</h2>
                <div className="logo-text">AI SOLUTION FOR APPAREL INDUSTRY</div>
            </div>

            <div className="login-card">
                <h1>Log in</h1>

                <form>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <input
                                type={passwordVisible ? "text" : "password"}
                                id="password"
                                name="password"
                                required
                            />
                            <button type="button" className="password-toggle" onClick={togglePasswordVisibility}>
                                {passwordVisible ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="submit-button">Log in</button>

                    <div className="bottom-links">
                        <Link to="#">Forgot password?</Link>
                        <Link to="/register" className="signup-button">Sign up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
