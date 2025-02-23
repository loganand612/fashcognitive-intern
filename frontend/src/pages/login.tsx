import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/login.css";
import logs from "../assets/img/flag.jpg";

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const response = await fetch("http://127.0.0.1:8000/api/users/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Login successful:", data);
                setError("");
                navigate("/index");
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Invalid credentials");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("An error occurred. Please try again.");
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
