import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import React from 'react';
import '../assets/Template.css';
import { 
  Plus, 
  Search, 
  FileText, 
  User, 
  MoreHorizontal, 
  X,
  Home,
  Bell,
  ClipboardCheck,
  Calendar,
  Play,
  BookOpen,
  Package,
  AlertCircle,
  Settings
} from 'lucide-react';

interface Template {
  id: number;
  title: string;
  lastModified: string;
  access: string;
}

const TemplatePage: React.FC = () => {

  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: FileText, label: "Templates", href: "/templates", active: true },
    { icon: ClipboardCheck, label: "Inspections", href: "/inspections" },
    { icon: Calendar, label: "Schedule", href: "/schedule" },
    { icon: Play, label: "Actions", href: "/actions" },
    { icon: BookOpen, label: "Training", href: "/training" },
    { icon: Package, label: "Assets", href: "/assets" },
    { icon: AlertCircle, label: "Issues", href: "/issues" },
  ];

  const [templates, setTemplates] = useState<Template[]>([
    { id: 1, title: 'Safety Inspection Form', lastModified: '2 days ago', access: 'All users' },
    { id: 2, title: 'Equipment Checklist', lastModified: '3 days ago', access: 'Team only' },
    { id: 3, title: 'Incident Report Template', lastModified: '1 week ago', access: 'All users' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateTemplate = () => {
    // Navigate to the create templates page
    navigate('/create_templates');
  };


  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://127.0.0.1:8000/api/templates/");
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setTemplates(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching templates:", error);
        setError("Failed to load templates.");
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

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
                  (1 - {templates.length} of {templates.length})
                </span>
              </h2>
              <button className="create-button"
              onClick={handleCreateTemplate}
              >
                <Plus size={16} />
                Create
              </button>
            </div>

            <div className="search-controls">
              <div className="search-field">
                <Search className="search-icon" size={20} />
                <input type="text" placeholder="Search all templates" />
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
                  {templates.map(template => (
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
                      <td>{template.lastModified}</td>
                      <td>
                        <div className="access-badge">
                          <User size={16} />
                          <span>{template.access}</span>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="start-inspection">
                            Start inspection
                          </button>
                          <button className="more-options">
                            <MoreHorizontal size={16} />
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
  );
};

export default TemplatePage;