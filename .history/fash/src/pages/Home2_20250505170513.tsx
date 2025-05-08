"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Check,
  Zap,
  Shield,
  BarChart3,
  Clock,
  FileCheck,
  Smartphone,
  PenTool,
  Users,
  Building,
  Car,
  Clipboard,
  CheckCircle2,
  AlertTriangle,
  Wrench,
} from "lucide-react"
import "./Home2.css"

const Home2 = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [currentBg, setCurrentBg] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  // Background images for header
  const bgImages = [
    "/placeholder.svg?height=800&width=1600",
    "/placeholder.svg?height=800&width=1600",
    "/placeholder.svg?height=800&width=1600",
  ]

  // Tabs for features section
  const tabs = [
    {
      title: "Template Builder",
      icon: <PenTool size={20} />,
      contentTitle: "Intuitive Drag-and-Drop Template Builder",
      description:
        "Create any checklist or form you need. Utilize diverse question types (text, number, multiple-choice, signature, photo, GPS), add conditional logic, scoring, mandatory fields, and instructional media.",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      title: "Mobile Inspections",
      icon: <Smartphone size={20} />,
      contentTitle: "Powerful Mobile Inspection App",
      description:
        "The easy-to-use app for iOS & Android ensures seamless inspections. Works flawlessly offline, allows rich data capture (annotated photos, notes), and provides access to relevant templates anytime.",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      title: "Instant Reporting",
      icon: <FileCheck size={20} />,
      contentTitle: "Automated Inspection Reporting",
      description:
        "Forget manual report writing. Generate customizable PDF or web reports instantly after each inspection. Visualize data, track completion rates, and identify trends on dashboards.",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      title: "Findings & Actions",
      icon: <AlertTriangle size={20} />,
      contentTitle: "Integrated Findings & Action Tracking",
      description:
        "Flag issues or non-conformances directly within an inspection. Assign corrective actions with deadlines and track their status to ensure prompt resolution, all linked back to the original inspection.",
      image: "/placeholder.svg?height=400&width=600",
    },
  ]

  // Stats for metrics section
  const stats = [
    { value: "90%", label: "Faster Template Creation & Updates" },
    { value: "50%", label: "Reduction in Inspection Time" },
    { value: "100%", label: "Data Consistency Across Inspections" },
    { value: "Instant", label: "Access to Completed Reports" },
  ]

  // Industries for use cases section
  const industries = [
    { icon: <Shield size={24} />, title: "Safety Walkthroughs & Audits" },
    { icon: <CheckCircle2 size={24} />, title: "Quality Assurance Checklists" },
    { icon: <Wrench size={24} />, title: "Preventative Maintenance Forms" },
    { icon: <Car size={24} />, title: "Vehicle & Equipment Inspections" },
    { icon: <Building size={24} />, title: "Facility & Site Inspections" },
    { icon: <Clipboard size={24} />, title: "Regulatory Compliance Audits" },
    { icon: <Users size={24} />, title: "Training Assessments & Sign-offs" },
    { icon: <BarChart3 size={24} />, title: "Inventory & Stock Checks" },
  ]

  // Testimonials
  const testimonials = [
    {
      quote:
        "Creating and updating our complex safety checklists used to take days. With Fashcognitive, we can build and deploy new templates in under an hour. It's incredibly intuitive.",
      name: "John Davis",
      role: "EHS Manager",
      company: "Construction Group Ltd.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      quote:
        "Our inspectors love the mobile app. It guides them through the process, works offline perfectly, and the instant reports have drastically cut down admin time back in the office.",
      name: "Maria Garcia",
      role: "Quality Assurance Lead",
      company: "Food Processing Co.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      quote:
        "The template builder is so flexible that we've been able to digitize every single inspection process in our organization. The ROI has been incredible.",
      name: "Robert Chen",
      role: "Operations Director",
      company: "Global Manufacturing Inc.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ]

  // FAQs
  const faqs = [
    {
      question: "What types of questions/fields can I add to templates?",
      answer:
        "Fashcognitive supports a wide range of field types including text, number, multiple choice, checkboxes, dropdown menus, date/time pickers, photo capture with annotation, signature fields, GPS location, barcode/QR scanning, and scoring fields. You can also add instructional text, images, or videos to guide inspectors.",
    },
    {
      question: "How are templates shared and updated for field users?",
      answer:
        "Templates are centrally managed in the cloud. When you publish a new template or update an existing one, it's automatically synced to all users' mobile devices the next time they connect to the internet. Version control ensures everyone is always using the latest template version.",
    },
    {
      question: "Does the mobile app work without an internet connection?",
      answer:
        "Yes, the Fashcognitive mobile app is designed to work completely offline. Users can download templates when connected, conduct inspections without internet access, and all data is securely stored on the device until they reconnect, at which point it automatically syncs to the cloud.",
    },
    {
      question: "Can I generate different report formats from inspections?",
      answer:
        "Absolutely. Fashcognitive offers customizable PDF reports with your branding, web-based interactive reports, and raw data exports in CSV or Excel format. You can create multiple report templates for different audiences or purposes from the same inspection data.",
    },
    {
      question: "How are findings or failed items handled during an inspection?",
      answer:
        "When an inspector identifies an issue during an inspection, they can flag it as a finding, add photos and notes, assign a severity level, and create an action item directly from that finding. These actions can be assigned to team members with due dates and tracked to completion.",
    },
    {
      question: "Is there a limit to the number of templates or inspections?",
      answer:
        "Our Professional and Enterprise plans include unlimited templates and inspections. The Starter plan includes up to 10 templates and 100 inspections per month. All plans can be upgraded as your needs grow.",
    },
  ]

  // Background image rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Intersection Observer for animations
  const useOnScreen = (options = {}) => {

  // Refs for scroll animations
  const [heroRef, heroVisible] = useOnScreen({ threshold: 0.1 })
  const [featuresRef, featuresVisible] = useOnScreen({ threshold: 0.1 })
  const [statsRef, statsVisible] = useOnScreen({ threshold: 0.1 })
  const [templateRef, templateVisible] = useOnScreen({ threshold: 0.1 })
  const [mobileRef, mobileVisible] = useOnScreen({ threshold: 0.1 })
  const [industriesRef, industriesVisible] = useOnScreen({ threshold: 0.1 })
  const [testimonialsRef, testimonialsVisible] = useOnScreen({ threshold: 0.1 })
  const [ctaRef, ctaVisible] = useOnScreen({ threshold: 0.1 })

  return (
    <div className="fashcognitive-container">
      {/* Header with animated background */}
      <header className={`header ${isScrolled ? "scrolled" : ""}`}>
        <div className="header-bg-container">
          {bgImages.map((img, index) => (
            <div
              key={index}
              className={`header-bg ${currentBg === index ? "active" : ""}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
          <div className="header-overlay" />
        </div>

        <div className="header-content">
          <div className="logo">
            <span className="logo-text">FASHCOGNITIVE</span>
          </div>

          <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <nav className={`main-nav ${isMenuOpen ? "open" : ""}`}>
            <ul className="nav-list">
              <li className="nav-item">
                <a href="#features" className="nav-link">
                  Features <ChevronDown size={16} />
                </a>
                <div className="dropdown-menu">
                  <a href="#template-builder" className="dropdown-item">
                    Template Builder
                  </a>
                  <a href="#mobile-app" className="dropdown-item">
                    Mobile App
                  </a>
                  <a href="#reporting" className="dropdown-item">
                    Reporting
                  </a>
                  <a href="#actions" className="dropdown-item">
                    Action Tracking
                  </a>
                </div>
              </li>
              <li className="nav-item">
                <a href="#templates" className="nav-link">
                  Templates
                </a>
              </li>
              <li className="nav-item">
                <a href="#pricing" className="nav-link">
                  Pricing
                </a>
              </li>
              <li className="nav-item">
                <a href="#resources" className="nav-link">
                  Resources <ChevronDown size={16} />
                </a>
                <div className="dropdown-menu">
                  <a href="#blog" className="dropdown-item">
                    Blog
                  </a>
                  <a href="#guides" className="dropdown-item">
                    Guides
                  </a>
                  <a href="#support" className="dropdown-item">
                    Support
                  </a>
                </div>
              </li>
              <li className="nav-item">
                <a href="#contact" className="nav-link">
                  Contact Us
                </a>
              </li>
            </ul>

            <div className="nav-buttons">
              <a href="#login" className="btn btn-outline">
                Log In
              </a>
              <a href="#signup" className="btn btn-primary">
                Start Free
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={heroVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="hero-title">
              Build Smarter Checklists.
              <br />
              Conduct Flawless Inspections.
            </h1>
            <p className="hero-subtitle">
              The intuitive platform for rapidly creating powerful, dynamic inspection templates and empowering your
              teams to execute thorough checks anywhere, capture critical data accurately, and generate instant reports.
            </p>
            <div className="hero-buttons">
              <a href="#start" className="btn btn-primary btn-lg">
                Start Building Templates Free
              </a>
              <a href="#demo" className="btn btn-outline btn-lg">
                See Inspection Features
              </a>
            </div>
          </motion.div>

          <motion.div
            className="hero-image"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={heroVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Image
              src="/placeholder.svg?height=600&width=800"
              alt="Template to Mobile Inspection"
              width={800}
              height={600}
              className="hero-img"
            />
          </motion.div>
        </div>

        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="problems-section">
        <div className="container">
          <h2 className="section-title">Escape Inspection Frustrations</h2>

          <div className="problems-grid">
            <motion.div
              className="problem-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="problem-icon">
                <Clipboard size={32} />
              </div>
              <h3 className="problem-title">Static, Inflexible Paper or PDF Checklists?</h3>
              <p className="problem-text">
                Design dynamic digital templates in minutes with drag-and-drop ease. Add logic, scoring, photos,
                signatures, and more – update instantly across all devices.
              </p>
            </motion.div>

            <motion.div
              className="problem-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="problem-icon">
                <AlertTriangle size={32} />
              </div>
              <h3 className="problem-title">Inconsistent Data During Inspections?</h3>
              <p className="problem-text">
                Ensure standardized, accurate data capture every time with required fields, conditional logic, and
                uniform templates pushed directly to the mobile app.
              </p>
            </motion.div>

            <motion.div
              className="problem-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="problem-icon">
                <Clock size={32} />
              </div>
              <h3 className="problem-title">Hours Spent Compiling Inspection Reports?</h3>
              <p className="problem-text">
                Generate comprehensive, professional reports automatically the moment an inspection is completed. Share
                instantly with stakeholders.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="workflow-section">
        <div className="container">
          <h2 className="section-title">Your Inspection Workflow, Simplified</h2>

          <div className="workflow-steps">
            <motion.div
              className="workflow-step"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="step-number">1</div>
              <div className="step-icon">
                <PenTool size={32} />
              </div>
              <h3 className="step-title">Build</h3>
              <p className="step-text">
                Craft intelligent inspection templates effortlessly using our powerful, user-friendly builder. Add
                various field types and logic.
              </p>
            </motion.div>

            <div className="step-connector"></div>

            <motion.div
              className="workflow-step"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="step-number">2</div>
              <div className="step-icon">
                <Smartphone size={32} />
              </div>
              <h3 className="step-title">Inspect</h3>
              <p className="step-text">
                Conduct thorough inspections anywhere using the intuitive mobile app – even offline. Capture rich data
                quickly and easily.
              </p>
            </motion.div>

            <div className="step-connector"></div>

            <motion.div
              className="workflow-step"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="step-number">3</div>
              <div className="step-icon">
                <FileCheck size={32} />
              </div>
              <h3 className="step-title">Report</h3>
              <p className="step-text">
                Access detailed inspection reports instantly upon completion. Analyze performance with real-time
                dashboards.
              </p>
            </motion.div>

            <div className="step-connector"></div>

            <motion.div
              className="workflow-step"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <div className="step-number">4</div>
              <div className="step-icon">
                <Zap size={32} />
              </div>
              <h3 className="step-title">Act</h3>
              <p className="step-text">
                Identify findings during inspections and assign corrective actions directly within the app for seamless
                follow-up.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Tabs Section */}
      <section className="features-section" id="features" ref={featuresRef}>
        <div className="container">
          <h2 className="section-title">Powering Your Inspections: Key Features</h2>

          <div className="features-tabs">
            <div className="tabs-nav">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  className={`tab-button ${activeTab === index ? "active" : ""}`}
                  onClick={() => setActiveTab(index)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-text">{tab.title}</span>
                </button>
              ))}
            </div>

            <div className="tabs-content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  className="tab-panel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="tab-content">
                    <h3 className="tab-title">{tabs[activeTab].contentTitle}</h3>
                    <p className="tab-description">{tabs[activeTab].description}</p>
                    <a href="#learn-more" className="btn btn-outline btn-sm">
                      Learn More <ArrowRight size={16} />
                    </a>
                  </div>
                  <div className="tab-image">
                    <Image
                      src={tabs[activeTab].image || "/placeholder.svg"}
                      alt={tabs[activeTab].title}
                      width={600}
                      height={400}
                      className="feature-img"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section" ref={statsRef}>
        <div className="container">
          <h2 className="section-title">Impact of Smarter Templates & Inspections</h2>

          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              >
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Template Builder Feature */}
      <section className="template-feature" id="template-builder" ref={templateRef}>
        <div className="container">
          <div className="feature-content">
            <motion.div
              className="feature-text"
              initial={{ opacity: 0, x: -50 }}
              animate={templateVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 className="feature-title">Build Intelligence Into Your Checklists</h2>
              <p className="feature-description">
                Go beyond simple yes/no questions. Fashcognitive's template builder lets you implement sophisticated
                logic. Make questions appear based on previous answers, calculate risk scores automatically, assign
                weights, and guide inspectors through complex procedures.
              </p>
              <ul className="feature-list">
                <li className="feature-item">
                  <Check size={20} className="check-icon" />
                  <span>Dynamic conditional logic (if/then)</span>
                </li>
                <li className="feature-item">
                  <Check size={20} className="check-icon" />
                  <span>Automated scoring and weighting</span>
                </li>
                <li className="feature-item">
                  <Check size={20} className="check-icon" />
                  <span>Embed instructional text, images, or videos</span>
                </li>
                <li className="feature-item">
                  <Check size={20} className="check-icon" />
                  <span>Reusable template sections and version control</span>
                </li>
              </ul>
              <a href="#template-demo" className="btn btn-primary">
                See Template Builder Demo
              </a>
            </motion.div>

            <motion.div
              className="feature-image"
              initial={{ opacity: 0, x: 50 }}
              animate={templateVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Template Builder"
                width={600}
                height={500}
                className="template-img"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile App Feature */}
      <section className="mobile-feature" id="mobile-app" ref={mobileRef}>
        <div className="container">
          <div className="feature-content reverse">
            <motion.div
              className="feature-image"
              initial={{ opacity: 0, x: -50 }}
              animate={mobileVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Mobile App"
                width={600}
                height={500}
                className="mobile-img"
              />
            </motion.div>

            <motion.div
              className="feature-text"
              initial={{ opacity: 0, x: 50 }}
              animate={mobileVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="feature-title">Capture Rich, Actionable Data from the Field</h2>
              <p className="feature-description">
                Empower your inspectors to capture more than just text. The Fashcognitive mobile app allows for
                attaching annotated photos, collecting signatures, recording precise GPS locations, scanning barcodes,
                and adding detailed notes – all within the inspection form, even offline.
              </p>
              <ul className="feature-list">
                <li className="feature-item">
                  <Check size={20} className="check-icon" />
                  <span>High-resolution photo capture with annotation tools</span>
                </li>
                <li className="feature-item">
                  <Check size={20} className="check-icon" />
                  <span>Digital signature collection for sign-offs</span>
                </li>
                <li className="feature-item">
                  <Check size={20} className="check-icon" />
                  <span>Automatic GPS stamping (optional)</span>
                </li>
                <li className="feature-item">
                  <Check size={20} className="check-icon" />
                  <span>Seamless offline data storage and sync</span>
                </li>
              </ul>
              <a href="#mobile-demo" className="btn btn-primary">
                See Mobile App Demo
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="industries-section" ref={industriesRef}>
        <div className="container">
          <h2 className="section-title">Inspection Templates for Every Need</h2>

          <div className="industries-grid">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                className="industry-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{
                  y: -10,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  backgroundColor: "#f8f9ff",
                }}
              >
                <div className="industry-icon">{industry.icon}</div>
                <h3 className="industry-title">{industry.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" ref={testimonialsRef}>
        <div className="container">
          <h2 className="section-title">Trusted for Critical Inspections Globally</h2>

          <div className="logos-row">
            {[1, 2, 3, 4, 5].map((logo) => (
              <div key={logo} className="logo-item">
                <Image
                  src={`/placeholder.svg?height=60&width=120&text=LOGO${logo}`}
                  alt={`Client Logo ${logo}`}
                  width={120}
                  height={60}
                  className="client-logo"
                />
              </div>
            ))}
          </div>

          <div className="testimonials-slider">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="testimonial-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <div className="testimonial-content">
                  <div className="quote-mark">"</div>
                  <p className="testimonial-quote">{testimonial.quote}</p>
                  <div className="testimonial-author">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={60}
                      height={60}
                      className="author-avatar"
                    />
                    <div className="author-info">
                      <h4 className="author-name">{testimonial.name}</h4>
                      <p className="author-role">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2 className="section-title">Your Questions About Templates & Inspections</h2>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className={`faq-item ${activeFaq === index ? "active" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <button className="faq-question" onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                  <span>{faq.question}</span>
                  <ChevronDown size={20} className={`faq-icon ${activeFaq === index ? "rotate" : ""}`} />
                </button>
                <AnimatePresence>
                  {activeFaq === index && (
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" ref={ctaRef}>
        <div className="container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            animate={ctaVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="cta-title">Ready to Revolutionize Your Inspection Process?</h2>
            <p className="cta-text">
              Stop wrestling with paper and clunky software. Build intelligent templates and empower your team with
              efficient mobile inspections using Fashcognitive.
            </p>
            <div className="cta-buttons">
              <a href="#start-free" className="btn btn-primary btn-lg">
                Start Building Templates Free
              </a>
              <a href="#request-demo" className="btn btn-outline btn-lg">
                Request a Demo
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-logo">
              <span className="logo-text">FASHCOGNITIVE</span>
              <p className="footer-tagline">Build Smart Checklists. Conduct Flawless Inspections.</p>
            </div>

            <div className="footer-columns">
              <div className="footer-column">
                <h3 className="footer-heading">Product</h3>
                <ul className="footer-links">
                  <li>
                    <a href="#template-builder">Template Builder</a>
                  </li>
                  <li>
                    <a href="#mobile-app">Mobile Inspections</a>
                  </li>
                  <li>
                    <a href="#reporting">Reporting</a>
                  </li>
                  <li>
                    <a href="#actions">Action Tracking</a>
                  </li>
                  <li>
                    <a href="#pricing">Pricing</a>
                  </li>
                </ul>
              </div>

              <div className="footer-column">
                <h3 className="footer-heading">Resources</h3>
                <ul className="footer-links">
                  <li>
                    <a href="#blog">Blog</a>
                  </li>
                  <li>
                    <a href="#guides">Guides</a>
                  </li>
                  <li>
                    <a href="#webinars">Webinars</a>
                  </li>
                  <li>
                    <a href="#case-studies">Case Studies</a>
                  </li>
                  <li>
                    <a href="#help-center">Help Center</a>
                  </li>
                </ul>
              </div>

              <div className="footer-column">
                <h3 className="footer-heading">Company</h3>
                <ul className="footer-links">
                  <li>
                    <a href="#about">About Us</a>
                  </li>
                  <li>
                    <a href="#careers">Careers</a>
                  </li>
                  <li>
                    <a href="#contact">Contact</a>
                  </li>
                  <li>
                    <a href="#partners">Partners</a>
                  </li>
                  <li>
                    <a href="#legal">Legal</a>
                  </li>
                </ul>
              </div>

              <div className="footer-column">
                <h3 className="footer-heading">Connect</h3>
                <div className="social-links">
                  <a href="#twitter" className="social-link">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                  </a>
                  <a href="#linkedin" className="social-link">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                  <a href="#facebook" className="social-link">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </a>
                  <a href="#instagram" className="social-link">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                </div>
                <div className="newsletter">
                  <h4 className="newsletter-title">Subscribe to our newsletter</h4>
                  <form className="newsletter-form">
                    <input type="email" placeholder="Your email" className="newsletter-input" />
                    <button type="submit" className="newsletter-button">
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="copyright">© 2025 Fashcognitive, Inc. All rights reserved.</p>
            <div className="legal-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home2
