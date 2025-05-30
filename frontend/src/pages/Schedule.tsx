import React, { useState, useEffect } from 'react';
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
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 1,
      title: "Safety Inspection Template (Initial Demo)",
      description: "Demo template for safety inspections",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: 1
    },
    {
      id: 2,
      title: "Equipment Check Template (Initial Demo)",
      description: "Demo template for equipment checks",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: 1
    }
  ]);
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
        console.log("Fetching current user...");
        const data = await fetchData("users/auth-status/");
        console.log("Auth status response:", data);

        // Extract user data from the response
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          console.log("Current user set:", data.user);
          console.log("User role:", data.user.user_role);
        } else {
          console.warn("User not authenticated or user data missing");
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        // Set a default user for demo purposes
        console.log("Setting default user due to error");
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
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);

      try {
        console.log("Current user:", currentUser);

        // For admin users, fetch all assignments they've created
        if (currentUser.user_role === 'admin') {
          const data = await fetchData("users/template-assignments/");
          console.log("Admin assignments data:", data);
          setAssignments(data || []);
        } else if (currentUser.user_role === 'inspector') {
          // For inspectors, fetch their assigned templates
          try {
            const data = await fetchData("users/my-assignments/");
            console.log("Inspector assignments data:", data);

            // If no assignments found, create demo assignments for testing
            if (!data || data.length === 0) {
              console.log("No assignments found for inspector, creating demo assignments");
              setAssignments([
                {
                  id: 1,
                  template: 1,
                  template_title: "Safety Inspection Template (Demo)",
                  inspector: currentUser.id,
                  inspector_name: currentUser.username || "Inspector User",
                  inspector_email: currentUser.email || "inspector@example.com",
                  assigned_by: 1,
                  assigned_by_name: "Admin User",
                  assigned_by_email: "admin@example.com",
                  status: "assigned",
                  status_display: "Assigned",
                  assigned_at: new Date().toISOString(),
                  started_at: null,
                  completed_at: null,
                  revoked_at: null,
                  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                  notes: "Demo assignment for inspector testing"
                },
                {
                  id: 2,
                  template: 2,
                  template_title: "Equipment Check Template (Demo)",
                  inspector: currentUser.id,
                  inspector_name: currentUser.username || "Inspector User",
                  inspector_email: currentUser.email || "inspector@example.com",
                  assigned_by: 1,
                  assigned_by_name: "Admin User",
                  assigned_by_email: "admin@example.com",
                  status: "in_progress",
                  status_display: "In Progress",
                  assigned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                  started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                  completed_at: null,
                  revoked_at: null,
                  due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
                  notes: "Demo assignment in progress"
                }
              ]);
            } else {
              setAssignments(data);
            }
          } catch (error) {
            console.error("Error fetching inspector assignments:", error);
            // Create demo assignments on error
            setAssignments([
              {
                id: 1,
                template: 1,
                template_title: "Safety Inspection Template (Demo)",
                inspector: currentUser.id,
                inspector_name: currentUser.username || "Inspector User",
                inspector_email: currentUser.email || "inspector@example.com",
                assigned_by: 1,
                assigned_by_name: "Admin User",
                assigned_by_email: "admin@example.com",
                status: "assigned",
                status_display: "Assigned",
                assigned_at: new Date().toISOString(),
                started_at: null,
                completed_at: null,
                revoked_at: null,
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                notes: "Demo assignment for inspector testing"
              }
            ]);
          }
        } else {
          setAssignments([]);
        }
      } catch (error) {
        console.error("Error loading assignments:", error);
        setError("Failed to load scheduled inspections");
        // Set demo data for display
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
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            notes: "Demo assignment"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [currentUser]);

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

  // Fetch templates for assignment
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Use the same endpoints as Dashboard.tsx
        const endpointsToTry = [
          "/api/users/dashboard/templates/",
          "/api/users/templates/",
          "/api/templates/",
        ];

        let templatesData = [];

        for (const endpoint of endpointsToTry) {
          try {
            console.log(`Schedule: Trying endpoint: ${endpoint}`);
            const fullUrl = `http://localhost:8000${endpoint}`;
            const response = await fetch(fullUrl, {
              credentials: 'include'
            });

            if (response.ok) {
              const data = await response.json();
              console.log("Schedule: Template data received:", data);

              // Check if the response has the new format with owned_templates and shared_templates
              if (data.owned_templates && data.shared_templates) {
                console.log("Schedule: Using new API format with owned and shared templates");
                templatesData = [...data.owned_templates, ...data.shared_templates];
              } else if (Array.isArray(data)) {
                templatesData = data;
              } else {
                console.log("Schedule: Unknown data format");
                templatesData = [];
              }

              console.log("Schedule: Final templates to set:", templatesData);
              setTemplates(templatesData);
              return;
            }
          } catch (error) {
            console.error(`Schedule: Error with endpoint ${endpoint}:`, error);
            continue;
          }
        }

        // If all endpoints fail, set demo data
        console.log("Schedule: All endpoints failed, using demo data");
        setTemplates([
          {
            id: 1,
            title: "Safety Inspection Template (Demo)",
            description: "Demo template for safety inspections",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            owner: 1
          },
          {
            id: 2,
            title: "Equipment Check Template (Demo)",
            description: "Demo template for equipment checks",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            owner: 1
          },
          {
            id: 3,
            title: "Fire Safety Audit Template (Demo)",
            description: "Demo template for fire safety audits",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            owner: 1
          }
        ]);
      } catch (error) {
        console.error("Schedule: Error fetching templates:", error);
        // Set demo data as fallback
        setTemplates([
          {
            id: 1,
            title: "Safety Inspection Template (Demo)",
            description: "Demo template for safety inspections",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            owner: 1
          },
          {
            id: 2,
            title: "Equipment Check Template (Demo)",
            description: "Demo template for equipment checks",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            owner: 1
          }
        ]);
      }
    };

    fetchTemplates();
  }, []);

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

  // Debug logging (can be removed in production)
  console.log("=== SCHEDULE DEBUG INFO ===");
  console.log("Current user:", currentUser);
  console.log("Templates:", templates);
  console.log("Assignments:", assignments);
  console.log("Templates with status:", templatesWithStatus);
  console.log("Filtered templates:", filteredTemplates);
  console.log("Display templates:", displayTemplates);
  console.log("Tab templates:", tabTemplates);
  console.log("Active tab:", activeTab);

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

          {/* Test button to switch user role - FOR TESTING ONLY */}
          <button
            onClick={() => {
              const newRole = currentUser?.user_role === 'inspector' ? 'admin' : 'inspector';
              setCurrentUser({...currentUser, user_role: newRole});
            }}
            style={{
              padding: '0.5rem 1rem',
              marginRight: '1rem',
              backgroundColor: currentUser?.user_role === 'inspector' ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Test as {currentUser?.user_role === 'inspector' ? 'Admin' : 'Inspector'}
          </button>

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
            {currentUser?.user_role === 'admin' && (
              <button
                className="schedule-assign-button"
                onClick={handleAssignTemplate}
              >
                <Plus size={16} />
                Assign Template
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
              {activeTab === 'my-schedules' && currentUser?.user_role === 'inspector' && 'No scheduled inspections due in the next 7 days'}
              {activeTab === 'my-schedules' && currentUser?.user_role === 'admin' && 'No templates available'}
              {activeTab === 'manage-schedules' && 'No active assignments to manage'}
              {activeTab === 'missed-late' && 'No missed or late inspections'}
              {activeTab === 'completed-inspections' && 'No completed inspections found'}
            </h2>
            <p className="schedule-empty-description">
              {activeTab === 'my-schedules' && currentUser?.user_role === 'inspector' && "You don't have any assigned inspections due in the next 7 days."}
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
                {activeTab === 'my-schedules' && `All Templates (${tabTemplates.length})`}
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
            window.location.reload();
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
                          window.location.reload();
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
                            window.location.reload();
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
