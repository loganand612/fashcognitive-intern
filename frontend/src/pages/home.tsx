"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  ArrowUpRight,
  MousePointer,
  ChevronRight,
  Star,
  Award,
  Sparkles,
} from "lucide-react"
import "../pages/Home2.css"

// Import Streamlineer QC images
import Streamlineer_QC_1 from "../assets/img/Streamlineer_QC_1.png"
import Streamlineer_QC_2 from "../assets/img/Streamlineer_QC_2.png"
import Streamlineer_QC_3 from "../assets/img/Streamlineer_QC_3.png"
import Streamlineer_QC_4 from "../assets/img/Streamlineer_QC_4.png"
import Streamlineer_QC_5 from "../assets/img/Streamlineer_QC_5.png"
import DG from "../assets/img/DG.png"
import TM from "../assets/img/TM.png"
import RP from "../assets/img/RP.png"
import NX from "../assets/img/NX.png"
import HX from "../assets/img/HX.png"
import AZ from "../assets/img/AZ.png"

// Custom Image component to replace Next.js Image
const Image = ({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}) => {
  return (
    <img
      src={src || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  )
}

const Home2: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [currentBg, setCurrentBg] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cursorRef = useRef<HTMLDivElement>(null)

  // Background images for header
  const bgImages = [
    Streamlineer_QC_1,
    Streamlineer_QC_2,
    Streamlineer_QC_3,
    Streamlineer_QC_4,
    Streamlineer_QC_5,
  ]

  // Tabs for features section
  const tabs = [
    {
      title: "Template Builder",
      icon: <PenTool size={20} />,
      contentTitle: "Intuitive Drag-and-Drop Template Builder",
      description:
        "Create any checklist or form you need. Utilize diverse question types (text, number, multiple-choice, signature, photo, GPS), add conditional logic, scoring, mandatory fields, and instructional media.",
      image: DG,
    },
    {
      title: "Mobile Inspections",
      icon: <Smartphone size={20} />,
      contentTitle: "Powerful Mobile Inspection App",
      description:
        "The easy-to-use app for iOS & Android ensures seamless inspections. Works flawlessly offline, allows rich data capture (annotated photos, notes), and provides access to relevant templates anytime.",
      image: TM,
    },
    {
      title: "Instant Reporting",
      icon: <FileCheck size={20} />,
      contentTitle: "Automated Inspection Reporting",
      description:
        "Forget manual report writing. Generate customizable PDF or web reports instantly after each inspection. Visualize data, track completion rates, and identify trends on dashboards.",
      image: RP,
    },
    {
      title: "Findings & Actions",
      icon: <AlertTriangle size={20} />,
      contentTitle: "Integrated Findings & Action Tracking",
      description:
        "Flag issues or non-conformances directly within an inspection. Assign corrective actions with deadlines and track their status to ensure prompt resolution, all linked back to the original inspection.",
      image: NX,
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



  // FAQs
  const faqs = [
    {
      question: "What types of questions/fields can I add to templates?",
      answer:
        "StreamLineer supports a wide range of field types including text, number, multiple choice, checkboxes, dropdown menus, date/time pickers, photo capture with annotation, signature fields, GPS location, barcode/QR scanning, and scoring fields. You can also add instructional text, images, or videos to guide inspectors.",
    },
    {
      question: "How are templates shared and updated for field users?",
      answer:
        "Templates are centrally managed in the cloud. When you publish a new template or update an existing one, it's automatically synced to all users' mobile devices the next time they connect to the internet. Version control ensures everyone is always using the latest template version.",
    },
    {
      question: "Does the mobile app work without an internet connection?",
      answer:
        "Yes, the StreamLineer mobile app is designed to work completely offline. Users can download templates when connected, conduct inspections without internet access, and all data is securely stored on the device until they reconnect, at which point it automatically syncs to the cloud.",
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

  // Workflow steps with enhanced content
  const workflowSteps = [
    {
      number: 1,
      icon: <PenTool size={32} />,
      title: "Build",
      description:
        "Craft intelligent inspection templates effortlessly using our powerful, user-friendly builder. Add various field types and logic.",
      color: "#4895ef",
      highlights: ["Drag-and-drop interface", "Conditional logic", "Multiple question types", "Template versioning"],
    },
    {
      number: 2,
      icon: <Smartphone size={32} />,
      title: "Inspect",
      description:
        "Conduct thorough inspections anywhere using the intuitive mobile app – even offline. Capture rich data quickly and easily.",
      color: "#3a7bc8",
      highlights: ["Works offline", "Photo annotations", "GPS location tracking", "Digital signatures"],
    },
    {
      number: 3,
      icon: <FileCheck size={32} />,
      title: "Report",
      description:
        "Access detailed inspection reports instantly upon completion. Analyze performance with real-time dashboards.",
      color: "#4cc9f0",
      highlights: ["Instant PDF generation", "Custom report templates", "Data visualization", "Export options"],
    },
    {
      number: 4,
      icon: <Zap size={32} />,
      title: "Act",
      description:
        "Identify findings during inspections and assign corrective actions directly within the app for seamless follow-up.",
      color: "#3f37c9",
      highlights: ["Action assignment", "Due date tracking", "Notification system", "Completion verification"],
    },
  ]

  // Background image rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [bgImages.length])

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

  // Mouse move effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      setMousePosition({ x: clientX, y: clientY })

      // Update custom cursor position
      if (cursorRef.current) {
        cursorRef.current.style.left = `${clientX}px`
        cursorRef.current.style.top = `${clientY}px`
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Intersection Observer for animations
  const useOnScreen = (options = {}) => {
    const ref = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        setIsVisible(entry.isIntersecting)
      }, options)

      if (ref.current) {
        observer.observe(ref.current)
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current)
        }
      }
    }, [ref, options])

    return [ref, isVisible] as const
  }

  // Refs for scroll animations
  const [heroRef, heroVisible] = useOnScreen({ threshold: 0.1 })
  const [workflowRef, workflowVisible] = useOnScreen({ threshold: 0.1 })
  const [featuresRef, featuresVisible] = useOnScreen({ threshold: 0.1 })
  const [statsRef, statsVisible] = useOnScreen({ threshold: 0.1 })
  const [templateRef, templateVisible] = useOnScreen({ threshold: 0.1 })
  const [mobileRef, mobileVisible] = useOnScreen({ threshold: 0.1 })
  const [industriesRef, industriesVisible] = useOnScreen({ threshold: 0.1 })
  const [ctaRef, ctaVisible] = useOnScreen({ threshold: 0.1 })

  // Custom cursor state management
  const [cursorVariant, setCursorVariant] = useState("default")

  // Function to enter button cursor state
  const enterButton = () => setCursorVariant("button")
  // Function to enter link cursor state
  const enterLink = () => setCursorVariant("link")
  // Function to reset cursor state
  const leaveHover = () => setCursorVariant("default")

  // Apply 3D tilt effect to an element
  const applyTiltEffect = (element: HTMLElement, mouseX: number, mouseY: number) => {
    if (!element) return

    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const rotateY = ((mouseX - centerX) / (window.innerWidth / 2)) * 5
    const rotateX = ((centerY - mouseY) / (window.innerHeight / 2)) * 5

    element.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`
  }

  // Apply tilt effect to hero image
  useEffect(() => {
    const heroImage = document.querySelector(".Home2-hero-image-container") as HTMLElement
    const templateImage = document.querySelector(".Home2-template-img-container") as HTMLElement
    const mobileImage = document.querySelector(".Home2-mobile-img-container") as HTMLElement

    if (heroImage && heroVisible) {
      applyTiltEffect(heroImage, mousePosition.x, mousePosition.y)
    }

    if (templateImage && templateVisible) {
      applyTiltEffect(templateImage, mousePosition.x, mousePosition.y)
    }

    if (mobileImage && mobileVisible) {
      applyTiltEffect(mobileImage, mousePosition.x, mousePosition.y)
    }
  }, [mousePosition, heroVisible, templateVisible, mobileVisible])

  // Initialize floating elements animation
  useEffect(() => {
    const floatingElements = document.querySelectorAll(".Home2-floating-element")

    floatingElements.forEach((element, index) => {
      const el = element as HTMLElement
      const duration = 6 + index * 2
      const delay = index * 0.5

      // Set initial animation properties
      el.style.animation = `float ${duration}s ease-in-out ${delay}s infinite alternate`
    })
  }, [])

  // Initialize scroll animations
  useEffect(() => {
    const animateOnScroll = () => {
      const elements = document.querySelectorAll(".Home2-animate-on-scroll")

      elements.forEach((element) => {
        const el = element as HTMLElement
        const rect = el.getBoundingClientRect()

        if (rect.top < window.innerHeight * 0.8) {
          el.classList.add("Home2-animate-in")
        }
      })
    }

    window.addEventListener("scroll", animateOnScroll)
    animateOnScroll() // Run once on mount

    return () => window.removeEventListener("scroll", animateOnScroll)
  }, [])

  // Initialize progress indicators for workflow steps
  useEffect(() => {
    if (workflowVisible) {
      const progressIndicators = document.querySelectorAll(".Home2-step-progress-indicator")

      progressIndicators.forEach((indicator, index) => {
        const el = indicator as HTMLElement
        setTimeout(
          () => {
            el.style.width = "100%"
          },
          300 + index * 200,
        )
      })
    }
  }, [workflowVisible])

  // FAQ animation
  const toggleFaq = (index: number) => {
    // Toggle the active FAQ without hiding any questions
    if (activeFaq === index) {
      setActiveFaq(null)
    } else {
      setActiveFaq(index)
    }

    // Ensure all FAQ items remain visible after a short delay
    setTimeout(() => {
      const faqItems = document.querySelectorAll('.Home2-faq-item')
      faqItems.forEach(item => {
        const element = item as HTMLElement
        element.style.opacity = '1'
        element.style.visibility = 'visible'
        element.style.display = 'block'
      })

      const faqQuestions = document.querySelectorAll('.Home2-faq-question')
      faqQuestions.forEach(question => {
        const element = question as HTMLElement
        element.style.opacity = '1'
        element.style.visibility = 'visible'
      })
    }, 50)
  }

  return (
    <div className="Home2-streamlineer-container">
      {/* Custom cursor */}
      <div ref={cursorRef} className={`Home2-custom-cursor ${cursorVariant === "button" ? "Home2-button" : cursorVariant === "link" ? "Home2-link" : ""}`}>
        <MousePointer size={12} />
      </div>

      {/* Header with animated background */}
      <header className={`Home2-header ${isScrolled ? "Home2-scrolled" : ""}`}>
        <div className="Home2-header-content">
          <div className="Home2-logo">
            <span className="Home2-logo-text">STREAMLINEER</span>
          </div>

          <button
            className="Home2-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onMouseEnter={enterButton}
            onMouseLeave={leaveHover}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <nav className={`Home2-main-nav ${isMenuOpen ? "Home2-open" : ""}`}>
            <ul className="Home2-nav-list">
              <li className="Home2-nav-item">
                <a href="#features" className="Home2-nav-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                  Features <ChevronDown size={16} />
                </a>
                <div className="Home2-dropdown-menu">
                  <a href="#template-builder" className="Home2-dropdown-item">
                    Template Builder
                  </a>
                  <a href="#mobile-app" className="Home2-dropdown-item">
                    Mobile App
                  </a>
                  <a href="#reporting" className="Home2-dropdown-item">
                    Reporting
                  </a>
                  <a href="#actions" className="Home2-dropdown-item">
                    Action Tracking
                  </a>
                </div>
              </li>
              <li className="Home2-nav-item">
                <a href="#templates" className="Home2-nav-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                  Templates
                </a>
              </li>
              <li className="Home2-nav-item">
                <a href="#pricing" className="Home2-nav-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                  Pricing
                </a>
              </li>
              <li className="Home2-nav-item">
                <a href="#resources" className="Home2-nav-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                  Resources <ChevronDown size={16} />
                </a>
                <div className="Home2-dropdown-menu">
                  <a href="#blog" className="Home2-dropdown-item">
                    Blog
                  </a>
                  <a href="#guides" className="Home2-dropdown-item">
                    Guides
                  </a>
                  <a href="#support" className="Home2-dropdown-item">
                    Support
                  </a>
                </div>
              </li>
              <li className="Home2-nav-item">
                <a href="#contact" className="Home2-nav-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                  Contact Us
                </a>
              </li>
            </ul>

            <div className="Home2-nav-buttons">
              <a href="login" className="Home2-btn Home2-btn-outline" onMouseEnter={enterButton} onMouseLeave={leaveHover}>
                Log In
              </a>
              <a href="register" className="Home2-btn Home2-btn-primary" onMouseEnter={enterButton} onMouseLeave={leaveHover}>
                Start Free
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="Home2-hero-section" ref={heroRef}>
        <div className="Home2-container">
          <div className="Home2-hero-flex">
            <div className={`Home2-hero-content ${heroVisible ? "Home2-animate-in" : ""}`}>
              <h1 className="Home2-hero-title">
                Build Smarter
                <br />
                Checklists<span className="Home2-accent-dot">.</span>
                <br />
                Conduct Flawless
                <br />
                Inspections<span className="Home2-accent-dot">.</span>
              </h1>
              <p className="Home2-hero-subtitle">
                The intuitive platform for rapidly creating powerful, dynamic inspection templates and empowering your
                teams to execute thorough checks anywhere, capture critical data accurately, and generate instant
                reports.
              </p>
              <div className="Home2-hero-buttons">
                <a
                  href="register"
                  className="Home2-btn Home2-btn-primary Home2-btn-lg Home2-btn-hover-effect"
                  onMouseEnter={enterButton}
                  onMouseLeave={leaveHover}
                >
                  Start Building Templates Free
                </a>
                <a
                  href="#demo"
                  className="Home2-btn Home2-btn-outline Home2-btn-lg Home2-btn-hover-effect"
                  onMouseEnter={enterButton}
                  onMouseLeave={leaveHover}
                >
                  See Inspection Features
                </a>
              </div>
            </div>

            <div className={`Home2-hero-image-container ${heroVisible ? "Home2-animate-in" : ""}`}>
              <div className="Home2-hero-image-slider">
                {bgImages.map((img, index) => (
                  <div key={index} className={`Home2-hero-slide ${currentBg === index ? "Home2-active" : ""}`}>
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`StreamLineer platform ${index + 1}`}
                      width={600}
                      height={600}
                      className="Home2-hero-img"
                    />
                  </div>
                ))}
              </div>

              {/* Image navigation dots */}
              <div className="Home2-image-nav-dots">
                {bgImages.map((_, index) => (
                  <button
                    key={index}
                    className={`Home2-nav-dot ${currentBg === index ? "Home2-active" : ""}`}
                    onClick={() => setCurrentBg(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed wave position to not hide buttons */}
        <div className="Home2-hero-wave-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="Home2-hero-wave">
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Enhanced Workflow section */}
      <section className="Home2-workflow-section" ref={workflowRef}>
        <div className="Home2-container">
          <div className={`Home2-workflow-header Home2-animate-on-scroll ${workflowVisible ? "Home2-animate-in" : ""}`}>
            <h2 className="Home2-section-title">Your Inspection Workflow, Simplified</h2>
            <p className="Home2-section-subtitle">
              Our streamlined process makes inspections efficient from creation to action
            </p>
          </div>

          <div className="Home2-workflow-steps-container">
            {workflowSteps.map((step, index) => (
              <div
                key={index}
                className={`Home2-workflow-step-card Home2-animate-on-scroll`}
                style={{
                  borderTop: `4px solid ${step.color}`,
                  animationDelay: `${index * 0.15}s`,
                }}
              >
                <div className="Home2-step-number-container">
                  <div className="Home2-step-number" style={{ backgroundColor: step.color }}>
                    {step.number}
                  </div>
                </div>

                <div className="Home2-step-icon-container" style={{ color: step.color }}>
                  {step.icon}
                </div>

                <h3 className="Home2-step-title">{step.title}</h3>

                <p className="Home2-step-description">{step.description}</p>

                <ul className="Home2-step-highlights">
                  {step.highlights.map((highlight, i) => (
                    <li
                      key={i}
                      className="Home2-highlight-item Home2-animate-on-scroll"
                      style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                    >
                      <ChevronRight size={14} style={{ color: step.color }} />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                <div className="Home2-step-progress-indicator" style={{ backgroundColor: step.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Floating elements for visual interest */}
        <div className="Home2-floating-element Home2-element-1">
          <Sparkles size={32} />
        </div>

        <div className="Home2-floating-element Home2-element-2">
          <Star size={24} />
        </div>

        <div className="Home2-floating-element Home2-element-3">
          <Award size={28} />
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="Home2-problems-section">
        <div className="Home2-container">
          <h2 className="Home2-section-title">Escape Inspection Frustrations</h2>

          <div className="Home2-problems-grid">
            {[0, 1, 2].map((index) => (
              <div key={index} className="Home2-problem-card Home2-animate-on-scroll" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="Home2-problem-icon">
                  {index === 0 ? (
                    <Clipboard size={32} />
                  ) : index === 1 ? (
                    <AlertTriangle size={32} />
                  ) : (
                    <Clock size={32} />
                  )}
                </div>
                <h3 className="Home2-problem-title">
                  {index === 0
                    ? "Static, Inflexible Paper or PDF Checklists?"
                    : index === 1
                      ? "Inconsistent Data During Inspections?"
                      : "Hours Spent Compiling Inspection Reports?"}
                </h3>
                <p className="Home2-problem-text">
                  {index === 0
                    ? "Design dynamic digital templates in minutes with drag-and-drop ease. Add logic, scoring, photos, signatures, and more – update instantly across all devices."
                    : index === 1
                      ? "Ensure standardized, accurate data capture every time with required fields, conditional logic, and uniform templates pushed directly to the mobile app."
                      : "Generate comprehensive, professional reports automatically the moment an inspection is completed. Share instantly with stakeholders."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Tabs Section */}
      <section className="Home2-features-section" id="features" ref={featuresRef}>
        <div className="Home2-container">
          <h2 className="Home2-section-title">Powering Your Inspections: Key Features</h2>

          <div className="Home2-features-tabs">
            <div className="Home2-tabs-nav">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  className={`Home2-tab-button ${activeTab === index ? "Home2-active" : ""} Home2-animate-on-scroll`}
                  onClick={() => setActiveTab(index)}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    opacity: 1,
                    visibility: 'visible'
                  }}
                  onMouseEnter={enterButton}
                  onMouseLeave={leaveHover}
                >
                  <span className="Home2-tab-icon">{tab.icon}</span>
                  <span className="Home2-tab-text">{tab.title}</span>
                </button>
              ))}
            </div>

            <div className="Home2-tabs-content">
              <div className="Home2-tab-panel">
                <div className="Home2-tab-content Home2-animate-on-scroll">
                  <h3 className="Home2-tab-title">{tabs[activeTab].contentTitle}</h3>
                  <p className="Home2-tab-description">{tabs[activeTab].description}</p>
                  <a
                    href="#learn-more"
                    className="Home2-btn Home2-btn-outline Home2-btn-sm Home2-btn-hover-effect"
                    onMouseEnter={enterButton}
                    onMouseLeave={leaveHover}
                  >
                    Learn More <ArrowRight size={16} />
                  </a>
                </div>
                <div className="Home2-tab-image Home2-animate-on-scroll">
                  <Image
                    src={tabs[activeTab].image || "/placeholder.svg"}
                    alt={tabs[activeTab].title}
                    width={600}
                    height={400}
                    className="Home2-feature-img"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="Home2-stats-section" ref={statsRef}>
        <div className="Home2-container">
          <h2 className="Home2-section-title">Impact of Smarter Templates & Inspections</h2>

          <div className="Home2-stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="Home2-stat-card Home2-animate-on-scroll" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="Home2-stat-value">{stat.value}</div>
                <div className="Home2-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Template Builder Feature */}
      <section className="Home2-template-feature" id="template-builder" ref={templateRef}>
        <div className="Home2-container">
          <div className="Home2-feature-content">
            <div className={`Home2-feature-text Home2-animate-on-scroll ${templateVisible ? "Home2-animate-in" : ""}`}>
              <h2 className="Home2-feature-title">Build Intelligence Into Your Checklists</h2>
              <p className="Home2-feature-description">
                Go beyond simple yes/no questions. Fashcognitive's template builder lets you implement sophisticated
                logic. Make questions appear based on previous answers, calculate risk scores automatically, assign
                weights, and guide inspectors through complex procedures.
              </p>
              <ul className="Home2-feature-list">
                <li className="Home2-feature-item Home2-animate-on-scroll" style={{ animationDelay: "0.2s" }}>
                  <Check size={20} className="Home2-check-icon" />
                  <span>Dynamic conditional logic (if/then)</span>
                </li>
                <li className="Home2-feature-item Home2-animate-on-scroll" style={{ animationDelay: "0.3s" }}>
                  <Check size={20} className="Home2-check-icon" />
                  <span>Automated scoring and weighting</span>
                </li>
                <li className="Home2-feature-item Home2-animate-on-scroll" style={{ animationDelay: "0.4s" }}>
                  <Check size={20} className="Home2-check-icon" />
                  <span>Embed instructional text, images, or videos</span>
                </li>
                <li className="Home2-feature-item Home2-animate-on-scroll" style={{ animationDelay: "0.5s" }}>
                  <Check size={20} className="Home2-check-icon" />
                  <span>Reusable template sections and version control</span>
                </li>
              </ul>
              <a
                href="#template-demo"
                className="Home2-btn Home2-btn-primary Home2-btn-hover-effect"
                onMouseEnter={enterButton}
                onMouseLeave={leaveHover}
              >
                See Template Builder Demo
              </a>
            </div>

            <div
              className={`Home2-feature-image Home2-template-img-container Home2-animate-on-scroll ${templateVisible ? "Home2-animate-in" : ""}`}
            >
              <Image
                src={HX}
                alt="Template Builder"
                width={600}
                height={500}
                className="Home2-template-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Feature */}
      <section className="Home2-mobile-feature" id="mobile-app" ref={mobileRef}>
        <div className="Home2-container">
          <div className="Home2-feature-content Home2-reverse">
            <div
              className={`Home2-feature-image Home2-mobile-img-container Home2-animate-on-scroll ${mobileVisible ? "Home2-animate-in" : ""}`}
            >
              <Image
                src={AZ}
                alt="Mobile App"
                width={600}
                height={500}
                className="Home2-mobile-img"
              />
            </div>

            <div className={`Home2-feature-text Home2-animate-on-scroll ${mobileVisible ? "Home2-animate-in" : ""}`}>
              <h2 className="Home2-feature-title">Capture Rich, Actionable Data from the Field</h2>
              <p className="Home2-feature-description">
                Empower your inspectors to capture more than just text. The StreamLineer mobile app allows for
                attaching annotated photos, collecting signatures, recording precise GPS locations, scanning barcodes,
                and adding detailed notes – all within the inspection form, even offline.
              </p>
              <ul className="Home2-feature-list">
                <li className="Home2-feature-item Home2-animate-on-scroll" style={{ animationDelay: "0.2s" }}>
                  <Check size={20} className="Home2-check-icon" />
                  <span>High-resolution photo capture with annotation tools</span>
                </li>
                <li className="Home2-feature-item Home2-animate-on-scroll" style={{ animationDelay: "0.3s" }}>
                  <Check size={20} className="Home2-check-icon" />
                  <span>Digital signature collection for sign-offs</span>
                </li>
                <li className="Home2-feature-item Home2-animate-on-scroll" style={{ animationDelay: "0.4s" }}>
                  <Check size={20} className="Home2-check-icon" />
                  <span>Automatic GPS stamping (optional)</span>
                </li>
                <li className="Home2-feature-item Home2-animate-on-scroll" style={{ animationDelay: "0.5s" }}>
                  <Check size={20} className="Home2-check-icon" />
                  <span>Seamless offline data storage and sync</span>
                </li>
              </ul>
              <a
                href="#mobile-demo"
                className="Home2-btn Home2-btn-primary Home2-btn-hover-effect"
                onMouseEnter={enterButton}
                onMouseLeave={leaveHover}
              >
                See Mobile App Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="Home2-industries-section" ref={industriesRef}>
        <div className="Home2-container">
          <h2 className="Home2-section-title">Inspection Templates for Every Need</h2>

          <div className="Home2-industries-grid">
            {industries.map((industry, index) => (
              <div
                key={index}
                className={`Home2-industry-card Home2-animate-on-scroll ${index >= 5 ? 'Home2-last-row-card' : ''}`}
                style={{
                  animationDelay: `${index * 0.05}s`,
                  ...(index >= 5 && { gridColumn: index === 5 ? '2 / 3' : index === 6 ? '3 / 4' : '4 / 5' })
                }}
                onMouseEnter={enterLink}
                onMouseLeave={leaveHover}
              >
                <div className="Home2-industry-icon">{industry.icon}</div>
                <h3 className="Home2-industry-title">{industry.title}</h3>
                <div className="Home2-industry-arrow">
                  <ArrowUpRight size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section className="Home2-faq-section">
        <div className="Home2-container">
          <h2 className="Home2-section-title">Your Questions About Templates & Inspections</h2>

          <div className="Home2-faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`Home2-faq-item ${activeFaq === index ? "Home2-active" : ""} Home2-animate-on-scroll`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  opacity: 1,
                  visibility: 'visible',
                  display: 'block'
                }}
              >
                <button
                  className="Home2-faq-question"
                  onClick={() => toggleFaq(index)}
                  onMouseEnter={enterButton}
                  onMouseLeave={leaveHover}
                  style={{
                    opacity: 1,
                    visibility: 'visible'
                  }}
                >
                  <span>{faq.question}</span>
                  <div className={`Home2-faq-icon ${activeFaq === index ? "Home2-rotate" : ""}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>
                <div className={`Home2-faq-answer ${activeFaq === index ? "Home2-open" : ""}`}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="Home2-cta-section" ref={ctaRef}>
        <div className="Home2-container">
          <div className={`Home2-cta-content Home2-animate-on-scroll ${ctaVisible ? "Home2-animate-in" : ""}`}>
            <h2 className="Home2-cta-title">Ready to Revolutionize Your Inspection Process?</h2>
            <p className="Home2-cta-text">
              Stop wrestling with paper and clunky software. Build intelligent templates and empower your team with
              efficient mobile inspections using StreamLineer.
            </p>
            <div className="Home2-cta-buttons">
              <a
                href="register"
                className="Home2-btn Home2-btn-primary Home2-btn-lg Home2-btn-hover-effect"
                onMouseEnter={enterButton}
                onMouseLeave={leaveHover}
              >
                Start Building Templates Free
              </a>
              <a
                href="#request-demo"
                className="Home2-btn Home2-btn-outline Home2-btn-lg Home2-btn-hover-effect"
                onMouseEnter={enterButton}
                onMouseLeave={leaveHover}
              >
                Request a Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="Home2-footer">
        <div className="Home2-container">
          <div className="Home2-footer-top">
            <div className="Home2-footer-logo">
              <span className="Home2-logo-text">STREAMLINEER</span>
              <p className="Home2-footer-tagline">Build Smart Checklists. Conduct Flawless Inspections.</p>
            </div>

            <div className="Home2-footer-columns">
              <div className="Home2-footer-column">
                <h3 className="Home2-footer-heading">Product</h3>
                <ul className="Home2-footer-links">
                  <li className="Home2-footer-link-item">
                    <a href="#template-builder">Template Builder</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#mobile-app">Mobile Inspections</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#reporting">Reporting</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#actions">Action Tracking</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#pricing">Pricing</a>
                  </li>
                </ul>
              </div>

              <div className="Home2-footer-column">
                <h3 className="Home2-footer-heading">Resources</h3>
                <ul className="Home2-footer-links">
                  <li className="Home2-footer-link-item">
                    <a href="#blog">Blog</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#guides">Guides</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#webinars">Webinars</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#case-studies">Case Studies</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#help-center">Help Center</a>
                  </li>
                </ul>
              </div>

              <div className="Home2-footer-column">
                <h3 className="Home2-footer-heading">Company</h3>
                <ul className="Home2-footer-links">
                  <li className="Home2-footer-link-item">
                    <a href="#about">About Us</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#careers">Careers</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#contact">Contact</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#partners">Partners</a>
                  </li>
                  <li className="Home2-footer-link-item">
                    <a href="#legal">Legal</a>
                  </li>
                </ul>
              </div>

              <div className="Home2-footer-column">
                <h3 className="Home2-footer-heading">Connect</h3>
                <div className="Home2-social-links">
                  <a href="#twitter" className="Home2-social-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
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
                  <a href="#linkedin" className="Home2-social-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
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
                  <a href="#facebook" className="Home2-social-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
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
                  <a href="#instagram" className="Home2-social-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
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
                <div className="Home2-newsletter">
                  <h4 className="Home2-newsletter-title">Subscribe to our newsletter</h4>
                  <form className="Home2-newsletter-form">
                    <input type="email" placeholder="Your email" className="Home2-newsletter-input" />
                    <button
                      type="submit"
                      className="Home2-newsletter-button"
                      onMouseEnter={enterButton}
                      onMouseLeave={leaveHover}
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="Home2-footer-bottom">
            <p className="Home2-copyright">© 2025 StreamLineer, Inc. All rights reserved.</p>
            <div className="Home2-legal-links">
              <a href="#privacy" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                Privacy Policy
              </a>
              <a href="#terms" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                Terms of Service
              </a>
              <a href="#cookies" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home2