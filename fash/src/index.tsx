import React from 'react';
import ReactDOM from 'react-dom/client';

// Import third-party styles first
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import page-specific styles last
import './pages/Home.css';
import './pages/Home2.css';
import './pages/Login.css';
import './pages/Register.css';
import './pages/Dashboard.css';
import './pages/Template.css';
import './pages/Create_template.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
