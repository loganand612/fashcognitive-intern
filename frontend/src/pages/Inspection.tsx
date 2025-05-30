"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ImageIcon, X, ChevronDown, AlertTriangle, ArrowLeft, CheckCircle, Edit, Bell, Camera, HelpCircle, MessageCircle, Trash2, Plus } from "lucide-react"
import { fetchData, postData } from "../utils/api"
import "./Inspection.css"

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

// Constants for AQL editing
const AQL_LEVELS: AQLLevel[] = ["1.5", "2.5", "4.0", "6.5"]
const INSPECTION_LEVELS: InspectionLevel[] = ["I", "II", "III"]
const SAMPLING_PLANS: SamplingPlan[] = ["Single", "Double", "Multiple"]
const SEVERITIES: Severity[] = ["Normal", "Tightened", "Reduced"]

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

interface Section {
  id: string
  title: string
  description?: string
  questions: Question[]
  type?: SectionType
  content?: StandardSectionContent | GarmentDetailsContent
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
  console.log(`    isConditionMet: Checking question value "${question.value}" against rule value "${rule.value}" with condition "${rule.condition}"`)

  if (question.value === null || question.value === undefined) {
    console.log(`    isConditionMet: Question value is null/undefined, returning false`)
    return false
  }

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
    console.log(`    isConditionMet: Number comparison - compareValue: ${compareValue}, ruleValue: ${ruleValue}`)
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
      conditionMet = compareValue !== ruleValue
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

  console.log(`    isConditionMet: Final result for "${rule.condition}" comparison: ${conditionMet}`)
  return conditionMet
}

// Main Component
const QuestionAnswering: React.FC = () => {
  const navigate = useNavigate()
  const [template, setTemplate] = useState<Template | null>(null)
  const [, setIsLoading] = useState(true)
  const [, setError] = useState<string | null>(null)
  const [currentInspector, setCurrentInspector] = useState<Inspector | null>(null)
  const [templateLoaded, setTemplateLoaded] = useState(false) // Track if template is already loaded

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
          setError('Access Denied: This template is not assigned to you.');
          // Prevent template from loading by setting a flag
          setTemplateLoaded(true);
          return;
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
    // Prevent multiple template loads
    if (templateLoaded) {
      console.log('Template already loaded, skipping fetch')
      return
    }

    const fetchTemplate = async () => {
      console.log('=== STARTING TEMPLATE FETCH ===')
      setIsLoading(true)
      setError(null)

      const templateId = getTemplateIdFromUrl()
      console.log('Template ID from URL:', templateId)

      if (templateId) {
        try {
          // First check if user is inspector and if template is assigned
          const userData = await fetchData('users/current-user/');
          if (userData.user_role === 'inspector') {
            console.log('User is inspector, checking assignments...');
            const assignments = await fetchData('users/my-assignments/');
            const hasAssignment = assignments.some((a: any) => a.template.toString() === templateId);

            if (!hasAssignment) {
              console.log('Inspector does not have assignment for this template');
              setError('Access Denied: This template is not assigned to you.');
              setAssignmentError('You do not have an active assignment for this template. Please contact an admin for assignment.');
              setIsLoading(false);
              setTemplateLoaded(true);
              return;
            }
            console.log('Inspector has valid assignment for this template');
          }

          console.log('Fetching template from API...')
          // First try to fetch with access check (for shared templates)
          let data;
          try {
            console.log('Trying access-check endpoint...')
            data = await fetchData(`users/templates/${templateId}/access-check/`);
            console.log('Access-check successful')
          } catch (error) {
            console.log('Access check failed, trying regular endpoint...')
            data = await fetchData(`users/templates/${templateId}/`);
            console.log('Regular endpoint successful')
          }

          console.log('Raw API response:', data)
          console.log('Number of sections in API response:', data.sections?.length)

          // Check for garment details sections specifically
          const garmentSections = data.sections?.filter((s: any) => s.type === "garmentDetails") || []
          console.log('Garment details sections found:', garmentSections.length)
          garmentSections.forEach((section: any, index: number) => {
            console.log(`Garment section ${index + 1}:`, {
              id: section.id,
              title: section.title,
              type: section.type,
              hasContent: !!section.content,
              contentKeys: section.content ? Object.keys(section.content) : [],
              content: section.content
            })
          })

          // Debug: Log the entire raw data structure
          console.log('=== FULL API RESPONSE DEBUG ===')
          console.log(JSON.stringify(data, null, 2))

          // Validate the API response
          if (!data.sections || !Array.isArray(data.sections)) {
            throw new Error('Invalid template data: sections missing or not an array')
          }

          // Transform the data to match our expected format
          const transformedTemplate: Template = {
            id: data.id.toString(),
            title: data.title,
            description: data.description || "Complete all required fields in this inspection",
            logo: data.logo || "/placeholder.svg?height=80&width=80",
            sections: data.sections.map((section: any, index: number) => {
              console.log(`Processing section ${index + 1}: "${section.title}" (ID: ${section.id})`)

              // Handle garment details section
              if (section.type === "garmentDetails") {
                console.log('Processing garment details section:', section)

                // Ensure garment details section has proper content
                let garmentContent = section.content
                if (!garmentContent) {
                  console.log('No content found for garment section, creating default content')
                  garmentContent = {
                    aqlSettings: {
                      aqlLevel: "2.5" as AQLLevel,
                      inspectionLevel: "II" as InspectionLevel,
                      samplingPlan: "Single" as SamplingPlan,
                      severity: "Normal" as Severity
                    },
                    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                    colors: ['BLUE', 'RED', 'BLACK'],
                    includeCartonOffered: true,
                    includeCartonInspected: true,
                    defaultDefects: ['Stitching', 'Fabric', 'Color', 'Measurement', 'Packing']
                  }
                }

                return {
                  id: section.id.toString(),
                  title: section.title,
                  description: section.description || "",
                  questions: [],
                  type: "garmentDetails" as SectionType,
                  content: garmentContent
                }
              }

              if (!section.questions || !Array.isArray(section.questions)) {
                console.warn(`Section ${section.title} has no questions or invalid questions array`)
                return {
                  id: section.id.toString(),
                  title: section.title,
                  description: section.description || "",
                  questions: [],
                  type: "standard" as SectionType
                }
              }

              return {
                id: section.id.toString(),
                title: section.title,
                description: section.description || "",
                questions: section.questions.map((question: any) => {
                  console.log(`  - Processing question: "${question.text}" with response_type: "${question.response_type}"`)

                  // Transform options from backend format to frontend format
                  let options: string[] = [];
                  if (question.options && Array.isArray(question.options)) {
                    if (question.options.length > 0 && typeof question.options[0] === 'object' && question.options[0] !== null) {
                      // Backend format: array of {id, text, order} objects
                      options = question.options
                        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .map((option: any) => option.text);
                    } else {
                      // Already in frontend format: array of strings
                      options = question.options;
                    }
                  }

                  console.log(`    - Options for "${question.text}":`, options)

                  // Debug logic rules
                  console.log(`    - Logic rules for "${question.text}":`, question.logic_rules)
                  console.log(`    - Raw question object:`, question)
                  console.log(`    - All question keys:`, Object.keys(question))

                  // Check if logic rules exist in different formats
                  if (question.logic_rules) {
                    console.log(`    - Found logic_rules (snake_case):`, question.logic_rules)
                  }
                  if ((question as any).logicRules) {
                    console.log(`    - Found logicRules (camelCase):`, (question as any).logicRules)
                  }

                  // Transform logic rules to ensure consistent format
                  let logicRules: LogicRule[] = []
                  if (question.logic_rules && Array.isArray(question.logic_rules)) {
                    logicRules = question.logic_rules.map((rule: any) => ({
                      id: rule.id,
                      condition: rule.condition,
                      value: rule.value,
                      trigger: rule.trigger,
                      message: rule.message || '',
                      // Handle both camelCase and snake_case for subQuestion
                      subQuestion: rule.subQuestion || rule.sub_question ? {
                        text: (rule.subQuestion || rule.sub_question)?.text || '',
                        responseType: (rule.subQuestion || rule.sub_question)?.responseType ||
                                     (rule.subQuestion || rule.sub_question)?.response_type || 'Text',
                        options: (rule.subQuestion || rule.sub_question)?.options
                      } : undefined
                    }))
                  }

                  const transformedQuestion = {
                    id: question.id.toString(),
                    text: question.text,
                    responseType: mapResponseType(question.response_type),
                    required: question.required || false,
                    flagged: question.flagged || false,
                    options: options,
                    value: question.value || null,
                    logicRules: logicRules,
                    multipleSelection: question.multiple_selection || false,
                    siteOptions: question.site_options || question.siteOptions || undefined
                  }

                  console.log(`    - Transformed question:`, transformedQuestion)
                  console.log(`    - Raw question from backend:`, question)
                  console.log(`    - Logic rules for "${question.text}":`, transformedQuestion.logicRules)
                  console.log(`    - Raw logic_rules field:`, question.logic_rules)
                  console.log(`    - Raw logicRules field:`, (question as any).logicRules)
                  if (transformedQuestion.logicRules && transformedQuestion.logicRules.length > 0) {
                    console.log(`    - ✅ Question "${question.text}" has ${transformedQuestion.logicRules.length} logic rules`)
                    transformedQuestion.logicRules.forEach((rule: LogicRule, index: number) => {
                      console.log(`      Rule ${index + 1}:`, rule)
                    })
                  } else {
                    console.log(`    - ❌ Question "${question.text}" has NO logic rules`)
                  }
                  return transformedQuestion
                })
              }
            })
          }

          console.log('Final transformed template:')
          console.log('- Sections count:', transformedTemplate.sections.length)
          console.log('- Section titles:', transformedTemplate.sections.map(s => s.title))
          console.log('- Section IDs:', transformedTemplate.sections.map(s => s.id))

          setTemplate(transformedTemplate)
          setTemplateLoaded(true) // Mark template as loaded
          console.log('=== TEMPLATE SET SUCCESSFULLY ===')

          // Initialize garment report data if this is a garment template
          const garmentSection = transformedTemplate.sections.find(s => s.type === "garmentDetails")
          if (garmentSection && garmentSection.content && isGarmentDetailsContent(garmentSection.content)) {
            console.log('Initializing garment report data for inspection')
            const garmentContent = garmentSection.content

            // Handle both camelCase and snake_case property names
            const defaultDefects = garmentContent.defaultDefects || (garmentContent as any).default_defects || []
            const aqlSettings = garmentContent.aqlSettings || (garmentContent as any).aql_settings || {
              aqlLevel: "2.5",
              inspectionLevel: "II",
              samplingPlan: "Single",
              severity: "Normal"
            }

            // Initialize defects from template
            const initialDefects = defaultDefects.map((defect: string) => ({
              type: defect,
              remarks: "",
              critical: 0,
              major: 0,
              minor: 0
            }))

            setReportData(prev => ({
              ...prev,
              defects: initialDefects,
              aqlSettings: {
                ...aqlSettings,
                status: "PASS" as const
              }
            }))
          }

          // After loading the template, fetch the inspector info
          await fetchInspectorInfo();
        } catch (error) {
          console.error('Error loading template from API:', error)
          console.log('Falling back to default template...')
          setError('Failed to load template. Using default template.')
          const defaultTemplate = getDefaultTemplate()
          console.log('Default template sections:', defaultTemplate.sections.length)
          setTemplate(defaultTemplate)
          setTemplateLoaded(true) // Mark template as loaded even for default
        }
      } else {
        console.log('No template ID provided, using default template...')
        const defaultTemplate = getDefaultTemplate()
        console.log('Default template sections:', defaultTemplate.sections.length)
        setTemplate(defaultTemplate)
        setTemplateLoaded(true) // Mark template as loaded
      }

      setIsLoading(false)
      console.log('=== TEMPLATE FETCH COMPLETE ===')
    }

    fetchTemplate()
  }, [])

  // Map backend response_type to frontend ResponseType
  const mapResponseType = (type: string): ResponseType => {
    const typeMap: {[key: string]: ResponseType} = {
      // Backend format variations
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
      'date_time': 'Date & Time',

      // Alternative formats that might come from backend
      'Site': 'Site',
      'Inspection date': 'Inspection date',
      'Person': 'Person',
      'Inspection location': 'Inspection location',
      'Text': 'Text',
      'Number': 'Number',
      'Checkbox': 'Checkbox',
      'Yes/No': 'Yes/No',
      'Multiple choice': 'Multiple choice',
      'Slider': 'Slider',
      'Media': 'Media',
      'Annotation': 'Annotation',
      'Date & Time': 'Date & Time',

      // Additional possible variations
      'yes/no': 'Yes/No',
      'yesno': 'Yes/No',
      'multiplechoice': 'Multiple choice',
      'multi_choice': 'Multiple choice',
      'datetime': 'Date & Time',
      'date_and_time': 'Date & Time',
      'signature': 'Annotation',
      'sign': 'Annotation'
    }

    const mappedType = typeMap[type] || typeMap[type.toLowerCase()] || 'Text'
    console.log(`Mapping response type: "${type}" -> "${mappedType}"`)
    return mappedType
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
              {
                id: "rule3",
                condition: "equal to",
                value: 3,
                trigger: "notify",
                message: "Maintenance team has been notified about the fire extinguisher count",
              },
              {
                id: "rule4",
                condition: "equal to",
                value: 4,
                trigger: "take_action",
                message: "Schedule maintenance check for all fire extinguishers",
              },
              {
                id: "rule5",
                condition: "equal to",
                value: 5,
                trigger: "require_evidence",
                message: "Please upload proof of the 5 fire extinguishers",
              },
              {
                id: "rule6",
                condition: "equal to",
                value: 5,
                trigger: "ask_questions",
                message: "Additional question triggered",
                subQuestion: {
                  text: "Please provide additional details about the 5 fire extinguishers",
                  responseType: "Text"
                }
              },
              {
                id: "rule7",
                condition: "greater than",
                value: 6,
                trigger: "ask_questions",
                message: "Multiple choice question triggered",
                subQuestion: {
                  text: "What type of fire extinguishers are they?",
                  responseType: "Multiple choice",
                  options: ["CO2", "Foam", "Water", "Dry Powder"]
                }
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
            text: "Are emergency evacuation routes clearly marked?",
            responseType: "Yes/No",
            required: true,
            flagged: true,
            value: null,
            logicRules: [
              {
                id: "rule8",
                condition: "is",
                value: "No",
                trigger: "ask_questions",
                message: "Additional information required",
                subQuestion: {
                  text: "Please describe what needs to be improved with the evacuation route markings",
                  responseType: "Text"
                }
              },
              {
                id: "rule9",
                condition: "is",
                value: "No",
                trigger: "require_evidence",
                message: "Please upload a photo showing the unclear evacuation routes",
              },
              {
                id: "rule10",
                condition: "is",
                value: "Yes",
                trigger: "display_message",
                message: "Great! Clear evacuation routes are essential for safety",
              },
            ],
          },
          {
            id: "q9",
            text: "Upload a photo of the emergency assembly point",
            responseType: "Media",
            required: true,
            flagged: false,
            value: null,
          },
          {
            id: "q10",
            text: "Inspector signature",
            responseType: "Annotation",
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
            id: "q11",
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
  const [conditionalEvidence, setConditionalEvidence] = useState<Record<string, any>>({})
  const [activeConditionalFields, setActiveConditionalFields] = useState<Record<string, LogicRule[]>>({})
  const [conditionalQuestions, setConditionalQuestions] = useState<Record<string, Question[]>>({})
  const [conditionalAnswers, setConditionalAnswers] = useState<Record<string, any>>({})
  const [, setNotifications] = useState<Record<string, string>>({})
  const [assignment, setAssignment] = useState<any>(null)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)

  // Garment inspection specific state
  const [defectImages, setDefectImages] = useState<Record<number, string[]>>({})

  interface QuantityData {
    orderQty: number | string
    offeredQty: number | string
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
  }

  const [reportData, setReportData] = useState<ReportData>({
    quantities: {},
    cartonOffered: "30",
    cartonInspected: "5",
    cartonToInspect: "5",
    defects: [],
    aqlSettings: {
      aqlLevel: "2.5",
      inspectionLevel: "II",
      samplingPlan: "Single",
      severity: "Normal",
      status: "PASS"
    },
    editingAql: false,
    newSize: "",
    newColor: ""
  })
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)

  // Helper functions for garment details
  const isGarmentDetailsContent = (content: any): content is GarmentDetailsContent => {
    console.log('isGarmentDetailsContent checking:', content)
    if (!content || typeof content !== 'object') {
      console.log('Content is not an object')
      return false
    }

    // Check for required properties - be flexible with the structure
    const hasAqlSettings = 'aqlSettings' in content || 'aql_settings' in content
    const hasSizes = 'sizes' in content && Array.isArray(content.sizes)
    const hasColors = 'colors' in content && Array.isArray(content.colors)

    console.log('hasAqlSettings:', hasAqlSettings)
    console.log('hasSizes:', hasSizes)
    console.log('hasColors:', hasColors)

    return hasAqlSettings && hasSizes && hasColors
  }

  const handleQuantityChange = (color: string, size: string, field: 'orderQty' | 'offeredQty', value: string) => {
    setReportData(prev => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [color]: {
          ...prev.quantities[color],
          [size]: {
            ...prev.quantities[color]?.[size],
            [field]: value
          }
        }
      }
    }))
  }

  const updateDefect = (index: number, field: string, value: any) => {
    setReportData(prev => ({
      ...prev,
      defects: prev.defects.map((defect, i) =>
        i === index ? { ...defect, [field]: value } : defect
      )
    }))
  }

  const addDefect = () => {
    setReportData(prev => ({
      ...prev,
      defects: [...prev.defects, {
        type: "",
        remarks: "",
        critical: 0,
        major: 0,
        minor: 0
      }]
    }))
  }

  const removeDefect = (index: number) => {
    setReportData(prev => ({
      ...prev,
      defects: prev.defects.filter((_, i) => i !== index)
    }))
  }

  const calculateColumnTotal = (size: string, field: 'orderQty' | 'offeredQty'): number => {
    return Object.values(reportData.quantities).reduce((total, colorData) => {
      const qty = colorData[size]?.[field]
      return total + (typeof qty === 'number' ? qty : parseInt(qty as string) || 0)
    }, 0)
  }

  const calculateGrandTotal = (field: 'orderQty' | 'offeredQty'): number => {
    return Object.values(reportData.quantities).reduce((total, colorData) => {
      return total + Object.values(colorData).reduce((colorTotal, sizeData) => {
        const qty = sizeData[field]
        return colorTotal + (typeof qty === 'number' ? qty : parseInt(qty as string) || 0)
      }, 0)
    }, 0)
  }

  const calculateRowTotal = (color: string, field: 'orderQty' | 'offeredQty'): number => {
    const colorData = reportData.quantities[color]
    if (!colorData) return 0
    return Object.values(colorData).reduce((total, sizeData) => {
      const qty = sizeData[field]
      return total + (typeof qty === 'number' ? qty : parseInt(qty as string) || 0)
    }, 0)
  }

  const calculateTotalDefects = (type: 'critical' | 'major' | 'minor'): number => {
    return reportData.defects.reduce((total, defect) => {
      const value = defect[type]
      return total + (typeof value === 'number' ? value : parseInt(value?.toString() || '0', 10) || 0)
    }, 0)
  }

  // Helper functions for garment details editing - matching garment-template.tsx
  const updateGarmentDetails = (sectionId: string, updates: Partial<GarmentDetailsContent>) => {
    if (!template) return

    setTemplate(prev => {
      if (!prev) return prev

      return {
        ...prev,
        sections: prev.sections.map(section => {
          if (section.id === sectionId && section.type === "garmentDetails") {
            // Type assertion to ensure we're working with GarmentDetailsContent
            const currentContent = section.content as GarmentDetailsContent
            return {
              ...section,
              content: {
                ...currentContent,
                ...updates
              } as GarmentDetailsContent
            }
          }
          return section
        })
      }
    })
  }

  const addReportSize = () => {
    if (!reportData.newSize.trim()) return

    const section = template?.sections.find((s) => s.type === "garmentDetails")
    if (!section || !isGarmentDetailsContent(section.content)) return

    if (section.content.sizes.includes(reportData.newSize.trim())) {
      alert("This size already exists")
      return
    }

    const updatedSizes = [...section.content.sizes, reportData.newSize.trim()]
    updateGarmentDetails(section.id, { sizes: updatedSizes })
    setReportData((prev) => ({ ...prev, newSize: "" }))
  }

  const addReportColor = () => {
    if (!reportData.newColor.trim()) return

    const section = template?.sections.find((s) => s.type === "garmentDetails")
    if (!section || !isGarmentDetailsContent(section.content)) return

    if (section.content.colors.includes(reportData.newColor.trim())) {
      alert("This color already exists")
      return
    }

    const updatedColors = [...section.content.colors, reportData.newColor.trim()]
    updateGarmentDetails(section.id, { colors: updatedColors })
    setReportData((prev) => ({ ...prev, newColor: "" }))
  }

  const removeReportSize = (size: string) => {
    const section = template?.sections.find((s) => s.type === "garmentDetails")
    if (!section || !isGarmentDetailsContent(section.content)) return

    // eslint-disable-next-line no-restricted-globals
    if (confirm(`Are you sure you want to remove size "${size}"?`)) {
      const updatedSizes = section.content.sizes.filter(s => s !== size)
      updateGarmentDetails(section.id, { sizes: updatedSizes })

      // Clean up quantities for removed size
      setReportData(prev => ({
        ...prev,
        quantities: Object.fromEntries(
          Object.entries(prev.quantities).map(([color, colorData]) => [
            color,
            Object.fromEntries(
              Object.entries(colorData).filter(([sizeKey]) => sizeKey !== size)
            )
          ])
        )
      }))
    }
  }

  const removeReportColor = (color: string) => {
    const section = template?.sections.find((s) => s.type === "garmentDetails")
    if (!section || !isGarmentDetailsContent(section.content)) return

    // eslint-disable-next-line no-restricted-globals
    if (confirm(`Are you sure you want to remove color "${color}"?`)) {
      const updatedColors = section.content.colors.filter(c => c !== color)
      updateGarmentDetails(section.id, { colors: updatedColors })

      // Clean up quantities for removed color
      setReportData(prev => ({
        ...prev,
        quantities: Object.fromEntries(
          Object.entries(prev.quantities).filter(([colorKey]) => colorKey !== color)
        )
      }))
    }
  }

  const editReportSize = (oldSize: string) => {
    const newSize = prompt("Edit size", oldSize)
    if (newSize && newSize !== oldSize) {
      const section = template?.sections.find((s) => s.type === "garmentDetails")
      if (!section || !isGarmentDetailsContent(section.content)) return

      if (section.content.sizes.includes(newSize)) {
        alert("This size already exists")
        return
      }

      const updatedSizes = section.content.sizes.map((s) => (s === oldSize ? newSize : s))
      updateGarmentDetails(section.id, { sizes: updatedSizes })

      // Update quantities for renamed size
      setReportData(prev => ({
        ...prev,
        quantities: Object.fromEntries(
          Object.entries(prev.quantities).map(([color, colorData]) => [
            color,
            Object.fromEntries(
              Object.entries(colorData).map(([sizeKey, sizeData]) => [
                sizeKey === oldSize ? newSize : sizeKey,
                sizeData
              ])
            )
          ])
        )
      }))
    }
  }

  const editReportColor = (oldColor: string) => {
    const newColor = prompt("Edit color", oldColor)
    if (newColor && newColor !== oldColor) {
      const section = template?.sections.find((s) => s.type === "garmentDetails")
      if (!section || !isGarmentDetailsContent(section.content)) return

      if (section.content.colors.includes(newColor)) {
        alert("This color already exists")
        return
      }

      const updatedColors = section.content.colors.map((c) => (c === oldColor ? newColor : c))
      updateGarmentDetails(section.id, { colors: updatedColors })

      // Update quantities for renamed color
      setReportData(prev => ({
        ...prev,
        quantities: {
          ...Object.fromEntries(
            Object.entries(prev.quantities).filter(([colorKey]) => colorKey !== oldColor)
          ),
          [newColor]: prev.quantities[oldColor] || {}
        }
      }))
    }
  }

  // AQL editing functions
  const toggleAqlEditing = () => {
    setReportData((prev) => ({ ...prev, editingAql: !prev.editingAql }))
  }

  const updateAqlResult = (field: string, value: string) => {
    setReportData((prev) => ({
      ...prev,
      aqlSettings: { ...prev.aqlSettings, [field]: value },
    }))
  }

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

    console.log('=== INSPECTOR UPDATE EFFECT ===')
    console.log('Template sections before inspector update:', template.sections.length)

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
      console.log('Auto-filling inspector field:', inspectorQuestionId, 'with:', currentInspector.name)

      // Only update answers, don't modify the template structure
      setAnswers(prev => ({
        ...prev,
        [inspectorQuestionId as string]: currentInspector.name
      }));

      console.log('Inspector field auto-filled, template sections remain:', template.sections.length);
    }
  }, [currentInspector, template?.id]) // Only depend on inspector and template ID, not the full template

  // Check for triggered messages and conditional fields when answers change
  useEffect(() => {
    console.log('=== CONDITIONAL LOGIC USEEFFECT TRIGGERED ===')
    console.log('Template exists:', !!template)
    console.log('Current answers:', answers)

    if (!template) {
      console.log('No template, returning early')
      return
    }

    console.log('=== CHECKING CONDITIONAL LOGIC ===')
    console.log('Current answers:', answers)

    const messages: Record<string, string> = {}
    const conditionalFields: Record<string, LogicRule[]> = {}
    const dynamicQuestions: Record<string, Question[]> = {}
    const notificationMessages: Record<string, string> = {}

    template.sections.forEach((section) => {
      section.questions.forEach((question) => {
        // Use the current answer for this question
        const currentAnswer = answers[question.id]
        const questionWithAnswer = { ...question, value: currentAnswer }

        console.log(`Checking question "${question.text}" (ID: ${question.id})`)
        console.log(`  - Current answer: ${currentAnswer}`)
        console.log(`  - Logic rules count: ${question.logicRules?.length || 0}`)
        console.log(`  - Logic rules:`, question.logicRules)

        if (question.logicRules && question.logicRules.length > 0) {
          const activeRules: LogicRule[] = []

          for (const rule of question.logicRules) {
            console.log(`  - Checking rule: ${rule.condition} ${rule.value} (trigger: ${rule.trigger})`)
            const conditionMet = isConditionMet(questionWithAnswer, rule)
            console.log(`  - Condition met: ${conditionMet}`)

            if (conditionMet) {
              console.log(`  - ✅ Condition met! Executing trigger: ${rule.trigger}`)
              console.log(`  - Rule details:`, JSON.stringify(rule, null, 2))

              switch (rule.trigger) {
                case "display_message":
                  if (rule.message) {
                    messages[question.id] = `💬 ${rule.message}`
                    console.log(`  - ✅ Display message set: ${rule.message}`)
                    console.log(`  - Messages object now:`, messages)
                  } else {
                    console.log(`  - ❌ Display message rule has no message`)
                  }
                  break

                case "require_evidence":
                  activeRules.push(rule)
                  if (rule.message) {
                    messages[question.id] = `📸 EVIDENCE REQUIRED: ${rule.message}`
                    console.log(`  - ✅ Evidence required: ${rule.message}`)
                  }
                  break

                case "require_action":
                  if (rule.message) {
                    messages[question.id] = `⚠️ ACTION REQUIRED: ${rule.message}`
                    console.log(`  - ✅ Action required: ${rule.message}`)
                    console.log(`  - Messages object now:`, messages)
                  } else {
                    console.log(`  - ❌ Action required rule has no message`)
                  }
                  break

                case "notify":
                  if (rule.message) {
                    notificationMessages[question.id] = rule.message
                    messages[question.id] = `🔔 NOTIFICATION: ${rule.message}`
                    console.log(`  - ✅ Notification set: ${rule.message}`)
                    console.log(`  - Messages object now:`, messages)
                    console.log(`  - Notification messages:`, notificationMessages)
                  } else {
                    console.log(`  - ❌ Notify rule has no message`)
                  }
                  break

                case "ask_questions":
                  // Handle both camelCase and snake_case formats from backend
                  const subQuestion = rule.subQuestion || (rule as any).sub_question
                  if (subQuestion) {
                    console.log(`  - ✅ Creating conditional question: ${subQuestion.text}`)

                    // Handle both responseType and response_type
                    const responseType = subQuestion.responseType || subQuestion.response_type || 'Text'

                    // Create a dynamic question based on the rule
                    const dynamicQuestion: Question = {
                      id: `${question.id}_${rule.id}_conditional`,
                      text: subQuestion.text,
                      responseType: responseType,
                      required: true, // Conditional questions are typically required
                      flagged: false,
                      options: subQuestion.options,
                      value: conditionalAnswers[`${question.id}_${rule.id}_conditional`] || null,
                      logicRules: [] // Conditional questions don't have their own logic rules
                    }

                    if (!dynamicQuestions[question.id]) {
                      dynamicQuestions[question.id] = []
                    }

                    // Check if this dynamic question already exists to avoid duplicates
                    const existingQuestion = dynamicQuestions[question.id].find(q => q.id === dynamicQuestion.id)
                    if (!existingQuestion) {
                      dynamicQuestions[question.id].push(dynamicQuestion)
                      console.log(`  - ✅ Dynamic question added:`, dynamicQuestion)
                    } else {
                      console.log(`  - ℹ️ Dynamic question already exists, updating:`, dynamicQuestion.id)
                      // Update the existing question with current value
                      existingQuestion.value = dynamicQuestion.value
                    }
                    console.log(`  - Dynamic questions object now:`, dynamicQuestions)

                    // Also add a message to indicate the conditional question
                    if (!messages[question.id]) {
                      messages[question.id] = `❓ Additional question required based on your answer`
                    }
                  } else {
                    console.log(`  - ❌ Ask questions rule has no subQuestion or sub_question`)
                    console.log(`  - Rule object:`, rule)
                  }
                  break

                case "take_action":
                  if (rule.message) {
                    messages[question.id] = `🎯 TAKE ACTION: ${rule.message}`
                    console.log(`  - ✅ Take action message set: ${rule.message}`)
                  } else {
                    console.log(`  - ❌ Take action rule has no message`)
                  }
                  break

                default:
                  console.log(`  - ❌ Unknown trigger type: ${rule.trigger}`)
                  break
              }
            } else {
              console.log(`  - ❌ Condition NOT met for trigger: ${rule.trigger}`)
            }
          }

          if (activeRules.length > 0) {
            conditionalFields[question.id] = activeRules
          }
        }
      })
    })

    setActiveMessages(messages)
    setActiveConditionalFields(conditionalFields)
    setConditionalQuestions(dynamicQuestions)
    setNotifications(notificationMessages)

    console.log('=== FINAL RESULTS ===')
    console.log('Active messages:', messages)
    console.log('Active conditional fields:', conditionalFields)
    console.log('Dynamic questions:', dynamicQuestions)
    console.log('Notifications:', notificationMessages)
  }, [answers, conditionalAnswers, template])

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
      <div className="inspection-question-answering-container">
        <div className="inspection-section-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="inspection-loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px', margin: '0 auto 20px' }}></div>
            <p>Loading inspection template...</p>
          </div>
        </div>
      </div>
    )
  }

  const currentSection = template.sections[currentSectionIndex]

  const handleAnswerChange = (questionId: string, value: any) => {
    console.log('=== ANSWER CHANGE ===')
    console.log('Question ID:', questionId, 'New value:', value)
    console.log('Event triggered successfully - selection is working!')

    // Add alert for testing
    if (value === 5 || value === "5") {
      alert(`DEBUG: You entered 5! This should trigger logic rules.`)
    }

    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))

    // Don't update the template structure - just store answers separately
    // This prevents any potential duplication issues from template modifications

    // Clear validation error if value is provided
    if (value !== null && value !== undefined && value !== "") {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }

    console.log('Answer updated, template structure unchanged')
  }

  const handleConditionalAnswerChange = (questionId: string, value: any) => {
    console.log('=== CONDITIONAL ANSWER CHANGE ===')
    console.log('Conditional Question ID:', questionId, 'New value:', value)

    setConditionalAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))

    // Clear validation error if value is provided
    if (value !== null && value !== undefined && value !== "") {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }

    console.log('Conditional answer updated')
  }

  // Helper function to get appropriate CSS class for message type
  const getMessageClassName = (message: string): string => {
    if (message.startsWith('💬')) {
      return 'inspection-display-message'
    } else if (message.startsWith('🔔 NOTIFICATION:')) {
      return 'inspection-notification-message'
    } else if (message.startsWith('📸 EVIDENCE REQUIRED:')) {
      return 'inspection-evidence-message'
    } else if (message.startsWith('⚠️ ACTION REQUIRED:')) {
      return 'inspection-action-message'
    } else if (message.startsWith('🎯 TAKE ACTION:')) {
      return 'inspection-action-message'
    } else if (message.startsWith('❓')) {
      return 'inspection-display-message'
    } else {
      return 'inspection-warning-message'
    }
  }

  // Helper function to get appropriate icon for message type
  const getMessageIcon = (message: string): React.ReactElement => {
    if (message.startsWith('💬')) {
      return <MessageCircle size={16} />
    } else if (message.startsWith('🔔 NOTIFICATION:')) {
      return <Bell size={16} />
    } else if (message.startsWith('📸 EVIDENCE REQUIRED:')) {
      return <Camera size={16} />
    } else if (message.startsWith('⚠️ ACTION REQUIRED:')) {
      return <AlertTriangle size={16} />
    } else if (message.startsWith('🎯 TAKE ACTION:')) {
      return <AlertTriangle size={16} />
    } else if (message.startsWith('❓')) {
      return <HelpCircle size={16} />
    } else {
      return <AlertTriangle size={16} />
    }
  }

  const handleConditionalMediaUpload = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
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

            handleConditionalAnswerChange(questionId, resizedImage)
          } catch (error) {
            console.error("Error processing conditional media file:", error)
          }
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading conditional media:", error)
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

  const handleConditionalEvidenceUpload = async (questionId: string, ruleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
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

            // Store the evidence for this specific rule
            setConditionalEvidence((prev) => ({
              ...prev,
              [`${questionId}_${ruleId}`]: resizedImage
            }))
          } catch (error) {
            console.error("Error processing evidence file:", error)
          }
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading evidence:", error)
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

      // Check if conditional evidence is required for this question
      const conditionalRules = activeConditionalFields[question.id]
      if (conditionalRules && conditionalRules.length > 0) {
        conditionalRules.forEach((rule) => {
          if (rule.trigger === "require_evidence") {
            const evidenceKey = `${question.id}_${rule.id}`
            const evidence = conditionalEvidence[evidenceKey]
            if (!evidence) {
              errors[question.id] = `Evidence is required: ${rule.message || 'Please upload proof'}`
            }
          }
        })
      }

      // Check conditional questions for this question
      const dynamicQuestions = conditionalQuestions[question.id]
      if (dynamicQuestions && dynamicQuestions.length > 0) {
        dynamicQuestions.forEach((conditionalQuestion) => {
          if (conditionalQuestion.required) {
            const value = conditionalAnswers[conditionalQuestion.id]
            if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
              errors[conditionalQuestion.id] = "This conditional field is required"
            }
          }
        })
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

  // Garment-specific calculation functions are defined above

  // Image upload functions for defects
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
    setDefectImages(prev => {
      const currentImages = prev[defectIndex] || []
      const newImages = currentImages.filter((_, i) => i !== imageIndex)

      if (newImages.length === 0) {
        const newState = { ...prev }
        delete newState[defectIndex]
        return newState
      } else {
        return {
          ...prev,
          [defectIndex]: newImages
        }
      }
    })
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

        // Check if conditional evidence is required for this question
        const conditionalRules = activeConditionalFields[question.id]
        if (conditionalRules && conditionalRules.length > 0) {
          conditionalRules.forEach((rule) => {
            if (rule.trigger === "require_evidence") {
              const evidenceKey = `${question.id}_${rule.id}`
              const evidence = conditionalEvidence[evidenceKey]
              if (!evidence) {
                allErrors[question.id] = `Evidence is required: ${rule.message || 'Please upload proof'}`
                hasErrors = true
              }
            }
          })
        }

        // Check conditional questions for this question
        const dynamicQuestions = conditionalQuestions[question.id]
        if (dynamicQuestions && dynamicQuestions.length > 0) {
          dynamicQuestions.forEach((conditionalQuestion) => {
            if (conditionalQuestion.required) {
              const value = conditionalAnswers[conditionalQuestion.id]
              if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
                allErrors[conditionalQuestion.id] = "This conditional field is required"
                hasErrors = true
              }
            }
          })
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
        conditional_answers: conditionalAnswers,
        conditional_evidence: conditionalEvidence,
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

  const renderConditionalResponseInput = (question: Question) => {
    const value = conditionalAnswers[question.id]
    console.log(`Rendering conditional input for question "${question.text}" with responseType: "${question.responseType}"`)

    switch (question.responseType) {
      case "Text":
        return (
          <textarea
            className="inspection-text-input inspection-conditional-input"
            value={value || ""}
            onChange={(e) => handleConditionalAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
          />
        )

      case "Number":
        return (
          <input
            type="number"
            className="inspection-number-input inspection-conditional-input"
            value={value || ""}
            onChange={(e) => handleConditionalAnswerChange(question.id, Number(e.target.value))}
            placeholder="0"
          />
        )

      case "Slider":
        return (
          <div className="inspection-slider-container">
            <input
              type="range"
              className="inspection-slider-input inspection-conditional-input"
              min="0"
              max="100"
              value={value || 0}
              onChange={(e) => handleConditionalAnswerChange(question.id, Number(e.target.value))}
            />
            <div className="inspection-slider-value">{value || 0}</div>
          </div>
        )

      case "Yes/No":
        return (
          <div className="inspection-yes-no-options">
            <button
              className={`inspection-option-button ${value === "Yes" ? "selected" : ""}`}
              onClick={() => handleConditionalAnswerChange(question.id, "Yes")}
            >
              Yes
            </button>
            <button
              className={`inspection-option-button ${value === "No" ? "selected" : ""}`}
              onClick={() => handleConditionalAnswerChange(question.id, "No")}
            >
              No
            </button>
            <button
              className={`inspection-option-button ${value === "N/A" ? "selected" : ""}`}
              onClick={() => handleConditionalAnswerChange(question.id, "N/A")}
            >
              N/A
            </button>
          </div>
        )

      case "Multiple choice":
        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
          return (
            <div className="inspection-multiple-choice-options">
              <div style={{ color: 'red', fontStyle: 'italic' }}>
                No options available for this question
              </div>
            </div>
          )
        }

        return (
          <div className="inspection-multiple-choice-options">
            {question.options.map((option, index) => (
              <label key={index} className="inspection-choice-option">
                <input
                  type={question.multipleSelection ? "checkbox" : "radio"}
                  name={`conditional-question-${question.id}`}
                  checked={
                    question.multipleSelection ? Array.isArray(value) && value.includes(option) : value === option
                  }
                  onChange={() => {
                    if (question.multipleSelection) {
                      const currentValues = Array.isArray(value) ? [...value] : []
                      if (currentValues.includes(option)) {
                        handleConditionalAnswerChange(
                          question.id,
                          currentValues.filter((v) => v !== option),
                        )
                      } else {
                        handleConditionalAnswerChange(question.id, [...currentValues, option])
                      }
                    } else {
                      handleConditionalAnswerChange(question.id, option)
                    }
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case "Media":
        return (
          <div className="inspection-media-upload-container">
            <input
              type="file"
              accept="image/*,video/*"
              id={`conditional-media-${question.id}`}
              onChange={(e) => handleConditionalMediaUpload(question.id, e)}
              className="sr-only"
            />

            {!value ? (
              <label htmlFor={`conditional-media-${question.id}`} className="inspection-media-upload-button">
                <ImageIcon size={20} />
                <span>Upload media</span>
              </label>
            ) : (
              <div className="inspection-media-preview">
                <img src={value || "/placeholder.svg"} alt="Uploaded media" className="inspection-media-image" />
                <button className="inspection-media-remove-button" onClick={() => handleConditionalAnswerChange(question.id, null)}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )

      case "Site":
        const siteOptions = question.siteOptions || ["Main Site", "Secondary Site", "Remote Location", "Headquarters"]
        return (
          <div className="inspection-dropdown-container">
            <select
              value={value || ""}
              onChange={(e) => handleConditionalAnswerChange(question.id, e.target.value)}
              className="inspection-dropdown-input inspection-conditional-input"
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
            <ChevronDown className="inspection-dropdown-icon" />
          </div>
        )

      case "Person":
        const personOptions = ["John Doe", "Jane Smith", "Alex Johnson", "Sam Wilson"]
        return (
          <div className="inspection-dropdown-container">
            <select
              value={value || ""}
              onChange={(e) => handleConditionalAnswerChange(question.id, e.target.value)}
              className="inspection-dropdown-input inspection-conditional-input"
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
            <ChevronDown className="inspection-dropdown-icon" />
          </div>
        )

      case "Inspection location":
        const locationOptions = ["Main Building", "Warehouse", "Office", "Factory Floor", "Parking Lot"]
        return (
          <div className="inspection-dropdown-container">
            <select
              value={value || ""}
              onChange={(e) => handleConditionalAnswerChange(question.id, e.target.value)}
              className="inspection-dropdown-input inspection-conditional-input"
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
            <ChevronDown className="inspection-dropdown-icon" />
          </div>
        )

      case "Inspection date":
        return (
          <input
            type="datetime-local"
            className="inspection-date-time-input inspection-conditional-input"
            value={value || ""}
            onChange={(e) => handleConditionalAnswerChange(question.id, e.target.value)}
          />
        )

      default:
        return <div>Unsupported response type for conditional question: {question.responseType}</div>
    }
  }

  const renderConditionalQuestion = (conditionalQuestion: Question) => {
    const error = validationErrors[conditionalQuestion.id]

    return (
      <div className="inspection-conditional-question-container" key={conditionalQuestion.id}>
        <div className="inspection-conditional-question-header">
          <div className="inspection-conditional-question-text">
            ↳ {conditionalQuestion.text}
            {conditionalQuestion.required && <span className="inspection-required-indicator">*</span>}
            {conditionalQuestion.flagged && <span className="inspection-flagged-indicator">⚑</span>}
          </div>
        </div>

        <div className="inspection-conditional-question-response">
          {renderConditionalResponseInput(conditionalQuestion)}

          {error && (
            <div className="inspection-error-message">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderQuestionResponse = (question: Question) => {
    // We don't need to use value here as it's used in renderResponseInput
    const error = validationErrors[question.id]
    const message = activeMessages[question.id]

    return (
      <div className="inspection-question-container" key={question.id}>
        <div className="inspection-question-header">
          <div className="inspection-question-text">
            {question.text}
            {question.required && <span className="inspection-required-indicator">*</span>}
            {question.flagged && <span className="inspection-flagged-indicator">⚑</span>}
          </div>
        </div>

        <div className="inspection-question-response">
          {renderResponseInput(question)}

          {/* Render conditional evidence upload fields */}
          {activeConditionalFields[question.id] && activeConditionalFields[question.id].map((rule) => {
            if (rule.trigger === "require_evidence") {
              const evidenceKey = `${question.id}_${rule.id}`
              const evidence = conditionalEvidence[evidenceKey]

              return (
                <div key={rule.id} className="inspection-conditional-evidence-container">
                  <div className="inspection-conditional-evidence-label">
                    📸 Evidence Required: {rule.message || 'Please upload proof'}
                  </div>

                  <input
                    type="file"
                    accept="image/*,video/*"
                    id={`evidence-${evidenceKey}`}
                    onChange={(e) => handleConditionalEvidenceUpload(question.id, rule.id, e)}
                    className="sr-only"
                  />

                  {!evidence ? (
                    <label htmlFor={`evidence-${evidenceKey}`} className="inspection-evidence-upload-button">
                      <ImageIcon size={20} />
                      <span>Upload Evidence</span>
                    </label>
                  ) : (
                    <div className="inspection-evidence-preview">
                      <img src={evidence} alt="Evidence" className="inspection-evidence-image" />
                      <button
                        className="inspection-evidence-remove-button"
                        onClick={() => setConditionalEvidence(prev => {
                          const newEvidence = { ...prev }
                          delete newEvidence[evidenceKey]
                          return newEvidence
                        })}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )
            }
            return null
          })}

          {/* Render conditional questions */}
          {conditionalQuestions[question.id] && conditionalQuestions[question.id].map((conditionalQuestion) =>
            renderConditionalQuestion(conditionalQuestion)
          )}

          {error && (
            <div className="inspection-error-message">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className={getMessageClassName(message)}>
              {getMessageIcon(message)}
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderResponseInput = (question: Question) => {
    const value = answers[question.id]
    console.log(`Rendering input for question "${question.text}" with responseType: "${question.responseType}"`)

    switch (question.responseType) {
      case "Text":
        return (
          <textarea
            className="inspection-text-input"
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
          />
        )

      case "Number":
        return (
          <input
            type="number"
            className="inspection-number-input"
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, Number(e.target.value))}
            placeholder="0"
          />
        )

      case "Checkbox":
        return (
          <label className="inspection-checkbox-input">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleAnswerChange(question.id, e.target.checked)}
            />
            <span className="inspection-checkbox-label">Yes</span>
          </label>
        )

      case "Yes/No":
        return (
          <div className="inspection-yes-no-options">
            <button
              className={`inspection-option-button ${value === "Yes" ? "selected" : ""}`}
              onClick={() => {
                console.log('Yes button clicked for question:', question.id)
                handleAnswerChange(question.id, "Yes")
              }}
            >
              Yes
            </button>
            <button
              className={`inspection-option-button ${value === "No" ? "selected" : ""}`}
              onClick={() => {
                console.log('No button clicked for question:', question.id)
                handleAnswerChange(question.id, "No")
              }}
            >
              No
            </button>
            <button
              className={`inspection-option-button ${value === "N/A" ? "selected" : ""}`}
              onClick={() => {
                console.log('N/A button clicked for question:', question.id)
                handleAnswerChange(question.id, "N/A")
              }}
            >
              N/A
            </button>
          </div>
        )

      case "Multiple choice":
        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
          return (
            <div className="inspection-multiple-choice-options">
              <div style={{ color: 'red', fontStyle: 'italic' }}>
                No options available for this question
              </div>
            </div>
          )
        }

        return (
          <div className="inspection-multiple-choice-options">
            {question.options.map((option, index) => (
              <label key={index} className="inspection-choice-option">
                <input
                  type={question.multipleSelection ? "checkbox" : "radio"}
                  name={`question-${question.id}`}
                  checked={
                    question.multipleSelection ? Array.isArray(value) && value.includes(option) : value === option
                  }
                  onChange={() => {
                    console.log('Multiple choice option clicked:', option, 'for question:', question.id)
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
          <div className="inspection-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={value || 50}
              onChange={(e) => handleAnswerChange(question.id, Number(e.target.value))}
              className="inspection-slider-input"
            />
            <div className="inspection-slider-value">{value || 0}</div>
          </div>
        )

      case "Media":
        return (
          <div className="inspection-media-upload-container">
            <input
              type="file"
              accept="image/*,video/*"
              id={`media-${question.id}`}
              onChange={(e) => handleMediaUpload(question.id, e)}
              className="sr-only"
            />

            {!value ? (
              <label htmlFor={`media-${question.id}`} className="inspection-media-upload-button">
                <ImageIcon size={20} />
                <span>Upload media</span>
              </label>
            ) : (
              <div className="inspection-media-preview">
                <img src={value || "/placeholder.svg"} alt="Uploaded media" className="inspection-media-image" />
                <button className="inspection-media-remove-button" onClick={() => handleAnswerChange(question.id, null)}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )

      case "Annotation":
        return (
          <div className="inspection-annotation-container">
            {!value ? (
              <div
                className="inspection-annotation-placeholder"
                onClick={() => {
                  setActiveQuestion(question)
                  setShowSignatureModal(true)
                }}
              >
                <Edit size={20} />
                <span>Tap to sign</span>
              </div>
            ) : (
              <div className="inspection-annotation-preview">
                <img
                  src={value}
                  alt="Signature"
                  className="inspection-annotation-image"
                />
                <button
                  className="inspection-annotation-remove-button"
                  onClick={() => handleAnswerChange(question.id, null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )

      case "Date & Time":
      case "Inspection date":
        return (
          <div className="inspection-date-time-container">
            <input
              type="datetime-local"
              value={value || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="inspection-date-time-input"
            />
          </div>
        )

      case "Site":
        const siteOptions = question.siteOptions || ["Main Site", "Secondary Site", "Remote Location", "Headquarters"]
        return (
          <div className="inspection-dropdown-container">
            <select
              value={value || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="inspection-dropdown-input"
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
            <ChevronDown className="inspection-dropdown-icon" />
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
            <div className="inspection-dropdown-container">
              <select
                value={value || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="inspection-dropdown-input"
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
              <ChevronDown className="inspection-dropdown-icon" />
            </div>
          );
        } else {
          // For other person fields, use default options
          const personOptions = ["John Doe", "Jane Smith", "Alex Johnson", "Sam Wilson"]
          return (
            <div className="inspection-dropdown-container">
              <select
                value={value || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="inspection-dropdown-input"
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
              <ChevronDown className="inspection-dropdown-icon" />
            </div>
          );
        }

      case "Inspection location":
        const locationOptions = ["Main Building", "Warehouse", "Office", "Factory Floor", "Parking Lot"]
        return (
          <div className="inspection-dropdown-container">
            <select
              value={value || ""}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="inspection-dropdown-input"
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
            <ChevronDown className="inspection-dropdown-icon" />
          </div>
        )

      default:
        return <div>Unsupported response type</div>
    }
  }

  // Render garment details section - matching garment-template.tsx report section exactly
  const renderGarmentDetails = (section: Section) => {
    if (!section.content || !isGarmentDetailsContent(section.content)) {
      return <div>Invalid garment details section</div>
    }

    const garmentContent = section.content

    // Handle both camelCase and snake_case property names with defaults
    const sizes = garmentContent.sizes || ['S', 'M', 'L', 'XL', 'XXL']
    const colors = garmentContent.colors || ['BLUE', 'RED', 'BLACK']
    const includeCartonOffered = garmentContent.includeCartonOffered ?? true
    const includeCartonInspected = garmentContent.includeCartonInspected ?? true

    return (
      <>
        <div className="report-section-preview">
          <h4>Garment Details</h4>

          {/* Add/Edit Size and Color Controls - matching garment-template.tsx */}
          <div className="inspection-garment-grid-actions">
            <div className="inspection-grid-action-item">
              <input
                type="text"
                placeholder="Add Size"
                value={reportData.newSize}
                onChange={(e) => setReportData((prev) => ({ ...prev, newSize: e.target.value }))}
                className="inspection-grid-action-input"
              />
              <button className="inspection-grid-action-button" onClick={addReportSize}>
                Add Size
              </button>
            </div>
            <div className="inspection-grid-action-item">
              <input
                type="text"
                placeholder="Add Color"
                value={reportData.newColor}
                onChange={(e) => setReportData((prev) => ({ ...prev, newColor: e.target.value }))}
                className="inspection-grid-action-input"
              />
              <button className="inspection-grid-action-button" onClick={addReportColor}>
                Add Color
              </button>
            </div>
          </div>

          <div className="garment-grid-preview">
            <table className="garment-table-preview">
              <thead>
                <tr>
                  <th>Color</th>
                  {sizes.map((size: string) => (
                    <React.Fragment key={size}>
                      <th colSpan={2} className="size-header">
                        <div className="inspection-size-header-content">
                          <span>{size}</span>
                          <div className="inspection-size-actions">
                            <button
                              className="inspection-size-edit-btn"
                              onClick={() => editReportSize(size)}
                              title={`Edit size ${size}`}
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              className="inspection-size-remove-btn"
                              onClick={() => removeReportSize(size)}
                              title={`Remove size ${size}`}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </th>
                    </React.Fragment>
                  ))}
                  <th colSpan={2} className="size-header">Total</th>
                </tr>
                <tr>
                  <th></th>
                  {sizes.map((size: string) => (
                    <React.Fragment key={size}>
                      <th className="qty-header">Order Qty</th>
                      <th className="qty-header">Offered Qty</th>
                    </React.Fragment>
                  ))}
                  <th className="qty-header">Order Qty</th>
                  <th className="qty-header">Offered Qty</th>
                </tr>
              </thead>
              <tbody>
                {colors.map((color: string) => (
                  <tr key={color}>
                    <td className="color-column">
                      <div className="inspection-color-cell">
                        <span>{color}</span>
                        <div className="inspection-color-actions">
                          <button
                            className="inspection-color-edit-btn"
                            onClick={() => editReportColor(color)}
                            title={`Edit color ${color}`}
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            className="inspection-color-remove-btn"
                            onClick={() => removeReportColor(color)}
                            title={`Remove color ${color}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    {sizes.map((size: string) => (
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
                    ))}
                    <td className="total-cell">{calculateRowTotal(color, "orderQty")}</td>
                    <td className="total-cell">{calculateRowTotal(color, "offeredQty")}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td className="color-column">Total</td>
                  {sizes.map((size: string) => (
                    <React.Fragment key={size}>
                      <td className="total-cell">{calculateColumnTotal(size, "orderQty")}</td>
                      <td className="total-cell">{calculateColumnTotal(size, "offeredQty")}</td>
                    </React.Fragment>
                  ))}
                  <td className="total-cell">{calculateGrandTotal("orderQty")}</td>
                  <td className="total-cell">{calculateGrandTotal("offeredQty")}</td>
                </tr>
              </tbody>
            </table>

            {includeCartonOffered && (
              <div className="carton-info">
                <label>No of Carton Offered:</label>
                <input
                  type="number"
                  className="carton-input"
                  value={reportData.cartonOffered}
                  onChange={(e) => setReportData(prev => ({ ...prev, cartonOffered: e.target.value }))}
                />
              </div>
            )}

            <div className="carton-info">
              <label>No of Carton to Inspect:</label>
              <input
                type="number"
                className="carton-input"
                value={reportData.cartonToInspect}
                onChange={(e) => setReportData(prev => ({ ...prev, cartonToInspect: e.target.value }))}
              />
            </div>

            {includeCartonInspected && (
              <div className="carton-info">
                <label>No of Carton Inspected:</label>
                <input
                  type="number"
                  className="carton-input"
                  value={reportData.cartonInspected}
                  onChange={(e) => setReportData(prev => ({ ...prev, cartonInspected: e.target.value }))}
                />
              </div>
            )}
          </div>
        </div>

        <div className="report-section-preview">
          <h4>Defect Log</h4>

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
                        onClick={() => removeDefect(index)}
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
              <button className="add-defect-button" onClick={addDefect}>
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
        </div>
      </>
    )
  }

  if (isComplete) {
    return (
      <div className="inspection-question-answering-container">
        <div className="inspection-completion-screen">
          <div className="inspection-completion-icon">
            <CheckCircle size={64} />
          </div>
          <h2>Inspection Complete!</h2>
          <p>Thank you for completing this inspection. Your responses have been submitted successfully.</p>
          <p>Redirecting to dashboard...</p>
          <button
            className="inspection-primary-button"
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
      <div className="inspection-question-answering-container">
        <div className="inspection-error-screen">
          <div className="inspection-error-icon">
            <AlertTriangle size={64} />
          </div>
          <h2>Assignment Error</h2>
          <p>{assignmentError}</p>
          <button
            className="inspection-primary-button"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="inspection-question-answering-container">
      <div className="inspection-template-header">
        <div className="inspection-template-logo-container">
          {template.logo && (
            <img src={template.logo || "/placeholder.svg"} alt="Template logo" className="inspection-template-logo" />
          )}
        </div>
        <div className="inspection-template-info">
          <h1 className="inspection-template-title">{template.title}</h1>
          <p className="inspection-template-description">{template.description}</p>
        </div>
      </div>

      <div className="inspection-progress-indicator">
        <div className="inspection-progress-bar">
          <div
            className="inspection-progress-fill"
            style={{ width: `${((currentSectionIndex + 1) / template.sections.length) * 100}%` }}
          ></div>
        </div>
        <div className="inspection-progress-text">
          Section {currentSectionIndex + 1} of {template.sections.length}
        </div>
        {/* Debug info */}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Debug: Template has {template.sections.length} sections, Current: {currentSectionIndex + 1}
        </div>
      </div>

      <div className="inspection-section-container">
        <h2 className="inspection-section-title">
          {currentSection.title}
          <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
            (Section ID: {currentSection.id})
          </span>
        </h2>
        {currentSection.description && <p className="inspection-section-description">{currentSection.description}</p>}

        {/* Render questions for standard sections or garment details for garment sections */}
        {currentSection.type === "garmentDetails" ? (
          <div className="inspection-garment-details-container">
            {renderGarmentDetails(currentSection)}
          </div>
        ) : (
          <div className="inspection-questions-list">
            {currentSection.questions.map((question) => renderQuestionResponse(question))}
          </div>
        )}

        <div className="inspection-navigation-buttons">
          {currentSectionIndex > 0 && (
            <button className="inspection-secondary-button" onClick={goToPreviousSection}>
              <ArrowLeft size={16} />
              Previous
            </button>
          )}

          <button className="inspection-primary-button" onClick={goToNextSection} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inspection-loading-spinner"></span>
            ) : currentSectionIndex < template.sections.length - 1 ? (
              "Next"
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && activeQuestion && (
        <div className="inspection-signature-modal-overlay" onClick={() => setShowSignatureModal(false)}>
          <div className="inspection-signature-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inspection-signature-modal-header">
              <h3>Add Signature</h3>
              <button
                className="inspection-signature-modal-close"
                onClick={() => setShowSignatureModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="inspection-signature-modal-content">
              <div className="inspection-signature-canvas-container">
                <canvas
                  ref={(canvas) => {
                    if (!canvas) return;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    // Set canvas size
                    canvas.width = 400;
                    canvas.height = 200;

                    // Set canvas style
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';

                    let isDrawing = false;
                    let lastX = 0;
                    let lastY = 0;

                    const startDrawing = (e: MouseEvent | TouchEvent) => {
                      isDrawing = true;
                      const rect = canvas.getBoundingClientRect();
                      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                      lastX = clientX - rect.left;
                      lastY = clientY - rect.top;
                    };

                    const draw = (e: MouseEvent | TouchEvent) => {
                      if (!isDrawing) return;
                      e.preventDefault();

                      const rect = canvas.getBoundingClientRect();
                      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                      const currentX = clientX - rect.left;
                      const currentY = clientY - rect.top;

                      ctx.beginPath();
                      ctx.moveTo(lastX, lastY);
                      ctx.lineTo(currentX, currentY);
                      ctx.stroke();

                      lastX = currentX;
                      lastY = currentY;
                    };

                    const stopDrawing = () => {
                      isDrawing = false;
                    };

                    // Mouse events
                    canvas.addEventListener('mousedown', startDrawing);
                    canvas.addEventListener('mousemove', draw);
                    canvas.addEventListener('mouseup', stopDrawing);
                    canvas.addEventListener('mouseout', stopDrawing);

                    // Touch events
                    canvas.addEventListener('touchstart', startDrawing);
                    canvas.addEventListener('touchmove', draw);
                    canvas.addEventListener('touchend', stopDrawing);

                    // Clear function
                    const clearCanvas = () => {
                      ctx.fillStyle = '#ffffff';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                    };

                    // Save function
                    const saveSignature = () => {
                      return canvas.toDataURL('image/png');
                    };

                    // Attach functions to canvas for external access
                    (canvas as any).__clearCanvas = clearCanvas;
                    (canvas as any).__saveSignature = saveSignature;
                  }}
                  className="inspection-signature-canvas"
                />
              </div>
              <div className="inspection-signature-modal-actions">
                <button
                  className="inspection-signature-clear-btn"
                  onClick={(e) => {
                    const canvas = e.currentTarget.closest('.inspection-signature-modal-content')?.querySelector('canvas') as any;
                    if (canvas && canvas.__clearCanvas) {
                      canvas.__clearCanvas();
                    }
                  }}
                >
                  Clear
                </button>
                <button
                  className="inspection-signature-save-btn"
                  onClick={(e) => {
                    const canvas = e.currentTarget.closest('.inspection-signature-modal-content')?.querySelector('canvas') as any;
                    if (canvas && canvas.__saveSignature && activeQuestion) {
                      const signatureData = canvas.__saveSignature();
                      handleAnswerChange(activeQuestion.id, signatureData);
                      setShowSignatureModal(false);
                      setActiveQuestion(null);
                    }
                  }}
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default QuestionAnswering