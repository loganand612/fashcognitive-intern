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
  AlertCircle
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
      <aside className="training-sidebar">
        <nav className="training-sidebar-nav">
          {menuItems.map((item, index) => (
            <a key={index} href={item.href} className="nav-link">
              <item.icon className="nav-icon" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>
      <main className="training-main">
        <header className="training-header">
          <h1>Content</h1>
          <div className="training-actions">
            <button className="browse-library">Browse Course Library</button>
            <button className="create-course">+ Create Course</button>
          </div>
        </header>
        <div className="training-tabs">
          <button className="training-tab active">Courses</button>
          <button className="training-tab">Rapid Refresh Quizzes</button>
        </div>
        <section className="training-content">
          <div className="training-controls">
            <input type="text" placeholder="Search" className="training-search" />
            <button className="training-filters">Filters</button>
            <div className="training-results">
              <span>10 results</span>
              <select className="training-sort">
                <option>Last modified (Newest)</option>
                <option>Last modified (Oldest)</option>
                <option>Alphabetical (A-Z)</option>
                <option>Alphabetical (Z-A)</option>
              </select>
              <button className="training-view-toggle">🔳</button>
            </div>
          </div>
          <div className="training-grid">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="training-card">
                <div className="card-image"></div>
                <div className="card-content">
                  <p className="card-title">Untitled Course</p>
                  <p className="card-meta">Draft</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Training;