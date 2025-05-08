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
import ConnectionsPanel, { Connection } from './components/ConnectionsPanel';

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

const connections: Connection[] = [
  {
    id: '1',
    name: 'Grace Miller',
    email: 'grace.miller@example.com',
    initials: 'GM',
    status: 'active'
  },
  {
    id: '2',
    name: 'John Martinez',
    email: 'john.martinez@example.com',
    initials: 'JM',
    status: 'active'
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    initials: 'SJ',
    status: 'active'
  }
];

const Training = () => {
  return (
    <div className="training-container">
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
      <aside className="sidebar">
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
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