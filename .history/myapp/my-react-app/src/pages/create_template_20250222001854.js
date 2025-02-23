import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.min.css";
import "../../styles/create_template.css";
const App = () => {
  const [templates, setTemplates] = useState(
    JSON.parse(localStorage.getItem("templates")) || []
  );
  const [currentTemplate, setCurrentTemplate] = useState(
    JSON.parse(localStorage.getItem("currentTemplate")) || {
      name: "",
      description: "",
      logo: "",
      pages: [
        {
          title: "Title Page",
          description:
            "The Title Page is the first page of your inspection report. You can customize this Title Page below.",
          sections: [
            {
              title: "Section 1",
              questions: [
                { type: "site", content: "Site conducted", required: true, isDefault: true },
                { type: "datetime", content: "Conducted on", required: false, isDefault: true },
                { type: "person", content: "Prepared by", required: false, isDefault: true },
                { type: "location", content: "Location", required: false, isDefault: true },
              ],
            },
          ],
          isDefault: true,
        },
      ],
    }
  );
  const [previewVisible, setPreviewVisible] = useState(true);

  const questionTypes = [
    "text",
    "number",
    "checkbox",
    "slider",
    "signature",
    "site",
    "document",
    "asset",
    "datetime",
    "media",
    "annotation",
    "location",
    "person",
    "instruction",
  ];

  useEffect(() => {
    updatePreview();
  }, [currentTemplate]);

  const addPage = () => {
    setCurrentTemplate((prev) => ({
      ...prev,
      pages: [
        ...prev.pages,
        {
          title: `Page ${prev.pages.length + 1}`,
          description: "Add your inspection questions and response types.",
          sections: [
            {
              title: `Section 1`,
              questions: [],
            },
          ],
          isDefault: false,
        },
      ],
    }));
  };

  const addSection = (pageIndex) => {
    const updatedPages = [...currentTemplate.pages];
    updatedPages[pageIndex].sections.push({
      title: `Section ${updatedPages[pageIndex].sections.length + 1}`,
      questions: [],
    });
    setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
  };

  const addQuestion = (pageIndex, sectionIndex) => {
    const updatedPages = [...currentTemplate.pages];
    updatedPages[pageIndex].sections[sectionIndex].questions.push({
      type: "text",
      content: "",
      required: false,
      isDefault: false,
    });
    setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
  };

  const removeQuestion = (pageIndex, sectionIndex, questionIndex) => {
    const question = currentTemplate.pages[pageIndex].sections[sectionIndex].questions[questionIndex];
    if (!question.isDefault) {
      const updatedPages = [...currentTemplate.pages];
      updatedPages[pageIndex].sections[sectionIndex].questions.splice(questionIndex, 1);
      setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
    }
  };

  const removeSection = (pageIndex, sectionIndex) => {
    const updatedPages = [...currentTemplate.pages];
    updatedPages[pageIndex].sections.splice(sectionIndex, 1);
    if (updatedPages[pageIndex].sections.length === 0) {
      updatedPages[pageIndex].sections.push({
        title: `Section 1`,
        questions: [],
      });
    }
    setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
  };

  const removePage = (pageIndex) => {
    if (currentTemplate.pages.length > 1 && pageIndex !== 0) {
      const updatedPages = [...currentTemplate.pages];
      updatedPages.splice(pageIndex, 1);
      updatedPages.forEach((page, index) => {
        if (!page.isDefault && index > 0) {
          page.title = `Page ${index + 1}`;
        }
      });
      setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
    }
  };

  const updatePageTitle = (pageIndex, title) => {
    const updatedPages = [...currentTemplate.pages];
    updatedPages[pageIndex].title = title;
    setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
  };

  const updatePageDescription = (pageIndex, description) => {
    const updatedPages = [...currentTemplate.pages];
    updatedPages[pageIndex].description = description;
    setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
  };

  const updateSectionTitle = (pageIndex, sectionIndex, title) => {
    const updatedPages = [...currentTemplate.pages];
    updatedPages[pageIndex].sections[sectionIndex].title = title;
    setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
  };

  const updateQuestionType = (pageIndex, sectionIndex, questionIndex, type) => {
    const updatedPages = [...currentTemplate.pages];
    updatedPages[pageIndex].sections[sectionIndex].questions[questionIndex].type = type;
    setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
  };

  const updateQuestionContent = (pageIndex, sectionIndex, questionIndex, content) => {
    const updatedPages = [...currentTemplate.pages];
    updatedPages[pageIndex].sections[sectionIndex].questions[questionIndex].content = content;
    setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
  };

  const updateQuestionRequired = (pageIndex, sectionIndex, questionIndex, required) => {
    const updatedPages = [...currentTemplate.pages];
    updatedPages[pageIndex].sections[sectionIndex].questions[questionIndex].required = required;
    setCurrentTemplate({ ...currentTemplate, pages: updatedPages });
  };

  const toggleMenu = (pageIndex, sectionIndex, questionIndex) => {
    alert(`Menu options for question: ${currentTemplate.pages[pageIndex].sections[sectionIndex].questions[questionIndex].content}`);
  };

  const updatePreview = () => {
    setCurrentTemplate((prev) => ({
      ...prev,
      name: document.getElementById("templateName")?.value || prev.name,
      description: document.getElementById("templateDescription")?.value || prev.description,
    }));
  };

  const renderQuestionPreview = (question) => {
    const colors = {
      site: "#e3f2fd",
      datetime: "#e8f5e9",
      person: "#fff3e0",
      location: "#fff3e0",
    };
    const baseInputStyle = { width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", fontSize: "0.85rem", background: "#fff" };
    switch (question.type) {
      case "text":
        return <input type="text" className="form-control form-control-sm" disabled style={baseInputStyle} />;
      case "number":
        return <input type="number" className="form-control form-control-sm" disabled style={baseInputStyle} />;
      case "checkbox":
        return <input type="checkbox" className="form-check-input" disabled style={{ marginLeft: 0 }} />;
      case "slider":
        return <input type="range" className="form-range" disabled style={{ width: "100%" }} />;
      case "signature":
        return (
          <div
            style={{
              width: "100%",
              height: "80px",
              background: "#f8f9fa",
              border: "1px dashed #ccc",
              borderRadius: "4px",
              textAlign: "center",
              lineHeight: "80px",
              color: "#888",
              fontSize: "0.85rem",
            }}
          >
            Signature Area
          </div>
        );
      case "site":
        return (
          <input
            type="text"
            className="form-control form-control-sm"
            disabled
            style={{ ...baseInputStyle, background: colors.site }}
            placeholder="Site input"
          />
        );
      case "document":
        return (
          <div
            style={{
              width: "100%",
              height: "80px",
              background: "#f8f9fa",
              border: "1px dashed #ccc",
              borderRadius: "4px",
              textAlign: "center",
              lineHeight: "80px",
              color: "#888",
              fontSize: "0.85rem",
            }}
          >
            Document Upload
          </div>
        );
      case "asset":
        return (
          <input
            type="text"
            className="form-control form-control-sm"
            disabled
            style={baseInputStyle}
            placeholder="Asset input"
          />
        );
      case "datetime":
        return (
          <input
            type="datetime-local"
            className="form-control form-control-sm"
            disabled
            style={{ ...baseInputStyle, background: colors.datetime }}
          />
        );
      case "media":
        return (
          <div
            style={{
              width: "100%",
              height: "80px",
              background: "#f8f9fa",
              border: "1px dashed #ccc",
              borderRadius: "4px",
              textAlign: "center",
              lineHeight: "80px",
              color: "#888",
              fontSize: "0.85rem",
            }}
          >
            Media Upload
          </div>
        );
      case "annotation":
        return (
          <div
            style={{
              width: "100%",
              height: "80px",
              background: "#f8f9fa",
              border: "1px dashed #ccc",
              borderRadius: "4px",
              textAlign: "center",
              lineHeight: "80px",
              color: "#888",
              fontSize: "0.85rem",
            }}
          >
            Annotation Area
          </div>
        );
      case "location":
        return (
          <input
            type="text"
            className="form-control form-control-sm"
            disabled
            style={{ ...baseInputStyle, background: colors.location }}
            placeholder="Location input"
          />
        );
      case "person":
        return (
          <input
            type="text"
            className="form-control form-control-sm"
            disabled
            style={{ ...baseInputStyle, background: colors.person }}
            placeholder="Person input"
          />
        );
      case "instruction":
        return (
          <textarea
            className="form-control form-control-sm"
            disabled
            style={{ ...baseInputStyle, height: "60px" }}
            placeholder="Instruction text"
          />
        );
      default:
        return <div style={{ fontSize: "0.85rem", color: "#666" }}>[{question.type} input]</div>;
    }
  };

  const uploadLogo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setCurrentTemplate((prev) => ({
            ...prev,
            logo: event.target.result,
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const saveTemplate = (e) => {
    e.preventDefault();
    const template = {
      id: currentTemplate.id || Date.now(),
      name: document.getElementById("templateName").value,
      description: document.getElementById("templateDescription").value,
      logo: currentTemplate.logo,
      pages: currentTemplate.pages,
      lastPublished: new Date().toISOString(),
      access: "Private",
    };
    const existingIndex = templates.findIndex((t) => t.id === template.id);
    if (existingIndex !== -1) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    setTemplates([...templates]);
    localStorage.setItem("templates", JSON.stringify(templates));
    localStorage.removeItem("currentTemplate");
    showDashboard();
  };

  const showDashboard = () => {
    alert("Template saved! Redirecting to dashboard...");
    // window.location.href = "dashboard.html";
  };

  const renderPages = () => {
    return currentTemplate.pages.map((page, pageIndex) => (
      <div className="page-item" key={pageIndex}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <input
            type="text"
            value={page.title}
            onChange={(e) => updatePageTitle(pageIndex, e.target.value)}
            placeholder="Page Title"
            className="form-control"
            style={{ width: "80%" }}
          />
          {!page.isDefault && (
            <button className="delete-btn" onClick={() => removePage(pageIndex)}>
              <i className="fa fa-trash"></i>
            </button>
          )}
        </div>
        <textarea
          className="form-control page-description mb-3"
          rows="2"
          placeholder="Add a description"
          value={page.description || ""}
          onChange={(e) => updatePageDescription(pageIndex, e.target.value)}
        />
        {page.sections.map((section, sectionIndex) => (
          <div className="section-item" key={sectionIndex}>
            <input
              type="text"
              value={section.title}
              onChange={(e) => updateSectionTitle(pageIndex, sectionIndex, e.target.value)}
              placeholder="Section Title"
              className="form-control"
            />
            {section.questions.map((question, questionIndex) => (
              <div className="question-item" key={questionIndex}>
                <input
                  type="text"
                  value={question.content}
                  onChange={(e) =>
                    updateQuestionContent(pageIndex, sectionIndex, questionIndex, e.target.value)
                  }
                  placeholder="Question"
                  className="form-control"
                />
                <select
                  className="form-select response-type"
                  value={question.type}
                  onChange={(e) =>
                    updateQuestionType(pageIndex, sectionIndex, questionIndex, e.target.value)
                  }
                >
                  {questionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="d-flex align-items-center">
                  <input
                    type="checkbox"
                    className="required-checkbox form-check-input"
                    checked={question.required}
                    onChange={(e) =>
                      updateQuestionRequired(pageIndex, sectionIndex, questionIndex, e.target.checked)
                    }
                  />
                  <span className="required-label">Required</span>
                  {!question.isDefault && (
                    <button
                      className="delete-btn"
                      onClick={() => removeQuestion(pageIndex, sectionIndex, questionIndex)}
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  )}
                  <i
                    className="fa fa-ellipsis-v menu-dots"
                    onClick={() => toggleMenu(pageIndex, sectionIndex, questionIndex)}
                  ></i>
                </div>
              </div>
            ))}
            <div className="button-group">
              <button
                onClick={() => addQuestion(pageIndex, sectionIndex)}
                className="button button-secondary"
              >
                <i className="fa fa-plus"></i> Add Question
              </button>
              <button
                onClick={() => removeSection(pageIndex, sectionIndex)}
                className="button button-secondary"
              >
                <i className="fa fa-trash"></i> Remove
              </button>
            </div>
          </div>
        ))}
        <div className="button-group">
          <button onClick={() => addSection(pageIndex)} className="button button-secondary">
            <i className="fa fa-plus"></i> Add Section
          </button>
        </div>
      </div>
    ));
  };

  return (
    <>
      <nav className="navbar">
        <div className="container-fluid">
          <button className="back-button">
            <i className="fa fa-arrow-left"></i> Back
          </button>
          <div className="nav-steps">
            <button className="nav-step active">1. Build</button>
            <button className="nav-step">2. Report</button>
            <button className="nav-step">3. Access</button>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">All changes saved</span>
            <span className="text-muted small">Last published: 20 Feb 2025 7:14 PM</span>
            <button className="publish-button">
              Publish <i className="fa fa-ellipsis-v"></i>
            </button>
            <i className="fa fa-comment text-primary" style={{ cursor: "pointer", fontSize: "16px" }}></i>
          </div>
        </div>
      </nav>

      <div className="template-creator-container">
        <div className="template-form">
          <h1>Create Template</h1>
          <form id="templateForm" onSubmit={saveTemplate}>
            <div className="form-group">
              <label htmlFor="templateName">Template Name</label>
              <input
                type="text"
                id="templateName"
                required
                onChange={updatePreview}
              />
            </div>
            <div className="form-group">
              <label htmlFor="templateDescription">Description</label>
              <textarea id="templateDescription" onChange={updatePreview}></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="logoUpload">Company Logo</label>
              <div id="logoUpload" className="logo-upload" onClick={uploadLogo}>
                {currentTemplate.logo ? (
                  <img src={currentTemplate.logo} alt="Company Logo" className="logo-preview" />
                ) : (
                  <span>Click or drag to upload logo</span>
                )}
              </div>
            </div>
            <div id="pagesList">{renderPages()}</div>
            <div className="button-group">
              <button type="button" onClick={addPage} className="button button-secondary">
                <i className="fa fa-plus"></i> Add Page
              </button>
              <button type="submit" className="button button-primary">
                Save Template
              </button>
            </div>
          </form>
          <div
            className="mt-4 p-3 bg-light rounded"
            style={{
              borderLeft: "4px solid var(--primary-color)",
              background: "#fff",
              borderRadius: "10px",
              boxShadow: "0 2px 8px var(--shadow-color)",
            }}
          >
            <h5 style={{ color: "var(--primary-color)", fontSize: "1.1rem" }}>
              Approval Workflow
            </h5>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              Enhance your review process by assigning an approver to your templates. Try Approvals
              in Inspections for 30 days with Premium.
            </p>
            <button
              className="button button-primary mt-2"
              style={{ padding: "8px 16px", fontSize: "0.9rem" }}
            >
              Start Free Trial <i className="fa fa-rocket"></i>
            </button>
          </div>
        </div>
        <div className="preview-container">
          <div className="mobile-preview" id="mobilePreview" style={{ display: previewVisible ? "block" : "none" }}>
            <div className="screen">
              <button
                className="btn btn-link text-muted"
                style={{ position: "absolute", top: "10px", right: "10px" }}
                onClick={() => setPreviewVisible(!previewVisible)}
              >
                Hide Preview <i className="fa fa-chevron-right"></i>
              </button>
              {currentTemplate.logo && (
                <img
                  src={currentTemplate.logo}
                  alt="Company Logo"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    marginBottom: "20px",
                    display: "block",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                />
              )}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "15px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#333",
                    margin: "0 0 10px 0",
                    textAlign: "center",
                  }}
                >
                  {currentTemplate.name || "Untitled Template"}
                </h2>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  {currentTemplate.description || "No description"}
                </p>
              </div>
              {currentTemplate.pages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  style={{
                    background: "#f9f9f9",
                    borderRadius: "12px",
                    padding: "15px",
                    marginBottom: "20px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: "#333",
                      margin: "0 0 10px 0",
                      borderBottom: "1px solid #eee",
                      paddingBottom: "5px",
                    }}
                  >
                    {page.title}
                  </h3>
                  {page.description && (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#777",
                        margin: "0 0 15px 0",
                      }}
                    >
                      {page.description}
                    </p>
                  )}
                  {page.sections.map((section, sectionIndex) => (
                    <div
                      key={sectionIndex}
                      style={{
                        background: "#fff",
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "15px",
                        border: "1px solid #eee",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "1rem",
                          fontWeight: 500,
                          color: "#555",
                          margin: "0 0 10px 0",
                        }}
                      >
                        {section.title}
                      </h4>
                      {section.questions.map((question, questionIndex) => (
                        <div
                          key={questionIndex}
                          style={{
                            background: "#fafafa",
                            borderRadius: "6px",
                            padding: "10px",
                            marginBottom: "10px",
                            border: "1px solid #e5e5e5",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.9rem",
                              color: "#333",
                              margin: "0 0 5px 0",
                              fontWeight: 500,
                            }}
                          >
                            {question.content || "Untitled Question"}
                            {question.required && (
                              <span style={{ color: "#dc3545" }}>*</span>
                            )}
                          </p>
                          {renderQuestionPreview(question)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="notch">
              <span className="camera"></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;