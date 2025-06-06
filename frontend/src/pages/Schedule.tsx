import React, { useState, useEffect, useCallback } from 'react';
import './Schedule.css';
import {
  Home,
  Search,
  Bell,
  FileText,
  Calendar,
  ClipboardCheck,
  Play,
  BookOpen,
  Package,
  AlertCircle,
  Settings,
  User,
  LogOut,
  Plus,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import ScheduleInspectionModal from './components/ScheduleInspectionModal';
import TemplateAssignmentManager from './components/TemplateAssignmentManager';
import { fetchData } from '../utils/api';
import axios from 'axios';

interface Assignment {
  id: number;
  template: number;
  template_title: string;
  inspector: number;
  inspector_name: string;
  inspector_email: string;
  assigned_by: number;
  assigned_by_name: string;
  assigned_by_email: string;
  status: string;
  status_display: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  revoked_at: string | null;
  due_date: string | null;
  notes: string | null;
}

interface Template {
  id: number;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  lastModified?: string;
  owner?: number;
  createdBy?: string;
  access?: string;
  template_type?: string;
  owner_name?: string;
  assignment?: Assignment | null; // Current assignment if any
  status?: string; // Derived status based on assignment
}

interface TemplateWithStatus extends Template {
  display_status: string;
  display_status_class: string;
  key_date: string | null;
  assigned_date: string | null;
  inspector_info?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

const Schedule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('my-schedules');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTemplateForAssignment, setSelectedTemplateForAssignment] = useState<TemplateWithStatus | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesWithStatus, setTemplatesWithStatus] = useState<TemplateWithStatus[]>([]);

  // Menu items for the sidebar
  const menuItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: FileText, label: "Templates", href: "/templates" },
    { icon: Calendar, label: "Schedule", href: "/schedule", active: true },
    { icon: ClipboardCheck, label: "Inspections", href: "/inspection" },
    { icon: Play, label: "Actions", href: "/actions" },
    { icon: BookOpen, label: "Training", href: "/training" },
    { icon: Package, label: "Assets", href: "/assets" },
    { icon: AlertCircle, label: "Issues", href: "/issues" },
  ];

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await fetchData("users/auth-status/");

        // Extract user data from the response
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        // Set a default user for demo purposes
        setCurrentUser({
          id: 1,
          username: "demouser",
          email: "demo@example.com",
          user_role: "admin"
        });
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch assignments based on user role
  const fetchAssignments = useCallback(async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);

      try {
        // For admin users, fetch all assignments they've created
        if (currentUser.user_role === 'admin') {
          const data = await fetchData("users/template-assignments/");
          setAssignments(data || []);
        } else if (currentUser.user_role === 'inspector') {
          // For inspectors, fetch their assigned templates
          const data = await fetchData("users/my-assignments/");
          setAssignments(data || []);
        } else {
          setAssignments([]);
        }
      } catch (error) {
        console.error("Error loading assignments:", error);
        setError("Failed to load scheduled inspections");
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    }, [currentUser?.user_role]);

  // Get the logged-in user from localStorage (same as Dashboard)
  const loggedInUser = localStorage.getItem("username");

  // Fetch templates for assignment (only for admin users)
  const fetchTemplates = useCallback(async () => {
      // Only fetch templates for admin users
      if (!currentUser || currentUser.user_role !== 'admin') {
        setTemplates([]);
        return;
      }

      try {
        // Use the same endpoints as Dashboard.tsx
        const endpointsToTry = [
          "users/dashboard/templates/",
          "users/templates/",
          "templates/",
        ];

        // For admin users, fetch created templates (same as Dashboard)
        for (const endpoint of endpointsToTry) {
          try {
            const data = await fetchData(endpoint);

            // Filter templates by the logged-in user
            // Note: createdBy contains the user's email, but loggedInUser might be username
            // So we filter by checking if the template belongs to the current user
            const userTemplates = data.filter((template: any) => {
              // If createdBy matches loggedInUser directly (username case)
              if (template.createdBy === loggedInUser) {
                return true;
              }
              // If loggedInUser is an email and matches createdBy
              if (loggedInUser && loggedInUser.includes('@') && template.createdBy === loggedInUser) {
                return true;
              }
              // If currentUser is available, check against their email
              if (currentUser && template.createdBy === currentUser.email) {
                return true;
              }
              return false;
            });

            console.log(`Schedule: Found ${userTemplates.length} templates for user ${loggedInUser} from endpoint ${endpoint}`);
            setTemplates(userTemplates);
            return;

          } catch (err) {
            console.error("Schedule: Error fetching from endpoint:", endpoint, err);
          }
        }

        // If we couldn't fetch from any endpoint, set empty array
        setTemplates([]);
      } catch (error) {
        console.error("Schedule: Error in fetchTemplates:", error);
        setTemplates([]);
      }
    }, [currentUser?.user_role, loggedInUser]);

  // Combined data fetching function to prevent multiple simultaneous calls
  const fetchAllData = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch assignments first
      await fetchAssignments();

      // Then fetch templates if user is admin
      if (currentUser.user_role === 'admin') {
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchAssignments, fetchTemplates]);

  // useEffect to fetch all data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser?.user_role]); // Only depend on user_role to prevent infinite loops

  const handleScheduleInspections = () => {
    setShowScheduleModal(true);
  };

  const handleAssignTemplate = () => {
    // Clear any selected template to show all templates
    setSelectedTemplateForAssignment(null);
    setShowAssignmentModal(true);
  };

  const handleLogout = async () => {
    try {
      // Call the logout API
      await axios.post('http://localhost:8000/api/users/logout/', {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Clear any stored user data
      localStorage.removeItem('username');
      localStorage.removeItem('user_role');

      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, clear local data and redirect
      localStorage.removeItem('username');
      localStorage.removeItem('user_role');
      window.location.href = '/login';
    }
  };

  // Combine templates with assignment status
  useEffect(() => {
    const combineTemplatesWithStatus = () => {
      // For inspectors, create template-like objects from assignments
      if (currentUser?.user_role === 'inspector') {
        const templatesFromAssignments: TemplateWithStatus[] = assignments.map(assignment => {
          // Determine display status
          let display_status = assignment.status_display || assignment.status;
          let display_status_class = assignment.status;
          let key_date: string | null = null;

          // Set key date based on status
          switch (assignment.status) {
            case 'completed':
              key_date = assignment.completed_at;
              break;
            case 'in_progress':
              key_date = assignment.started_at;
              break;
            case 'assigned':
              key_date = assignment.due_date;
              break;
            default:
              key_date = assignment.due_date;
          }

          return {
            id: assignment.template,
            title: assignment.template_title,
            description: `Assigned by ${assignment.assigned_by_name}`,
            created_at: assignment.assigned_at,
            updated_at: assignment.assigned_at,
            lastModified: assignment.assigned_at,
            owner: assignment.assigned_by,
            createdBy: assignment.assigned_by_name,
            access: 'assigned',
            template_type: 'standard',
            owner_name: assignment.assigned_by_name,
            assignment: assignment,
            status: assignment.status,
            display_status,
            display_status_class,
            key_date,
            assigned_date: assignment.assigned_at,
            inspector_info: {
              id: assignment.inspector,
              name: assignment.inspector_name,
              email: assignment.inspector_email
            }
          };
        });

        setTemplatesWithStatus(templatesFromAssignments);
        return;
      }

      // For admins, use the original logic with templates
      if (!templates.length) {
        setTemplatesWithStatus([]);
        return;
      }

      const templatesWithStatusData: TemplateWithStatus[] = templates.map(template => {
        // Find the most recent assignment for this template
        const templateAssignments = assignments.filter(assignment => assignment.template === template.id);

        const latestAssignment = templateAssignments.length > 0
          ? templateAssignments.sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())[0]
          : null;

        // Determine display status
        let display_status = 'unassigned';
        let display_status_class = 'unassigned';
        let key_date: string | null = null;
        let assigned_date: string | null = null;
        let inspector_info: { id: number; name: string; email: string; } | null = null;

        if (latestAssignment) {
          display_status = latestAssignment.status_display || latestAssignment.status;
          display_status_class = latestAssignment.status;
          assigned_date = latestAssignment.assigned_at;
          inspector_info = {
            id: latestAssignment.inspector,
            name: latestAssignment.inspector_name,
            email: latestAssignment.inspector_email
          };

          // Set key date based on status
          switch (latestAssignment.status) {
            case 'completed':
              key_date = latestAssignment.completed_at;
              break;
            case 'in_progress':
              key_date = latestAssignment.started_at;
              break;
            case 'assigned':
              key_date = latestAssignment.due_date;
              break;
            default:
              key_date = latestAssignment.due_date;
          }
        } else {
          // Template has never been assigned
          display_status = 'Available';
          display_status_class = 'unassigned';
          key_date = template.created_at || template.lastModified || new Date().toISOString();
        }

        const result = {
          ...template,
          assignment: latestAssignment,
          display_status,
          display_status_class,
          key_date,
          assigned_date,
          inspector_info
        };

        return result;
      });

      setTemplatesWithStatus(templatesWithStatusData);
    };

    combineTemplatesWithStatus();
  }, [templates, assignments, currentUser]);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter templates based on search term
  const filteredTemplates = templatesWithStatus.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.inspector_info?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  // For inspectors: Show all filtered templates (they're already filtered to their assignments)
  // For admins: Show all templates
  // If user not loaded yet, show all templates (assume admin for now)
  const displayTemplates = filteredTemplates;

  // Separate templates by status for better organization
  const completedTemplates = displayTemplates.filter(t => t.display_status_class === 'completed');
  const inProgressTemplates = displayTemplates.filter(t => t.display_status_class === 'in_progress');
  const assignedTemplates = displayTemplates.filter(t => t.display_status_class === 'assigned');
  const unassignedTemplates = displayTemplates.filter(t => t.display_status_class === 'unassigned');

  // Get templates to display based on active tab
  const getTabTemplates = () => {
    // If user not loaded yet, treat as admin and show all templates
    if (!currentUser) {
      return displayTemplates;
    }

    // For inspectors, show their assigned templates for my-schedules, empty for others
    if (currentUser.user_role === 'inspector') {
      if (activeTab === 'my-schedules') {
        // Show all templates (they're already filtered to this inspector's assignments)
        return displayTemplates;
      }
      return []; // Empty for other tabs for inspectors
    }

    // For admin users, filter based on active tab
    switch (activeTab) {
      case 'my-schedules':
        // Show all templates for admin
        return displayTemplates;
      case 'manage-schedules':
        // Show active assignments (in progress and assigned) plus unassigned templates
        return [...inProgressTemplates, ...assignedTemplates, ...unassignedTemplates];
      case 'missed-late':
        // Show overdue assignments
        return displayTemplates.filter(template => {
          if (!template.assignment?.due_date) return false;
          const dueDate = new Date(template.assignment.due_date);
          const now = new Date();
          return dueDate < now && template.display_status_class !== 'completed';
        });
      case 'completed-inspections':
        // Show completed assignments for admin to view
        return completedTemplates;
      default:
        return displayTemplates;
    }
  };

  const tabTemplates = getTabTemplates();



  return (
    <div className="schedule-container">
      {/* Top Navigation */}
      <nav className="schedule-navbar">
        <div className="schedule-navbar-brand">STREAMLINEER</div>
        <div className="schedule-navbar-actions">
          <button className="schedule-nav-button" title="Profile">
            <User className="schedule-nav-icon" />
          </button>
          <button className="schedule-nav-button" title="Settings">
            <Settings className="schedule-nav-icon" />
          </button>
          <button
            className="schedule-nav-button"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="schedule-nav-icon" />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="schedule-sidebar">
        <nav className="schedule-sidebar-nav">
          {menuItems.map((item, index) => {
            // Make Inspections link inactive for inspector users
            const isInspectionsLink = item.label === 'Inspections';
            const isInspectorUser = currentUser?.user_role === 'inspector';
            const shouldDisableLink = isInspectionsLink && isInspectorUser;

            return shouldDisableLink ? (
              <span key={index} className={`schedule-nav-link schedule-nav-link-disabled ${item.active ? 'active' : ''}`}>
                <item.icon className="schedule-nav-icon" />
                <span>{item.label}</span>
              </span>
            ) : (
              <a key={index} href={item.href} className={`schedule-nav-link ${item.active ? 'active' : ''}`}>
                <item.icon className="schedule-nav-icon" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="schedule-main-content">
        <div className="schedule-header">
          <h1 className="schedule-page-title">Schedules</h1>



          <div className="schedule-header-actions">
            {currentUser?.user_role === 'admin' && (
              <button
                className="schedule-inspections-button"
                onClick={handleScheduleInspections}
              >
                <Plus size={16} />
                Schedule inspections
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="schedule-tabs">
          <button
            className={`schedule-tab ${activeTab === 'my-schedules' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-schedules')}
          >
            <span>My Schedules</span>
          </button>
          <button
            className={`schedule-tab ${activeTab === 'manage-schedules' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage-schedules')}
          >
            <span>Manage schedules</span>
          </button>
          <button
            className={`schedule-tab ${activeTab === 'missed-late' ? 'active' : ''}`}
            onClick={() => setActiveTab('missed-late')}
          >
            <span>Missed/Late Inspections</span>
          </button>
          {currentUser?.user_role === 'admin' && (
            <button
              className={`schedule-tab ${activeTab === 'completed-inspections' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed-inspections')}
            >
              <span>Completed Inspections</span>
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="schedule-controls">
          <div className="schedule-search-container">
            <Search size={16} className="schedule-search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="schedule-search-input"
            />
          </div>
          <button className="schedule-filter-button">
            <Plus size={16} />
            Add filter
          </button>
        </div>

        {/* Content based on loading state and templates */}
        {loading ? (
          <div className="schedule-loading">
            <div className="schedule-loading-spinner"></div>
            <p>Loading templates and schedules...</p>
          </div>
        ) : error ? (
          <div className="schedule-error">
            <AlertCircle size={48} />
            <h3>Error loading schedules</h3>
            <p>{error}</p>
          </div>
        ) : tabTemplates.length === 0 ? (
          <div className="schedule-empty-state">
            <div className="schedule-empty-illustration">
              <div className="schedule-illustration-bg">
                <Calendar size={80} className="schedule-calendar-icon" />
              </div>
            </div>
            <h2 className="schedule-empty-title">
              {activeTab === 'my-schedules' && currentUser?.user_role === 'inspector' && 'No assigned inspections'}
              {activeTab === 'my-schedules' && currentUser?.user_role === 'admin' && 'No templates available'}
              {activeTab === 'manage-schedules' && 'No active assignments to manage'}
              {activeTab === 'missed-late' && 'No missed or late inspections'}
              {activeTab === 'completed-inspections' && 'No completed inspections found'}
            </h2>
            <p className="schedule-empty-description">
              {activeTab === 'my-schedules' && currentUser?.user_role === 'inspector' && "You don't have any inspections assigned to you yet. Contact your admin to get templates assigned."}
              {activeTab === 'my-schedules' && currentUser?.user_role === 'admin' && "No templates have been created yet."}
              {activeTab === 'manage-schedules' && "All assignments are either completed or not yet started."}
              {activeTab === 'missed-late' && "All inspections are on track with their schedules."}
              {activeTab === 'completed-inspections' && "No inspections have been completed yet."}
              <button className="schedule-learn-more" onClick={() => console.log('Learn more clicked')}>Learn more.</button>
            </p>
          </div>
        ) : (
          <div className="schedule-content">

            {/* Unified display for both admin and inspector users */}
            <div className="schedule-assignments-list">
              <h3 className="schedule-list-title">
                {activeTab === 'my-schedules' && currentUser?.user_role === 'inspector' && `My Assigned Inspections (${tabTemplates.length})`}
                {activeTab === 'my-schedules' && currentUser?.user_role === 'admin' && `All Templates (${tabTemplates.length})`}
                {activeTab === 'manage-schedules' && `Templates & Assignments (${tabTemplates.length})`}
                {activeTab === 'missed-late' && `Overdue Inspections (${tabTemplates.length})`}
                {activeTab === 'completed-inspections' && `Completed Inspections (${tabTemplates.length})`}
              </h3>
              <div className="schedule-assignments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Template</th>
                      {currentUser?.user_role === 'admin' && <th>Inspector</th>}
                      <th>Status</th>
                      <th>
                        {activeTab === 'my-schedules' ? 'Key Date' :
                         activeTab === 'manage-schedules' ? 'Key Date' :
                         activeTab === 'missed-late' ? 'Due Date' :
                         activeTab === 'completed-inspections' ? 'Completed Date' : 'Date'}
                      </th>
                      <th>Assigned Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabTemplates.length > 0 ? (
                      tabTemplates.map((template) => (
                        <tr key={template.id}>
                          <td>
                            <div className="schedule-template-cell">
                              <div className="schedule-template-icon">
                                <FileText size={20} />
                              </div>
                              <span>{template.title}</span>
                            </div>
                          </td>
                          {currentUser?.user_role === 'admin' && (
                            <td>
                              {template.inspector_info ? (
                                <div className="schedule-inspector-badge">
                                  <User size={16} />
                                  <span>{template.inspector_info.name}</span>
                                </div>
                              ) : (
                                <span className="schedule-unassigned">Unassigned</span>
                              )}
                            </td>
                          )}
                          <td>
                            <div className={`schedule-status-badge status-${template.display_status_class}`}>
                              {template.display_status_class === 'assigned' && <Clock size={16} />}
                              {template.display_status_class === 'in_progress' && <ArrowRight size={16} />}
                              {template.display_status_class === 'completed' && <CheckCircle size={16} />}
                              {template.display_status_class === 'unassigned' && <FileText size={16} />}
                              <span>{template.display_status}</span>
                            </div>
                          </td>
                          <td>
                            <span className="schedule-key-date">
                              {formatDate(template.key_date)}
                            </span>
                          </td>
                          <td>{formatDate(template.assigned_date)}</td>
                          <td>
                            <div className="schedule-action-buttons">
                              <button
                                className={`schedule-view-button ${
                                  currentUser?.user_role === 'admin' && template.display_status_class === 'unassigned'
                                    ? 'schedule-assign-button' : ''
                                }`}
                                onClick={() => {
                                  if (template.display_status_class === 'unassigned' && currentUser?.user_role === 'admin') {
                                    // Store the selected template and open assignment modal
                                    setSelectedTemplateForAssignment(template);
                                    setShowAssignmentModal(true);
                                  } else if (activeTab === 'completed-inspections') {
                                    window.location.href = `/inspection?templateId=${template.id}`;
                                  } else {
                                    window.location.href = `/inspection?templateId=${template.id}`;
                                  }
                                }}
                              >
                                {template.display_status_class === 'unassigned' && currentUser?.user_role === 'admin' ? 'Assign' :
                                 activeTab === 'completed-inspections' ? 'View Results' :
                                 currentUser?.user_role === 'admin'
                                  ? (template.display_status_class === 'completed' ? 'View Results' :
                                     template.display_status_class === 'in_progress' ? 'Monitor' : 'Manage')
                                  : (template.display_status_class === 'assigned' ? 'Start' :
                                     template.display_status_class === 'in_progress' ? 'Continue' : 'View')
                                }
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={currentUser?.user_role === 'admin' ? 6 : 5} style={{ textAlign: 'center', padding: '20px' }}>
                          <p>No templates available for this view.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Schedule Inspection Modal */}
      {showScheduleModal && (
        <ScheduleInspectionModal
          onClose={() => setShowScheduleModal(false)}
          onAssignmentCreated={() => {
            // Refresh the page data after assignment
            setShowScheduleModal(false);
            // Refresh all data using unified function
            fetchAllData();
          }}
        />
      )}

      {/* Template Assignment Modal */}
      {showAssignmentModal && (
        <div className="schedule-assignment-modal-overlay">
          <div className="schedule-assignment-modal">
            <div className="schedule-assignment-modal-header">
              <h3>Assign Template to Inspector</h3>
              <button
                className="schedule-modal-close"
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedTemplateForAssignment(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="schedule-assignment-modal-content">
              {selectedTemplateForAssignment ? (
                // Show specific template assignment
                <>
                  <p>Assign "{selectedTemplateForAssignment.title}" to an inspector:</p>
                  <div className="schedule-template-list">
                    <div className="schedule-template-item">
                      <div className="schedule-template-info">
                        <h4>{selectedTemplateForAssignment.title}</h4>
                        <p>{selectedTemplateForAssignment.description || 'No description available'}</p>
                      </div>
                      <TemplateAssignmentManager
                        templateId={selectedTemplateForAssignment.id}
                        templateTitle={selectedTemplateForAssignment.title}
                        onAssignmentUpdated={() => {
                          // Refresh assignments after assignment
                          setShowAssignmentModal(false);
                          setSelectedTemplateForAssignment(null);
                          // Refresh all data using unified function
                          fetchAllData();
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                // Show all templates for assignment
                <>
                  <p>Select a template to assign to an inspector:</p>
                  <div className="schedule-template-list">
                    {templates.map((template) => (
                      <div key={template.id} className="schedule-template-item">
                        <div className="schedule-template-info">
                          <h4>{template.title}</h4>
                          <p>{template.description || 'No description available'}</p>
                        </div>
                        <TemplateAssignmentManager
                          templateId={template.id}
                          templateTitle={template.title}
                          onAssignmentUpdated={() => {
                            // Refresh assignments after assignment
                            setShowAssignmentModal(false);
                            setSelectedTemplateForAssignment(null);
                            // Refresh all data using unified function
                            fetchAllData();
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
