import React, { useState } from 'react';
import './Dashboard.css';
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
  ChevronRight
} from 'lucide-react';
import ConnectionsPanel, { Connection } from '../components/ConnectionsPanel';

const Dashboard: React.FC = () => {
  const [userCount, setUserCount] = useState(7); // Initial count of 7 (2 visible + 5 more)

  const menuItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: FileText, label: "Templates", href: "/template" },
    { icon: ClipboardCheck, label: "Inspections", href: "/inspections" },
    { icon: Calendar, label: "Schedule", href: "/schedule" },
    { icon: Play, label: "Actions", href: "/actions" },
    { icon: BookOpen, label: "Training", href: "/training" },
    { icon: Package, label: "Assets", href: "/assets" },
    { icon: AlertCircle, label: "Issues", href: "/issues" },
  ];

  const summaryCards = [
    {
      icon: FileText,
      count: "24",
      label: "Templates Created",
    },
    {
      icon: ClipboardCheck,
      count: "18/25",
      label: "Inspections",
      sublabel: "Completed/Total"
    },
    {
      icon: AlertCircle,
      count: "3",
      label: "Open Issues",
    }
  ];

  const recentActivity = [
    {
      id: 1,
      title: "Safety Inspection Template",
      type: "Template",
      date: "2024-03-01",
      status: "Completed"
    },
    {
      id: 2,
      title: "Monthly Equipment Check",
      type: "Inspection",
      date: "2024-02-28",
      status: "In Progress"
    },
    {
      id: 3,
      title: "Emergency Protocol",
      type: "Template",
      date: "2024-02-27",
      status: "Completed"
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <nav className="navbar">
        <div className="navbar-brand">FASHCOGNITIVE</div>
        <div className="navbar-actions">
          <button className="nav-button">
            <User className="nav-icon" />
          </button>
          <button className="nav-button">
            <Settings className="nav-icon" />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="sidebar">
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <a key={index} href={item.href} className="nav-link">
              <item.icon className="nav-icon" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="header-section">
          <h1 className="page-title">Dashboard Overview</h1>
          <div className="user-tags">
            <span className="user-tag">GM</span>
            <span className="user-tag">JM</span>
            <span className="user-count">+{userCount - 2}</span>
            <button
              className="add-user-button"
              onClick={() => setUserCount(prev => prev + 1)}
            >
              Add +
            </button>
          </div>
        </div>

        <div className="summary-cards">
          {summaryCards.map((card, index) => (
            <div key={index} className="summary-card">
              <div className="card-content">
                <div className="card-icon">
                  <card.icon className="icon" />
                </div>
                <div className="card-info">
                  <h3 className="card-count">{card.count}</h3>
                  <p className="card-label">{card.label}</p>
                  {card.sublabel && <span className="card-sublabel">{card.sublabel}</span>}
                </div>
              </div>
              <ChevronRight className="card-arrow" />
            </div>
          ))}
        </div>

        <section className="recent-activity">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-info">
                  <h3 className="activity-title">{item.title}</h3>
                  <div className="activity-meta">
                    <span className="meta-type">{item.type}</span>
                    <span className="meta-date">{item.date}</span>
                  </div>
                </div>
                <span className={`status-badge ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;