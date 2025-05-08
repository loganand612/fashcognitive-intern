import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Assuming similar styles as Dashboard
import './Template.css'; // Reusing styles from Template

const Training = () => {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <nav>
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
      <main className="main-content">
        <header className="header">
          <h1>Training</h1>
        </header>
        <div className="tabs">
          <button className="tab active">Trainings</button>
          <button className="tab">Responses</button>
          <button className="tab">Public Library</button>
          <button className="tab">Archive</button>
        </div>
        <section className="content">
          <div className="create-options">
            <div className="option">
              <div className="icon">+</div>
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