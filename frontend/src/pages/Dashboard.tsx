import React, { useState, useEffect } from 'react';
import '../assets/Dashboard.css';
import {
  Home,
  Search,
  Bell,
  FileText,
  ClipboardCheck,
  Calendar,
  Play,
  BookOpen,
  Package,
  AlertCircle,
  Settings,
  User,
  ChevronRight,
  LogOut
} from 'lucide-react';
import ConnectionsPanel, { Connection } from './components/ConnectionsPanel';
import { fetchData } from '../utils/api';

interface Template {
  id: number;
  title: string;
  lastModified?: string;
  access?: string;
  createdBy: string;
  type?: string;
  status?: string;
  date?: string;
}

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

const Dashboard: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get the logged-in user from localStorage
  const loggedInUser = localStorage.getItem("username");

  // API endpoints to try (relative to the base URL in api.ts)
  const endpointsToTry = [
    "users/dashboard/templates/",
    "users/templates/",
    "templates/",
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.dashboard-animate-on-scroll');
      elements.forEach((element) => {
        const rect = element as HTMLElement;
        const position = rect.getBoundingClientRect();
        if (position.top < window.innerHeight * 0.9) {
          rect.classList.add('dashboard-animate-in');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', animateOnScroll);
    };
  }, []);

  // Check authentication status first
  const checkAuthStatus = async (retryCount = 0): Promise<boolean> => {
    try {
      // Add a small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 100));

      const authData = await fetchData('users/auth-status/');
      console.log('Auth status:', authData);

      // If not authenticated and we haven't retried yet, try once more
      if (!authData.authenticated && retryCount === 0) {
        console.log('Auth check failed, retrying once...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return checkAuthStatus(1);
      }

      return authData.authenticated === true;
    } catch (error) {
      console.error('Auth check error:', error);

      // If there's an error and we haven't retried yet, try once more
      if (retryCount === 0) {
        console.log('Auth check error, retrying once...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return checkAuthStatus(1);
      }

      return false;
    }
  };

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
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

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError("");

      // Check if user is authenticated first
      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        setError("User not authenticated. Please log in.");
        setLoading(false);
        return;
      }

      // If we don't have current user info yet, wait
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // For inspectors, fetch assigned templates
      if (currentUser.user_role === 'inspector') {
        try {
          console.log("Fetching assigned templates for inspector:", currentUser.email);
          const assignments = await fetchData("users/my-assignments/");
          console.log("Assignments data:", assignments);

          if (Array.isArray(assignments) && assignments.length > 0) {
            // Convert assignments to template format for display
            const formattedTemplates = assignments.map((assignment: Assignment) => ({
              id: assignment.template,
              title: assignment.template_title,
              lastModified: assignment.assigned_at,
              access: "Assigned",
              createdBy: assignment.assigned_by_name,
              type: "Assigned Template",
              status: assignment.status_display || assignment.status,
              date: assignment.assigned_at
            }));

            // Sort by assignment date (most recent first) and take only the 3 most recent
            const sortedTemplates = [...formattedTemplates].sort((a, b) => {
              const dateA = a.date ? new Date(a.date).getTime() : 0;
              const dateB = b.date ? new Date(b.date).getTime() : 0;
              return dateB - dateA;
            }).slice(0, 3);

            console.log("Formatted templates for inspector:", sortedTemplates);
            setTemplates(sortedTemplates);
          } else {
            console.log("No assignments found for inspector");
            setTemplates([]);
          }
          setLoading(false);
          return;
        } catch (err) {
          console.error("Error fetching assigned templates:", err);
          setError("Failed to fetch assigned templates. Please try again.");
          setLoading(false);
          return;
        }
      } else {
        // For admin users, fetch created templates
        for (const endpoint of endpointsToTry) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);

            const data = await fetchData(endpoint);
            console.log("Logged in user:", loggedInUser);
            console.log("Full response data:", data);
            console.log("Template creators:", data.map((t: Template) => t.createdBy || 'Unknown'));

            // Filter templates by the logged-in user
            const userTemplates = data.filter((template: Template) => template.createdBy === loggedInUser);

            // Add type and status for display in the dashboard
            const formattedTemplates = userTemplates.map((template: Template) => ({
              ...template,
              type: "Template",
              status: "Completed",
              date: template.lastModified || new Date().toISOString().split('T')[0]
            }));

            // Sort templates by date (most recent first) and take only the 3 most recent
            const sortedTemplates = [...formattedTemplates].sort((a, b) => {
              const dateA = a.date ? new Date(a.date).getTime() : 0;
              const dateB = b.date ? new Date(b.date).getTime() : 0;
              return dateB - dateA;
            }).slice(0, 3);

            setTemplates(sortedTemplates);
            setLoading(false);
            return;

          } catch (err) {
            console.error("Error fetching from endpoint:", endpoint, err);
          }
        }
      }

      // If we couldn't fetch from any endpoint, use demo data (only 3 most recent)
      setError("Could not connect to any templates API endpoint");

      // Demo data with 3 recent templates
      const demoTemplates = [
        {
          id: 1,
          title: "Safety Inspection Form (Demo)",
          lastModified: "2024-03-01",
          access: "All users",
          createdBy: "demoUser",
          type: "Template",
          status: "Completed",
          date: "2024-03-01"
        },
        {
          id: 2,
          title: "Weekly Equipment Check (Demo)",
          lastModified: "2024-02-28",
          access: "Team managers",
          createdBy: "demoUser",
          type: "Template",
          status: "In Progress",
          date: "2024-02-28"
        },
        {
          id: 3,
          title: "Monthly Fire Safety Audit (Demo)",
          lastModified: "2024-02-27",
          access: "Safety officers",
          createdBy: "demoUser",
          type: "Template",
          status: "Completed",
          date: "2024-02-27"
        },
      ];

      // Sort by date (most recent first)
      const sortedDemoTemplates = [...demoTemplates].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

      setTemplates(sortedDemoTemplates);
      setLoading(false);
    };

    fetchTemplates();
  }, [loggedInUser, currentUser]);

  const [connections, setConnections] = useState<Connection[]>([{
    id: '1', name: 'Grace Miller', email: 'grace.miller@example.com', initials: 'GM', status: 'active'
  }, {
    id: '2', name: 'John Martinez', email: 'john.martinez@example.com', initials: 'JM', status: 'active'
  }, {
    id: '3', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', initials: 'SJ', status: 'active'
  }, {
    id: '4', name: 'Michael Brown', email: 'michael.brown@example.com', initials: 'MB', status: 'active'
  }, {
    id: '5', name: 'Emily Davis', email: 'emily.davis@example.com', initials: 'ED', status: 'active'
  }]);

  const handleAddConnection = (email: string) => {
    const name = email.split('@')[0].split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    const initials = name.split(' ').map(part => part.charAt(0)).join('').toUpperCase();
    const newConnection: Connection = {
      id: Date.now().toString(), name, email, initials, status: 'pending'
    };
    setConnections([...connections, newConnection]);
  };

  const handleRemoveConnection = (id: string) => {
    setConnections(connections.filter(connection => connection.id !== id));
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideSettings = (event: MouseEvent) => {
      const target = event.target as Node;
      const settingsButton = document.querySelector('.dashboard-nav-button');
      const dropdownMenu = document.querySelector('.dropdown-menu');

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

  const menuItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: FileText, label: 'Templates', href: '/templates' },
    { icon: Calendar, label: 'Schedule', href: '/schedule' },
    { icon: ClipboardCheck, label: 'Inspections', href: '/inspection' },
    { icon: Play, label: 'Actions', href: '/actions' },
    { icon: BookOpen, label: 'Training', href: '/training' },
    { icon: Package, label: 'Assets', href: '/assets' },
    { icon: AlertCircle, label: 'Issues', href: '/issues' },
  ];

  const summaryCards = [
    { icon: FileText, count: templates.length.toString(), label: 'Templates Created' },
    { icon: ClipboardCheck, count: '18/25', label: 'Inspections', sublabel: 'Completed/Total' },
    { icon: AlertCircle, count: '3', label: 'Open Issues' }
  ];

  // We'll use the templates fetched from the API instead of hardcoded data

  return (
    <div className="dashboard-container">
      <nav className={`dashboard-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="dashboard-navbar-brand">STREAMLINEER</div>
        <div className="dashboard-navbar-actions">
          <button className="dashboard-nav-button">
            <User className="dashboard-nav-icon" />
          </button>
          <div className="dropdown-container">
            <button
              className="dashboard-nav-button"
              onClick={toggleDropdown}
              style={{
                position: 'relative',
                backgroundColor: isDropdownOpen ? 'rgba(72, 149, 239, 0.1)' : 'transparent'
              }}
              title="Settings"
            >
              <Settings className="dashboard-nav-icon" />
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button
                  className="dropdown-item logout-button"
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
          {menuItems.map((item, index) => {
            // Make Inspections link inactive for inspector users
            const isInspectionsLink = item.label === 'Inspections';
            const isInspectorUser = currentUser?.user_role === 'inspector';
            const shouldDisableLink = isInspectionsLink && isInspectorUser;

            return shouldDisableLink ? (
              <span key={index} className="dashboard-nav-link dashboard-nav-link-disabled">
                <item.icon className="dashboard-nav-icon" />
                <span>{item.label}</span>
              </span>
            ) : (
              <a key={index} href={item.href} className="dashboard-nav-link">
                <item.icon className="dashboard-nav-icon" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      <main className="dashboard-main-content">
        <div className="dashboard-header-section">
          <h1 className="dashboard-page-title">Dashboard Overview</h1>
          <div className="dashboard-user-tags">
            <ConnectionsPanel
              connections={connections}
              onAddConnection={handleAddConnection}
              onRemoveConnection={handleRemoveConnection}
              maxDisplayed={3}
            />
          </div>
        </div>

        <div className="dashboard-summary-cards">
          {summaryCards.map((card, index) => (
            <div
              key={index}
              className="dashboard-summary-card dashboard-animate-on-scroll"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="dashboard-card-content">
                <div className="dashboard-card-icon">
                  <card.icon className="dashboard-icon" />
                </div>
                <div className="dashboard-card-info">
                  <h3 className="dashboard-card-count">{card.count}</h3>
                  <p className="dashboard-card-label">{card.label}</p>
                  {card.sublabel && <span className="dashboard-card-sublabel">{card.sublabel}</span>}
                </div>
              </div>
              <ChevronRight className="dashboard-card-arrow" />
            </div>
          ))}
        </div>

        <section className="dashboard-recent-activity dashboard-animate-on-scroll">
          <h2 className="dashboard-section-title">
            {currentUser?.user_role === 'inspector' ? 'Recent Assigned Templates' : 'Recent Templates'}
          </h2>

          {loading && (
            <div className="dashboard-loading">Loading recent templates...</div>
          )}

          {error && (
            <div className="dashboard-error-message">
              {error}
              <p>Showing demo data for display purposes.</p>
            </div>
          )}

          <div className="dashboard-activity-list">
            {templates.length === 0 && !loading ? (
              <div className="dashboard-no-activity">
                <p>
                  {currentUser?.user_role === 'inspector'
                    ? 'No assigned templates found. Contact your administrator to get templates assigned to you.'
                    : 'No recent templates found. Create a template to get started.'
                  }
                </p>
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="dashboard-activity-item">
                  <div className="dashboard-activity-info">
                    <h3 className="dashboard-activity-title">{template.title}</h3>
                    <div className="dashboard-activity-meta">
                      <span className="dashboard-meta-type">{template.type}</span>
                      <span className="dashboard-meta-date">{template.date}</span>
                    </div>
                  </div>
                  <span className={`dashboard-status-badge ${template.status?.toLowerCase() || 'completed'}`}>
                    {template.status || 'Completed'}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
