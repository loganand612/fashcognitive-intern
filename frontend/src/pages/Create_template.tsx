"use client"

import type React from "react"
import { useParams } from "react-router-dom"
import { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./Create_template.css"
import AccessManager from './components/AccessManager'
import TemplateAssignmentManager from './components/TemplateAssignmentManager'
import { fetchCSRFToken } from '../utils/csrf'

import "./components/TemplateBuilderLayout.css"
import "./components/FixTransitions.css"
import "./components/ReportPageFix.css"
import "./components/AccessPageFix.css"
import "./LogicRules.css"
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
  Clock,
  ArrowLeft,
  Bell,
  FileText,
  CheckCircle,
  MessageSquare,
  CornerDownRight,
  ArrowRight,
  Equal,
  Hash,
  CircleEqual,
  CircleSlash,
  CircleDot,
  ChevronsRight,
  ChevronsLeft,
  ListFilter,
  AlertTriangle,
  Upload,
  Download,
  Building,
  Flag,
  ClipboardCheck,
  Save,
} from "lucide-react"
import jsPDF from "jspdf"

// Types
type ResponseType =
  | "Site"
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
    options?: string[]
  }
  tempDisabled?: boolean // Flag to temporarily disable a rule without removing it
}

interface ConditionalLogicRule {
  id: string
  operator: LogicOperator
  value: string | number | string[] | [number, number]
  trigger: TriggerAction
  subQuestion?: {
    id: string
    text: string
    responseType: ResponseType
    required: boolean
    flagged: boolean
    validation?: string
  }
  message?: string
  actionDetails?: string
  targetElementId?: string
}

interface ConditionalLogic {
  enabled: boolean
  rules: ConditionalLogicRule[]
}

interface Question {
  id: string
  text: string
  responseType: ResponseType
  required: boolean
  flagged: boolean
  options?: string[]
  value?: string | string[] | boolean | number | null
  conditionalLogic?: ConditionalLogic
  conditionalProof?: string
  logicRules?: LogicRule[]
  multipleSelection?: boolean
  siteOptions?: string[]  // Custom site names for Site response type
  logicResponses?: {
    ruleId: string
    responseType: string
    responseValue: string | boolean | number | null
    responseText?: string
    responseDate?: string
    responseEvidence?: string
    options?: string[] // Added options for Multiple choice
  }[]
}

interface Section {
  id: string
  title: string
  description?: string
  questions: Question[]
  isCollapsed: boolean
}

interface Template {
  id: string
  title: string
  description: string
  sections: Section[]
  lastSaved?: Date
  lastPublished?: Date
  logo?: string
}

// Utility Functions
const generateId = () => Math.random().toString(36).substring(2, 9)
const generateRuleId = () => `rule_${Math.random().toString(36).substring(2, 9)}`

