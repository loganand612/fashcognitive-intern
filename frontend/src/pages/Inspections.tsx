"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import {
  FileText,
  Home,
  Search,
  Bell,
  ClipboardCheck,
  Calendar,
  Play,
  BookOpen,
  Package,
  AlertCircle,
  User,
  Clock,
  CheckCircle,
  ArrowRight,
  Filter
} from "lucide-react"
import "../assets/Template.css" // Reuse the Template.css styles
import "./Inspections.css" // Import Inspections-specific styles
import { fetchData } from "../utils/api" // Import the API utility

// Define types
interface Inspector {
  id: number
  name: string
  email: string
}

interface Assignment {
  id: number
  template: number
  template_title: string
  inspector: number
  inspector_name: string
  inspector_email: string
  assigned_by: number
  assigned_by_name: string
  assigned_by_email: string
  status: string
  status_display: string
  assigned_at: string
  started_at: string | null
  completed_at: string | null
  revoked_at: string | null
  notes: string | null
}

const Inspections: React.FC = () => {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Menu items for the sidebar
  const menuItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: FileText, label: "Templates", href: "/templates" },
    { icon: ClipboardCheck, label: "Inspections", href: "/inspections", active: true },
    { icon: Calendar, label: "Schedule", href: "/schedule" },
    { icon: Play, label: "Actions", href: "/actions" },
    { icon: BookOpen, label: "Training", href: "/training" },
    { icon: Package, label: "Assets", href: "/assets" },
    { icon: AlertCircle, label: "Issues", href: "/issues" },
  ]

  // Handle scroll event to add shadow to navbar when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await fetchData("users/auth-status/")
        console.log("Auth status response:", data)
        setCurrentUser(data)
      } catch (error) {
        console.error("Error fetching current user:", error)
        // Set a default user for demo purposes
        setCurrentUser({
          id: 1,
          username: "demouser",
          email: "demo@example.com",
          user_role: "admin"
        })
      }
    }

    fetchCurrentUser()
  }, [])

  // Fetch assignments based on user role
  const [retryCount, setRetryCount] = useState(0);

  const fetchAssignments = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Current user:", currentUser);

      // If we don't have a user yet, use a fallback
      if (!currentUser) {
        console.log("No current user, using demo data");
        // Set some demo data for testing
        setAssignments([
          {
            id: 1,
            template: 1,
            template_title: "Safety Inspection Template (Demo)",
            inspector: 2,
            inspector_name: "John Inspector",
            inspector_email: "john@example.com",
            assigned_by: 1,
            assigned_by_name: "Admin User",
            assigned_by_email: "admin@example.com",
            status: "assigned",
            status_display: "Assigned",
            assigned_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            revoked_at: null,
            notes: "Demo assignment - No user data available"
          }
        ]);
        setIsLoading(false);
        return;
      }

      // For admin users, we don't show any inspections
      if (currentUser?.user_role === 'admin') {
        console.log("Admin user - showing empty inspections page");
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      // Only inspectors should see assignments
      const endpoint = "users/my-assignments/"

      console.log("Fetching assignments from:", endpoint);

      try {
        // Use our API utility with a timeout
        const data = await fetchData(endpoint, {
          timeout: 5000 // 5 second timeout
        });

        console.log("Assignments data:", data);

        if (Array.isArray(data) && data.length > 0) {
          setAssignments(data);
          setError(null);
        } else {
          console.log("No assignments found or invalid data format");
          // Set empty array if no assignments are found
          setAssignments([]);
          setError(null);
        }
      } catch (e: unknown) {
        if (axios.isAxiosError(e) && e.code === 'ECONNABORTED') {
          throw new Error('Request timed out. The server might be down or unreachable.');
        }
        throw e;
      }
    } catch (error: unknown) {
      console.error("Error loading assignments:", error);

      // Provide a more informative error message
      if (error instanceof Error) {
        if (currentUser?.user_role === 'admin') {
          // For admin users, we don't need to mention demo data
          if (error.message.includes('timed out')) {
            setError("Connection to server timed out. The backend server might be down or unreachable.");
          } else if (error.message.includes('Failed to fetch')) {
            setError("Failed to connect to the backend server. Please ensure the server is running.");
          } else {
            setError("Failed to load assignments.");
          }
        } else {
          // For non-admin users
          if (error.message.includes('timed out')) {
            setError("Connection to server timed out. The backend server might be down or unreachable. Using demo data instead.");
          } else if (error.message.includes('Failed to fetch')) {
            setError("Failed to connect to the backend server. Please ensure the server is running. Using demo data instead.");
          } else {
            setError("Failed to load assignments. Using demo data instead.");
          }
        }
      } else {
        if (currentUser?.user_role === 'admin') {
          setError("Failed to load assignments.");
        } else {
          setError("Failed to load assignments. Using demo data instead.");
        }
      }

      // Set some demo data if there's an error, but only for non-admin users
      if (currentUser?.user_role !== 'admin') {
        setAssignments([
          {
            id: 1,
            template: 1,
            template_title: "Safety Inspection Template (Demo)",
            inspector: 2,
            inspector_name: "John Inspector",
            inspector_email: "john@example.com",
            assigned_by: 1,
            assigned_by_name: "Admin User",
            assigned_by_email: "admin@example.com",
            status: "assigned",
            status_display: "Assigned",
            assigned_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            revoked_at: null,
            notes: "Demo assignment - This is sample data as the backend server is not available"
          }
        ]);
      } else {
        // For admin users, always show empty assignments
        setAssignments([]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Retry handler
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    // Always fetch assignments, even if currentUser is not available yet
    fetchAssignments();
  }, [currentUser, retryCount])

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Handle starting an inspection
  const handleStartInspection = (assignment: Assignment) => {
    navigate(`/inspection?templateId=${assignment.template}`)
  }

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className={`dashboard-navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="dashboard-navbar-brand">STREAMLINEER</div>
        <div className="dashboard-navbar-actions">
          <button className="dashboard-nav-button">
            <User size={20} />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
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
            <button className="tp-tab active">Inspections</button>
          </nav>
        </div>

        <div className="tp-template-content">
          <section className="tp-templates-section">
            <div className="tp-section-header">
              <h2>My Inspections</h2>
              <div className="tp-section-actions">
                <button className="tp-filter-button">
                  <Filter size={16} />
                  Filter
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="tp-loading">Loading inspections...</div>
            ) : error ? (
              <div className="tp-error-container">
                <div className="tp-error">{error}</div>
                <button
                  className="retry-button"
                  onClick={handleRetry}
                >
                  Retry Connection
                </button>
              </div>
            ) : assignments.length === 0 && !isLoading ? (
              <div className="tp-empty-state">
                <ClipboardCheck size={48} />
                <h3>No inspections found</h3>
                <p>
                  {currentUser?.user_role === 'inspector'
                    ? "You don't have any assigned inspections yet. Please contact an admin to assign templates to you."
                    : "As an admin, you don't complete inspections. You can assign templates to inspectors who will complete them."}
                </p>
                <button
                  className="primary-button"
                  style={{ marginTop: '16px' }}
                  onClick={() => navigate('/templates')}
                >
                  {currentUser?.user_role === 'inspector'
                    ? "View Available Templates"
                    : "Assign Templates"}
                </button>
              </div>
            ) : (
              <div className="tp-templates-table">
                <table>
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Inspector</th>
                      <th>Status</th>
                      <th>Assigned Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td>
                          <div className="tp-template-cell">
                            <div className="tp-template-icon">
                              <FileText size={20} />
                            </div>
                            <span>{assignment.template_title}</span>
                          </div>
                        </td>
                        <td>
                          <div className="tp-access-badge">
                            <User size={16} />
                            <span>{assignment.inspector_name}</span>
                          </div>
                        </td>
                        <td>
                          <div className={`tp-status-badge status-${assignment.status}`}>
                            {assignment.status === 'assigned' && <Clock size={16} />}
                            {assignment.status === 'in_progress' && <ArrowRight size={16} />}
                            {assignment.status === 'completed' && <CheckCircle size={16} />}
                            <span>{assignment.status_display || assignment.status}</span>
                          </div>
                        </td>
                        <td>{formatDate(assignment.assigned_at)}</td>
                        <td>
                          <div className="tp-action-buttons">
                            <button
                              className="tp-start-inspection"
                              onClick={() => handleStartInspection(assignment)}
                              disabled={assignment.status === 'completed'}
                            >
                              {assignment.status === 'assigned' ? 'Start Inspection' :
                               assignment.status === 'in_progress' ? 'Continue Inspection' :
                               'View Inspection'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default Inspections
