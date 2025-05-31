
"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronDown, ChevronUp, Edit, Plus, Calendar, User, MapPin, X, Check, ImageIcon, Trash2, Clock, ArrowLeft, ArrowRight, CheckCircle, Settings, Ruler, Box, List, Shirt, FileText, Printer, Hash, CircleDot, Equal, ListFilter, Bell, MessageSquare, AlertTriangle, Upload, ClipboardCheck, Save } from 'lucide-react'
import "./garment-template.css"
import "./print-styles.css"
import AccessManager from "./components/AccessManager"
import TemplateAssignmentManager from "./components/TemplateAssignmentManager"
import { getAqlCodeLetter, getSamplePlan } from "../utils/aqlHelpers"
import { InspectionLevel as AqlInspectionLevel } from "../utils/aqlTables";

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

// Kept for future implementation of conditional logic
// Commented out to avoid unused variable warning
/*
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
*/

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
    options?: string[]
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
  siteOptions?: string[]  // Custom site names for Site response type
}

// Garment-specific types
type AQLLevel = "1.5" | "2.5" | "4.0" | "6.5"
type InspectionLevel = "I" | "II" | "III"
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
  // Track active triggers for each question
  activeTriggers?: {
    [questionId: string]: { rule: LogicRule; question: Question; section: AppSection }[]
  }
  // Track evidence for questions that require it
  questionEvidence?: {
    [questionId: string]: string[]
  }
  // Track action responses for questions that require actions
  actionResponses?: {
    [questionId: string]: {
      [ruleId: string]: string
    }
  }
  // Track subquestion answers
  subQuestionAnswers?: {
    [questionId: string]: {
      [ruleId: string]: string
    }
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
const AQL_LEVELS: AQLLevel[] = ["1.5", "2.5", "4.0", "6.5"]
const INSPECTION_LEVELS: InspectionLevel[] = ["I", "II", "III"]
const SAMPLING_PLANS: SamplingPlan[] = ["Single", "Double", "Multiple"]
const SEVERITIES: Severity[] = ["Normal", "Tightened", "Reduced"]
const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"]
const DEFAULT_COLORS = ["BLUE", "RED", "BLACK"]
const DEFAULT_DEFECTS = ["Stitching", "Fabric", "Color", "Measurement", "Packing"]

// Utility Functions
const generateId = () => Math.random().toString(36).substring(2, 9)
// Used for logic rules implementation
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
        },
        {
          id: generateId(),
          text: "Factory Name",
          responseType: "Text",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
        },
        {
          id: generateId(),
          text: "Style No",
          responseType: "Text",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
        },
        {
          id: generateId(),
          text: "Site conducted",
          responseType: "Site",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
        },
        {
          id: generateId(),
          text: "Prepared by",
          responseType: "Person",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
        },
        {
          id: generateId(),
          text: "Location",
          responseType: "Inspection location",
          required: true,
          flagged: false,
          value: null,
          logicRules: [],
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

// Function to convert camelCase to snake_case (similar to Create_template.tsx)
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      newObj[snakeKey] = toSnakeCase(obj[key]);
    }
    return newObj;
  }
  return obj;
}

// Function to clean template data for saving (similar to Create_template.tsx)
function cleanTemplateForSave(template: Template, isNew: boolean): Partial<Template> {
  return {
    ...(isNew ? {} : { id: template.id }),
    title: template.title,
    description: template.description,
    logo: template.logo,
    sections: template.sections.map((section) => {
      const newSectionId = isNew || typeof section.id === "number" ? generateId() : section.id;

      if (section.type === "garmentDetails" && isGarmentDetailsContent(section.content)) {
        return {
          id: newSectionId,
          title: section.title,
          type: section.type,
          isCollapsed: section.isCollapsed,
          content: {
            aqlSettings: section.content.aqlSettings,
            sizes: section.content.sizes,
            colors: section.content.colors,
            includeCartonOffered: section.content.includeCartonOffered,
            includeCartonInspected: section.content.includeCartonInspected,
            defaultDefects: section.content.defaultDefects
          }
        };
      } else {
        // For standard sections, properly structure the questions and logic rules
        const standardContent = section.content as StandardSectionContent;
        return {
          id: newSectionId,
          title: section.title,
          type: section.type,
          isCollapsed: section.isCollapsed,
          content: {
            description: standardContent.description,
            questions: standardContent.questions.map((q) => {
              const newQuestionId = isNew || typeof q.id === "number" ? generateId() : q.id;

              return {
                id: newQuestionId,
                text: q.text,
                responseType: q.responseType ?? "Text", // ensure fallback
                required: q.required,
                flagged: q.flagged,
                options: q.options,
                value: q.value,
                logicRules: q.logicRules, // Preserve logic rules with subQuestion and message
                multipleSelection: q.multipleSelection,
                siteOptions: q.siteOptions,
              };
            }),
          }
        };
      }
    }),
  };
}









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
          <div className="annotation-placeholder-box">
            <Edit size={20} />
            <span>Sign in the report page</span>
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
      return (
        <div className="response-field site-field">
          <div className="site-options">
            {(question.siteOptions || []).map((site, idx) => (
              <div key={idx} className="site-option-container">
                <input
                  type="text"
                  className={`site-option-input site-${idx % 4}`}
                  value={site}
                  onChange={(e) => {
                    const newSiteOptions = [...(question.siteOptions || [])];
                    newSiteOptions[idx] = e.target.value;
                    updateQuestion(sectionId, question.id, { siteOptions: newSiteOptions });
                  }}
                  placeholder="Enter site name"
                />
                <button
                  className="delete-option-button"
                  onClick={() => {
                    const newSiteOptions = [...(question.siteOptions || [])];
                    newSiteOptions.splice(idx, 1);
                    updateQuestion(sectionId, question.id, { siteOptions: newSiteOptions });
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              className="add-option-button"
              onClick={() => {
                const newSiteOptions = [...(question.siteOptions || []), `Site ${(question.siteOptions || []).length + 1}`];
                updateQuestion(sectionId, question.id, { siteOptions: newSiteOptions });
              }}
            >
              <Plus size={14} />
              <span>Add Site</span>
            </button>
          </div>
        </div>
      );
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

// Define supported types for logic
const LOGIC_SUPPORTED_TYPES: ResponseType[] = ["Text", "Number", "Checkbox", "Yes/No", "Multiple choice", "Slider"];

// Helper function to get condition icon
const getConditionIcon = (condition: LogicCondition) => {
  switch (condition) {
    case "is":
      return <Equal className="condition-icon" />
    case "is not":
      return <X className="condition-icon" />
    case "contains":
      return <CircleDot className="condition-icon" />
    case "not contains":
      return <X className="condition-icon" />
    case "starts with":
      return <ArrowRight className="condition-icon" />
    case "ends with":
      return <ArrowLeft className="condition-icon" />
    case "matches (regex)":
      return <Hash className="condition-icon" />
    case "less than":
      return <ArrowLeft className="condition-icon" />
    case "less than or equal to":
      return <ArrowLeft className="condition-icon" />
    case "equal to":
      return <Equal className="condition-icon" />
    case "not equal to":
      return <X className="condition-icon" />
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

// Helper function to check if a trigger should be shown based on the question's logic rules
const shouldShowTrigger = (question: Question, triggerType: TriggerAction): boolean => {
  if (!question.logicRules || question.logicRules.length === 0) return false
  if (question.value === null || question.value === undefined) return false

  for (const rule of question.logicRules) {
    // Skip rules that don't match the trigger type
    if (rule.trigger !== triggerType) continue

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
          conditionMet = isStringArray(rule.value) && rule.value.includes(String(value))
          break
        case "is not one of":
          conditionMet = isStringArray(rule.value) && !rule.value.includes(String(value))
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
}> = ({ selectedTrigger, onTriggerSelect, onConfigChange = () => {}, className = "" }) => {
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
  const [options, setOptions] = useState<string[]>(config?.subQuestion?.options || ["Option 1", "Option 2", "Option 3"])
  const [newOption, setNewOption] = useState<string>("")

  useEffect(() => {
    if (trigger === "display_message") {
      onConfigChange({ ...config, message })
    } else if (trigger === "ask_questions") {
      onConfigChange({
        ...config,
        subQuestion: {
          text: questionText,
          responseType,
          options: responseType === "Multiple choice" ? options : undefined
        },
      })
    }
  }, [trigger, message, questionText, responseType, options, config, onConfigChange])

  const addOption = () => {
    if (newOption.trim() === "") return;
    setOptions([...options, newOption.trim()]);
    setNewOption("");
  };

  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

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

        {responseType === "Multiple choice" && (
          <div className="enhanced-options-container mt-2">
            <label className="enhanced-trigger-config-label">Options:</label>
            {options.map((option, index) => (
              <div key={index} className="enhanced-option-item">
                <input
                  type="text"
                  className="enhanced-logic-text-input"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  className="enhanced-remove-option-button"
                  onClick={() => removeOption(index)}
                  type="button"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="enhanced-add-option-row">
              <input
                type="text"
                className="enhanced-logic-text-input"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="New option"
              />
              <button
                className="enhanced-add-option-button"
                onClick={addOption}
                type="button"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}
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

  // Use questions parameter for future implementation of cross-question logic

  // Use useCallback to memoize the onRuleChange call
  const handleRuleChange = useCallback((updatedRule: LogicRule) => {
    onRuleChange(updatedRule)
  }, [onRuleChange])

  useEffect(() => {
    handleRuleChange(localRule)
  }, [localRule, handleRuleChange])

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
    console.log('Adding new rule:', newRule)
    console.log('Current rules before adding:', rules.length)
    const updatedRules = [...rules, newRule]
    console.log('Updated rules after adding:', updatedRules.length)
    onRulesChange(updatedRules)
  }

  const updateRule = (index: number, updatedRule: LogicRule) => {
    const newRules = [...rules]
    newRules[index] = updatedRule
    onRulesChange(newRules)
  }

  const deleteRule = (index: number) => {
    // Add confirmation dialog to prevent accidental deletions
    if (window.confirm('Are you sure you want to delete this logic rule?')) {
      const newRules = [...rules]
      newRules.splice(index, 1)
      console.log(`Deleting rule at index ${index}. Rules before:`, rules.length, 'Rules after:', newRules.length)
      onRulesChange(newRules)
    }
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

// Main Component
const Garment_Template: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [template, setTemplate] = useState<Template>(getInitialTemplate())
  const [isLoading, setIsLoading] = useState<boolean>(!!id)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<number>(0)
  const [maxAccessibleTab, setMaxAccessibleTab] = useState<number>(0) // Track the highest tab user can access
  const [activeSectionId, setActiveSectionId] = useState<string | null>(template.sections[0]?.id || null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  const [showResponseTypeMenu, setShowResponseTypeMenu] = useState<string | null>(null)
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(true)
  const [showLogicPanel, setShowLogicPanel] = useState<string | null>(null)
  const [newSize, setNewSize] = useState<string>("")
  const [newColor, setNewColor] = useState<string>("")
  const [newDefect, setNewDefect] = useState<string>("")
  const [defectImages, setDefectImages] = useState<{ [defectIndex: number]: string[] }>({})
  const [isExporting, setIsExporting] = useState<boolean>(false)

  // Check user role and permissions
  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/users/current-user/', {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);

          // Check if user is inspector
          if (userData.user_role === 'inspector') {
            setAccessError('Only admin users can create or edit templates. Please contact your administrator.');
            setIsLoading(false);
            return;
          }
        } else {
          setAccessError('Unable to verify user permissions. Please log in again.');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error checking user access:', error);
        setAccessError('Error checking user permissions. Please try again.');
        setIsLoading(false);
        return;
      }
    };

    checkUserAccess();
  }, []);

  // Load existing template if in edit mode
  useEffect(() => {
    console.log("Garment_Template: Component mounted, id param:", id);

    // Only load template if user has access and no access error
    if (currentUser && !accessError && id) {
      console.log("Garment_Template: Attempting to load template with ID:", id);
      setIsLoading(true)
      fetch(`http://127.0.0.1:8000/api/users/templates/${id}/`)
        .then(response => {
          console.log("Garment_Template: API response status:", response.status);
          if (!response.ok) {
            throw new Error(`Failed to load template. Status: ${response.status}`)
          }
          return response.json()
        })
        .then(data => {
          console.log('Garment_Template: Loaded template data:', data)
          console.log('Garment_Template: Template type:', data.template_type)

          try {
            // Make sure the template is a garment template
            if (data.template_type === 'garment') {
              console.log('Garment_Template: Setting template data for garment template')

              // Ensure the template has the required structure
              const processedTemplate = {
                ...data,
                sections: data.sections || [],
                title: data.title || "Untitled Garment Template",
                description: data.description || "Add a description for this garment inspection template",
                logo: data.logo || undefined
              };

              // Ensure each section has the required structure
              processedTemplate.sections = processedTemplate.sections.map((section: any) => {
                if (!section.id) section.id = generateId();
                if (!section.title) section.title = "Untitled Section";
                if (!section.type) section.type = "standard";

                // Ensure garmentDetails sections have the required content
                if (section.type === "garmentDetails") {
                  if (!section.content) section.content = {};
                  if (!section.content.aqlSettings) section.content.aqlSettings = {
                    aqlLevel: "2.5",
                    inspectionLevel: "II",
                    samplingPlan: "Single",
                    severity: "Normal"
                  };
                  if (!section.content.sizes) section.content.sizes = [...DEFAULT_SIZES];
                  if (!section.content.colors) section.content.colors = [...DEFAULT_COLORS];
                  if (!section.content.defaultDefects) section.content.defaultDefects = [...DEFAULT_DEFECTS];
                  section.content.includeCartonOffered = section.content.includeCartonOffered !== false;
                  section.content.includeCartonInspected = section.content.includeCartonInspected !== false;
                }

                // Ensure standard sections have the required content
                if (section.type === "standard") {
                  if (!section.content) section.content = {};
                  if (!section.content.questions) section.content.questions = [];
                }

                return {
                  ...section,
                  isCollapsed: section.isCollapsed || false
                };
              });

              // If no garmentDetails section exists, add one
              if (!processedTemplate.sections.some((s: any) => s.type === "garmentDetails")) {
                processedTemplate.sections.push(getDefaultGarmentDetailsSection());
              }

              // If no standard section exists, add a title page
              if (!processedTemplate.sections.some((s: any) => s.type === "standard")) {
                const titlePageSection = {
                  id: generateId(),
                  type: "standard" as SectionType,
                  title: "Title Page",
                  isCollapsed: false,
                  content: {
                    description: "The Title Page is the first page of your garment inspection report.",
                    questions: [
                      {
                        id: generateId(),
                        text: "Report No",
                        responseType: "Text" as ResponseType,
                        required: true,
                        flagged: false,
                        value: null,
                        logicRules: [],
                      }
                    ]
                  }
                };
                processedTemplate.sections.unshift(titlePageSection);
              }

              console.log('Garment_Template: Processed template:', processedTemplate);
              setTemplate(processedTemplate);
              setActiveSectionId(processedTemplate.sections[0]?.id || null);

              // Initialize reportData based on the loaded template
              const garmentSection = processedTemplate.sections.find((s: any) => s.type === "garmentDetails");
              if (garmentSection) {
                console.log('Garment_Template: Initializing reportData with loaded template data');

                // Initialize defects from the template
                const initialDefects = garmentSection.content?.defaultDefects?.map((defect: string) => ({
                  type: defect,
                  remarks: "",
                  critical: 0,
                  major: 0,
                  minor: 0,
                })) || [];

                // Initialize AQL settings from the template
                const aqlSettings = garmentSection.content?.aqlSettings || {
                  aqlLevel: "2.5",
                  inspectionLevel: "II",
                  samplingPlan: "Single",
                  severity: "Normal"
                };

                setReportData({
                  quantities: {},
                  cartonOffered: "30",
                  cartonInspected: "5",
                  cartonToInspect: "5",
                  defects: initialDefects,
                  aqlSettings: {
                    ...aqlSettings,
                    status: "PASS"
                  },
                  editingAql: false,
                  newSize: "",
                  newColor: "",
                  questionAnswers: {}
                });
              }
            } else {
              console.error('Garment_Template: Attempted to load a non-garment template in garment editor')
              alert('This is not a garment template. Redirecting to standard template editor.')
              navigate(`/templates/edit/${id}`)
            }
          } catch (error) {
            console.error('Garment_Template: Error processing template data:', error);
            // Log more details about the template data
            console.error('Garment_Template: Template data that caused the error:', JSON.stringify(data, null, 2));

            // Fall back to default template
            const defaultTemplate = getInitialTemplate();
            console.log('Garment_Template: Using default template:', defaultTemplate);

            setTemplate(defaultTemplate);
            setActiveSectionId(defaultTemplate.sections[0]?.id || null);

            alert('Error processing template data. Using default template. Check console for details.');
          }
        })
        .catch(error => {
          console.error('Garment_Template: Error loading template:', error)
          alert('Failed to load template. Using default template.')
        })
        .finally(() => {
          console.log('Garment_Template: Finished loading attempt, setting isLoading to false')
          setIsLoading(false)
        })
    } else if (currentUser && !accessError && !id) {
      console.log("Garment_Template: No ID provided, using default template")
      setIsLoading(false);
    }
  }, [id, navigate, currentUser, accessError])

  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const reportRef = useRef<HTMLDivElement>(null)

  // Template Management
  const updateTemplate = (updates: Partial<Template>) => setTemplate((prev) => ({ ...prev, ...updates }))

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/users/get-csrf-token/", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }

      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      // Get CSRF token
      const csrfToken = await fetchCSRFToken();

      // Create FormData object
      const formData = new FormData();

      // Add title and description
      formData.append("title", template.title);
      formData.append("description", template.description);

      // Add template_type to ensure it's saved as a garment template
      formData.append("template_type", "garment");

      // Add logo if exists
      if (template.logo) {
        if (typeof template.logo === "string" && template.logo.startsWith("data:")) {
          const response = await fetch(template.logo);
          const blob = await response.blob();
          formData.append("logo", blob, "logo.png");
        }
      }

      // Determine if this is a new template or an edit
      // Check if template is new: no URL id AND template.id is not a numeric database ID
      const hasNumericId = String(template.id).match(/^\d+$/);
      const isNew = !id && !hasNumericId;

      // Prepare sections data using cleanTemplateForSave and toSnakeCase
      const cleaned = cleanTemplateForSave(template, isNew);
      const snakeCaseSections = toSnakeCase(cleaned.sections);

      // Add sections data
      formData.append("sections", JSON.stringify(snakeCaseSections));
      const templateDbId = hasNumericId ? template.id : id;

      // Set the appropriate URL and method based on whether we're creating or updating
      const url = isNew
        ? "http://localhost:8000/api/users/garment-template/"
        : `http://localhost:8000/api/users/templates/${templateDbId}/`;

      const method = isNew ? "POST" : "PATCH";

      // Make API request
      const response = await fetch(url, {
        method: method,
        headers: {
          "X-CSRFToken": csrfToken,
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save template");
      }

      // Get the response data
      let responseData;
      try {
        responseData = await response.json();
      } catch (error) {
        console.warn("Could not parse response as JSON:", error);
        responseData = {};
      }

      // Update local state with the database ID if available
      if (responseData && responseData.id) {
        updateTemplate({
          id: responseData.id.toString(),
          lastSaved: new Date()
        });
        console.log("Template saved with ID:", responseData.id);
      } else {
        updateTemplate({ lastSaved: new Date() });
      }

      alert("Template saved successfully!");
      console.log("Template saved successfully:", template);
    } catch (error: any) {
      console.error("Error saving template:", error);
      alert(`Failed to save template: ${error.message || "Unknown error"}`);
    }
  }

  const handleBack = () => {
    if (window.confirm("Do you want to save before leaving?")) {
      handleSave()
      // Use direct navigation for more reliability
      window.location.href = "/templates"
    } else {
      window.location.href = "/templates"
    }
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
      activeTriggers: {},
      questionEvidence: {},
      actionResponses: {},
      subQuestionAnswers: {}
    }
  })



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
    const section = template.sections.find((s) => s.id === sectionId)
    if (!section || section.type !== "standard") return

    const question = (section.content as StandardSectionContent).questions.find((q) => q.id === questionId)
    if (!question) return

    // Only keep logic rules if changing to a supported type
    const keepLogicRules = LOGIC_SUPPORTED_TYPES.includes(responseType) ? question.logicRules || [] : []

    updateQuestion(sectionId, questionId, {
      responseType,
      options:
        responseType === "Multiple choice" || responseType === "Yes/No"
          ? ["Option 1", "Option 2", "Option 3"]
          : undefined,
      value: null,
      logicRules: keepLogicRules,
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



  // Report functions
  const handleQuantityChange = (color: string, size: string, field: string, value: string) => {
    setReportData((prev) => {
      const newQuantities = { ...prev.quantities }
      if (!newQuantities[color]) newQuantities[color] = {}
      if (!newQuantities[color][size]) newQuantities[color][size] = { orderQty: "", offeredQty: "" }
      newQuantities[color][size][field] = value
      return { ...prev, quantities: newQuantities }
    });

    // If we're changing offered quantity, recalculate AQL status
    if (field === "offeredQty") {
      setTimeout(() => updateAqlStatus(), 0);
    }
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

  const calculateAqlStatus = () => {
    // Get the total offered quantity
    const totalOfferedQty = calculateGrandTotal("offeredQty");

    // Get the AQL settings
    const { aqlLevel, inspectionLevel } = reportData.aqlSettings;

    // Get the code letter based on lot size and inspection level
    const codeLetter = getAqlCodeLetter(totalOfferedQty, inspectionLevel as AqlInspectionLevel);

    if (!codeLetter) {
      console.error("Could not determine AQL code letter for lot size:", totalOfferedQty);
      return "FAIL";
    }

    // Get the sample plan based on code letter and AQL level
    const samplePlan = getSamplePlan(codeLetter, aqlLevel);

    if (!samplePlan) {
      console.error("Could not determine sample plan for code letter:", codeLetter, "and AQL level:", aqlLevel);
      return "FAIL";
    }

    // Calculate total defects
    let totalCritical = 0;
    let totalMajor = 0;
    let totalMinor = 0;

    reportData.defects.forEach(defect => {
      totalCritical += Number(defect.critical) || 0;
      totalMajor += Number(defect.major) || 0;
      totalMinor += Number(defect.minor) || 0;
    });

    // Check if the defects exceed the acceptance criteria
    const { accept } = samplePlan;

    // Critical defects are an automatic fail
    if (totalCritical > 0) {
      return "FAIL";
    }

    // Check major defects against acceptance criteria
    if (totalMajor > accept) {
      return "FAIL";
    }

    // Minor defects are typically allowed at a higher rate, but still check
    if (totalMinor > accept * 2) {
      return "FAIL";
    }

    return "PASS";
  };

  const addReportDefect = () => {
    setReportData((prev) => ({
      ...prev,
      defects: [...prev.defects, { type: "", remarks: "", critical: 0, major: 0, minor: 0 }],
    }))
  }

  const updateAqlStatus = () => {
    const status = calculateAqlStatus();
    setReportData(prev => ({
      ...prev,
      aqlSettings: {
        ...prev.aqlSettings,
        status
      }
    }));
  }

  const updateDefect = (index: number, field: string, value: string | number) => {
    setReportData((prev) => {
      const newDefects = [...prev.defects]
      newDefects[index] = { ...newDefects[index], [field]: value }
      return { ...prev, defects: newDefects }
    });

    // Recalculate AQL status when defects are updated
    setTimeout(() => updateAqlStatus(), 0);
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

  const addReportSize = () => {
    if (!reportData.newSize.trim()) return;

    const section = template.sections.find((s) => s.type === "garmentDetails");
    if (!section || !isGarmentDetailsContent(section.content)) return;

    const updatedSizes = [...section.content.sizes, reportData.newSize.trim()];
    updateGarmentDetails(section.id, { sizes: updatedSizes });
    setReportData((prev) => ({ ...prev, newSize: "" }));
  };

  const addReportColor = () => {
    if (!reportData.newColor.trim()) return;

    const section = template.sections.find((s) => s.type === "garmentDetails");
    if (!section || !isGarmentDetailsContent(section.content)) return;

    const updatedColors = [...section.content.colors, reportData.newColor.trim()];
    updateGarmentDetails(section.id, { colors: updatedColors });
    setReportData((prev) => ({ ...prev, newColor: "" }));
  };

  const toggleAqlEditing = () => {
    setReportData((prev) => ({ ...prev, editingAql: !prev.editingAql }))
  }

  const updateAqlResult = (field: string, value: string) => {
    setReportData((prev) => ({
      ...prev,
      aqlSettings: { ...prev.aqlSettings, [field]: value },
    }))
  }

  // Helper function to evaluate logic conditions
  const evaluateLogicCondition = (
    condition: LogicCondition,
    conditionValue: any,
    answerValue: any,
    questionType: ResponseType
  ): boolean => {
    // Handle different question types and conditions
    switch (questionType) {
      case "Number":
        const numAnswer = Number(answerValue);
        const numCondition = Number(conditionValue);

        switch (condition) {
          case "equal to": return numAnswer === numCondition;
          case "not equal to": return numAnswer !== numCondition;
          case "greater than": return numAnswer > numCondition;
          case "less than": return numAnswer < numCondition;
          case "greater than or equal to": return numAnswer >= numCondition;
          case "less than or equal to": return numAnswer <= numCondition;
          case "between":
            if (Array.isArray(conditionValue) && conditionValue.length === 2) {
              return numAnswer >= Number(conditionValue[0]) && numAnswer <= Number(conditionValue[1]);
            }
            return false;
          default: return false;
        }

      case "Text":
      case "Site":
      case "Person":
      case "Inspection location":
        const strAnswer = String(answerValue || "");
        const strCondition = String(conditionValue || "");

        switch (condition) {
          case "is": return strAnswer === strCondition;
          case "is not": return strAnswer !== strCondition;
          case "contains": return strAnswer.includes(strCondition);
          case "not contains": return !strAnswer.includes(strCondition);
          case "starts with": return strAnswer.startsWith(strCondition);
          case "ends with": return strAnswer.endsWith(strCondition);
          default: return false;
        }

      case "Yes/No":
      case "Checkbox":
        switch (condition) {
          case "is": return answerValue === conditionValue;
          case "is not": return answerValue !== conditionValue;
          default: return false;
        }

      case "Multiple choice":
        switch (condition) {
          case "is": return answerValue === conditionValue;
          case "is not": return answerValue !== conditionValue;
          case "is one of":
            if (Array.isArray(conditionValue)) {
              return conditionValue.includes(answerValue);
            }
            return false;
          case "is not one of":
            if (Array.isArray(conditionValue)) {
              return !conditionValue.includes(answerValue);
            }
            return false;
          default: return false;
        }

      case "Slider":
        const sliderAnswer = Number(answerValue);
        const sliderCondition = Number(conditionValue);

        switch (condition) {
          case "equal to": return sliderAnswer === sliderCondition;
          case "not equal to": return sliderAnswer !== sliderCondition;
          case "greater than": return sliderAnswer > sliderCondition;
          case "less than": return sliderAnswer < sliderCondition;
          case "greater than or equal to": return sliderAnswer >= sliderCondition;
          case "less than or equal to": return sliderAnswer <= sliderCondition;
          case "between":
            if (Array.isArray(conditionValue) && conditionValue.length === 2) {
              return sliderAnswer >= Number(conditionValue[0]) && sliderAnswer <= Number(conditionValue[1]);
            }
            return false;
          default: return false;
        }

      default:
        return false;
    }
  };

  // Function to check logic rules and update active triggers
  const checkLogicRules = (questionId: string, value: string | string[] | boolean | number | null) => {
    // Find the question in the template
    let foundQuestion: Question | null = null;
    let foundSection: AppSection | null = null;

    for (const section of template.sections) {
      if (section.type === "standard") {
        const question = (section.content as StandardSectionContent).questions.find(q => q.id === questionId);
        if (question) {
          foundQuestion = question;
          foundSection = section;
          break;
        }
      }
    }

    if (!foundQuestion || !foundSection) return;

    // Check if the question has logic rules
    const logicRules = foundQuestion.logicRules || [];
    if (logicRules.length === 0) return;

    // Evaluate each rule
    const activeTriggers: { rule: LogicRule; question: Question; section: AppSection }[] = [];

    for (const rule of logicRules) {
      if (!rule.condition || rule.value === undefined || rule.value === null || !rule.trigger) continue;

      const conditionMet = evaluateLogicCondition(
        rule.condition,
        rule.value,
        value,
        foundQuestion.responseType
      );

      if (conditionMet) {
        activeTriggers.push({ rule, question: foundQuestion, section: foundSection });
      }
    }

    // Update the active triggers in the report data
    setReportData(prev => ({
      ...prev,
      activeTriggers: {
        ...prev.activeTriggers || {},
        [questionId]: activeTriggers
      }
    }));
  };

  const updateQuestionAnswer = (questionId: string, value: string | string[] | boolean | number | null) => {
    setReportData((prev) => ({
      ...prev,
      questionAnswers: { ...prev.questionAnswers, [questionId]: value },
    }));

    // Check logic rules after updating the answer
    checkLogicRules(questionId, value);
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

    // Check if any triggers should be shown
    const hasRequireEvidence = shouldShowTrigger(question, "require_evidence")
    const hasRequireAction = shouldShowTrigger(question, "require_action")
    const hasDisplayMessage = shouldShowTrigger(question, "display_message")
    const hasAskQuestions = shouldShowTrigger(question, "ask_questions")
    const hasNotify = shouldShowTrigger(question, "notify")

    // Determine if any triggers are active
    const hasActiveTriggers = hasRequireEvidence || hasRequireAction || hasDisplayMessage || hasAskQuestions || hasNotify

    return (
      <div
        key={question.id}
        ref={(el) => {
          questionRefs.current[question.id] = el
        }}
        className={`question-item ${isActive ? "active" : ""} ${hasActiveTriggers ? "has-active-triggers" : ""}`}
        onClick={() => setActiveQuestionId(question.id)}
      >
        <div className="question-header">
          <div className="question-number">{index + 1}</div>
          <input
            type="text"
            className="question-text"
            value={question.text}
            onChange={(e) => updateQuestion(sectionId, question.id, { text: e.target.value })}
            placeholder="Type question"
          />
          {(shouldShowTrigger(question, "require_evidence") ||
            shouldShowTrigger(question, "require_action") ||
            shouldShowTrigger(question, "display_message") ||
            shouldShowTrigger(question, "ask_questions") ||
            shouldShowTrigger(question, "notify")) && (
            <div className="active-trigger-indicator" title="This question has active logic triggers">
              <AlertTriangle size={16} color="#f59e0b" />
            </div>
          )}
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
              questions={template.sections.flatMap((s) =>
                s.type === "standard" ?
                  (s.content as StandardSectionContent).questions.map((q) => ({ id: q.id, text: q.text })) :
                  []
              )}
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
    const isTitlePage = index === 0 && section.title === "Title Page"
    const isGarmentDetails = section.type === "garmentDetails"

    return (
      <div
        key={section.id}
        ref={(el) => {
          sectionRefs.current[section.id] = el
        }}
        className={`section-container ${isActive ? "active" : ""} ${isGarmentDetails ? "garment-details-section" : ""}`}
        onClick={() => setActiveSectionId(section.id)}
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
              readOnly={isGarmentDetails}
            />
            {(isTitlePage || !isGarmentDetails) && (
              <button
                className="edit-section-title"
                onClick={() => {
                  const newTitle = prompt("Edit section title", section.title);
                  if (newTitle && newTitle.trim() !== "") {
                    updateSection(section.id, { title: newTitle.trim() });
                  }
                }}
              >
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
    updateQuestionAnswer: (questionId: string, value: string | string[] | boolean | number | null) => void
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
              {!value ? (
                // Show professional "Click to add signature" button
                <div
                  className="report-signature-placeholder"
                  onClick={() => {
                    // Create a temporary signature area
                    const signatureArea = document.createElement('div');
                    signatureArea.className = 'report-signature-modal-overlay';
                    signatureArea.innerHTML = `
                      <div class="report-signature-modal">
                        <div class="report-signature-modal-header">
                          <h3>Add Signature</h3>
                          <button class="report-signature-modal-close">×</button>
                        </div>
                        <div class="report-signature-modal-content">
                          <canvas class="report-signature-modal-canvas" width="350" height="180"></canvas>
                          <div class="report-signature-modal-instructions">
                            Sign or draw in the area above
                          </div>
                          <div class="report-signature-modal-actions">
                            <button class="report-signature-clear-btn">Clear</button>
                            <button class="report-signature-save-btn">Save Signature</button>
                          </div>
                        </div>
                      </div>
                    `;

                    document.body.appendChild(signatureArea);

                    const canvas = signatureArea.querySelector('.report-signature-modal-canvas') as HTMLCanvasElement;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    // Set canvas styles
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = '#000000';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Drawing state
                    let isDrawing = false;
                    let lastX = 0;
                    let lastY = 0;

                    // Drawing functions
                    const getCoordinates = (e: MouseEvent | TouchEvent) => {
                      const rect = canvas.getBoundingClientRect();
                      const scaleX = canvas.width / rect.width;
                      const scaleY = canvas.height / rect.height;

                      let clientX, clientY;
                      if (e instanceof TouchEvent) {
                        clientX = e.touches[0].clientX;
                        clientY = e.touches[0].clientY;
                      } else {
                        clientX = e.clientX;
                        clientY = e.clientY;
                      }

                      return {
                        x: (clientX - rect.left) * scaleX,
                        y: (clientY - rect.top) * scaleY
                      };
                    };

                    const startDrawing = (e: MouseEvent | TouchEvent) => {
                      isDrawing = true;
                      const coords = getCoordinates(e);
                      lastX = coords.x;
                      lastY = coords.y;
                      if (e instanceof TouchEvent) e.preventDefault();
                    };

                    const draw = (e: MouseEvent | TouchEvent) => {
                      if (!isDrawing) return;
                      const coords = getCoordinates(e);
                      ctx.beginPath();
                      ctx.moveTo(lastX, lastY);
                      ctx.lineTo(coords.x, coords.y);
                      ctx.stroke();
                      lastX = coords.x;
                      lastY = coords.y;
                      if (e instanceof TouchEvent) e.preventDefault();
                    };

                    const stopDrawing = () => {
                      isDrawing = false;
                    };

                    // Add event listeners
                    canvas.addEventListener('mousedown', startDrawing);
                    canvas.addEventListener('mousemove', draw);
                    canvas.addEventListener('mouseup', stopDrawing);
                    canvas.addEventListener('mouseleave', stopDrawing);
                    canvas.addEventListener('touchstart', startDrawing, { passive: false });
                    canvas.addEventListener('touchmove', draw, { passive: false });
                    canvas.addEventListener('touchend', stopDrawing);
                    canvas.addEventListener('touchcancel', stopDrawing);

                    // Close modal
                    const closeModal = () => {
                      document.body.removeChild(signatureArea);
                    };

                    // Clear canvas
                    const clearCanvas = () => {
                      ctx.fillStyle = '#ffffff';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                    };

                    // Save signature
                    const saveSignature = () => {
                      const signatureData = canvas.toDataURL('image/png');
                      updateQuestionAnswer(question.id, signatureData);
                      closeModal();
                    };

                    // Add button event listeners
                    signatureArea.querySelector('.report-signature-modal-close')?.addEventListener('click', closeModal);
                    signatureArea.querySelector('.report-signature-clear-btn')?.addEventListener('click', clearCanvas);
                    signatureArea.querySelector('.report-signature-save-btn')?.addEventListener('click', saveSignature);
                    signatureArea.addEventListener('click', (e) => {
                      if (e.target === signatureArea) closeModal();
                    });
                  }}
                >
                  <Edit size={24} />
                  <span>Click to add signature</span>
                </div>
              ) : (
                // Show signature preview with edit option
                <div className="report-signature-preview">
                  <img
                    src={value as string}
                    alt="Signature"
                    className="report-signature-image"
                  />
                  <div className="report-signature-actions">
                    <button
                      className="report-edit-signature-button"
                      onClick={() => {
                        // Same modal logic as above but pre-populate with existing signature
                        const signatureArea = document.createElement('div');
                        signatureArea.className = 'report-signature-modal-overlay';
                        signatureArea.innerHTML = `
                          <div class="report-signature-modal">
                            <div class="report-signature-modal-header">
                              <h3>Edit Signature</h3>
                              <button class="report-signature-modal-close">×</button>
                            </div>
                            <div class="report-signature-modal-content">
                              <canvas class="report-signature-modal-canvas" width="350" height="180"></canvas>
                              <div class="report-signature-modal-instructions">
                                Sign or draw in the area above
                              </div>
                              <div class="report-signature-modal-actions">
                                <button class="report-signature-clear-btn">Clear</button>
                                <button class="report-signature-save-btn">Save Signature</button>
                              </div>
                            </div>
                          </div>
                        `;

                        document.body.appendChild(signatureArea);

                        const canvas = signatureArea.querySelector('.report-signature-modal-canvas') as HTMLCanvasElement;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;

                        // Set canvas styles and load existing signature
                        ctx.lineWidth = 2;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.strokeStyle = '#000000';
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // Load existing signature
                        const img = new Image();
                        img.onload = () => {
                          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        };
                        img.src = value as string;

                        // Same drawing logic as above...
                        let isDrawing = false;
                        let lastX = 0;
                        let lastY = 0;

                        const getCoordinates = (e: MouseEvent | TouchEvent) => {
                          const rect = canvas.getBoundingClientRect();
                          const scaleX = canvas.width / rect.width;
                          const scaleY = canvas.height / rect.height;

                          let clientX, clientY;
                          if (e instanceof TouchEvent) {
                            clientX = e.touches[0].clientX;
                            clientY = e.touches[0].clientY;
                          } else {
                            clientX = e.clientX;
                            clientY = e.clientY;
                          }

                          return {
                            x: (clientX - rect.left) * scaleX,
                            y: (clientY - rect.top) * scaleY
                          };
                        };

                        const startDrawing = (e: MouseEvent | TouchEvent) => {
                          isDrawing = true;
                          const coords = getCoordinates(e);
                          lastX = coords.x;
                          lastY = coords.y;
                          if (e instanceof TouchEvent) e.preventDefault();
                        };

                        const draw = (e: MouseEvent | TouchEvent) => {
                          if (!isDrawing) return;
                          const coords = getCoordinates(e);
                          ctx.beginPath();
                          ctx.moveTo(lastX, lastY);
                          ctx.lineTo(coords.x, coords.y);
                          ctx.stroke();
                          lastX = coords.x;
                          lastY = coords.y;
                          if (e instanceof TouchEvent) e.preventDefault();
                        };

                        const stopDrawing = () => {
                          isDrawing = false;
                        };

                        canvas.addEventListener('mousedown', startDrawing);
                        canvas.addEventListener('mousemove', draw);
                        canvas.addEventListener('mouseup', stopDrawing);
                        canvas.addEventListener('mouseleave', stopDrawing);
                        canvas.addEventListener('touchstart', startDrawing, { passive: false });
                        canvas.addEventListener('touchmove', draw, { passive: false });
                        canvas.addEventListener('touchend', stopDrawing);
                        canvas.addEventListener('touchcancel', stopDrawing);

                        const closeModal = () => {
                          document.body.removeChild(signatureArea);
                        };

                        const clearCanvas = () => {
                          ctx.fillStyle = '#ffffff';
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                        };

                        const saveSignature = () => {
                          const signatureData = canvas.toDataURL('image/png');
                          updateQuestionAnswer(question.id, signatureData);
                          closeModal();
                        };

                        signatureArea.querySelector('.report-signature-modal-close')?.addEventListener('click', closeModal);
                        signatureArea.querySelector('.report-signature-clear-btn')?.addEventListener('click', clearCanvas);
                        signatureArea.querySelector('.report-signature-save-btn')?.addEventListener('click', saveSignature);
                        signatureArea.addEventListener('click', (e) => {
                          if (e.target === signatureArea) closeModal();
                        });
                      }}
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      className="report-remove-signature-button"
                      onClick={() => updateQuestionAnswer(question.id, null)}
                    >
                      <X size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "Date & Time":
      case "Inspection date":
        return (
          <div className="report-response-field">
            <input
              type="date"
              className="report-date-input"
              value={(value as string) || new Date().toISOString().split("T")[0]}
              onChange={(e) => updateQuestionAnswer(question.id, e.target.value)}
            />
          </div>
        );
      default:
        return <div className="report-response-field">Unsupported response type</div>;
    }
  };

  // Component to render active triggers for a question
  const renderActiveTriggers = (questionId: string) => {
    if (!reportData.activeTriggers || !reportData.activeTriggers[questionId]) {
      return null;
    }

    const activeTriggers = reportData.activeTriggers[questionId];

    return (
      <div className="report-question-triggers">
        {activeTriggers.map((triggerData, index) => {
          const { rule } = triggerData;

          switch (rule.trigger) {
            case "require_evidence":
              return (
                <div key={index} className="report-trigger report-evidence-trigger">
                  <div className="report-trigger-header">
                    <AlertTriangle size={16} className="report-trigger-icon" />
                    <span className="report-trigger-text">Evidence required</span>
                  </div>
                  <div className="report-evidence-upload">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;

                        // Convert files to base64 and store them
                        const evidenceFiles: string[] = [];

                        for (let i = 0; i < files.length; i++) {
                          const file = files[i];
                          const reader = new FileReader();

                          reader.onload = async (event) => {
                            const result = event.target?.result as string;
                            if (result) {
                              try {
                                // Resize image
                                const resizedImage = await resizeImage(result);
                                evidenceFiles.push(resizedImage);

                                // Update the evidence when all files are processed
                                if (evidenceFiles.length === files.length) {
                                  setReportData(prev => ({
                                    ...prev,
                                    questionEvidence: {
                                      ...prev.questionEvidence || {},
                                      [questionId]: [
                                        ...(prev.questionEvidence?.[questionId] || []),
                                        ...evidenceFiles
                                      ]
                                    }
                                  }));
                                }
                              } catch (error) {
                                console.error("Error processing evidence file:", error);
                              }
                            }
                          };

                          reader.readAsDataURL(file);
                        }
                      }}
                      id={`evidence-upload-${questionId}`}
                      className="evidence-file-input"
                    />
                    <label htmlFor={`evidence-upload-${questionId}`} className="evidence-upload-button">
                      <Upload size={16} />
                      <span>Upload evidence</span>
                    </label>
                  </div>

                  {/* Display uploaded evidence */}
                  {reportData.questionEvidence && reportData.questionEvidence[questionId] && (
                    <div className="report-evidence-previews">
                      {reportData.questionEvidence[questionId].map((evidence, idx) => (
                        <div key={idx} className="report-evidence-preview">
                          <img src={evidence} alt={`Evidence ${idx + 1}`} />
                          <button
                            className="remove-evidence-button"
                            onClick={() => {
                              setReportData(prev => {
                                const updatedEvidence = [...(prev.questionEvidence?.[questionId] || [])];
                                updatedEvidence.splice(idx, 1);

                                return {
                                  ...prev,
                                  questionEvidence: {
                                    ...prev.questionEvidence || {},
                                    [questionId]: updatedEvidence
                                  }
                                };
                              });
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );

            case "display_message":
              return (
                <div key={index} className="report-trigger report-message-trigger">
                  <div className="report-trigger-header">
                    <MessageSquare size={16} className="report-trigger-icon" />
                    <span className="report-trigger-text">Message</span>
                  </div>
                  <div className="report-trigger-message">
                    {rule.message || "Please review this answer carefully."}
                  </div>
                </div>
              );

            case "notify":
              return (
                <div key={index} className="report-trigger report-notify-trigger">
                  <div className="report-trigger-header">
                    <Bell size={16} className="report-trigger-icon" />
                    <span className="report-trigger-text">Notification</span>
                  </div>
                  <div className="report-trigger-message">
                    {rule.message || "This answer requires attention."}
                  </div>
                </div>
              );

            case "require_action":
              return (
                <div key={index} className="report-trigger report-action-trigger">
                  <div className="report-trigger-header">
                    <AlertTriangle size={16} className="report-trigger-icon" />
                    <span className="report-trigger-text">Action required</span>
                  </div>
                  <div className="report-action-input">
                    <textarea
                      placeholder="Describe the action taken..."
                      className="report-action-textarea"
                      onChange={(e) => {
                        // Store action text in report data
                        setReportData(prev => ({
                          ...prev,
                          actionResponses: {
                            ...prev.actionResponses || {},
                            [questionId]: {
                              ...prev.actionResponses?.[questionId] || {},
                              [rule.id]: e.target.value
                            }
                          }
                        }));
                      }}
                      value={reportData.actionResponses?.[questionId]?.[rule.id] || ""}
                    />
                  </div>
                </div>
              );

            case "ask_questions":
              return (
                <div key={index} className="report-trigger report-subquestion-trigger">
                  <div className="report-trigger-header">
                    <MessageSquare size={16} className="report-trigger-icon" />
                    <span className="report-trigger-text">Additional question</span>
                  </div>
                  {rule.subQuestion && (
                    <div className="report-subquestion">
                      <div className="report-subquestion-text">{rule.subQuestion.text}</div>

                      {/* Render different input types based on the subQuestion responseType */}
                      {rule.subQuestion.responseType === "Text" && (
                        <input
                          type="text"
                          className="report-subquestion-input"
                          placeholder="Enter your answer"
                          onChange={(e) => {
                            setReportData(prev => ({
                              ...prev,
                              subQuestionAnswers: {
                                ...prev.subQuestionAnswers || {},
                                [questionId]: {
                                  ...prev.subQuestionAnswers?.[questionId] || {},
                                  [rule.id]: e.target.value
                                }
                              }
                            }));
                          }}
                          value={reportData.subQuestionAnswers?.[questionId]?.[rule.id] || ""}
                        />
                      )}

                      {rule.subQuestion.responseType === "Number" && (
                        <input
                          type="number"
                          className="report-subquestion-input"
                          placeholder="0"
                          onChange={(e) => {
                            setReportData(prev => ({
                              ...prev,
                              subQuestionAnswers: {
                                ...prev.subQuestionAnswers || {},
                                [questionId]: {
                                  ...prev.subQuestionAnswers?.[questionId] || {},
                                  [rule.id]: e.target.value
                                }
                              }
                            }));
                          }}
                          value={reportData.subQuestionAnswers?.[questionId]?.[rule.id] || ""}
                        />
                      )}

                      {rule.subQuestion.responseType === "Yes/No" && (
                        <div className="report-subquestion-yes-no">
                          <label className="report-radio-label">
                            <input
                              type="radio"
                              name={`subquestion-yesno-${questionId}-${rule.id}`}
                              value="Yes"
                              checked={reportData.subQuestionAnswers?.[questionId]?.[rule.id] === "Yes"}
                              onChange={() => {
                                setReportData(prev => ({
                                  ...prev,
                                  subQuestionAnswers: {
                                    ...prev.subQuestionAnswers || {},
                                    [questionId]: {
                                      ...prev.subQuestionAnswers?.[questionId] || {},
                                      [rule.id]: "Yes"
                                    }
                                  }
                                }));
                              }}
                            />
                            <span>Yes</span>
                          </label>
                          <label className="report-radio-label">
                            <input
                              type="radio"
                              name={`subquestion-yesno-${questionId}-${rule.id}`}
                              value="No"
                              checked={reportData.subQuestionAnswers?.[questionId]?.[rule.id] === "No"}
                              onChange={() => {
                                setReportData(prev => ({
                                  ...prev,
                                  subQuestionAnswers: {
                                    ...prev.subQuestionAnswers || {},
                                    [questionId]: {
                                      ...prev.subQuestionAnswers?.[questionId] || {},
                                      [rule.id]: "No"
                                    }
                                  }
                                }));
                              }}
                            />
                            <span>No</span>
                          </label>
                          <label className="report-radio-label">
                            <input
                              type="radio"
                              name={`subquestion-yesno-${questionId}-${rule.id}`}
                              value="N/A"
                              checked={reportData.subQuestionAnswers?.[questionId]?.[rule.id] === "N/A"}
                              onChange={() => {
                                setReportData(prev => ({
                                  ...prev,
                                  subQuestionAnswers: {
                                    ...prev.subQuestionAnswers || {},
                                    [questionId]: {
                                      ...prev.subQuestionAnswers?.[questionId] || {},
                                      [rule.id]: "N/A"
                                    }
                                  }
                                }));
                              }}
                            />
                            <span>N/A</span>
                          </label>
                        </div>
                      )}

                      {rule.subQuestion.responseType === "Multiple choice" && (
                        <select
                          className="report-subquestion-select"
                          value={reportData.subQuestionAnswers?.[questionId]?.[rule.id] || ""}
                          onChange={(e) => {
                            setReportData(prev => ({
                              ...prev,
                              subQuestionAnswers: {
                                ...prev.subQuestionAnswers || {},
                                [questionId]: {
                                  ...prev.subQuestionAnswers?.[questionId] || {},
                                  [rule.id]: e.target.value
                                }
                              }
                            }));
                          }}
                        >
                          <option value="">Select an option</option>
                          {rule.subQuestion.options ?
                            rule.subQuestion.options.map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            )) :
                            [
                              <option key="1" value="Option 1">Option 1</option>,
                              <option key="2" value="Option 2">Option 2</option>,
                              <option key="3" value="Option 3">Option 3</option>
                            ]
                          }
                        </select>
                      )}
                    </div>
                  )}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    );
  };

  const renderReportQuestion = (question: Question, questionIndex: number) => (
    <div key={question.id} className="report-question-item compact-question">
      <div className="report-question-header">
        <span className="report-question-number">{questionIndex + 1}.</span>
        <span className="report-question-text">{question.text}</span>
        {question.required && <span className="report-required-badge">Required</span>}
      </div>
      {renderReportQuestionResponse(question, reportData, updateQuestionAnswer)}
      {renderActiveTriggers(question.id)}
    </div>
  )

  const renderReportTab = () => {
    return (
      <div className="report-preview-container">
        <div className="report-actions">
          <h2>Garment Inspection Report</h2>
          <div className="report-action-buttons">
            <button className="export-pdf-button" onClick={printReport} disabled={isExporting}>
              <Printer size={18} />
              <span>{isExporting ? "Preparing..." : "Print Report"}</span>
            </button>
          </div>
        </div>

        <div className="report-preview" ref={reportRef}>
          <div className="report-header-preview">
            <div className="report-header-content">
              <div className="report-logo">
                {template.logo ? (
                  <img src={template.logo} alt="Company logo" />
                ) : (
                  <div className="logo-placeholder">M.I.S</div>
                )}
              </div>
              <div className="report-title-info">
                <h3>GARMENT INSPECTION REPORT</h3>
                <p>{template.description || "THIS DOCUMENT IS NON-NEGOTIABLE"}</p>
              </div>
              <div className="report-header-spacer"></div>
            </div>
          </div>

          {/* Questions Section */}
          {template.sections
            .filter((section) => section.type === "standard")
            .map((section) => (
              <div key={section.id} className="report-section-preview">
                <h4>{section.title}</h4>
                <div className="report-questions">
                  {(section.content as StandardSectionContent).questions.map((question, questionIndex) =>
                    renderReportQuestion(question, questionIndex),
                  )}
                </div>
              </div>
            ))}

          <div className="report-section-preview">
            <h4>Garment Details</h4>

            {template.sections.some((s) => s.type === "garmentDetails") ? (
              <div className="garment-grid-preview">
                <div className="grid-actions">
                  <div className="grid-action-item">
                    <input
                      type="text"
                      placeholder="Add Size"
                      value={reportData.newSize}
                      onChange={(e) => setReportData((prev) => ({ ...prev, newSize: e.target.value }))}
                      className="grid-action-input"
                    />
                    <button className="grid-action-button" onClick={addReportSize}>
                      Add Size
                    </button>
                  </div>
                  <div className="grid-action-item">
                    <input
                      type="text"
                      placeholder="Add Color"
                      value={reportData.newColor}
                      onChange={(e) => setReportData((prev) => ({ ...prev, newColor: e.target.value }))}
                      className="grid-action-input"
                    />
                    <button className="grid-action-button" onClick={addReportColor}>
                      Add Color
                    </button>
                  </div>
                </div>

                <table className="garment-table-preview">
                  <thead>
                    <tr>
                      <th>
                        Color
                        <div className="table-header-actions">
                          <button className="table-edit-button" title="Edit Colors">
                            <Edit size={12} />
                          </button>
                        </div>
                      </th>
                      {(() => {
                        const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
                        if (!garmentSection || !isGarmentDetailsContent(garmentSection.content)) return null;

                        return garmentSection.content.sizes.map((size: string) => (
                          <React.Fragment key={size}>
                            <th colSpan={2} className="size-header">
                              {size}
                              <div className="table-header-actions">
                                <button
                                  className="table-delete-button"
                                  title={`Remove ${size}`}
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to remove size "${size}"?`)) {
                                      const section = template.sections.find((s) => s.type === "garmentDetails");
                                      if (section && isGarmentDetailsContent(section.content)) {
                                        const updatedSizes = section.content.sizes.filter(s => s !== size);
                                        updateGarmentDetails(section.id, { sizes: updatedSizes });
                                      }
                                    }
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </th>
                          </React.Fragment>
                        ));
                      })()}
                      <th colSpan={2} className="size-header">Total</th>
                    </tr>
                    <tr>
                      <th></th>
                      {(() => {
                        const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
                        if (!garmentSection || !isGarmentDetailsContent(garmentSection.content)) return null;

                        return garmentSection.content.sizes.map((size: string) => (
                          <React.Fragment key={size}>
                            <th className="qty-header">Order Qty</th>
                            <th className="qty-header">Offered Qty</th>
                          </React.Fragment>
                        ));
                      })()}
                      <th className="qty-header">Order Qty</th>
                      <th className="qty-header">Offered Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {  // Outer IIFE for iterating over garment details section if it exists
                      const garmentSection = template.sections.find((s) => s.type === "garmentDetails");

                      // Perform the type guard check
                      if (!garmentSection || !isGarmentDetailsContent(garmentSection.content)) {
                        // If no garment section or its content isn't GarmentDetailsContent,
                        // render nothing or a placeholder row.
                        return null;
                        // Example placeholder:
                        // return <tr><td colSpan={/* calculate appropriate colSpan */}>Garment details not available.</td></tr>;
                      }

                      // **Crucial Change:** Assign the narrowed content to a new constant.
                      // TypeScript will now know 'confirmedGarmentContent' is definitely 'GarmentDetailsContent'.
                      const confirmedGarmentContent = garmentSection.content;

                      // Now map over colors using the confirmed content
                      return confirmedGarmentContent.colors.map((color: string) => (
                        <tr key={color}>
                          <td className="color-column">
                            <div className="color-cell">
                              <span>{color}</span>
                              <button
                                title={`Remove ${color}`}
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to remove color "${color}"?`)) {
                                    const section = template.sections.find((s) => s.type === "garmentDetails");
                                    if (section && isGarmentDetailsContent(section.content)) {
                                      const updatedColors = section.content.colors.filter(c => c !== color);
                                      updateGarmentDetails(section.id, { colors: updatedColors });
                                    }
                                  }
                                }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </td>
                          {(() => {
                            // Inner IIFE for sizes. Use the 'confirmedGarmentContent' here as well.
                            return confirmedGarmentContent.sizes.map((size: string) => ( // THIS IS THE TARGET LINE (around 1845)
                              <React.Fragment key={size}>
                                <td>
                                  <input
                                    type="number"
                                    className="qty-input"
                                    value={reportData.quantities[color]?.[size]?.orderQty || ""}
                                    onChange={(e) => handleQuantityChange(color, size, "orderQty", e.target.value)}
                                    placeholder="0"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="qty-input"
                                    value={reportData.quantities[color]?.[size]?.offeredQty || ""}
                                    onChange={(e) => handleQuantityChange(color, size, "offeredQty", e.target.value)}
                                    placeholder="0"
                                  />
                                </td>
                              </React.Fragment>
                            ));
                          })()}
                          <td className="total-cell">{calculateRowTotal(color, "orderQty")}</td>
                          <td className="total-cell">{calculateRowTotal(color, "offeredQty")}</td>
                        </tr>
                      ));
                    })()}
                    <tr className="total-row">
                      <td className="color-column">Total</td>
                      {(() => {
                        const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
                        if (!garmentSection || !isGarmentDetailsContent(garmentSection.content)) return null;

                        return garmentSection.content.sizes.map((size: string) => (
                          <React.Fragment key={size}>
                            <td className="total-cell">{calculateColumnTotal(size, "orderQty")}</td>
                            <td className="total-cell">{calculateColumnTotal(size, "offeredQty")}</td>
                          </React.Fragment>
                        ));
                      })()}
                      <td className="total-cell">{calculateGrandTotal("orderQty")}</td>
                      <td className="total-cell">{calculateGrandTotal("offeredQty")}</td>
                    </tr>
                  </tbody>
                </table>

                {(() => {
                  const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
                  if (garmentSection && isGarmentDetailsContent(garmentSection.content) && garmentSection.content.includeCartonOffered) {
                    return (
                  <div className="carton-info">
                    <label>No of Carton Offered:</label>
                    <input
                      type="number"
                      className="carton-input"
                      value={reportData.cartonOffered}
                      onChange={(e) => setReportData((prev) => ({ ...prev, cartonOffered: e.target.value }))}
                    />
                  </div>
                    );
                  }
                  return null;
                })()}

                <div className="carton-info">
                  <label>No of Carton to Inspect:</label>
                  <input
                    type="number"
                    className="carton-input"
                    value={reportData.cartonToInspect}
                    onChange={(e) => setReportData((prev) => ({ ...prev, cartonToInspect: e.target.value }))}
                  />
                </div>

                {(() => {
                  const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
                  if (garmentSection && isGarmentDetailsContent(garmentSection.content) && garmentSection.content.includeCartonInspected) {
                    return (
                  <div className="carton-info">
                    <label>No of Carton Inspected:</label>
                    <input
                      type="number"
                      className="carton-input"
                      value={reportData.cartonInspected}
                      onChange={(e) => setReportData((prev) => ({ ...prev, cartonInspected: e.target.value }))}
                    />
                  </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <p>No garment details configured</p>
            )}
          </div>

          <div className="report-section-preview">
            <h4>Defect Log</h4>

            {template.sections.some((s) => s.type === "garmentDetails") ? (
              <div className="defect-log-preview">
                <table className="defect-table-preview">
                  <thead>
                    <tr>
                      <th>Defect Type</th>
                      <th>Remarks</th>
                      <th>Critical</th>
                      <th>Major</th>
                      <th>Minor</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.defects.map((defect, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            className="defect-input"
                            value={defect.type}
                            onChange={(e) => updateDefect(index, "type", e.target.value)}
                            placeholder="Enter defect type"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="defect-input"
                            value={defect.remarks}
                            onChange={(e) => updateDefect(index, "remarks", e.target.value)}
                            placeholder="Enter remarks"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="defect-input"
                            value={defect.critical || 0}
                            onChange={(e) => updateDefect(index, "critical", e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="defect-input"
                            value={defect.major}
                            onChange={(e) => updateDefect(index, "major", e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="defect-input"
                            value={defect.minor}
                            onChange={(e) => updateDefect(index, "minor", e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          {Number.parseInt(defect.critical?.toString() || "0", 10) +
                            Number.parseInt(defect.major?.toString() || "0", 10) +
                            Number.parseInt(defect.minor?.toString() || "0", 10)}
                        </td>
                        <td className="defect-actions">
                          <label className="image-upload-label">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleDefectImageUpload(index, e)}
                              className="sr-only"
                            />
                            <ImageIcon size={16} className="action-icon" />
                          </label>
                          <button
                            className="defect-action-button"
                            onClick={() => {
                              const newDefects = [...reportData.defects]
                              newDefects.splice(index, 1)
                              setReportData((prev) => ({ ...prev, defects: newDefects }))
                              setDefectImages((prev) => {
                                const newImages = { ...prev }
                                delete newImages[index]
                                return newImages
                              })
                            }}
                          >
                            <Trash2 size={16} className="action-icon" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan={2}>Total</td>
                      <td>{calculateTotalDefects("critical")}</td>
                      <td>{calculateTotalDefects("major")}</td>
                      <td>{calculateTotalDefects("minor")}</td>
                      <td>
                        {calculateTotalDefects("critical") +
                          calculateTotalDefects("major") +
                          calculateTotalDefects("minor")}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                <div className="add-defect-container">
                  <button className="add-defect-button" onClick={addReportDefect}>
                    <Plus size={16} /> Add Defect
                  </button>
                </div>

                <div className="photograph-section">
                  <h5>Photographs</h5>
                  <div className="defect-images-grid">
                    {Object.entries(defectImages).map(([defectIndex, images]) => {
                      const index = Number.parseInt(defectIndex, 10)
                      const defect = reportData.defects[index]
                      if (!defect || !images.length) return null

                      return images.map((image, imageIndex) => (
                        <div key={`${defectIndex}-${imageIndex}`} className="defect-image-card">
                          <div className="defect-image-header">
                            <span className="defect-image-type">{defect.type}</span>
                            <button
                              className="remove-image-button"
                              onClick={() => removeDefectImage(index, imageIndex)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="defect-image-container">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Defect: ${defect.type}`}
                              className="defect-image"
                            />
                          </div>
                          <div className="defect-image-remarks">{defect.remarks}</div>
                        </div>
                      ))
                    })}
                  </div>
                </div>

                <div className="aql-result-preview">
                  <div className="aql-header">
                    <h5>AQL Result</h5>
                    <button className="edit-aql-button" onClick={toggleAqlEditing}>
                      <Edit size={16} />
                    </button>
                  </div>
                  <div className="aql-info">
                    {reportData.editingAql ? (
                      <>
                        <div className="aql-edit-field">
                          <label>AQL Level:</label>
                          <select
                            value={reportData.aqlSettings.aqlLevel}
                            onChange={(e) => updateAqlResult("aqlLevel", e.target.value)}
                            className="aql-edit-input"
                          >
                            {AQL_LEVELS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="aql-edit-field">
                          <label>Inspection Level:</label>
                          <select
                            value={reportData.aqlSettings.inspectionLevel}
                            onChange={(e) => updateAqlResult("inspectionLevel", e.target.value)}
                            className="aql-edit-input"
                          >
                            {INSPECTION_LEVELS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="aql-edit-field">
                          <label>Sampling Plan:</label>
                          <select
                            value={reportData.aqlSettings.samplingPlan}
                            onChange={(e) => updateAqlResult("samplingPlan", e.target.value)}
                            className="aql-edit-input"
                          >
                            {SAMPLING_PLANS.map((plan) => (
                              <option key={plan} value={plan}>
                                {plan}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="aql-edit-field">
                          <label>Severity:</label>
                          <select
                            value={reportData.aqlSettings.severity}
                            onChange={(e) => updateAqlResult("severity", e.target.value)}
                            className="aql-edit-input"
                          >
                            {SEVERITIES.map((severity) => (
                              <option key={severity} value={severity}>
                                {severity}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="aql-edit-field">
                          <label>Status:</label>
                          <select
                            value={reportData.aqlSettings.status}
                            onChange={(e) => updateAqlResult("status", e.target.value)}
                            className="aql-edit-input"
                          >
                            <option value="PASS">PASS</option>
                            <option value="FAIL">FAIL</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <p>
                          <strong>AQL Level:</strong> {reportData.aqlSettings.aqlLevel}
                        </p>
                        <p>
                          <strong>Inspection Level:</strong> {reportData.aqlSettings.inspectionLevel}
                        </p>
                        <p>
                          <strong>Sampling Plan:</strong> {reportData.aqlSettings.samplingPlan}
                        </p>
                        <p>
                          <strong>Severity:</strong> {reportData.aqlSettings.severity}
                        </p>
                        <p className={`aql-status ${reportData.aqlSettings.status.toLowerCase()}`}>
                          <strong>Status:</strong> {reportData.aqlSettings.status}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p>No defect types configured</p>
            )}
          </div>
        </div>

        {/* Report Tab Navigation */}
        <div className="garment-template-report-footer">
          <button className="garment-template-next-button" onClick={() => {
            setActiveTab(2)
            setMaxAccessibleTab(Math.max(maxAccessibleTab, 2))
          }}>
            Next: Access
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  const renderAccessTab = () => {
    const handlePublish = () => {
      // Save the template
      updateTemplate({
        ...template,
        lastSaved: new Date()
      });

      alert('Template published successfully!');
      window.location.href = '/dashboard';
    };

    return (
      <div className="garment-template-access-container">
        <div className="garment-template-access-header">
          <h1 className="garment-template-access-title">Template Access & Settings</h1>
          <p className="garment-template-access-description">Configure access permissions and template assignments for this template.</p>
        </div>

        <div className="garment-template-access-content">
          <div className="garment-template-access-tab">
            <div className="garment-template-permissions-section">
              <h2>
                <User size={22} className="garment-template-section-icon" />
                User Permissions
              </h2>
              <p>Manage who can access, edit, and use this template. Add team members and set appropriate permission levels.</p>

              <AccessManager
                templateId={template.id}
                templateTitle={template.title || "Untitled Template"}
                initialUsers={[]}
                onUpdatePermissions={(users) => {
                  console.log("Updated permissions:", users);
                  // Here you would update the template with the new permissions
                  // setTemplate({ ...template, permissions: users });
                }}
              />
            </div>
          </div>

          <div className="garment-template-access-tab">
            <div className="garment-template-permissions-section">
              <h2>
                <ClipboardCheck size={22} className="garment-template-section-icon" />
                Template Assignments
              </h2>
              <p>Assign this template to inspectors who will complete the inspections.</p>

              <TemplateAssignmentManager
                templateId={template.id}
                templateTitle={template.title || "Untitled Template"}
                onAssignmentUpdated={() => {
                  console.log("Template assignments updated")
                }}
              />
            </div>
          </div>
        </div>

        <div className="garment-template-access-footer">
          <div className="garment-template-publish-container">
            <button
              className="garment-template-publish-button"
              onClick={handlePublish}
            >
              <CheckCircle size={20} />
              <span>Publish Template</span>
            </button>
            <p className="garment-template-publish-note">
              Publishing will make this template available to all users with access permissions. Once published, inspectors can begin using this template.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show access error if user doesn't have permission
  if (accessError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ marginBottom: '2rem', maxWidth: '500px' }}>{accessError}</p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return <div>Loading template...</div>
  }

  // Main Render
  return (
    <div className="garment-template-builder-page">
      <div className="top-navigation">
        <div className="nav-left">
          <div className="company-name">STREAMLINEER</div>
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={16} />
            <span>back</span>
          </button>
        </div>
        <div className="nav-center">
          <div className="nav-tabs">
            <button className={`nav-tab ${activeTab === 0 ? "active" : ""}`} onClick={() => setActiveTab(0)}>
              1. Build
            </button>
            <button
              className={`nav-tab ${activeTab === 1 ? "active" : ""}`}
              onClick={() => setActiveTab(1)}
              disabled={maxAccessibleTab < 1}
            >
              2. Report
            </button>
            <button
              className={`nav-tab ${activeTab === 2 ? "active" : ""}`}
              onClick={() => setActiveTab(2)}
              disabled={maxAccessibleTab < 2}
            >
              3. Access
            </button>
          </div>
        </div>
        <div className="nav-right">
          {/* Show save button only in Access tab (tab 2) */}
          {activeTab === 2 && (
            <button className="nav-save-button" onClick={handleSave}>
              <Save size={16} />
              Save Template
            </button>
          )}
        </div>
      </div>

      <div className="builder-content">
        {activeTab === 0 && (
          <div className="template-builder-container">
            <div className={`template-content ${showMobilePreview ? 'with-preview' : ''}`}>
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
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoUpload}
                  />
                </div>
                <div className="template-info">
                  <input
                    type="text"
                    className="template-title"
                    value={template.title}
                    onChange={(e) => updateTemplate({ title: e.target.value })}
                    placeholder="Untitled garment template"
                  />
                  <input
                    type="text"
                    className="template-description"
                    value={template.description}
                    onChange={(e) => updateTemplate({ description: e.target.value })}
                    placeholder="Add a description for this garment inspection template"
                  />
                </div>
              </div>
              <div className="sections-container">
                {template.sections.map((section, idx) => renderSection(section, idx))}
              </div>
              <div className="add-section-container">
                <div className="garment-template-add-section-actions">
                  <button className="add-section-button" onClick={addStandardSection}>
                    <Plus size={16} /> Add Standard Page
                  </button>
                  <button className="garment-template-next-button" onClick={() => {
                    setActiveTab(1)
                    setMaxAccessibleTab(Math.max(maxAccessibleTab, 1))
                  }}>
                    Next: Report
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {showMobilePreview ? (
              <div className="mobile-preview-container">
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
                              <img
                                src={template.logo || "/placeholder.svg"}
                                alt="Template logo"
                                className="mobile-logo-image"
                              />
                            </div>
                            <div className="mobile-template-title">{template.title}</div>
                          </div>
                        )}

                        <div className="mobile-preview-message">
                          <Shirt size={32} className="mobile-preview-icon" />
                          <h3>Garment Inspection Template</h3>
                          <p>This is a preview of your garment inspection template.</p>
                          <p>The template includes:</p>
                          <ul>
                            <li>{template.sections.filter((s) => s.type === "standard").length} standard sections</li>
                            <li>
                              {template.sections.some((s) => s.type === "garmentDetails")
                                ? "Garment Details section"
                                : "No Garment Details section"}
                            </li>
                            <li>
                              {(() => {
                                const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
                                return (garmentSection && isGarmentDetailsContent(garmentSection.content))
                                  ? garmentSection.content.sizes.length
                                  : 0;
                              })()}{" "}
                              sizes configured
                            </li>
                            <li>
                              {(() => {
                                const garmentSection = template.sections.find((s) => s.type === "garmentDetails");
                                return (garmentSection && isGarmentDetailsContent(garmentSection.content))
                                  ? garmentSection.content.colors.length
                                  : 0;
                              })()}{" "}
                              colors configured
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        )}

        {activeTab === 1 && renderReportTab()}
        {activeTab === 2 && renderAccessTab()}
      </div>


    </div>
  )
}

export default Garment_Template
