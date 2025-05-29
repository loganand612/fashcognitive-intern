import React, { useState } from 'react';
import './Schedule.css';
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
  LogOut,
  Plus
} from 'lucide-react';
import ScheduleInspectionModal from './components/ScheduleInspectionModal';

const Schedule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('my-schedules');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Menu items for the sidebar
  const menuItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: FileText, label: "Templates", href: "/templates" },
    { icon: ClipboardCheck, label: "Inspections", href: "/inspections" },
    { icon: Calendar, label: "Schedule", href: "/schedule", active: true },
    { icon: Play, label: "Actions", href: "/actions" },
    { icon: BookOpen, label: "Training", href: "/training" },
    { icon: Package, label: "Assets", href: "/assets" },
    { icon: AlertCircle, label: "Issues", href: "/issues" },
  ];

  const handleScheduleInspections = () => {
    setShowScheduleModal(true);
  };

  return (
    <div className="schedule-container">
      {/* Top Navigation */}
      <nav className="schedule-navbar">
        <div className="schedule-navbar-brand">STREAMLINEER</div>
        <div className="schedule-navbar-actions">
          <button className="schedule-nav-button">
            <User className="schedule-nav-icon" />
          </button>
          <button className="schedule-nav-button">
            <Settings className="schedule-nav-icon" />
          </button>
          <button className="schedule-nav-button">
            <LogOut className="schedule-nav-icon" />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="schedule-sidebar">
        <nav className="schedule-sidebar-nav">
          {menuItems.map((item, index) => (
            <a key={index} href={item.href} className={`schedule-nav-link ${item.active ? 'active' : ''}`}>
              <item.icon className="schedule-nav-icon" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="schedule-main-content">
        <div className="schedule-header">
          <h1 className="schedule-page-title">Schedules</h1>
          <button 
            className="schedule-inspections-button"
            onClick={handleScheduleInspections}
          >
            <Plus size={16} />
            Schedule inspections
          </button>
        </div>

        {/* Tabs */}
        <div className="schedule-tabs">
          <button 
            className={`schedule-tab ${activeTab === 'my-schedules' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-schedules')}
          >
            My Schedules
          </button>
          <button 
            className={`schedule-tab ${activeTab === 'manage-schedules' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage-schedules')}
          >
            Manage schedules
          </button>
          <button 
            className={`schedule-tab ${activeTab === 'missed-late' ? 'active' : ''}`}
            onClick={() => setActiveTab('missed-late')}
          >
            Missed/Late Inspections
          </button>
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

        {/* Empty State */}
        <div className="schedule-empty-state">
          <div className="schedule-empty-illustration">
            <div className="schedule-illustration-bg">
              <Calendar size={80} className="schedule-calendar-icon" />
            </div>
          </div>
          <h2 className="schedule-empty-title">No scheduled inspections due in the next 7 days</h2>
          <p className="schedule-empty-description">
            You don't have any scheduled inspections starting in the next 7 days.
            <button className="schedule-learn-more" onClick={() => console.log('Learn more clicked')}>Learn more.</button>
          </p>
        </div>
      </main>

      {/* Schedule Inspection Modal */}
      {showScheduleModal && (
        <ScheduleInspectionModal 
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
};

export default Schedule;
