import React, { useState } from "react";
import "../assets/styles.css";
import qrCode from "../assets/img/qr.png";
import flag from "../assets/img/flag.jpg";

const Home: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLanguageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleLanguageDropdown = () => setLanguageDropdownOpen(!isLanguageDropdownOpen);

  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <a href="/" className="logo">FASHCOGNITIVE</a>
        <button className="mobile-menu-btn" onClick={toggleSidebar} aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="nav-links">
          <div className="language-select">
            <button className="language-btn" onClick={toggleLanguageDropdown}>
              <img src={flag} alt="flag"  width="20"/> English
            </button>
            {isLanguageDropdownOpen && (
              <div className="language-dropdown">
                {["Deutsch", "Español", "Français", "Nederlands", "Português"].map((lang) => (
                  <div className="language-option" key={lang}>{lang}</div>
                ))}
              </div>
            )}
          </div>
          <a href="#" className="btn btn-secondary">Notifications</a>
          <a href="#" className="btn btn-secondary">Profile</a>
          <a href="/login" className="btn btn-secondary">Log in</a>
          <a href="/register" className="btn btn-primary">Sign up for free</a>
        </div>
      </nav>

      {/* Sidebar */}
      <div className="content-wrapper">
        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
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
          {[
            { title: "Product", links: ["Pricing", "Book Demo", "Product updates"] },
            { title: "Support", links: ["Help Center", "Partner support", "API documentation", "Contact us"] },
            { title: "Resources", links: ["Checklist library", "App guides", "Topic guides", "eBooks", "Blog"] },
            { title: "Company", links: ["About", "Careers", "News room", "Brand Partnerships", "Events"] },
          ].map((section) => (
            <div className="footer-section" key={section.title}>
              <h3>{section.title}</h3>
              <ul>
                {section.links.map((link) => (
                  <li key={link}><a href="#">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Home;
