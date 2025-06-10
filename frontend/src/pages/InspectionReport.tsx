import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Download, FileText, Check, AlertTriangle, Camera,
  Home, User, Settings, ArrowLeft, Calendar, Clock,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { fetchData } from '../utils/api'
import './InspectionReport.css'

interface Question {
  id: string
  text: string
  responseType: string
  required: boolean
  options?: string[]
  value?: any
  flagged?: boolean
  logicRules?: any[]
}

interface Section {
  id: string
  title: string
  description?: string
  type?: string
  questions: Question[]
  content?: any
}

interface Template {
  id: string
  title: string
  description: string
  logo?: string
  sections: Section[]
}

interface InspectionData {
  id: number
  title: string
  conducted_by: string
  conducted_at: string
  location?: string
  site?: string
  status: string
  created_at: string
  updated_at: string
}

interface InspectionReportData {
  inspection: InspectionData
  template: Template
  answers: { [key: string]: any }
  conditional_answers: { [key: string]: any }
  conditional_evidence: { [key: string]: any }
  display_messages: { [key: string]: string }  // Add display messages
  garment_data: { [key: string]: any }
}

const InspectionReport: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [reportData, setReportData] = useState<InspectionReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if we have real garment data
  const hasGarmentData = reportData?.garment_data && Object.keys(reportData.garment_data).length > 0

  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        console.log('=== INSPECTION REPORT DEBUG ===')
        console.log(`Component mounted with ID: ${id}`)
        console.log(`Fetching inspection data for ID: ${id}`)
        console.log(`Full API URL: users/inspection/${id}/`)

        const data = await fetchData(`users/inspection/${id}/`)
        console.log('✅ Successfully received inspection data:', data)
        console.log('Data keys:', Object.keys(data))
        console.log('Has garment_data:', !!data.garment_data)

        setReportData(data)
        console.log('✅ Report data set successfully')
      } catch (err: any) {
        console.error('❌ Error fetching inspection data:', err)
        console.error('Error details:', {
          message: err.message,
          response: err.response,
          stack: err.stack
        })

        let errorMessage = 'An error occurred while loading the inspection report'
        if (err.response) {
          console.error('Error response:', err.response)
          errorMessage = `API Error: ${err.response.status} - ${err.response.data?.detail || err.response.statusText}`
        } else if (err.message) {
          errorMessage = err.message
        }
        setError(errorMessage)
      } finally {
        setLoading(false)
        console.log('=== FETCH COMPLETE ===')
      }
    }

    console.log('InspectionReport component mounted with ID:', id)
    if (id) {
      fetchInspectionData()
    } else {
      console.error('❌ No inspection ID provided')
      setError('No inspection ID provided')
      setLoading(false)
    }
  }, [id])



  const calculateReportStats = () => {
    if (!reportData) return { totalQuestions: 0, answeredQuestions: 0, scorePercentage: 0, flaggedItems: 0, actionItems: 0, conditionalResponses: 0, displayMessages: 0 }

    const totalQuestions = reportData.template.sections.reduce((sum, section) => sum + section.questions.length, 0)
    const answeredQuestions = reportData.template.sections.reduce(
      (sum, section) => sum + section.questions.filter((q) =>
        reportData.answers[q.id] !== null && reportData.answers[q.id] !== undefined
      ).length,
      0
    )
    const scorePercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

    const flaggedItems = reportData.template.sections.reduce(
      (sum, section) => sum + section.questions.filter((q) => q.flagged).length,
      0
    )

    const actionItems = reportData.template.sections.reduce(
      (sum, section) => sum + section.questions.filter((q) =>
        q.logicRules?.some(rule => rule.trigger === 'require_action' || rule.trigger === 'require_evidence')
      ).length,
      0
    )

    // Count conditional responses (both answers and evidence)
    const conditionalResponses = Object.keys(reportData.conditional_answers).length + Object.keys(reportData.conditional_evidence).length

    // Count display messages
    const displayMessages = Object.keys(reportData.display_messages || {}).length

    return { totalQuestions, answeredQuestions, scorePercentage, flaggedItems, actionItems, conditionalResponses, displayMessages }
  }

  const getMediaItems = () => {
    if (!reportData) return []
    
    return reportData.template.sections.reduce((items, section) => {
      const sectionMedia = section.questions
        .filter((q) => (q.responseType === 'Media' || q.responseType === 'Annotation') && reportData.answers[q.id])
        .map((q) => ({
          id: q.id,
          caption: q.text,
          thumbnail: reportData.answers[q.id] as string,
        }))
      return [...items, ...sectionMedia]
    }, [] as Array<{ id: string; caption: string; thumbnail: string }>)
  }

  const generatePDF = () => {
    // PDF generation logic similar to Create_template.tsx
    window.print()
  }

  const renderGarmentDetails = () => {
    if (!reportData) return null

    const garmentSection = reportData.template.sections.find(s => s.type === 'garmentDetails')
    if (!garmentSection || !garmentSection.content) return null

    const content = garmentSection.content as any
    const sizes = content.sizes || []
    const colors = content.colors || []

    // Extract garment data from reportData.garment_data
    console.log("Full reportData received:", reportData)
    console.log("Garment data received:", reportData.garment_data)
    console.log("Content:", content)

    // If no garment data, use test data for demonstration

    const quantities = hasGarmentData ? reportData.garment_data.quantities : {
      "BLUE": {
        "S": { orderQty: "0", offeredQty: "0" },
        "M": { orderQty: "0", offeredQty: "0" },
        "L": { orderQty: "0", offeredQty: "0" }
      },
      "RED": {
        "S": { orderQty: "0", offeredQty: "0" },
        "M": { orderQty: "0", offeredQty: "0" },
        "L": { orderQty: "0", offeredQty: "0" }
      }
    }

    const defects = hasGarmentData ? reportData.garment_data.defects : [
      { type: "Stitching", remarks: "Minor loose threads", critical: 0, major: 2, minor: 5 },
      { type: "Fabric", remarks: "Small stain", critical: 0, major: 1, minor: 3 },
      { type: "Color", remarks: "Slight color variation", critical: 0, major: 0, minor: 2 }
    ]

    const aqlSettings = hasGarmentData ? reportData.garment_data.aqlSettings : {
      aqlLevel: "2.5",
      inspectionLevel: "II",
      samplingPlan: "Single",
      severity: "Normal",
      status: "PASS"
    }

    const cartonOffered = hasGarmentData ? reportData.garment_data.cartonOffered : '30'
    const cartonInspected = hasGarmentData ? reportData.garment_data.cartonInspected : '5'
    const cartonToInspect = hasGarmentData ? reportData.garment_data.cartonToInspect : '5'
    const defectImages = hasGarmentData ? (reportData.garment_data.defectImages || {}) : {}

    console.log("Using quantities:", quantities)
    console.log("Using defects:", defects)
    console.log("Has garment data:", hasGarmentData)

    // Calculate totals for quantity table
    const calculateColumnTotal = (size: string, type: 'orderQty' | 'offeredQty') => {
      return colors.reduce((total: number, color: string) => {
        const value = quantities[color]?.[size]?.[type] || 0
        return total + (typeof value === 'string' ? parseInt(value) || 0 : Number(value) || 0)
      }, 0)
    }

    const calculateGrandTotal = (type: 'orderQty' | 'offeredQty') => {
      return colors.reduce((total: number, color: string) => {
        return total + sizes.reduce((sizeTotal: number, size: string) => {
          const value = quantities[color]?.[size]?.[type] || 0
          return sizeTotal + (typeof value === 'string' ? parseInt(value) || 0 : Number(value) || 0)
        }, 0)
      }, 0)
    }

    // Calculate defect totals
    const calculateTotalDefects = (type: 'critical' | 'major' | 'minor') => {
      return defects.reduce((total: number, defect: any) => {
        return total + (Number(defect[type]) || 0)
      }, 0)
    }

    return (
      <div className="ir-garment-details">
        {/* Quantity Table with Order Qty and Offered Qty */}
        {sizes.length > 0 && colors.length > 0 && (
          <div className="ir-garment-section">
            <h4 className="ir-garment-section-title">Quantity Breakdown</h4>
            <div className="ir-table-container">
              <table className="ir-garment-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Color/Size</th>
                    {sizes.map((size: string) => (
                      <th key={size} colSpan={2} className="ir-size-header">{size}</th>
                    ))}
                    <th colSpan={2} className="ir-size-header">Total</th>
                  </tr>
                  <tr>
                    {sizes.map((size: string) => (
                      <React.Fragment key={size}>
                        <th className="ir-qty-header">Order Qty</th>
                        <th className="ir-qty-header">Offered Qty</th>
                      </React.Fragment>
                    ))}
                    <th className="ir-qty-header">Order Qty</th>
                    <th className="ir-qty-header">Offered Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.map((color: string) => (
                    <tr key={color}>
                      <td className="ir-color-column">{color}</td>
                      {sizes.map((size: string) => (
                        <React.Fragment key={`${color}-${size}`}>
                          <td>{quantities[color]?.[size]?.orderQty || 0}</td>
                          <td>{quantities[color]?.[size]?.offeredQty || 0}</td>
                        </React.Fragment>
                      ))}
                      <td className="ir-total-cell">
                        {sizes.reduce((total: number, size: string) => {
                          const value = quantities[color]?.[size]?.orderQty || 0
                          return total + (typeof value === 'string' ? parseInt(value) || 0 : Number(value) || 0)
                        }, 0)}
                      </td>
                      <td className="ir-total-cell">
                        {sizes.reduce((total: number, size: string) => {
                          const value = quantities[color]?.[size]?.offeredQty || 0
                          return total + (typeof value === 'string' ? parseInt(value) || 0 : Number(value) || 0)
                        }, 0)}
                      </td>
                    </tr>
                  ))}
                  <tr className="ir-total-row">
                    <td className="ir-color-column">Total</td>
                    {sizes.map((size: string) => (
                      <React.Fragment key={size}>
                        <td className="ir-total-cell">{calculateColumnTotal(size, "orderQty")}</td>
                        <td className="ir-total-cell">{calculateColumnTotal(size, "offeredQty")}</td>
                      </React.Fragment>
                    ))}
                    <td className="ir-total-cell">{calculateGrandTotal("orderQty")}</td>
                    <td className="ir-total-cell">{calculateGrandTotal("offeredQty")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Carton Information */}
            <div className="ir-carton-info-section">
              {content.includeCartonOffered && (
                <div className="ir-carton-info">
                  <label>No of Carton Offered:</label>
                  <span>{cartonOffered}</span>
                </div>
              )}

              <div className="ir-carton-info">
                <label>No of Carton to Inspect:</label>
                <span>{cartonToInspect}</span>
              </div>

              {content.includeCartonInspected && (
                <div className="ir-carton-info">
                  <label>No of Carton Inspected:</label>
                  <span>{cartonInspected}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Defect Log */}
        <div className="ir-garment-section">
          <h4 className="ir-garment-section-title">Defect Log</h4>
          {defects.length > 0 ? (
            <div className="ir-defect-log-preview">
              <div className="ir-table-container">
                <table className="ir-defect-table">
                  <thead>
                    <tr>
                      <th>Defect Type</th>
                      <th>Remarks</th>
                      <th>Critical</th>
                      <th>Major</th>
                      <th>Minor</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defects.map((defect: any, index: number) => (
                      <tr key={index}>
                        <td>{defect.type}</td>
                        <td>{defect.remarks}</td>
                        <td>{defect.critical || 0}</td>
                        <td>{defect.major || 0}</td>
                        <td>{defect.minor || 0}</td>
                        <td>
                          {(Number(defect.critical) || 0) +
                           (Number(defect.major) || 0) +
                           (Number(defect.minor) || 0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="ir-total-row">
                      <td colSpan={2}>Total</td>
                      <td>{calculateTotalDefects("critical")}</td>
                      <td>{calculateTotalDefects("major")}</td>
                      <td>{calculateTotalDefects("minor")}</td>
                      <td>
                        {calculateTotalDefects("critical") +
                         calculateTotalDefects("major") +
                         calculateTotalDefects("minor")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Photographs Section */}
              {defectImages && Object.keys(defectImages).length > 0 && (
                <div className="ir-photograph-section">
                  <h5>Photographs</h5>
                  <div className="ir-defect-images-grid">
                    {Object.entries(defectImages).map(([defectIndex, images]) => {
                      const index = Number.parseInt(defectIndex, 10)
                      const defect = defects[index]
                      if (!defect || !Array.isArray(images) || !images.length) return null

                      return images.map((image: string, imageIndex: number) => (
                        <div key={`${defectIndex}-${imageIndex}`} className="ir-defect-image-card">
                          <div className="ir-defect-image-header">
                            <span className="ir-defect-image-type">{defect.type}</span>
                          </div>
                          <div className="ir-defect-image-container">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Defect: ${defect.type}`}
                              className="ir-defect-image"
                            />
                          </div>
                          <div className="ir-defect-image-remarks">{defect.remarks}</div>
                        </div>
                      ))
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="ir-no-data">No defects recorded</p>
          )}
        </div>

        {/* AQL Results */}
        {aqlSettings && (
          <div className="ir-garment-section">
            <h4 className="ir-garment-section-title">AQL Results</h4>
            <div className="ir-aql-result-preview">
              <div className="ir-aql-info">
                <div className="ir-aql-item">
                  <span className="ir-aql-label">AQL Level:</span>
                  <span className="ir-aql-value">{aqlSettings.aqlLevel}</span>
                </div>
                <div className="ir-aql-item">
                  <span className="ir-aql-label">Inspection Level:</span>
                  <span className="ir-aql-value">{aqlSettings.inspectionLevel}</span>
                </div>
                <div className="ir-aql-item">
                  <span className="ir-aql-label">Sampling Plan:</span>
                  <span className="ir-aql-value">{aqlSettings.samplingPlan}</span>
                </div>
                <div className="ir-aql-item">
                  <span className="ir-aql-label">Severity:</span>
                  <span className="ir-aql-value">{aqlSettings.severity}</span>
                </div>
                <div className="ir-aql-item">
                  <span className="ir-aql-label">Status:</span>
                  <span className={`ir-aql-status ${aqlSettings.status?.toLowerCase()}`}>
                    {aqlSettings.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  console.log('=== RENDER DEBUG ===')
  console.log('Loading:', loading)
  console.log('Error:', error)
  console.log('ReportData:', !!reportData)
  console.log('ID from params:', id)

  if (loading) {
    console.log('Rendering loading state')
    return (
      <div className="ir-loading-container">
        <div className="ir-loading-spinner"></div>
        <p>Loading inspection report for ID: {id}...</p>
        <p>Debug: Component is in loading state</p>
      </div>
    )
  }

  if (error) {
    console.log('Rendering error state:', error)
    return (
      <div className="ir-error-container">
        <AlertCircle className="ir-error-icon" />
        <h2>Error Loading Report</h2>
        <p>{error}</p>
        <p>Debug: Inspection ID was: {id}</p>
        <button onClick={() => navigate('/dashboard')} className="ir-back-button">
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (!reportData) {
    console.log('Rendering no data state')
    return (
      <div className="ir-error-container">
        <AlertCircle className="ir-error-icon" />
        <h2>Report Not Found</h2>
        <p>The requested inspection report could not be found.</p>
        <p>Debug: Inspection ID was: {id}</p>
        <button onClick={() => navigate('/dashboard')} className="ir-back-button">
          Back to Dashboard
        </button>
      </div>
    )
  }

  console.log('Calculating stats and rendering main component')

  try {
    const stats = calculateReportStats()
    const mediaItems = getMediaItems()

    console.log('Stats calculated:', stats)
    console.log('Media items:', mediaItems.length)
    console.log('Conditional answers:', reportData.conditional_answers)
    console.log('Conditional evidence:', reportData.conditional_evidence)
    console.log('Display messages:', reportData.display_messages)
    console.log('About to render main report')

    return (
      <div className="ir-report-wrapper">
        <div className="ir-report-container">
          <div className="ir-report-header">
            <div className="ir-header-left">
              <button onClick={() => navigate('/dashboard')} className="ir-back-btn">
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
              <h2>Inspection Report (ID: {id})</h2>
            </div>
            <button className="ir-generate-pdf-button" onClick={generatePDF}>
              <Download className="ir-download-icon" />
              Download PDF Report
            </button>
          </div>

        <div className="ir-report-card">
          <div className="ir-report-card-header">
            <div className="ir-report-title-section">
              {reportData.template.logo && (
                <div className="ir-report-logo">
                  <img src={reportData.template.logo} alt="Logo" />
                </div>
              )}
              <div className="ir-report-title-info">
                <h3>{reportData.template.title}</h3>
                <p className="ir-report-date">
                  {new Date(reportData.inspection.conducted_at).toLocaleDateString()} / {reportData.inspection.conducted_by}
                </p>
                <div className="ir-inspection-details">
                  <span><Calendar size={16} /> {new Date(reportData.inspection.conducted_at).toLocaleDateString()}</span>
                  <span><Clock size={16} /> {new Date(reportData.inspection.conducted_at).toLocaleTimeString()}</span>
                  {reportData.inspection.location && <span>📍 {reportData.inspection.location}</span>}
                  {reportData.inspection.site && <span>🏢 {reportData.inspection.site}</span>}
                </div>
              </div>
            </div>
            <div className={`ir-report-completion-badge ${stats.scorePercentage === 100 ? 'complete' : ''}`}>
              {stats.scorePercentage === 100 ? 'Complete' : 'Incomplete'}
            </div>
          </div>

          <div className="ir-report-stats">
            <div className="ir-report-score-container">
              <p className="ir-report-stat-label">Score</p>
              <div className="ir-report-score-bar">
                <div className="ir-report-score-progress" style={{ width: `${stats.scorePercentage}%` }}></div>
              </div>
              <span className="ir-report-score-text">
                {stats.answeredQuestions}/{stats.totalQuestions} ({stats.scorePercentage}%)
              </span>
            </div>

            <div className="ir-report-stats-grid">
              <div className="ir-report-stat-item">
                <div className="ir-report-stat-icon flagged">
                  <AlertTriangle size={20} />
                </div>
                <div className="ir-report-stat-content">
                  <span className="ir-report-stat-number">{stats.flaggedItems}</span>
                  <span className="ir-report-stat-label">Flagged Items</span>
                </div>
              </div>

              <div className="ir-report-stat-item">
                <div className="ir-report-stat-icon action">
                  <CheckCircle size={20} />
                </div>
                <div className="ir-report-stat-content">
                  <span className="ir-report-stat-number">{stats.conditionalResponses}</span>
                  <span className="ir-report-stat-label">Logic Responses</span>
                </div>
              </div>

              <div className="ir-report-stat-item">
                <div className="ir-report-stat-icon action">
                  <CheckCircle size={20} />
                </div>
                <div className="ir-report-stat-content">
                  <span className="ir-report-stat-number">{stats.displayMessages}</span>
                  <span className="ir-report-stat-label">Display Messages</span>
                </div>
              </div>

              <div className="ir-report-stat-item">
                <div className="ir-report-stat-icon media">
                  <Camera size={20} />
                </div>
                <div className="ir-report-stat-content">
                  <span className="ir-report-stat-number">{mediaItems.length}</span>
                  <span className="ir-report-stat-label">Media Items</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Content Tabs */}
        <div className="ir-report-tabs">
          <div className="ir-report-tab-content">
            {/* Summary Section */}
            <div className="ir-report-summary">
              <div className="ir-report-section">
                <h3 className="ir-report-section-title">All Responses</h3>
                <p className="ir-report-section-description">
                  Complete overview of all questions and responses from this inspection.
                </p>

                <div className="ir-report-questions-list">
                  {reportData.template.sections.map((section) =>
                    section.questions
                      .filter((q) => reportData.answers[q.id] !== null && reportData.answers[q.id] !== undefined)
                      .map((question) => {
                        // Find conditional answers, evidence, and display messages for this question
                        const questionConditionalAnswers = Object.entries(reportData.conditional_answers).filter(
                          ([conditionalId]) => conditionalId.startsWith(`${question.id}_`)
                        )
                        const questionConditionalEvidence = Object.entries(reportData.conditional_evidence).filter(
                          ([evidenceId]) => evidenceId.startsWith(`${question.id}_`)
                        )
                        const questionDisplayMessage = reportData.display_messages?.[question.id]

                        // Debug logging for conditional responses and display messages
                        if (questionConditionalAnswers.length > 0 || questionConditionalEvidence.length > 0 || questionDisplayMessage) {
                          console.log(`Question ${question.id} has logic responses:`, {
                            answers: questionConditionalAnswers,
                            evidence: questionConditionalEvidence,
                            displayMessage: questionDisplayMessage
                          })
                        }

                        return (
                          <div key={question.id} className={`ir-report-question-item ${question.flagged ? 'flagged' : ''}`}>
                            <div className="ir-report-question-header">
                              <div className="ir-report-question-icon">
                                {question.responseType === "Yes/No" || question.responseType === "Checkbox" ? (
                                  reportData.answers[question.id] === "Yes" || reportData.answers[question.id] === true ? (
                                    <Check className="ir-report-question-check" />
                                  ) : (
                                    <AlertTriangle className="ir-report-question-alert" />
                                  )
                                ) : (
                                  <FileText className="ir-report-question-info" />
                                )}
                              </div>
                              <div className="ir-report-question-content">
                                <h4 className="ir-report-question-text">{question.text}</h4>
                                <div className="ir-report-question-response">
                                  <span className="ir-report-response-label">Response:</span>
                                  <span className="ir-report-response-value">
                                    {Array.isArray(reportData.answers[question.id])
                                      ? (reportData.answers[question.id] as string[]).join(', ')
                                      : String(reportData.answers[question.id])
                                    }
                                  </span>
                                </div>

                                {/* Display conditional answers for this question */}
                                {questionConditionalAnswers.map(([conditionalId, value]) => (
                                  <div key={conditionalId} className="ir-report-conditional-response">
                                    <div className="ir-report-conditional-header">
                                      <FileText className="ir-report-conditional-icon" size={16} />
                                      <span className="ir-report-conditional-label">Follow-up Question:</span>
                                    </div>
                                    <div className="ir-report-conditional-value">
                                      {Array.isArray(value) ? value.join(', ') : String(value)}
                                    </div>
                                  </div>
                                ))}

                                {/* Display evidence for this question */}
                                {questionConditionalEvidence.map(([evidenceId, value]) => (
                                  <div key={evidenceId} className="ir-report-evidence-response">
                                    <div className="ir-report-evidence-header">
                                      <Camera className="ir-report-evidence-icon" size={16} />
                                      <span className="ir-report-evidence-label">Evidence Required:</span>
                                    </div>
                                    <div className="ir-report-evidence-preview">
                                      <img src={value as string} alt="Evidence" className="ir-report-evidence-image" />
                                    </div>
                                  </div>
                                ))}

                                {/* Display message for this question */}
                                {questionDisplayMessage && (
                                  <div className="ir-report-display-message">
                                    <div className="ir-report-display-header">
                                      <CheckCircle className="ir-report-display-icon" size={16} />
                                      <span className="ir-report-display-label">Logic Message:</span>
                                    </div>
                                    <div className="ir-report-display-value">
                                      {questionDisplayMessage}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>



              {/* Flagged Items Section */}
              {stats.flaggedItems > 0 && (
                <div className="ir-report-section">
                  <h3 className="ir-report-section-title">Flagged Items</h3>
                  <p className="ir-report-section-description">
                    Items that require attention or follow-up action.
                  </p>

                  <div className="ir-report-questions-list">
                    {reportData.template.sections.map((section) =>
                      section.questions
                        .filter((q) => q.flagged)
                        .map((question) => (
                          <div key={question.id} className="ir-report-question-item flagged">
                            <div className="ir-report-question-header">
                              <div className="ir-report-question-icon">
                                <AlertTriangle className="ir-report-question-alert" />
                              </div>
                              <div className="ir-report-question-content">
                                <h4 className="ir-report-question-text">{question.text}</h4>
                                <div className="ir-report-question-response">
                                  <span className="ir-report-response-label">Response:</span>
                                  <span className="ir-report-response-value">
                                    {Array.isArray(reportData.answers[question.id])
                                      ? (reportData.answers[question.id] as string[]).join(', ')
                                      : String(reportData.answers[question.id])
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* Media Items Section */}
              {mediaItems.length > 0 && (
                <div className="ir-report-section">
                  <h3 className="ir-report-section-title">Media & Evidence</h3>
                  <p className="ir-report-section-description">
                    Photos and documentation captured during the inspection.
                  </p>

                  <div className="ir-report-media-grid">
                    {mediaItems.map((item) => (
                      <div key={item.id} className="ir-report-media-item">
                        <div className="ir-report-media-thumbnail">
                          <img src={item.thumbnail} alt={item.caption} />
                        </div>
                        <p className="ir-report-media-caption">{item.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Garment Details Section */}
              {reportData.template.sections.some(s => s.type === 'garmentDetails') && (
                <div className="ir-report-section">
                  <h3 className="ir-report-section-title">
                    Garment Inspection Details
                    {!hasGarmentData && <span style={{color: 'orange', fontSize: '14px', fontWeight: 'normal'}}> (Using Test Data - No Real Data Found)</span>}
                  </h3>
                  <p className="ir-report-section-description">
                    Detailed garment inspection data including quantities, defects, and AQL results.
                  </p>

                  {renderGarmentDetails()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  } catch (renderError: any) {
    console.error('❌ Error rendering InspectionReport:', renderError)
    return (
      <div className="ir-error-container">
        <AlertCircle className="ir-error-icon" />
        <h2>Rendering Error</h2>
        <p>An error occurred while rendering the inspection report.</p>
        <p>Error: {renderError.message}</p>
        <p>Debug: Inspection ID was: {id}</p>
        <button onClick={() => navigate('/dashboard')} className="ir-back-button">
          Back to Dashboard
        </button>
      </div>
    )
  }
}

export default InspectionReport
