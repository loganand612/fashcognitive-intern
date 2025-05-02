import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Edit, FileText, User, Settings, Home, Bell, ClipboardCheck, Calendar, Play, BookOpen, Package, AlertCircle, Search } from 'lucide-react';
import './TemplateView.css';

interface Question {
  id: string;
  text: string;
  response_type: string;
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

interface TemplateData {
  id: string;
  title: string;
  description: string;
  sections: Section[];
  logo?: string;
}

const TemplateView = () => {
  const { id } = useParams();
  const [template, setTemplate] = useState<TemplateData | null>(null);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/users/templates/${id}/`)
      .then((res) => {
        console.log("Logo URL:", res.data.logo);
        setTemplate(res.data);
      })
      .catch((err) => console.error("Failed to load template", err));
  }, [id]);

  if (!template) return <div className="tp-app-container"><p>Loading...</p></div>;

  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: FileText, label: "Templates", href: "/templates", active: true },
    { icon: ClipboardCheck, label: "Inspections", href: "/inspections" },
    { icon: Calendar, label: "Schedule", href: "/schedule" },
    { icon: Play, label: "Actions", href: "/actions" },
    { icon: BookOpen, label: "Training", href: "/training" },
    { icon: Package, label: "Assets", href: "/assets" },
    { icon: AlertCircle, label: "Issues", href: "/issues" },
  ];

  return (
    <div className="tp-app-container">
      {/* Top Navigation */}
      <nav className="tp-navbar">
        <div className="tp-navbar-brand">FASHCOGNITIVE</div>
        <div className="tp-navbar-actions">
          <button className="tp-nav-button">
            <User size={20} />
          </button>
          <button className="tp-nav-button">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="tp-sidebar">
        <nav className="tp-sidebar-nav">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`tp-nav-link ${item.active ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="tp-template-container">
        <div className="tp-template-header">
          <div className="tp-template-tabs">
            <Link to="/template" className="tp-back-link">
              <ArrowLeft size={16} />
              Back to Templates
            </Link>
          </div>
        </div>

        <div className="tp-template-content">
          <div className="tp-template-view-header">
            <h1>{template.title}</h1>
            <Link to={`/templates/edit/${template.id}`} className="tp-edit-button">
              <Edit size={16} />
              Edit Template
            </Link>
          </div>

          <div className="tp-template-description">
            <p>{template.description}</p>
          </div>

          {template.logo && (
            <div className="tp-template-logo">
              <img
                src={template.logo || "/placeholder.svg"}
                alt="Template Logo"
                style={{ width: 150 }}
              />
            </div>
          )}

          {template.sections.map((section) => (
            <div key={section.id} className="tp-template-section">
              <h3 className="tp-section-title">{section.title}</h3>
              <div className="tp-question-list">
                {section.questions.map((question) => (
                  <div key={question.id} className="tp-question-item">
                    <div className="tp-question-text">{question.text}</div>
                    <div className="tp-question-type">{question.response_type}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateView;