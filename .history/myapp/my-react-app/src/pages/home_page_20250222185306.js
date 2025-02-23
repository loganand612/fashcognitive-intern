import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./styles/custom.css"; // Ensure this CSS file is in src/styles/custom.css
import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.min.css";

// Navbar Component
const Navbar = () => {
  const [isNavActive, setIsNavActive] = useState(false);

  const toggleNav = () => {
    setIsNavActive(!isNavActive);
  };

  return (
    <nav className="navbar">
      <a href="/" className="logo">FASHCOGNITIVE</a>
      <button className="mobile-menu-btn" aria-label="Toggle menu" onClick={toggleNav}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div className={`nav-links ${isNavActive ? "active" : ""}`}>
        <div className="language-select">
          <button className="language-btn">
            <img 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B1EB52EA1-268A-404D-844D-665697292FBC%7D-mVRIHfg1p6eVdE65KruJAmiQ10XGsP.png" 
              width="20"
              alt="English Flag"
            />
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
        <Link to="/notifications" className="btn btn-secondary notification-badge">Notifications</Link>
        <Link to="/profile" className="btn btn-secondary">Profile</Link>
        <Link to="/login" className="btn btn-secondary">Log in</Link>
        <Link to="/signup" className="btn btn-primary">Sign up for free</Link>
      </div>
    </nav>
  );
};

// Sidebar Component
const Sidebar = () => {
  const [isActive, setIsActive] = useState(false); // Synced with Navbar for mobile toggle

  return (
    <aside className={`sidebar ${isActive ? "active" : ""}`}>
      <Link to="/dashboard" className="sidebar-link active">Dashboard</Link>
      <Link to="/templates" className="sidebar-link">Templates</Link>
      <Link to="/inspections" className="sidebar-link">Inspections</Link>
      <Link to="/schedule" className="sidebar-link">Schedule</Link>
    </aside>
  );
};

// MainContent Component
const MainContent = () => {
  return (
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
          <img src="/images/qr.png" alt="QR Code" className="qr-code" />
        </div>
      </div>
    </main>
  );
};

// Footer Component
const Footer = () => {
  return (
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
            <li><Link to="/partner">Partner support</Link></li>
            <li><Link to="/api">API documentation</Link></li>
            <li><Link to="/contact">Contact us</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Resources</h3>
          <ul>
            <li><Link to="/checklists">Checklist library</Link></li>
            <li><Link to="/guides/app">App guides</Link></li>
            <li><Link to="/guides/topics">Topic guides</Link></li>
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
            <li><Link to="/partners">Brand Partnerships</Link></li>
            <li><Link to="/events">Events</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <img 
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B5CDF9F6F-23FA-44F0-ABF6-97EE976F6ABB%7D-vlKZWh3a18FEtLCGHZLiGpIbH08uSn.png" 
          alt="Fashcognitive Logo" 
          style={{ height: "30px", marginBottom: "1rem" }}
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
  );
};

// Home/Landing Component
const Home = () => {
  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="content-wrapper">
        <Sidebar />
        <MainContent />
      </div>
      <Footer />
    </div>
  );
};

// Main App Component with Routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Home />} /> {/* Placeholder; replace with actual Login component */}
        <Route path="/signup" element={<Home />} /> {/* Placeholder; replace with actual Signup component */}
        <Route path="/notifications" element={<Home />} /> {/* Placeholder; replace with actual Notifications component */}
        <Route path="/profile" element={<Home />} /> {/* Placeholder; replace with actual Profile component */}
        <Route path="/dashboard" element={<Home />} /> {/* Placeholder; replace with actual Dashboard component */}
        <Route path="/templates" element={<Home />} /> {/* Placeholder; replace with actual Templates component */}
        <Route path="/inspections" element={<Home />} /> {/* Placeholder; replace with actual Inspections component */}
        <Route path="/schedule" element={<Home />} /> {/* Placeholder; replace with actual Schedule component */}
        <Route path="/pricing" element={<Home />} /> {/* Placeholder; replace with actual Pricing component */}
        <Route path="/demo" element={<Home />} /> {/* Placeholder; replace with actual Demo component */}
        <Route path="/updates" element={<Home />} /> {/* Placeholder; replace with actual Updates component */}
        <Route path="/help" element={<Home />} /> {/* Placeholder; replace with actual Help component */}
        <Route path="/partner" element={<Home />} /> {/* Placeholder; replace with actual Partner component */}
        <Route path="/api" element={<Home />} /> {/* Placeholder; replace with actual API component */}
        <Route path="/contact" element={<Home />} /> {/* Placeholder; replace with actual Contact component */}
        <Route path="/checklists" element={<Home />} /> {/* Placeholder; replace with actual Checklists component */}
        <Route path="/guides/app" element={<Home />} /> {/* Placeholder; replace with actual App Guides component */}
        <Route path="/guides/topics" element={<Home />} /> {/* Placeholder; replace with actual Topic Guides component */}
        <Route path="/ebooks" element={<Home />} /> {/* Placeholder; replace with actual eBooks component */}
        <Route path="/blog" element={<Home />} /> {/* Placeholder; replace with actual Blog component */}
        <Route path="/about" element={<Home />} /> {/* Placeholder; replace with actual About component */}
        <Route path="/careers" element={<Home />} /> {/* Placeholder; replace with actual Careers component */}
        <Route path="/news" element={<Home />} /> {/* Placeholder; replace with actual News component */}
        <Route path="/partners" element={<Home />} /> {/* Placeholder; replace with actual Partners component */}
        <Route path="/events" element={<Home />} /> {/* Placeholder; replace with actual Events component */}
      </Routes>
    </Router>
  );
}

export default App;