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
      <main className="main-content">
        <header className="header">
          <h1>Training Courses</h1>
          <Link to="/create-training" className="create-button">Create Training</Link>
        </header>
        <section className="content">
          {/* Placeholder for training courses */}
          <div className="course-list">
            <div className="course-item">Course 1</div>
            <div className="course-item">Course 2</div>
            <div className="course-item">Course 3</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Training;