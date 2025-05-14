
"use client"

import React, { useState, useRef, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronDown, ChevronUp, Edit, Plus, Calendar, User, MapPin, X, Check, ImageIcon, Trash2, Move, Clock, ArrowLeft, ArrowRight, CheckCircle, Settings, Ruler, Box, List, Shirt, FileText, Printer } from 'lucide-react'
import "./garment-template.css"
import "./print-styles.css"
import AccessManager from "./components/AccessManager"
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
}

// Garment-specific types
type AQLLevel = "1.5" | "2.5" | "4.0" | "6.5"
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

// This function will be defined inside the component

// Constants
const AQL_LEVELS: AQLLevel[] = ["1.5", "2.5", "4.0", "6.5"]
const INSPECTION_LEVELS: InspectionLevel[] = ["I", "II", "III", "S1", "S2", "S3", "S4"]
const SAMPLING_PLANS: SamplingPlan[] = ["Single", "Double", "Multiple"]
const SEVERITIES: Severity[] = ["Normal", "Tightened", "Reduced"]
const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"]
const DEFAULT_COLORS = ["BLUE", "RED", "BLACK"]
const DEFAULT_DEFECTS = ["Stitching", "Fabric", "Color", "Measurement", "Packing"]

// Utility Functions
const generateId = () => Math.random().toString(36).substring(2, 9)
// Kept for future implementation of logic rules
// Commented out to avoid unused variable warning
// const generateRuleId = () => `rule_${Math.random().toString(36).substring(2, 9)}`

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
            Annotation Placeholder
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

// Main Component
const Garment_Template: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [template, setTemplate] = useState<Template>(getInitialTemplate())
  const [isLoading, setIsLoading] = useState<boolean>(!!id)
  const [activeTab, setActiveTab] = useState<number>(0)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(template.sections[0]?.id || null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<{ type: "question" | "section"; id: string } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ type: "question" | "section"; id: string } | null>(null)
  const [showResponseTypeMenu, setShowResponseTypeMenu] = useState<string | null>(null)

  // Load existing template if in edit mode
  useEffect(() => {
    console.log("Garment_Template: Component mounted, id param:", id);

    if (id) {
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
    } else {
      console.log("Garment_Template: No ID provided, using default template")
    }
  }, [id, navigate])
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(true)
  const [newSize, setNewSize] = useState<string>("")
  const [newColor, setNewColor] = useState<string>("")
  const [newDefect, setNewDefect] = useState<string>("")
  const [defectImages, setDefectImages] = useState<{ [defectIndex: number]: string[] }>({})
  const [startDate, setStartDate] = useState<string>("")
  const [dueDate, setDueDate] = useState<string>("")
  const [dateErrors, setDateErrors] = useState<{
    startDate?: string;
    dueDate?: string;
  }>({})
  const [isExporting, setIsExporting] = useState<boolean>(false)

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

      // Prepare sections data
      const sectionsData = template.sections.map(section => {
        if (section.type === "garmentDetails" && isGarmentDetailsContent(section.content)) {
          return {
            id: section.id,
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
          return {
            id: section.id,
            title: section.title,
            type: section.type,
            isCollapsed: section.isCollapsed,
            content: section.content
          };
        }
      });

      // Add sections data
      formData.append("sections", JSON.stringify(sectionsData));

      // Determine if this is a new template or an edit
      const isNew = !id;

      // Set the appropriate URL and method based on whether we're creating or updating
      const url = isNew
        ? "http://localhost:8000/api/users/garment-template/"
        : `http://localhost:8000/api/users/templates/${id}/`;

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
          "Are you sure you want to delete the Garment Details section? This will remove all garment-specific configuration.",
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

  const evaluateAqlStatus = () => {
    const lotSize = calculateGrandTotal("offeredQty");
    const inspectionLevel = reportData.aqlSettings.inspectionLevel;
    const aqlLevel = reportData.aqlSettings.aqlLevel;

    // Check if the inspection level is one of the valid AQL inspection levels
    if (isValidAqlInspectionLevel(inspectionLevel)) {
      const code = getAqlCodeLetter(lotSize, inspectionLevel);
      const plan = code ? getSamplePlan(code, aqlLevel) : null;

      if (plan) {
        const totalMajorDefects = calculateTotalDefects("major");

        const status = totalMajorDefects > plan.accept ? "FAIL" : "PASS";
        setReportData(prev => ({
          ...prev,
          aqlSettings: {
            ...prev.aqlSettings,
            status,
          },
        }));
      }
    } else {
      // For non-standard inspection levels, use a default status
      console.warn(`Inspection level ${inspectionLevel} is not supported by AQL tables. Using default status.`);
      setReportData(prev => ({
        ...prev,
        aqlSettings: {
          ...prev.aqlSettings,
          status: "PASS", // Default to PASS for unsupported inspection levels
        },
      }));
    }
  };

  // Helper function to check if an inspection level is valid for AQL calculations
  const isValidAqlInspectionLevel = (level: InspectionLevel): level is AqlInspectionLevel => {
    return level === "I" || level === "II" || level === "III";
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
            <div className="annotation-placeholder-box">
              Annotation Placeholder (Report)
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

  const renderReportQuestion = (question: Question, questionIndex: number) => (
    <div key={question.id} className="report-question-item compact-question">
      <div className="report-question-header">
        <span className="report-question-number">{questionIndex + 1}.</span>
        <span className="report-question-text">{question.text}</span>
        {question.required && <span className="report-required-badge">Required</span>}
      </div>
      {renderReportQuestionResponse(question, reportData, updateQuestionAnswer)}
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
      </div>
    )
  }

  // Initialize dates for the inspection session
  useEffect(() => {
    if (!startDate) {
      const today = new Date();
      setStartDate(today.toISOString().split('T')[0]);

      // Set due date to 30 days from today by default
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      setDueDate(thirtyDaysLater.toISOString().split('T')[0]);
    }
  }, [startDate, setStartDate, setDueDate]);

  const renderAccessTab = () => {
    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0];

    const validateDates = () => {
      const errors: {startDate?: string; dueDate?: string} = {};
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const selectedStartDate = new Date(startDate);
      const selectedDueDate = new Date(dueDate);

      // Check if start date is in the past
      if (selectedStartDate < currentDate) {
        errors.startDate = "Start date cannot be in the past";
      }

      // Check if due date is before start date
      if (selectedDueDate < selectedStartDate) {
        errors.dueDate = "Due date must be after start date";
      }

      setDateErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStartDate = e.target.value;
      setStartDate(newStartDate);

      // Clear any existing errors for start date
      setDateErrors(prev => ({...prev, startDate: undefined}));

      // Ensure due date is not before start date
      const startDateObj = new Date(newStartDate);
      const dueDateObj = new Date(dueDate);

      if (dueDateObj < startDateObj) {
        // Set due date to start date if it's before the new start date
        setDueDate(newStartDate);
        // Clear any existing errors for due date
        setDateErrors(prev => ({...prev, dueDate: undefined}));
      }
    };

    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDueDate = e.target.value;
      setDueDate(newDueDate);

      // Clear any existing errors for due date
      setDateErrors(prev => ({...prev, dueDate: undefined}));

      // Validate that due date is not before start date
      const startDateObj = new Date(startDate);
      const dueDateObj = new Date(newDueDate);

      if (dueDateObj < startDateObj) {
        setDateErrors(prev => ({
          ...prev,
          dueDate: "Due date must be after start date"
        }));
      }
    };

    const handlePublish = async () => {
      // Validate dates before publishing
      if (validateDates()) {
        try {
          // Update template with session dates
          updateTemplate({
            ...template,
            startDate: startDate,
            dueDate: dueDate,
            lastSaved: new Date()
          });

          // Save the template to the backend
          await handleSave();

          // Mark as published in the database
          const csrfToken = await fetchCSRFToken();
          const formData = new FormData();
          formData.append("template_id", template.id);
          formData.append("title", template.title);
          formData.append("publish", "true");

          const publishResponse = await fetch("http://localhost:8000/api/users/garment-template/", {
            method: "POST",
            headers: {
              "X-CSRFToken": csrfToken,
            },
            body: formData,
            credentials: "include",
          });

          if (!publishResponse.ok) {
            let errorData;
            try {
              errorData = await publishResponse.json();
              throw new Error(errorData.error || "Failed to publish template");
            } catch (jsonError) {
              throw new Error(`Failed to publish template: ${publishResponse.statusText}`);
            }
          }

          // Try to get the response data
          let publishData;
          try {
            publishData = await publishResponse.json();
            console.log("Publish response:", publishData);

            // If we got a template_id back from the server, update our template
            if (publishData && publishData.template_id) {
              updateTemplate({
                id: publishData.template_id.toString(),
                lastPublished: new Date()
              });
            }
          } catch (error) {
            console.warn("Could not parse publish response as JSON:", error);
          }

          alert('Template published successfully!');
          window.location.href = '/dashboard';
        } catch (error: any) {
          console.error("Error publishing template:", error);
          alert(`Failed to publish template: ${error.message || "Unknown error"}`);
        }
      } else {
        // Show error message if validation fails
        alert('Please correct the errors before publishing.');
      }
    };

    return (
      <div className="access-page-container">
        <h1 className="access-main-title">Template Access & Settings</h1>
        <p className="access-main-description">Configure access permissions and inspection timeframe for this template.</p>

        <div className="access-content">
          <div className="access-tab">
            <div className="session-section">
              <h2>
                <Calendar size={20} className="section-icon" />
                Inspection Timeframe
              </h2>
              <p>Set the start and due dates for inspections using this template.</p>

              <div className="date-fields">
                <div className="date-field">
                  <label htmlFor="start-date">Start Date <span className="required-indicator">*</span></label>
                  <div className="date-input-container">
                    <input
                      type="date"
                      id="start-date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      min={today} // Prevent selecting dates before today
                      className={`date-input ${dateErrors.startDate ? 'date-input-error' : ''}`}
                      style={{appearance: "none", WebkitAppearance: "none"}}
                    />
                    <Calendar size={16} className="date-icon" />
                  </div>
                  {dateErrors.startDate && (
                    <div className="date-error-message">{dateErrors.startDate}</div>
                  )}
                  <div className="date-helper-text">Earliest date inspections can begin</div>
                </div>

                <div className="date-field">
                  <label htmlFor="due-date">Due Date <span className="required-indicator">*</span></label>
                  <div className="date-input-container">
                    <input
                      type="date"
                      id="due-date"
                      value={dueDate}
                      onChange={handleDueDateChange}
                      min={startDate} // Prevent selecting a due date before start date
                      className={`date-input ${dateErrors.dueDate ? 'date-input-error' : ''}`}
                      style={{appearance: "none", WebkitAppearance: "none"}}
                    />
                    <Calendar size={16} className="date-icon" />
                  </div>
                  {dateErrors.dueDate && (
                    <div className="date-error-message">{dateErrors.dueDate}</div>
                  )}
                  <div className="date-helper-text">Deadline for completing inspections</div>
                </div>
              </div>
            </div>
          </div>

          <div className="access-tab">
            <div className="permissions-section">
              <h2>
                <User size={20} className="section-icon" />
                User Permissions
              </h2>
              <p>Manage who can access, edit, and use this template.</p>

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
        </div>

        <div className="access-footer">
          <div className="publish-container">
            <button
              className="publish-button"
              onClick={handlePublish}
            >
              <CheckCircle size={18} />
              <span>Publish Template</span>
            </button>
            <p className="publish-note">
              Publishing will make this template available to all users with access permissions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main Render
  if (isLoading) {
    console.log("Garment_Template: Rendering loading state");
    return (
      <div className="garment-template-builder-page">
        <div className="loading-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          <p>Loading garment template...</p>
        </div>
      </div>
    );
  }

  // Log template data for debugging
  console.log("Garment_Template: Rendering full template UI");
  console.log("Garment_Template: Current template data:", template);
  console.log("Garment_Template: Template sections:", template.sections);

  // Safety check for template structure
  if (!template || !template.sections || !Array.isArray(template.sections) || template.sections.length === 0) {
    console.error("Garment_Template: Invalid template structure detected");
    return (
      <div className="garment-template-builder-page">
        <div className="error-container" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'red', marginBottom: '20px' }}>Error Loading Template</h2>
          <p>There was a problem loading the template data. The template structure appears to be invalid.</p>
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => window.location.href = '/templates'}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4a90e2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Return to Templates
            </button>
            <button
              onClick={() => {
                // Reset to a new template
                const defaultTemplate = getInitialTemplate();
                setTemplate(defaultTemplate);
                setActiveSectionId(defaultTemplate.sections[0]?.id || null);
                setIsLoading(false);

                // Force a re-render by setting a timeout
                setTimeout(() => {
                  console.log("Garment_Template: Forcing re-render with new template");
                }, 100);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#5cb85c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create New Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="garment-template-builder-page">
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
            <button className={`nav-tab ${activeTab === 0 ? "active" : ""}`} onClick={() => setActiveTab(0)}>
              1. Build
            </button>
            <button className={`nav-tab ${activeTab === 1 ? "active" : ""}`} onClick={() => setActiveTab(1)}>
              2. Report
            </button>
            <button className={`nav-tab ${activeTab === 2 ? "active" : ""}`} onClick={() => setActiveTab(2)}>
              3. Access
            </button>
          </div>
        </div>
        <div className="nav-right">
          {activeTab === 0 && (
            <button className="nav-next-button" onClick={() => setActiveTab(1)}>
              Next: Report
              <ArrowRight size={16} />
            </button>
          )}
          {activeTab === 1 && (
            <button className="nav-next-button" onClick={() => setActiveTab(2)}>
              Next: Access
              <ArrowRight size={16} />
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
                <button className="add-section-button" onClick={addStandardSection}>
                  <Plus size={16} /> Add Standard Page
                </button>
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
