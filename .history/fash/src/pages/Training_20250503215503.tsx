import React from 'react';
import { Link } from 'react-router-dom';
import './Training.css';
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
  User,
  Settings
} from 'lucide-react';

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

const Training = () => {
  return (
    <div className="training-container">
      <nav className="dashboard-navbar">
        <div className="dashboard-navbar-brand">FASHCOGNITIVE</div>
        <div className="dashboard-navbar-actions">
          <button className="dashboard-nav-button">
            <User className="dashboard-nav-icon" />
          </button>
          <button className="dashboard-nav-button">
            <Settings className="dashboard-nav-icon" />
          </button>
        </div>
      </nav>
      <aside className="dashboard-sidebar">
        <nav className="dashboard-sidebar-nav">
          {menuItems.map((item, index) => (
            <a key={index} href={item.href} className="dashboard-nav-link">
              <item.icon className="dashboard-nav-icon" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>
      <main className="training-main-content">
        <div className="training-header-section">
          <h1 className="training-page-title">Training Overview</h1>
        </div>
        <div className="training-grid">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="training-card">
              <div className="card-image"></div>
              <div className="card-content">
                <p className="card-title">Course {index + 1}</p>
                <p className="card-meta">Status: Draft</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Training;