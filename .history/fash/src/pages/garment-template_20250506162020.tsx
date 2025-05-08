"use client"

import React, { useState, useRef } from "react"
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
  CheckCircle,
  Settings,
  Ruler,
  Box,
  List,
  Shirt,
  FileText,
} from "lucide-react"
import "./garment-template.css"
import type { ReactElement } from 'react';

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
}

interface QuantityData {
  orderQty: string
  offeredQty: string
}

type QuantityMap = {
  [color: string]: {
    [size: string]: QuantityData
  }
}

interface ReportData {
  quantities: QuantityMap
  cartonOffered: string
  cartonInspected: string
  cartonToInspect: string
  defects: {
    type: string
    remarks: string
    major: number | string
    minor: number | string
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

// Constants
const AQL_LEVELS: AQLLevel[] = ["1.0", "1.5", "2.5", "4.0", "6.5"]
const INSPECTION_LEVELS: InspectionLevel[] = ["I", "II", "III", "S1", "S2", "S3", "S4"]
const SAMPLING_PLANS: SamplingPlan[] = ["Single", "Double", "Multiple"]
const SEVERITIES: Severity[] = ["Normal", "Tightened", "Reduced"]
const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"]
const DEFAULT_COLORS = ["BLUE", "RED", "BLACK"]
const DEFAULT_DEFECTS = ["Stitching", "Fabric", "Color", "Measurement", "Packing"]

// Utility Functions
const generateId = () => Math.random().toString(36).substring(2, 9)
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

// Add a type guard function to check if content is GarmentDetailsContent
const isGarmentDetailsContent = (content: StandardSectionContent | GarmentDetailsContent): content is GarmentDetailsContent => {
  return (content as GarmentDetailsContent).aqlSettings !== undefined;
}

// Add a helper function to safely get garment details content
const getGarmentDetailsContent = (sections: AppSection[]): GarmentDetailsContent | undefined => {
  const section = sections.find((s) => s.type === "garmentDetails");
  return section && isGarmentDetailsContent(section.content) ? section.content : undefined;
}

const getInitialReportData = (template: Template): ReportData => {
  const garmentContent = getGarmentDetailsContent(template.sections);
  
  return {
    quantities: {},
    cartonOffered: "30",
    cartonInspected: "5",
    cartonToInspect: "5",
    defects: garmentContent?.defaultDefects.map((defect) => ({
      type: defect,
      remarks: "",
      major: 0,
      minor: 0,
    })) || [],
    aqlSettings: {
      aqlLevel: garmentContent?.aqlSettings.aqlLevel || "2.5",
      inspectionLevel: garmentContent?.aqlSettings.inspectionLevel || "II",
      samplingPlan: garmentContent?.aqlSettings.samplingPlan || "Single",
      severity: garmentContent?.aqlSettings.severity || "Normal",
      status: "PASS"
    },
    editingAql: false,
    newSize: "",
    newColor: "",
    questionAnswers: {},
  };
}

// Props interface for the component
interface GarmentTemplateProps {}

// Add proper return type for the component
const Garment_Template: React.FC<GarmentTemplateProps> = (): ReactElement => {
  const [template, setTemplate] = useState<Template>(getInitialTemplate())
  const [activeTab, setActiveTab] = useState(0)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(template.sections[0]?.id || null)
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<{ type: "question" | "section"; id: string } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ type: "question" | "section"; id: string } | null>(null)
  const [showResponseTypeMenu, setShowResponseTypeMenu] = useState<string | null>(null)
  const [showMobilePreview, setShowMobilePreview] = useState(true)
  const [newSize, setNewSize] = useState("")
  const [newColor, setNewColor] = useState("")
  const [newDefect, setNewDefect] = useState("")
  const [reportData, setReportData] = useState<ReportData>(() => getInitialReportData(template))

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
  const handleDragStart = (type: "question" | "section", id: string): void => {
    // Don't allow dragging the Title Page or Garment Details section
    if (type === "section") {
      const section = template.sections.find((s) => s.id === id)
      if (section?.title === "Title Page" || section?.type === "garmentDetails") {
        return
      }
    }

    setDraggedItem({ type, id })
  }

  const handleDragOver = (type: "question" | "section", id: string, e: React.DragEvent<HTMLDivElement>): void => {
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
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
  const handleQuantityChange = (color: string, size: string, field: keyof QuantityData, value: string): void => {
    setReportData((prev) => {
      const newQuantities = { ...prev.quantities }
      if (!newQuantities[color]) newQuantities[color] = {}
      if (!newQuantities[color][size]) newQuantities[color][size] = { orderQty: "", offeredQty: "" }
      newQuantities[color][size][field] = value
      return { ...prev, quantities: newQuantities }
    })
  }

  const calculateRowTotal = (color: string, field: keyof QuantityData): number => {
    const garmentContent = getGarmentDetailsContent(template.sections)
    const sizes = garmentContent?.sizes || []
    let total = 0
    sizes.forEach((size) => {
      const qty = reportData.quantities[color]?.[size]?.[field]
      total += qty ? Number.parseInt(qty, 10) : 0
    })
    return total
  }

  const calculateColumnTotal = (size: string, field: keyof QuantityData): number => {
    const garmentContent = getGarmentDetailsContent(template.sections)
    const colors = garmentContent?.colors || []
    let total = 0
    colors.forEach((color) => {
      const qty = reportData.quantities[color]?.[size]?.[field]
      total += qty ? Number.parseInt(qty, 10) : 0
    })
    return total
  }

  const calculateGrandTotal = (field: keyof QuantityData): number => {
    const garmentContent = getGarmentDetailsContent(template.sections)
    const colors = garmentContent?.colors || []
    let total = 0
    colors.forEach((color) => {
      total += calculateRowTotal(color, field)
    })
    return total
  }

  const addReportDefect = () => {
    setReportData((prev) => ({
      ...prev,
      defects: [...prev.defects, { type: "", remarks: "", major: 0, minor: 0 }],
    }))
  }

  const updateDefect = (index: number, field: string, value: string | number) => {
    setReportData((prev) => {
      const newDefects = [...prev.defects]
      newDefects[index] = { ...newDefects[index], [field]: value }
      return { ...prev, defects: newDefects }
    })
  }

  const calculateTotalDefects = (field: "major" | "minor"): number => {
    return reportData.defects.reduce((total, defect) => {
      const value = Number.parseInt(String(defect[field]), 10)
      return total + (isNaN(value) ? 0 : value)
    }, 0)
  }

  const addReportSize = () => {
    if (!reportData.newSize.trim()) return

    const section = template.sections.find((s) => s.type === "garmentDetails")
    if (!section) return

    const updatedSizes = [...(section.content as GarmentDetailsContent).sizes, reportData.newSize.trim()]
    updateGarmentDetails(section.id, { sizes: updatedSizes })
    setReportData((prev) => ({ ...prev, newSize: "" }))
  }

  const addReportColor = () => {
    if (!reportData.newColor.trim()) return

    const section = template.sections.find((s) => s.type === "garmentDetails")
    if (!section) return

    const updatedColors = [...(section.content as GarmentDetailsContent).colors, reportData.newColor.trim()]
    updateGarmentDetails(section.id, { colors: updatedColors })
    setReportData((prev) => ({ ...prev, newColor: "" }))
  }

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

  const exportAsPdf = () => {
    if (reportRef.current) {
      window.print()
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
        return <div className="response-field">Unsupported response type</div>
    }
  }

  const renderQuestion = (question: Question, sectionId: string, index: number): ReactElement => {
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

  const renderGarmentDetailsSection = (section: AppSection): ReactElement | null => {
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
              {garmentContent.sizes.map((size: string) => (
                <li key={size} className="garment-item">
                  <span>{size}</span>
                  <button
                    className="garment-item-remove"
                    onClick={() => removeSize(section.id, size)}
                    aria-label={`Remove size ${size}`}
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
                placeholder="New Size"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSize(section.id)}
              />
              <button className="garment-add-button" onClick={() => addSize(section.id)}>
                Add
              </button>
            </div>
          </div>

          <div className="garment-config-group">
            <label className="garment-label">Colors</label>
            <ul className="garment-item-list">
              {garmentContent.colors.map((color: string) => (
                <li key={color} className="garment-item">
                  <span>{color}</span>
                  <button
                    className="garment-item-remove"
                    onClick={() => removeColor(section.id, color)}
                    aria-label={`Remove color ${color}`}
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
                placeholder="New Color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addColor(section.id)}
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
              {garmentContent.defaultDefects.map((defect: string) => (
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
                onKeyPress={(e) => e.key === "Enter" && addDefect(section.id)}
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

  const renderSection = (section: AppSection, index: number): React.ReactElement => {
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
        onDragStart={(e) => isDraggable && handleDragStart("section", section.id)}
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

  const renderReportQuestionResponse = (question: Question) => {
    const value =
      reportData.questionAnswers[question.id] !== undefined ? reportData.questionAnswers[question.id] : question.value

    switch (question.responseType) {
      case "Text":
        return (
          <div className="report-response-field">
            <input
              type="text"
              className="report-text-input"
              value={(value as string) || ""}
              onChange={(e) => updateQuestionAnswer(question.id, e.target.value)}
              placeholder="Enter answer"
            />
          </div>
        )
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
        )
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
        )
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
        )
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
        )
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
        )
      case "Media":
        return (
          <div className="report-response-field">
            <div className="report-media-upload">
              <ImageIcon size={20} />
              <span>Upload media</span>
            </div>
          </div>
        )
      case "Annotation":
        return (
          <div className="report-response-field">
            <div className="report-annotation-area">
              <Edit size={20} />
              <span>Add annotation</span>
            </div>
          </div>
        )
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
        )
      case "Site":
      case "Person":
      case "Inspection location":
        return (
          <div className="report-response-field">
            <input
              type="text"
              className="report-text-input"
              value={(value as string) || ""}
              onChange={(e) => updateQuestionAnswer(question.id, e.target.value)}
              placeholder={`Enter ${question.responseType.toLowerCase()}`}
            />
          </div>
        )
      default:
        return <div className="report-response-field">Unsupported response type</div>
    }
  }

  const renderReportTab = (): React.ReactElement => {
    return (
      <div className="report-preview-container">
        <div className="report-actions">
          <h2>Garment Inspection Report</h2>
          <button className="export-pdf-button" onClick={exportAsPdf}>
            <FileText size={18} />
            <span>Export as PDF</span>
          </button>
        </div>

        <div className="report-preview" ref={reportRef}>
          <div className="report-header-preview">
            <div className="report-header-content">
              {template.logo && (
                <div className="report-logo">
                  <img src={template.logo || "/placeholder.svg"} alt="Company logo" />
                </div>
              )}
              <div className="report-title-info">
                <h3>{template.title}</h3>
                <p>Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          {template.sections
            .filter((section) => section.type === "standard")
            .map((section, sectionIndex) => (
              <div key={section.id} className="report-section-preview">
                <h4>{section.title}</h4>
                <div className="report-questions">
                  {(section.content as StandardSectionContent).questions.map((question, questionIndex) => (
                    <div key={question.id} className="report-question-item">
                      <div className="report-question-header">
                        <span className="report-question-number">{questionIndex + 1}.</span>
                        <span className="report-question-text">{question.text}</span>
                        {question.required && <span className="report-required-badge">Required</span>}
                      </div>
                      {renderReportQuestionResponse(question)}
                    </div>
                  ))}
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
                      <th>Color</th>
                      {template.sections
                        .find((s) => s.type === "garmentDetails")
                        ?.content.sizes.map((size) => (
                          <React.Fragment key={size}>
                            <th colSpan={2}>{size}</th>
                          </React.Fragment>
                        ))}
                      <th colSpan={2}>Total</th>
                    </tr>
                    <tr>
                      <th></th>
                      {template.sections
                        .find((s) => s.type === "garmentDetails")
                        ?.content.sizes.map((size) => (
                          <React.Fragment key={size}>
                            <th>Order Qty</th>
                            <th>Offered Qty</th>
                          </React.Fragment>
                        ))}
                      <th>Order Qty</th>
                      <th>Offered Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.sections
                      .find((s) => s.type === "garmentDetails")
                      ?.content.colors.map((color) => (
                        <tr key={color}>
                          <td>{color}</td>
                          {template.sections
                            .find((s) => s.type === "garmentDetails")
                            ?.content.sizes.map((size) => (
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
                      <td>Total</td>
                      {template.sections
                        .find((s) => s.type === "garmentDetails")
                        ?.content.sizes.map((size) => (
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

                {template.sections.find((s) => s.type === "garmentDetails")?.content.includeCartonOffered && (
                  <div className="carton-info">
                    <label>No of Carton Offered:</label>
                    <input
                      type="number"
                      className="carton-input"
                      value={reportData.cartonOffered}
                      onChange={(e) => setReportData((prev) => ({ ...prev, cartonOffered: e.target.value }))}
                    />
                  </div>
                )}

                <div className="carton-info">
                  <label>No of Carton to Inspect:</label>
                  <input
                    type="number"
                    className="carton-input"
                    value={reportData.cartonToInspect}
                    onChange={(e) => setReportData((prev) => ({ ...prev, cartonToInspect: e.target.value }))}
                  />
                </div>

                {template.sections.find((s) => s.type === "garmentDetails")?.content.includeCartonInspected && (
                  <div className="carton-info">
                    <label>No of Carton Inspected:</label>
                    <input
                      type="number"
                      className="carton-input"
                      value={reportData.cartonInspected}
                      onChange={(e) => setReportData((prev) => ({ ...prev, cartonInspected: e.target.value }))}
                    />
                  </div>
                )}
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
                      <th>Major</th>
                      <th>Minor</th>
                      <th>Total</th>
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
                          {Number.parseInt(defect.major.toString() || "0", 10) +
                            Number.parseInt(defect.minor.toString() || "0", 10)}
                        </td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan={2}>Total</td>
                      <td>{calculateTotalDefects("major")}</td>
                      <td>{calculateTotalDefects("minor")}</td>
                      <td>{calculateTotalDefects("major") + calculateTotalDefects("minor")}</td>
                    </tr>
                  </tbody>
                </table>

                <button className="add-defect-button" onClick={addReportDefect}>
                  <Plus size={16} /> Add Defect
                </button>

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

  const renderAccessTab = (): React.ReactElement => {
    return (
      <div className="access-tab">
        <div className="access-container">
          <h2>Access & Permissions</h2>
          <p>Configure who can access and use this garment inspection template.</p>

          <div className="access-form">
            <div className="access-section">
              <h3>Template Visibility</h3>
              <div className="access-option">
                <label>
                  <input type="radio" name="visibility" value="public" defaultChecked />
                  <span>Public - All team members can view and use this template</span>
                </label>
              </div>
              <div className="access-option">
                <label>
                  <input type="radio" name="visibility" value="restricted" />
                  <span>Restricted - Only selected team members can view and use this template</span>
                </label>
              </div>
            </div>

            <div className="access-section">
              <h3>User Permissions</h3>
              <table className="access-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>View</th>
                    <th>Edit</th>
                    <th>Delete</th>
                    <th>Assign</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Quality Control Team</td>
                    <td>
                      <input type="checkbox" defaultChecked />
                    </td>
                    <td>
                      <input type="checkbox" defaultChecked />
                    </td>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <input type="checkbox" defaultChecked />
                    </td>
                  </tr>
                  <tr>
                    <td>Production Team</td>
                    <td>
                      <input type="checkbox" defaultChecked />
                    </td>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <input type="checkbox" />
                    </td>
                  </tr>
                  <tr>
                    <td>Management</td>
                    <td>
                      <input type="checkbox" defaultChecked />
                    </td>
                    <td>
                      <input type="checkbox" defaultChecked />
                    </td>
                    <td>
                      <input type="checkbox" defaultChecked />
                    </td>
                    <td>
                      <input type="checkbox" defaultChecked />
                    </td>
                  </tr>
                </tbody>
              </table>

              <button className="add-user-button">
                <Plus size={16} /> Add User
              </button>
            </div>
          </div>

          <div className="publish-container">
            <button className="publish-button" onClick={handleSave}>
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
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
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

            {showMobilePreview && (
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
                              {template.sections.find((s) => s.type === "garmentDetails")?.content.sizes.length || 0}{" "}
                              sizes configured
                            </li>
                            <li>
                              {template.sections.find((s) => s.type === "garmentDetails")?.content.colors.length || 0}{" "}
                              colors configured
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
