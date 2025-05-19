"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ImageIcon, X, ChevronDown, AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react"
import { fetchData, postData } from "../utils/api"

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

interface LogicRule {
  id: string
  condition: string
  value: string | number | string[] | [number, number] | null
  trigger: string | null
  message?: string
}

interface Question {
  id: string
  text: string
  responseType: ResponseType
  required: boolean
  flagged: boolean
  options?: string[]
  value?: string | string[] | boolean | number | null
  logicRules?: LogicRule[]
  multipleSelection?: boolean
}

interface Section {
  id: string
  title: string
  description?: string
  questions: Question[]
}

interface Template {
  id: string
  title: string
  description: string
  sections: Section[]
  logo?: string
}

interface Inspector {
  id: number
  name: string
  email: string
}

// Utility function to resize images
const resizeImage = (base64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img")
    img.crossOrigin = "anonymous"
    img.src = base64
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const MAX_WIDTH = 500
      const scale = Math.min(MAX_WIDTH / img.width, 1)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.8))
      } else {
        reject(new Error("Failed to get canvas context"))
      }
    }
    img.onerror = () => reject(new Error("Failed to load image"))
  })
}

// Helper function to check if a condition is met
const isConditionMet = (question: Question, rule: LogicRule): boolean => {
  if (question.value === null || question.value === undefined) return false

  const value = question.value
  let conditionMet = false

  // Convert values to appropriate types for comparison
  let compareValue = value
  let ruleValue = rule.value

  // For number fields, ensure we're comparing numbers
  if (question.responseType === "Number" || question.responseType === "Slider") {
    compareValue = typeof value === "string" ? Number.parseFloat(value) : typeof value === "number" ? value : 0
    ruleValue =
      typeof rule.value === "string" ? Number.parseFloat(rule.value) : typeof rule.value === "number" ? rule.value : 0
  }

  switch (rule.condition) {
    case "is":
      conditionMet = String(compareValue) === String(ruleValue)
      break
    case "is not":
      conditionMet = String(compareValue) !== String(ruleValue)
      break
    case "contains":
      conditionMet =
        typeof compareValue === "string" && typeof ruleValue === "string" && compareValue.includes(ruleValue)
      break
    case "not contains":
      conditionMet =
        typeof compareValue === "string" && typeof ruleValue === "string" && !compareValue.includes(ruleValue)
      break
    case "greater than":
      conditionMet = typeof compareValue === "number" && typeof ruleValue === "number" && compareValue > ruleValue
      break
    case "less than":
      conditionMet = typeof compareValue === "number" && typeof ruleValue === "number" && compareValue < ruleValue
      break
    case "equal to":
      if (question.responseType === "Number" || question.responseType === "Slider") {
        const numValue = Number(compareValue)
        const numRuleValue = Number(ruleValue)
        conditionMet = !isNaN(numValue) && !isNaN(numRuleValue) && numValue === numRuleValue
      } else {
        conditionMet = String(compareValue) === String(ruleValue)
      }
      break
    case "not equal to":
      conditionMet = compareValue != ruleValue
      break
    case "greater than or equal to":
      conditionMet = typeof compareValue === "number" && typeof ruleValue === "number" && compareValue >= ruleValue
      break
    case "less than or equal to":
      conditionMet = typeof compareValue === "number" && typeof ruleValue === "number" && compareValue <= ruleValue
      break
    default:
      conditionMet = false
  }

  return conditionMet
}

