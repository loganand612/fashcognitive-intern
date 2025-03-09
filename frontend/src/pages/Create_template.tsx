"use client"
import axios from "axios"; 

import type React from "react"
import { useState, useEffect, useRef } from "react"
import "/Users/thilak/PythonFiles/Intern/safety_culture/fashcognitive-intern/frontend/src/assets/Create_template.css"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Plus,
  Calendar,
  User,
  MapPin,
  X,
  Check,
  Image,
  Trash2,
  Move,
  ExternalLink,
  Clock,
} from "lucide-react"

// Types
type ResponseType =
  | "Site"
  | "Inspection date"
  | "Person"
  | "Inspection location"
  | "Text"
  | "Number"
  | "Checkbox"
  | "Yes/No"
  | "Multiple choice"
  | "Slider"
  | "Media"
  | "Annotation"
  | "Date & Time"

type Question = {
  id: string
  text: string
  responseType: ResponseType
  required: boolean
  options?: string[]
  value?: string | string[] | boolean | number | null
}

type Section = {
  id: string
  title: string
  description?: string
  questions: Question[]
  isCollapsed: boolean
}

type Template = {
  id: string
  title: string
  description: string
  sections: Section[]
  lastSaved?: Date
  lastPublished?: Date
  logo?: string
}

// Helper functions
const generateId = () => Math.random().toString(36).substring(2, 9)

const getDefaultQuestion = (responseType: ResponseType = "Text"): Question => ({
  id: generateId(),
  text: "Type question",
  responseType,
  required: false,
  options:
    responseType === "Multiple choice" || responseType === "Yes/No" ? ["Option 1", "Option 2", "Option 3"] : undefined,
  value: null,
})

const getDefaultSection = (title = "Untitled Page"): Section => ({
  id: generateId(),
  title,
  questions: [],
  isCollapsed: false,
})

const getInitialTemplate = (): Template => {
  const titlePageSection: Section = {
    id: generateId(),
    title: "Title Page",
    description: "The Title Page is the first page of your inspection report. You can",
    questions: [
      {
        id: generateId(),
        text: "Site conducted",
        responseType: "Site",
        required: true,
        value: null,
      },
      {
        id: generateId(),
        text: "Conducted on",
        responseType: "Inspection date",
        required: true,
        value: null,
      },
      {
        id: generateId(),
        text: "Prepared by",
        responseType: "Person",
        required: true,
        value: null,
      },
      {
        id: generateId(),
        text: "Location",
        responseType: "Inspection location",
        required: true,
        value: null,
      },
    ],
    isCollapsed: false,
  }

  return {
    id: generateId(),
    title: "Untitled template",
    description: "Add a description",
    sections: [titlePageSection],
    lastSaved: new Date(),
    lastPublished: new Date(),
    logo: undefined,
  }
}

