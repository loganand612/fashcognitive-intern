"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
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
  ImageIcon,
  Trash2,
  Move,
  Clock,
  ArrowLeft,
  Bell,
  FileText,
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
  CheckCircle,
} from "lucide-react"
import { jsPDF } from "jspdf"
import AccessManager from "D:/intern/safety_culture/fashcognitive-intern/frontend/src/pages/components/AccessManager"
import { fetchCSRFToken } from "D:/intern/safety_culture/fashcognitive-intern/frontend/src/utils/csrf"
import "D:/intern/safety_culture/fashcognitive-intern/frontend/src/pages/Create_template.css"
import "D:/intern/safety_culture/fashcognitive-intern/frontend/src/pages/components/TemplateBuilderLayout.css"
import "D:/intern/safety_culture/fashcognitive-intern/frontend/src/pages/components/FixTransitions.css"

// Utility functions
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

// Utility type guard
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v: unknown) => typeof v === "string")

// Helper function to check if a trigger should be shown based on the question's logic rules
const shouldShowTrigger = (question: Question, triggerType: TriggerAction): boolean => {
  if (!question.logicRules || question.logicRules.length === 0 || !question.value) return false

  for (const rule of question.logicRules) {
    if (rule.trigger !== triggerType) continue

    // Evaluate the condition based on the current value
    const value = question.value
    let conditionMet = false

    switch (rule.condition) {
      case "is":
        conditionMet = value === rule.value
        break
      case "is not":
        conditionMet = value !== rule.value
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
        conditionMet = typeof value === "number" && typeof rule.value === "number" && value > rule.value
        break
      case "less than":
        conditionMet = typeof value === "number" && typeof rule.value === "number" && value < rule.value
        break
      case "equal to":
        conditionMet = value === rule.value
        break
      case "not equal to":
        conditionMet = value !== rule.value
        break
      case "greater than or equal to":
        conditionMet = typeof value === "number" && typeof rule.value === "number" && value >= rule.value
        break
      case "less than or equal to":
        conditionMet = typeof value === "number" && typeof rule.value === "number" && value <= rule.value
        break
      case "between":
        conditionMet =
          Array.isArray(rule.value) &&
          rule.value.length === 2 &&
          typeof value === "number" &&
          value > Number(rule.value[0]) &&
          value < Number(rule.value[1])
        break
      case "is one of":
        conditionMet = isStringArray(rule.value) && typeof value === "string" && rule.value.includes(value)
        break
      case "is not one of":
        conditionMet = isStringArray(rule.value) && typeof value === "string" && !rule.value.includes(value)
        break
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
        case "Inspection date":
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
              onTriggerSelect(null)
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

const generateRuleId = () => `rule_${Math.random().toString(36).substring(2, 9)}`

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
              setLocalRule({
                ...localRule,
                trigger,
                triggerConfig: trigger ? {} : undefined,
                message: trigger === "display_message" ? localRule.message || "" : undefined,
                subQuestion:
                  trigger === "ask_questions" ? localRule.subQuestion || { text: "", responseType: "Text" } : undefined,
              })
              setShowConfig(!!trigger)
            }}
            onConfigChange={(config) => setLocalRule({ ...localRule, triggerConfig: config })}
          />
          {localRule.trigger && (
            <button
              className="enhanced-config-button"
              onClick={() => setShowConfig(!showConfig)}
              title="Configure trigger"
            >
              <Edit size={16} />
            </button>
          )}
        </div>
        {showConfig && localRule.trigger && (
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
      <CornerDownRight className="logic-icon" />
      <span>{hasRules ? "Edit logic" : "Add logic"}</span>
      {hasRules && <span className="rules-badge">!</span>}
    </button>
  )
}

// Enhanced Report Component
const Report: React.FC<{ template: Template }> = ({ template }) => {
  const [activeTab, setActiveTab] = useState("summary")

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
      doc.text(
        `This report provides an overview of the safety inspection conducted at ${template.title}.`,
        margin,
        yOffset,
      )
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

            // Add question icon based on value
            if (question.value === "Yes" || question.value === true) {
              doc.setFillColor(76, 175, 80)
              doc.circle(margin + 15, yOffset + 15, 5, "F")
            } else {
              doc.setFillColor(244, 67, 54)
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
                  const img = document.createElement("img")
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
    <div className="report-container">
      <div className="report-header">
        <h2>Report Preview</h2>
        <button className="generate-pdf-button" onClick={generatePDF}>
          <Download className="download-icon" />
          Download PDF Report
        </button>
      </div>

      <div className="report-card">
        <div className="report-card-header">
          <div className="report-title-section">
            {template.logo && (
              <div className="report-logo">
                <img src={template.logo || "/placeholder.svg"} alt="Template logo" />
              </div>
            )}
            <div className="report-title-info">
              <h3>{template.title}</h3>
              <p className="report-date">
                {new Date().toLocaleDateString()} /{" "}
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Person" && q.value))
                  ?.questions.find((q) => q.responseType === "Person" && q.value)?.value || "Inspector"}
              </p>
            </div>
          </div>
          <div className="report-completion-badge">{scorePercentage === 100 ? "Complete" : "Incomplete"}</div>
        </div>

        <div className="report-stats">
          <div className="report-score-container">
            <p className="report-stat-label">Score</p>
            <div className="report-score-bar">
              <div className="report-score-progress" style={{ width: `${scorePercentage}%` }}></div>
            </div>
            <span className="report-score-text">
              {answeredQuestions}/{totalQuestions} ({scorePercentage}%)
            </span>
          </div>

          <div className="report-stat-grid">
            <div className="report-stat">
              <p className="report-stat-label">Flagged items</p>
              <div className="report-stat-value">
                <Flag className="report-stat-icon flagged" />
                <span>{flaggedItems}</span>
              </div>
            </div>
            <div className="report-stat">
              <p className="report-stat-label">Actions</p>
              <div className="report-stat-value">
                <AlertTriangle className="report-stat-icon action" />
                <span>{actionItems}</span>
              </div>
            </div>
            <div className="report-stat">
              <p className="report-stat-label">Status</p>
              <div className="report-stat-value">
                <Clock className="report-stat-icon status" />
                <span>In progress</span>
              </div>
            </div>
          </div>
        </div>

        <div className="report-site-info">
          <div className="report-site-info-grid">
            <div className="report-site-info-item">
              <div className="report-site-info-label">
                <Building className="report-site-info-icon" />
                <p>Site conducted</p>
              </div>
              <p className="report-site-info-value">
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Site" && q.value))
                  ?.questions.find((q) => q.responseType === "Site" && q.value)?.value || "Not specified"}
              </p>
            </div>
            <div className="report-site-info-item">
              <div className="report-site-info-label">
                <Calendar className="report-site-info-icon" />
                <p>Conducted on</p>
              </div>
              <p className="report-site-info-value">
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Inspection date" && q.value))
                  ?.questions.find((q) => q.responseType === "Inspection date" && q.value)?.value ||
                  new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="report-site-info-item">
              <div className="report-site-info-label">
                <User className="report-site-info-icon" />
                <p>Prepared by</p>
              </div>
              <p className="report-site-info-value">
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Person" && q.value))
                  ?.questions.find((q) => q.responseType === "Person" && q.value)?.value || "Not specified"}
              </p>
            </div>
            <div className="report-site-info-item">
              <div className="report-site-info-label">
                <MapPin className="report-site-info-icon" />
                <p>Location</p>
              </div>
              <p className="report-site-info-value">
                {template.sections
                  .find((s) => s.questions.some((q) => q.responseType === "Inspection location" && q.value))
                  ?.questions.find((q) => q.responseType === "Inspection location" && q.value)?.value ||
                  "Not specified"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="report-tabs">
        <div className="report-tab-buttons">
          <button
            className={`report-tab-button ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
          </button>
          <button
            className={`report-tab-button ${activeTab === "flagged" ? "active" : ""}`}
            onClick={() => setActiveTab("flagged")}
          >
            Flagged Items
          </button>
          <button
            className={`report-tab-button ${activeTab === "media" ? "active" : ""}`}
            onClick={() => setActiveTab("media")}
          >
            Media
          </button>
        </div>

        <div className="report-tab-content">
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
                            {question.value === "Yes" || question.value === true ? (
                              <Check className="report-question-check" />
                            ) : (
                              <AlertTriangle className="report-question-alert" />
                            )}
                          </div>
                          <div className="report-question-text">
                            <p>{question.text}</p>
                            <div className="report-question-badges">
                              <span
                                className={`report-question-answer ${question.value === "Yes" || question.value === true ? "positive" : "negative"}`}
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
                            <AlertTriangle className="report-question-alert" />
                          </div>
                          <div className="report-question-text">
                            <p>{question.text}</p>
                            <span className="report-question-answer negative">
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
                    <ImageIcon className="report-media-empty-icon" />
                    <p>No media has been added to this report</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="report-footer">
        <p>Powered by SafetyCulture</p>
        <div className="report-footer-buttons">
          <button className="report-footer-button">
            <FileText className="report-footer-icon" />
            Web preview
          </button>
          <button className="report-footer-button primary" onClick={generatePDF}>
            <Download className="report-footer-icon" />
            PDF preview
          </button>
        </div>
      </div>

      <div className="report-mobile-fab">
        <button className="report-mobile-download" onClick={generatePDF}>
          <Download className="report-mobile-download-icon" />
        </button>
      </div>
    </div>
  )
}

// Main Component
const CreateTemplate = () => {
  const navigate = useNavigate()

  const [templateId, setTemplateId] = useState<string | null>(null)

  const [templateData, setTemplateData] = useState({
    title: "",
    description: "",
  })
  const generateId = () => Math.random().toString(36).substring(2, 9)

  const getDefaultQuestion = (responseType: ResponseType = "Text"): Question => ({
    id: generateId(),
    text: "Type question",
    responseType,
    required: false,
    flagged: false,
    multipleSelection: false,
    options:
      responseType === "Multiple choice" || responseType === "Yes/No"
        ? ["Option 1", "Option 2", "Option 3"]
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
      description: "The Title Page is the first page of your inspection report. Customize it below.",
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
          responseType: "Inspection date",
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
  const [template, setTemplate] = useState<Template>({
    id: generateId(), // Add the required id property
    title: "",
    description: "",
    logo: undefined, // Changed from null to undefined
    sections: [],
    lastSaved: new Date(),
    lastPublished: new Date(),
  })
  const [activeTab, setActiveTab] = useState<number>(0)

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<{ type: "question" | "section"; id: string } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ type: "question" | "section"; id: string } | null>(null)
  const [showResponseTypeMenu, setShowResponseTypeMenu] = useState<string | null>(null)
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(true)
  const [showLogicPanel, setShowLogicPanel] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    // Check if we have a template ID in the URL
    const params = new URLSearchParams(window.location.search)
    const id = params.get("id")

    if (id) {
      setTemplateId(id)
      axios
        .get(`http://localhost:8000/api/users/templates/${id}/`)
        .then((res) => {
          setTemplateData(res.data)
          setTemplate(res.data)
          setIsLoading(false) // ✅ mark as loaded
        })
        .catch((err) => {
          console.error("Failed to load template", err)
          setIsLoading(false) // ✅ even on error, stop loading
        })
    } else {
      // If it's a new template (no id), initialize it
      const newTemplate = getInitialTemplate()
      setTemplate(newTemplate)
      setActiveSectionId(newTemplate.sections[0]?.id || null)
      setIsLoading(false)
    }
  }, [])

  if (isLoading || !template) {
    return <div>Loading template...</div>
  }

  function cleanTemplateForSave(template: Template): Template {
    const { id, ...templateWithoutId } = template
    return {
      ...templateWithoutId,
      id: id, // Keep the template ID
      sections: template.sections.map(({ id: sectionId, ...sectionWithoutId }) => ({
        ...sectionWithoutId,
        id: sectionId, // Add the id back to each section
        questions: sectionWithoutId.questions.map(({ id: questionId, ...questionWithoutId }) => ({
          ...questionWithoutId,
          id: questionId, // Add the id back to each question
        })),
      })),
    }
  }

  // Updated handleSave function with proper CSRF token handling
  const handleSave = async () => {
    if (!templateData.title) {
      alert("Please enter a template title")
      return
    }

    try {
      // 1. First, get a fresh CSRF token
      const csrfToken = await fetchCSRFToken()

      // 2. Prepare the form data
      const formData = new FormData()
      formData.append("title", templateData.title)
      formData.append("description", templateData.description)

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
      formData.append("sections", JSON.stringify(template.sections))

      const cleanedTemplate = cleanTemplateForSave(template)

      // 5. Make the API request with the fresh CSRF token
      const saveResponse = await fetch("http://localhost:8000/api/users/create_templates/", {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        body: formData,
        credentials: "include", // Important: include cookies
      })

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json()
        throw new Error(errorData.error || "Failed to save template")
      }

      // Success handling
      console.log("Template saved successfully!")
      alert("Template saved successfully!")
    } catch (error: unknown) {
      console.error("Error saving template:", error)
      if (error instanceof Error) {
        alert(`Failed to save template: ${error.message}`)
      } else {
        alert("Failed to save template: Unknown error occurred")
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
        responseType === "Multiple choice" || responseType === "Yes/No"
          ? ["Option 1", "Option 2", "Option 3"]
          : undefined,
      value: null,
      logicRules: [],
    })
    setShowResponseTypeMenu(null)
  }

  // Drag and Drop
  const handleDragStart = (type: "question" | "section", id: string) => setDraggedItem({ type, id })
  const handleDragOver = (type: "question" | "section", id: string, e: React.DragEvent) => {
    e.preventDefault()
    if (draggedItem && draggedItem.id !== id) setDropTarget({ type, id })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedItem || !dropTarget) return

    if (draggedItem.type === "section" && dropTarget.type === "section") {
      const sections = [...template.sections]
      const draggedIndex = sections.findIndex((s) => s.id === draggedItem.id)
      const dropIndex = sections.findIndex((s) => s.id === dropTarget.id)
      const [removed] = sections.splice(draggedIndex, 1)
      sections.splice(dropIndex, 0, removed)
      setTemplate((prev) => ({ ...prev, sections }))
    } else if (draggedItem.type === "question" && dropTarget.type === "question") {
      const draggedSection = template.sections.find((s) => s.questions.some((q) => q.id === draggedItem.id))
      const dropSection = template.sections.find((s) => s.questions.some((q) => q.id === dropTarget.id))

      if (draggedSection && dropSection) {
        const newSections = [...template.sections]
        const draggedSectionIndex = newSections.findIndex((s) => s.id === draggedSection.id)
        const draggedQuestionIndex = newSections[draggedSectionIndex].questions.findIndex(
          (q) => q.id === draggedItem.id,
        )
        const dropSectionIndex = newSections.findIndex((s) => s.id === dropSection.id)
        const dropQuestionIndex = newSections[dropSectionIndex].questions.findIndex((q) => q.id === dropTarget.id)
        const [removedQuestion] = newSections[draggedSectionIndex].questions.splice(draggedQuestionIndex, 1)
        newSections[dropSectionIndex].questions.splice(dropQuestionIndex, 0, removedQuestion)
        setTemplate((prev) => ({ ...prev, sections: newSections }))
      }
    }
    setDraggedItem(null)
    setDropTarget(null)
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
                <button key={idx} className={`choice-option choice-${idx % 4}`}>
                  {option}
                </button>
              ))}
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
              <ImageIcon size={20} />
              <span>Upload media</span>
            </div>
          </div>
        )
      case "Annotation":
        return (
          <div className="response-field annotation-field">
            <div className="annotation-area">
              <Edit size={20} />
              <span>Add annotation</span>
            </div>
          </div>
        )
      case "Date & Time":
      case "Inspection date":
        return (
          <div className="response-field date-time-field">
            <div className="date-time-input">
              <Calendar size={16} />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        )
      case "Site":
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
        return <div className="response-field">Unsupported response type</div>
    }
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
        onDragStart={(e) => handleDragStart("question", question.id)}
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
          {renderQuestionResponse(question, sectionId)}
        </div>
        <div className="question-footer">
          <EnhancedAddLogicButton
            hasRules={question.logicRules?.length ? true : false}
            onClick={() => setShowLogicPanel(showLogicPanel === question.id ? null : question.id)}
          />
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
          {showLogicPanel === question.id && (
            <EnhancedLogicRulesContainer
              questionType={question.responseType}
              rules={question.logicRules || []}
              options={question.options || []}
              onRulesChange={(rules) => updateQuestion(sectionId, question.id, { logicRules: rules })}
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
    const isDragging = draggedItem?.type === "section" && draggedItem.id === section.id
    const isDropTarget = dropTarget?.type === "section" && dropTarget.id === section.id
    const isTitlePage = index === 0

    return (
      <div
        key={section.id}
        ref={(el) => {
          sectionRefs.current[section.id] = el
        }}
        className={`section-container ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""} ${isDropTarget ? "drop-target" : ""}`}
        onClick={() => setActiveSectionId(section.id)}
        draggable={!isTitlePage}
        onDragStart={(e) => !isTitlePage && handleDragStart("section", section.id)}
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
                {isTitlePage && <p>customize the Title Page below</p>}
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

  // Updated handlePublishTemplate function with proper CSRF token handling
  const handlePublishTemplate = async () => {
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
      const cleanedTemplate = cleanTemplateForSave(template)
      formData.append("sections", JSON.stringify(cleanedTemplate.sections))

      // 5. Make the API request with the fresh CSRF token
      const publishResponse = await fetch("http://localhost:8000/api/users/create_templates/", {
        method: "POST",
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

      // Success handling
      setTemplate((prev) => ({
        ...prev,
        lastSaved: new Date(),
        lastPublished: new Date(),
      }))

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

  // Render trigger UI components based on the trigger type
  const renderTriggerUI = (question: Question, activeSection: Section) => {
    if (shouldShowTrigger(question, "require_evidence")) {
      return (
        <div className="mobile-trigger-container">
          <div className="mobile-trigger-header">
            <Upload size={16} />
            <span>Evidence Required</span>
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
                      updateQuestion(activeSection.id, question.id, { conditionalProof: event.target.result as string })
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
                    updateQuestion(activeSection.id, question.id, { conditionalProof: undefined })
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

    if (shouldShowTrigger(question, "require_action")) {
      return (
        <div className="mobile-trigger-container">
          <div className="mobile-trigger-header">
            <FileText size={16} />
            <span>Action Required</span>
          </div>
          <div className="mobile-action-form">
            <input type="text" className="mobile-text-input" placeholder="Describe the action taken..." />
            <div className="mobile-action-buttons">
              <button className="mobile-action-button">Submit Action</button>
              <button className="mobile-action-button secondary">Cancel</button>
            </div>
          </div>
        </div>
      )
    }

    if (shouldShowTrigger(question, "notify")) {
      return (
        <div className="mobile-trigger-container">
          <div className="mobile-notification-banner">
            <Bell size={16} />
            <span>Notification has been sent to the relevant team members.</span>
          </div>
        </div>
      )
    }

    if (shouldShowTrigger(question, "display_message")) {
      // Get the message from the rule that triggered this
      const rule = question.logicRules?.find(
        (r) => r.trigger === "display_message"
      )      
      const message = rule?.message || "Important: This response requires immediate attention."

      return (
        <div className="mobile-trigger-container">
          <div className="mobile-message-banner">
            <AlertTriangle size={16} />
            <span>{message}</span>
          </div>
        </div>
      )
    }

    if (shouldShowTrigger(question, "ask_questions")) {
      // Get the subQuestion from the rule that triggered this
      const rule = question.logicRules?.find((r) => r.trigger === "ask_questions")
      const subQuestionText = rule?.subQuestion?.text || "Please provide more details about this issue"
      const responseType = rule?.subQuestion?.responseType || "Text"

      return (
        <div className="mobile-trigger-container">
          <div className="mobile-trigger-header">
            <MessageSquare size={16} />
            <span>Follow-up Questions</span>
          </div>
          <div className="mobile-subquestion">
            <div className="mobile-question-text">
              <span className="mobile-required">*</span>
              {subQuestionText}
            </div>
            <div className="mobile-question-response">
              {responseType === "Text" && (
                <textarea className="mobile-text-input" rows={3} placeholder="Enter details here..."></textarea>
              )}
              {responseType === "Yes/No" && (
                <div className="mobile-yes-no">
                  <button className="mobile-yes">Yes</button>
                  <button className="mobile-no">No</button>
                  <button className="mobile-na">N/A</button>
                </div>
              )}
              {responseType === "Number" && <input type="number" className="mobile-number-input" placeholder="0" />}
              {responseType === "Multiple choice" && (
                <div className="mobile-multiple-choice">
                  <button className="mobile-choice">Option 1</button>
                  <button className="mobile-choice">Option 2</button>
                  <button className="mobile-choice">Option 3</button>
                </div>
              )}
            </div>
          </div>
          <div className="mobile-action-buttons">
            <button className="mobile-action-button">Submit Responses</button>
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
                <ImageIcon size={20} />
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
          <div className="mobile-annotation">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              id={`annotation-${question.id}`}
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
              <label htmlFor={`annotation-${question.id}`} className="mobile-annotation-placeholder">
                <Edit size={20} />
                <span>Add annotation</span>
              </label>
            ) : (
              <div className="mobile-annotation-preview">
                <img
                  src={(question.value as string) || "/placeholder.svg"}
                  alt="Annotation"
                  className="mobile-annotation-image"
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
      case "Inspection date":
        return (
          <input
            type="datetime-local"
            className="mobile-date-time"
            value={(question.value as string) || new Date().toISOString().slice(0, 16)}
            onChange={(e) => updateQuestion(activeSection.id, question.id, { value: e.target.value })}
          />
        )
      case "Site":
        const siteOptions = ["Main Site", "Secondary Site", "Remote Location", "Headquarters"]
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

    // Add null check for template
    if (!template) {
      return <div className="mobile-preview">Loading...</div>
    }

    const activeSection = template.sections?.find((s) => s.id === activeSectionId) || template.sections?.[0]

    if (!activeSection) {
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
              <div className="mobile-content">
                <div className="mobile-template-title">{template.title || "Untitled Template"}</div>
                <div className="mobile-page-indicator">No pages added yet.</div>
              </div>
            </div>
          </div>
        </div>
      )
    }

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
        <div className="nav-right"></div>
      </div>

      <div className="builder-content">
        {activeTab === 0 && (
          <div className="template-builder-container">
            <div className="template-content">
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
            <div className="mobile-preview-container">{renderMobilePreview()}</div>
          </div>
        )}
        {activeTab === 2 && (
          <div className="report-page-container">
            <div style={{ width: "100%", maxWidth: "1200px" }}>
              {!isLoading && template?.title && <Report template={template} />}
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
          <div className="access-page-container">
            <div className="access-tab">
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
            <div className="access-footer">
              <button className="publish-button" onClick={handlePublishTemplate}>
                <Upload className="publish-icon" />
                Publish Template
                <CheckCircle size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateTemplate
