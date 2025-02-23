import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.min.css";
import "../styles/lo.css"; // Assuming you have styles.css from the previous setup

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulated login (replace with API call or authentication logic)
    console.log("Login attempt with:", { email, password });
    // Redirect to dashboard or home after login (for now, simulate success)
    navigate("/dashboard");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="d-flex flex-column align-items-center min-vh-100 py-4" style={{ backgroundColor: "var(--background-color)" }}>
      <div className="logo-container mb-4">
        <img src="/images/logo.jpg" alt="FASHCOGNITIVE Logo" className="logo" />
        <h2 className="nme">FASHCOGNITIVE</h2>
        <div className="logo-text">AI SOLUTION FOR APPAREL INDUSTRY</div>
      </div>

      <div className="login-card shadow-sm" style={{ maxWidth: "400px", width: "100%" }}>
        <h1 className="text-dark mb-4">Log in</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="email" className="text-muted fw-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-control form-control-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter email"
              style={{ borderColor: "var(--border-color)", transition: "border-color 0.15s ease" }}
            />
          </div>

          <div className="form-group mb-4">
            <label htmlFor="password" className="text-muted fw-medium mb-2">
              Password
            </label>
            <div className="input-wrapper position-relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-control form-control-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                style={{ borderColor: "var(--border-color)", transition: "border-color 0.15s ease" }}
              />
              <button
                type="button"
                className="password-toggle btn p-0 position-absolute top-50 end-0 translate-middle-y"
                onClick={togglePasswordVisibility}
                style={{ color: "var(--button-color)" }}
              >
                <i
                  className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  style={{ fontSize: "20px" }}
                />
              </button>
            </div>
          </div>

          <button type="submit" className="submit-button btn btn-dark w-100 py-2 mb-3">
            Log in
          </button>

          <div className="bottom-links d-flex justify-content-between align-items-center text-muted">
            <Link to="/forgot-password" className="text-primary text-decoration-none">
              Forgot password?
            </Link>
            <Link to="/signup" className="text-primary text-decoration-none">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;