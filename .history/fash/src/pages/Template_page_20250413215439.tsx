import React from 'react';
import './Template.css';
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

const TemplatePage: React.FC = () => {
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

  const templates = [
    { id: 1, title: 'Safety Inspection Form', lastModified: '2 days ago', access: 'All users' },
    { id: 2, title: 'Equipment Checklist', lastModified: '3 days ago', access: 'Team only' },
    { id: 3, title: 'Incident Report Template', lastModified: '1 week ago', access: 'All users' },
  ];

  return (
    <div className="tp-app-container">
      {/* Top Navigation */}
      <nav className="tp-navbar">
        <div className="tp-navbar-brand">FASHCOGNITIVE</div>
        <div className="tp-navbar-actions">
          <button className="tp-nav-button">
            <User size={20} />
          </button>
          <button className="tp-nav-button">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="tp-sidebar">
        <nav className="tp-sidebar-nav">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`tp-nav-link ${item.active ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
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
              <button className="tp-close-button">
                <X size={20} />
              </button>
            </div>

            <div className="tp-creation-options">
              <div className="tp-option-card" >
                <div className="tp-option-icon">
                  <Plus size={24} />
                </div>
                <h3>Start from scratch</h3>
                <p>Get started with a blank template.</p>
              </div>
              <div className="tp-option-card">
                <div className="tp-option-icon">
                  <FileText size={24} />
                </div>
                <h3>Describe topic</h3>
                <p>Enter a text prompt about your template.</p>
              </div>
              <div className="tp-option-card">
                <div className="tp-option-icon">
                  <Search size={24} />
                </div>
                <h3>Find pre-made template</h3>
                <p>Choose from over 100,000 editable templates.</p>
              </div>
            </div>
          </section>

          <section className="tp-templates-section">
            <div className="tp-templates-header">
              <h2>Templates <span className="count">(1 - {templates.length} of {templates.length})</span></h2>
              <a href="/ct" className="create-button">
                <Plus size={16} />
                Create
              </a>
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