import React from 'react';
import { Link } from 'react-router-dom';
import './Training.css';

const Training = () => {
  return (
    <div className="training-container">
      <aside className="training-sidebar">
        <nav className="training-sidebar-nav">
          <ul>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/template">Templates</Link></li>
            <li><Link to="/training" className="active">Training</Link></li>
            <li><Link to="/inspections">Inspections</Link></li>
            <li><Link to="/schedule">Schedule</Link></li>
            <li><Link to="/actions">Actions</Link></li>
            <li><Link to="/assets">Assets</Link></li>
            <li><Link to="/issues">Issues</Link></li>
          </ul>
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