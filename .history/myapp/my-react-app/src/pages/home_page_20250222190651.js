import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import './styles/HomePage.css';
const HomePage = () => {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isNavActive, setIsNavActive] = useState(false);
  const location = useLocation();
  const toggleNav = () => {
    setIsNavActive(!isNavActive);
    setIsSidebarActive(!isSidebarActive);
  };
  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="logo">FASHCOGNITIVE</Link>
        <button className="mobile-menu-btn" aria-label="Toggle menu" onClick={toggleNav}>
          <Menu />
        </button>
        <div className={`nav-links ${isNavActive ? 'active' : ''}`}>
          <div className="language-select">
            <button className="language-btn">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B1EB52EA1-268A-404D-844D-665697292FBC%7D-mVRIHfg1p6eVdE65KruJAmiQ10XGsP.png" alt="Language" width="20" />
              English
            </button>
            <div className="language-dropdown">
              <div className="language-option">Deutsch</div>
              <div className="language-option">Español</div>
              <div className="language-option">Français</div>
              <div className="language-option">Nederlands</div>
              <div className="language-option">Português</div>
            </div>
          </div>
          <Link to="/notifications" className="btn btn-secondary notification-badge">
            Notifications
          </Link>
          <Link to="/profile" className="btn btn-secondary">Profile</Link>
          <Link to="/login" className="btn btn-secondary">Log in</Link>
          <Link to="/signup" className="btn btn-primary">Sign up for free</Link>
        </div>
      </nav>
      <div className="content-wrapper">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarActive ? 'active' : ''}`}>
          <Link 
            to="/dashboard" 
            className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/templates" 
            className={`sidebar-link ${location.pathname === '/templates' ? 'active' : ''}`}
          >
            Templates
          </Link>
          <Link 
            to="/inspections" 
            className={`sidebar-link ${location.pathname === '/inspections' ? 'active' : ''}`}
          >
            Inspections
          </Link>
          <Link 
            to="/schedule" 
            className={`sidebar-link ${location.pathname === '/schedule' ? 'active' : ''}`}
          >
            Schedule
          </Link>
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
                <li>Onboard, train and upskill on the job.</li>
              </ul>
            </div>
            <div className="qr-container">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B5CDF9F6F-23FA-44F0-ABF6-97EE976F6ABB%7D-vlKZWh3a18FEtLCGHZLiGpIbH08uSn.png" 
                alt="QR Code" 
                className="qr-code"
              />
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
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/demo">Book Demo</Link></li>
              <li><Link to="/updates">Product updates</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Support</h3>
            <ul>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/partner-support">Partner support</Link></li>
              <li><Link to="/api-docs">API documentation</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li><Link to="/checklists">Checklist library</Link></li>
              <li><Link to="/guides">App guides</Link></li>
              <li><Link to="/topics">Topic guides</Link></li>
              <li><Link to="/ebooks">eBooks</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Company</h3>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/news">News room</Link></li>
              <li><Link to="/partnerships">Brand Partnerships</Link></li>
              <li><Link to="/events">Events</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <img 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B5CDF9F6F-23FA-44F0-ABF6-97EE976F6ABB%7D-vlKZWh3a18FEtLCGHZLiGpIbH08uSn.png" 
            alt="Fashcognitive Logo" 
            style={{ height: '30px', marginBottom: '1rem' }} 
          />
          <div className="store-buttons">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B5CDF9F6F-23FA-44F0-ABF6-97EE976F6ABB%7D-vlKZWh3a18FEtLCGHZLiGpIbH08uSn.png" 
              alt="App Store" 
            />
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B5CDF9F6F-23FA-44F0-ABF6-97EE976F6ABB%7D-vlKZWh3a18FEtLCGHZLiGpIbH08uSn.png" 
              alt="Play Store" 
            />
          </div>
        </div>
      </footer>
    </div>
  );
};
export default HomePage;