"use client"

import { useState, useRef } from "react"
import "./Training.css"
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
  Settings,
  ImageIcon,
} from "lucide-react"

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
]

const Training = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreateCourse = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleImageClick = () => {
    // Trigger the hidden file input when the image icon is clicked
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

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
      <nav className="training-secondary-navbar">
        <ul className="training-secondary-nav">
          <li className="training-secondary-item">
            <a href="/learn" className="training-secondary-link">
              Learn
            </a>
          </li>
          <li className="training-secondary-item">
            <a href="/content" className="training-secondary-link active">
              Content
            </a>
          </li>
        </ul>
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
          <h1 className="training-page-title">Content</h1>
          <div className="training-actions">
            <button className="browse-library">Browse Course Library</button>
            <button className="create-course" onClick={handleCreateCourse}>
              + Create Course
            </button>
          </div>
        </div>
        <div className="training-tabs">
          <button className="training-tab active">Your Course</button>
          <button className="training-tab">Lessons</button>
        </div>
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
                <p className="card-title">Course {index + 1}</p>
                <p className="card-meta">Status: Draft</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      {/* Modal for creating a course */}
      {isModalOpen && (
        <div className="box-modal-overlay">
          <div className="box-modal-content">
            <button className="box-modal-close" onClick={handleCloseModal}>×</button>
            <h2>Course details</h2>
            <div className="box-upload-section" onClick={() => fileInputRef.current?.click()}>
              <span>Upload logo</span>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log("Uploaded file:", file.name);
                  }
                }}
              />
            </div>
            <form>
              <label>Title (required)</label>
              <input type="text" placeholder="Untitled course" required />
              <label>Description</label>
              <textarea placeholder="Add a brief description"></textarea>
              <div className="box-modal-actions">
                <button type="button" onClick={handleCloseModal}>Cancel</button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Training
