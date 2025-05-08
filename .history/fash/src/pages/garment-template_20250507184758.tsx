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

// Type guard function to check if content is GarmentDetailsContent
function isGarmentDetailsContent(content: StandardSectionContent | GarmentDetailsContent): content is GarmentDetailsContent {
  return 'aqlSettings' in content && 'sizes' in content && 'colors' in content;
}

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
  const [showLogicPanel, setShowLogicPanel] = useState<string | null>(null)
  const [newSize, setNewSize] = useState<string>("")
  const [newColor, setNewColor] = useState<string>("")
  const [newDefect, setNewDefect] = useState<string>("")
  const [defectImages, setDefectImages] = useState<{ [defectIndex: number]: string[] }>({})

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
                        if (!garmentSection || !isGarmentDetailsContent(garmentSection.content)) return null;
                        
                        return garmentSection.content.sizes.map((size: string) => (
                          <React.Fragment key={size}>
                            <th colSpan={2}>{size}</th>
                          </React.Fragment>
                        ));
                      })()}
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
              </div>
            ) : (
              <p>No defect types configured</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderAccessTab = () => {
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
