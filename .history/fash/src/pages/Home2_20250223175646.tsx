import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from './assets/fashcognitive-logo.png'; // Replace with your actual logo path
import reportImage from './assets/report-image.jpg'; // Replace with the actual middle content image path (300px x 200px)
import qrCodeImage from './assets/qr-code.jpg'; // Replace with your actual QR code image path
import './Home.css';

const HomePage: React.FC = () => {
    const [isNavOpen, setIsNavOpen] = useState(false);

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
    };

    return (
        <div className="home-container">
            {/* Navigation */}
            <nav className="navbar">
                <button className="mobile-menu-btn" onClick={toggleNav}>
                    <span>☰</span>
                </button>
                <div className="logo">
                    <Link to="/">FASHCOGNITIVE</Link>
                </div>
                <div className={`nav-links ${isNavOpen ? 'active' : ''}`}>
                    <Link to="/product">Product</Link>
                    <Link to="/solutions">Solutions</Link>
                    <Link to="/support">Support</Link>
                    <Link to="/customers">Customers</Link>
                    <Link to="/pricing">Pricing</Link>
                    <div className="language-select">
                        <button className="language-btn">English</button>
                        <div className="language-dropdown">
                            <div className="language-option">English</div>
                            <div className="language-option">Spanish</div>
                            <div className="language-option">French</div>
                        </div>
                    </div>
                    <Link to="/login" className="btn btn-secondary">Log in</Link>
                    <Link to="/signup" className="btn btn-primary">Sign up for free</Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                {/* Inspections Section */}
                <section className="inspections-section">
                    <h1>Perform inspections address issues report concerns work together to resolve</h1>
                    <div className="card-grid">
                        <div className="card"></div>
                        <div className="card"></div>
                        <div className="card"></div>
                    </div>
                </section>

                {/* Reports Section (Middle Content) */}
                <section className="reports-section">
                    <div className="report-content">
                        <img src={reportImage} alt="Report Setup and Preview" className="report-image" />
                        <div className="report-text">
                            <h2>Reports</h2>
                            <p>Generate and share custom reports. Instantly generate a report after an inspection is complete that shows off your unique brand. Share it with your team, managers, clients or customers with the tap of a finger.</p>
                            <button className="report-btn">Share</button>
                        </div>
                    </div>
                </section>

                {/* QR Code Section (App Content) */}
                <section className="qr-section">
                    <h2>Scan the QR code to download the app</h2>
                    <ul className="feature-list">
                        <li>Conduct inspections and capture evidence even when offline.</li>
                        <li>Personalize and share professional reports.</li>
                        <li>Create and assign tasks to get the job done.</li>
                        <li>Report issues and notify your team instantly.</li>
                        <li>Manage your assets and operations, all in one place.</li>
                        <li>Onboard, train and upskill on the job.</li>
                    </ul>
                    <div className="qr-container">
                        <img src={qrCodeImage} alt="QR Code" className="qr-code" />
                        <div className="qr-logo">FC<br />FASHCOGNITIVE</div>
                    </div>
                    <div className="store-buttons">
                        <img src="https://via.placeholder.com/120x40?text=App+Store" alt="App Store" />
                        <img src="https://via.placeholder.com/120x40?text=Google+Play" alt="Google Play" />
                    </div>
                </section>

                {/* Call to Action Section */}
                <section className="cta-section">
                    <h1>Perform inspections identify problems communicate effectively. track tasks and get started for free.</h1>
                    <Link to="/signup" className="cta-btn">Get started for free</Link>
                </section>

                {/* Footer */}
                <footer className="footer">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>Product</h3>
                            <ul>
                                <li><Link to="/pricing">Pricing</Link></li>
                                <li><Link to="/book-demo">Book Demo</Link></li>
                                <li><Link to="/updates">Product Updates</Link></li>
                                <li><Link to="/features">Features (formerly Auditor)</Link></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h3>Support</h3>
                            <ul>
                                <li><Link to="/help-center">Help Center</Link></li>
                                <li><Link to="/partner-support">Partner Support</Link></li>
                                <li><Link to="/api">API & Developer Documentation</Link></li>
                                <li><Link to="/digitize">Digitize your checklist</Link></li>
                                <li><Link to="/contact">Contact us</Link></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h3>Resources</h3>
                            <ul>
                                <li><Link to="/checklist-guides">Checklist & Software Guides</Link></li>
                                <li><Link to="/ebooks">eBooks</Link></li>
                                <li><Link to="/blog">Blog</Link></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h3>Company</h3>
                            <ul>
                                <li><Link to="/about">About</Link></li>
                                <li><Link to="/careers">Careers</Link></li>
                                <li><Link to="/news">News & Media</Link></li>
                                <li><Link to="/events">Events</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>Status | Legal | Terms & Conditions | Privacy Portal | Security © 2025</p>
                        <div className="social-links">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><img src="https://via.placeholder.com/24" alt="Twitter" /></a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><img src="https://via.placeholder.com/24" alt="Facebook" /></a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><img src="https://via.placeholder.com/24" alt="Instagram" /></a>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default HomePage;