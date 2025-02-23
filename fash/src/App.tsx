import React from "react";
import "./styles.css";
import qrCode from "./assets/qr.png";
import flag from "./assets/logo512.png";

const App = () => {
  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <a href="/" className="logo">FASHCOGNITIVE</a>
        <button className="mobile-menu-btn" aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="nav-links">
          <div className="language-select">
            <button className="language-btn">
              <img src={flag} width="20" alt="Language" /> English
            </button>
            <div className="language-dropdown">
              <div className="language-option">Deutsch</div>
              <div className="language-option">Español</div>
              <div className="language-option">Français</div>
              <div className="language-option">Nederlands</div>
              <div className="language-option">Português</div>
            </div>
          </div>
          <a href="#" className="btn btn-secondary notification-badge">Notifications</a>
          <a href="#" className="btn btn-secondary">Profile</a>
          <a href="/login" className="btn btn-secondary">Log in</a>
          <a href="/register" className="btn btn-primary">Sign up for free</a>
        </div>
      </nav>

      {/* Sidebar and Content */}
      <div className="content-wrapper">
        <aside className="sidebar">
          <a href="#" className="sidebar-link active">Dashboard</a>
          <a href="#" className="sidebar-link">Templates</a>
          <a href="#" className="sidebar-link">Inspections</a>
          <a href="#" className="sidebar-link">Schedule</a>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="landing-content">
            <div className="content-left">
              <h1>Scan the QR code to download the app</h1>
              <ul className="feature-list">
                <li>Conduct inspections and capture evidence even when offline.</li>
                <li>Personalize and share professional reports.</li>
                <li>Create and assign tasks to get the job done.</li>
                <li>Report issues and notify your team instantly.</li>
                <li>Manage your assets and operations, all in one place.</li>
                <li>Onboard, train, and upskill on the job.</li>
              </ul>
            </div>
            <div className="qr-container">
              <img src={qrCode} alt="QR Code" />
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Product</h3>
            <ul>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Book Demo</a></li>
              <li><a href="#">Product updates</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Support</h3>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Partner support</a></li>
              <li><a href="#">API documentation</a></li>
              <li><a href="#">Contact us</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li><a href="#">Checklist library</a></li>
              <li><a href="#">App guides</a></li>
              <li><a href="#">Topic guides</a></li>
              <li><a href="#">eBooks</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Company</h3>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">News room</a></li>
              <li><a href="#">Brand Partnerships</a></li>
              <li><a href="#">Events</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
