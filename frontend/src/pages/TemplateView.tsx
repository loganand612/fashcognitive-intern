import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Edit, FileText, User, Settings, Home, Bell, Calendar, Play, BookOpen, Package, AlertCircle, Search, LogOut, AlertTriangle, ClipboardCheck } from 'lucide-react';
import './TemplateView.css';
import '../assets/Dashboard.css';

interface Question {
  id: string;
  text: string;
  response_type: string;
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

interface TemplateData {
  id: string;
  title: string;
  description: string;
  sections: Section[];
  logo?: string;
  template_type?: string;
}

const TemplateView = () => {
  const { id } = useParams();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideSettings = (event: MouseEvent) => {
      const target = event.target as Node;
      const settingsButton = document.querySelector('.settings-button');
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

  // Fetch current user first
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/users/current-user/', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser || !id) return;

    // For inspectors, check if they have access to this template
    if (currentUser.user_role === 'inspector') {
      const checkInspectorAccess = async () => {
        try {
          const assignments = await fetch('http://localhost:8000/api/users/my-assignments/', {
            credentials: 'include'
          });

          if (assignments.ok) {
            const assignmentData = await assignments.json();
            const hasAssignment = assignmentData.some((assignment: any) =>
              assignment.template.toString() === id &&
              ['assigned', 'in_progress'].includes(assignment.status)
            );

            if (!hasAssignment) {
              setAccessError('You do not have access to this template. Please contact your administrator.');
              return;
            }
          }
        } catch (error) {
          console.error('Error checking inspector access:', error);
          setAccessError('Error checking template access.');
          return;
        }
      };

      checkInspectorAccess();
    }

    console.log("TemplateView: Fetching template with ID:", id);
    axios
      .get(`http://127.0.0.1:8000/api/users/templates/${id}/`)
      .then((res) => {
        console.log("TemplateView: Template data received:", res.data);
        console.log("TemplateView: Template type:", res.data.template_type);
        console.log("Logo URL:", res.data.logo);
        setTemplate(res.data);
      })
      .catch((err) => {
        console.error("Failed to load template", err);
        if (currentUser?.user_role === 'inspector') {
          setAccessError('You do not have access to this template. Please contact your administrator.');
        }
      });
  }, [id, currentUser]);

  if (accessError) {
    return (
      <div className="tp-app-container">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ marginBottom: '2rem', maxWidth: '500px' }}>{accessError}</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="/dashboard" style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500'
            }}>
              Go to Dashboard
            </a>
            <a href="/schedule" style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500'
            }}>
              Go to Schedule
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!template) return <div className="tp-app-container"><p>Loading...</p></div>;

  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: FileText, label: "Templates", href: "/templates", active: true },
    { icon: Calendar, label: "Schedule", href: "/schedule" },
    { icon: ClipboardCheck, label: "Inspections", href: "/inspection" },
    { icon: Play, label: "Actions", href: "/actions" },
    { icon: BookOpen, label: "Training", href: "/training" },
    { icon: Package, label: "Assets", href: "/assets" },
    { icon: AlertCircle, label: "Issues", href: "/issues" },
  ];

  return (
    <div className="tp-app-container">
      {/* Top Navigation */}
      <nav className="dashboard-navbar">
        <div className="dashboard-navbar-brand">FASHCOGNITIVE</div>
        <div className="dashboard-navbar-actions">
          <button className="dashboard-nav-button">
            <User className="dashboard-nav-icon" />
          </button>
          <div className="dropdown-container">
            <button
              className="dashboard-nav-button settings-button"
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

      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <nav className="dashboard-sidebar-nav">
          {menuItems.map((item, index) => {
            // Make Inspections link inactive for inspector users
            const isInspectionsLink = item.label === 'Inspections';
            const isInspectorUser = currentUser?.user_role === 'inspector';
            const shouldDisableLink = isInspectionsLink && isInspectorUser;

            return shouldDisableLink ? (
              <span
                key={index}
                className={`dashboard-nav-link dashboard-nav-link-disabled ${item.active ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </span>
            ) : (
              <a
                key={index}
                href={item.href}
                className={`dashboard-nav-link ${item.active ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="tp-template-container" style={{ marginLeft: '280px', marginTop: 'var(--header-height)' }}>
        <div className="tp-template-header" style={{ top: 'var(--header-height)' }}>
          <div className="tp-template-tabs">
            <Link to="/template" className="tp-back-link">
              <ArrowLeft size={16} />
              Back to Templates
            </Link>
          </div>
        </div>

        <div className="tp-template-content">
          <div className="tp-template-view-header">
            <h1>{template.title}</h1>
            <button
              className="tp-edit-button"
              onClick={() => {
                console.log("Edit button clicked");
                console.log("Template type:", template.template_type);
                console.log("Template ID:", template.id);

                // Force the template type to be set correctly
                if (!template.template_type) {
                  console.log("Template type not set, defaulting to standard");
                }

                const redirectPath = template.template_type === 'garment'
                  ? `/garment-template/edit/${template.id}`
                  : `/templates/edit/${template.id}`;

                console.log("Redirecting to:", redirectPath);

                // Use direct navigation instead of Link
                window.location.href = redirectPath;
              }}
            >
              <Edit size={16} />
              Edit Template
            </button>
          </div>

          <div className="tp-template-description">
            <p>{template.description}</p>
          </div>

          {template.logo && (
            <div className="tp-template-logo">
              <img
                src={template.logo || "/placeholder.svg"}
                alt="Template Logo"
                style={{ width: 150 }}
              />
            </div>
          )}

          {template.sections.map((section) => (
            <div key={section.id} className="tp-template-section">
              <h3 className="tp-section-title">{section.title}</h3>
              <div className="tp-question-list">
                {section.questions.map((question) => (
                  <div key={question.id} className="tp-question-item">
                    <div className="tp-question-text">{question.text}</div>
                    <div className="tp-question-type">{question.response_type}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateView;