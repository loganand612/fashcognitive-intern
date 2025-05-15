"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp, Edit, Plus, Calendar, User, MapPin, X, Check, ImageIcon, Trash2, Move, Clock, ArrowLeft, ArrowRight, CheckCircle, Settings, Ruler, Box, List, Shirt, FileText, Printer, Bell, MessageSquare, AlertTriangle, Equal, Hash, CircleEqual, CircleSlash, CircleDot, ChevronsRight, ChevronsLeft, ListFilter } from 'lucide-react'
import "./garment-template.css"
import "./print-styles.css"
import AccessManager from "./components/AccessManager"

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

// Type for logic operators
type LogicOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "between"
  | "isOneOf"
  | "isNotOneOf"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "matches"

type TriggerAction = "require_action" | "require_evidence" | "notify" | "ask_questions" | "display_message"

type LogicCondition =
  | "is"
  | "is not"
  | "contains"
  | "not contains"
  | "starts with"
  | "ends with"
  | "matches (regex)"
  | "less than"
  | "less than or equal to"
  | "equal to"
  | "not equal to"
  | "greater than or equal to"
  | "greater than"
  | "between"
  | "not between"
  | "is one of"
  | "is not one of"

interface LogicRule {
  id: string
  condition: LogicCondition
  value: string | number | string[] | [number, number] | null
  trigger: TriggerAction | null
  triggerConfig?: any
  message?: string
  subQuestion?: {
    text: string
    responseType: ResponseType
  }
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
  conditionalProof?: string
  logicResponses?: {
    ruleId: string
    responseType: string
    responseValue: string | boolean | number | null
    responseText?: string
    responseDate?: string
    responseEvidence?: string
    condition?: LogicCondition
    conditionValue?: string | number | string[] | [number, number] | null
  }[]
}

// Garment-specific types
type AQLLevel = "1.0" | "1.5" | "2.5" | "4.0" | "6.5"
type InspectionLevel = "I" | "II" | "III" | "S1" | "S2" | "S3" | "S4"
type SamplingPlan = "Single" | "Double" | "Multiple"
type Severity = "Normal" | "Tightened" | "Reduced"

interface GarmentDetailsContent {
  aqlSettings: {
    aqlLevel: AQLLevel
    inspectionLevel: InspectionLevel
    samplingPlan: SamplingPlan
    severity: Severity
  }
  sizes: string[]
  colors: string[]
  includeCartonOffered: boolean
  includeCartonInspected: boolean
  defaultDefects: string[]
}

interface StandardSectionContent {
  description?: string
  questions: Question[]
}

type SectionType = "standard" | "garmentDetails"

interface AppSection {
  id: string
  type: SectionType
  title: string
  isCollapsed: boolean
  content: StandardSectionContent | GarmentDetailsContent
}

interface Template {
  id: string
  title: string
  description: string
  logo?: string
  sections: AppSection[]
  lastSaved?: Date
  lastPublished?: Date
  startDate?: string
  dueDate?: string
}

interface ReportData {
  quantities: {
    [color: string]: {
      [size: string]: QuantityData
    }
  }
  cartonOffered: string
  cartonInspected: string
  cartonToInspect: string
  defects: {
    type: string
    remarks: string
    critical: number | string
    major: number | string
    minor: number | string
    images?: string[]
  }[]
  aqlSettings: {
    aqlLevel: AQLLevel
    inspectionLevel: InspectionLevel
    samplingPlan: SamplingPlan
    severity: Severity
    status: "PASS" | "FAIL"
  }
  editingAql: boolean
  newSize: string
  newColor: string
  questionAnswers: {
    [questionId: string]: string | string[] | boolean | number | null
  }
}

// Update the type for quantities in ReportData
interface QuantityData {
  [key: string]: string; // This allows indexing with strings
  orderQty: string;
  offeredQty: string;
}

// Type for defect fields
interface DefectData {
  type: string;
  remarks: string;
  critical: number | string;
  major: number | string;
  minor: number | string;
  images?: string[];
  [key: string]: any; // Add index signature
}

// Constants
const AQL_LEVELS: AQLLevel[] = ["1.0", "1.5", "2.5", "4.0", "6.5"]
const INSPECTION_LEVELS: InspectionLevel[] = ["I", "II", "III", "S1", "S2", "S3", "S4"]
const SAMPLING_PLANS: SamplingPlan[] = ["Single", "Double", "Multiple"]
const SEVERITIES: Severity[] = ["Normal", "Tightened", "Reduced"]
const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"]
const DEFAULT_COLORS = ["BLUE", "RED", "BLACK"]
const DEFAULT_DEFECTS = ["Stitching", "Fabric", "Color", "Measurement", "Packing"]
const LOGIC_SUPPORTED_TYPES: ResponseType[] = ["Text", "Number", "Checkbox", "Yes/No", "Multiple choice", "Slider"];

// Utility Functions
const generateId = () => Math.random().toString(36).substring(2, 9)
// Kept for future implementation of logic rules
// Commented out to avoid unused variable warning
// const generateRuleId = () => `rule_${Math.random().toString(36).substring(2, 9)}`
const generateRuleId = () => `rule_${Math.random().toString(36).substring(2, 9)}`

const getDefaultQuestion = (responseType: ResponseType = "Text"): Question => ({
  id: generateId(),
  text: "Type question",
  responseType,
  required: false,
  flagged: false,
  multipleSelection: false,
  options:
    responseType === "Multiple choice" || responseType === "Yes/No" ? ["Option 1", "Option 2", "Option 3"] : undefined,
  value: null,
  logicRules: [],
  logicResponses: []
})

const getDefaultStandardSection = (title = "Untitled Page"): AppSection => ({
  id: generateId(),
  type: "standard",
  title,
  isCollapsed: false,
  content: {
    questions: [],
  },
})

const getDefaultGarmentDetailsSection = (): AppSection => ({
  id: generateId(),
  type: "garmentDetails",
  title: "Garment Inspection Details",
  isCollapsed: false,
  content: {
    aqlSettings: {
      aqlLevel: "2.5",
      inspectionLevel: "II",
      samplingPlan: "Single",
      severity: "Normal",
    },
    sizes: [...DEFAULT_SIZES],
    colors: [...DEFAULT_COLORS],
    includeCartonOffered: true,
    includeCartonInspected: true,
    defaultDefects: [...DEFAULT_DEFECTS],
  },
})

const getInitialTemplate = (): Template => {
  const titlePageSection: AppSection = {
    id: generateId(),
    type: "standard",
    title: "Title Page",
    isCollapsed: false,
    content: {
      description: "The Title Page is the first page of your garment inspection report.",
      questions: [
        {
          id: generateId(),
          text: "Report No",
          responseType: "Text",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
          logicResponses: []
        },
        {
          id: generateId(),
          text: "Factory Name",
          responseType: "Text",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
          logicResponses: []
        },
        {
          id: generateId(),
          text: "Style No",
          responseType: "Text",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
          logicResponses: []
        },
        {
          id: generateId(),
          text: "Site conducted",
          responseType: "Site",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
          logicResponses: []
        },
        {
          id: generateId(),
          text: "Prepared by",
          responseType: "Person",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
          logicResponses: []
        },
        {
          id: generateId(),
          text: "Location",
          responseType: "Inspection location",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
          logicResponses: []
        },
      ],
    },
  }

  const garmentDetailsSection = getDefaultGarmentDetailsSection()

  return {
    id: generateId(),
    title: "Untitled Garment Template",
    description: "Add a description for this garment inspection template",
    sections: [titlePageSection, garmentDetailsSection],
    lastSaved: new Date(),
    lastPublished: new Date(),
    logo: undefined,
  }
}

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

// Type guard function to check if content is GarmentDetailsContent
function isGarmentDetailsContent(content: StandardSectionContent | GarmentDetailsContent): content is GarmentDetailsContent {
  return 'aqlSettings' in content && 'sizes' in content && 'colors' in content;
}

// Helper function to check if a trigger should be shown based on the question's logic rules
const shouldShowTrigger = (question: Question, triggerType: TriggerAction): boolean => {
  if (!question.logicRules || question.logicRules.length === 0) return false
  if (question.value === null || question.value === undefined) return false

  for (const rule of question.logicRules) {
    // Skip rules that don't match the trigger type
    if (rule.trigger !== triggerType) continue

    // Skip rules that have been temporarily disabled
    if ((rule as any).tempDisabled) continue

    // Skip rules with null values (except for "is" and "is not" conditions)
    if (rule.value === null && rule.condition !== "is" && rule.condition !== "is not") continue

    // Evaluate the condition based on the current value
    const value = question.value
    let conditionMet = false

    try {
      switch (rule.condition) {
        case "is":
          conditionMet = String(value) === String(rule.value)
          break
        case "is not":
          conditionMet = String(value) !== String(rule.value)
          break
        case "contains":
          conditionMet = typeof value === "string" && typeof rule.value === "string" && value.includes(rule.value)
          break
        case "not contains":
          conditionMet = typeof value === "string" && typeof rule.value === "string" && !value.includes(rule.value)
          break
        case "starts with":
          conditionMet = typeof value === "string" && typeof rule.value === "string" && value.startsWith(rule.value)
          break
        case "ends with":
          conditionMet = typeof value === "string" && typeof rule.value === "string" && value.endsWith(rule.value)
          break
        case "greater than":
          conditionMet = Number(value) > Number(rule.value)
          break
        case "less than":
          conditionMet = Number(value) < Number(rule.value)
          break
        case "equal to":
          conditionMet = Number(value) === Number(rule.value)
          break
        case "not equal to":
          conditionMet = Number(value) !== Number(rule.value)
          break
        case "greater than or equal to":
          conditionMet = Number(value) >= Number(rule.value)
          break
        case "less than or equal to":
          conditionMet = Number(value) <= Number(rule.value)
          break
        case "between":
          conditionMet =
            Array.isArray(rule.value) &&
            rule.value.length === 2 &&
            Number(value) >= Number(rule.value[0]) &&
            Number(value) <= Number(rule.value[1])
          break
        case "is one of":
          conditionMet = Array.isArray(rule.value) && rule.value.some(item => String(item) === String(value))
          break
        case "is not one of":
          conditionMet = Array.isArray(rule.value) && !rule.value.some(item => String(item) === String(value))
          break
      }
    } catch (error) {
      console.error("Error evaluating condition:", error);
      continue; // Skip this rule if there's an error
    }

    if (conditionMet) {
      return true
    }
  }

  return false
}

// Helper function to get condition icon
const getConditionIcon = (condition: LogicCondition) => {
  switch (condition) {
    case "is":
      return <CircleEqual className="condition-icon" />
    case "is not":
      return <CircleSlash className="condition-icon" />
    case "contains":
      return <CircleDot className="condition-icon" />
    case "not contains":
      return <CircleSlash className="condition-icon" />
    case "starts with":
      return <ChevronsRight className="condition-icon" />
    case "ends with":
      return <ChevronsLeft className="condition-icon" />
    case "matches (regex)":
      return <Hash className="condition-icon" />
    case "less than":
      return <ArrowLeft className="condition-icon" />
    case "less than or equal to":
      return <ArrowLeft className="condition-icon" />
    case "equal to":
      return <Equal className="condition-icon" />
    case "not equal to":
      return <CircleSlash className="condition-icon" />
    case "greater than or equal to":
      return <ArrowRight className="condition-icon" />
    case "greater than":
      return <ArrowRight className="condition-icon" />
    case "between":
      return <ListFilter className="condition-icon" />
    case "not between":
      return <ListFilter className="condition-icon" />
    case "is one of":
      return <ListFilter className="condition-icon" />
    case "is not one of":
      return <ListFilter className="condition-icon" />
    default:
      return <Equal className="condition-icon" />
  }
}

// Utility type guard
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v: unknown) => typeof v === "string")

const renderQuestionResponse = (
  question: Question,
  sectionId: string,
  updateQuestion: (sectionId: string, questionId: string, updates: Partial<Question>) => void
) => {
  switch (question.responseType) {
    case "Text":
      return (
        <div className="response-field text-field">
          <div className="text-input">Text answer</div>
        </div>
      );
    case "Number":
      return (
        <div className="response-field number-field">
          <input
            type="number"
            className="number-input"
            value={(question.value as number) || ""}
            onChange={(e) => updateQuestion(sectionId, question.id, { value: Number(e.target.value) })}
            placeholder="0"
          />
        </div>
      );
    case "Checkbox":
      return (
        <div className="response-field checkbox-field">
          <div className="checkbox-input">
            <div className="checkbox"></div>
          </div>
        </div>
      );
    case "Yes/No":
      return (
        <div className="response-field yes-no-field">
          <div className="yes-no-options">
            <button className="yes-option">Yes</button>
            <button className="no-option">No</button>
            <button className="na-option">N/A</button>
          </div>
        </div>
      );
    case "Multiple choice":
      return (
        <div className="response-field multiple-choice-field">
          <div className="multiple-choice-options">
            {(question.options || []).map((option, idx) => (
              <div key={idx} className="choice-option-container">
                <input
                  type="text"
                  className={`choice-option-input choice-${idx % 4}`}
                  value={option}
                  onChange={(e) => {
                    const updatedOptions = [...(question.options || [])];
                    updatedOptions[idx] = e.target.value;
                    updateQuestion(sectionId, question.id, { options: updatedOptions });
                  }}
                  placeholder={`Option ${idx + 1}`}
                />
                <button
                  className="remove-option-button"
                  onClick={() => {
                    const updatedOptions = [...(question.options || [])];
                    updatedOptions.splice(idx, 1);
                    updateQuestion(sectionId, question.id, { options: updatedOptions });
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              className="add-option-button"
              onClick={() => {
                const updatedOptions = [...(question.options || []), `Option ${(question.options || []).length + 1}`];
                updateQuestion(sectionId, question.id, { options: updatedOptions });
              }}
            >
              <Plus size={14} />
              <span>Add Option</span>
            </button>
          </div>
        </div>
      );
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
      );
    case "Media":
      return (
        <div className="response-field media-field">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={async (e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;

              // Convert files to base64 and store them
              const mediaFiles: string[] = [];

              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();

                reader.onload = async (event) => {
                  const result = event.target?.result as string;
                  if (result) {
                    try {
                      // Resize image if it's an image
                      const resizedImage = file.type.startsWith('image/')
                        ? await resizeImage(result)
                        : result;

                      mediaFiles.push(resizedImage);

                      // Update the question with the new media files
                      if (mediaFiles.length === files.length) {
                        updateQuestion(sectionId, question.id, {
                          value: mediaFiles
                        });
                      }
                    } catch (error) {
                      console.error("Error processing media file:", error);
                    }
                  }
                };

                reader.readAsDataURL(file);
              }
            }}
            className="media-file-input"
            id={`media-upload-${question.id}`}
          />
          <label htmlFor={`media-upload-${question.id}`} className="media-upload">
            <ImageIcon size={20} />
            <span>Upload media</span>
          </label>

          {/* Display uploaded media previews */}
          {Array.isArray(question.value) && question.value.length > 0 && (
            <div className="media-previews">
              {question.value.map((media, index) => (
                <div key={index} className="media-preview-item">
                  {media.startsWith('data:image') ? (
                    <img src={media || "/placeholder.svg"} alt={`Uploaded media ${index + 1}`} />
                  ) : (
                    <div className="video-preview">
                      <FileText size={24} />
                      <span>Media file {index + 1}</span>
                    </div>
                  )}
                  <button
                    className="remove-media-button"
                    onClick={() => {
                      const updatedMedia = [...question.value as string[]];
                      updatedMedia.splice(index, 1);
                      updateQuestion(sectionId, question.id, { value: updatedMedia });
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    case "Annotation":
      return (
        <div className="response-field annotation-field">
          <div className="signature-container">
            <div className="signature-canvas-wrapper">
              {question.value && typeof question.value === 'string' && question.value.startsWith('data:image/png') ? (
                <div className="signature-preview">
                  <img src={question.value || "/placeholder.svg"} alt="Signature" className="signature-image" />
                </div>
              ) : (
                <div className="annotation-placeholder-box">
                  Click to sign in the report page
                </div>
              )}
            </div>
          </div>
        </div>
      );
    case "Date & Time":
    case "Inspection date":
      return (
        <div className="response-field date-time-field">
          <div className="date-time-input">
            <Calendar size={16} />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      );
    case "Site":
    case "Person":
      return (
        <div className="response-field dropdown-input">
          <div className="dropdown-input">
            <span>Select {question.responseType.toLowerCase()}</span>
            <ChevronDown size={16} />
          </div>
        </div>
      );
    case "Inspection location":
      return (
        <div className="response-field location-field">
          <div className="location-input-wrapper">
            <input
              type="text"
              className="text-input"
              value={(question.value as string) || ""}
              onChange={(e) => updateQuestion(sectionId, question.id, { value: e.target.value })}
              placeholder="Enter city, area, or address"
            />
            <button
              className="location-button"
              title="Get current location"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      // Get coordinates
                      const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;

                      // Try to get address from coordinates using reverse geocoding
                      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
                        .then(response => response.json())
                        .then(data => {
                          let locationText = '';
                          if (data && data.address) {
                            const address = data.address;
                            // Create a readable address from components
                            const components = [];
                            if (address.city || address.town || address.village) {
                              components.push(address.city || address.town || address.village);
                            }
                            if (address.state || address.county) {
                              components.push(address.state || address.county);
                            }
                            if (address.country) {
                              components.push(address.country);
                            }
                            locationText = components.join(', ');
                          }

                          // If we couldn't get a readable address, use coordinates
                          if (!locationText) {
                            locationText = coords;
                          }

                          updateQuestion(sectionId, question.id, { value: locationText });
                        })
                        .catch(error => {
                          console.error("Error getting location name:", error);
                          // Fallback to coordinates if geocoding fails
                          updateQuestion(sectionId, question.id, { value: coords });
                        });
                    },
                    (error) => {
                      alert("Error getting location: " + error.message);
                    }
                  );
                } else {
                  alert("Geolocation is not supported by this browser.");
                }
              }}
            >
              <MapPin size={14} />
            </button>
          </div>
          {question.value && (
            <div className="location-display">
              <MapPin size={12} />
              <span>{question.value}</span>
            </div>
          )}
        </div>
      );
    default:
      return <div className="response-field">Unsupported response type</div>;
  }
};

// Enhanced Logic Components
const EnhancedLogicConditionSelector: React.FC<{
  questionType: ResponseType
  selectedCondition: LogicCondition
  onConditionChange: (condition: LogicCondition) => void
  className?: string
}> = ({ questionType, selectedCondition, onConditionChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [availableConditions, setAvailableConditions] = useState<LogicCondition[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const conditions: LogicCondition[] = (() => {
      switch (questionType) {
        case "Text":
          return ["is", "is not", "contains", "not contains", "starts with", "ends with", "matches (regex)"]
        case "Number":
        case "Slider":
          return [
            "less than",
            "less than or equal to",
            "equal to",
            "not equal to",
            "greater than or equal to",
            "greater than",
            "between",
            "not between",
          ]
        case "Checkbox":
        case "Yes/No":
          return ["is", "is not"]
        case "Multiple choice":
          return ["is", "is not", "is one of", "is not one of"]
        case "Media":
        case "Annotation":
          return ["is", "is not"]
        case "Date & Time":
          return ["is", "is not", "less than", "greater than", "between"]
        case "Site":
        case "Person":
        case "Inspection location":
          return ["is", "is not", "is one of", "is not one of"]
        default:
          return ["is", "is not"]
      }
    })()

    setAvailableConditions(conditions)
    if (!conditions.includes(selectedCondition) && conditions.length > 0) {
      onConditionChange(conditions[0])
    }
  }, [questionType, selectedCondition, onConditionChange])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={`enhanced-logic-condition-selector ${className}`} ref={dropdownRef}>
      <div className="selected-condition" onClick={() => setIsOpen(!isOpen)}>
        {getConditionIcon(selectedCondition)}
        <span className="condition-text">{selectedCondition}</span>
        <ChevronDown className={`dropdown-arrow ${isOpen ? "rotate" : ""}`} />
      </div>
      {isOpen && (
        <div className="enhanced-condition-dropdown">
          {availableConditions.map((condition) => (
            <div
              key={condition}
              className={`enhanced-condition-option ${selectedCondition === condition ? "selected" : ""}`}
              onClick={() => {
                onConditionChange(condition)
                setIsOpen(false)
              }}
            >
              {getConditionIcon(condition)}
              <span>{condition}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const EnhancedLogicValueInput: React.FC<{
  questionType: ResponseType
  condition: LogicCondition
  value: string | number | string[] | [number, number] | null
  onChange: (value: string | number | string[] | [number, number]) => void
  options?: string[]
  className?: string
}> = ({ questionType, condition, value, onChange, options = [], className = "" }) => {
  const [rangeStart, setRangeStart] = useState("")
  const [rangeEnd, setRangeEnd] = useState("")

  useEffect(() => {
    if (Array.isArray(value) && value.length === 2 && ["between", "not between"].includes(condition)) {
      setRangeStart(String(value[0] || ""))
      setRangeEnd(String(value[1] || ""))
    }
  }, [value, condition])

  const handleRangeChange = () => {
    if (rangeStart && rangeEnd) {
      if (questionType === "Number") {
        onChange([Number(rangeStart), Number(rangeEnd)] as [number, number])
      } else {
        onChange([rangeStart, rangeEnd] as [string, string])
      }
    }
  }

  const handleOptionToggle = (option: string) => {
    const currentValues = isStringArray(value) ? value : []
    const newValues = currentValues.includes(option)
      ? currentValues.filter((v) => v !== option)
      : [...currentValues, option]
    onChange(newValues)
  }

  if (["between", "not between"].includes(condition)) {
    return (
      <div className={`enhanced-logic-range-input ${className}`}>
        <input
          type={questionType === "Number" ? "number" : "text"}
          placeholder="Min"
          value={rangeStart}
          onChange={(e) => {
            setRangeStart(e.target.value)
            if (rangeEnd) handleRangeChange()
          }}
          className="range-input-min"
        />
        <span className="range-separator">and</span>
        <input
          type={questionType === "Number" ? "number" : "text"}
          placeholder="Max"
          value={rangeEnd}
          onChange={(e) => {
            setRangeEnd(e.target.value)
            if (rangeStart) handleRangeChange()
          }}
          className="range-input-max"
        />
      </div>
    )
  }

  if (["is one of", "is not one of"].includes(condition) && options.length > 0) {
    const currentValues = isStringArray(value) ? value : []
    return (
      <div className={`enhanced-logic-multi-select ${className}`}>
        {options.map((option) => (
          <label key={option} className="enhanced-multi-select-option">
            <input
              type="checkbox"
              className="sr-only"
              checked={currentValues.includes(option)}
              onChange={() => handleOptionToggle(option)}
            />
            <span className={currentValues.includes(option) ? "selected" : ""}>{option}</span>
          </label>
        ))}
      </div>
    )
  }

  if (questionType === "Yes/No") {
    return (
      <div className={`enhanced-logic-yes-no-select ${className}`}>
        {["Yes", "No", "N/A"].map((opt) => (
          <label key={opt} className="enhanced-yes-no-option">
            <input
              type="radio"
              className="sr-only"
              checked={value === opt}
              onChange={() => onChange(opt)}
              name="yes-no-value"
            />
            <span className={value === opt ? "selected" : ""}>{opt}</span>
          </label>
        ))}
      </div>
    )
  }

  if (questionType === "Number") {
    return (
      <input
        type="number"
        value={(value as number) ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="Enter value"
        className={`enhanced-logic-number-input ${className}`}
      />
    )
  }

  return (
    <input
      type="text"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter value"
      className={`enhanced-logic-text-input ${className}`}
    />
  )
}

const EnhancedLogicTriggerSelector: React.FC<{
  selectedTrigger: TriggerAction | null
  onTriggerSelect: (trigger: TriggerAction | null) => void
  onConfigChange?: (config: any) => void
  className?: string
}> = ({ selectedTrigger, onTriggerSelect, onConfigChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const triggers: { value: TriggerAction; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: "require_action",
      label: "Require action",
      icon: <FileText className="trigger-icon" />,
      description: "Require the user to take an action",
    },
    {
      value: "require_evidence",
      label: "Require evidence",
      icon: <ImageIcon className="trigger-icon" />,
      description: "Require the user to upload evidence",
    },
    {
      value: "notify",
      label: "Notify",
      icon: <Bell className="trigger-icon" />,
      description: "Send a notification",
    },
    {
      value: "ask_questions",
      label: "Ask questions",
      icon: <MessageSquare className="trigger-icon" />,
      description: "Ask follow-up questions",
    },
    {
      value: "display_message",
      label: "Display message",
      icon: <AlertTriangle className="trigger-icon" />,
      description: "Show a message to the user",
    },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedTriggerInfo = selectedTrigger ? triggers.find((t) => t.value === selectedTrigger) : null

  return (
    <div className={`enhanced-logic-trigger-selector ${className}`} ref={dropdownRef}>
      {!selectedTrigger ? (
        <button className="enhanced-trigger-button" onClick={() => setIsOpen(!isOpen)}>
          <Plus className="trigger-plus-icon" />
          <span>Add trigger</span>
        </button>
      ) : (
        <div className="enhanced-selected-trigger">
          {selectedTriggerInfo?.icon}
          <span>{selectedTriggerInfo?.label}</span>
          <button
            className="enhanced-clear-trigger"
            onClick={(e) => {
              e.stopPropagation()
              // Use setTimeout to prevent the buffering/spark effect
              setTimeout(() => {
                onTriggerSelect(null)
              }, 10)
            }}
          >
            <X className="clear-icon" />
          </button>
        </div>
      )}

      {isOpen && !selectedTrigger && (
        <div className="enhanced-trigger-dropdown">
          {triggers.map((trigger) => (
            <div
              key={trigger.value}
              className="enhanced-trigger-option"
              onClick={() => {
                onTriggerSelect(trigger.value)
                setIsOpen(false)
              }}
            >
              <div className="enhanced-trigger-icon-container">{trigger.icon}</div>
              <div className="enhanced-trigger-details">
                <div className="enhanced-trigger-label">{trigger.label}</div>
                <div className="enhanced-trigger-description">{trigger.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const EnhancedLogicTriggerConfig: React.FC<{
  trigger: TriggerAction
  config: any
  onConfigChange: (config: any) => void
}> = ({ trigger, config, onConfigChange }) => {
  const [message, setMessage] = useState(config?.message || "")
  const [questionText, setQuestionText] = useState(config?.subQuestion?.text || "")
  const [responseType, setResponseType] = useState<ResponseType>(config?.subQuestion?.responseType || "Text")

  useEffect(() => {
    if (trigger === "display_message") {
      onConfigChange({ ...config, message })
    } else if (trigger === "ask_questions") {
      onConfigChange({
        ...config,
        subQuestion: {
          text: questionText,
          responseType,
        },
      })
    }
  }, [trigger, message, questionText, responseType, config, onConfigChange])

  if (trigger === "display_message") {
    return (
      <div className="enhanced-trigger-config">
        <label className="enhanced-trigger-config-label">Message to display:</label>
        <textarea
          className="enhanced-logic-text-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message to display to the user"
          rows={3}
        />
      </div>
    )
  }

  if (trigger === "ask_questions") {
    return (
      <div className="enhanced-trigger-config">
        <label className="enhanced-trigger-config-label">Follow-up question:</label>
        <input
          type="text"
          className="enhanced-logic-text-input"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter follow-up question"
        />
        <label className="enhanced-trigger-config-label mt-2">Response type:</label>
        <select
          className="enhanced-logic-text-input"
          value={responseType}
          onChange={(e) => setResponseType(e.target.value as ResponseType)}
        >
          <option value="Text">Text</option>
          <option value="Number">Number</option>
          <option value="Yes/No">Yes/No</option>
          <option value="Multiple choice">Multiple choice</option>
        </select>
      </div>
    )
  }

  return null
}

const EnhancedLogicRuleBuilder: React.FC<{
  questionType: ResponseType
  rule: LogicRule
  options?: string[]
  onRuleChange: (rule: LogicRule) => void
  onRuleDelete: () => void
  questions?: Array<{ id: string; text: string }>
  className?: string
}> = ({ questionType, rule, options = [], onRuleChange, onRuleDelete, questions = [], className = "" }) => {
  const [localRule, setLocalRule] = useState<LogicRule>(rule)
  const [showConfig, setShowConfig] = useState(false)

  useEffect(() => {
    onRuleChange(localRule)
  }, [localRule, onRuleChange])

  useEffect(() => {
    setLocalRule(rule)
  }, [rule])

  return (
    <div className={`enhanced-logic-rule-builder ${className}`}>
      <div className="enhanced-logic-rule-content">
        <div className="enhanced-logic-condition-row">
          <span className="enhanced-if-label">If answer</span>
          <EnhancedLogicConditionSelector
            questionType={questionType}
            selectedCondition={localRule.condition}
            onConditionChange={(condition) => setLocalRule({ ...localRule, condition })}
          />
          <EnhancedLogicValueInput
            questionType={questionType}
            condition={localRule.condition}
            value={localRule.value}
            onChange={(value) => setLocalRule({ ...localRule, value })}
            options={options}
          />
        </div>
        <div className="enhanced-logic-trigger-row">
          <span className="enhanced-then-label">then</span>
          <EnhancedLogicTriggerSelector
            selectedTrigger={localRule.trigger}
            onTriggerSelect={(trigger) => {
              // If removing a trigger, hide config panel first to prevent flickering
              if (!trigger) {
                setShowConfig(false)
                // Small delay before updating the rule state to prevent UI flicker
                setTimeout(() => {
                  setLocalRule({
                    ...localRule,
                    trigger: null,
                    triggerConfig: undefined,
                    message: undefined,
                    subQuestion: undefined,
                  })
                }, 10)
              } else {
                // For adding a trigger, update state immediately
                setLocalRule({
                  ...localRule,
                  trigger,
                  triggerConfig: trigger ? {} : undefined,
                  message: trigger === "display_message" ? localRule.message || "" : undefined,
                  subQuestion:
                    trigger === "ask_questions" ? localRule.subQuestion || { text: "", responseType: "Text" } : undefined,
                })
                // Always show config when a trigger is selected
                setShowConfig(true)
              }
            }}
            onConfigChange={(config) => setLocalRule({ ...localRule, triggerConfig: config })}
          />

        </div>
        <div className={`enhanced-logic-config-panel ${showConfig && localRule.trigger ? "" : "hidden"}`}>
          {localRule.trigger && (
            <div className="enhanced-logic-config-row">
              <EnhancedLogicTriggerConfig
                trigger={localRule.trigger}
                config={{
                  message: localRule.message,
                  subQuestion: localRule.subQuestion,
                }}
                onConfigChange={(config) => {
                  setLocalRule({
                    ...localRule,
                    message: config.message,
                    subQuestion: config.subQuestion,
                  })
                }}
              />
            </div>
          )}
        </div>
      </div>
      <button className="enhanced-delete-rule-button" onClick={onRuleDelete} aria-label="Delete rule">
        <Trash2 className="delete-icon" />
      </button>
    </div>
  )
}

const EnhancedLogicRulesContainer: React.FC<{
  questionType: ResponseType
  rules: LogicRule[]
  options?: string[]
  onRulesChange: (rules: LogicRule[]) => void
  questions?: Array<{ id: string; text: string }>
  onClose: () => void
  className?: string
}> = ({ questionType, rules, options = [], onRulesChange, questions = [], onClose, className = "" }) => {
  const addNewRule = () => {
    const defaultCondition: LogicCondition = questionType === "Number" ? "equal to" : "is"
    const newRule: LogicRule = {
      id: generateRuleId(),
      condition: defaultCondition,
      value: null,
      trigger: null,
    }
    onRulesChange([...rules, newRule])
  }

  const updateRule = (index: number, updatedRule: LogicRule) => {
    const newRules = [...rules]
    newRules[index] = updatedRule
    onRulesChange(newRules)
  }

  const deleteRule = (index: number) => {
    const newRules = [...rules]
    newRules.splice(index, 1)
    onRulesChange(newRules)
  }

  return (
    <div className={`enhanced-logic-rules-container ${className}`}>
      <div className="enhanced-logic-header">
        <h3>Logic Rules</h3>
        <button className="enhanced-close-button" onClick={onClose} aria-label="Close">
          <X className="close-icon" />
        </button>
      </div>

      <div className="enhanced-logic-rules-list">
        {rules.length === 0 ? (
          <div className="enhanced-empty-rules">
            <p>No rules added yet. Add your first rule below.</p>
          </div>
        ) : (
          rules.map((rule, index) => (
            <EnhancedLogicRuleBuilder
              key={rule.id}
              questionType={questionType}
              rule={rule}
              options={options}
              onRuleChange={(updatedRule) => updateRule(index, updatedRule)}
              onRuleDelete={() => deleteRule(index)}
              questions={questions}
              className="enhanced-logic-rule-item"
            />
          ))
        )}
      </div>

      <div className="enhanced-logic-rules-actions">
        <button className="enhanced-add-rule-button" onClick={addNewRule}>
          <Plus className="add-icon" />
          <span>Add rule</span>
        </button>
        <button className="enhanced-done-button" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}

const EnhancedAddLogicButton: React.FC<{
  hasRules: boolean
  onClick: () => void
  className?: string
}> = ({ hasRules, onClick, className = "" }) => {
  return (
    <button className={`enhanced-add-logic-button ${hasRules ? "has-rules" : ""} ${className}`} onClick={onClick}>
      <span>{hasRules ? "Edit logic" : "Add logic"}</span>
      {hasRules && <span className="rules-badge">!</span>}
    </button>
  )
}

// This function is not used in the current implementation and contains errors
/* Commenting out this function to fix errors
const renderTriggerUI = (question: Question, activeSection: AppSection) => {
  if (activeSection.type !== "standard") return null;

  // Check if any evidence rule conditions are met
  const evidenceRules = question.logicRules?.filter(r =>
    r.trigger === "require_evidence" && !(r as any).tempDisabled
  );

  // Check if any of the evidence rules' conditions are met
  const shouldShowEvidence = evidenceRules?.some(rule => {
    // If there's no value yet, don't show the evidence UI
    if (question.value === null || question.value === undefined) return false;

    // Evaluate the condition based on the current value
    const value = question.value;
    let conditionMet = false;

    try {
      switch (rule.condition) {
        case "is":
          conditionMet = String(value) === String(rule.value);
          break;
        case "is not":
          conditionMet = String(value) !== String(rule.value);
          break;
        case "contains":
          conditionMet = typeof value === "string" && typeof rule.value === "string" && value.includes(rule.value);
          break;
        case "not contains":
          conditionMet = typeof value === "string" && typeof rule.value === "string" && !value.includes(rule.value);
          break;
        case "starts with":
          conditionMet = typeof value === "string" && typeof rule.value === "string" && value.startsWith(rule.value);
          break;
        case "ends with":
          conditionMet = typeof value === "string" && typeof rule.value === "string" && value.endsWith(rule.value);
          break;
        case "greater than":
          conditionMet = Number(value) > Number(rule.value);
          break;
        case "less than":
          conditionMet = Number(value) < Number(rule.value);
          break;
        case "equal to":
          conditionMet = Number(value) === Number(rule.value);
          break;
        case "not equal to":
          conditionMet = Number(value) !== Number(rule.value);
          break;
        case "greater than or equal to":
          conditionMet = Number(value) >= Number(rule.value);
          break;
        case "less than or equal to":
          conditionMet = Number(value) <= Number(rule.value);
          break;
        case "between":
          conditionMet =
            Array.isArray(rule.value) &&
            rule.value.length === 2 &&
            Number(value) >= Number(rule.value[0]) &&
            Number(value) <= Number(rule.value[1]);
          break;
        case "is one of":
          conditionMet = isStringArray(rule.value) && rule.value.includes(String(value));
          break;
        case "is not one of":
          conditionMet = isStringArray(rule.value) && !rule.value.includes(String(value));
          break;
      }
    } catch (error) {
      console.error("Error evaluating condition:", error);
      return false;
    }

    return conditionMet;
  });

  if (shouldShowEvidence) {
    return (
      <div className="mobile-trigger-container">
        <div className="mobile-trigger-header">
          <Upload size={16} />
          <span>Evidence Required</span>
          <button
            className="mobile-trigger-close"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // If evidence is provided, we don't need to show the trigger anymore
              if (question.conditionalProof) {
                // Find the rule that triggered this
                const rule = question.logicRules?.find(r => r.trigger === "require_evidence");
                if (rule) {
                  // Create a temporary copy of the rule with the trigger set to null
                  // This will hide the trigger UI but keep the rule for future use
                  const updatedRules = question.logicRules?.map(r =>
                    r.id === rule.id ? {...r, tempDisabled: true} : r
                  );

                  // Store the evidence in logicResponses
                  const existingResponses = question.logicResponses || [];
                  const newResponse = {
                    ruleId: rule.id,
                    responseType: "Evidence",
                    responseValue: "Evidence provided",
                    responseEvidence: question.conditionalProof
                  };

                  updateQuestion(activeSection.id, question.id, {
                    logicRules: updatedRules,
                    logicResponses: [...existingResponses, newResponse]
                  });
                }
              }
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="mobile-media-upload">
          <input
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            id={`evidence-upload-${question.id}`}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const reader = new FileReader()
                reader.onload = (event) => {
                  if (event.target?.result) {
                    // Get all rules that triggered this evidence requirement
                    const evidenceRules = question.logicRules?.filter(r =>
                      r.trigger === "require_evidence" && !(r as any).tempDisabled
                    );

                    // Find the specific rule that matches the current condition
                    const matchingRule = evidenceRules?.find(rule => {
                      // Evaluate the condition based on the current value
                      const value = question.value;
                      let conditionMet = false;

                      try {
                        switch (rule.condition) {
                          case "is":
                            conditionMet = String(value) === String(rule.value);
                            break;
                          case "is not":
                            conditionMet = String(value) !== String(rule.value);
                            break;
                          case "contains":
                            conditionMet = typeof value === "string" && typeof rule.value === "string" && value.includes(rule.value);
                            break;
                          case "not contains":
                            conditionMet = typeof value === "string" && typeof rule.value === "string" && !value.includes(rule.value);
                            break;
                          case "starts with":
                            conditionMet = typeof value === "string" && typeof rule.value === "string" && value.startsWith(rule.value);
                            break;
                          case "ends with":
                            conditionMet = typeof value === "string" && typeof rule.value === "string" && value.endsWith(rule.value);
                            break;
                          case "greater than":
                            conditionMet = Number(value) > Number(rule.value);
                            break;
                          case "less than":
                            conditionMet = Number(value) < Number(rule.value);
                            break;
                          case "equal to":
                            conditionMet = Number(value) === Number(rule.value);
                            break;
                          case "not equal to":
                            conditionMet = Number(value) !== Number(rule.value);
                            break;
                          case "greater than or equal to":
                            conditionMet = Number(value) >= Number(rule.value);
                            break;
                          case "less than or equal to":
                            conditionMet = Number(value) <= Number(rule.value);
                            break;
                          case "between":
                            conditionMet =
                              Array.isArray(rule.value) &&
                              rule.value.length === 2 &&
                              Number(value) >= Number(rule.value[0]) &&
                              Number(value) <= Number(rule.value[1]);
                            break;
                          case "is one of":
                            conditionMet = isStringArray(rule.value) && rule.value.some(item => String(item) === String(value));
                            break;
                          case "is not one of":
                            conditionMet = isStringArray(rule.value) && !rule.value.some(item => String(item) === String(value));
                            break;
                        }
                      } catch (error) {
                        console.error("Error evaluating condition:", error);
                        return false;
                      }

                      return conditionMet;
                    });

                    // Use the matching rule or the first evidence rule if no match found
                    const rule = matchingRule || (evidenceRules && evidenceRules.length > 0 ? evidenceRules[0] : null);

                    if (rule) {
                      // Create a temporary copy of the rule with the trigger set to null
                      const updatedRules = question.logicRules?.map(r =>
                        r.id === rule.id ? {...r, tempDisabled: true} : r
                      );

                      // Store the evidence in logicResponses
                      const existingResponses = question.logicResponses || [];

                      // Create a descriptive text based on the condition
                      let conditionDescription = "";
                      try {
                        switch (rule.condition) {
                          case "is":
                            conditionDescription = `is "${rule.value}"`;
                            break;
                          case "is not":
                            conditionDescription = `is not "${rule.value}"`;
                            break;
                          case "contains":
                            conditionDescription = `contains "${rule.value}"`;
                            break;
                          case "not contains":
                            conditionDescription = `does not contain "${rule.value}"`;
                            break;
                          case "starts with":
                            conditionDescription = `starts with "${rule.value}"`;
                            break;
                          case "ends with":
                            conditionDescription = `ends with "${rule.value}"`;
                            break;
                          case "greater than":
                            conditionDescription = `is greater than ${rule.value}`;
                            break;
                          case "less than":
                            conditionDescription = `is less than ${rule.value}`;
                            break;
                          case "equal to":
                            conditionDescription = `equals ${rule.value}`;
                            break;
                          case "not equal to":
                            conditionDescription = `does not equal ${rule.value}`;
                            break;
                          case "greater than or equal to":
                            conditionDescription = `is greater than or equal to ${rule.value}`;
                            break;
                          case "less than or equal to":
                            conditionDescription = `is less than or equal to ${rule.value}`;
                            break;
                          case "between":
                            if (Array.isArray(rule.value) && rule.value.length === 2) {
                              conditionDescription = `is between ${rule.value[0]} and ${rule.value[1]}`;
                            }
                            break;
                          case "is one of":
                            if (isStringArray(rule.value)) {
                              conditionDescription = `is one of [${rule.value.join(", ")}]`;
                            }
                            break;
                          case "is not one of":
                            if (isStringArray(rule.value)) {
                              conditionDescription = `is not one of [${rule.value.join(", ")}]`;
                            }
                            break;
                          default:
                            conditionDescription = `matches condition "${rule.condition}"`;
                        }
                      } catch (error) {
                        console.error("Error creating condition description:", error);
                        conditionDescription = "matches a condition";
                      }

                      const newResponse = {
                        ruleId: rule.id,
                        responseType: "Evidence",
                        responseValue: "Evidence provided",
                        responseText: `Evidence for "${question.text}" when answer ${conditionDescription}`,
                        responseEvidence: event.target.result as string,
                        condition: rule.condition,
                        conditionValue: rule.value
                      };

                      // Update the question with both the conditionalProof and the logicResponse
                      updateQuestion(activeSection.id, question.id, {
                        conditionalProof: event.target.result as string,
                        logicRules: updatedRules,
                        logicResponses: [...existingResponses, newResponse]
                      });
                    } else {
                      // If no rule found, just update the conditionalProof
                      updateQuestion(activeSection.id, question.id, {
                        conditionalProof: event.target.result as string
                      });
                    }
                  }
                }
                reader.readAsDataURL(e.target.files[0])
              }
            }}
          />
          {!question.conditionalProof ? (
            <label htmlFor={`evidence-upload-${question.id}`} className="mobile-media-placeholder">
              <ImageIcon size={20} />
              <span>Upload evidence (photo or video)</span>
            </label>
          ) : (
            <div className="mobile-media-preview">
              <img
                src={question.conditionalProof || "/placeholder.svg"}
                alt="Evidence"
                className="mobile-media-image"
              />
              <button
                className="mobile-media-remove"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()

                  // Find and remove any evidence responses for this question
                  const updatedResponses = question.logicResponses?.filter(
                    response => response.responseType !== "Evidence"
                  ) || [];

                  // Update the question, removing the conditionalProof and any evidence responses
                  updateQuestion(activeSection.id, question.id, {
                    conditionalProof: undefined,
                    logicResponses: updatedResponses
                  })
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Check for require_action trigger
  if (shouldShowTrigger(question, "require_action")) {
    // Get the rule that triggered this
    const rule = question.logicRules?.find(r => r.trigger === "require_action");

    // Function to handle the submit action
    const handleSubmitAction = () => {
      // Show loading state
      setIsSubmittingAction(true);

      // Simulate a delay to show the loading state (remove in production)
      setTimeout(() => {
        if (rule) {
          // Create a temporary copy of the rule with the trigger set to null
          const updatedRules = question.logicRules?.map(r =>
            r.id === rule.id ? {...r, tempDisabled: true} : r
          );

          // Store the action in logicResponses
          if (actionText.trim()) {
            const existingResponses = question.logicResponses || [];
            const newResponse = {
              ruleId: rule.id,
              responseType: "Action",
              responseValue: actionText,
              responseText: "Action taken"
            };

            updateQuestion(activeSection.id, question.id, {
              logicRules: updatedRules,
              logicResponses: [...existingResponses, newResponse]
            });

            // Clear the action text
            setActionText("");
          } else {
            updateQuestion(activeSection.id, question.id, { logicRules: updatedRules });
          }
        }
        setIsSubmittingAction(false);
      }, 800);
    };

    // Function to handle cancel
    const handleCancel = () => {
      // Find the rule that triggered this
      const rule = question.logicRules?.find(r => r.trigger === "require_action");
      if (rule) {
        // Create a temporary copy of the rule with the trigger set to null
        const updatedRules = question.logicRules?.map(r =>
          r.id === rule.id ? {...r, tempDisabled: true} : r
        );
        updateQuestion(activeSection.id, question.id, { logicRules: updatedRules });
      }
    };

    return (
      <div className="mobile-trigger-container">
        <div className="mobile-trigger-header">
          <FileText size={16} />
          <span>Action Required</span>
          <button
            className="mobile-trigger-close"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleCancel();
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="mobile-action-form">
          <input
            type="text"
            className="mobile-text-input"
            placeholder="Describe the action taken..."
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
          />
          <div className="mobile-action-buttons">
            <button
              className={`mobile-action-button ${isSubmittingAction ? 'loading' : ''}`}
              onClick={handleSubmitAction}
              disabled={isSubmittingAction}
            >
              Submit Action
            </button>
            <button
              className="mobile-action-button secondary"
              onClick={handleCancel}
              disabled={isSubmittingAction}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check for notify trigger
  if (shouldShowTrigger(question, "notify")) {
    return (
      <div className="mobile-trigger-container">
        <div className="mobile-notification-banner">
          <Bell size={16} />
          <span>Notification has been sent to the relevant team members.</span>
          <button
            className="mobile-trigger-close"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // Find the rule that triggered this
              const rule = question.logicRules?.find(r => r.trigger === "notify");
              if (rule) {
                // Create a temporary copy of the rule with the trigger set to null
                const updatedRules = question.logicRules?.map(r =>
                  r.id === rule.id ? {...r, tempDisabled: true} : r
                );
                updateQuestion(activeSection.id, question.id, { logicRules: updatedRules });
              }
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Check for display_message trigger
  if (shouldShowTrigger(question, "display_message")) {
    // Get the message from the rule that triggered this
    const rule = question.logicRules?.find((r) => r.trigger === "display_message")
    const message = rule?.message || "Important: This response requires immediate attention."

    return (
      <div className="mobile-trigger-container">
        <div className="mobile-message-banner">
          <AlertTriangle size={16} />
          <span>{message}</span>
          <button
            className="mobile-trigger-close"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (rule) {
                // Create a temporary copy of the rule with the trigger set to null
                const updatedRules = question.logicRules?.map(r =>
                  r.id === rule.id ? {...r, tempDisabled: true} : r
                );
                updateQuestion(activeSection.id, question.id, { logicRules: updatedRules });
              }
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Check for ask_questions trigger
  if (shouldShowTrigger(question, "ask_questions")) {
    // Get the subQuestion from the rule that triggered this
    const rule = question.logicRules?.find((r) => r.trigger === "ask_questions")
    if (!rule) return null;

    const subQuestionText = rule.subQuestion?.text || "Please provide more details about this issue"
    const responseType = rule.subQuestion?.responseType || "Text"

    // Check if we have a temporary response for this question and rule
    const hasResponse = tempLogicResponses &&
                       tempLogicResponses.questionId === question.id &&
                       tempLogicResponses.ruleId === rule.id;

    // Function to handle input changes
    const handleInputChange = (value: string | number | boolean | null) => {
      setTempLogicResponses({
        questionId: question.id,
        ruleId: rule.id,
        value: value
      });
    };

    // Function to remove the trigger rule and store the response
    const removeTriggerRule = (saveResponse = false) => {
      if (!rule) return;

      // Find and temporarily disable the rule that has the ask_questions trigger
      const updatedRules = question.logicRules?.map(r =>
        r.id === rule.id ? {...r, tempDisabled: true} : r
      );

      // If we're saving the response, add it to the question's logicResponses
      if (saveResponse && tempLogicResponses &&
          tempLogicResponses.questionId === question.id &&
          tempLogicResponses.ruleId === rule.id) {

        const existingResponses = question.logicResponses || [];
        const newResponse = {
          ruleId: rule.id,
          responseType: responseType,
          responseValue: tempLogicResponses.value,
          responseText: subQuestionText
        };

        updateQuestion(activeSection.id, question.id, {
          logicRules: updatedRules,
          logicResponses: [...existingResponses, newResponse]
        });

        // Clear the temporary response
        setTempLogicResponses(null);
      } else {
        updateQuestion(activeSection.id, question.id, { logicRules: updatedRules });
      }
    };

    // Function to handle the submit response action
    const handleSubmitResponse = () => {
      // Show loading state
      setIsSubmittingResponse(true);

      // Simulate a delay to show the loading state (remove in production)
      setTimeout(() => {
        // After "processing", remove the trigger rule and save the response
        removeTriggerRule(true);
        setIsSubmittingResponse(false);
      }, 800);
    };

    return (
      <div className="mobile-trigger-container" style={{ transition: "opacity 0.2s ease", opacity: 1 }}>
        <div className="mobile-trigger-header">
          <MessageSquare size={16} />
          <span>Follow-up Questions</span>
          <button
            className="mobile-trigger-close"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              removeTriggerRule(false);
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="mobile-subquestion">
          <div className="mobile-question-text">
            <span className="mobile-required">*</span>
            {subQuestionText}
          </div>
          <div className="mobile-question-response">
            {responseType === "Text" && (
              <textarea
                className="mobile-text-input"
                rows={3}
                placeholder="Enter details here..."
                onChange={(e) => handleInputChange(e.target.value)}
                value={hasResponse && typeof tempLogicResponses?.value === 'string' ? tempLogicResponses.value : ''}
              ></textarea>
            )}
            {responseType === "Yes/No" && (
              <div className="mobile-yes-no">
                <button
                  className={`mobile-yes ${hasResponse && tempLogicResponses?.value === "Yes" ? "selected" : ""}`}
                  onClick={() => handleInputChange("Yes")}
                >
                  Yes
                </button>
                <button
                  className={`mobile-no ${hasResponse && tempLogicResponses?.value === "No" ? "selected" : ""}`}
                  onClick={() => handleInputChange("No")}
                >
                  No
                </button>
                <button
                  className={`mobile-na ${hasResponse && tempLogicResponses?.value === "N/A" ? "selected" : ""}`}
                  onClick={() => handleInputChange("N/A")}
                >
                  N/A
                </button>
              </div>
            )}
            {responseType === "Number" && (
              <input
                type="number"
                className="mobile-number-input"
                placeholder="0"
                onChange={(e) => handleInputChange(Number(e.target.value))}
                value={hasResponse && typeof tempLogicResponses?.value === 'number' ? tempLogicResponses.value : ''}
              />
            )}
            {responseType === "Multiple choice" && (
              <div className="mobile-multiple-choice">
                <button
                  className={`mobile-choice ${hasResponse && tempLogicResponses?.value === "Option 1" ? "selected" : ""}`}
                  onClick={() => handleInputChange("Option 1")}
                >
                  Option 1
                </button>
                <button
                  className={`mobile-choice ${hasResponse && tempLogicResponses?.value === "Option 2" ? "selected" : ""}`}
                  onClick={() => handleInputChange("Option 2")}
                >
                  Option 2
                </button>
                <button
                  className={`mobile-choice ${hasResponse && tempLogicResponses?.value === "Option 3" ? "selected" : ""}`}
                  onClick={() => handleInputChange("Option 3")}
                >
                  Option 3
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mobile-action-buttons">
          <button
            className={`mobile-action-button ${isSubmittingResponse ? 'loading' : ''}`}
            onClick={handleSubmitResponse}
            disabled={isSubmittingResponse || !hasResponse}
          >
            Submit Responses
          </button>
        </div>
      </div>
    )
  }

  return null
} */

// Modify the renderQuestion function to include the Add Logic button
// Find the question-footer div in the renderQuestion function and add the EnhancedAddLogicButton component
// Replace the existing question-footer div with this:
// <div className="question-footer">
//   {LOGIC_SUPPORTED_TYPES.includes(question.responseType) && (
//     <EnhancedAddLogicButton
//       hasRules={question.logicRules?.length ? true : false}
//       onClick={() => {
//         // Only show logic panel for supported types
//         setShowLogicPanel(showLogicPanel === question.id ? null : question.id);
//       }}
//     />
//   )}
//   <label className="required-checkbox">
//     <input
//       type="checkbox"
//       checked={question.required}
//       onChange={(e) => updateQuestion(sectionId, question.id, { required: e.target.checked })}
//     />
//     <span>Required</span>
//   </label>
//   <label className="required-checkbox">
//     <input
//       type="checkbox"
//       checked={question.flagged}
//       onChange={(e) => updateQuestion(sectionId, question.id, { flagged: e.target.checked })}
//     />
//     <span>Flag</span>
//   </label>
//   <button className="delete-question" onClick={() => deleteQuestion(sectionId, question.id)}>
//     <Trash2 size={16} />
//   </button>
//   {showLogicPanel === question.id &&
//     LOGIC_SUPPORTED_TYPES.includes(question.responseType) && (
//     <EnhancedLogicRulesContainer
//       questionType={question.responseType}
//       rules={question.logicRules || []}
//       options={question.options || []}
//       onRulesChange={(rules) => updateQuestion(sectionId, question.id, { logicRules: rules })}
//       questions={template.sections.flatMap((s) => s.type === "standard" ? (s.content as StandardSectionContent).questions.map((q) => ({ id: q.id, text: q.text })) : [])}
//       onClose={() => setShowLogicPanel(null)}
//     />
//   )}
// </div>

// Modify the renderReportQuestionResponse function to include the renderTriggerUI call
// Add this line at the end of the renderReportQuestionResponse function, just before the return statement:
// {renderTriggerUI(question, activeSection)}

// Main Component
const Garment_Template: React.FC = () => {
  const [template, setTemplate] = useState<Template>(getInitialTemplate())
  const [activeTab, setActiveTab] = useState<number>(0)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(template.sections[0]?.id || null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<{ type: "question" | "section"; id: string } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ type: "question" | "section"; id: string } | null>(null)
  const [showResponseTypeMenu, setShowResponseTypeMenu] = useState<string | null>(null)
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(true)
  const [newSize, setNewSize] = useState<string>("")
  const [newColor, setNewColor] = useState<string>("")
  const [newDefect, setNewDefect] = useState<string>("")
  const [defectImages, setDefectImages] = useState<{ [defectIndex: number]: string[] }>({})
  const [startDate, setStartDate] = useState<string>("")
  const [dueDate, setDueDate] = useState<string>("")
  // Commented out unused state variable
  // const [dateErrors, setDateErrors] = useState<{
  //   startDate?: string;
  //   dueDate?: string;
  // }>({})
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [showLogicPanel, setShowLogicPanel] = useState<string | null>(null)
  // Commented out unused state variables
  // const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false)
  // const [isSubmittingResponse, setIsSubmittingResponse] = useState<boolean>(false)
  // const [tempLogicResponses, setTempLogicResponses] = useState<{
  //   questionId: string;
  //   ruleId: string;
  //   value: string | number | boolean | null;
  // } | null>(null)
  // const [actionText, setActionText] = useState<string>("")

  // Report data state - moved to top level
  const [reportData, setReportData] = useState<ReportData>(() => {
    const initialDefects =
      (() => {
        const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
        if (garmentSection && isGarmentDetailsContent(garmentSection.content)) {
          return garmentSection.content.defaultDefects.map((defect: string) => ({
          type: defect,
          remarks: "",
          critical: 0,
          major: 0,
          minor: 0,
          }));
        }
        return [];
      })()

    const initialAqlLevel = (() => {
      const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
      if (garmentSection && isGarmentDetailsContent(garmentSection.content)) {
        return garmentSection.content.aqlSettings.aqlLevel;
      }
      return "2.5"; // default value
    })();
    const initialInspectionLevel = (() => {
      const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
      if (garmentSection && isGarmentDetailsContent(garmentSection.content)) {
        return garmentSection.content.aqlSettings.inspectionLevel;
      }
      return "II"; // default value
    })();
    const initialSamplingPlan = (() => {
      const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
      if (garmentSection && isGarmentDetailsContent(garmentSection.content)) {
        return garmentSection.content.aqlSettings.samplingPlan;
      }
      return "Single"; // default value
    })();
    const initialSeverity = (() => {
      const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
      if (garmentSection && isGarmentDetailsContent(garmentSection.content)) {
        return garmentSection.content.aqlSettings.severity;
      }
      return "Normal"; // default value
    })();

    return {
      quantities: {},
      cartonOffered: "30",
      cartonInspected: "5",
      cartonToInspect: "5",
      defects: initialDefects,
      aqlSettings: {
        aqlLevel: initialAqlLevel,
        inspectionLevel: initialInspectionLevel,
        samplingPlan: initialSamplingPlan,
        severity: initialSeverity,
        status: "PASS",
      },
      editingAql: false,
      newSize: "",
      newColor: "",
      questionAnswers: {},
    }
  })

  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const reportRef = useRef<HTMLDivElement>(null)

  // Template Management
  const updateTemplate = (updates: Partial<Template>) => setTemplate((prev) => ({ ...prev, ...updates }))

  const handleSave = () => {
    updateTemplate({ lastSaved: new Date() })
    console.log("Saving template:", template)
  }

  const handleBack = () => {
    if (window.confirm("Do you want to save before leaving?")) handleSave()
    console.log("Navigating back...")
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.size <= 5 * 1024 * 1024 && file.type.match(/^image\//)) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const result = event.target?.result as string
        if (result) {
          const resizedImage = await resizeImage(result)
          updateTemplate({ logo: resizedImage })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Section Management
  const addStandardSection = () => {
    const newSection = getDefaultStandardSection()
    setTemplate((prev) => ({ ...prev, sections: [...prev.sections, newSection] }))
    setActiveSectionId(newSection.id)
    setTimeout(() => sectionRefs.current[newSection.id]?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
  }

  const updateSection = (sectionId: string, updates: Partial<AppSection>) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    }))
  }

  const deleteSection = (sectionId: string) => {
    // Don't allow deleting the Title Page or the only Garment Details section
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section) return

    if (section.type === "garmentDetails") {
      if (
        window.confirm(
          "Are you sure you want to delete the Garment details section? This will remove all garment-specific configuration.",
        )
      ) {
        setTemplate((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) }))
      }
      return
    }

    if (section.title === "Title Page" && section === template.sections[0]) {
      alert("The Title Page cannot be deleted.")
      return
    }

    setTemplate((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) }))
  }

  const toggleSectionCollapse = (sectionId: string) => {
    const section = template.sections.find((s) => s.id === sectionId)
    if (section) {
      updateSection(sectionId, { isCollapsed: !section.isCollapsed })
    }
  }

  // Question Management
  const addQuestion = (sectionId: string, responseType: ResponseType = "Text") => {
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "standard") return

    const newQuestion = getDefaultQuestion(responseType)
    const updatedContent = {
      ...(section.content as StandardSectionContent),
      questions: [...(section.content as StandardSectionContent).questions, newQuestion],
    }

    updateSection(sectionId, { content: updatedContent })
    setActiveQuestionId(newQuestion.id)
  }

  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<Question>) => {
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "standard") return

    const updatedQuestions = (section.content as StandardSectionContent).questions.map((q) =>
      q.id === questionId ? { ...q, ...updates } : q,
    )

    const updatedContent = {
      ...(section.content as StandardSectionContent),
      questions: updatedQuestions,
    }

    updateSection(sectionId, { content: updatedContent })
  }

  const deleteQuestion = (sectionId: string, questionId: string) => {
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "standard") return

    const updatedQuestions = (section.content as StandardSectionContent).questions.filter((q) => q.id !== questionId)

    const updatedContent = {
      ...(section.content as StandardSectionContent),
      questions: updatedQuestions,
    }

    updateSection(sectionId, { content: updatedContent })
  }

  const changeQuestionResponseType = (sectionId: string, questionId: string, responseType: ResponseType) => {
    updateQuestion(sectionId, questionId, {
      responseType,
      options:
        responseType === "Multiple choice" || responseType === "Yes/No"
          ? ["Option 1", "Option 2", "Option 3"]
          : undefined,
      value: null,
      logicRules: [],
    })
    setShowResponseTypeMenu(null)
  }

  // Garment Details Management
  const updateGarmentDetails = (sectionId: string, updates: Partial<GarmentDetailsContent>) => {
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "garmentDetails") return

    const updatedContent = {
      ...(section.content as GarmentDetailsContent),
      ...updates,
    }

    updateSection(sectionId, { content: updatedContent })
  }

  const addSize = (sectionId: string) => {
    if (!newSize.trim()) return

    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "garmentDetails") return

    const garmentContent = section.content as GarmentDetailsContent
    if (garmentContent.sizes.includes(newSize.trim())) {
      alert("This size already exists")
      return
    }

    const updatedSizes = [...garmentContent.sizes, newSize.trim()]
    updateGarmentDetails(sectionId, { sizes: updatedSizes })
    setNewSize("")
  }

  const removeSize = (sectionId: string, size: string) => {
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "garmentDetails") return

    const garmentContent = section.content as GarmentDetailsContent
    const updatedSizes = garmentContent.sizes.filter((s) => s !== size)
    updateGarmentDetails(sectionId, { sizes: updatedSizes })
  }

  const addColor = (sectionId: string) => {
    if (!newColor.trim()) return

    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "garmentDetails") return

    const garmentContent = section.content as GarmentDetailsContent
    if (garmentContent.colors.includes(newColor.trim())) {
      alert("This color already exists")
      return
    }

    const updatedColors = [...garmentContent.colors, newColor.trim()]
    updateGarmentDetails(sectionId, { colors: updatedColors })
    setNewColor("")
  }

  const removeColor = (sectionId: string, color: string) => {
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "garmentDetails") return

    const garmentContent = section.content as GarmentDetailsContent
    const updatedColors = garmentContent.colors.filter((c) => c !== color)
    updateGarmentDetails(sectionId, { colors: updatedColors })
  }

  const addDefect = (sectionId: string) => {
    if (!newDefect.trim()) return

    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "garmentDetails") return

    const garmentContent = section.content as GarmentDetailsContent
    if (garmentContent.defaultDefects.includes(newDefect.trim())) {
      alert("This defect type already exists")
      return
    }

    const updatedDefects = [...garmentContent.defaultDefects, newDefect.trim()]
    updateGarmentDetails(sectionId, { defaultDefects: updatedDefects })
    setNewDefect("")
  }

  const removeDefect = (sectionId: string, defect: string) => {
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "garmentDetails") return

    const garmentContent = section.content as GarmentDetailsContent
    const updatedDefects = garmentContent.defaultDefects.filter((d) => d !== defect)
    updateGarmentDetails(sectionId, { defaultDefects: updatedDefects })
  }

  const updateAQLSettings = (sectionId: string, field: keyof GarmentDetailsContent["aqlSettings"], value: string) => {
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "garmentDetails") return

    const garmentContent = section.content as GarmentDetailsContent
    const updatedAQLSettings = {
      ...garmentContent.aqlSettings,
      [field]: value,
    }

    updateGarmentDetails(sectionId, { aqlSettings: updatedAQLSettings })
  }

  const toggleCartonSetting = (sectionId: string, field: "includeCartonOffered" | "includeCartonInspected") => {
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "garmentDetails") return

    const garmentContent = section.content as GarmentDetailsContent
    updateGarmentDetails(sectionId, { [field]: !garmentContent[field] })
  }

  // Drag and Drop
  const handleDragStart = (type: "question" | "section", id: string) => {
    // Don't allow dragging the Title Page or Garment Details section
    if (type === "section") {
      const section = template.sections.find((s) => s.id === id)
      if (section?.title === "Title Page" || section?.type === "garmentDetails") {
        return
      }
    }

    setDraggedItem({ type, id })
  }

  const handleDragOver = (type: "question" | "section", id: string, e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedItem) return

    // Don't allow dropping before Title Page or Garment Details
    if (type === "section" && draggedItem.type === "section") {
      const targetSection = template.sections.find((s) => s.id === id)
      if (targetSection?.title === "Title Page" || targetSection?.type === "garmentDetails") {
        return
      }

      const draggedSection = template.sections.find((s) => s.id === draggedItem.id)
      if (draggedSection?.title === "Title Page" || draggedSection?.type === "garmentDetails") {
        return
      }
    }

    if (draggedItem.id !== id) {
      setDropTarget({ type, id })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedItem || !dropTarget) return

    if (draggedItem.type === "section" && dropTarget.type === "section") {
      const sections = [...template.sections]
      const draggedIndex = sections.findIndex((s) => s.id === draggedItem.id)
      const dropIndex = sections.findIndex((s) => s.id === dropTarget.id)

      // Don't allow reordering Title Page or Garment Details
      if (
        sections[draggedIndex].title === "Title Page" ||
        sections[draggedIndex].type === "garmentDetails" ||
        sections[dropIndex].title === "Title Page" ||
        sections[dropIndex].type === "garmentDetails"
      ) {
        setDraggedItem(null)
        setDropTarget(null)
        return
      }

      const [removed] = sections.splice(draggedIndex, 1)
      sections.splice(dropIndex, 0, removed)
      setTemplate((prev) => ({ ...prev, sections }))
    } else if (draggedItem.type === "question" && dropTarget.type === "question") {
      const draggedSectionIndex = template.sections.findIndex(
        (s) =>
          s.type === "standard" && (s.content as StandardSectionContent).questions.some((q) => q.id === draggedItem.id),
      )

      const dropSectionIndex = template.sections.findIndex(
        (s) =>
          s.type === "standard" && (s.content as StandardSectionContent).questions.some((q) => q.id === dropTarget.id),
      )

      if (draggedSectionIndex === -1 || dropSectionIndex === -1) {
        setDraggedItem(null)
        setDropTarget(null)
        return
      }

      const draggedSection = template.sections[draggedSectionIndex]
      const dropSection = template.sections[dropSectionIndex]

      if (draggedSection.type !== "standard" || dropSection.type !== "standard") {
        setDraggedItem(null)
        setDropTarget(null)
        return
      }

      const newSections = [...template.sections]

      const draggedQuestionIndex = (draggedSection.content as StandardSectionContent).questions.findIndex(
        (q) => q.id === draggedItem.id,
      )

      const dropQuestionIndex = (dropSection.content as StandardSectionContent).questions.findIndex(
        (q) => q.id === dropTarget.id,
      )

      const [removedQuestion] = (newSections[draggedSectionIndex].content as StandardSectionContent).questions.splice(
        draggedQuestionIndex,
        1,
      )
      ;(newSections[dropSectionIndex].content as StandardSectionContent).questions.splice(
        dropQuestionIndex,
        0,
        removedQuestion,
      )

      setTemplate((prev) => ({ ...prev, sections: newSections }))
    }

    setDraggedItem(null)
    setDropTarget(null)
  }

  // Report functions
  const handleQuantityChange = (color: string, size: string, field: string, value: string) => {
    setReportData((prev) => {
      const newQuantities = { ...prev.quantities }
      if (!newQuantities[color]) newQuantities[color] = {}
      if (!newQuantities[color][size]) newQuantities[color][size] = { orderQty: "", offeredQty: "" }
      newQuantities[color][size][field] = value
      return { ...prev, quantities: newQuantities }
    })
  }

  const calculateRowTotal = (color: string, field: string) => {
    const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
    const sizes: string[] = garmentSection && isGarmentDetailsContent(garmentSection.content)
      ? garmentSection.content.sizes
      : [];
    let total = 0;
    sizes.forEach((size: string) => {
      const qty = reportData.quantities[color]?.[size]?.[field];
      total += qty ? Number.parseInt(qty, 10) : 0;
    });
    return total;
  };

  const calculateColumnTotal = (size: string, field: string) => {
    const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
    const colors: string[] = garmentSection && isGarmentDetailsContent(garmentSection.content)
      ? garmentSection.content.colors
      : [];
    let total = 0;
    colors.forEach((color: string) => {
      const qty = reportData.quantities[color]?.[size]?.[field];
      total += qty ? Number.parseInt(qty, 10) : 0;
    });
    return total;
  };

  const calculateGrandTotal = (field: string) => {
    const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
    const colors: string[] = garmentSection && isGarmentDetailsContent(garmentSection.content)
      ? garmentSection.content.colors
      : [];
    let total = 0;
    colors.forEach((color: string) => {
      total += calculateRowTotal(color, field);
    });
    return total;
  };

  const addReportDefect = () => {
    setReportData((prev) => ({
      ...prev,
      defects: [...prev.defects, { type: "", remarks: "", critical: 0, major: 0, minor: 0 }],
    }))
  }

  const updateDefect = (index: number, field: string, value: string | number) => {
    setReportData((prev) => {
      const newDefects = [...prev.defects]
      newDefects[index] = { ...newDefects[index], [field]: value }
      return { ...prev, defects: newDefects }
    })
  }

  const handleDefectImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newImages: string[] = []
    let loadedCount = 0

    Array.from(files).forEach((file) => {
      if (file.type.match(/^image\//)) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          if (result) {
            newImages.push(result)
            loadedCount++

            if (loadedCount === files.length) {
              setDefectImages((prev) => {
                const currentImages = prev[index] || []
                return {
                  ...prev,
                  [index]: [...currentImages, ...newImages],
                }
              })
            }
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeDefectImage = (defectIndex: number, imageIndex: number) => {
    setDefectImages((prev) => {
      const newImages = { ...prev }
      if (newImages[defectIndex]) {
        newImages[defectIndex] = newImages[defectIndex].filter((_, idx) => idx !== imageIndex)
      }
      return newImages
    })
  }

  const calculateTotalDefects = (field: string) => {
    return reportData.defects.reduce((total, defect) => {
      // Use type assertion to let TypeScript know we can index this
      const defectItem = defect as DefectData;
      const value = Number.parseInt(defectItem[field]?.toString() || "0", 10);
      return total + (isNaN(value) ? 0 : value);
    }, 0);
  };

  // Commented out unused functions
  // const addReportSize = () => {
  //   if (!reportData.newSize.trim()) return;
  //
  //   const section = template.sections.find((s) => s.type === "garmentDetails");
  //   if (!section || !isGarmentDetailsContent(section.content)) return;
  //
  //   const updatedSizes = [...section.content.sizes, reportData.newSize.trim()];
  //   updateGarmentDetails(section.id, { sizes: updatedSizes });
  //   setReportData((prev) => ({ ...prev, newSize: "" }));
  // };
  //
  // const addReportColor = () => {
  //   if (!reportData.newColor.trim()) return;
  //
  //   const section = template.sections.find((s) => s.type === "garmentDetails");
  //   if (!section || !isGarmentDetailsContent(section.content)) return;
  //
  //   const updatedColors = [...section.content.colors, reportData.newColor.trim()];
  //   updateGarmentDetails(section.id, { colors: updatedColors });
  //   setReportData((prev) => ({ ...prev, newColor: "" }));
  // };
  //
  // const toggleAqlEditing = () => {
  //   setReportData((prev) => ({ ...prev, editingAql: !prev.editingAql }))
  // }
  //
  // const updateAqlResult = (field: string, value: string) => {
  //   setReportData((prev) => ({
  //     ...prev,
  //     aqlSettings: { ...prev.aqlSettings, [field]: value },
  //   }))
  // }

  const updateQuestionAnswer = (questionId: string, value: string | string[] | boolean | number | null) => {
    setReportData((prev) => ({
      ...prev,
      questionAnswers: { ...prev.questionAnswers, [questionId]: value },
    }))
  }

  // Print function using browser's native print capability
  const printReport = () => {
    try {
      setIsExporting(true)
      console.log("Starting print process...")

      // Validate template and report data
      if (!template || !reportData) {
        throw new Error("Template or report data is missing")
      }

      // Ensure we have at least some sample data for testing that matches the image format
      if (Object.keys(reportData.quantities).length === 0) {
        setReportData(prev => ({
          ...prev,
          quantities: {
            "BLUE": {
              "S": { orderQty: "5", offeredQty: "44" },
              "M": { orderQty: "4", offeredQty: "4" },
              "L": { orderQty: "4", offeredQty: "4" },
              "XL": { orderQty: "4", offeredQty: "544" },
              "XXL": { orderQty: "4", offeredQty: "44" }
            },
            "RED": {
              "S": { orderQty: "5", offeredQty: "4" },
              "M": { orderQty: "54", offeredQty: "44" },
              "L": { orderQty: "5", offeredQty: "44" },
              "XL": { orderQty: "55", offeredQty: "3" },
              "XXL": { orderQty: "5", offeredQty: "22" }
            },
            "BLACK": {
              "S": { orderQty: "5", offeredQty: "55" },
              "M": { orderQty: "11", offeredQty: "2" },
              "L": { orderQty: "3", offeredQty: "5" },
              "XL": { orderQty: "3", offeredQty: "55" },
              "XXL": { orderQty: "44", offeredQty: "54" }
            }
          }
        }));
      }

      if (reportData.defects.length === 0) {
        setReportData(prev => ({
          ...prev,
          defects: [
            { type: "Stitching", remarks: "Loose threads", critical: "1", major: "2", minor: "3" },
            { type: "Fabric", remarks: "Color variation", critical: "0", major: "3", minor: "2" },
            { type: "Buttons", remarks: "Missing buttons", critical: "2", major: "1", minor: "0" }
          ]
        }));
      }

      // Set default values for carton information if not provided
      if (!reportData.cartonOffered) {
        setReportData(prev => ({ ...prev, cartonOffered: "50" }));
      }

      if (!reportData.cartonToInspect) {
        setReportData(prev => ({ ...prev, cartonToInspect: "10" }));
      }

      if (!reportData.cartonInspected) {
        setReportData(prev => ({ ...prev, cartonInspected: "10" }));
      }

      // Use setTimeout to ensure state updates have been applied
      setTimeout(() => {
        // Store the current body classes and document title
        const originalBodyClasses = document.body.className;
        const originalTitle = document.title;

        // Set a custom title for the printed document using the template title if available
        document.title = template.title ? `${template.title} - Inspection Report` : "Garment Inspection Report";

        // Add a print-specific class to the body
        document.body.classList.add('printing');

        // Add current date for the footer
        document.documentElement.setAttribute('data-print-date', new Date().toLocaleDateString());

        // Print the document
        window.print();

        // Restore the original body classes and title
        document.body.className = originalBodyClasses;
        document.title = originalTitle;

        // Remove the date attribute
        document.documentElement.removeAttribute('data-print-date');

        console.log("Print process completed");
        setIsExporting(false);
      }, 300);
    } catch (error) {
      console.error("Error during print process:", error);
      alert("Failed to print. Please try again. Error: " + (error instanceof Error ? error.message : "Unknown error"));
      setIsExporting(false);
    }
  }

  // Rendering Helpers
  const renderResponseTypeIcon = (type: ResponseType) => {
    switch (type) {
      case "Site":
        return <MapPin size={18} className="response-type-icon" />
      case "Inspection date":
        return <Calendar size={18} className="response-type-icon" />
      case "Person":
        return <User size={18} className="response-type-icon" />
      case "Inspection location":
        return <MapPin size={18} className="response-type-icon" />
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
        return <ImageIcon size={18} className="response-type-icon" />
      case "Annotation":
        return <Edit size={18} className="response-type-icon" />
      case "Date & Time":
        return <Clock size={18} className="response-type-icon" />
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
      <div className="response-type-menu">
        <div className="response-type-menu-header">
          <h3>Select response type</h3>
          <button className="close-button" onClick={() => setShowResponseTypeMenu(null)}>
            <X size={18} />
          </button>
        </div>
        <div className="response-type-options">
          {responseTypes.map((type) => (
            <button
              key={type}
              className="response-type-option"
              onClick={() => changeQuestionResponseType(sectionId, questionId, type)}
            >
              {renderResponseTypeIcon(type)}
              <span>{type}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderQuestion = (question: Question, sectionId: string, index: number) => {
    const isActive = activeQuestionId === question.id
    const isDragging = draggedItem?.type === "question" && draggedItem.id === question.id
    const isDropTarget = dropTarget?.type === "question" && dropTarget.id === question.id

    return (
      <div
        key={question.id}
        ref={(el) => {
          questionRefs.current[question.id] = el
        }}
        className={`question-item ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""} ${isDropTarget ? "drop-target" : ""}`}
        onClick={() => setActiveQuestionId(question.id)}
        draggable
        onDragStart={() => handleDragStart("question", question.id)}
        onDragOver={(e) => handleDragOver("question", question.id, e)}
        onDrop={handleDrop}
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
          <div className="response-type-selector">
            <div
              className="selected-response-type"
              onClick={(e) => {
                e.stopPropagation()
                setShowResponseTypeMenu(showResponseTypeMenu === question.id ? null : question.id)
              }}
            >
              {renderResponseTypeIcon(question.responseType)}
              <span>{question.responseType}</span>
              <ChevronDown size={16} />
            </div>
            {renderResponseTypeMenu(sectionId, question.id)}
          </div>
          {renderQuestionResponse(question, sectionId, updateQuestion)}
        </div>
        <div className="question-footer">
          {LOGIC_SUPPORTED_TYPES.includes(question.responseType) && (
            <EnhancedAddLogicButton
              hasRules={question.logicRules?.length ? true : false}
              onClick={() => {
                // Only show logic panel for supported types
                setShowLogicPanel(showLogicPanel === question.id ? null : question.id);
              }}
            />
          )}
          <label className="required-checkbox">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => updateQuestion(sectionId, question.id, { required: e.target.checked })}
            />
            <span>Required</span>
          </label>
          <label className="required-checkbox">
            <input
              type="checkbox"
              checked={question.flagged}
              onChange={(e) => updateQuestion(sectionId, question.id, { flagged: e.target.checked })}
            />
            <span>Flag</span>
          </label>
          <button className="delete-question" onClick={() => deleteQuestion(sectionId, question.id)}>
            <Trash2 size={16} />
          </button>
          {showLogicPanel === question.id &&
            LOGIC_SUPPORTED_TYPES.includes(question.responseType) && (
            <EnhancedLogicRulesContainer
              questionType={question.responseType}
              rules={question.logicRules || []}
              options={question.options || []}
              onRulesChange={(rules) => updateQuestion(sectionId, question.id, { logicRules: rules })}
              questions={template.sections.flatMap((s) => s.type === "standard" ? (s.content as StandardSectionContent).questions.map((q) => ({ id: q.id, text: q.text })) : [])}
              onClose={() => setShowLogicPanel(null)}
            />
          )}
        </div>
      </div>
    )
  }

  const renderGarmentDetailsSection = (section: AppSection) => {
    if (section.type !== "garmentDetails") return null

    const garmentContent = section.content as GarmentDetailsContent

    return (
      <div className="garment-details-content">
        <fieldset className="garment-fieldset aql-settings">
          <legend className="garment-legend">
            <Settings size={18} />
            <span>AQL Settings</span>
          </legend>
          <div className="aql-grid">
            <div className="aql-select-group">
              <label htmlFor="aql-level">AQL Level</label>
              <select
                id="aql-level"
                className="garment-select"
                value={garmentContent.aqlSettings.aqlLevel}
                onChange={(e) => updateAQLSettings(section.id, "aqlLevel", e.target.value as AQLLevel)}
              >
                {AQL_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="aql-select-group">
              <label htmlFor="inspection-level">Inspection Level</label>
              <select
                id="inspection-level"
                className="garment-select"
                value={garmentContent.aqlSettings.inspectionLevel}
                onChange={(e) => updateAQLSettings(section.id, "inspectionLevel", e.target.value as InspectionLevel)}
              >
                {INSPECTION_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="aql-select-group">
              <label htmlFor="sampling-plan">Sampling Plan</label>
              <select
                id="sampling-plan"
                className="garment-select"
                value={garmentContent.aqlSettings.samplingPlan}
                onChange={(e) => updateAQLSettings(section.id, "samplingPlan", e.target.value as SamplingPlan)}
              >
                {SAMPLING_PLANS.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>
            <div className="aql-select-group">
              <label htmlFor="severity">Severity</label>
              <select
                id="severity"
                className="garment-select"
                value={garmentContent.aqlSettings.severity}
                onChange={(e) => updateAQLSettings(section.id, "severity", e.target.value as Severity)}
              >
                {SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="garment-fieldset quantity-grid">
          <legend className="garment-legend">
            <Ruler size={18} />
            <span>Quantity Grid Configuration</span>
          </legend>

          <div className="garment-config-group">
            <label className="garment-label">Sizes</label>
            <ul className="garment-item-list">
              {garmentContent.sizes.map((size) => (
                <li key={size} className="garment-item">
                  <span>{size}</span>
                  <div className="garment-item-actions">
                    <button
                      className="garment-item-edit"
                      onClick={() => {
                        const newSize = prompt("Edit size", size)
                        if (newSize && newSize !== size) {
                          const updatedSizes = garmentContent.sizes.map((s) => (s === size ? newSize : s))
                          updateGarmentDetails(section.id, { sizes: updatedSizes })
                        }
                      }}
                      aria-label={`Edit size ${size}`}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="garment-item-remove"
                      onClick={() => removeSize(section.id, size)}
                      aria-label={`Remove size ${size}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="garment-add-item">
              <input
                type="text"
                className="garment-input"
                placeholder="New Size"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSize(section.id)}
              />
              <button className="garment-add-button" onClick={() => addSize(section.id)}>
                Add
              </button>
            </div>
          </div>

          <div className="garment-config-group">
            <label className="garment-label">Colors</label>
            <ul className="garment-item-list">
              {garmentContent.colors.map((color) => (
                <li key={color} className="garment-item">
                  <span>{color}</span>
                  <div className="garment-item-actions">
                    <button
                      className="garment-item-edit"
                      onClick={() => {
                        const newColor = prompt("Edit color", color)
                        if (newColor && newColor !== color) {
                          const updatedColors = garmentContent.colors.map((c) => (c === color ? newColor : c))
                          updateGarmentDetails(section.id, { colors: updatedColors })
                        }
                      }}
                      aria-label={`Edit color ${color}`}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="garment-item-remove"
                      onClick={() => removeColor(section.id, color)}
                      aria-label={`Remove color ${color}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="garment-add-item">
              <input
                type="text"
                className="garment-input"
                placeholder="New Color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addColor(section.id)}
              />
              <button className="garment-add-button" onClick={() => addColor(section.id)}>
                Add
              </button>
            </div>
          </div>
        </fieldset>

        <fieldset className="garment-fieldset carton-counts">
          <legend className="garment-legend">
            <Box size={18} />
            <span>Carton Counts</span>
          </legend>

          <div className="garment-checkbox-group">
            <label className="garment-checkbox-label">
              <input
                type="checkbox"
                checked={garmentContent.includeCartonOffered}
                onChange={() => toggleCartonSetting(section.id, "includeCartonOffered")}
              />
              <span>Include 'No. of Cartons Offered' field</span>
            </label>
          </div>

          <div className="garment-checkbox-group">
            <label className="garment-checkbox-label">
              <input
                type="checkbox"
                checked={garmentContent.includeCartonInspected}
                onChange={() => toggleCartonSetting(section.id, "includeCartonInspected")}
              />
              <span>Include 'No. of Cartons Inspected' field</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="garment-fieldset default-defects">
          <legend className="garment-legend">
            <List size={18} />
            <span>Default Defect Types</span>
          </legend>

          <div className="garment-config-group">
            <label className="garment-label">Initial Defect List</label>
            <ul className="garment-item-list">
              {garmentContent.defaultDefects.map((defect) => (
                <li key={defect} className="garment-item">
                  <span>{defect}</span>
                  <button
                    className="garment-item-remove"
                    onClick={() => removeDefect(section.id, defect)}
                    aria-label={`Remove defect ${defect}`}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="garment-add-item">
              <input
                type="text"
                className="garment-input"
                placeholder="New Defect Type"
                value={newDefect}
                onChange={(e) => setNewDefect(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDefect(section.id)}
              />
              <button className="garment-add-button" onClick={() => addDefect(section.id)}>
                Add
              </button>
            </div>
          </div>
        </fieldset>
      </div>
    )
  }

  const renderStandardSection = (section: AppSection) => {
    if (section.type !== "standard") return null

    const standardContent = section.content as StandardSectionContent

    return (
      <>
        {standardContent.description && <div className="section-description">{standardContent.description}</div>}
        <div className="questions-container">
          <div className="questions-header">
            <div className="question-label">Question</div>
            <div className="response-type-label">Type of response</div>
            <button className="add-question-button" onClick={() => addQuestion(section.id)}>
              <Plus size={16} />
            </button>
          </div>
          {standardContent.questions.map((question, idx) => renderQuestion(question, section.id, idx))}
          <div className="question-actions">
            <button className="add-question-button" onClick={() => addQuestion(section.id)}>
              <Plus size={16} /> Add Question
            </button>
          </div>
        </div>
      </>
    )
  }

  const renderSection = (section: AppSection, index: number) => {
    const isActive = activeSectionId === section.id
    const isDragging = draggedItem?.type === "section" && draggedItem.id === section.id
    const isDropTarget = dropTarget?.type === "section" && dropTarget.id === section.id
    const isTitlePage = index === 0 && section.title === "Title Page"
    const isGarmentDetails = section.type === "garmentDetails"
    const isDraggable = !isTitlePage && !isGarmentDetails

    return (
      <div
        key={section.id}
        ref={(el) => {
          sectionRefs.current[section.id] = el
        }}
        className={`section-container ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""} ${isDropTarget ? "drop-target" : ""} ${isGarmentDetails ? "garment-details-section" : ""}`}
        onClick={() => setActiveSectionId(section.id)}
        draggable={isDraggable}
        onDragStart={() => isDraggable && handleDragStart("section", section.id)}
        onDragOver={(e) => handleDragOver("section", section.id, e)}
        onDrop={handleDrop}
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
              readOnly={isTitlePage || isGarmentDetails}
            />
            {!isTitlePage && !isGarmentDetails && (
              <button className="edit-section-title">
                <Edit size={16} />
              </button>
            )}
            {isGarmentDetails && (
              <div className="section-icon">
                <Shirt size={16} />
              </div>
            )}
          </div>
          <div className="section-actions">
            <button
              className="delete-section-button"
              onClick={(e) => {
                e.stopPropagation()
                deleteSection(section.id)
              }}
              disabled={isTitlePage}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {!section.isCollapsed && (
          <>
            {section.type === "standard" && renderStandardSection(section)}
            {section.type === "garmentDetails" && renderGarmentDetailsSection(section)}
          </>
        )}
      </div>
    )
  }

  const renderReportQuestionResponse = (
    question: Question,
    reportData: ReportData,
    updateQuestionAnswer: (questionId: string, value: string | string[] | boolean | number | null) => void,
    activeSection: AppSection
  ) => {
    const value =
      reportData.questionAnswers[question.id] !== undefined ? reportData.questionAnswers[question.id] : question.value;

    switch (question.responseType) {
      case "Text":
      case "Site":
      case "Person":
      case "Inspection location":
        return (
          <div className="report-response-field compact-field">
            {question.responseType === "Inspection location" ? (
              <div className="location-field-report">
                <div className="location-input-wrapper">
                  <input
                    type="text"
                    className="report-text-input"
                    value={(value as string) || ""}
                    onChange={(e) => updateQuestionAnswer(question.id, e.target.value)}
                    placeholder="Enter city, area, or address"
                  />
                  <button
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            // Get coordinates
                            const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;

                            // Try to get address from coordinates using reverse geocoding
                            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
                              .then(response => response.json())
                              .then(data => {
                                let locationText = '';
                                if (data && data.address) {
                                  const address = data.address;
                                  // Create a readable address from components
                                  const components = [];
                                  if (address.city || address.town || address.village) {
                                    components.push(address.city || address.town || address.village);
                                  }
                                  if (address.state || address.county) {
                                    components.push(address.state || address.county);
                                  }
                                  if (address.country) {
                                    components.push(address.country);
                                  }
                                  locationText = components.join(', ');
                                }

                                // If we couldn't get a readable address, use coordinates
                                if (!locationText) {
                                  locationText = coords;
                                }

                                updateQuestionAnswer(question.id, locationText);
                              })
                              .catch(error => {
                                console.error("Error getting location name:", error);
                                // Fallback to coordinates if geocoding fails
                                updateQuestionAnswer(question.id, coords);
                              });
                          },
                          (error) => {
                            alert("Error getting location: " + error.message);
                          }
                        );
                      } else {
                        alert("Geolocation is not supported by this browser.");
                      }
                    }}
                    className="report-location-button"
                    title="Get current location"
                  >
                    <MapPin size={14} />
                  </button>
                </div>
                {value && (
                  <div className="location-display">
                    <MapPin size={12} />
                    <span>{value}</span>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                className="report-text-input"
                value={(value as string) || ""}
                onChange={(e) => updateQuestionAnswer(question.id, e.target.value)}
                placeholder={`Enter ${question.responseType.toLowerCase()}`}
              />
            )}
          </div>
        );
      case "Number":
        return (
          <div className="report-response-field">
            <input
              type="number"
              className="report-number-input"
              value={(value as number) || ""}
              onChange={(e) => updateQuestionAnswer(question.id, Number(e.target.value))}
              placeholder="0"
            />
          </div>
        );
      case "Checkbox":
        return (
          <div className="report-response-field">
            <label className="report-checkbox-label">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => updateQuestionAnswer(question.id, e.target.checked)}
              />
              <span>Yes</span>
            </label>
          </div>
        );
      case "Yes/No":
        return (
          <div className="report-response-field">
            <div className="report-yes-no-options">
              <label className="report-radio-label">
                <input
                  type="radio"
                  name={`yesno-${question.id}`}
                  value="Yes"
                  checked={value === "Yes"}
                  onChange={() => updateQuestionAnswer(question.id, "Yes")}
                />
                <span>Yes</span>
              </label>
              <label className="report-radio-label">
                <input
                  type="radio"
                  name={`yesno-${question.id}`}
                  value="No"
                  checked={value === "No"}
                  onChange={() => updateQuestionAnswer(question.id, "No")}
                />
                <span>No</span>
              </label>
              <label className="report-radio-label">
                <input
                  type="radio"
                  name={`yesno-${question.id}`}
                  value="N/A"
                  checked={value === "N/A"}
                  onChange={() => updateQuestionAnswer(question.id, "N/A")}
                />
                <span>N/A</span>
              </label>
            </div>
          </div>
        );
      case "Multiple choice":
        return (
          <div className="report-response-field">
            <select
              className="report-select"
              value={(value as string) || ""}
              onChange={(e) => updateQuestionAnswer(question.id, e.target.value)}
            >
              <option value="">Select an option</option>
              {(question.options || []).map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      case "Slider":
        return (
          <div className="report-response-field">
            <input
              type="range"
              min="0"
              max="100"
              value={(value as number) || 0}
              onChange={(e) => updateQuestionAnswer(question.id, Number(e.target.value))}
              className="report-slider"
            />
            <span className="report-slider-value">{value || 0}</span>
          </div>
        );
      case "Media":
        return (
          <div className="report-response-field">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;

                // Convert files to base64 and store them
                const mediaFiles: string[] = [];

                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const reader = new FileReader();

                  reader.onload = async (event) => {
                    const result = event.target?.result as string;
                    if (result) {
                      try {
                        // Resize image if it's an image
                        const resizedImage = file.type.startsWith('image/')
                          ? await resizeImage(result)
                          : result;

                        mediaFiles.push(resizedImage);

                        // Update the question with the new media files
                        if (mediaFiles.length === files.length) {
                          const currentValue = value as string[] || [];
                          updateQuestionAnswer(question.id, [...currentValue, ...mediaFiles]);
                        }
                      } catch (error) {
                        console.error("Error processing media file:", error);
                      }
                    }
                  };

                  reader.readAsDataURL(file);
                }
              }}
              className="report-media-file-input"
              id={`report-media-upload-${question.id}`}
            />
            <label htmlFor={`report-media-upload-${question.id}`} className="report-media-upload">
              <ImageIcon size={20} />
              <span>Upload media</span>
            </label>

            {/* Display uploaded media previews */}
            {Array.isArray(value) && value.length > 0 && (
              <div className="report-media-previews">
                {(value as string[]).map((media, index) => (
                  <div key={index} className="report-media-preview-item">
                    {media.startsWith('data:image') ? (
                      <img src={media || "/placeholder.svg"} alt={`Uploaded media ${index + 1}`} />
                    ) : (
                      <div className="report-video-preview">
                        <FileText size={24} />
                        <span>Media file {index + 1}</span>
                      </div>
                    )}
                    <button
                      className="report-remove-media-button"
                      onClick={() => {
                        const updatedMedia = [...value as string[]];
                        updatedMedia.splice(index, 1);
                        updateQuestionAnswer(question.id, updatedMedia);
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "Annotation":
        return (
          <div className="report-response-field">
            <div className="report-signature-container">
              <div className="signature-canvas-wrapper">
                <canvas
                  ref={(canvas) => {
                    if (!canvas) return;

                    // Store canvas in a ref to avoid recreating it
                    if ((canvas as any).__initialized) return;
                    (canvas as any).__initialized = true;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    // Set canvas dimensions
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;

                    // Set canvas styles
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = '#000000';

                    // Clear canvas
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // If there's already a saved signature, draw it
                    if (value && typeof value === 'string' && value.startsWith('data:image/png')) {
                      const img = new Image();
                      img.onload = () => {
                        ctx.drawImage(img, 0, 0);
                      };
                      img.src = value;
                    }

                    // Set up drawing variables
                    let isDrawing = false;
                    let lastX = 0;
                    let lastY = 0;

                    // Store canvas and context in local variables that are definitely not null
                    const canvasElement = canvas;
                    const context = ctx;

                    // Define drawing functions
                    function startDrawing(e: MouseEvent | TouchEvent) {
                      isDrawing = true;

                      const rect = canvasElement.getBoundingClientRect();
                      let clientX, clientY;

                      if ((e as TouchEvent).touches) {
                        clientX = (e as TouchEvent).touches[0].clientX;
                        clientY = (e as TouchEvent).touches[0].clientY;
                      } else {
                        clientX = (e as MouseEvent).clientX;
                        clientY = (e as MouseEvent).clientY;
                      }

                      lastX = clientX - rect.left;
                      lastY = clientY - rect.top;
                    }

                    function draw(e: MouseEvent | TouchEvent) {
                      if (!isDrawing) return;

                      context.beginPath();
                      context.moveTo(lastX, lastY);

                      const rect = canvasElement.getBoundingClientRect();
                      let clientX, clientY;

                      if ((e as TouchEvent).touches) {
                        clientX = (e as TouchEvent).touches[0].clientX;
                        clientY = (e as TouchEvent).touches[0].clientY;
                      } else {
                        clientX = (e as MouseEvent).clientX;
                        clientY = (e as MouseEvent).clientY;
                      }

                      const currentX = clientX - rect.left;
                      const currentY = clientY - rect.top;

                      context.lineTo(currentX, currentY);
                      context.stroke();

                      lastX = currentX;
                      lastY = currentY;
                    }

                    function endDrawing() {
                      isDrawing = false;
                      const signatureData = canvasElement.toDataURL('image/png');
                      updateQuestionAnswer(question.id, signatureData);
                    }

                    // Add event listeners for mouse events
                    canvasElement.addEventListener('mousedown', startDrawing);
                    canvasElement.addEventListener('mousemove', draw);
                    canvasElement.addEventListener('mouseup', endDrawing);
                    canvasElement.addEventListener('mouseout', endDrawing);

                    // Add event listeners for touch events
                    canvasElement.addEventListener('touchstart', startDrawing);
                    canvasElement.addEventListener('touchmove', draw);
                    canvasElement.addEventListener('touchend', endDrawing);
                    canvasElement.addEventListener('touchcancel', endDrawing);

                    // Clean up event listeners on unmount
                    return () => {
                      canvasElement.removeEventListener('mousedown', startDrawing);
                      canvasElement.removeEventListener('mousemove', draw);
                      canvasElement.removeEventListener('mouseup', endDrawing);
                      canvasElement.removeEventListener('mouseout', endDrawing);

                      canvasElement.removeEventListener('touchstart', startDrawing);
                      canvasElement.removeEventListener('touchmove', draw);
                      canvasElement.removeEventListener('touchend', endDrawing);
                      canvasElement.removeEventListener('touchcancel', endDrawing);
                    };
                  }}
                />
              </div>
              <button
                className="report-clear-signature-button"
                onClick={() => {
                  updateQuestionAnswer(question.id, null);
                }}
              >
                Clear Signature
              </button>
            </div>
          </div>
        );
      case "Date & Time":
      case "Inspection date":
        return (
          <div className="report-response-field">
            <div className="report-date-time-input">
              <Calendar size={16} />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        );
      default:
        return <div className="report-response-field">Unsupported response type</div>;
    }
  };

  // Date validation - commented out as it's not used
  // const validateDates = () => {
  //   let errors: { startDate?: string; dueDate?: string } = {};
  //
  //   if (startDate && dueDate) {
  //     if (new Date(startDate) > new Date(dueDate)) {
  //       errors.dueDate = "Due date cannot be before start date";
  //     }
  //   }
  //
  //   setDateErrors(errors);
  //   return Object.keys(errors).length === 0;
  // };

  useEffect(() => {
    if (template.startDate) {
      setStartDate(template.startDate);
    }
    if (template.dueDate) {
      setDueDate(template.dueDate);
    }
  }, [template.startDate, template.dueDate]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    updateTemplate({ startDate: e.target.value });
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
    updateTemplate({ dueDate: e.target.value });
  };

  return (
    <div className="garment-template">
      <AccessManager
        templateId={template.id}
        templateTitle={template.title}
      />
      <div className="template-header">
        <div className="header-actions">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <button className="save-button" onClick={handleSave}>
            <CheckCircle size={18} />
            <span>Save</span>
          </button>
        </div>
        <div className="template-title">
          <input
            type="text"
            className="template-title-input"
            value={template.title}
            onChange={(e) => updateTemplate({ title: e.target.value })}
            placeholder="Untitled Garment Template"
          />
        </div>
        <div className="template-description">
          <textarea
            className="template-description-input"
            value={template.description}
            onChange={(e) => updateTemplate({ description: e.target.value })}
            placeholder="Add a description for this garment inspection template"
          />
        </div>
      </div>

      <div className="template-toolbar">
        <div className="template-logo">
          {template.logo ? (
            <img src={template.logo || "/placeholder.svg"} alt="Template Logo" className="template-logo-image" />
          ) : (
            <div className="template-logo-placeholder">No Logo</div>
          )}
          <label htmlFor="logo-upload" className="upload-logo-button">
            Upload Logo
          </label>
          <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoUpload} className="sr-only" />
        </div>

        <div className="template-dates">
          <div className="date-input">
            <label htmlFor="start-date">Start Date:</label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={handleStartDateChange}
            />
          </div>
          <div className="date-input">
            <label htmlFor="due-date">Due Date:</label>
            <input
              type="date"
              id="due-date"
              value={dueDate}
              onChange={handleDueDateChange}
            />
            {dateErrors.dueDate && <p className="error-message">{dateErrors.dueDate}</p>}
          </div>
        </div>

        <div className="template-actions">
          <button className="add-section-button" onClick={addStandardSection}>
            <Plus size={18} />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      <div className="template-content">
        <div className="template-tabs">
          <button className={`tab-button ${activeTab === 0 ? "active" : ""}`} onClick={() => setActiveTab(0)}>
            Template Builder
          </button>
          <button className={`tab-button ${activeTab === 1 ? "active" : ""}`} onClick={() => setActiveTab(1)}>
            Report Preview
          </button>
        </div>

        {activeTab === 0 && (
          <div className="template-builder">
            <div className="sections-list">
              {template.sections.map((section, index) => renderSection(section, index))}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="report-preview">
            <div className="report-actions">
              <button className="print-button" onClick={printReport} disabled={isExporting}>
                <Printer size={18} />
                <span>{isExporting ? "Exporting..." : "Export Report"}</span>
              </button>
              <button className="mobile-preview-toggle" onClick={() => setShowMobilePreview(!showMobilePreview)}>
                {showMobilePreview ? "Hide Mobile Preview" : "Show Mobile Preview"}
              </button>
            </div>

            <div className="report-container">
              <div className="report" ref={reportRef}>
                <div className="report-header">
                  <div className="report-logo">
                    {template.logo ? (
                      <img src={template.logo || "/placeholder.svg"} alt="Report Logo" className="report-logo-image" />
                    ) : (
                      <div className="report-logo-placeholder">No Logo</div>
                    )}
                  </div>
                  <div className="report-title">
                    <h1>{template.title}</h1>
                    <p>{template.description}</p>
                  </div>
                </div>

                {template.sections.map((section) => {
                  if (section.type === "standard") {
                    const standardContent = section.content as StandardSectionContent;
                    return (
                      <div className="report-section" key={section.id}>
                        <h2 className="report-section-title">{section.title}</h2>
                        {standardContent.description && (
                          <div className="report-section-description">{standardContent.description}</div>
                        )}
                        <div className="report-questions">
                          {standardContent.questions.map((question) => (
                            <div className="report-question" key={question.id}>
                              <div className="report-question-header">
                                <span className="report-question-text">
                                  {question.text}
                                  {question.required && <span className="report-required">*</span>}
                                </span>
                              </div>
                              {renderReportQuestionResponse(question, reportData, updateQuestionAnswer, section)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else if (section.type === "garmentDetails") {
                    const garmentContent = section.content as GarmentDetailsContent;
                    return (
                      <div className="report-section" key={section.id}>
                        <h2 className="report-section-title">{section.title}</h2>

                        <fieldset className="report-fieldset aql-settings">
                          <legend className="report-legend">AQL Settings</legend>
                          <div className="aql-grid">
                            <div className="aql-display-group">
                              <label>AQL Level:</label>
                              <span>{garmentContent.aqlSettings.aqlLevel}</span>
                            </div>
                            <div className="aql-display-group">
                              <label>Inspection Level:</label>
                              <span>{garmentContent.aqlSettings.inspectionLevel}</span>
                            </div>
                            <div className="aql-display-group">
                              <label>Sampling Plan:</label>
                              <span>{garmentContent.aqlSettings.samplingPlan}</span>
                            </div>
                            <div className="aql-display-group">
                              <label>Severity:</label>
                              <span>{garmentContent.aqlSettings.severity}</span>
                            </div>
                          </div>
                        </fieldset>

                        <fieldset className="report-fieldset quantity-grid">
                          <legend className="report-legend">Quantity Grid</legend>
                          <div className="quantity-table-container">
                            <table className="quantity-table">
                              <thead>
                                <tr>
                                  <th>Color</th>
                                  {garmentContent.sizes.map((size) => (
                                    <th key={size}>{size}</th>
                                  ))}
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {garmentContent.colors.map((color) => (
                                  <tr key={color}>
                                    <td>{color}</td>
                                    {garmentContent.sizes.map((size) => (
                                      <td key={size}>
                                        <input
                                          type="number"
                                          value={reportData.quantities[color]?.[size]?.orderQty || ""}
                                          onChange={(e) =>
                                            handleQuantityChange(color, size, "orderQty", e.target.value)
                                          }
                                          placeholder="0"
                                        />
                                      </td>
                                    ))}
                                    <td>{calculateRowTotal(color, "orderQty")}</td>
                                  </tr>
                                ))}
                                <tr>
                                  <td>Total</td>
                                  {garmentContent.sizes.map((size) => (
                                    <td key={size}>{calculateColumnTotal(size, "orderQty")}</td>
                                  ))}
                                  <td>{calculateGrandTotal("orderQty")}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </fieldset>

                        <fieldset className="report-fieldset carton-counts">
                          <legend className="report-legend">Carton Counts</legend>
                          <div className="carton-counts-grid">
                            {garmentContent.includeCartonOffered && (
                              <div className="carton-count-group">
                                <label htmlFor="carton-offered">No. of Cartons Offered:</label>
                                <input
                                  type="number"
                                  id="carton-offered"
                                  value={reportData.cartonOffered}
                                  onChange={(e) =>
                                    setReportData((prev) => ({ ...prev, cartonOffered: e.target.value }))
                                  }
                                  placeholder="0"
                                />
                              </div>
                            )}
                            {garmentContent.includeCartonInspected && (
                              <div className="carton-count-group">
                                <label htmlFor="carton-inspected">No. of Cartons Inspected:</label>
                                <input
                                  type="number"
                                  id="carton-inspected"
                                  value={reportData.cartonInspected}
                                  onChange={(e) =>
                                    setReportData((prev) => ({ ...prev, cartonInspected: e.target.value }))
                                  }
                                  placeholder="0"
                                />
                              </div>
                            )}
                            <div className="carton-count-group">
                              <label htmlFor="carton-to-inspect">No. of Cartons to Inspect:</label>
                              <input
                                type="number"
                                id="carton-to-inspect"
                                value={reportData.cartonToInspect}
                                onChange={(e) =>
                                  setReportData((prev) => ({ ...prev, cartonToInspect: e.target.value }))
                                }
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </fieldset>

                        <fieldset className="report-fieldset defects-list">
                          <legend className="report-legend">Defects List</legend>
                          <div className="defects-table-container">
                            <table className="defects-table">
                              <thead>
                                <tr>
                                  <th>Type</th>
                                  <th>Remarks</th>
                                  <th>Critical</th>
                                  <th>Major</th>
                                  <th>Minor</th>
                                  <th>Images</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.defects.map((defect, index) => (
                                  <tr key={index}>
                                    <td>
                                      <select
                                        value={defect.type}
                                        onChange={(e) => updateDefect(index, "type", e.target.value)}
                                      >
                                        <option value="">Select Defect Type</option>
                                        {garmentContent.defaultDefects.map((type) => (
                                          <option key={type} value={type}>
                                            {type}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        value={defect.remarks}
                                        onChange={(e) => updateDefect(index, "remarks", e.target.value)}
                                        placeholder="Enter Remarks"
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        value={defect.critical}
                                        onChange={(e) => updateDefect(index, "critical", e.target.value)}
                                        placeholder="0"
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        value={defect.major}
                                        onChange={(e) => updateDefect(index, "major", e.target.value)}
                                        placeholder="0"
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        value={defect.minor}
                                        onChange={(e) => updateDefect(index, "minor", e.target.value)}
                                        placeholder="0"
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handleDefectImageUpload(index, e)}
                                      />
                                      <div className="defect-images-preview">
                                        {(defectImages[index] || []).map((image, imageIndex) => (
                                          <div key={imageIndex} className="defect-image-item">
                                            <img src={image || "/placeholder.svg"} alt="" />
                                            <button onClick={() => removeDefectImage(index, imageIndex)}>
                                              <X size={12} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan={2}>Totals:</td>
                                  <td>{calculateTotalDefects("critical")}</td>
                                  <td>{calculateTotalDefects("major")}</td>
                                  <td>{calculateTotalDefects("minor")}</td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                            <button className="add-defect-button" onClick={addReportDefect}>
                              Add Defect
                            </button>
                          </div>
                        </fieldset>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {showMobilePreview && (
                <div className="mobile-report-preview">
                  <div className="mobile-header">
                    <div className="mobile-header-title">{template.title}</div>
                  </div>
                  <div className="mobile-report">
                    {template.sections.map((section) => {
                      if (section.type === "standard") {
                        const standardContent = section.content as StandardSectionContent;
                        return (
                          <div className="mobile-section" key={section.id}>
                            <h2 className="mobile-section-title">{section.title}</h2>
                            {standardContent.questions.map((question) => (
                              <div className="mobile-question" key={question.id}>
                                <div className="mobile-question-header">
                                  <span className="mobile-question-text">
                                    {question.text}
                                    {question.required && <span className="mobile-required">*</span>}
                                  </span>
                                </div>
                                <div className="mobile-question-response">
                                  {renderReportQuestionResponse(question, reportData, updateQuestionAnswer, section)}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      } else if (section.type === "garmentDetails") {
                        const garmentContent = section.content as GarmentDetailsContent;
                        return (
                          <div className="mobile-section" key={section.id}>
                            <h2 className="mobile-section-title">{section.title}</h2>

                            <div className="mobile-aql-settings">
                              <div className="mobile-aql-group">
                                <span>AQL Level:</span>
                                <span>{garmentContent.aqlSettings.aqlLevel}</span>
                              </div>
                              <div className="mobile-aql-group">
                                <span>Inspection Level:</span>
                                <span>{garmentContent.aqlSettings.inspectionLevel}</span>
                              </div>
                              <div className="mobile-aql-group">
                                <span>Sampling Plan:</span>
                                <span>{garmentContent.aqlSettings.samplingPlan}</span>
                              </div>
                              <div className="mobile-aql-group">
                                <span>Severity:</span>
                                <span>{garmentContent.aqlSettings.severity}</span>
                              </div>
                            </div>

                            <div className="mobile-quantity-grid">
                              <div className="mobile-quantity-header">
                                <span>Color</span>
                                {garmentContent.sizes.map((size) => (
                                  <span key={size}>{size}</span>
                                ))}
                              </div>
                              {garmentContent.colors.map((color) => (
                                <div className="mobile-quantity-row" key={color}>
                                  <span>{color}</span>
                                  {garmentContent.sizes.map((size) => (
                                    <input
                                      key={size}
                                      type="number"
                                      value={reportData.quantities[color]?.[size]?.orderQty || ""}
                                      onChange={(e) =>
                                        handleQuantityChange(color, size, "orderQty", e.target.value)
                                      }
                                      placeholder="0"
                                    />
                                  ))}
                                </div>
                              ))}
                            </div>

                            <div className="mobile-carton-counts">
                              {garmentContent.includeCartonOffered && (
                                <div className="mobile-carton-group">
                                  <span>Cartons Offered:</span>
                                  <input
                                    type="number"
                                    value={reportData.cartonOffered}
                                    onChange={(e) =>
                                      setReportData((prev) => ({ ...prev, cartonOffered: e.target.value }))
                                    }
                                    placeholder="0"
                                  />
                                </div>
                              )}
                              {garmentContent.includeCartonInspected && (
                                <div className="mobile-carton-group">
                                  <span>Cartons Inspected:</span>
                                  <input
                                    type="number"
                                    value={reportData.cartonInspected}
                                    onChange={(e) =>
                                      setReportData((prev) => ({ ...prev, cartonInspected: e.target.value }))
                                    }
                                    placeholder="0"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="mobile-defects-list">
                              {reportData.defects.map((defect, index) => (
                                <div className="mobile-defect" key={index}>
                                  <span>Type: {defect.type}</span>
                                  <span>Remarks: {defect.remarks}</span>
                                  <span>Critical: {defect.critical}</span>
                                  <span>Major: {defect.major}</span>
                                  <span>Minor: {defect.minor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Garment_Template
