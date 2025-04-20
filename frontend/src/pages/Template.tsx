"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
} from "lucide-react"

interface Template {
  id: number
  title: string
  lastModified?: string
  access?: string
}

// Define interface for endpoint result data
interface EndpointResult {
  status?: number
  ok?: boolean
  parseError?: string
  error?: string
}

// Define interface for debug info
interface DebugInfo {
  endpoints: { [endpoint: string]: EndpointResult }
  successEndpoint?: string
  responseData?: any
}

const TemplatePage: React.FC = () => {
  const navigate = useNavigate()

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

  // List of potential endpoints to try
  const endpointsToTry = [
    "/api/templates/",
    "/templates_api/",
    "/templates/",
    "/api/v1/templates/",
    "/api/user/templates/",
    "/dashboard/templates/",
    "/api/users/templates/",
  ]

  const handleCreateTemplate = () => {
    navigate("/create_templates")
  }

  // Function to test all endpoints
  useEffect(() => {
    const testAllEndpoints = async () => {
      setLoading(true)
      setError("")

      const results: { [endpoint: string]: EndpointResult } = {}

      for (const endpoint of endpointsToTry) {
        try {
          const fullUrl = `http://127.0.0.1:8000${endpoint}`
          console.log(`Testing endpoint: ${fullUrl}`)

          const response = await fetch(fullUrl)
          results[endpoint] = {
            status: response.status,
            ok: response.ok,
          }

          if (response.ok) {
            try {
              const data = await response.json()
              console.log(`Success with ${fullUrl}:`, data)
              setTemplates(data)
              setDebugInfo({
                endpoints: results,
                successEndpoint: fullUrl,
                responseData: data,
              })
              setLoading(false)
              return // Stop trying other endpoints
            } catch (e) {
              if (results[endpoint]) {
                results[endpoint].parseError = "Could not parse JSON"
              }
            }
          }
        } catch (err) {
          results[endpoint] = {
            error: err instanceof Error ? err.message : String(err),
          }
        }
      }

      // If we get here, none of the endpoints worked
      console.log("All endpoints failed:", results)
      setDebugInfo({ endpoints: results })
      setError("Could not connect to any templates API endpoint")

      // Fall back to demo data
      setTemplates([
        { id: 1, title: "Safety Inspection Form (Demo)", lastModified: "2 days ago", access: "All users" },
        { id: 2, title: "Weekly Equipment Check (Demo)", lastModified: "5 days ago", access: "Team managers" },
        { id: 3, title: "Monthly Fire Safety Audit (Demo)", lastModified: "2 weeks ago", access: "Safety officers" },
      ])

      setLoading(false)
    }

    testAllEndpoints()
  }, [])

  // Filter templates based on search term
  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="navbar">
        <div className="navbar-brand">FASHCOGNITIVE</div>
        <div className="navbar-actions">
          <button className="nav-button">
            <User size={20} />
          </button>
          <button className="nav-button">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="sidebar">
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <a key={index} href={item.href} className={`nav-link ${item.active ? "active" : ""}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="template-container">
        <div className="template-header">
          <nav className="template-tabs">
            <button className="tab active">Templates</button>
            <button className="tab">Responses</button>
            <button className="tab">Public Library</button>
            <button className="tab">Archive</button>
          </nav>
        </div>

        <div className="template-content">
          <section className="creation-section">
            <div className="section-header">
              <h2>Create your template from one of the options below.</h2>
              <button className="close-button">
                <X size={20} />
              </button>
            </div>

            <div className="creation-options">
              <div className="option-card">
                <div className="option-icon">
                  <Plus size={24} />
                </div>
                <h3>Start from scratch</h3>
                <p>Get started with a blank template.</p>
              </div>
              <div className="option-card">
                <div className="option-icon">
                  <FileText size={24} />
                </div>
                <h3>Describe topic</h3>
                <p>Enter a text prompt about your template.</p>
              </div>
              <div className="option-card">
                <div className="option-icon">
                  <Search size={24} />
                </div>
                <h3>Find pre-made template</h3>
                <p>Choose from over 100,000 editable templates.</p>
              </div>
            </div>
          </section>

          <section className="templates-section">
            <div className="templates-header">
              <h2>
                Templates{" "}
                <span className="count">
                  (1 - {filteredTemplates.length} of {templates.length})
                </span>
              </h2>
              <button className="create-button" onClick={handleCreateTemplate}>
                <Plus size={16} />
                Create
              </button>
            </div>

            {/* Show loading indicator or error message */}
            {loading && <div className="loading">Loading templates...</div>}
            {error && (
              <div className="error-message">
                {error}
                <p>Showing demo data for display purposes.</p>
                <details>
                  <summary>API Debug Info (Click to expand)</summary>
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </details>
              </div>
            )}

            <div className="search-controls">
              <div className="search-field">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search all templates"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="filter-button">
                <Plus size={16} />
                Add filter
              </button>
            </div>

            <div className="templates-table">
              <table>
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input type="checkbox" />
                    </th>
                    <th>Template</th>
                    <th>Last modified</th>
                    <th>Access</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map((template) => (
                    <tr key={template.id}>
                      <td className="checkbox-column">
                        <input type="checkbox" />
                      </td>
                      <td>
                        <div className="template-cell">
                          <div className="template-icon">
                            <FileText size={20} />
                          </div>
                          <span>{template.title}</span>
                        </div>
                      </td>
                      <td>{template.lastModified || "Not available"}</td>
                      <td>
                        <div className="access-badge">
                          <User size={16} />
                          <span>{template.access || "No access specified"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="start-inspection">Start inspection</button>
                          <button className="view-button" onClick={() => navigate(`/template/${template.id}`)}>
                            View
                          </button>
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
    </div>
  )
}

export default TemplatePage