// Backend utility functions
function getCookie(name: string): string | null {
  let cookieValue = null
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

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

function cleanTemplateForSave(template: Template, isNew: boolean): Partial<Template> {
  return {
    ...(isNew ? {} : { id: template.id }),
    title: template.title,
    description: template.description,
    logo: template.logo,
    sections: template.sections.map((section) => {
      const newSectionId = isNew || typeof section.id === "number" ? generateId() : section.id;

      return {
        id: newSectionId,
        title: section.title,
        description: section.description,
        isCollapsed: section.isCollapsed,
        questions: section.questions.map((q) => {
          const newQuestionId = isNew || typeof q.id === "number" ? generateId() : q.id;

          return {
            id: newQuestionId,
            text: q.text,
            responseType: q.responseType ?? "Text", // ensure fallback
            required: q.required,
            flagged: q.flagged,
            options: q.options,
            value: q.value,
            conditionalLogic: q.conditionalLogic,
            conditionalProof: q.conditionalProof,
            logicRules: q.logicRules,
            multipleSelection: q.multipleSelection,
            siteOptions: q.siteOptions,
          };
        }),
      };
    }),
  };
}

const getDefaultQuestion = (responseType: ResponseType = "Text"): Question => ({
  id: generateId(),
  text: "Type question",
  responseType,
  required: false,
  flagged: false,
  multipleSelection: false,
  options:
    responseType === "Multiple choice"
      ? ["Option 1", "Option 2", "Option 3"]
      : responseType === "Yes/No"
      ? ["Yes", "No", "N/A"]
      : undefined,
  value: null,
  logicRules: [],
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
    description: "The Title Page is the first page of your inspection report. You can edit the title and customize the fields below.",
    questions: [
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
        text: "Conducted on",
        responseType: "Date & Time",
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

const resizeImage = (base64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
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
      icon: <Image className="trigger-icon" />,
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
      console.log('🔧 EnhancedLogicTriggerConfig: display_message trigger with message:', message);
      console.log('🔧 Calling onConfigChange with message:', message);
      onConfigChange({ message })
    } else if (trigger === "require_action") {
      console.log('🔧 EnhancedLogicTriggerConfig: require_action trigger with message:', message);
      console.log('🔧 Calling onConfigChange with message:', message);
      onConfigChange({ message })
    } else if (trigger === "ask_questions") {
      console.log('🔧 EnhancedLogicTriggerConfig: ask_questions trigger');
      onConfigChange({
        subQuestion: {
          text: questionText,
          responseType,
          options: responseType === "Multiple choice" ? options : undefined
        },
      })
    }
  }, [trigger, message, questionText, responseType, options, onConfigChange])

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
          onChange={(e) => {
            const newMessage = e.target.value;
            console.log('💬 Display Message input changed to:', newMessage);
            setMessage(newMessage);

            // Immediately call onConfigChange to save the message
            console.log('💬 Immediately calling onConfigChange with message:', newMessage);
            onConfigChange({ message: newMessage });
          }}
          placeholder="Enter message to display to the user"
          rows={3}
        />
      </div>
    )
  }

  if (trigger === "require_action") {
    return (
      <div className="enhanced-trigger-config">
        <label className="enhanced-trigger-config-label">Action required message:</label>
        <textarea
          className="enhanced-logic-text-input"
          value={message}
          onChange={(e) => {
            const newMessage = e.target.value;
            console.log('💬 Require Action message input changed to:', newMessage);
            setMessage(newMessage);

            // Immediately call onConfigChange to save the message
            console.log('💬 Immediately calling onConfigChange with message:', newMessage);
            onConfigChange({ message: newMessage });
          }}
          placeholder="Enter message describing the required action"
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
            <div className="enhanced-add-option">
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
                Add
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

  // Use useCallback to memoize the onRuleChange call
  const handleRuleChange = useCallback((updatedRule: LogicRule) => {
    onRuleChange(updatedRule)
  }, [onRuleChange])

  useEffect(() => {
    console.log('🔄 EnhancedLogicRuleBuilder: localRule changed, calling handleRuleChange');
    console.log('🔄 localRule:', localRule);
    handleRuleChange(localRule)
  }, [localRule, handleRuleChange])

  useEffect(() => {
    console.log('🔄 EnhancedLogicRuleBuilder: rule prop changed, updating localRule');
    console.log('🔄 New rule prop:', rule);
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
              console.log('🎯 Trigger selected:', trigger);
              console.log('🎯 Current localRule:', localRule);

              // If removing a trigger (trigger is null)
              if (!trigger) {
                console.log('🎯 REMOVING trigger - cleaning up state');

                // Update state immediately without setTimeout to prevent glitches
                setLocalRule(prevRule => {
                  const cleanedRule = {
                    ...prevRule,
                    trigger: null,
                    triggerConfig: undefined,
                    message: undefined,
                    subQuestion: undefined,
                  };
                  console.log('🎯 Cleaned rule:', cleanedRule);
                  return cleanedRule;
                });

                // Hide config panel immediately
                setShowConfig(false);

              } else {
                console.log('🎯 ADDING trigger:', trigger);

                // For adding a trigger, update state immediately
                setLocalRule(prevRule => {
                  const updatedRule = {
                    ...prevRule,
                    trigger,
                    triggerConfig: trigger ? {} : undefined,
                    message: (trigger === "display_message" || trigger === "require_action") ? (prevRule.message || "") : undefined,
                    subQuestion: trigger === "ask_questions" ? (prevRule.subQuestion || { text: "", responseType: "Text" }) : undefined,
                  };
                  console.log('🎯 Updated rule with trigger:', updatedRule);
                  return updatedRule;
                });

                // Show config when a trigger is selected
                setShowConfig(true);
              }
            }}
            onConfigChange={(config) => setLocalRule({ ...localRule, triggerConfig: config })}
          />

        </div>
        <div className={`enhanced-logic-config-panel ${showConfig && localRule.trigger ? "" : "hidden"}`}>
          {showConfig && localRule.trigger && (
            <div className="enhanced-logic-config-row">
              <EnhancedLogicTriggerConfig
                key={`${localRule.id}-${localRule.trigger}`} // Force re-render when trigger changes
                trigger={localRule.trigger}
                config={{
                  message: localRule.message,
                  subQuestion: localRule.subQuestion,
                }}
                onConfigChange={(config) => {
                  console.log('🔧 Parent onConfigChange received config:', config);
                  console.log('🔧 Setting localRule.message to:', config.message);

                  // Only update if the trigger still exists to prevent glitches
                  if (localRule.trigger) {
                    console.log('🔧 Parent onConfigChange: Updating localRule with message:', config.message);

                    const updatedRule = {
                      ...localRule,
                      message: config.message,
                      subQuestion: config.subQuestion,
                    };

                    console.log('🔧 Parent onConfigChange: Updated rule:', updatedRule);
                    setLocalRule(updatedRule);

                    // Force immediate save to parent
                    console.log('🔧 Parent onConfigChange: Force calling onRuleChange');
                    onRuleChange(updatedRule);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
      <button
        className="enhanced-delete-rule-button"
        onClick={(e) => {
          console.log(`🗑️ DELETE BUTTON CLICKED - Event triggered`);
          console.log(`🗑️ Rule ID:`, rule.id);
          e.preventDefault();
          e.stopPropagation();
          onRuleDelete();
        }}
        aria-label="Delete rule"
        style={{
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '8px',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Trash2 className="delete-icon" size={16} />
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
    console.log('🔄 updateRule called with:', updatedRule);
    console.log('🔄 Rule message:', updatedRule.message);
    console.log('🔄 Rule trigger:', updatedRule.trigger);

    const newRules = [...rules]
    newRules[index] = updatedRule

    console.log('🔄 Updated rules array:', newRules);
    onRulesChange(newRules)
  }

  const deleteRule = (index: number) => {
    console.log(`🗑️ DELETE BUTTON CLICKED for index: ${index}`);
    console.log(`🗑️ Current rules:`, rules);

    // Add confirmation dialog to prevent accidental deletions
    const confirmed = window.confirm('Are you sure you want to delete this logic rule?');
    console.log(`🗑️ User confirmed deletion: ${confirmed}`);

    if (confirmed) {
      console.log(`🗑️ BEFORE DELETE: Rules array:`, rules);
      console.log(`🗑️ DELETING: Rule at index ${index}:`, rules[index]);

      // Create new array without the deleted rule
      const newRules = rules.filter((_, i) => i !== index);

      console.log(`🗑️ AFTER DELETE: New rules array:`, newRules);
      console.log(`🗑️ Rules count - Before: ${rules.length}, After: ${newRules.length}`);

      // Force immediate update
      console.log(`🗑️ CALLING onRulesChange with:`, newRules);

      // Use setTimeout to ensure the state update happens after the current render cycle
      setTimeout(() => {
        onRulesChange(newRules);
        console.log(`🗑️ DELETE COMPLETE - onRulesChange called`);
      }, 0);
    } else {
      console.log(`🗑️ DELETE CANCELLED by user`);
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
    <button
      className={`enhanced-add-logic-button ${hasRules ? "has-rules" : ""} ${className}`}
      onClick={(e) => {
        console.log('Enhanced Add Logic Button clicked!');
        console.log('Has rules:', hasRules);
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      style={{
        backgroundColor: hasRules ? '#e0f2fe' : '#f3f4f6',
        border: hasRules ? '2px solid #0288d1' : '1px solid #d1d5db',
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      <span>{hasRules ? "Edit logic" : "Add logic"}</span>
      {hasRules && <span className="rules-badge">!</span>}
    </button>
  )
}

// Enhanced Report Component
const Report: React.FC<{ template: Template }> = ({ template }) => {
  const [activeTab, setActiveTab] = useState("summary")

  // Render logic responses
  const renderLogicResponses = (question: Question) => {
    if (!question.logicResponses || question.logicResponses.length === 0) return null;

    return (
      <div className="report-logic-responses">
        <h4 className="report-logic-responses-title">Additional Information</h4>
        {question.logicResponses.map((response, index) => (
          <div key={index} className="report-logic-response">
            {response.responseType === "Evidence" && (
              <div className="report-logic-evidence">
                <div className="report-logic-response-header">
                  <Upload size={18} className="report-logic-icon" />
                  <span className="report-logic-label">Evidence Provided</span>
                </div>
                {response.responseText && (
                  <div className="report-logic-evidence-description">
                    {response.responseText}
                  </div>
                )}
                {response.responseEvidence && (
                  <div className="report-logic-evidence-image">
                    <img
                      src={response.responseEvidence}
                      alt="Evidence"
                      className="report-media-preview"
                    />
                  </div>
                )}
              </div>
            )}

            {response.responseType === "Action" && (
              <div className="report-logic-action">
                <div className="report-logic-response-header">
                  <FileText size={18} className="report-logic-icon" />
                  <span className="report-logic-label">Action Taken</span>
                </div>
                <div className="report-logic-action-text">
                  {response.responseValue}
                </div>
              </div>
            )}

            {response.responseType === "Yes/No" && (
              <div className="report-logic-followup">
                <div className="report-logic-response-header">
                  <MessageSquare size={18} className="report-logic-icon" />
                  <span className="report-logic-label">Follow-up Response</span>
                </div>
                <div className="report-logic-question">
                  <span>Question:</span> {response.responseText}
                </div>
                <div className="report-logic-answer">
                  <span>Response:</span> {String(response.responseValue)}
                </div>
              </div>
            )}

            {response.responseType === "Multiple choice" && (
              <div className="report-logic-followup">
                <div className="report-logic-response-header">
                  <MessageSquare size={18} className="report-logic-icon" />
                  <span className="report-logic-label">Follow-up Response</span>
                </div>
                <div className="report-logic-question">
                  <span>Question:</span> {response.responseText}
                </div>
                <div className="report-logic-answer">
                  <span>Response:</span> {String(response.responseValue)}
                </div>
                {response.options && response.options.length > 0 && (
                  <div className="report-logic-options">
                    <span>Available options:</span>
                    <div className="report-logic-options-list">
                      {response.options.map((option, idx) => (
                        <div
                          key={idx}
                          className={`report-logic-option ${response.responseValue === option ? 'selected' : ''}`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {response.responseType !== "Evidence" &&
              response.responseType !== "Action" &&
              response.responseType !== "Yes/No" &&
              response.responseType !== "Multiple choice" && (
              <div className="report-logic-followup">
                <div className="report-logic-response-header">
                  <MessageSquare size={18} className="report-logic-icon" />
                  <span className="report-logic-label">Follow-up Response</span>
                </div>
                <div className="report-logic-question">
                  <span>Question:</span> {response.responseText}
                </div>
                <div className="report-logic-answer">
                  <span>Response:</span> {String(response.responseValue)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const generatePDF = async () => {
    try {
      // Show loading indicator
      const loadingIndicator = document.createElement("div")
      loadingIndicator.style.position = "fixed"
      loadingIndicator.style.top = "0"
      loadingIndicator.style.left = "0"
      loadingIndicator.style.width = "100%"
      loadingIndicator.style.height = "100%"
      loadingIndicator.style.backgroundColor = "rgba(255, 255, 255, 0.8)"
      loadingIndicator.style.display = "flex"
      loadingIndicator.style.justifyContent = "center"
      loadingIndicator.style.alignItems = "center"
      loadingIndicator.style.zIndex = "9999"
      loadingIndicator.innerHTML =
        '<div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">Generating PDF...</div>'
      document.body.appendChild(loadingIndicator)

      // Create PDF document with professional layout
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      let yOffset = margin

      // Add header with template title
      doc.setFontSize(24)
      doc.setTextColor(0, 0, 0)
      doc.text(template.title, margin, yOffset + 10)

      // Add date and inspector
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)

      const preparedBy =
        template.sections
          .find((s) => s.questions.some((q) => q.responseType === "Person" && q.value))
          ?.questions.find((q) => q.responseType === "Person" && q.value)?.value || "Inspector"

      const dateText = `${new Date().toLocaleDateString()} / ${preparedBy}`
      doc.text(dateText, margin, yOffset + 20)

      // Add status badge
      const totalQuestions = template.sections.reduce((sum, section) => sum + section.questions.length, 0)
      const answeredQuestions = template.sections.reduce(
        (sum, section) => sum + section.questions.filter((q) => q.value !== null && q.value !== undefined).length,
        0,
      )
      const scorePercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

      const statusText = scorePercentage === 100 ? "Complete" : "Incomplete"
      const statusWidth = (doc.getStringUnitWidth(statusText) * 12) / doc.internal.scaleFactor

      doc.setFillColor(
        scorePercentage === 100 ? 76 : 244,
        scorePercentage === 100 ? 175 : 67,
        scorePercentage === 100 ? 80 : 54,
      )
      doc.roundedRect(pageWidth - margin - statusWidth - 10, yOffset + 5, statusWidth + 10, 8, 4, 4, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.text(statusText, pageWidth - margin - 5, yOffset + 10, { align: "right" })

      yOffset += 30

      // Add horizontal line
      doc.setDrawColor(220, 220, 220)
      doc.line(margin, yOffset, pageWidth - margin, yOffset)
      yOffset += 15

      // Add score section
      doc.setFontSize(14)
      doc.setTextColor(100, 100, 100)
      doc.text("Score", margin, yOffset)
      yOffset += 10

      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text(`${answeredQuestions}/${totalQuestions} (${scorePercentage}%)`, margin, yOffset)
      yOffset += 5

      // Draw score bar
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, yOffset, pageWidth - margin * 2, 5, "F")
      doc.setFillColor(76, 175, 80)
      doc.rect(margin, yOffset, (pageWidth - margin * 2) * (scorePercentage / 100), 5, "F")
      yOffset += 20

      // Add stats section in a grid layout
      const flaggedItems = template.sections.reduce(
        (sum, section) => sum + section.questions.filter((q) => q.flagged).length,
        0,
      )

      const actionItems = template.sections.reduce(
        (sum, section) =>
          sum +
          section.questions.filter(
            (q) => shouldShowTrigger(q, "require_action") || shouldShowTrigger(q, "require_evidence"),
          ).length,
        0,
      )

      // Create a grid for stats
      const statBoxWidth = (pageWidth - margin * 2 - 20) / 3

      // Flagged items box
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text("Flagged items", margin, yOffset + 15)

      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text(flaggedItems.toString(), margin, yOffset + 30)

      // Actions box
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text("Actions", margin + statBoxWidth + 10, yOffset + 15)

      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text(actionItems.toString(), margin + statBoxWidth + 10, yOffset + 30)

      // Status box
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text("Status", margin + statBoxWidth * 2 + 20, yOffset + 15)

      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text("In progress", margin + statBoxWidth * 2 + 20, yOffset + 30)

      yOffset += 50

      // Add horizontal line
      doc.setDrawColor(220, 220, 220)
      doc.line(margin, yOffset, pageWidth - margin, yOffset)
      yOffset += 15

      // Add tabs section
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, yOffset, (pageWidth - margin * 2) / 3, 10, "F")
      doc.setFillColor(255, 255, 255)
      doc.rect(margin + (pageWidth - margin * 2) / 3, yOffset, (pageWidth - margin * 2) / 3, 10, "F")
      doc.setFillColor(240, 240, 240)
      doc.rect(margin + (2 * (pageWidth - margin * 2)) / 3, yOffset, (pageWidth - margin * 2) / 3, 10, "F")

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text("Summary", margin + (pageWidth - margin * 2) / 6, yOffset + 6, { align: "center" })
      doc.setTextColor(100, 100, 100)
      doc.text("Flagged Items", margin + (pageWidth - margin * 2) / 2, yOffset + 6, { align: "center" })
      doc.text("Media", margin + (5 * (pageWidth - margin * 2)) / 6, yOffset + 6, { align: "center" })

      yOffset += 20

      // Add inspection summary
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text("Inspection Summary", margin, yOffset)
      yOffset += 10

      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`This report provides an overview of the safety inspection conducted at ${template.title}.`, margin, yOffset)
      yOffset += 20

      // Process each question with answer
      const processedImages = new Map() // Cache for processed images

      for (const section of template.sections) {
        for (const question of section.questions) {
          if (question.value !== null && question.value !== undefined) {
            // Check if we need a new page
            if (yOffset > pageHeight - 50) {
              doc.addPage()
              yOffset = margin + 20
            }

            // Draw question box
            doc.setFillColor(255, 255, 255)
            doc.rect(margin, yOffset, pageWidth - margin * 2, 40, "F")
            doc.setDrawColor(230, 230, 230)
            doc.rect(margin, yOffset, pageWidth - margin * 2, 40, "S")

            // Add question icon based on response type and value
            if (question.responseType === "Yes/No" || question.responseType === "Checkbox") {
              if (question.value === "Yes" || question.value === true) {
                doc.setFillColor(76, 175, 80) // Green
                doc.circle(margin + 15, yOffset + 15, 5, "F")
              } else {
                doc.setFillColor(244, 67, 54) // Red
                doc.circle(margin + 15, yOffset + 15, 5, "F")
              }
            } else {
              doc.setFillColor(33, 150, 243) // Blue
              doc.circle(margin + 15, yOffset + 15, 5, "F")
            }

            // Add question text
            doc.setFontSize(12)
            doc.setTextColor(0, 0, 0)
            doc.text(question.text, margin + 30, yOffset + 15)

            // Add answer
            doc.setFontSize(11)
            doc.setTextColor(100, 100, 100)
            const answerText =
              question.responseType === "Media" || question.responseType === "Annotation"
                ? "Media uploaded"
                : String(question.value)
            doc.text(answerText, margin + 30, yOffset + 30)

            // Add flag if flagged
            if (question.flagged) {
              doc.setFillColor(244, 67, 54)
              doc.rect(pageWidth - margin - 60, yOffset + 10, 50, 20, "F")
              doc.setTextColor(255, 255, 255)
              doc.text("Flagged", pageWidth - margin - 50, yOffset + 22)
            }

            yOffset += 50

            // Add media if available
            if ((question.responseType === "Media" || question.responseType === "Annotation") && question.value) {
              try {
                // Check if we need a new page for the image
                if (yOffset > pageHeight - 100) {
                  doc.addPage()
                  yOffset = margin + 20
                }

                // Check if we've already processed this image
                const imageValue = question.value as string
                let processedImage

                if (processedImages.has(imageValue)) {
                  processedImage = processedImages.get(imageValue)
                } else {
                  // Process the image to reduce size
                  const img = document.createElement('img')
                  img.crossOrigin = "anonymous"

                  // Create a promise to handle the image loading
                  const imageLoaded = new Promise((resolve, reject) => {
                    img.onload = () => {
                      const canvas = document.createElement("canvas")
                      const MAX_WIDTH = 600
                      const MAX_HEIGHT = 400

                      let width = img.width
                      let height = img.height

                      // Calculate new dimensions while maintaining aspect ratio
                      if (width > height) {
                        if (width > MAX_WIDTH) {
                          height *= MAX_WIDTH / width
                          width = MAX_WIDTH
                        }
                      } else {
                        if (height > MAX_HEIGHT) {
                          width *= MAX_HEIGHT / height
                          height = MAX_HEIGHT
                        }
                      }

                      canvas.width = width
                      canvas.height = height

                      const ctx = canvas.getContext("2d")
                      if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height)
                        // Use lower quality JPEG for smaller file size
                        const optimizedImage = canvas.toDataURL("image/jpeg", 0.5)
                        processedImages.set(imageValue, optimizedImage)
                        resolve(optimizedImage)
                      } else {
                        reject(new Error("Could not get canvas context"))
                      }
                    }
                    img.onerror = () => reject(new Error("Failed to load image"))
                  })

                  img.src = imageValue

                  try {
                    processedImage = await imageLoaded
                  } catch (err) {
                    console.error("Error processing image:", err)
                    processedImage = imageValue // Fall back to original image
                  }
                }

                // Add the image to the PDF
                doc.addImage(processedImage, "JPEG", margin, yOffset, pageWidth - margin * 2, 80, undefined, "FAST")
                yOffset += 90
              } catch (error) {
                console.error("Error adding image to PDF:", error)
                // Add error message instead of image
                doc.setTextColor(244, 67, 54)
                doc.text("Error loading image", margin, yOffset + 10)
                yOffset += 20
              }
            }
          }
        }
      }

      // Add footer to all pages
      const totalPages = (doc as any).internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10)
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" })
      }

      // Save the PDF
      doc.save(`${template.title}_Report.pdf`)

      // Remove loading indicator
      document.body.removeChild(loadingIndicator)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating the PDF. Please try again.")

      // Make sure to remove loading indicator if there's an error
      const loadingIndicator = document.querySelector('[style*="position: fixed"][style*="z-index: 9999"]')
      if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator)
      }
    }
  }

  // Calculate report statistics
  const totalQuestions = template.sections.reduce((sum, section) => sum + section.questions.length, 0)
  const answeredQuestions = template.sections.reduce(
    (sum, section) => sum + section.questions.filter((q) => q.value !== null && q.value !== undefined).length,
    0,
  )
  const scorePercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

  // Count flagged items and actions
  const flaggedItems = template.sections.reduce(
    (sum, section) => sum + section.questions.filter((q) => q.flagged).length,
    0,
  )
  const actionItems = template.sections.reduce(
    (sum, section) =>
      sum +
      section.questions.filter(
        (q) => shouldShowTrigger(q, "require_action") || shouldShowTrigger(q, "require_evidence"),
      ).length,
    0,
  )

  // Get media items
  const mediaItems = template.sections.reduce(
    (items, section) => {
      const sectionMedia = section.questions
        .filter((q) => (q.responseType === "Media" || q.responseType === "Annotation") && q.value)
        .map((q) => ({
          id: q.id,
          caption: q.text,
          thumbnail: q.value as string,
        }))
      return [...items, ...sectionMedia]
    },
    [] as Array<{ id: string; caption: string; thumbnail: string }>,
  )

  return (
    <div className="create-template-report-wrapper">
      <div className="create-template-report-container">
      <div className="create-template-report-header">
        <h2>Report Preview</h2>
        <button className="create-template-generate-pdf-button" onClick={generatePDF}>
          <Download className="create-template-download-icon" />
          Download PDF Report
        </button>
      </div>

      <div className="create-template-report-card">
        <div className="create-template-report-card-header">
          <div className="create-template-report-title-section">
            {template.logo && (
              <div className="create-template-report-logo">
                <img src={template.logo || "/placeholder.svg"} alt="Template logo" />
              </div>
            )}
            <div className="create-template-report-title-info">
              <h3>{template.title}</h3>
              <p className="create-template-report-date">
                {new Date().toLocaleDateString()} /{" "}
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Person" && q.value))
                  ?.questions.find((q) => q.responseType === "Person" && q.value)?.value || "Inspector"}
              </p>
            </div>
          </div>
          <div className={`create-template-report-completion-badge ${scorePercentage === 100 ? "complete" : ""}`}>
            {scorePercentage === 100 ? "Complete" : "Incomplete"}
          </div>
        </div>

        <div className="create-template-report-stats">
          <div className="create-template-report-score-container">
            <p className="create-template-report-stat-label">Score</p>
            <div className="create-template-report-score-bar">
              <div className="create-template-report-score-progress" style={{ width: `${scorePercentage}%` }}></div>
            </div>
            <span className="create-template-report-score-text">
              {answeredQuestions}/{totalQuestions} ({scorePercentage}%)
            </span>
          </div>

          <div className="create-template-report-stat-grid">
            <div className="create-template-report-stat">
              <p className="create-template-report-stat-label">Flagged items</p>
              <div className="create-template-report-stat-value">
                <Flag className="create-template-report-stat-icon flagged" />
                <span>{flaggedItems}</span>
              </div>
            </div>
            <div className="create-template-report-stat">
              <p className="create-template-report-stat-label">Actions</p>
              <div className="create-template-report-stat-value">
                <AlertTriangle className="create-template-report-stat-icon action" />
                <span>{actionItems}</span>
              </div>
            </div>
            <div className="create-template-report-stat">
              <p className="create-template-report-stat-label">Status</p>
              <div className="create-template-report-stat-value">
                <Clock className="create-template-report-stat-icon status" />
                <span>In progress</span>
              </div>
            </div>
          </div>
        </div>

        <div className="create-template-report-site-info">
          <h3 className="create-template-report-section-title">Inspection Details</h3>
          <p className="create-template-report-section-description">Key information about this inspection session.</p>
          <div className="create-template-report-site-info-grid">
            <div className="create-template-report-site-info-item">
              <div className="create-template-report-site-info-label">
                <Building className="create-template-report-site-info-icon" />
                Site conducted
              </div>
              <p className="create-template-report-site-info-value">
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Site" && q.value))
                  ?.questions.find((q) => q.responseType === "Site" && q.value)?.value || "Not specified"}
              </p>
            </div>
            <div className="create-template-report-site-info-item">
              <div className="create-template-report-site-info-label">
                <Calendar className="create-template-report-site-info-icon" />
                Conducted on
              </div>
              <p className="create-template-report-site-info-value">
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Date & Time" && q.value))
                  ?.questions.find((q) => q.responseType === "Date & Time" && q.value)?.value ||
                  new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="create-template-report-site-info-item">
              <div className="create-template-report-site-info-label">
                <User className="create-template-report-site-info-icon" />
                Prepared by
              </div>
              <p className="create-template-report-site-info-value">
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Person" && q.value))
                  ?.questions.find((q) => q.responseType === "Person" && q.value)?.value || "Not specified"}
              </p>
            </div>
            <div className="create-template-report-site-info-item">
              <div className="create-template-report-site-info-label">
                <MapPin className="create-template-report-site-info-icon" />
                Location
              </div>
              <p className="create-template-report-site-info-value">
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Inspection location" && q.value))
                  ?.questions.find((q) => q.responseType === "Inspection location" && q.value)?.value ||
                  "Not specified"}
              </p>
            </div>
            <div className="create-template-report-site-info-item">
              <div className="create-template-report-site-info-label">
                <User className="create-template-report-site-info-icon" />
                Inspector's Name
              </div>
              <p className="create-template-report-site-info-value">
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Person" && q.text === "Inspector's Name" && q.value))
                  ?.questions.find((q) => q.responseType === "Person" && q.text === "Inspector's Name" && q.value)?.value ||
                  template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Person" && q.value))
                  ?.questions.find((q) => q.responseType === "Person" && q.value)?.value ||
                  "Not specified"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="create-template-report-tabs">
        <div className="create-template-report-tab-buttons">
          <button
            className={`create-template-report-tab-button ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
          </button>
          <button
            className={`create-template-report-tab-button ${activeTab === "flagged" ? "active" : ""}`}
            onClick={() => setActiveTab("flagged")}
          >
            Flagged Items
          </button>
          <button
            className={`create-template-report-tab-button ${activeTab === "media" ? "active" : ""}`}
            onClick={() => setActiveTab("media")}
          >
            Media
          </button>
        </div>

        <div className="create-template-report-tab-content">
          {activeTab === "summary" && (
            <div className="report-summary">
              <h3 className="report-section-title">Inspection Summary</h3>
              <p className="report-section-description">
                This report provides an overview of the safety inspection conducted at{" "}
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Site" && q.value))
                  ?.questions.find((q) => q.responseType === "Site" && q.value)?.value || "the site"}
                .
              </p>

              <div className="report-questions-list">
                {template.sections.map((section) =>
                  section.questions
                    .filter((q) => q.value !== null && q.value !== undefined)
                    .map((question) => (
                      <div key={question.id} className={`report-question-item ${question.flagged ? "flagged" : ""}`}>
                        <div className="report-question-header">
                          <div className="report-question-icon">
                            {question.responseType === "Yes/No" || question.responseType === "Checkbox" ? (
                              question.value === "Yes" || question.value === true ? (
                                <Check className="report-question-check" />
                              ) : (
                                <AlertTriangle className="report-question-alert" />
                              )
                            ) : (
                              <FileText className="report-question-info" />
                            )}
                          </div>
                          <div className="report-question-text">
                            <p>{question.text}</p>
                            <div className="report-question-badges">
                              <span
                                className={`report-question-answer ${
                                  question.responseType === "Yes/No" || question.responseType === "Checkbox"
                                    ? question.value === "Yes" || question.value === true
                                      ? "positive"
                                      : "negative"
                                    : "neutral"
                                }`}
                              >
                                {question.responseType === "Media" || question.responseType === "Annotation"
                                  ? "Media uploaded"
                                  : String(question.value)}
                              </span>
                              {question.flagged && (
                                <span className="report-question-flag">
                                  <Flag className="report-flag-icon" />
                                  Flagged
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {(question.responseType === "Media" || question.responseType === "Annotation") &&
                          question.value && (
                            <div className="report-question-media">
                              <img
                                src={(question.value as string) || "/placeholder.svg"}
                                alt={question.text}
                                className="report-media-preview"
                              />
                            </div>
                          )}

                        {/* Display logic responses */}
                        {renderLogicResponses(question)}
                      </div>
                    )),
                )}
              </div>
            </div>
          )}

          {activeTab === "flagged" && (
            <div className="report-flagged">
              <div className="report-flagged-header">
                <h3 className="report-section-title">Flagged Items</h3>
                <span className="report-flagged-count">
                  {flaggedItems} flagged, {actionItems} action
                </span>
              </div>

              <div className="report-questions-list">
                {template.sections.map((section) =>
                  section.questions
                    .filter((q) => q.flagged)
                    .map((question) => (
                      <div key={question.id} className="report-question-item flagged">
                        <div className="report-question-header">
                          <div className="report-question-icon">
                            {question.responseType === "Yes/No" || question.responseType === "Checkbox" ? (
                              question.value === "Yes" || question.value === true ? (
                                <Check className="report-question-check" />
                              ) : (
                                <AlertTriangle className="report-question-alert" />
                              )
                            ) : (
                              <FileText className="report-question-info" />
                            )}
                          </div>
                          <div className="report-question-text">
                            <p>{question.text}</p>
                            <span
                              className={`report-question-answer ${
                                question.responseType === "Yes/No" || question.responseType === "Checkbox"
                                  ? question.value === "Yes" || question.value === true
                                    ? "positive"
                                    : "negative"
                                  : "neutral"
                              }`}
                            >
                              {question.responseType === "Media" || question.responseType === "Annotation"
                                ? "Media uploaded"
                                : String(question.value || "No")}
                            </span>
                          </div>
                        </div>

                        {(question.responseType === "Media" || question.responseType === "Annotation") &&
                          question.value && (
                            <div className="report-question-media">
                              <img
                                src={(question.value as string) || "/placeholder.svg"}
                                alt={question.text}
                                className="report-media-preview"
                              />
                            </div>
                          )}

                        {/* Display logic responses */}
                        {renderLogicResponses(question)}

                        <div className="report-question-action">
                          <div className="report-action-header">
                            <span className="report-action-status">In progress</span>
                            <span className="report-action-assignee">
                              <span className="report-action-label">Assignee</span>
                              Fred Smith
                            </span>
                            <span className="report-action-priority high">
                              <span className="report-action-label">Priority</span>
                              High
                            </span>
                          </div>

                          <div className="report-action-due">
                            <span className="report-action-label">Due</span>
                            {new Date().toLocaleDateString()}
                          </div>

                          <div className="report-action-created">
                            <span className="report-action-label">Created by</span>
                            {template.sections
                              .find((s) => s.questions.some((q) => q.responseType === "Person" && q.value))
                              ?.questions.find((q) => q.responseType === "Person" && q.value)?.value || "Inspector"}
                          </div>

                          <div className="report-action-category">Work Areas / Personal Protective Equipment (PPE)</div>
                          <div className="report-action-description">Make sure the team wear safety hard hats</div>
                        </div>
                      </div>
                    )),
                )}
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="report-media">
              <h3 className="report-section-title">Media Summary</h3>

              <div className="report-media-grid">
                {mediaItems.length > 0 ? (
                  mediaItems.map((media) => (
                    <div key={media.id} className="report-media-item">
                      <div className="report-media-image">
                        <img src={media.thumbnail || "/placeholder.svg"} alt={media.caption} />
                        <div className="report-media-caption">
                          <p>{media.caption}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="report-media-empty">
                    <Image className="report-media-empty-icon" />
                    <p>No media has been added to this report</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="report-footer">
        {/* PDF preview button removed from footer */}
      </div>

      <div className="report-mobile-fab">
        <button className="report-mobile-download" onClick={generatePDF}>
          <Download className="report-mobile-download-icon" />
        </button>
      </div>
    </div>
    </div>
  )
}

// Define supported types for logic
const LOGIC_SUPPORTED_TYPES: ResponseType[] = ["Text", "Number", "Checkbox", "Yes/No", "Multiple choice", "Slider"];

// Main Component
const CreateTemplate: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  // Backend state management
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [templateData, setTemplateData] = useState({
    title: "",
    description: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [accessError, setAccessError] = useState<string | null>(null)

  // Initialize template state
  const [template, setTemplate] = useState<Template>({
    id: generateId(),
    title: "",
    description: "",
    logo: undefined,
    sections: [],
    lastSaved: new Date(),
    lastPublished: new Date(),
  })

  const [activeTab, setActiveTab] = useState<number>(0)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  const [showResponseTypeMenu, setShowResponseTypeMenu] = useState<string | null>(null)
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(true)
  const [showLogicPanel, setShowLogicPanel] = useState<string | null>(null)
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)

  // States for action buttons
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false)
  const [isSubmittingResponse, setIsSubmittingResponse] = useState<boolean>(false)

  // State for storing temporary logic responses
  const [tempLogicResponses, setTempLogicResponses] = useState<{
    questionId: string;
    ruleId: string;
    value: string | number | boolean | null;
  } | null>(null)

  // State for storing action text
  const [actionText, setActionText] = useState<string>("")

  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

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



  // Backend API integration - Load template from server
  useEffect(() => {
    // Only load template if user has access and no access error
    if (currentUser && !accessError) {
      if (id) {
        axios
          .get(`http://localhost:8000/api/users/templates/${id}/`)
          .then((res) => {
            setTemplate(res.data);
            setTemplateData(res.data);
            setActiveSectionId(res.data.sections[0]?.id || null);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error("Failed to load template", err);
            setIsLoading(false);
          });
      } else {
        const newTemplate = getInitialTemplate();
        setTemplate(newTemplate);
        setActiveSectionId(newTemplate.sections[0]?.id || null);
        setIsLoading(false);
      }
    }
  }, [id, currentUser, accessError]);

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
  if (isLoading || !template) {
    return <div>Loading template...</div>
  }

  // Backend API functions
  const handleSave = async () => {
    // Check if template is new: no URL id AND template.id is not a numeric database ID
    const hasNumericId = String(template.id).match(/^\d+$/);
    const isNew = !id && !hasNumericId;
    const templateDbId = hasNumericId ? template.id : id;

    if (!template.title) {
      alert("Please enter a template title");
      return;
    }

    // Validate logic rules for empty messages
    const validationErrors: string[] = [];
    template.sections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        if (question.logicRules && question.logicRules.length > 0) {
          question.logicRules.forEach((rule, ruleIndex) => {
            if (rule.trigger === 'display_message' || rule.trigger === 'require_action') {
              if (!rule.message || rule.message.trim() === '') {
                validationErrors.push(
                  `Section "${section.title}" → Question "${question.text}" → Rule ${ruleIndex + 1}: ` +
                  `${rule.trigger === 'display_message' ? 'Display message' : 'Action required message'} cannot be empty`
                );
              }
            }
          });
        }
      });
    });

    if (validationErrors.length > 0) {
      console.log('🚨 VALIDATION ERRORS FOUND:');
      console.log('🚨 Template state:', JSON.stringify(template, null, 2));
      console.log('🚨 Validation errors:', validationErrors);

      alert(
        "Please fix the following validation errors:\n\n" +
        validationErrors.join('\n\n') +
        "\n\nAll display messages and action required messages must have content."
      );
      return;
    }

    try {
      const csrfToken = await fetchCSRFToken();
      const formData = new FormData();

      // Add title and description
      formData.append("title", template.title);
      formData.append("description", template.description);

      // Add logo if exists
      if (template.logo) {
        if (typeof template.logo === "string" && template.logo.startsWith("data:")) {
          const response = await fetch(template.logo);
          const blob = await response.blob();
          formData.append("logo", blob, "logo.png");
        } else {
          formData.append("logo", template.logo);
        }
      }

      // Add sections (correctly cleaned + snake_cased)
      const cleaned = cleanTemplateForSave(template, isNew);
      console.log('🔧 Cleaned template before snake_case:', JSON.stringify(cleaned, null, 2));
      const snakeCaseSections = toSnakeCase(cleaned.sections);
      console.log('🔧 Snake_case sections being saved:', JSON.stringify(snakeCaseSections, null, 2));
      formData.append("sections", JSON.stringify(snakeCaseSections));

      const url = isNew
        ? "http://localhost:8000/api/users/create_templates/"
        : `http://localhost:8000/api/users/templates/${templateDbId}/`;

      const method = isNew ? "POST" : "PATCH";

      const saveResponse = await fetch(url, {
        method,
        headers: {
          "X-CSRFToken": csrfToken,
        },
        body: formData,
        credentials: "include",
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "Failed to save template");
      }

      // Get the response data to update the template ID
      const responseData = await saveResponse.json();

      // Update the template with the database ID if it's a new template
      if (isNew && responseData.id) {
        setTemplate((prev) => ({
          ...prev,
          id: responseData.id.toString(), // Convert to string to match frontend interface
          lastSaved: new Date(),
        }));
      } else {
        setTemplate((prev) => ({
          ...prev,
          lastSaved: new Date(),
        }));
      }

      alert("Template saved successfully!");
    } catch (error: any) {
      console.error("Error saving template:", error);
      alert(`Failed to save template: ${error.message}`);
    }
  };

  const handlePublishTemplate = async () => {
    // Validate logic rules for empty messages before publishing
    const validationErrors: string[] = [];
    template.sections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        if (question.logicRules && question.logicRules.length > 0) {
          question.logicRules.forEach((rule, ruleIndex) => {
            if (rule.trigger === 'display_message' || rule.trigger === 'require_action') {
              if (!rule.message || rule.message.trim() === '') {
                validationErrors.push(
                  `Section "${section.title}" → Question "${question.text}" → Rule ${ruleIndex + 1}: ` +
                  `${rule.trigger === 'display_message' ? 'Display message' : 'Action required message'} cannot be empty`
                );
              }
            }
          });
        }
      });
    });

    if (validationErrors.length > 0) {
      alert(
        "Cannot publish template with validation errors:\n\n" +
        validationErrors.join('\n\n') +
        "\n\nAll display messages and action required messages must have content."
      );
      return;
    }

    try {
      // 1. First, get a fresh CSRF token
      const csrfToken = await fetchCSRFToken()

      // 2. Prepare the form data
      const formData = new FormData()
      formData.append("title", template.title)
      formData.append("description", template.description)

      // 3. Handle the logo if it exists
      if (template.logo) {
        // If logo is a base64 string, convert to blob
        if (typeof template.logo === "string" && template.logo.startsWith("data:")) {
          const response = await fetch(template.logo)
          const blob = await response.blob()
          formData.append("logo", blob, "logo.png")
        } else {
          formData.append("logo", template.logo)
        }
      }

      // 4. Add sections data
      const hasNumericId = String(template.id).match(/^\d+$/);
      const isNew = !id && !hasNumericId;
      const templateDbId = hasNumericId ? template.id : id;
      const cleanedTemplate = cleanTemplateForSave(template, isNew)
      formData.append("sections", JSON.stringify(cleanedTemplate.sections))

      // 5. Make the API request with the fresh CSRF token
      const url = isNew
        ? "http://localhost:8000/api/users/create_templates/"
        : `http://localhost:8000/api/users/templates/${templateDbId}/`;

      const method = isNew ? "POST" : "PATCH";

      const publishResponse = await fetch(url, {
        method,
        headers: {
          "X-CSRFToken": csrfToken,
        },
        body: formData,
        credentials: "include", // Important: include cookies
      })

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json()
        throw new Error(errorData.error || "Failed to publish template")
      }

      // Get the response data to update the template ID
      const publishResponseData = await publishResponse.json();

      // Success handling - update template with database ID if it's new
      if (isNew && publishResponseData.id) {
        setTemplate((prev) => ({
          ...prev,
          id: publishResponseData.id.toString(), // Convert to string to match frontend interface
          lastSaved: new Date(),
          lastPublished: new Date(),
        }));
      } else {
        setTemplate((prev) => ({
          ...prev,
          lastSaved: new Date(),
          lastPublished: new Date(),
        }));
      }

      console.log("Template published successfully!")
      alert("Template published and saved successfully!")
      navigate("/templates")
    } catch (error: unknown) {
      console.error("Error publishing template:", error)

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          alert("Authentication error. Please log in again.")
          navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`)
        } else {
          alert(`Failed to publish template: ${error.response?.data?.error || error.message}`)
        }
      } else {
        alert("Failed to publish template: Unknown error occurred.")
      }
    }
  }

  // Template Management
  const updateTemplate = (updates: Partial<Template>) => setTemplate((prev) => ({ ...prev, ...updates }))

  const handleBack = () => {
    if (window.confirm("Do you want to save before leaving?")) handleSave()
    navigate("/templates")
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
  const addSection = () => {
    const newSection = getDefaultSection()
    setTemplate((prev) => ({ ...prev, sections: [...prev.sections, newSection] }))
    setActiveSectionId(newSection.id)
    setTimeout(() => sectionRefs.current[newSection.id]?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
  }

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    }))
  }

  const deleteSection = (sectionId: string) => {
    setTemplate((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) }))
  }

  const toggleSectionCollapse = (sectionId: string) => {
    updateSection(sectionId, { isCollapsed: !template.sections.find((s) => s.id === sectionId)?.isCollapsed })
  }

  // Question Management
  const addQuestion = (sectionId: string, responseType: ResponseType = "Text") => {
    const newQuestion = getDefaultQuestion(responseType)
    updateSection(sectionId, {
      questions: [...template.sections.find((s) => s.id === sectionId)!.questions, newQuestion],
    })
    setActiveQuestionId(newQuestion.id)
    // Scroll to the new question after a short delay to allow rendering
    setTimeout(() => {
      questionRefs.current[newQuestion.id]?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
  }

  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<Question>) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)) }
          : s,
      ),
    }))
  }

  const deleteQuestion = (sectionId: string, questionId: string) => {
    updateSection(sectionId, {
      questions: template.sections.find((s) => s.id === sectionId)!.questions.filter((q) => q.id !== questionId),
    })
  }

  const changeQuestionResponseType = (sectionId: string, questionId: string, responseType: ResponseType) => {
    updateQuestion(sectionId, questionId, {
      responseType,
      options:
        responseType === "Multiple choice"
          ? ["Option 1", "Option 2", "Option 3"]
          : responseType === "Yes/No"
          ? ["Yes", "No", "N/A"]
          : undefined,
      value: null,
      // Only keep logic rules if changing to a supported type
      logicRules: LOGIC_SUPPORTED_TYPES.includes(responseType) ?
        template.sections
          .find(s => s.id === sectionId)
          ?.questions.find(q => q.id === questionId)
          ?.logicRules || []
        : [],
    })
    setShowResponseTypeMenu(null)
  }



  // Rendering Helpers
  const renderResponseTypeIcon = (type: ResponseType) => {
    switch (type) {
      case "Site":
        return <MapPin size={18} className="response-type-icon" />
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
        return <Image size={18} className="response-type-icon" />
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

  const renderQuestionResponse = (question: Question, sectionId: string) => {
    switch (question.responseType) {
      case "Text":
        return (
          <div className="response-field text-field">
            <div className="text-input">Text answer</div>
          </div>
        )
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
          </div>
        )
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
                      const newOptions = [...(question.options || [])];
                      newOptions[idx] = e.target.value;
                      updateQuestion(sectionId, question.id, { options: newOptions });
                    }}
                  />
                  <button
                    className="delete-option-button"
                    onClick={() => {
                      const newOptions = [...(question.options || [])];
                      newOptions.splice(idx, 1);
                      updateQuestion(sectionId, question.id, { options: newOptions });
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                className="add-option-button"
                onClick={() => {
                  const newOptions = [...(question.options || []), `Option ${(question.options || []).length + 1}`];
                  updateQuestion(sectionId, question.id, { options: newOptions });
                }}
              >
                <Plus size={14} />
                <span>Add Option</span>
              </button>
            </div>
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
              <Image size={20} />
              <span>Upload media</span>
            </div>
          </div>
        )
      case "Annotation":
        return (
          <div className="response-field annotation-field">
            <div
              className="annotation-area"
              onClick={() => {
                setActiveQuestion(question);
                setShowSignatureModal(true);
              }}
            >
              <Edit size={20} />
              <span>{question.value ? "Edit annotation" : "Add annotation"}</span>
            </div>
          </div>
        )
      case "Date & Time":
        return (
          <div className="response-field date-time-field">
            <div className="date-time-input">
              <Calendar size={16} />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        )
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
        )
      case "Person":
      case "Inspection location":
        return (
          <div className="response-field dropdown-input">
            <div className="dropdown-input">
              <span>Select {question.responseType.toLowerCase()}</span>
              <ChevronDown size={16} />
            </div>
          </div>
        )
      default:
        // Exhaustive type check to ensure all ResponseType values are handled
        const _exhaustiveCheck: never = question.responseType
        console.warn(`Unsupported response type: ${_exhaustiveCheck}`)
        return <div className="response-field">Unsupported response type</div>
    }
  }

  const renderQuestion = (question: Question, sectionId: string, index: number) => {
    const isActive = activeQuestionId === question.id

    return (
      <div
        key={question.id}
        ref={(el) => {
          questionRefs.current[question.id] = el
        }}
        className={`question-item ${isActive ? "active" : ""}`}
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
          {renderQuestionResponse(question, sectionId)}
        </div>
        <div className="question-footer">
          {LOGIC_SUPPORTED_TYPES.includes(question.responseType) && (
            <EnhancedAddLogicButton
              hasRules={question.logicRules?.length ? true : false}
              onClick={() => {
                console.log('Add Logic button clicked for question:', question.id);
                console.log('Current showLogicPanel state:', showLogicPanel);
                console.log('Question response type:', question.responseType);
                console.log('Is response type supported?', LOGIC_SUPPORTED_TYPES.includes(question.responseType));
                console.log('Current logic rules:', question.logicRules);

                // Only show logic panel for supported types
                const newState = showLogicPanel === question.id ? null : question.id;
                console.log('Setting showLogicPanel to:', newState);
                setShowLogicPanel(newState);
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
              onRulesChange={(rules) => {
                console.log('🔄 PARENT onRulesChange called for question:', question.id);
                console.log('🔄 PARENT received rules:', rules);
                console.log('🔄 PARENT current question logicRules before update:', question.logicRules);

                updateQuestion(sectionId, question.id, { logicRules: rules });

                console.log('🔄 PARENT updateQuestion called with rules:', rules);
              }}
              questions={template.sections.flatMap((s) => s.questions.map((q) => ({ id: q.id, text: q.text })))}
              onClose={() => setShowLogicPanel(null)}
            />
          )}
        </div>
      </div>
    )
  }

  const renderSection = (section: Section, index: number) => {
    const isActive = activeSectionId === section.id
    const isTitlePage = index === 0

    return (
      <div
        key={section.id}
        ref={(el) => {
          sectionRefs.current[section.id] = el
        }}
        className={`section-container ${isActive ? "active" : ""}`}
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
            />
            <button className="edit-section-title">
              <Edit size={16} />
            </button>
          </div>
          {!isTitlePage && (
            <div className="section-actions">
              <button
                className="delete-section-button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm("Are you sure you want to delete this section?")) deleteSection(section.id)
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
                {isTitlePage && <p>You can edit the Title Page name above and customize the fields below</p>}
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

  // Render trigger UI components based on the trigger type
  const renderTriggerUI = (question: Question, activeSection: Section) => {
    // Check if any evidence rule conditions are met
    const evidenceRules = question.logicRules?.filter(r =>
      r.trigger === "require_evidence" && !r.tempDisabled
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
                        r.trigger === "require_evidence" && !r.tempDisabled
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
                <Image size={20} />
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
            responseText: subQuestionText,
            options: rule.subQuestion?.options // Include options for Multiple choice
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
                  {(rule.subQuestion?.options || ["Option 1", "Option 2", "Option 3"]).map((option, idx) => (
                    <button
                      key={idx}
                      className={`mobile-choice ${hasResponse && tempLogicResponses?.value === option ? "selected" : ""}`}
                      onClick={() => handleInputChange(option)}
                    >
                      {option}
                    </button>
                  ))}
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
  }

  // Update the renderMobileQuestionResponse function to make it more interactive and realistic
  const renderMobileQuestionResponse = (question: Question, activeSection: Section) => {
    switch (question.responseType) {
      case "Text":
        return (
          <input
            type="text"
            className="mobile-text-input"
            placeholder="Text answer"
            value={(question.value as string) || ""}
            onChange={(e) => updateQuestion(activeSection.id, question.id, { value: e.target.value })}
          />
        )
      case "Number":
        return (
          <input
            type="number"
            className="mobile-number-input"
            placeholder="0"
            value={(question.value as number) || ""}
            onChange={(e) => updateQuestion(activeSection.id, question.id, { value: Number(e.target.value) })}
          />
        )
      case "Checkbox":
        return (
          <div
            className="mobile-checkbox"
            onClick={() => updateQuestion(activeSection.id, question.id, { value: !question.value })}
          >
            <div className={`mobile-checkbox-box ${question.value ? "checked" : ""}`}>
              {question.value && <Check size={16} />}
            </div>
            <span>Check if applicable</span>
          </div>
        )
      case "Yes/No":
        return (
          <div className="mobile-yes-no">
            <button
              className={`mobile-yes ${question.value === "Yes" ? "selected" : ""}`}
              onClick={() => updateQuestion(activeSection.id, question.id, { value: "Yes" })}
            >
              Yes
            </button>
            <button
              className={`mobile-no ${question.value === "No" ? "selected" : ""}`}
              onClick={() => updateQuestion(activeSection.id, question.id, { value: "No" })}
            >
              No
            </button>
            <button
              className={`mobile-na ${question.value === "N/A" ? "selected" : ""}`}
              onClick={() => updateQuestion(activeSection.id, question.id, { value: "N/A" })}
            >
              N/A
            </button>
          </div>
        )
      case "Multiple choice":
        return (
          <div className="mobile-multiple-choice">
            {(question.options || []).map((option, idx) => (
              <button
                key={idx}
                className={`mobile-choice ${question.value === option ? "selected" : ""}`}
                onClick={() => updateQuestion(activeSection.id, question.id, { value: option })}
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
              className="mobile-slider-input"
              value={(question.value as number) || 50}
              onChange={(e) => updateQuestion(activeSection.id, question.id, { value: Number(e.target.value) })}
            />
            <div className="mobile-slider-labels">
              <span>0</span>
              <span>50</span>
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
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      updateQuestion(activeSection.id, question.id, { value: event.target.result as string })
                    }
                  }
                  reader.readAsDataURL(e.target.files[0])
                }
              }}
            />
            {!question.value ? (
              <>
                <Image size={20} />
                <span>Upload media (photo or video)</span>
              </>
            ) : (
              <div className="mobile-media-preview">
                <img
                  src={(question.value as string) || "/placeholder.svg"}
                  alt="Uploaded media"
                  className="mobile-media-image"
                />
                <button
                  className="mobile-media-remove"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    updateQuestion(activeSection.id, question.id, { value: null })
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </label>
        )
      case "Annotation":
        return (
          <div className="create-template-mobile-annotation">
            {!question.value ? (
              <div
                className="create-template-mobile-annotation-placeholder"
                onClick={() => {
                  // Open a modal with signature pad
                  setActiveQuestion(question);
                  setShowSignatureModal(true);
                }}
              >
                <Edit size={20} />
                <span>Tap to sign</span>
              </div>
            ) : (
              <div className="create-template-mobile-annotation-preview">
                <img
                  src={(question.value as string) || "/placeholder.svg"}
                  alt="Signature"
                  className="create-template-mobile-annotation-image"
                />
                <button
                  className="mobile-annotation-remove"
                  onClick={() => updateQuestion(activeSection.id, question.id, { value: null })}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )
      case "Date & Time":
        return (
          <input
            type="datetime-local"
            className="mobile-date-time"
            value={(question.value as string) || new Date().toISOString().slice(0, 16)}
            onChange={(e) => updateQuestion(activeSection.id, question.id, { value: e.target.value })}
          />
        )
      case "Site":
        const siteOptions = question.siteOptions || ["Site 1", "Site 2", "Site 3"]
        return (
          <select
            className="mobile-dropdown-field"
            value={(question.value as string) || ""}
            onChange={(e) => updateQuestion(activeSection.id, question.id, { value: e.target.value })}
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
        )
      case "Person":
        const personOptions = ["John Doe", "Jane Smith", "Alex Johnson", "Sam Wilson"]
        return (
          <select
            className="mobile-dropdown-field"
            value={(question.value as string) || ""}
            onChange={(e) => updateQuestion(activeSection.id, question.id, { value: e.target.value })}
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
        )
      case "Inspection location":
        const locationOptions = ["Main Building", "Warehouse", "Office", "Factory Floor", "Parking Lot"]
        return (
          <select
            className="mobile-dropdown-field"
            value={(question.value as string) || ""}
            onChange={(e) => updateQuestion(activeSection.id, question.id, { value: e.target.value })}
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
        )
      default:
        return <div className="mobile-text-input">Response placeholder</div>
    }
  }

  const renderMobilePreview = () => {
    const activeSection = template.sections.find((s) => s.id === activeSectionId) || template.sections[0]

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

              {activeSection.description && (
                <div className="mobile-section-description">{activeSection.description}</div>
              )}

              <div className="mobile-questions">
                {activeSection.questions.map((question) => (
                  <div key={question.id} className="mobile-question">
                    <div className="mobile-question-text">
                      {question.required && <span className="mobile-required">*</span>}
                      {question.flagged && <span className="mobile-flagged">⚑</span>}
                      {question.text}
                    </div>
                    <div className="mobile-question-response">
                      {renderMobileQuestionResponse(question, activeSection)}
                      {renderTriggerUI(question, activeSection)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mobile-nav-buttons">
              {template.sections.map((section) => (
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

  // Main Render
  return (
    <div className="template-builder">
      <div className="top-navigation">
        <div className="nav-left">
          <div className="company-name">Streamlineer</div>
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={16} />
            <span>back</span>
          </button>
        </div>
        <div className="nav-center">
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 0 ? "active" : ""}`}
              onClick={() => setActiveTab(0)}
            >
              1. Build
            </button>
            <button
              className={`nav-tab ${activeTab === 2 ? "active" : ""}`}
              onClick={() => setActiveTab(2)}
              disabled={activeTab < 2}
            >
              2. Report
            </button>
            <button
              className={`nav-tab ${activeTab === 3 ? "active" : ""}`}
              onClick={() => setActiveTab(3)}
              disabled={activeTab < 3}
            >
              3. Access
            </button>
          </div>
        </div>
        <div className="nav-right">
          <button
            className="debug-button"
            onClick={() => {
              console.log('🔍 CURRENT TEMPLATE STATE:');
              console.log(JSON.stringify(template, null, 2));

              // Check for logic rules with messages
              template.sections.forEach((section, sIndex) => {
                section.questions.forEach((question, qIndex) => {
                  if (question.logicRules && question.logicRules.length > 0) {
                    console.log(`🔍 Section ${sIndex} Question ${qIndex} Logic Rules:`, question.logicRules);
                    question.logicRules.forEach((rule, rIndex) => {
                      if (rule.trigger === 'display_message' || rule.trigger === 'require_action') {
                        console.log(`🔍 Rule ${rIndex} - Trigger: ${rule.trigger}, Message: "${rule.message}"`);
                      }
                    });
                  }
                });
              });
            }}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            🔍 Debug
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={!template.title}
          >
            <Save size={16} />
            Save
          </button>
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
                  <input id="logo-upload" type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
                </div>
                <div className="template-info">
                  <input
                    type="text"
                    className="template-title"
                    value={template.title}
                    onChange={(e) => updateTemplate({ title: e.target.value })}
                    placeholder="Untitled template"
                  />
                  <input
                    type="text"
                    className="template-description"
                    value={template.description}
                    onChange={(e) => updateTemplate({ description: e.target.value })}
                    placeholder="Add a description"
                  />
                </div>
              </div>
              <div className="sections-container">
                {template.sections.map((section, idx) => renderSection(section, idx))}
              </div>
              <div className="add-section-container">
                <div className="add-section-actions">
                  <button className="add-section-button" onClick={addSection}>
                    <Plus size={16} /> Add Section
                  </button>
                  <button className="next-button" onClick={() => setActiveTab(2)}>
                    Next: Report
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {showMobilePreview ? (
              <div className="mobile-preview-container">
                {renderMobilePreview()}
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
        {activeTab === 2 && (
          <div className="report-page-container">
            <div style={{ width: '100%', maxWidth: '1200px' }}>
              <Report template={template} />
            </div>
            <div className="report-footer">
              <button className="next-button" onClick={() => setActiveTab(3)}>
                Next: Access
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
        {activeTab === 3 && (
          <div className="create-template-access-container">
            <div className="create-template-access-header">
              <h1 className="create-template-access-title">Template Access & Settings</h1>
              <p className="create-template-access-description">Configure access permissions and template assignments for this template.</p>
            </div>

            <div className="create-template-access-content">
              <div className="create-template-access-tab">
                <div className="create-template-permissions-section">
                  <h2>
                    <User size={22} className="create-template-section-icon" />
                    User Permissions
                  </h2>
                  <p>Manage who can access, edit, and use this template. Add team members and set appropriate permission levels.</p>

                  <AccessManager
                    templateId={template.id}
                    templateTitle={template.title || "Untitled Template"}
                    initialUsers={[]}
                    onUpdatePermissions={(users) => {
                      console.log("Updated permissions:", users)
                      // Here you would update the template with the new permissions
                      // setTemplate({ ...template, permissions: users });
                    }}
                  />
                </div>
              </div>


            </div>

            <div className="create-template-access-footer">
              <div className="create-template-publish-container">
                <button className="create-template-publish-button" onClick={handlePublishTemplate}>
                  <Upload size={16} />
                  Publish Template
                  <CheckCircle size={16} />
                </button>
                <p className="create-template-publish-note">
                  Once published, this template will be available for inspectors to use. You can still make changes after publishing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {showSignatureModal && activeQuestion && (
        <div className="create-template-signature-modal-overlay" onClick={() => setShowSignatureModal(false)}>
          <div className="create-template-signature-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-template-signature-modal-header">
              <h3>Add Signature</h3>
              <button
                className="create-template-signature-modal-close"
                onClick={() => setShowSignatureModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="create-template-signature-modal-content">
              <div className="create-template-signature-canvas-container">
                <canvas
                  ref={(canvas) => {
                    if (!canvas) return;

                    // Prevent re-initialization
                    if ((canvas as any).__signatureInitialized) return;
                    (canvas as any).__signatureInitialized = true;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    // Set canvas dimensions for mobile-friendly size
                    canvas.width = 280;
                    canvas.height = 140;

                    // Set canvas styles
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = '#000000';

                    // Clear canvas with white background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Drawing state
                    let isDrawing = false;
                    let lastX = 0;
                    let lastY = 0;

                    // Get coordinates from mouse or touch event
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

                    // Start drawing
                    const startDrawing = (e: MouseEvent | TouchEvent) => {
                      isDrawing = true;
                      const coords = getCoordinates(e);
                      lastX = coords.x;
                      lastY = coords.y;

                      if (e instanceof TouchEvent) {
                        e.preventDefault();
                      }
                    };

                    // Draw
                    const draw = (e: MouseEvent | TouchEvent) => {
                      if (!isDrawing) return;

                      const coords = getCoordinates(e);

                      ctx.beginPath();
                      ctx.moveTo(lastX, lastY);
                      ctx.lineTo(coords.x, coords.y);
                      ctx.stroke();

                      lastX = coords.x;
                      lastY = coords.y;

                      if (e instanceof TouchEvent) {
                        e.preventDefault();
                      }
                    };

                    // Stop drawing
                    const stopDrawing = () => {
                      isDrawing = false;
                    };

                    // Add event listeners
                    canvas.addEventListener('mousedown', startDrawing);
                    canvas.addEventListener('mousemove', draw);
                    canvas.addEventListener('mouseup', stopDrawing);
                    canvas.addEventListener('mouseleave', stopDrawing);

                    // Touch events
                    canvas.addEventListener('touchstart', startDrawing, { passive: false });
                    canvas.addEventListener('touchmove', draw, { passive: false });
                    canvas.addEventListener('touchend', stopDrawing);
                    canvas.addEventListener('touchcancel', stopDrawing);

                    // Store canvas reference for clearing
                    (canvas as any).__clearCanvas = () => {
                      ctx.fillStyle = '#ffffff';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                    };

                    // Store canvas reference for saving
                    (canvas as any).__saveSignature = () => {
                      return canvas.toDataURL('image/png');
                    };
                  }}
                  className="create-template-signature-canvas"
                />
                <div className="create-template-signature-instructions">
                  Sign or draw in the area above
                </div>
              </div>
              <div className="create-template-signature-modal-actions">
                <button
                  className="create-template-signature-clear-btn"
                  onClick={(e) => {
                    const canvas = e.currentTarget.closest('.create-template-signature-modal-content')?.querySelector('canvas') as any;
                    if (canvas && canvas.__clearCanvas) {
                      canvas.__clearCanvas();
                    }
                  }}
                >
                  Clear
                </button>
                <button
                  className="create-template-signature-save-btn"
                  onClick={(e) => {
                    const canvas = e.currentTarget.closest('.create-template-signature-modal-content')?.querySelector('canvas') as any;
                    if (canvas && canvas.__saveSignature && activeQuestion) {
                      const signatureData = canvas.__saveSignature();
                      // Find the section containing the active question
                      const section = template.sections.find(s =>
                        s.questions.some(q => q.id === activeQuestion.id)
                      );
                      if (section) {
                        updateQuestion(section.id, activeQuestion.id, { value: signatureData });
                      }
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

export default CreateTemplate
