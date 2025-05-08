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
              <p>Start from scratch</p>
              <span>Create a new training from scratch.</span>
            </div>
            <div className="option">
              <div className="icon">T</div>
              <p>Describe topic</p>
              <span>Enter a text prompt about your training.</span>
            </div>
            <div className="option">
              <div className="icon">🔍</div>
              <p>Find pre-made training</p>
              <span>Choose from a library of training materials.</span>
            </div>
          </div>
          <div className="training-list">
            <h2>Trainings</h2>
            <div className="training-item">
              <p>Training 1</p>
              <span>Last modified: 2 days ago</span>
            </div>
            <div className="training-item">
              <p>Training 2</p>
              <span>Last modified: 5 days ago</span>
            </div>
            <div className="training-item">
              <p>Training 3</p>
              <span>Last modified: 1 week ago</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Training;