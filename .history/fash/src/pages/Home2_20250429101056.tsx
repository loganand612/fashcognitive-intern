"use client"

import { useRef, useState } from "react"
import "./Home2.css"
import {
  Menu,
  ChevronDown,
  Share2,
  ArrowRight,
  FileImage,
  FileVideo,
  QrCode,
  BarChart3,
  ClipboardCheck,
} from "lucide-react"
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion"

const Home2 = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const heroRef = useRef(null)
  const reportsRef = useRef(null)
  const appDownloadRef = useRef(null)
  const testimonialsRef = useRef(null)
  const statsRef = useRef(null)
  const faqRef = useRef(null)

  const isReportsInView = useInView(reportsRef, { once: true, amount: 0.3 })
  const isAppDownloadInView = useInView(appDownloadRef, { once: true, amount: 0.3 })
  const isTestimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.3 })
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 })
  const isFaqInView = useInView(faqRef, { once: true, amount: 0.3 })

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])

  const [activeAccordion, setActiveAccordion] = useState<number | null>(null)

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index)
  }

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Operations Manager",
      company: "Global Industries",
      text: "This platform has completely transformed how we conduct our safety inspections. The ability to customize forms and generate instant reports has saved us countless hours.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Michael Chen",
      role: "Quality Assurance Director",
      company: "Precision Manufacturing",
      text: "The mobile app is intuitive and works flawlessly offline, which is crucial for our factory floor inspections. The analytics dashboard gives us insights we never had before.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Emma Rodriguez",
      role: "Health & Safety Officer",
      company: "Construction Partners",
      text: "We've reduced our safety incidents by 37% since implementing this solution. The ability to assign and track corrective actions has improved accountability across our sites.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ]

  const faqs = [
    {
      question: "How does the offline mode work?",
      answer:
        "Our app is designed to function seamlessly without an internet connection. You can conduct inspections, take photos, and complete forms offline. Once you're back online, all data automatically syncs to the cloud, ensuring you never lose important information.",
    },
    {
      question: "Can I customize inspection templates?",
      answer:
        "Our platform offers extensive customization options. You can create templates from scratch or modify our pre-built templates to match your specific requirements. Add custom fields, conditional logic, scoring systems, and more to tailor inspections to your exact needs.",
    },
    {
      question: "How secure is my inspection data?",
      answer:
        "Security is our top priority. All data is encrypted both in transit and at rest using industry-standard protocols. We maintain SOC 2 compliance and regular security audits. Your data is backed up regularly and stored in redundant, geographically distributed data centers.",
    },
    {
      question: "Is there a limit to the number of users?",
      answer:
        "Our pricing plans are designed to scale with your organization. The Basic plan includes up to 5 users, while our Professional and Enterprise plans support unlimited users. You can easily add or remove users as your team changes.",
    },
    {
      question: "Can I integrate with other software systems?",
      answer:
        "Yes, we offer robust API access and pre-built integrations with popular business systems including Salesforce, Microsoft 365, Google Workspace, and many more. Our development team can also work with you to create custom integrations with your existing software ecosystem.",
    },
  ]

  const stats = [
    { value: "87%", label: "Reduction in inspection time" },
    { value: "63%", label: "Faster issue resolution" },
    { value: "3.5x", label: "ROI within first year" },
    { value: "24/7", label: "Global support" },
  ]

  return (
    <div className="home-container">
      <header className="header">
        <button className="menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          <Menu size={24} />
        </button>
        <motion.div
          className="logo"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          FASHCOGNITIVE
        </motion.div>
        <div className="auth-buttons">
          <motion.a href="/login" className="login-button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Log in
          </motion.a>
          <motion.a href="/register" className="signup-button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Sign up for free
          </motion.a>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul>
              <li>
                <a href="#product">Product</a>
              </li>
              <li>
                <a href="#solutions">Solutions</a>
              </li>
              <li>
                <a href="#support">Support</a>
              </li>
              <li>
                <a href="#customers">Customers</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li className="mobile-auth">
                <a href="/login" className="mobile-login">
                  Log in
                </a>
                <a href="/register" className="mobile-signup">
                  Sign up
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="navigation">
        <ul>
          <motion.li className="nav-item" whileHover={{ scale: 1.05 }}>
            Product <ChevronDown size={16} className="dropdown-arrow" />
          </motion.li>
          <motion.li className="nav-item" whileHover={{ scale: 1.05 }}>
            Solutions <ChevronDown size={16} className="dropdown-arrow" />
          </motion.li>
          <motion.li className="nav-item" whileHover={{ scale: 1.05 }}>
            Support <ChevronDown size={16} className="dropdown-arrow" />
          </motion.li>
          <motion.li className="nav-item" whileHover={{ scale: 1.05 }}>
            Customers
          </motion.li>
          <motion.li className="nav-item" whileHover={{ scale: 1.05 }}>
            Pricing
          </motion.li>
        </ul>
      </nav>

      <motion.section className="hero-section" ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale }}>
        <div className="hero-video-placeholder">
          <FileVideo size={48} className="placeholder-icon" />
        </div>
        <div className="hero-content">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Conduct Inspections
            <br />
            Anytime, Anywhere
            <br />
            Anyplace
          </motion.h1>
          <div className="feature-boxes">
            <motion.div
              className="feature-box"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{
                y: -10,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                backgroundColor: "#f8f9fa",
              }}
            >
              <FileImage className="feature-box-icon" />
              <div className="feature-box-text">Create & Customize Inspections</div>
            </motion.div>
            <motion.div
              className="feature-box"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{
                y: -10,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                backgroundColor: "#f8f9fa",
              }}
            >
              <ClipboardCheck className="feature-box-icon" />
              <div className="feature-box-text">Conduct Inspections & Collect Data</div>
            </motion.div>
            <motion.div
              className="feature-box"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{
                y: -10,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                backgroundColor: "#f8f9fa",
              }}
            >
              <BarChart3 className="feature-box-icon" />
              <div className="feature-box-text">Analyze & Take Action</div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section className="reports-section" ref={reportsRef}>
        <div className="reports-content">
          <motion.div
            className="reports-images"
            initial={{ opacity: 0, x: -50 }}
            animate={isReportsInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
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
                    <motion.div
                      className="chart-bar chart-bar-1"
                      initial={{ height: "0%" }}
                      animate={isReportsInView ? { height: "60%" } : {}}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    ></motion.div>
                    <motion.div
                      className="chart-bar chart-bar-2"
                      initial={{ height: "0%" }}
                      animate={isReportsInView ? { height: "85%" } : {}}
                      transition={{ duration: 0.8, delay: 0.7 }}
                    ></motion.div>
                    <motion.div
                      className="chart-bar chart-bar-3"
                      initial={{ height: "0%" }}
                      animate={isReportsInView ? { height: "45%" } : {}}
                      transition={{ duration: 0.8, delay: 0.8 }}
                    ></motion.div>
                    <motion.div
                      className="chart-bar chart-bar-4"
                      initial={{ height: "0%" }}
                      animate={isReportsInView ? { height: "70%" } : {}}
                      transition={{ duration: 0.8, delay: 0.9 }}
                    ></motion.div>
                  </div>
                </div>
                <motion.button className="purple-button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  View Report
                </motion.button>
              </div>
            </div>
            <motion.div
              className="desktop-report-image"
              initial={{ opacity: 0, y: 50 }}
              animate={isReportsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
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
                    <motion.div
                      className="pie-chart"
                      initial={{ rotate: -90 }}
                      animate={isReportsInView ? { rotate: 0 } : {}}
                      transition={{ duration: 1, delay: 0.6 }}
                    >
                      <div className="pie-segment segment-1"></div>
                      <div className="pie-segment segment-2"></div>
                    </motion.div>
                    <div className="data-metrics">
                      <motion.div
                        className="metric"
                        initial={{ opacity: 0 }}
                        animate={isReportsInView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.5, delay: 0.8 }}
                      >
                        <div className="metric-value">87%</div>
                        <div className="metric-label">Compliance</div>
                      </motion.div>
                      <motion.div
                        className="metric"
                        initial={{ opacity: 0 }}
                        animate={isReportsInView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.5, delay: 1 }}
                      >
                        <div className="metric-value">24</div>
                        <div className="metric-label">Issues</div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
              <motion.div className="share-button" whileHover={{ scale: 1.1, y: -2 }}>
                <Share2 size={16} className="share-icon" />
                <span>Share</span>
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.div
            className="reports-text"
            initial={{ opacity: 0, x: 50 }}
            animate={isReportsInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
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
            <motion.button className="learn-more-button" whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }}>
              Learn more <ArrowRight size={16} className="arrow-icon" />
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      <motion.section className="stats-section" ref={statsRef}>
        <motion.h2
          className="stats-title"
          initial={{ opacity: 0, y: 30 }}
          animate={isStatsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Trusted by industry leaders worldwide
        </motion.h2>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-card"
              initial={{ opacity: 0, y: 30 }}
              animate={isStatsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              whileHover={{
                y: -10,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              }}
            >
              <motion.div
                className="stat-value"
                initial={{ scale: 0.8 }}
                animate={isStatsInView ? { scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              >
                {stat.value}
              </motion.div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        <div className="client-logos">
          <motion.div
            className="logo-scroll"
            animate={{ x: [0, -1000] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 20,
              ease: "linear",
            }}
          >
            {[...Array(8)].map((_, i) => (
              <div key={i} className="client-logo">
                <img src={`/placeholder.svg?height=40&width=120`} alt={`Client logo ${i + 1}`} />
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section className="testimonials-section" ref={testimonialsRef}>
        <motion.h2
          className="testimonials-title"
          initial={{ opacity: 0, y: 30 }}
          animate={isTestimonialsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          What our customers say
        </motion.h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="testimonial-card"
              initial={{ opacity: 0, y: 50 }}
              animate={isTestimonialsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
              whileHover={{
                y: -10,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              }}
            >
              <div className="testimonial-content">
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="testimonial-avatar"
                  />
                  <div className="testimonial-info">
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-role">{testimonial.role}</div>
                    <div className="testimonial-company">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section className="app-download-section" ref={appDownloadRef}>
        <div className="app-download-content">
          <motion.div
            className="app-download-text"
            initial={{ opacity: 0, x: -50 }}
            animate={isAppDownloadInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="app-download-title">Scan the QR code to download the app</h2>
            <ul className="app-features-list">
              <motion.li
                className="app-feature"
                initial={{ opacity: 0, x: -20 }}
                animate={isAppDownloadInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Conduct inspections and capture evidence even when offline.
              </motion.li>
              <motion.li
                className="app-feature"
                initial={{ opacity: 0, x: -20 }}
                animate={isAppDownloadInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Personalize and share professional reports.
              </motion.li>
              <motion.li
                className="app-feature"
                initial={{ opacity: 0, x: -20 }}
                animate={isAppDownloadInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                Create and assign tasks to get the job done.
              </motion.li>
              <motion.li
                className="app-feature"
                initial={{ opacity: 0, x: -20 }}
                animate={isAppDownloadInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                Report issues and notify your team instantly.
              </motion.li>
              <motion.li
                className="app-feature"
                initial={{ opacity: 0, x: -20 }}
                animate={isAppDownloadInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Manage your assets and operations, all in one place.
              </motion.li>
              <motion.li
                className="app-feature"
                initial={{ opacity: 0, x: -20 }}
                animate={isAppDownloadInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                Onboard, train and upskill on the job.
              </motion.li>
            </ul>
            <div className="app-store-buttons">
              <motion.a
                href="#"
                className="app-store-button"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="store-badge">
                  <div className="apple-icon"></div>
                  <span className="store-icon">
                    <span className="store-prefix">Download on the</span>
                    <span className="store-name">App Store</span>
                  </span>
                </div>
              </motion.a>
              <motion.a
                href="#"
                className="google-play-button"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="store-badge">
                  <div className="play-icon">
                    <div className="play-triangle"></div>
                  </div>
                  <span className="store-icon">
                    <span className="store-prefix">GET IT ON</span>
                    <span className="store-name">Google Play</span>
                  </span>
                </div>
              </motion.a>
            </div>
          </motion.div>
          <motion.div
            className="qr-code-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isAppDownloadInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="company-logo-large"></div>
            <motion.div
              className="qr-code"
              whileHover={{
                boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
                y: -5,
              }}
            >
              <div className="qr-code-placeholder">
                <QrCode size={120} className="placeholder-qr-icon" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section className="faq-section" ref={faqRef}>
        <motion.h2
          className="faq-title"
          initial={{ opacity: 0, y: 30 }}
          animate={isFaqInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Frequently Asked Questions
        </motion.h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className={`faq-item ${activeAccordion === index ? "active" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={isFaqInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <button
                className="faq-question"
                onClick={() => toggleAccordion(index)}
                aria-expanded={activeAccordion === index}
              >
                {faq.question}
                <motion.div
                  className="faq-icon"
                  animate={{ rotate: activeAccordion === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={20} />
                </motion.div>
              </button>
              <AnimatePresence>
                {activeAccordion === index && (
                  <motion.div
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section className="cta-section">
        <motion.h2
          className="cta-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Perform inspections, identify problems,
          <br />
          track tasks and communicate effectively.
        </motion.h2>
        <motion.button
          className="cta-button"
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Get started for free
        </motion.button>
      </motion.section>

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
            <motion.a
              href="#"
              className="social-icon"
              aria-label="Twitter"
              whileHover={{ y: -5, backgroundColor: "#e0e0e0" }}
            >
              <img src="/placeholder.svg?height=20&width=20" alt="Twitter" />
            </motion.a>
            <motion.a
              href="#"
              className="social-icon"
              aria-label="LinkedIn"
              whileHover={{ y: -5, backgroundColor: "#e0e0e0" }}
            >
              <img src="/placeholder.svg?height=20&width=20" alt="LinkedIn" />
            </motion.a>
            <motion.a
              href="#"
              className="social-icon"
              aria-label="Facebook"
              whileHover={{ y: -5, backgroundColor: "#e0e0e0" }}
            >
              <img src="/placeholder.svg?height=20&width=20" alt="Facebook" />
            </motion.a>
            <motion.a
              href="#"
              className="social-icon"
              aria-label="Instagram"
              whileHover={{ y: -5, backgroundColor: "#e0e0e0" }}
            >
              <img src="/placeholder.svg?height=20&width=20" alt="Instagram" />
            </motion.a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home2
