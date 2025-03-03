import type React from "react";
import "D:/intern/safety_culture/fashcognitive-intern/frontend/src/assets/styles.css";
import { Menu } from "lucide-react";

// Import the icon images and video from the assets folder
import createIcon from "D:/intern/safety_culture/fashcognitive-intern/frontend/src/assets/img/create.png";
import conductIcon from "D:/intern/safety_culture/fashcognitive-intern/frontend/src/assets/img/conduct.png";
import analyzeIcon from "D:/intern/safety_culture/fashcognitive-intern/frontend/src/assets/img/analyze.png"; // Ensure this is a PNG with transparency
import qr from "D:/intern/safety_culture/fashcognitive-intern/frontend/src/assets/img/qr.png";
import headerVideo from "D:/intern/safety_culture/fashcognitive-intern/frontend/src/assets/img/head1.mp4";
import appStoreBadge from "D:/intern/safety_culture/fashcognitive-intern/frontend/src/assets/img/app-store-badge.svg";
import googlePlayBadge from "D:/intern/safety_culture/fashcognitive-intern/frontend/src/assets/img/google-play-badge.svg";

const Home2: React.FC = () => {
  return (
    <div className="home-container">
      <header className="header">
        <button className="menu-button">
          <Menu size={24} />
        </button>
        <div className="logo">FASHCOGNITIVE</div>
        <div className="auth-buttons">
          <a href="\login" className="login-button">Log in</a>
          <a href="\register" className="signup-button">Sign up for free</a>
        </div>
      </header>

      <nav className="navigation">
        <ul>
          <li className="nav-item">
            Product <span className="dropdown-arrow">▼</span>
          </li>
          <li className="nav-item">
            Solutions <span className="dropdown-arrow">▼</span>
          </li>
          <li className="nav-item">
            Support <span className="dropdown-arrow">▼</span>
          </li>
          <li className="nav-item">Customers</li>
          <li className="nav-item">Pricing</li>
        </ul>
      </nav>

      <section className="hero-section">
        <video className="hero-video" autoPlay muted loop>
          <source src={headerVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-content">
          <h1 className="hero-title">
            Conduct Inspections
            <br />
            Anytime, Anywhere
            <br />
            Anyplace
          </h1>
          <div className="feature-boxes">
            <div className="feature-box">
              <img src={createIcon} alt="Create & Customize Inspections Icon" className="feature-box-icon" />
              <div className="feature-box-text">Create & Customize Inspections</div>
            </div>
            <div className="feature-box">
              <img src={conductIcon} alt="Conduct Inspections & Collect Data Icon" className="feature-box-icon" />
              <div className="feature-box-text">Conduct Inspections & Collect Data</div>
            </div>
            <div className="feature-box">
              <img src={analyzeIcon} alt="Analyze & Take Action Icon" className="feature-box-icon" />
              <div className="feature-box-text">Analyze & Take Action</div>
            </div>
          </div>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-content">
          <div className="reports-images">
            <div className="mobile-report-image">
              <div className="report-mockup">
                <div className="report-header">
                  <div className="report-title">
                    BRANDED
                    <br />
                    REPORT
                  </div>
                </div>
                <div className="dashboard-chart">
                  <div className="chart-placeholder">
                    <div className="chart-bar chart-bar-1"></div>
                    <div className="chart-bar chart-bar-2"></div>
                    <div className="chart-bar chart-bar-3"></div>
                    <div className="chart-bar chart-bar-4"></div>
                  </div>
                </div>
                <button className="purple-button">Button</button>
              </div>
            </div>
            <div className="desktop-report-image">
              <div className="desktop-dashboard">
                <div className="chart-header">
                  <div className="chart-title">Inspection Results</div>
                  <div className="chart-legend">
                    <span className="legend-item passing">Passing</span>
                    <span className="legend-item failing">Failing</span>
                  </div>
                </div>
                <div className="chart-content">
                  <div className="chart-area">
                    <div className="pie-chart">
                      <div className="pie-segment segment-1"></div>
                      <div className="pie-segment segment-2"></div>
                    </div>
                    <div className="data-metrics">
                      <div className="metric">
                        <div className="metric-value">87%</div>
                        <div className="metric-label">Compliance</div>
                      </div>
                      <div className="metric">
                        <div className="metric-value">24</div>
                        <div className="metric-label">Issues</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="share-button">
                <span>Share</span>
              </div>
            </div>
          </div>
          <div className="reports-text">
            <div className="reports-badge">Reports</div>
            <h2 className="reports-title">Generate and share custom reports</h2>
            <p className="reports-description">
              Instantly{" "}
              <a href="#" className="text-link">
                generate a report
              </a>{" "}
              after an inspection is complete that shows off your unique brand. Share it with your team, managers,
              clients or customers with the tap of a finger.
            </p>
          </div>
        </div>
      </section>

      <section className="app-download-section">
        <div className="app-download-content">
          <div className="app-download-text">
            <h2 className="app-download-title">Scan the QR code to download the app</h2>
            <ul className="app-features-list">
              <li className="app-feature">Conduct inspections and capture evidence even when offline.</li>
              <li className="app-feature">Personalize and share professional reports.</li>
              <li className="app-feature">Create and assign tasks to get the job done.</li>
              <li className="app-feature">Report issues and notify your team instantly.</li>
              <li className="app-feature">Manage your assets and operations, all in one place.</li>
              <li className="app-feature">Onboard, train and upskill on the job.</li>
            </ul>
            <div className="app-store-buttons">
              <a href="#" className="app-store-button">
                <div className="store-badge">
                  <div className="apple-icon"></div>
                  <span className="store-icon">
                    <span className="store-prefix">Download on the</span>
                    <span className="store-name">App Store</span>
                  </span>
                </div>
              </a>
              <a href="#" className="google-play-button">
                <div className="store-badge">
                  <div className="play-icon">
                    <div className="play-triangle"></div>
                  </div>
                  <span className="store-icon">
                    <span className="store-prefix">GET IT ON</span>
                    <span className="store-name">Google Play</span>
                  </span>
                </div>
              </a>
            </div>
          </div>
          <div className="qr-code-container">
            <div className="company-logo-large"></div>
            <div className="qr-code">
              <img src={qr} alt="QR Code" />
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2 className="cta-title">
          Perform inspections identify problems
          <br />
          track tasks and communicate effectively.
        </h2>
        <button className="cta-button">Get started for free</button>
      </section>

      <footer className="footer">
        <div className="footer-columns">
          <div className="footer-column">
            <h3 className="footer-heading">Product</h3>
            <ul className="footer-links">
              <li>
                <a href="#">Pricing</a>
              </li>
              <li>
                <a href="#">Book Demo</a>
              </li>
              <li>
                <a href="#">Product Updates</a>
              </li>
              <li>
                <a href="#">Safety/Culture (formerly Auditor)</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h3 className="footer-heading">Support</h3>
            <ul className="footer-links">
              <li>
                <a href="#">Help Center</a>
              </li>
              <li>
                <a href="#">Partner Support</a>
              </li>
              <li>
                <a href="#">API Developer Documentation</a>
              </li>
              <li>
                <a href="#">Digitize Your Checklist</a>
              </li>
              <li>
                <a href="#">Contact Us</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h3 className="footer-heading">Resources</h3>
            <ul className="footer-links">
              <li>
                <a href="#">Checklist Library</a>
              </li>
              <li>
                <a href="#">App & Software Guides</a>
              </li>
              <li>
                <a href="#">Checklist Guides</a>
              </li>
              <li>
                <a href="#">Topic Guides</a>
              </li>
              <li>
                <a href="#">eBooks</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h3 className="footer-heading">Company</h3>
            <ul className="footer-links">
              <li>
                <a href="#">About</a>
              </li>
              <li>
                <a href="#">Careers</a>
              </li>
              <li>
                <a href="#">News Room</a>
              </li>
              <li>
                <a href="#">Brand Partnerships</a>
              </li>
              <li>
                <a href="#">Meet the Leadership Team</a>
              </li>
              <li>
                <a href="#">Events</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-legal">
            <a href="#">Status</a>
            <span>•</span>
            <a href="#">Legal</a>
            <span>•</span>
            <a href="#">Terms and Conditions</a>
            <span>•</span>
            <a href="#">Privacy Portal</a>
            <span>•</span>
            <a href="#">Security</a>
            <span>•</span>
            <span>© 2025 Fashcognitive, Inc. All rights reserved.</span>
          </div>
          <div className="footer-social">
            <a href="#" className="social-icon" aria-label="Twitter">
              <img src="/placeholder.svg?height=20&width=20" alt="Twitter" />
            </a>
            <a href="#" className="social-icon" aria-label="LinkedIn">
              <img src="/placeholder.svg?height=20&width=20" alt="LinkedIn" />
            </a>
            <a href="#" className="social-icon" aria-label="Facebook">
              <img src="/placeholder.svg?height=20&width=20" alt="Facebook" />
            </a>
            <a href="#" className="social-icon" aria-label="Instagram">
              <img src="/placeholder.svg?height=20&width=20" alt="Instagram" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home2;