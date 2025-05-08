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
  ChevronRight
} from 'lucide-react';
import ConnectionsPanel, { Connection } from './components/ConnectionsPanel';

const Dashboard: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

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

  const menuItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: FileText, label: 'Templates', href: '/templates' },
    { icon: ClipboardCheck, label: 'Inspections', href: '/inspections' },
    { icon: Calendar, label: 'Schedule', href: '/schedule' },
    { icon: Play, label: 'Actions', href: '/actions' },
    { icon: BookOpen, label: 'Training', href: '/training' },
    { icon: Package, label: 'Assets', href: '/assets' },
    { icon: AlertCircle, label: 'Issues', href: '/issues' },
  ];

  const summaryCards = [
    { icon: FileText, count: '24', label: 'Templates Created' },
    { icon: ClipboardCheck, count: '18/25', label: 'Inspections', sublabel: 'Completed/Total' },
    { icon: AlertCircle, count: '3', label: 'Open Issues' }
  ];

  const recentActivity = [
    { id: 1, title: 'Safety Inspection Template', type: 'Template', date: '2024-03-01', status: 'Completed' },
    { id: 2, title: 'Monthly Equipment Check', type: 'Inspection', date: '2024-02-28', status: 'In Progress' },
    { id: 3, title: 'Emergency Protocol', type: 'Template', date: '2024-02-27', status: 'Completed' }
  ];

  return (
    <div className="dashboard-container">
      <nav className={`dashboard-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="dashboard-navbar-brand">FASHCOGNITIVE</div>
        <div className="dashboard-navbar-actions">
          <button className="dashboard-nav-button">
            <User className="dashboard-nav-icon" />
          </button>
          <div className="dropdown-container">
            <button className="dashboard-nav-button" onClick={toggleDropdown}>
              <Settings className="dashboard-nav-icon" />
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
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
          <h2 className="dashboard-section-title">Recent Activity</h2>
          <div className="dashboard-activity-list">
            {recentActivity.map((item) => (
              <div key={item.id} className="dashboard-activity-item">
                <div className="dashboard-activity-info">
                  <h3 className="dashboard-activity-title">{item.title}</h3>
                  <div className="dashboard-activity-meta">
                    <span className="dashboard-meta-type">{item.type}</span>
                    <span className="dashboard-meta-date">{item.date}</span>
                  </div>
                </div>
                <span className={`dashboard-status-badge ${item.status.toLowerCase()}`}>
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
