
import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';
import ConnectionsPanel, { Connection } from './components/ConnectionsPanel';

const Dashboard: React.FC = () => {
  // Sample connections data
  const [connections, setConnections] = useState<Connection[]>([
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
    },
    {
      id: '4',
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      initials: 'MB',
      status: 'active'
    },
    {
      id: '5',
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      initials: 'ED',
      status: 'active'
    }
  ]);

  const handleAddConnection = (email: string) => {
    // In a real app, you would send an invitation and create a pending connection
    const name = email.split('@')[0].split('.').map(part =>
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');

    const initials = name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();

    const newConnection: Connection = {
      id: Date.now().toString(),
      name,
      email,
      initials,
      status: 'pending'
    };

    setConnections([...connections, newConnection]);
  };

  const handleRemoveConnection = (id: string) => {
    setConnections(connections.filter(connection => connection.id !== id));
  };

  const menuItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: FileText, label: "Templates", href: "/templates" },
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
            <a key={index} href={item.href} className="nav-link">
              <item.icon className="nav-icon" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>


      <main className="main-content">
        <div className="header-section">
          <h1 className="page-title">Dashboard Overview</h1>
          <div className="user-tags">
            <ConnectionsPanel
              connections={connections}
              onAddConnection={handleAddConnection}
              onRemoveConnection={handleRemoveConnection}
              maxDisplayed={3}
            />
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
