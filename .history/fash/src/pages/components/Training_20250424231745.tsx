import React, { useState } from 'react';
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
  Settings,
  User,
  ChevronRight
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

interface Slide {
  id: number;
  title: string;
  content: string;
}

const Training: React.FC = () => {
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<number | null>(null);

  const openCreateCourse = () => {
    setIsCreateCourseOpen(true);
  };

  const closeCreateCourse = () => {
    setIsCreateCourseOpen(false);
    setCourseTitle('');
    setSlides([]);
    setActiveSlideId(null);
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: Date.now(),
      title: 'New Slide',
      content: 'Edit slide content here...'
    };
    setSlides([...slides, newSlide]);
    setActiveSlideId(newSlide.id);
  };

  const updateSlide = (id: number, field: 'title' | 'content', value: string) => {
    setSlides(slides.map(slide => slide.id === id ? { ...slide, [field]: value } : slide));
  };

  const selectSlide = (id: number) => {
    setActiveSlideId(id);
  };

  return (
    <div className="training-container">
      {/* Navbar */}
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
            <a key={index} href={item.href} className={`nav-link${item.label === 'Training' ? ' active' : ''}`}>
              <item.icon className="nav-icon" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>