// Main component
const Create_template = () => {
  const [template, setTemplate] = useState<Template>(getInitialTemplate())
  const [activeTab, setActiveTab] = useState<number>(1)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<{ type: "question" | "section"; id: string } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ type: "question" | "section"; id: string } | null>(null)
  const [showResponseTypeMenu, setShowResponseTypeMenu] = useState<string | null>(null)
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(true)
  const [allChangesSaved, setAllChangesSaved] = useState<boolean>(true)
  const [templateData, setTemplateData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/users/create_templates/");
        setTemplateData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError(err instanceof Error ? err.message : "Failed to load template data");
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem("safetyTemplate", JSON.stringify(template))
      setAllChangesSaved(true)
      setTemplate((prev) => ({
        ...prev,
        lastSaved: new Date(),
      }))
    }, 1000)

    return () => clearTimeout(saveTimer)
  }, [template])

  // Load template from localStorage
  useEffect(() => {
    const savedTemplate = localStorage.getItem("safetyTemplate")
    if (savedTemplate) {
      try {
        const parsed = JSON.parse(savedTemplate)
        setTemplate(parsed)
      } catch (e) {
        console.error("Failed to parse saved template", e)
      }
    }
  }, [])

  // Mark changes as unsaved when template is modified
  useEffect(() => {
    setAllChangesSaved(false)
  }, [template])

  // Template manipulation functions
  const updateTemplateTitle = (title: string) => {
    setTemplate((prev) => ({ ...prev, title }))
  }

  const updateTemplateDescription = (description: string) => {
    setTemplate((prev) => ({ ...prev, description }))
  }

  interface Question {
    id: string;
    text: string;
    responseType: string;
    required: boolean;
    order?: number;
    section?: string;
    options?: string[];  // ✅ Fix: Add `options`
    value?: string | number | boolean | null;  // ✅ Fix: Add `value`
  }
  
  interface Section {
    id: string;
    title: string;
    description?: string;
    order?: number;
    template?: string;
    isCollapsed?: boolean;  // ✅ Fix: Add `isCollapsed`
    questions: Question[];
  }
  
  interface Template {
    id: string;
    title: string;
    description?: string;
    logo?: string;  // ✅ Fix: Add `logo`
    sections: Section[];
  }
  
  const prepareTemplateForSaving = (template: Template): Template => {
    return {
      ...template,
      sections: template.sections.map((section: Section, secIndex: number) => ({
        ...section,
        order: secIndex + 1,
        template: template.id,
        questions: section.questions.map((question: Question, qIndex: number) => ({
          ...question,
          order: qIndex + 1,
          section: section.id,
        })),
      })),
    };
  };
  
  // Fix implicit `any` in `.map()`
  const updateQuestionOptions = (sectionId: string, questionId: string, optionIndex: number, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section: Section) => ({
        ...section,
        questions: section.questions.map((question: Question) =>
          question.id === questionId
            ? {
                ...question,
                options: question.options?.map((option: string, idx: number) => (idx === optionIndex ? value : option)),
              }
            : question
        ),
      })),
    }));
  };
  

  

  const handleSave = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/users/create_templates/", template, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Template saved successfully:", response.data);
      alert("Template saved successfully!");
      setAllChangesSaved(true);
      setTemplate((prev) => ({
        ...prev,
        lastSaved: new Date(),
      }));
    } catch (error: unknown) {  // ✅ Type `error` properly
      if (axios.isAxiosError(error)) {
        console.error("❌ Axios Error saving template:", error.response?.data || error.message);
      } else {
        console.error("❌ Unknown error:", error);
      }
      alert("Failed to save template. Check console for details.");
    }
  };

  
  
  // Handle back button
  const handleBack = () => {
    if (window.confirm("Do you want to save before leaving?")) {
      handleSave()
    }
    // Navigate back logic would go here
    console.log("Navigating back...")
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("logo", file);  // ✅ Send as a file
  
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/upload_logo/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      setTemplate((prev) => ({ ...prev, logo: response.data.logo_url }));
    } catch (error) {
      console.error("❌ Error uploading logo:", error);
      alert("Failed to upload logo.");
    }
  };
  
  

  const addSection = () => {
    const newSection = getDefaultSection()
    setTemplate((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }))
    setActiveSectionId(newSection.id)
    setTimeout(() => {
      const newSectionElement =   const toggleSectionCollapse = (sectionId: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
havior: "smooth", block: "start" })
      }
    }, 100)
  }

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.id === sectionId ? { ...section, ...updates } : section)),
    }))
  }

  const deleteSection = (sectionId: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }))
  }

  const toggleSectionCollapse = (sectionId: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, isCollapsed: !section.isCollapsed } : section,
      ),
    }))
  }

  const addQuestion = (sectionId: string, responseType: ResponseType = "Text") => {
    const newQuestion = getDefaultQuestion(responseType)
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: [...section.questions, newQuestion],
            }
          : section,
      ),
    }))
    setActiveQuestionId(newQuestion.id)
  }

  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<Question>) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId ? { ...question, ...updates } : question,
              ),
            }
          : section,
      ),
    }))
  }

  const deleteQuestion = (sectionId: string, questionId: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter((question) => question.id !== questionId),
            }
          : section,
      ),
    }))
  }

  const addQuestionOption = (sectionId: string, questionId: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId && question.options
                  ? {
                      ...question,
                      options: [...question.options, `Option ${question.options.length + 1}`],
                    }
                  : question,
              ),
            }
          : section,
      ),
    }))
  }

  const updateQuestionOption = (sectionId: string, questionId: string, optionIndex: number, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId && question.options
                  ? {
                      ...question,
                      options: question.options.map((option, idx) => (idx === optionIndex ? value : option)),
                    }
                  : question,
              ),
            }
          : section,
      ),
    }))
  }

  const deleteQuestionOption = (sectionId: string, questionId: string, optionIndex: number) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId && question.options
                  ? {
                      ...question,
                      options: question.options.filter((_, idx) => idx !== optionIndex),
                    }
                  : question,
              ),
            }
          : section,
      ),
    }))
  }

  const changeQuestionResponseType = (sectionId: string, questionId: string, responseType: ResponseType) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId
                  ? {
                      ...question,
                      responseType,
                      options:
                        responseType === "Multiple choice" || responseType === "Yes/No"
                          ? question.options || ["Option 1", "Option 2", "Option 3"]
                          : undefined,
                      value: null,
                    }
                  : question,
              ),
            }
          : section,
      ),
    }))
    setShowResponseTypeMenu(null)
  }

  // Drag and drop handlers
  const handleDragStart = (type: "question" | "section", id: string) => {
    setDraggedItem({ type, id })
  }

  const handleDragOver = (type: "question" | "section", id: string, e: React.DragEvent) => {
    e.preventDefault()
    if (draggedItem && draggedItem.id !== id) {
      setDropTarget({ type, id })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedItem || !dropTarget) return

    if (draggedItem.type === "section" && dropTarget.type === "section") {
      // Reorder sections
      setTemplate((prev) => {
        const sections = [...prev.sections]
        const draggedIndex = sections.findIndex((s) => s.id === draggedItem.id)
        const dropIndex = sections.findIndex((s) => s.id === dropTarget.id)

        if (draggedIndex !== -1 && dropIndex !== -1) {
          const [removed] = sections.splice(draggedIndex, 1)
          sections.splice(dropIndex, 0, removed)
        }

        return { ...prev, sections }
      })
    } else if (draggedItem.type === "question" && dropTarget.type === "question") {
      // Find the sections containing the questions
      const draggedSection = template.sections.find((s) => s.questions.some((q) => q.id === draggedItem.id))

      const dropSection = template.sections.find((s) => s.questions.some((q) => q.id === dropTarget.id))

      if (draggedSection && dropSection) {
        setTemplate((prev) => {
          const newSections = [...prev.sections]

          // Find the dragged question
          const draggedSectionIndex = newSections.findIndex((s) => s.id === draggedSection.id)
          const draggedQuestionIndex = newSections[draggedSectionIndex].questions.findIndex(
            (q) => q.id === draggedItem.id,
          )

          // Find the drop target question
          const dropSectionIndex = newSections.findIndex((s) => s.id === dropSection.id)
          const dropQuestionIndex = newSections[dropSectionIndex].questions.findIndex((q) => q.id === dropTarget.id)

          // Remove the dragged question
          const [removedQuestion] = newSections[draggedSectionIndex].questions.splice(draggedQuestionIndex, 1)

          // Insert at the new position
          if (draggedSectionIndex === dropSectionIndex) {
            // Same section
            newSections[dropSectionIndex].questions.splice(dropQuestionIndex, 0, removedQuestion)
          } else {
            // Different sections
            newSections[dropSectionIndex].questions.splice(dropQuestionIndex, 0, removedQuestion)
          }

          return { ...prev, sections: newSections }
        })
      }
    }

    setDraggedItem(null)
    setDropTarget(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDropTarget(null)
  }

  // Mobile helpers
  const handleMobileTextInput = (sectionId: string, questionId: string, value: string) => {
    updateQuestion(sectionId, questionId, { value })
  }

  const handleMobileCheckboxToggle = (sectionId: string, questionId: string, checked: boolean) => {
    updateQuestion(sectionId, questionId, { value: checked })
  }

  const handleMobileOptionSelect = (sectionId: string, questionId: string, option: string) => {
    updateQuestion(sectionId, questionId, { value: option })
  }

  const handleMobileSliderChange = (sectionId: string, questionId: string, value: number) => {
    updateQuestion(sectionId, questionId, { value })
  }

  // Render functions
  const renderResponseTypeIcon = (type: ResponseType) => {
    switch (type) {
      case "Site":
        return (
          <div className="response-type-icon site-icon">
            <MapPin size={14} />
          </div>
        )
      case "Inspection date":
        return <Calendar className="response-type-icon" size={18} />
      case "Person":
        return <User className="response-type-icon" size={18} />
      case "Inspection location":
        return <MapPin className="response-type-icon" size={18} />
      case "Text":
        return <div className="response-type-icon text-icon">Aa</div>
      case "Number":
        return <div className="response-type-icon number-icon">123</div>
      case "Checkbox":
        return (
          <div className="response-type-icon checkbox-icon">
            <Check size={14} />
          </div>
        )
      case "Yes/No":
        return (
          <div className="response-type-icon yes-no-icon">
            <span className="yes">Y</span>/<span className="no">N</span>
          </div>
        )
      case "Multiple choice":
        return <div className="response-type-icon multiple-choice-icon">☰</div>
      case "Slider":
        return <div className="response-type-icon slider-icon">⟷</div>
      case "Media":
        return <Image className="response-type-icon" size={18} />
      case "Annotation":
        return <Edit className="response-type-icon" size={18} />
      case "Date & Time":
        return <Clock className="response-type-icon" size={18} />
      default:
        return <div className="response-type-icon"></div>
    }
  }

  const renderResponseTypeMenu = (sectionId: string, questionId: string) => {
    if (showResponseTypeMenu !== questionId) return null

    const responseTypes: ResponseType[] = [
      "Text",
      "Number",
      "Checkbox",
      "Yes/No",
      "Multiple choice",
      "Slider",
      "Media",
      "Annotation",
      "Date & Time",
      "Site",
      "Inspection date",
      "Person",
      "Inspection location",
    ]

    return (
      <div
        className="response-type-menu"
        style={{
          position: "absolute",
          top: "100%",
          left: "0",
          marginTop: "4px",
          zIndex: 10000,
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "1px solid #e0e4e8",
          width: "240px",
          maxHeight: "400px",
          overflowY: "auto",
          display: "block",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="response-type-menu-header"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #e0e4e8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>Select response type</h3>
          <button
            className="close-button"
            onClick={(e) => {
              e.stopPropagation()
              setShowResponseTypeMenu(null)
            }}
            style={{
              padding: "4px",
              color: "#5b6b79",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="response-type-options" style={{ padding: "8px 0" }}>
          {responseTypes.map((type) => (
            <button
              key={type}
              className="response-type-option"
              onClick={(e) => {
                e.stopPropagation()
                changeQuestionResponseType(sectionId, questionId, type)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "8px 16px",
                gap: "8px",
                border: "none",
                background: "none",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                ;(e.target as HTMLElement).style.backgroundColor = "#f5f7fa"
              }}
              onMouseOut={(e) => {
                ;(e.target as HTMLElement).style.backgroundColor = ""
              }}
            >
              {renderResponseTypeIcon(type)}
              <span style={{ flex: 1, textAlign: "left" }}>{type}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const handleResponseTypeClick = (e: React.MouseEvent, questionId: string) => {
    e.stopPropagation()
    if (showResponseTypeMenu === questionId) {
      setShowResponseTypeMenu(null)
    } else {
      setShowResponseTypeMenu(questionId)
    }
  }

  const renderQuestionResponse = (question: Question, sectionId: string) => {
    switch (question.responseType) {
      case "Site":
        return (
          <div className="response-field site-field">
            <div className="dropdown-field">
              <span>amazon</span>
              <ChevronDown size={16} />
            </div>
            {question.required && <div className="required-indicator"></div>}
            <button className="manage-sites-button">
              Manage sites <ExternalLink size={14} />
            </button>
          </div>
        )

      case "Inspection date":
        return (
          <div className="response-field date-field">
            <div className="date-input">
              <span>Enter date and time</span>
              <Calendar size={16} />
            </div>
          </div>
        )

      case "Person":
        return (
          <div className="response-field person-field">
            <div className="dropdown-field">
              <span>Select person</span>
              <ChevronDown size={16} />
            </div>
          </div>
        )

      case "Inspection location":
        return (
          <div className="response-field location-field">
            <div className="dropdown-field">
              <span>Select location</span>
              <ChevronDown size={16} />
            </div>
          </div>
        )

      case "Text":
        return (
          <div className="response-field text-field">
            <div className="text-input">Text answer</div>
          </div>
        )

      case "Number":
        return (
          <div className="response-field number-field">
            <div className="number-input">0</div>
          </div>
        )

      case "Checkbox":
        return (
          <div className="response-field checkbox-field">
            <div className="checkbox-input">
              <div className="checkbox"></div>
            </div>
          </div>
        )

      case "Yes/No":
        return (
          <div className="response-field yes-no-field">
            <div className="yes-no-options">
              <button className="yes-option">Yes</button>
              <button className="no-option">No</button>
              <button className="na-option">N/A</button>
            </div>
            {question.options && (
              <div className="response-options">
                {question.options.map((option, index) => (
                  <div key={index} className="response-option">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateQuestionOption(sectionId, question.id, index, e.target.value)}
                    />
                    <button
                      className="delete-option"
                      onClick={() => deleteQuestionOption(sectionId, question.id, index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button className="add-option" onClick={() => addQuestionOption(sectionId, question.id)}>
                  + Response
                </button>
              </div>
            )}
          </div>
        )

      case "Multiple choice":
        return (
          <div className="response-field multiple-choice-field">
            <div className="multiple-choice-options">
              {question.options?.map((option, index) => (
                <button key={index} className={`choice-option choice-${index % 4}`}>
                  {option}
                </button>
              ))}
            </div>
            {question.options && (
              <div className="response-options">
                {question.options.map((option, index) => (
                  <div key={index} className="response-option">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateQuestionOption(sectionId, question.id, index, e.target.value)}
                    />
                    <button
                      className="delete-option"
                      onClick={() => deleteQuestionOption(sectionId, question.id, index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button className="add-option" onClick={() => addQuestionOption(sectionId, question.id)}>
                  + Response
                </button>
              </div>
            )}
          </div>
        )

      case "Slider":
        return (
          <div className="response-field slider-field">
            <div className="slider-container">
              <div className="slider-track">
                <div className="slider-thumb"></div>
              </div>
              <div className="slider-labels">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>
        )

      case "Media":
        return (
          <div className="response-field media-field">
            <div className="media-upload">
              <Image size={24} />
              <span>Upload media</span>
            </div>
          </div>
        )

      case "Annotation":
        return (
          <div className="response-field annotation-field">
            <div className="annotation-area">
              <Edit size={24} />
              <span>Draw or annotate</span>
            </div>
          </div>
        )

      case "Date & Time":
        return (
          <div className="response-field date-time-field">
            <div className="date-time-input">
              <span>Select date and time</span>
              <Clock size={16} />
            </div>
          </div>
        )

      default:
        return <div className="response-field">Unknown response type</div>
    }
  }

  const renderQuestion = (question: Question, sectionId: string, index: number) => {
    const isActive = activeQuestionId === question.id
    const isDragging = draggedItem?.type === "question" && draggedItem.id === question.id
    const isDropTarget = dropTarget?.type === "question" && dropTarget.id === question.id

    return (
      <div
        key={question.id}
        ref={(el: HTMLDivElement | null) => {
          if (el) questionRefs.current[question.id] = el
        }}
        className={`question-item ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""} ${isDropTarget ? "drop-target" : ""}`}
        onClick={() => setActiveQuestionId(question.id)}
        draggable
        onDragStart={(e) => handleDragStart("question", question.id)}
        onDragOver={(e) => handleDragOver("question", question.id, e)}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        <div className="question-header">
          <div className="question-drag-handle">
            <Move size={16} />
          </div>
          <div className="question-number">{index + 1}</div>
          <input
            type="text"
            className="question-text"
            value={question.text}
            onChange={(e) => updateQuestion(sectionId, question.id, { text: e.target.value })}
            placeholder="Type question"
          />
        </div>

        <div className="question-body">
          <div
            className="response-type-selector"
            style={{
              position: "relative",
              display: "inline-block",
              minWidth: "200px",
            }}
          >
            <div
              className="selected-response-type"
              onClick={(e) => handleResponseTypeClick(e, question.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                border: "1px solid #e0e4e8",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor: "#fff",
              }}
            >
              {renderResponseTypeIcon(question.responseType)}
              <span style={{ flex: 1 }}>{question.responseType}</span>
              <ChevronDown size={16} />
            </div>
            {renderResponseTypeMenu(sectionId, question.id)}
          </div>

          {renderQuestionResponse(question, sectionId)}
        </div>

        <div className="question-footer">
          <label className="required-checkbox">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => updateQuestion(sectionId, question.id, { required: e.target.checked })}
            />
            Required
          </label>

          <button className="delete-question" onClick={() => deleteQuestion(sectionId, question.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    )
  }

  const handleOver = (type: "section" | "question", id: string, e: React.DragEvent) => {
    e.preventDefault()
    if (draggedItem && draggedItem.id !== id) {
      setDropTarget({ type, id })
    }
  }

  const renderSection = (section: Section, index: number) => {
    const isActive = activeSectionId === section.id
    const isDragging = draggedItem?.type === "section" && draggedItem.id === section.id
    const isDropTarget = dropTarget?.type === "section" && dropTarget.id === section.id
    const isTitlePage = index === 0

    return (
      <div
        key={section.id}
        ref={(el: HTMLDivElement | null) => {
          if (el) sectionRefs.current[section.id] = el
        }}
        className={`section-container ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""} ${
          isDropTarget ? "drop-target" : ""
        }`}
        onClick={() => setActiveSectionId(section.id)}
        draggable={!isTitlePage}
        onDragStart={(e) => !isTitlePage && handleDragStart("section", section.id)}
        onDragOver={(e) => handleOver("section", section.id, e)}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        <div className="section-header">
          <button
            className="collapse-button"
            onClick={(e) => {
              e.stopPropagation()
              toggleSectionCollapse(section.id)
            }}
          >
            {section.isCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className="section-title-container">
            <input
              type="text"
              className="section-title"
              value={section.title}
              onChange={(e) => updateSection(section.id, { title: e.target.value })}
              readOnly={isTitlePage}
            />
            {!isTitlePage && (
              <button className="edit-section-title">
                <Edit size={16} />
              </button>
            )}
          </div>

          {!isTitlePage && (
            <div className="section-actions">
              <button
                className="delete-section-button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm("Are you sure you want to delete this section?")) {
                    deleteSection(section.id)
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {!section.isCollapsed && (
          <>
            {section.description && (
              <div className="section-description">
                {section.description}
                {isTitlePage && <button className="customize-link">customize the Title Page</button>}
                {isTitlePage && " below."}
              </div>
            )}

            <div className="questions-container">
              <div className="questions-header">
                <div className="question-label">Question</div>
                <div className="response-type-label">Type of response</div>
                <button className="add-question-button" onClick={() => addQuestion(section.id)}>
                  <Plus size={16} />
                </button>
              </div>

              {section.questions.map((question, idx) => renderQuestion(question, section.id, idx))}

              <div className="question-actions">
                <button className="add-question-button" onClick={() => addQuestion(section.id)}>
                  <Plus size={16} /> Add Question
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Handle mobile media upload
  const handleMobileMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, sectionId: string, questionId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("File is too large. Please choose an image under 5MB.")
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          updateQuestion(sectionId, questionId, { value: event.target.result as string })
        }
      }
      reader.onerror = (error) => {
        console.error("Error reading file:", error)
        alert("There was an error uploading your image. Please try again.")
      }
      reader.readAsDataURL(file)
    }
  }

  // Render mobile question response
  const renderMobileQuestionResponse = (question: Question, sectionId: string) => {
    switch (question.responseType) {
      case "Text":
        return (
          <input
            type="text"
            className="mobile-text-input"
            placeholder="Text answer"
            value={(question.value as string) || ""}
            onChange={(e) => handleMobileTextInput(sectionId, question.id, e.target.value)}
          />
        )
      case "Number":
        return (
          <input
            type="number"
            className="mobile-number-input"
            placeholder="0"
            value={(question.value as string) || ""}
            onChange={(e) => handleMobileTextInput(sectionId, question.id, e.target.value)}
          />
        )
      case "Checkbox":
        return (
          <div
            className="mobile-checkbox"
            onClick={() => handleMobileCheckboxToggle(sectionId, question.id, !(question.value as boolean))}
          >
            <div className={`mobile-checkbox-box ${question.value ? "checked" : ""}`}>
              {question.value && <Check size={12} />}
            </div>
          </div>
        )
      case "Yes/No":
        return (
          <div className="mobile-yes-no">
            <button
              className={`mobile-yes ${question.value === "Yes" ? "selected" : ""}`}
              onClick={() => handleMobileOptionSelect(sectionId, question.id, "Yes")}
            >
              Yes
            </button>
            <button
              className={`mobile-no ${question.value === "No" ? "selected" : ""}`}
              onClick={() => handleMobileOptionSelect(sectionId, question.id, "No")}
            >
              No
            </button>
            <button
              className={`mobile-na ${question.value === "N/A" ? "selected" : ""}`}
              onClick={() => handleMobileOptionSelect(sectionId, question.id, "N/A")}
            >
              N/A
            </button>
          </div>
        )
      case "Multiple choice":
        return (
          <div className="mobile-multiple-choice">
            {question.options?.map((option, index) => (
              <button
                key={index}
                className={`mobile-choice mobile-choice-${index % 4} ${question.value === option ? "selected" : ""}`}
                onClick={() => handleMobileOptionSelect(sectionId, question.id, option)}
              >
                {option}
              </button>
            ))}
          </div>
        )
      case "Slider":
        return (
          <div className="mobile-slider">
            <input
              type="range"
              min="0"
              max="100"
              value={(question.value as number) || 50}
              onChange={(e) => handleMobileSliderChange(sectionId, question.id, Number.parseInt(e.target.value))}
              className="mobile-slider-input"
            />
            <div className="mobile-slider-labels">
              <span>0</span>
              <span>{question.value || 50}</span>
              <span>100</span>
            </div>
          </div>
        )
      case "Media":
        return (
          <label className="mobile-media-upload">
            <input
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              onChange={(e) => handleMobileMediaUpload(e, sectionId, question.id)}
            />
            {question.value ? (
              <div className="mobile-media-preview">
                <img
                  src={(question.value as string) || "/placeholder.svg"}
                  alt="Uploaded media"
                  className="mobile-media-image"
                />
              </div>
            ) : (
              <>
                <Image size={20} />
                <span>Upload media</span>
              </>
            )}
          </label>
        )
      case "Annotation":
        return (
          <div className="mobile-annotation">
            {question.value ? (
              <div className="mobile-annotation-preview">
                <img
                  src={(question.value as string) || "/placeholder.svg"}
                  alt="Annotation"
                  className="mobile-annotation-image"
                />
              </div>
            ) : (
              <>
                <Edit size={20} />
                <span>Draw or annotate</span>
              </>
            )}
          </div>
        )
      case "Date & Time":
        return (
          <input
            type="datetime-local"
            className="mobile-date-time"
            value={(question.value as string) || ""}
            onChange={(e) => handleMobileTextInput(sectionId, question.id, e.target.value)}
          />
        )
      default:
        return <div>Unknown response type</div>
    }
  }

  // Enhance mobile preview rendering
  const renderMobilePreview = () => {
    if (!showMobilePreview) {
      return (
        <div className="mobile-preview-collapsed">
          <button className="show-mobile-preview-button" onClick={() => setShowMobilePreview(true)}>
            <div className="mobile-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
                <line x1="5" y1="18" x2="19" y2="18" stroke="currentColor" strokeWidth="2" />
                <line x1="9" y1="21" x2="15" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span>Show Preview</span>
          </button>
        </div>
      )
    }

    const activeSection = template.sections.find((s: Section) => s.id === activeSectionId) || template.sections[0]

    return (
      <div className="mobile-preview">
        <div className="mobile-preview-header">
          <button className="mobile-preview-close" onClick={() => setShowMobilePreview(false)}>
            <X size={16} />
            <span>Hide Preview</span>
          </button>
        </div>
        <div className="mobile-device-container">
          <div className="mobile-device">
            <div className="mobile-device-notch"></div>
            <div className="mobile-status-bar">
              <div className="mobile-time">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="mobile-status-icons">
                <div className="mobile-signal"></div>
                <div className="mobile-wifi"></div>
                <div className="mobile-battery"></div>
              </div>
            </div>
            <div className="mobile-content">
              {template.logo && (
                <div className="mobile-header-content">
                  <div className="mobile-logo">
                    <img src={template.logo || "/placeholder.svg"} alt="Template logo" className="mobile-logo-image" />
                  </div>
                  <div className="mobile-template-title">{template.title}</div>
                </div>
              )}
              <div className="mobile-page-indicator">
                Page {template.sections.indexOf(activeSection) + 1} of {template.sections.length}
              </div>
              <input
                type="text"
                className="mobile-page-title"
                value={activeSection.title}
                onChange={(e) => updateSection(activeSection.id, { title: e.target.value })}
                placeholder="Enter page title"
              />
              <div className="mobile-questions">
                {activeSection.questions.map((question: Question, idx: number) => (
                  <div key={question.id} className="mobile-question">
                    <div className="mobile-question-text">
                      {question.required && <span className="mobile-required">*</span>} {question.text}
                    </div>
                    <div className="mobile-question-response">
                      {renderMobileQuestionResponse(question, activeSection.id)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mobile-nav-buttons">
              {template.sections.map((section: Section, index: number) => (
                <div
                  key={section.id}
                  className={`mobile-nav-dot ${section.id === activeSection.id ? "active" : ""}`}
                  onClick={() => setActiveSectionId(section.id)}
                ></div>
              ))}
            </div>
            <div className="mobile-home-indicator"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="template-builder">
      {/* Top navigation bar */}
      <div className="top-navigation">
        <div className="nav-left">
          <div className="company-name">FASHCOGNITIVE</div>
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={16} />
            <span>back</span>
          </button>
        </div>
        <div className="nav-center">
          <div className="nav-tabs">
            <button className={`nav-tab ${activeTab === 1 ? "active" : ""}`} onClick={() => setActiveTab(1)}>
              1. Build
            </button>
            <button className={`nav-tab ${activeTab === 2 ? "active" : ""}`} onClick={() => setActiveTab(2)}>
              2. Report
            </button>
            <button className={`nav-tab ${activeTab === 3 ? "active" : ""}`} onClick={() => setActiveTab(3)}>
              3. Access
            </button>
          </div>
        </div>
        <div className="nav-right">
          <button className="save-button" onClick={handleSave}>
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="builder-content">
        <div className="template-content max-w-4xl mx-auto">
          <div className="template-header">
            <div className="template-logo">
              {template.logo ? (
                <img
                  src={template.logo || "/placeholder.svg"}
                  alt="Template logo"
                  className="logo-image"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                />
              ) : (
                <div className="logo-placeholder" onClick={() => document.getElementById("logo-upload")?.click()}>
                  <Plus size={24} />
                </div>
              )}
              <input id="logo-upload" type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
            </div>
            <div className="template-info">
              <input
                type="text"
                className="template-title"
                value={template.title}
                onChange={(e) => updateTemplateTitle(e.target.value)}
                placeholder="Untitled template"
              />
              <input
                type="text"
                className="template-description"
                value={template.description}
                onChange={(e) => updateTemplateDescription(e.target.value)}
                placeholder="Add a description"
              />
            </div>
          </div>
          <div className="sections-container">
            {template.sections.map((section, idx) => renderSection(section, idx))}
          </div>

          <div className="add-section-container">
            <button className="add-section-button" onClick={addSection}>
              <Plus size={16} /> Add Section
            </button>
          </div>

          <div className="template-footer"></div>
        </div>

        {renderMobilePreview()}
      </div>
    </div>
  )
}

export default Create_template
