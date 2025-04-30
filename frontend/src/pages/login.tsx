import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/login.css";
import logs from "../assets/img/flag.jpg";
import axios from 'axios';


const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Fetch CSRF token first (sets cookie)
            await axios.get("http://localhost:8000/api/users/get-csrf-token/", {
                withCredentials: true,
            });

            // Get token from cookie
            const csrfToken = document.cookie
                .split("; ")
                .find(row => row.startsWith("csrftoken="))
                ?.split("=")[1];

            if (!csrfToken) throw new Error("Missing CSRF token");

            // Login request with CSRF header
            await axios.post("http://localhost:8000/api/users/login/", {
                email,
                password,
            }, {
                withCredentials: true,
                headers: {
                    "X-CSRFToken": csrfToken,
                },
            });

            navigate("/dashboard");
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.response?.data?.error || "Login failed. Try again.");
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

                        {error && <p style={{ color: "red" }}>{error}</p>}

                        <div className="bottom-links">
                            <Link to="#">Forgot Password?</Link>
                            <Link to="/register" className="signup-button">Sign Up</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
