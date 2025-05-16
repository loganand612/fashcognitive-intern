"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import "../assets/Template.css"
import {
  Plus,
  Search,
  FileText,
  User,
  X,
  Home,
  Bell,
  ClipboardCheck,
  Calendar,
  Play,
  BookOpen,
  Package,
  AlertCircle,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react"

interface Template {
  id: number
  title: string
  lastModified?: string
  access?: string
  createdBy: string
}

interface EndpointResult {
  status?: number
  ok?: boolean
  parseError?: string
  error?: string
}

interface DebugInfo {
  endpoints: { [endpoint: string]: EndpointResult }
  successEndpoint?: string
  responseData?: any
}

interface DialogPosition {
  top: number
  left: number
}

const TemplatePage: React.FC = () => {
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const startFromScratchRef = useRef<HTMLDivElement>(null)
  const startFromScratchDialogRef = useRef<HTMLDivElement>(null)

  const [showStartFromScratchDialog, setShowStartFromScratchDialog] = useState(false)
  const [startFromScratchDialogPosition, setStartFromScratchDialogPosition] = useState<DialogPosition>({ top: 0, left: 0 })

  const menuItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: FileText, label: "Templates", href: "/templates", active: true },
    { icon: ClipboardCheck, label: "Inspections", href: "/inspections" },
    { icon: Calendar, label: "Schedule", href: "/schedule" },
    { icon: Play, label: "Actions", href: "/actions" },
    { icon: BookOpen, label: "Training", href: "/training" },
    { icon: Package, label: "Assets", href: "/assets" },
    { icon: AlertCircle, label: "Issues", href: "/issues" },
  ]

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)

  const loggedInUser = localStorage.getItem("username")

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const endpointsToTry = [
    "/api/templates/",
    "/templates_api/",
    "/templates/",
    "/api/v1/templates/",
    "/api/user/templates/",
    "/dashboard/templates/",
    "/api/users/templates/",
  ]

  // Toggle the create template dropdown
  const toggleCreateDropdown = () => {
    setShowCreateDropdown(!showCreateDropdown)
  }

  // Calculate position and toggle the start from scratch dialog
  const toggleStartFromScratchDialog = () => {
    if (startFromScratchRef.current) {
      const rect = startFromScratchRef.current.getBoundingClientRect()

      // Position the dialog below the button
      const newPosition = {
        top: rect.bottom + 10, // 10px below the button
        left: rect.left + (rect.width / 2) - 125 // Center the 250px wide dialog under the button
      }
      console.log("Button position:", rect)
      console.log("Dialog position:", newPosition)

      setStartFromScratchDialogPosition(newPosition)
      setShowStartFromScratchDialog(!showStartFromScratchDialog)
    } else {
      console.error("Start from scratch button ref not available")
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCreateDropdown(false)
      }

      if (
        showStartFromScratchDialog &&
        startFromScratchDialogRef.current &&
        startFromScratchRef.current &&
        !startFromScratchDialogRef.current.contains(event.target as Node) &&
        !startFromScratchRef.current.contains(event.target as Node)
      ) {
        setShowStartFromScratchDialog(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showStartFromScratchDialog])

  // Update dialog position if window is resized
  useEffect(() => {
    const handleResize = () => {
      if (showStartFromScratchDialog && startFromScratchRef.current) {
        const rect = startFromScratchRef.current.getBoundingClientRect()
        setStartFromScratchDialogPosition({
          top: rect.bottom + 10,
          left: rect.left + (rect.width / 2) - 125
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [showStartFromScratchDialog])

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    // Clear authentication tokens or user data
    localStorage.removeItem('authToken'); // Example: Remove token from localStorage

    // Redirect to login page
    window.location.href = '/login';
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideSettings = (event: MouseEvent) => {
      const target = event.target as Node;
      const settingsButton = document.querySelector('.tp-nav-button');
      const dropdownMenu = document.querySelector('.tp-dropdown-menu');

      if (
        isDropdownOpen &&
        settingsButton &&
        dropdownMenu &&
        !settingsButton.contains(target) &&
        !dropdownMenu.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideSettings);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideSettings);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const testAllEndpoints = async () => {
      setLoading(true)
      setError("")
      const results: { [endpoint: string]: EndpointResult } = {}

      for (const endpoint of endpointsToTry) {
        try {
          const fullUrl = `http://127.0.0.1:8000${endpoint}`
          const response = await fetch(fullUrl)
          results[endpoint] = {
            status: response.status,
            ok: response.ok,
          }

          if (response.ok) {
            try {
              console.log("Logged in user:", loggedInUser)

              const data = await response.json()
              console.log("Full response data:", data);
              console.log("Template creators:", data.map((t: Template) => t.createdBy || 'Unknown'));
              setTemplates(data.filter((template: Template) => template.createdBy === loggedInUser))

              setDebugInfo({ endpoints: results, successEndpoint: fullUrl, responseData: data })
              setLoading(false)
              return
            } catch {
              results[endpoint].parseError = "Could not parse JSON"
            }
          }
        } catch (err) {
          results[endpoint] = {
            error: err instanceof Error ? err.message : String(err),
          }
        }
      }

      setDebugInfo({ endpoints: results })
      setError("Could not connect to any templates API endpoint")
      setTemplates([
        { id: 1, title: "Safety Inspection Form (Demo)", lastModified: "2 days ago", access: "All users", createdBy: "demoUser" },
        { id: 2, title: "Weekly Equipment Check (Demo)", lastModified: "5 days ago", access: "Team managers", createdBy: "demoUser" },
        { id: 3, title: "Monthly Fire Safety Audit (Demo)", lastModified: "2 weeks ago", access: "Safety officers", createdBy: "demoUser" },
      ])
      setLoading(false)
    }

    testAllEndpoints()
  }, [])

  return (
    <div className="tp-app-container">
      <nav className="tp-navbar">
        <div className="tp-navbar-brand">FASHCOGNITIVE</div>
        <div className="tp-navbar-actions">
          <button className="tp-nav-button">
            <User className="tp-nav-icon" />
          </button>
          <div className="tp-dropdown-container">
            <button
              className="tp-nav-button"
              onClick={toggleDropdown}
              style={{
                position: 'relative',
                backgroundColor: isDropdownOpen ? 'rgba(72, 149, 239, 0.1)' : 'transparent'
              }}
              title="Settings"
            >
              <Settings className="tp-nav-icon" />
            </button>
            {isDropdownOpen && (
              <div className="tp-dropdown-menu">
                <button
                  className="tp-dropdown-item logout-button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ff4b4b 0%, #ff6b6b 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    margin: '0.5rem 1rem',
                    boxShadow: 'var(--shadow-sm)',
                    width: 'calc(100% - 2rem)'
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <aside className="dashboard-sidebar">
        <nav className="dashboard-sidebar-nav">
          {menuItems.map((item, i) => (
            <a key={i} href={item.href} className={`dashboard-nav-link ${item.active ? "active" : ""}`}>
              <item.icon size={20} /><span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="tp-template-container">
        <div className="tp-template-header">
          <nav className="tp-template-tabs">
            <button className="tp-tab active">Templates</button>
            <button className="tp-tab">Responses</button>
            <button className="tp-tab">Public Library</button>
            <button className="tp-tab">Archive</button>
          </nav>
        </div>

        <div className="tp-template-content">
          <section className="tp-creation-section">
            <div className="tp-section-header">
              <h2>Create your template from one of the options below.</h2>
              <button className="tp-close-button"><X size={20} /></button>
            </div>

            <div className="tp-creation-options">
              <div
                className="tp-option-card"
                onClick={toggleStartFromScratchDialog}
                style={{ cursor: 'pointer' }}
                ref={startFromScratchRef}
              >
                <div className="tp-option-icon"><Plus size={24} /></div>
                <h3>Start from scratch</h3>
                <p>Get started with a blank template.</p>
              </div>
              <div className="tp-option-card">
                <div className="tp-option-icon"><FileText size={24} /></div>
                <h3>Describe topic</h3>
                <p>Enter a text prompt about your template.</p>
              </div>
              <div className="tp-option-card">
                <div className="tp-option-icon"><Search size={24} /></div>
                <h3>Find pre-made template</h3>
                <p>Choose from over 100,000 editable templates.</p>
              </div>
            </div>
          </section>

          <section className="tp-templates-section">
            <div className="tp-templates-header">
              <h2>Templates <span className="tp-count">(1 - {filteredTemplates.length} of {templates.length})</span></h2>
              <div className="tp-create-dropdown" ref={dropdownRef}>
                <button className="tp-create-button" onClick={toggleCreateDropdown}>
                  <Plus size={16} />
                  Create
                  <ChevronDown size={16} className={`tp-dropdown-icon ${showCreateDropdown ? 'open' : ''}`} />
                </button>
                {showCreateDropdown && (
                  <div className="tp-dropdown-menu">
                    <a href="/create_templates" className="tp-dropdown-item">
                      <FileText size={16} />
                      Standard Template
                    </a>
                    <a href="/garment-template" className="tp-dropdown-item">
                      <FileText size={16} />
                      Garment Template
                    </a>
                  </div>
                )}
              </div>
            </div>

            {loading && <div className="tp-loading">Loading templates...</div>}
            {error && (
              <div className="tp-error-message">
                {error}<p>Showing demo data for display purposes.</p>
                <details><summary>API Debug Info (Click to expand)</summary><pre>{JSON.stringify(debugInfo, null, 2)}</pre></details>
              </div>
            )}

            <div className="tp-search-controls">
              <div className="tp-search-field">
                <Search className="tp-search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search all templates"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="tp-filter-button"><Plus size={16} /> Add filter</button>
            </div>

            <div className="tp-templates-table">
              <table>
                <thead>
                  <tr>
                    <th className="tp-checkbox-column"><input type="checkbox" /></th>
                    <th>Template</th>
                    <th>Last modified</th>
                    <th>Access</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map((template) => (
                    <tr key={template.id}>
                      <td className="tp-checkbox-column"><input type="checkbox" /></td>
                      <td>
                        <div className="tp-template-cell">
                          <div className="tp-template-icon"><FileText size={20} /></div>
                          <span>{template.title}</span>
                        </div>
                      </td>
                      <td>{template.lastModified || "Not available"}</td>
                      <td>
                        <div className="tp-access-badge">
                          <User size={16} />
                          <span>{template.access || "No access specified"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="tp-action-buttons">
                          <button className="tp-start-inspection">Start inspection</button>
                          <button className="tp-view-button" onClick={() => navigate(`/template/${template.id}`)}>View</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Start from scratch dialog - rendered at the document level for better positioning */}
      {showStartFromScratchDialog && (
        <div
          className="tp-start-scratch-dialog"
          ref={startFromScratchDialogRef}
          style={{
            position: 'fixed',
            top: `${startFromScratchDialogPosition.top}px`,
            left: `${startFromScratchDialogPosition.left}px`,
            zIndex: 2000,
            width: '250px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e9ecef',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s forwards'
          }}
        >
          <div style={{ padding: '8px 0' }}>
            <a href="/create_templates" className="tp-dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
              <FileText size={16} />
              Standard Template
            </a>
            <a href="/garment-template" className="tp-dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
              <FileText size={16} />
              Garment Template
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplatePage