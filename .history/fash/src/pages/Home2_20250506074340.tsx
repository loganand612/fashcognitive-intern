"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion"
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
} from "lucide-react"
import "./Home2.css"

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
  const [cursorVariant, setCursorVariant] = useState("default")
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  // Background images for header
  const bgImages = [
    "/placeholder.svg?height=600&width=600&text=Image1",
    "/placeholder.svg?height=600&width=600&text=Image2",
    "/placeholder.svg?height=600&width=600&text=Image3",
    "/placeholder.svg?height=600&width=600&text=Image4",
    "/placeholder.svg?height=600&width=600&text=Image5",
  ]

  // Tabs for features section
  const tabs = [
    {
      title: "Template Builder",
      icon: <PenTool size={20} />,
      contentTitle: "Intuitive Drag-and-Drop Template Builder",
      description:
        "Create any checklist or form you need. Utilize diverse question types (text, number, multiple-choice, signature, photo, GPS), add conditional logic, scoring, mandatory fields, and instructional media.",
      image: "/placeholder.svg?height=400&width=600&text=Template+Builder",
    },
    {
      title: "Mobile Inspections",
      icon: <Smartphone size={20} />,
      contentTitle: "Powerful Mobile Inspection App",
      description:
        "The easy-to-use app for iOS & Android ensures seamless inspections. Works flawlessly offline, allows rich data capture (annotated photos, notes), and provides access to relevant templates anytime.",
      image: "/placeholder.svg?height=400&width=600&text=Mobile+App",
    },
    {
      title: "Instant Reporting",
      icon: <FileCheck size={20} />,
      contentTitle: "Automated Inspection Reporting",
      description:
        "Forget manual report writing. Generate customizable PDF or web reports instantly after each inspection. Visualize data, track completion rates, and identify trends on dashboards.",
      image: "/placeholder.svg?height=400&width=600&text=Reporting",
    },
    {
      title: "Findings & Actions",
      icon: <AlertTriangle size={20} />,
      contentTitle: "Integrated Findings & Action Tracking",
      description:
        "Flag issues or non-conformances directly within an inspection. Assign corrective actions with deadlines and track their status to ensure prompt resolution, all linked back to the original inspection.",
      image: "/placeholder.svg?height=400&width=600&text=Action+Tracking",
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
      avatar: "/placeholder.svg?height=60&width=60&text=JD",
    },
    {
      quote:
        "Our inspectors love the mobile app. It guides them through the process, works offline perfectly, and the instant reports have drastically cut down admin time back in the office.",
      name: "Maria Garcia",
      role: "Quality Assurance Lead",
      company: "Food Processing Co.",
      avatar: "/placeholder.svg?height=60&width=60&text=MG",
    },
    {
      quote:
        "The template builder is so flexible that we've been able to digitize every single inspection process in our organization. The ROI has been incredible.",
      name: "Robert Chen",
      role: "Operations Director",
      company: "Global Manufacturing Inc.",
      avatar: "/placeholder.svg?height=60&width=60&text=RC",
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

  // Workflow steps with enhanced content
  const workflowSteps = [
    {
      number: 1,
      icon: <PenTool size={32} />,
      title: "Build",
      description:
        "Craft intelligent inspection templates effortlessly using our powerful, user-friendly builder. Add various field types and logic.",
      color: "#0066cc",
      highlights: ["Drag-and-drop interface", "Conditional logic", "Multiple question types", "Template versioning"],
    },
    {
      number: 2,
      icon: <Smartphone size={32} />,
      title: "Inspect",
      description:
        "Conduct thorough inspections anywhere using the intuitive mobile app – even offline. Capture rich data quickly and easily.",
      color: "#0077dd",
      highlights: ["Works offline", "Photo annotations", "GPS location tracking", "Digital signatures"],
    },
    {
      number: 3,
      icon: <FileCheck size={32} />,
      title: "Report",
      description:
        "Access detailed inspection reports instantly upon completion. Analyze performance with real-time dashboards.",
      color: "#0088ee",
      highlights: ["Instant PDF generation", "Custom report templates", "Data visualization", "Export options"],
    },
    {
      number: 4,
      icon: <Zap size={32} />,
      title: "Act",
      description:
        "Identify findings during inspections and assign corrective actions directly within the app for seamless follow-up.",
      color: "#0099ff",
      highlights: ["Action assignment", "Due date tracking", "Notification system", "Completion verification"],
    },
  ]

  // Background image rotation effect with optimized performance
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Scroll effect for header with debounce for performance
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const handleScroll = () => {
      clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        if (window.scrollY > 50) {
          setIsScrolled(true)
        } else {
          setIsScrolled(false)
        }
      }, 10) // Small timeout for debouncing
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearTimeout(timeoutId)
    }
  }, [])

  // Mouse move effect with throttling for performance
  useEffect(() => {
    let lastUpdate = 0
    const throttleMs = 10 // Throttle mouse move updates

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastUpdate < throttleMs) return

      lastUpdate = now
      const { clientX, clientY } = e
      setMousePosition({ x: clientX, y: clientY })

      // Update cursor position
      cursorX.set(clientX)
      cursorY.set(clientY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [cursorX, cursorY])

  // Cursor variants for different elements
  const cursorVariants = {
    default: {
      width: 30,
      height: 30,
      backgroundColor: "rgba(0, 102, 204, 0.1)",
      border: "2px solid var(--primary-color)",
      x: cursorXSpring,
      y: cursorYSpring,
    },
    button: {
      width: 60,
      height: 60,
      backgroundColor: "rgba(0, 102, 204, 0.2)",
      border: "2px solid var(--primary-color)",
      x: cursorXSpring,
      y: cursorYSpring,
    },
    link: {
      width: 40,
      height: 40,
      backgroundColor: "rgba(0, 102, 204, 0.15)",
      border: "2px solid var(--primary-color)",
      x: cursorXSpring,
      y: cursorYSpring,
    },
  }

  // Function to enter button cursor state
  const enterButton = () => setCursorVariant("button")
  // Function to enter link cursor state
  const enterLink = () => setCursorVariant("link")
  // Function to reset cursor state
  const leaveHover = () => setCursorVariant("default")

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
  const [testimonialsRef, testimonialsVisible] = useOnScreen({ threshold: 0.1 })
  const [ctaRef, ctaVisible] = useOnScreen({ threshold: 0.1 })

  // Parallax scroll effect
  const { scrollYProgress } = useScroll()
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -100])

  return (
<div className="Home2fashcognitive-container">
      {/* Custom cursor */}
      <motion.div
        className="custom-cursor"
        variants={cursorVariants}
        animate={cursorVariant}
        transition={{ type: "spring", damping: 25, stiffness: 700 }}
      >
        <motion.div
          className="cursor-dot"
          animate={{
            scale: cursorVariant === "default" ? 1 : [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        >
          <MousePointer size={12} />
        </motion.div>
      </motion.div>

      {/* Header with animated background */}
<header className={`Home2header ${isScrolled ? "Home2scrolled" : ""}`}>
<div className="Home2header-content">
<div className="Home2logo">
            <span className="logo-text">FASHCOGNITIVE</span>
          </div>

<button
  className="Home2menu-toggle"
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
  onMouseEnter={enterButton}
  onMouseLeave={leaveHover}
>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

<nav className={`Home2main-nav ${isMenuOpen ? "Home2open" : ""}`}>
<ul className="Home2nav-list">
              <li className="nav-item">
<a href="#features" className="Home2nav-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                  Features <ChevronDown size={16} />
                </a>
                <div className="dropdown-menu">
<a href="#template-builder" className="Home2dropdown-item">
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
                <a href="#templates" className="nav-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                  Templates
                </a>
              </li>
              <li className="nav-item">
                <a href="#pricing" className="nav-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                  Pricing
                </a>
              </li>
              <li className="nav-item">
                <a href="#resources" className="nav-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
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
                <a href="#contact" className="nav-link" onMouseEnter={enterLink} onMouseLeave={leaveHover}>
                  Contact Us
                </a>
              </li>
            </ul>

<div className="Home2nav-buttons">
<motion.a
  href="login"
  className="Home2btn Home2btn-outline"
  onMouseEnter={enterButton}
  onMouseLeave={leaveHover}
  whileHover={{
    scale: 1.05,
    boxShadow: "0 5px 15px rgba(0, 102, 204, 0.3)",
  }}
  whileTap={{ scale: 0.95 }}
>
  Log In
</motion.a>
<motion.a
  href="signup"
  className="Home2btn Home2btn-primary"
  onMouseEnter={enterButton}
  onMouseLeave={leaveHover}
  whileHover={{
    scale: 1.05,
    boxShadow: "0 5px 20px rgba(0, 102, 204, 0.5)",
  }}
  whileTap={{ scale: 0.95 }}
>
  Start Free
</motion.a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
<section className="Home2hero-section" ref={heroRef}>
<div className="Home2hero-particles">
          {[...Array(15)].map((_, i) => (
          ))}
        </div>

        <div className="container">
          <div className="hero-flex">
            <motion.div
              className="hero-content"
              initial={{ opacity: 0, y: 30 }}
              animate={heroVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="hero-title">
                Build Smarter
                <br />
                Checklists<span className="accent-dot">.</span>
                <br />
                Conduct Flawless
                <br />
                Inspections<span className="accent-dot">.</span>
              </h1>
              <p className="hero-subtitle">
                The intuitive platform for rapidly creating powerful, dynamic inspection templates and empowering your
                teams to execute thorough checks anywhere, capture critical data accurately, and generate instant
                reports.
              </p>
              <div className="hero-buttons">
                <motion.a
                  href="#start"
                  className="btn btn-primary btn-lg"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 25px rgba(0, 102, 204, 0.5)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={enterButton}
                  onMouseLeave={leaveHover}
                >
                  <span className="btn-text">Start Building Templates Free</span>
                  <span className="btn-shine"></span>
                </motion.a>
                <motion.a
                  href="#demo"
                  className="btn btn-outline btn-lg"
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(0, 102, 204, 0.1)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={enterButton}
                  onMouseLeave={leaveHover}
                >
                  See Inspection Features
                </motion.a>
              </div>
            </motion.div>

            <motion.div
              className="hero-image-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={heroVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{
                transform: heroVisible
                  ? `perspective(1000px) rotateY(${(mousePosition.x - window.innerWidth / 2) / 50}deg) rotateX(${(window.innerHeight / 2 - mousePosition.y) / 50}deg)`
                  : "none",
              }}
            >
              <div className="hero-image-slider">
                {bgImages.map((img, index) => (
                  <motion.div
                    key={index}
                    className={`hero-slide ${currentBg === index ? "active" : ""}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={
                      currentBg === index
                        ? {
                            opacity: 1,
                            scale: 1,
                            filter: "hue-rotate(0deg)",
                          }
                        : {
                            opacity: 0,
                            scale: 0.9,
                            filter: "hue-rotate(90deg)",
                          }
                    }
                    transition={{ duration: 0.8 }}
                  >
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`Fashcognitive platform ${index + 1}`}
                      width={600}
                      height={600}
                      className="hero-img"
                    />
                    <div className="image-highlight"></div>
                  </motion.div>
                ))}
              </div>

              {/* Image navigation dots */}
              <div className="image-nav-dots">
                {bgImages.map((_, index) => (
                  <motion.button
                    key={index}
                    className={`nav-dot ${currentBg === index ? "active" : ""}`}
                    onClick={() => setCurrentBg(index)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0.5 }}
                    animate={
                      currentBg === index
                        ? {
                            opacity: 1,
                            scale: 1.2,
                            backgroundColor: "var(--primary-color)",
                          }
                        : {
                            opacity: 0.5,
                            scale: 1,
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                          }
                    }
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Fixed wave position to not hide buttons */}
        <div className="hero-wave-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="hero-wave">
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Enhanced Workflow section */}
      <section className="workflow-section" ref={workflowRef}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={workflowVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="workflow-header"
          >
            <h2 className="section-title">Your Inspection Workflow, Simplified</h2>
            <p className="section-subtitle">
              Our streamlined process makes inspections efficient from creation to action
            </p>
          </motion.div>

          <div className="workflow-steps-container">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={index}
                className="workflow-step-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{
                  y: -15,
                  boxShadow: "0 20px 40px rgba(0, 102, 204, 0.2)",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                }}
                style={{
                  borderTop: `4px solid ${step.color}`,
                }}
              >
                <div className="glowing-border" style={{ borderColor: step.color }}></div>

                <div className="step-number-container">
                  <div className="step-number" style={{ backgroundColor: step.color }}>
                    {step.number}
                  </div>
                </div>

                <div className="step-icon-container" style={{ color: step.color }}>
                  {step.icon}
                </div>

                <h3 className="step-title">{step.title}</h3>

                <p className="step-description">{step.description}</p>

                <ul className="step-highlights">
                  {step.highlights.map((highlight, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                    >
                      <ChevronRight size={14} style={{ color: step.color }} />
                      <span>{highlight}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.div
                  className="step-progress-indicator"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.3 + index * 0.2 }}
                  style={{ backgroundColor: step.color }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating elements for visual interest */}
        <motion.div
          className="floating-element element-1"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />

        <motion.div
          className="floating-element element-2"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -8, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />

        <motion.div
          className="floating-element element-3"
          animate={{
            y: [0, -25, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 7,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
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
              whileHover={{
                y: -15,
                boxShadow: "0 20px 40px rgba(0, 102, 204, 0.15)",
                background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)",
              }}
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
              whileHover={{
                y: -15,
                boxShadow: "0 20px 40px rgba(0, 102, 204, 0.15)",
                background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)",
              }}
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
              whileHover={{
                y: -15,
                boxShadow: "0 20px 40px rgba(0, 102, 204, 0.15)",
                background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)",
              }}
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

      {/* Features Tabs Section */}
      <section className="features-section" id="features" ref={featuresRef}>
        <div className="container">
          <h2 className="section-title">Powering Your Inspections: Key Features</h2>

          <div className="features-tabs">
            <div className="tabs-nav">
              {tabs.map((tab, index) => (
                <motion.button
                  key={index}
                  className={`tab-button ${activeTab === index ? "active" : ""}`}
                  onClick={() => setActiveTab(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onMouseEnter={enterButton}
                  onMouseLeave={leaveHover}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-text">{tab.title}</span>
                </motion.button>
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
                  transition={{ duration: 0.5 }}
                >
                  <div className="tab-content">
                    <h3 className="tab-title">{tabs[activeTab].contentTitle}</h3>
                    <p className="tab-description">{tabs[activeTab].description}</p>
                    <motion.a
                      href="#learn-more"
                      className="btn btn-outline btn-sm"
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "var(--primary-color)",
                        color: "white",
                      }}
                      whileTap={{ scale: 0.95 }}
                      onMouseEnter={enterButton}
                      onMouseLeave={leaveHover}
                    >
                      Learn More <ArrowRight size={16} />
                    </motion.a>
                  </div>
                  <motion.div
                    className="tab-image"
                    whileHover={{ scale: 1.03 }}
                    style={{
                      transform: `perspective(1000px) rotateY(${(mousePosition.x - window.innerWidth / 2) / 100}deg) rotateX(${(window.innerHeight / 2 - mousePosition.y) / 100}deg)`,
                    }}
                  >
                    <div className="tab-image-wrapper">
                      <Image
                        src={tabs[activeTab].image || "/placeholder.svg"}
                        alt={tabs[activeTab].title}
                        width={600}
                        height={400}
                        className="feature-img"
                      />
                      <div className="tab-image-glow"></div>
                    </div>
                  </motion.div>
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
                whileHover={{
                  y: -15,
                  boxShadow: "0 20px 40px rgba(0, 102, 204, 0.15)",
                  background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)",
                }}
              >
                <motion.div
                  className="stat-value"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{
                    opacity: 1,
                    scale: [0.5, 1.2, 1],
                  }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + index * 0.1,
                    times: [0, 0.6, 1],
                  }}
                >
                  {stat.value}
                </motion.div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-shine"></div>
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
                <motion.li
                  className="feature-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={templateVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="check-icon-container">
                    <Check size={20} className="check-icon" />
                  </div>
                  <span>Dynamic conditional logic (if/then)</span>
                </motion.li>
                <motion.li
                  className="feature-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={templateVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="check-icon-container">
                    <Check size={20} className="check-icon" />
                  </div>
                  <span>Automated scoring and weighting</span>
                </motion.li>
                <motion.li
                  className="feature-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={templateVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="check-icon-container">
                    <Check size={20} className="check-icon" />
                  </div>
                  <span>Embed instructional text, images, or videos</span>
                </motion.li>
                <motion.li
                  className="feature-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={templateVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="check-icon-container">
                    <Check size={20} className="check-icon" />
                  </div>
                  <span>Reusable template sections and version control</span>
                </motion.li>
              </ul>
              <motion.a
                href="#template-demo"
                className="btn btn-primary"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 5px 20px rgba(0, 102, 204, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={enterButton}
                onMouseLeave={leaveHover}
              >
                See Template Builder Demo
              </motion.a>
            </motion.div>

            <motion.div
              className="feature-image"
              initial={{ opacity: 0, x: 50 }}
              animate={templateVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                transform: templateVisible
                  ? `perspective(1000px) rotateY(${(mousePosition.x - window.innerWidth / 2) / 100}deg) rotateX(${(window.innerHeight / 2 - mousePosition.y) / 100}deg)`
                  : "none",
              }}
            >
              <div className="feature-image-wrapper">
                <Image
                  src="/placeholder.svg?height=500&width=600&text=Template+Builder"
                  alt="Template Builder"
                  width={600}
                  height={500}
                  className="template-img"
                />
                <div className="feature-image-glow blue-glow"></div>
              </div>
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
              style={{
                transform: mobileVisible
                  ? `perspective(1000px) rotateY(${(mousePosition.x - window.innerWidth / 2) / 100}deg) rotateX(${(window.innerHeight / 2 - mousePosition.y) / 100}deg)`
                  : "none",
              }}
            >
              <div className="feature-image-wrapper">
                <Image
                  src="/placeholder.svg?height=500&width=600&text=Mobile+App"
                  alt="Mobile App"
                  width={600}
                  height={500}
                  className="mobile-img"
                />
                <div className="feature-image-glow blue-glow"></div>
              </div>
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
                <motion.li
                  className="feature-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={mobileVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="check-icon-container">
                    <Check size={20} className="check-icon" />
                  </div>
                  <span>High-resolution photo capture with annotation tools</span>
                </motion.li>
                <motion.li
                  className="feature-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={mobileVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="check-icon-container">
                    <Check size={20} className="check-icon" />
                  </div>
                  <span>Digital signature collection for sign-offs</span>
                </motion.li>
                <motion.li
                  className="feature-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={mobileVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="check-icon-container">
                    <Check size={20} className="check-icon" />
                  </div>
                  <span>Automatic GPS stamping (optional)</span>
                </motion.li>
                <motion.li
                  className="feature-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={mobileVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="check-icon-container">
                    <Check size={20} className="check-icon" />
                  </div>
                  <span>Seamless offline data storage and sync</span>
                </motion.li>
              </ul>
              <motion.a
                href="#mobile-demo"
                className="btn btn-primary"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 5px 20px rgba(0, 102, 204, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={enterButton}
                onMouseLeave={leaveHover}
              >
                See Mobile App Demo
              </motion.a>
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
                  boxShadow: "0 20px 40px rgba(0, 102, 204, 0.15)",
                  backgroundColor: "#f0f7ff",
                }}
                onMouseEnter={enterLink}
                onMouseLeave={leaveHover}
              >
                <div className="industry-icon">{industry.icon}</div>
                <h3 className="industry-title">{industry.title}</h3>
                <motion.div
                  className="industry-arrow"
                  initial={{ opacity: 0 }}
                  whileHover={{
                    opacity: 1,
                    x: 5,
                    transition: { duration: 0.2 },
                  }}
                >
                  <ArrowUpRight size={18} />
                </motion.div>
                <div className="card-shine"></div>
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
              <motion.div
                key={logo}
                className="logo-item"
                initial={{ opacity: 0.5 }}
                whileHover={{
                  opacity: 1,
                  scale: 1.1,
                  filter: "grayscale(0%)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  src={`/placeholder.svg?height=60&width=120&text=LOGO${logo}`}
                  alt={`Client Logo ${logo}`}
                  width={120}
                  height={60}
                  className="client-logo"
                />
              </motion.div>
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
                whileHover={{
                  y: -15,
                  boxShadow: "0 20px 40px rgba(0, 102, 204, 0.15)",
                  background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)",
                }}
              >
                <div className="testimonial-content">
                  <div className="quote-mark">"</div>
                  <p className="testimonial-quote">{testimonial.quote}</p>
                  <div className="testimonial-author">
                    <div className="author-avatar-container">
                      <Image
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.name}
                        width={60}
                        height={60}
                        className="author-avatar"
                      />
                      <div className="avatar-glow"></div>
                    </div>
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
                whileHover={{
                  boxShadow: activeFaq !== index ? "0 10px 30px rgba(0, 102, 204, 0.1)" : "",
                }}
              >
                <motion.button
                  className="faq-question"
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  whileHover={{ backgroundColor: activeFaq !== index ? "#f0f7ff" : "" }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={enterButton}
                  onMouseLeave={leaveHover}
                >
                  <span>{faq.question}</span>
                  <motion.div
                    animate={{
                      rotate: activeFaq === index ? 180 : 0,
                      backgroundColor: activeFaq === index ? "var(--primary-color)" : "rgba(0, 102, 204, 0.1)",
                      color: activeFaq === index ? "white" : "var(--primary-color)",
                    }}
                    transition={{ duration: 0.3 }}
                    className="faq-icon-container"
                  >
                    <ChevronDown size={20} className="faq-icon" />
                  </motion.div>
                </motion.button>
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
        <div className="cta-particles">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="cta-particle"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * 300,
                opacity: Math.random() * 0.5 + 0.3,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                y: [null, Math.random() * 80 - 40 + Number.parseFloat(i.toString())],
                x: [null, Math.random() * 80 - 40 + Number.parseFloat(i.toString())],
                opacity: [null, Math.random() * 0.5 + 0.3],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>

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
              <motion.a
                href="#start-free"
                className="btn btn-cta btn-lg"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 5px 25px rgba(255, 255, 255, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={enterButton}
                onMouseLeave={leaveHover}
              >
                <span className="btn-text">Start Building Templates Free</span>
                <span className="btn-shine"></span>
              </motion.a>
              <motion.a
                href="#request-demo"
                className="btn btn-outline-cta btn-lg"
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={enterButton}
                onMouseLeave={leaveHover}
              >
                Request a Demo
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path
              fill="#1e2a3a"
              fillOpacity="1"
              d="M0,128L48,112C96,96,192,64,288,69.3C384,75,480,117,576,133.3C672,149,768,139,864,128C960,117,1056,107,1152,96C1248,85,1344,75,1392,69.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>

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
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#template-builder">Template Builder</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#mobile-app">Mobile Inspections</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#reporting">Reporting</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#actions">Action Tracking</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#pricing">Pricing</a>
                  </motion.li>
                </ul>
              </div>

              <div className="footer-column">
                <h3 className="footer-heading">Resources</h3>
                <ul className="footer-links">
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#blog">Blog</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#guides">Guides</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#webinars">Webinars</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#case-studies">Case Studies</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#help-center">Help Center</a>
                  </motion.li>
                </ul>
              </div>

              <div className="footer-column">
                <h3 className="footer-heading">Company</h3>
                <ul className="footer-links">
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#about">About Us</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#careers">Careers</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#contact">Contact</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#partners">Partners</a>
                  </motion.li>
                  <motion.li whileHover={{ x: 5 }}>
                    <a href="#legal">Legal</a>
                  </motion.li>
                </ul>
              </div>

              <div className="footer-column">
                <h3 className="footer-heading">Connect</h3>
                <div className="social-links">
                  <motion.a
                    href="#twitter"
                    className="social-link"
                    whileHover={{ scale: 1.2, backgroundColor: "#1DA1F2", color: "white" }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={enterLink}
                    onMouseLeave={leaveHover}
                  >
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
                  </motion.a>
                  <motion.a
                    href="#linkedin"
                    className="social-link"
                    whileHover={{ scale: 1.2, backgroundColor: "#0077B5", color: "white" }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={enterLink}
                    onMouseLeave={leaveHover}
                  >
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
                  </motion.a>
                  <motion.a
                    href="#facebook"
                    className="social-link"
                    whileHover={{ scale: 1.2, backgroundColor: "#4267B2", color: "white" }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={enterLink}
                    onMouseLeave={leaveHover}
                  >
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
                  </motion.a>
                  <motion.a
                    href="#instagram"
                    className="social-link"
                    whileHover={{ scale: 1.2, backgroundColor: "#E1306C", color: "white" }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={enterLink}
                    onMouseLeave={leaveHover}
                  >
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
                  </motion.a>
                </div>
                <div className="newsletter">
                  <h4 className="newsletter-title">Subscribe to our newsletter</h4>
                  <form className="newsletter-form">
                    <input type="email" placeholder="Your email" className="newsletter-input" />
                    <motion.button
                      type="submit"
                      className="newsletter-button"
                      whileHover={{ scale: 1.05, backgroundColor: "var(--primary-hover)" }}
                      whileTap={{ scale: 0.95 }}
                      onMouseEnter={enterButton}
                      onMouseLeave={leaveHover}
                    >
                      Subscribe
                    </motion.button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="copyright">© 2025 Fashcognitive, Inc. All rights reserved.</p>
            <div className="legal-links">
              <motion.a
                href="#privacy"
                whileHover={{ color: "var(--primary-color)" }}
                onMouseEnter={enterLink}
                onMouseLeave={leaveHover}
              >
                Privacy Policy
              </motion.a>
              <motion.a
                href="#terms"
                whileHover={{ color: "var(--primary-color)" }}
                onMouseEnter={enterLink}
                onMouseLeave={leaveHover}
              >
                Terms of Service
              </motion.a>
              <motion.a
                href="#cookies"
                whileHover={{ color: "var(--primary-color)" }}
                onMouseEnter={enterLink}
                onMouseLeave={leaveHover}
              >
                Cookie Policy
              </motion.a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home2
