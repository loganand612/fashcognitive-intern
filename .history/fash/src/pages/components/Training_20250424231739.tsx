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