// Main Component
const QuestionAnswering: React.FC = () => {
  const navigate = useNavigate()
  const [template, setTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentInspector, setCurrentInspector] = useState<Inspector | null>(null)

  // Get template ID from URL if available
  const getTemplateIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('templateId')
  }

  // Fetch current inspector information and check assignment status
  const fetchInspectorInfo = async () => {
    try {
      // Get current user info
      const userData = await fetchData('users/current-user/');
      const templateId = getTemplateIdFromUrl();
      if (!templateId) return;

      // Get assignment ID if available
      let assignmentId: string | null = null;
      try {
        const urlParams = new URLSearchParams(window.location.search);
        assignmentId = urlParams.get('assignmentId');
      } catch (e) {
        console.log("No assignment ID in URL");
      }

      // If user is an inspector, set as current inspector
      if (userData.user_role === 'inspector') {
        setCurrentInspector({
          id: userData.id,
          name: `${userData.first_name} ${userData.last_name}`.trim() || userData.username || userData.email.split('@')[0],
          email: userData.email
        });
        console.log('Current inspector set from user data:', userData);

        // Check if this template is assigned to this inspector
        const assignments = await fetchData('users/my-assignments/');
        let currentAssignment;

        if (assignmentId) {
          // If we have an assignment ID, find that specific assignment
          currentAssignment = assignments.find((a: any) => a.id.toString() === assignmentId);
        } else {
          // Otherwise, find any assignment for this template
          currentAssignment = assignments.find((a: any) => a.template.toString() === templateId);
        }

        if (currentAssignment) {
          setAssignment(currentAssignment);
          console.log('Assignment found:', currentAssignment);

          // Check if assignment is completed or expired
          if (currentAssignment.status === 'completed') {
            setAssignmentError('This template has already been completed. It can only be answered again if reassigned by an admin.');
          } else if (currentAssignment.status === 'expired') {
            setAssignmentError('This assignment has expired. Please contact an admin for reassignment.');
          } else if (currentAssignment.status === 'revoked') {
            setAssignmentError('This assignment has been revoked. Please contact an admin for reassignment.');
          }
        } else {
          // No assignment found for this template
          setAssignmentError('You do not have an active assignment for this template. Please contact an admin for assignment.');
        }
      } else {
        // Try to get assignment info for the template
        if (!templateId) return;

        const assignments = await fetchData('users/template-assignments/');
        const currentAssignment = assignments.find((a: any) =>
          a.template.toString() === templateId &&
          (assignmentId ? a.id.toString() === assignmentId : true)
        );

        if (currentAssignment) {
          setAssignment(currentAssignment);
          setCurrentInspector({
            id: currentAssignment.inspector,
            name: currentAssignment.inspector_name || 'Inspector',
            email: currentAssignment.inspector_email || ''
          });
          console.log('Current inspector set from assignment:', currentAssignment);
        }
      }
    } catch (error) {
      console.error('Error fetching inspector info:', error);
      setAssignmentError('Error checking assignment status. Please try again later.');
    }
  };

  // Fetch template data from API
  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true)
      setError(null)

      const templateId = getTemplateIdFromUrl()

      if (templateId) {
        try {
          // First try to fetch with access check (for shared templates)
          let data;
          try {
            data = await fetchData(`users/templates/${templateId}/access-check/`);
          } catch (error) {
            console.log('Access check failed, trying regular endpoint');
            data = await fetchData(`users/templates/${templateId}/`);
          }
          console.log('Loaded template data:', data)

          // Transform the data to match our expected format if needed
          const transformedTemplate: Template = {
            id: data.id.toString(),
            title: data.title,
            description: data.description || "Complete all required fields in this inspection",
            logo: data.logo || "/placeholder.svg?height=80&width=80",
            sections: data.sections.map((section: any) => ({
              id: section.id.toString(),
              title: section.title,
              description: section.description || "",
              questions: section.questions.map((question: any) => ({
                id: question.id.toString(),
                text: question.text,
                responseType: mapResponseType(question.response_type),
                required: question.required || false,
                flagged: question.flagged || false,
                options: question.options || [],
                value: question.value || null,
                logicRules: question.logic_rules || [],
                multipleSelection: question.multiple_selection || false
              }))
            }))
          }

          setTemplate(transformedTemplate)

          // After loading the template, fetch the inspector info
          await fetchInspectorInfo();
        } catch (error) {
          console.error('Error loading template:', error)
          setError('Failed to load template. Using default template.')
          setTemplate(getDefaultTemplate())
        }
      } else {
        // No template ID provided, use default template
        setTemplate(getDefaultTemplate())
      }

      setIsLoading(false)
    }

    fetchTemplate()
  }, [])

  // Map backend response_type to frontend ResponseType
  const mapResponseType = (type: string): ResponseType => {
    const typeMap: {[key: string]: ResponseType} = {
      'site': 'Site',
      'inspection_date': 'Inspection date',
      'person': 'Person',
      'inspection_location': 'Inspection location',
      'text': 'Text',
      'number': 'Number',
      'checkbox': 'Checkbox',
      'yes_no': 'Yes/No',
      'multiple_choice': 'Multiple choice',
      'slider': 'Slider',
      'media': 'Media',
      'annotation': 'Annotation',
      'date_time': 'Date & Time'
    }

    return typeMap[type.toLowerCase()] || 'Text'
  }

  // Default template to use if API fetch fails or no template ID is provided
  const getDefaultTemplate = (): Template => ({
    id: "default-template",
    title: "Safety Inspection Template",
    description: "Complete all required fields in this safety inspection",
    logo: "/placeholder.svg?height=80&width=80",
    sections: [
      {
        id: "section-1",
        title: "General Information",
        description: "Please provide basic information about this inspection",
        questions: [
          {
            id: "q1",
            text: "Site conducted",
            responseType: "Site",
            required: true,
            flagged: false,
            value: null,
          },
          {
            id: "q2",
            text: "Inspection date",
            responseType: "Inspection date",
            required: true,
            flagged: false,
            value: null,
          },
          {
            id: "q3",
            text: "Inspector name",
            responseType: "Person",
            required: true,
            flagged: false,
            value: null,
          },
          {
            id: "q4",
            text: "Location",
            responseType: "Inspection location",
            required: true,
            flagged: false,
            value: null,
          },
        ],
      },
      {
        id: "section-2",
        title: "Safety Checks",
        description: "Complete the following safety checks",
        questions: [
          {
            id: "q5",
            text: "Are all fire exits clear and accessible?",
            responseType: "Yes/No",
            required: true,
            flagged: true,
            value: null,
            logicRules: [
              {
                id: "rule1",
                condition: "is",
                value: "No",
                trigger: "require_action",
                message: "Action required: Clear fire exits immediately",
              },
            ],
          },
          {
            id: "q6",
            text: "How many fire extinguishers are available?",
            responseType: "Number",
            required: true,
            flagged: false,
            value: null,
            logicRules: [
              {
                id: "rule2",
                condition: "less than",
                value: 2,
                trigger: "display_message",
                message: "Warning: There should be at least 2 fire extinguishers",
              },
            ],
          },
          {
            id: "q7",
            text: "Select all safety equipment that is available",
            responseType: "Multiple choice",
            required: true,
            flagged: false,
            multipleSelection: true,
            options: ["First aid kit", "Fire blanket", "Emergency lights", "Safety goggles", "Hard hats"],
            value: null,
          },
          {
            id: "q8",
            text: "Upload a photo of the emergency assembly point",
            responseType: "Media",
            required: true,
            flagged: false,
            value: null,
          },
        ],
      },
      {
        id: "section-3",
        title: "Additional Comments",
        questions: [
          {
            id: "q9",
            text: "Any additional comments or concerns?",
            responseType: "Text",
            required: false,
            flagged: false,
            value: null,
          },
        ],
      },
    ],
  })

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [activeMessages, setActiveMessages] = useState<Record<string, string>>({})
  const [assignment, setAssignment] = useState<any>(null)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)

  // Update answers when template changes
  useEffect(() => {
    if (!template) return

    const initialAnswers: Record<string, any> = {}
    template.sections.forEach((section) => {
      section.questions.forEach((question) => {
        initialAnswers[question.id] = question.value
      })
    })
    setAnswers(initialAnswers)
  }, [template])

  // We'll use the handleAnswerChange function defined below

  // Update inspector field when currentInspector changes
  useEffect(() => {
    if (!template || !currentInspector) return

    // Find the inspector question in the template
    let inspectorQuestionId: string | null = null;

    // Search through all sections and questions to find the inspector field
    template.sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (question.responseType === "Person" && question.text.toLowerCase().includes("inspector")) {
          inspectorQuestionId = question.id;
        }
      })
    })

    // If we found the inspector question and it doesn't have a value yet, set it
    if (inspectorQuestionId && (!answers[inspectorQuestionId] || answers[inspectorQuestionId] === "")) {
      // Use a direct state update to avoid circular dependencies
      setAnswers(prev => ({
        ...prev,
        [inspectorQuestionId as string]: currentInspector.name
      }));

      // Also update the template
      setTemplate(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          sections: prev.sections.map(section => ({
            ...section,
            questions: section.questions.map(q =>
              q.id === inspectorQuestionId ? { ...q, value: currentInspector.name } : q
            )
          }))
        };
      });

      console.log('Auto-filled inspector name:', currentInspector.name);
    }
  }, [currentInspector, template, answers])

  // Check for triggered messages when answers change
  useEffect(() => {
    if (!template) return

    const messages: Record<string, string> = {}

    template.sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (question.logicRules && question.logicRules.length > 0) {
          for (const rule of question.logicRules) {
            if (rule.trigger === "display_message" && isConditionMet(question, rule) && rule.message) {
              messages[question.id] = rule.message
            }
          }
        }
      })
    })

    setActiveMessages(messages)
  }, [answers, template])

  // Redirect to dashboard after 2 seconds when inspection is complete
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout | null = null;

    if (isComplete) {
      redirectTimer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [isComplete, navigate])

  // If template is still loading or not available, show loading state
  if (!template) {
    return (
      <div className="question-answering-container">
        <div className="section-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px', margin: '0 auto 20px' }}></div>
            <p>Loading inspection template...</p>
          </div>
        </div>
      </div>
    )
  }

  const currentSection = template.sections[currentSectionIndex]

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))

    // Update the template with the new value
    setTemplate((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        sections: prev.sections.map((section) => ({
          ...section,
          questions: section.questions.map((q) => (q.id === questionId ? { ...q, value } : q)),
        }))
      }
    })

    // Clear validation error if value is provided
    if (value !== null && value !== undefined && value !== "") {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const handleMediaUpload = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const file = files[0]
      const reader = new FileReader()

      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            // Resize image if it's an image
            const resizedImage = file.type.startsWith("image/")
              ? await resizeImage(event.target.result as string)
              : (event.target.result as string)

            handleAnswerChange(questionId, resizedImage)
          } catch (error) {
            console.error("Error processing media file:", error)
          }
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading media:", error)
    }
  }

  const validateSection = (): boolean => {
    const errors: Record<string, string> = {}

    currentSection.questions.forEach((question) => {
      if (question.required) {
        const value = answers[question.id]
        if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
          errors[question.id] = "This field is required"
        }
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const goToNextSection = () => {
    if (validateSection()) {
      if (template && currentSectionIndex < template.sections.length - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1)
        window.scrollTo(0, 0)
      } else {
        handleSubmit()
      }
    }
  }

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    if (!template) return

    // Check if there's an assignment error
    if (assignmentError) {
      alert(assignmentError);
      return;
    }

    // Check if the assignment is valid
    if (assignment && ['completed', 'expired', 'revoked'].includes(assignment.status)) {
      const statusMessages = {
        'completed': 'This template has already been completed. It can only be answered again if reassigned by an admin.',
        'expired': 'This assignment has expired. Please contact an admin for reassignment.',
        'revoked': 'This assignment has been revoked. Please contact an admin for reassignment.'
      };

      const message = statusMessages[assignment.status as keyof typeof statusMessages] ||
                     'This assignment cannot be submitted due to its current status.';

      setAssignmentError(message);
      alert(message);
      return;
    }

    // Validate all sections
    let hasErrors = false
    const allErrors: Record<string, string> = {}

    template.sections.forEach((section) => {
      section.questions.forEach((question) => {
        if (question.required) {
          const value = answers[question.id]
          if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
            allErrors[question.id] = "This field is required"
            hasErrors = true
          }
        }
      })
    })

    if (hasErrors) {
      setValidationErrors(allErrors)
      // Find the first section with errors
      for (let i = 0; i < template.sections.length; i++) {
        const section = template.sections[i]
        const hasError = section.questions.some((q) => allErrors[q.id])
        if (hasError) {
          setCurrentSectionIndex(i)
          break
        }
      }
      return
    }

    setIsSubmitting(true)

    try {
      // Get template ID from URL
      const templateId = getTemplateIdFromUrl()

      // Get assignment ID if available
      let assignmentId: string | number | null = assignment?.id || null;
      if (!assignmentId) {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          assignmentId = urlParams.get('assignmentId');
        } catch (e) {
          console.log("No assignment ID in URL");
        }
      }

      // Prepare data for submission
      const submissionData = {
        template_id: templateId,
        answers: answers,
        completed_by: currentInspector?.id || null,
        assignment_id: assignmentId
      }

      console.log("Submitting inspection data:", submissionData)

      // Submit the inspection data to the API
      const responseData = await postData('users/submit-inspection/', submissionData);
      console.log("Inspection submitted successfully:", responseData);

      // If this was part of an assignment, update the assignment status
      if (assignmentId) {
        try {
          const completeResponse = await postData(`users/template-assignments/${assignmentId}/complete/`, {});
          console.log("Assignment marked as completed", completeResponse);
        } catch (e) {
          console.warn("Error updating assignment status:", e);
        }
      }

      setIsComplete(true)

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error: any) {
      console.error("Error submitting inspection:", error);

      // Check for specific error messages
      if (error.response?.data?.detail) {
        if (error.response.data.detail.includes('expired')) {
          setAssignmentError('This assignment has expired and cannot be submitted.');
        } else if (error.response.data.detail.includes('completed')) {
          setAssignmentError('This template has already been completed.');
        } else {
          alert(error.response.data.detail);
        }
      } else {
        alert("There was an error submitting your inspection. Please try again.");
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestionResponse = (question: Question) => {
    // We don't need to use value here as it's used in renderResponseInput
    const error = validationErrors[question.id]
    const message = activeMessages[question.id]

    return (
      <div className="question-container" key={question.id}>
        <div className="question-header">
          <div className="question-text">
            {question.text}
            {question.required && <span className="required-indicator">*</span>}
            {question.flagged && <span className="flagged-indicator">⚑</span>}
          </div>
        </div>

        <div className="question-response">
          {renderResponseInput(question)}

          {error && (
            <div className="error-message">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="warning-message">
              <AlertTriangle size={16} />
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderResponseInput = (question: Question) => {
    const value = answers[question.id]

    switch (question.responseType) {
      case "Text":
        return (
          <textarea
            className="text-input"
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
          />
        )

      case "Number":
        return (
          <input
            type="number"
            className="number-input"
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, Number(e.target.value))}
            placeholder="0"
          />
        )

      case "Checkbox":
        return (
          <label className="checkbox-input">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleAnswerChange(question.id, e.target.checked)}
            />
            <span className="checkbox-label">Yes</span>
          </label>
        )

      case "Yes/No":
        return (
          <div className="yes-no-options">
            <button
              className={`option-button ${value === "Yes" ? "selected" : ""}`}
              onClick={() => handleAnswerChange(question.id, "Yes")}
            >
              Yes
            </button>
            <button
              className={`option-button ${value === "No" ? "selected" : ""}`}
              onClick={() => handleAnswerChange(question.id, "No")}
            >
              No
            </button>
            <button
              className={`option-button ${value === "N/A" ? "selected" : ""}`}
              onClick={() => handleAnswerChange(question.id, "N/A")}
            >
              N/A
            </button>
          </div>
        )

      case "Multiple choice":
        return (
          <div className="multiple-choice-options">
            {question.options?.map((option, index) => (
              <label key={index} className="choice-option">
                <input
                  type={question.multipleSelection ? "checkbox" : "radio"}
                  name={`question-${question.id}`}
                  checked={
                    question.multipleSelection ? Array.isArray(value) && value.includes(option) : value === option
                  }
                  onChange={() => {
                    if (question.multipleSelection) {
                      const currentValues = Array.isArray(value) ? [...value] : []
                      if (currentValues.includes(option)) {
                        handleAnswerChange(
                          question.id,
                          currentValues.filter((v) => v !== option),
                        )
                      } else {
                        handleAnswerChange(question.id, [...currentValues, option])
                      }
                    } else {
                      handleAnswerChange(question.id, option)
                    }
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case "Slider":
        return (
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={value || 50}
              onChange={(e) => handleAnswerChange(question.id, Number(e.target.value))}
              className="slider-input"
            />
            <div className="slider-value">{value || 0}</div>
          </div>
        )

      case "Media":
        return (
          <div className="media-upload-container">
            <input
              type="file"
              accept="image/*,video/*"
              id={`media-${question.id}`}
              onChange={(e) => handleMediaUpload(question.id, e)}
              className="sr-only"
            />

            {!value ? (
              <label htmlFor={`media-${question.id}`} className="media-upload-button">
                <ImageIcon size={20} />
                <span>Upload media</span>
              </label>
            ) : (
              <div className="media-preview">
                <img src={value || "/placeholder.svg"} alt="Uploaded media" className="media-image" />
                <button className="media-remove-button" onClick={() => handleAnswerChange(question.id, null)}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )

      case "Annotation":
        return (
          <div className="annotation-container">
            <input
              type="file"
              accept="image/*"
              id={`annotation-${question.id}`}
              onChange={(e) => handleMediaUpload(question.id, e)}
              className="sr-only"
            />

            {!value ? (
              <label htmlFor={`annotation-${question.id}`} className="annotation-upload-button">
                <ImageIcon size={20} />
                <span>Upload image to annotate</span>
              </label>
            ) : (
              <div className="annotation-preview">
                <img src={value || "/placeholder.svg"} alt="Annotation" className="annotation-image" />
                <button className="annotation-remove-button" onClick={() => handleAnswerChange(question.id, null)}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )

      case "Date & Time":
      case "Inspection date":
        return (
          <div className="date-time-container">
            <input
              type="datetime-local"
              value={value || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="date-time-input"
            />
          </div>
        )

      case "Site":
        const siteOptions = ["Main Site", "Secondary Site", "Remote Location", "Headquarters"]
        return (
          <div className="dropdown-container">
            <select
              value={value || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="dropdown-input"
            >
              <option value="" disabled>
                Select site
              </option>
              {siteOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="dropdown-icon" />
          </div>
        )

      case "Person":
        // If this is the inspector field and we have current inspector info, use it
        if (question.text.toLowerCase().includes("inspector")) {
          // Create options array with current inspector if available
          const inspectorOptions = currentInspector
            ? [currentInspector.name]
            : ["No assigned inspector"];

          // If we have the current inspector and no value is set, set it automatically
          if (currentInspector && !value) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => {
              handleAnswerChange(question.id, currentInspector.name);
            }, 0);
          }

          return (
            <div className="dropdown-container">
              <select
                value={value || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="dropdown-input"
              >
                <option value="" disabled>
                  Select inspector
                </option>
                {inspectorOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} {option === currentInspector?.name ? "(Current Inspector)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="dropdown-icon" />
            </div>
          );
        } else {
          // For other person fields, use default options
          const personOptions = ["John Doe", "Jane Smith", "Alex Johnson", "Sam Wilson"]
          return (
            <div className="dropdown-container">
              <select
                value={value || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="dropdown-input"
              >
                <option value="" disabled>
                  Select person
                </option>
                {personOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="dropdown-icon" />
            </div>
          );
        }

      case "Inspection location":
        const locationOptions = ["Main Building", "Warehouse", "Office", "Factory Floor", "Parking Lot"]
        return (
          <div className="dropdown-container">
            <select
              value={value || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="dropdown-input"
            >
              <option value="" disabled>
                Select location
              </option>
              {locationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="dropdown-icon" />
          </div>
        )

      default:
        return <div>Unsupported response type</div>
    }
  }



  if (isComplete) {
    return (
      <div className="question-answering-container">
        <div className="completion-screen">
          <div className="completion-icon">
            <CheckCircle size={64} />
          </div>
          <h2>Inspection Complete!</h2>
          <p>Thank you for completing this inspection. Your responses have been submitted successfully.</p>
          <p>Redirecting to dashboard...</p>
          <button
            className="primary-button"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Show assignment error if there is one
  if (assignmentError) {
    return (
      <div className="question-answering-container">
        <div className="error-screen">
          <div className="error-icon">
            <AlertTriangle size={64} />
          </div>
          <h2>Assignment Error</h2>
          <p>{assignmentError}</p>
          <button
            className="primary-button"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="question-answering-container">
      <div className="template-header">
        <div className="template-logo-container">
          {template.logo && (
            <img src={template.logo || "/placeholder.svg"} alt="Template logo" className="template-logo" />
          )}
        </div>
        <div className="template-info">
          <h1 className="template-title">{template.title}</h1>
          <p className="template-description">{template.description}</p>
        </div>
      </div>

      <div className="progress-indicator">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentSectionIndex + 1) / template.sections.length) * 100}%` }}
          ></div>
        </div>
        <div className="progress-text">
          Section {currentSectionIndex + 1} of {template.sections.length}
        </div>
      </div>

      <div className="section-container">
        <h2 className="section-title">{currentSection.title}</h2>
        {currentSection.description && <p className="section-description">{currentSection.description}</p>}

        <div className="questions-list">
          {currentSection.questions.map((question) => renderQuestionResponse(question))}
        </div>

        <div className="navigation-buttons">
          {currentSectionIndex > 0 && (
            <button className="secondary-button" onClick={goToPreviousSection}>
              <ArrowLeft size={16} />
              Previous
            </button>
          )}

          <button className="primary-button" onClick={goToNextSection} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="loading-spinner"></span>
            ) : currentSectionIndex < template.sections.length - 1 ? (
              "Next"
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionAnswering
