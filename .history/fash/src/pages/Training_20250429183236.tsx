"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Edit,
  FileText,
  Filter,
  LayoutGrid,
  List,
  Lock,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Upload,
  Video,
  X,
  ImageIcon,
  CheckCircle,
} from "lucide-react"
import "./Training.css"

interface SlideBase {
  id: string
  type: string
  title: string
  subtitle?: string
  buttonText?: string
  exitButton?: boolean
  doneText?: string
  items?: string[]
  leftProduct?: {
    name: string
    tagline: string
  }
  rightProduct?: {
    name: string
    tagline: string
  }
  media?: {
    id: string
    type: "image" | "video"
    name: string
    url: string
  }[]
  video?: {
    id: string
    type: "video"
    name: string
    url: string
  }
  caption?: string
}

interface SlideTitle extends SlideBase {
  type: "title"
}

interface SlideEnd extends SlideBase {
  type: "end"
}

interface SlideBulletedList extends SlideBase {
  type: "bulleted-list"
  items: string[]
  doneText: string
}

interface SlideComparison extends SlideBase {
  type: "comparison"
  leftProduct: {
    name: string
    tagline: string
  }
  rightProduct: {
    name: string
    tagline: string
  }
  doneText: string
}

interface SlideMediaCollection extends SlideBase {
  type: "media-collection"
  media: {
    id: string
    type: "image" | "video"
    name: string
    url: string
  }[]
  caption: string
  doneText: string
}

interface SlideSingleVideo extends SlideBase {
  type: "single-video"
  video: {
    id: string
    type: "video"
    name: string
    url: string
  }
  caption: string
  doneText: string
}

interface SlideHorizontalSeries extends SlideBase {
  type: "horizontal-series"
  doneText: string
}

type Slide =
  | SlideTitle
  | SlideEnd
  | SlideBulletedList
  | SlideComparison
  | SlideMediaCollection
  | SlideSingleVideo
  | SlideHorizontalSeries

interface Lesson {
  id: string
  title: string
  duration: string
  slides: Slide[]
}

interface Course {
  id: string
  title: string
  description: string
  image: string
  status: string
  lessonCount: number
  lessons?: Lesson[]
}

// Mock data for courses
const initialCourses: Course[] = [
  {
    id: "course1",
    title: "Untitled course",
    description: "",
    image: "blue-gradient",
    status: "Draft",
    lessonCount: 1,
  },
  {
    id: "course2",
    title: "Fashcognitive",
    description: "teaching How to inspect",
    image: "blue-gradient",
    status: "Draft",
    lessonCount: 1,
  },
  {
    id: "course3",
    title: "Untitled course",
    description: "",
    image: "blue-gradient",
    status: "Draft",
    lessonCount: 1,
  },
]

// Mock data for a new course
const initialNewCourse: Course = {
  id: "new-course",
  title: "Untitled course",
  description: "",
  image: "blue-gradient",
  status: "Draft",
  lessonCount: 1,
  lessons: [
    {
      id: "lesson1",
      title: "Untitled lesson",
      duration: "0:00",
      slides: [
        {
          id: "slide1",
          type: "title",
          title: "A title slide",
          subtitle: "An optional subtitle",
          buttonText: "Ok, let's go!",
          exitButton: false,
        },
        {
          id: "slide2",
          type: "end",
          title: "That's it!",
        },
      ],
    },
  ],
}

// Slide templates for the library
const slideTemplates = [
  {
    id: "bulleted-list",
    name: "Bulleted list",
    description: "Show a list of bullet points",
    category: "text",
    preview: (
      <div className="training-slide-preview training-bulleted-list">
        <div className="training-preview-title">Bulleted list</div>
        <ul className="training-preview-list">
          <li>Has several points</li>
          <li>Displays each point with a bullet</li>
          <li>Is similar to a PowerPoint slide</li>
        </ul>
      </div>
    ),
  },
  {
    id: "comparison",
    name: "Comparison",
    description: "Compare two text blocks",
    category: "text",
    preview: (
      <div className="training-slide-preview training-comparison">
        <div className="training-preview-title">Product X vs. Product Y</div>
        <div className="training-comparison-container">
          <div className="training-comparison-item blue">
            <div className="training-product-label">Product X</div>
            <div className="training-product-tagline">Brilliant. In every way.</div>
          </div>
          <div className="training-comparison-item yellow">
            <div className="product-label">Product Y</div>
            <div className="product-tagline">Almost as good.</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "expandable-list",
    name: "Expandable list",
    description: "Show a list of concepts",
    category: "text",
    preview: (
      <div className="slide-preview expandable-list">
        <div className="preview-title">Product Features</div>
        <div className="expandable-items">
          <div className="expandable-item">
            <div className="item-header">
              <span>Feature X</span>
              <span className="plus">+</span>
            </div>
          </div>
          <div className="expandable-item">
            <div className="item-header">
              <span>Feature Y</span>
              <span className="plus">+</span>
            </div>
          </div>
          <div className="expandable-item">
            <div className="item-header">
              <span>Feature Z</span>
              <span className="plus">+</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "horizontal-series",
    name: "Horizontal series",
    description: "Show text blocks in order",
    category: "text",
    preview: (
      <div className="slide-preview horizontal-series">
        <div className="preview-title">Our Product Range</div>
        <div className="series-container">
          <div className="series-item active">
            <div className="product-image blue"></div>
            <div className="product-name">Product X</div>
          </div>
          <div className="series-dots">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "media-collection",
    name: "Media collection",
    description: "Show up to three pieces of media",
    category: "media",
    preview: (
      <div className="slide-preview media-collection">
        <div className="preview-title">Media Gallery</div>
        <div className="media-grid">
          <div className="media-item video">
            <div className="play-icon">▶</div>
          </div>
          <div className="media-item image blue"></div>
          <div className="media-item image yellow"></div>
        </div>
      </div>
    ),
  },
  {
    id: "single-video",
    name: "Single video",
    description: "Show a single video",
    category: "media",
    preview: (
      <div className="slide-preview single-video">
        <div className="preview-title">Product Demo</div>
        <div className="video-container">
          <div className="play-icon">▶</div>
        </div>
        <div className="video-caption">Watch how our product works</div>
      </div>
    ),
  },
  {
    id: "image-collection",
    name: "Image collection",
    description: "Show a grid of images",
    category: "media",
    preview: (
      <div className="slide-preview image-collection">
        <div className="preview-title">Product Gallery</div>
        <div className="image-grid">
          <div className="image-item blue"></div>
          <div className="image-item light-blue"></div>
          <div className="image-item yellow"></div>
          <div className="image-item light-yellow"></div>
        </div>
      </div>
    ),
  },
  {
    id: "quote",
    name: "Quote",
    description: "Show a quotation",
    category: "text",
    preview: (
      <div className="slide-preview quote">
        <div className="quote-mark">"</div>
        <div className="quote-text">Product X has defied my expectations.</div>
        <div className="quote-author">Satisfied customer</div>
      </div>
    ),
  },
  {
    id: "scrolling-text",
    name: "Scrolling text",
    description: "Show long-form text",
    category: "text",
    preview: (
      <div className="slide-preview scrolling-text">
        <div className="preview-title">Product Details</div>
        <div className="scrolling-content">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus quis lectus metus, at posuere neque.</p>
          <p>Sed blandit augue vitae augue scelerisque bibendum.</p>
        </div>
      </div>
    ),
  },
]

export default function Training() {
  // State for view (dashboard or editor)
  const [view, setView] = useState("editor")

  // State for courses
  const [courses, setCourses] = useState(initialCourses)

  // State for current course being edited
  const [currentCourse, setCurrentCourse] = useState(initialNewCourse)

  // State for create course dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newCourseTitle, setNewCourseTitle] = useState("Untitled course")
  const [newCourseDescription, setNewCourseDescription] = useState("")

  // State for slide library dialog
  const [slideLibraryOpen, setSlideLibraryOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("text")

  // State for selected lesson and slide
  const [selectedLessonId, setSelectedLessonId] = useState("lesson1")
  const [selectedSlideId, setSelectedSlideId] = useState("slide1")

  // State for slide insertion
  const [insertAfterSlideId, setInsertAfterSlideId] = useState<string | null>(null)
  const [showInsertButton, setShowInsertButton] = useState(false)
  const [insertButtonPosition, setInsertButtonPosition] = useState({ top: 0 })

  // State for comparison slider
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  // State for horizontal series
  const [activeSeriesIndex, setActiveSeriesIndex] = useState(0)

  // Refs
  const slidesContainerRef = useRef<HTMLDivElement | null>(null)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const comparisonContainerRef = useRef<HTMLDivElement | null>(null)

  // Get the selected lesson and slide
  const selectedLesson = currentCourse.lessons?.find((lesson) => lesson.id === selectedLessonId)
  const selectedSlide = selectedLesson?.slides.find((slide) => slide.id === selectedSlideId)

  // Effect for handling slider drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && comparisonContainerRef.current) {
        const rect = comparisonContainerRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
        const newPosition = (x / rect.width) * 100
        setSliderPosition(newPosition)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  // Effect for horizontal series auto-rotation
  useEffect(() => {
    if (selectedSlide && selectedSlide.type === "horizontal-series") {
      const interval = setInterval(() => {
        setActiveSeriesIndex((prev) => (prev + 1) % 3)
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [selectedSlide])

  const handleCreateCourse = (): void => {
    const newCourse: Course = {
      ...initialNewCourse,
      title: newCourseTitle,
      description: newCourseDescription,
      lessonCount: initialNewCourse.lessons ? initialNewCourse.lessons.length : 0,
    }

    setCourses([...courses, newCourse])
    setCurrentCourse(newCourse)
    setCreateDialogOpen(false)
    setView("editor")
  }

  const handleAddSlide = (templateId: string, afterSlideId: string | null = null): void => {
    const template = slideTemplates.find((t) => t.id === templateId)

    if (!template) return

    let newSlide: Slide = {
      id: `slide${Date.now()}`,
      type: template.id,
      title: template.name,
    } as Slide

    if (template.id === "bulleted-list") {
      newSlide = {
        ...newSlide,
        items: ["Has several points", "Displays each point with a bullet", "Is similar to a PowerPoint slide"],
        doneText: "Continue",
      } as SlideBulletedList
    } else if (template.id === "comparison") {
      newSlide = {
        ...newSlide,
        title: "Product X vs. Product Y",
        leftProduct: {
          name: "Product X",
          tagline: "Brilliant. In every way.",
        },
        rightProduct: {
          name: "Product Y",
          tagline: "Almost as good.",
        },
        doneText: "Continue",
      } as SlideComparison
    } else if (template.id === "media-collection") {
      newSlide = {
        ...newSlide,
        title: "Media Gallery",
        media: [],
        caption: "Select each item for more details",
        doneText: "Continue",
      } as SlideMediaCollection
    } else if (template.id === "single-video") {
      newSlide = {
        ...newSlide,
        title: "Video Demo",
        video: {
          id: `video-${Date.now()}`,
          type: "video",
          name: "Demo Video",
          url: "",
        },
        caption: "Watch how our product works",
        doneText: "Continue",
      } as SlideSingleVideo
    } else if (template.id === "horizontal-series") {
      newSlide = {
        ...newSlide,
        title: "Our Product Range",
        doneText: "Continue",
      } as SlideHorizontalSeries
    }

    const updatedLessons = currentCourse.lessons!.map((lesson) => {
      if (lesson.id === selectedLessonId) {
        const newSlides = [...lesson.slides]

        if (afterSlideId) {
          // Insert after the specified slide
          const insertIndex = newSlides.findIndex((slide) => slide.id === afterSlideId)
          if (insertIndex !== -1) {
            newSlides.splice(insertIndex + 1, 0, newSlide)
          } else {
            newSlides.push(newSlide)
          }
        } else {
          // Add to the end
          newSlides.push(newSlide)
        }

        return {
          ...lesson,
          slides: newSlides,
        }
      }
      return lesson
    })

    setCurrentCourse({
      ...currentCourse,
      lessons: updatedLessons,
    })

    setSelectedSlideId(newSlide.id)
    setSlideLibraryOpen(false)
    setInsertAfterSlideId(null)
    setShowInsertButton(false)
  }

  const handleUpdateSlide = (field: string, value: any): void => {
    const updatedLessons = currentCourse.lessons!.map((lesson) => {
      if (lesson.id === selectedLessonId) {
        return {
          ...lesson,
          slides: lesson.slides.map((slide) => {
            if (slide.id === selectedSlideId) {
              return {
                ...slide,
                [field]: value,
              }
            }
            return slide
          }),
        }
      }
      return lesson
    })

    setCurrentCourse({
      ...currentCourse,
      lessons: updatedLessons,
    })
  }

  const handleUpdateListItem = (index: number, value: string): void => {
    if (!selectedSlide || selectedSlide.type !== "bulleted-list") return

    const updatedItems = [...(selectedSlide.items || [])]
    updatedItems[index] = value

    handleUpdateSlide("items", updatedItems)
  }

  const handleAddListItem = (): void => {
    if (!selectedSlide || selectedSlide.type !== "bulleted-list") return

    const updatedItems = [...(selectedSlide.items || []), "New item"]
    handleUpdateSlide("items", updatedItems)
  }

  const handleRemoveListItem = (index: number): void => {
    if (!selectedSlide || selectedSlide.type !== "bulleted-list") return

    const updatedItems = [...(selectedSlide.items || [])]
    updatedItems.splice(index, 1)

    handleUpdateSlide("items", updatedItems)
  }

  // Function to get the current slide index and total slides
  const getSlidePosition = () => {
    if (!selectedLesson) return { current: 0, total: 0 }

    const currentIndex = selectedLesson.slides.findIndex((slide) => slide.id === selectedSlideId)
    return {
      current: currentIndex + 1,
      total: selectedLesson.slides.length,
    }
  }

  // Function to navigate to the next slide in preview
  const goToNextSlide = () => {
    if (!selectedLesson) return

    const currentIndex = selectedLesson.slides.findIndex((slide) => slide.id === selectedSlideId)
    if (currentIndex < selectedLesson.slides.length - 1) {
      setSelectedSlideId(selectedLesson.slides[currentIndex + 1].id)
    }
  }

  // Function to navigate to the previous slide in preview
  const goToPrevSlide = () => {
    if (!selectedLesson) return

    const currentIndex = selectedLesson.slides.findIndex((slide) => slide.id === selectedSlideId)
    if (currentIndex > 0) {
      setSelectedSlideId(selectedLesson.slides[currentIndex - 1].id)
    }
  }

  const handleSlideItemMouseEnter = (e: React.MouseEvent<HTMLDivElement>, slideId: string, index: number): void => {
    if (slidesContainerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const containerRect = slidesContainerRef.current.getBoundingClientRect()

      setInsertButtonPosition({
        top: rect.bottom - containerRect.top,
      })

      setInsertAfterSlideId(slideId)
      setShowInsertButton(true)
    }
  }

  // Function to handle mouse leave on slides container
  const handleSlidesContainerMouseLeave = () => {
    setShowInsertButton(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // This would normally upload the file to a server
    // For now, we'll just simulate adding a media item
    if (selectedSlide && (selectedSlide.type === "media-collection" || selectedSlide.type === "single-video")) {
      const file = e.target.files?.[0]
      if (file) {
        const isImage = file.type.startsWith("image/")
        const isVideo = file.type.startsWith("video/")

        if (isImage || isVideo) {
          const mediaItem = {
            id: `media-${Date.now()}`,
            type: isImage ? ("image" as const) : ("video" as const),
            name: file.name,
            // In a real app, we would upload the file and get a URL
            url: URL.createObjectURL(file),
          }

          if (selectedSlide.type === "media-collection") {
            const updatedMedia = [...(selectedSlide.media || []), mediaItem]
            handleUpdateSlide("media", updatedMedia)
          } else if (selectedSlide.type === "single-video") {
            handleUpdateSlide("video", mediaItem)
          }
        }
      }
    }
  }

  const slidePosition = getSlidePosition()

  // Render the dashboard view
  if (view === "dashboard") {
    return (
      <div className="training-container">
        {/* Top navigation */}
        <div className="training-top-nav">
          <div className="training-nav-content">
            <div className="training-nav-links">
              <button className="training-nav-link">Learn</button>
              <button className="training-nav-link active">Content</button>
            </div>
            <div className="training-nav-actions">
              <button className="training-icon-button">
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="training-main-content">
          <div className="training-content-header">
            <h1>Content</h1>
            <button className="training-create-button" onClick={() => setCreateDialogOpen(true)}>
              <Plus size={16} />
              Create course
            </button>
          </div>

          {/* Tabs */}
          <div className="training-tabs">
            <button className="training-tab active">Courses</button>
          </div>

          {/* Controls */}
          <div className="training-controls">
            <div className="training-search-filters">
              <div className="training-search-container">
                <Search className="training-search-icon" />
                <input type="text" placeholder="Search" className="training-search-input" />
              </div>
              <button className="training-filter-button">
                <Filter size={16} />
                Filters
              </button>
            </div>
            <div className="training-view-controls">
              <span className="training-results-count">3 results</span>
              <button className="training-sort-button">
                Last modified (Newest)
                <ChevronDown size={16} />
              </button>
              <button className="training-view-button">
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {/* Course grid */}
          <div className="training-course-grid">
            {courses.map((course) => (
              <div
                key={course.id}
                className="training-course-card"
                onClick={() => {
                  setCurrentCourse({ ...initialNewCourse, title: course.title, description: course.description })
                  setView("editor")
                }}
              >
                <div className="training-card-image"></div>
                <div className="training-card-content">
                  <div className="training-card-label">
                    <BookOpen size={16} />
                    COURSE
                  </div>
                  <h3 className="training-card-title">{course.title}</h3>
                  {course.description && <p className="training-card-description">{course.description}</p>}
                  <div className="training-card-footer">
                    <div className="training-card-meta">
                      <span>GM</span>
                      <List size={16} />
                      <span>1</span>
                    </div>
                    <div className="training-card-status">{course.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create course dialog */}
        {createDialogOpen && (
          <div className="dialog-overlay" onClick={() => setCreateDialogOpen(false)}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h2>Course details</h2>
                <button className="close-button" onClick={() => setCreateDialogOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="dialog-content">
                <div className="upload-area">
                  <div className="upload-icon">
                    <Upload size={24} />
                  </div>
                  <div className="upload-icon">
                    <ImageIcon size={24} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="title">Title (required)</label>
                  <input
                    id="title"
                    type="text"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    className="text-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    placeholder="Add a brief description"
                    value={newCourseDescription}
                    onChange={(e) => setNewCourseDescription(e.target.value)}
                    className="textarea"
                  ></textarea>
                </div>
              </div>
              <div className="dialog-footer">
                <button className="cancel-button" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </button>
                <button className="create-button" onClick={handleCreateCourse}>
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render the editor view
  return (
    <div className="training-container">
      {/* Editor header */}
      <div className="editor-header">
        <div className="header-content">
          <div className="header-left">
            <button className="back-button" onClick={() => setView("dashboard")}>Back</button>
          </div>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${(slidePosition.current / slidePosition.total) * 100}%` }}></div>
          </div>
          <div className="header-right">
            <button className="next-button" onClick={goToNextSlide}>Next</button>
          </div>
        </div>
      </div>

      {/* Main editor area - 3 column layout */}
      <div className="editor-layout">
        {/* Left sidebar - Lessons and slides */}
        <div className="left-sidebar">
          {/* Course info */}
          <div className="course-info">
            <div className="course-image"></div>
            <div className="course-details">
              <div className="course-title-row">
                <h2 className="course-title">{currentCourse.title}</h2>
                <button className="edit-button">
                  <Edit size={16} />
                </button>
              </div>
              <div className="course-meta">
                <div className="course-status">Draft</div>
                <div className="lesson-count">
                  {currentCourse.lessons?.length ?? 0} lesson{(currentCourse.lessons?.length ?? 0) !== 1 && "s"}
                </div>
              </div>
            </div>
          </div>

          {/* Lessons section */}
          <div className="lessons-section">
            <div className="section-header">
              <h3>Lessons</h3>
              <div className="section-actions">
                <button className="icon-button">
                  <MoreVertical size={16} />
                </button>
                <button className="icon-button">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Lessons list */}
            <div className="lessons-list">
              {(currentCourse.lessons ?? []).map((lesson) => (
                <div key={lesson.id} className={`lesson-item ${selectedLessonId === lesson.id ? "selected" : ""}`}>
                  <div className="lesson-header" onClick={() => setSelectedLessonId(lesson.id)}>
                    <FileText size={16} />
                    <div className="lesson-info">
                      <div className="lesson-title">{lesson.title}</div>
                      <div className="lesson-duration">{lesson.duration}</div>
                    </div>
                    {selectedLessonId === lesson.id && <div className="selected-indicator"></div>}
                  </div>

                  {/* Slides for this lesson */}
                  {selectedLessonId === lesson.id && (
                    <div
                      className="slides-list"
                      ref={slidesContainerRef}
                      onMouseLeave={handleSlidesContainerMouseLeave}
                    >
                      {lesson.slides.map((slide, index) => (
                        <div
                          key={slide.id}
                          className={`slide-item ${selectedSlideId === slide.id ? "selected" : ""}`}
                          onClick={() => setSelectedSlideId(slide.id)}
                          onMouseEnter={(e) => handleSlideItemMouseEnter(e, slide.id, index)}
                        >
                          <span className="slide-number">{index + 1}</span>
                          {slide.type === "end" ? (
                            <Lock size={14} className="slide-icon" />
                          ) : (
                            <FileText size={14} className="slide-icon" />
                          )}
                          <span className="slide-title">{slide.title}</span>
                          {slide.type !== "end" && (
                            <button className="slide-menu-button">
                              <MoreVertical size={14} />
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Insert slide button that appears between slides */}
                      {showInsertButton && (
                        <div
                          className="insert-slide-button"
                          style={{ top: insertButtonPosition.top }}
                          onClick={() => setSlideLibraryOpen(true)}
                        >
                          <Plus size={12} />
                        </div>
                      )}

                      {/* New slide button */}
                      <button className="new-slide-button" onClick={() => setSlideLibraryOpen(true)}>
                        <Plus size={14} />
                        <span>New slide</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center column - Preview */}
        <div className="center-preview">
          <div className="preview-container">
            {/* Mobile frame */}
            <div className="mobile-frame">
              {/* Slide content */}
              <div className="slide-content">
                {/* Header with lesson title and slide counter */}
                <div className="slide-header">
                  <div className="lesson-badge">
                    <div className="lesson-icon">SC</div>
                    <span className="lesson-name">{selectedLesson?.title || "Untitled lesson"}</span>
                  </div>
                  <div className="slide-counter">
                    {slidePosition.current} / {slidePosition.total}
                  </div>
                </div>

                {/* Slide content area */}
                <div className="slide-body">
                  {selectedSlide?.type === "title" && (
                    <div className="title-slide">
                      <h1>{selectedSlide.title}</h1>
                      <p>{selectedSlide.subtitle}</p>
                      <button onClick={goToNextSlide}>{selectedSlide.buttonText || "Continue"}</button>
                    </div>
                  )}

                  {selectedSlide?.type === "bulleted-list" && (
                    <div className="bulleted-list-slide">
                      <h2>{selectedSlide.title}</h2>
                      <ul>
                        {selectedSlide.items?.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                      <button onClick={goToNextSlide}>{selectedSlide.doneText || "Continue"}</button>
                    </div>
                  )}

                  {selectedSlide?.type === "comparison" && (
                    <div className="comparison-slide">
                      <h2 className="slide-title">{selectedSlide.title}</h2>
                      <div className="comparison-container" ref={comparisonContainerRef}>
                        <div className="comparison-slider">
                          <div className="product left-product" style={{ width: `${sliderPosition}%` }}>
                            <div className="product-image blue"></div>
                            <div className="product-info">
                              <div className="product-name">{selectedSlide.leftProduct?.name || "Product X"}</div>
                              <div className="product-tagline">
                                {selectedSlide.leftProduct?.tagline || "Brilliant. In every way."}
                              </div>
                            </div>
                          </div>
                          <div
                            className="slider-handle"
                            ref={sliderRef}
                            style={{ left: `${sliderPosition}%` }}
                            onMouseDown={() => setIsDragging(true)}
                          ></div>
                          <div className="product right-product" style={{ width: `${100 - sliderPosition}%` }}>
                            <div className="product-image yellow"></div>
                            <div className="product-info">
                              <div className="product-name">{selectedSlide.rightProduct?.name || "Product Y"}</div>
                              <div className="product-tagline">
                                {selectedSlide.rightProduct?.tagline || "Almost as good."}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="slide-button" onClick={goToNextSlide}>
                        {selectedSlide.doneText || "Continue"}
                      </button>
                    </div>
                  )}

                  {selectedSlide?.type === "horizontal-series" && (
                    <div className="horizontal-series-slide">
                      <h2 className="slide-title">{selectedSlide.title}</h2>
                      <div className="series-container">
                        <div className="series-content">
                          <div
                            className="series-items"
                            style={{ transform: `translateX(-${activeSeriesIndex * 100}%)` }}
                          >
                            <div className="series-item">
                              <div className="product-image blue"></div>
                              <div className="product-info">
                                <div className="product-name">Product X</div>
                                <div className="product-tagline">Brilliant. In every way.</div>
                              </div>
                            </div>
                            <div className="series-item">
                              <div className="product-image yellow"></div>
                              <div className="product-info">
                                <div className="product-name">Product Y</div>
                                <div className="product-tagline">Almost as good.</div>
                              </div>
                            </div>
                            <div className="series-item">
                              <div className="product-image light-blue"></div>
                              <div className="product-info">
                                <div className="product-name">Product Z</div>
                                <div className="product-tagline">The newest addition.</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="series-dots">
                          {[0, 1, 2].map((index) => (
                            <span
                              key={index}
                              className={`dot ${activeSeriesIndex === index ? "active" : ""}`}
                              onClick={() => setActiveSeriesIndex(index)}
                            ></span>
                          ))}
                        </div>
                      </div>
                      <button className="slide-button" onClick={goToNextSlide}>
                        {selectedSlide.doneText || "Continue"}
                      </button>
                    </div>
                  )}

                  {selectedSlide?.type === "media-collection" && (
                    <div className="media-collection-slide">
                      <h2 className="slide-title">{selectedSlide.title}</h2>
                      <div className="media-grid">
                        {selectedSlide.media && selectedSlide.media.length > 0 ? (
                          selectedSlide.media.map((item, index) => (
                            <div key={index} className="media-item">
                              {item.type === "image" ? (
                                <img src={item.url || "/placeholder.svg"} alt={item.name} className="media-image" />
                              ) : (
                                <div className="media-video">
                                  <video src={item.url} controls className="video-player"></video>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="media-placeholder">
                            <div className="placeholder-text">Upload media files to display here</div>
                          </div>
                        )}
                      </div>
                      <p className="media-caption">{selectedSlide.caption || "Select each item for more details"}</p>
                      <button className="slide-button" onClick={goToNextSlide}>
                        {selectedSlide.doneText || "Continue"}
                      </button>
                    </div>
                  )}

                  {selectedSlide?.type === "single-video" && (
                    <div className="single-video-slide">
                      <h2 className="slide-title">{selectedSlide.title}</h2>
                      {selectedSlide.video && selectedSlide.video.url ? (
                        <div className="video-container">
                          <video src={selectedSlide.video.url} controls className="video-player"></video>
                        </div>
                      ) : (
                        <div className="video-placeholder">
                          <div className="placeholder-icon">
                            <Video size={24} />
                          </div>
                          <div className="placeholder-text">Upload a video file</div>
                        </div>
                      )}
                      <p className="video-caption">{selectedSlide.caption || "Watch how our product works"}</p>
                      <button className="slide-button" onClick={goToNextSlide}>
                        {selectedSlide.doneText || "Continue"}
                      </button>
                    </div>
                  )}

                  {selectedSlide?.type === "end" && (
                    <div className="end-slide">
                      <div className="end-icon">
                        <Lock size={24} />
                      </div>
                      <h2 className="end-title">That's it!</h2>
                    </div>
                  )}
                </div>

                {/* Footer with navigation controls */}
                <div className="slide-footer">
                  <div className="footer-line"></div>
                </div>
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              className={`nav-arrow prev-arrow ${slidePosition.current <= 1 ? "disabled" : ""}`}
              onClick={goToPrevSlide}
              disabled={slidePosition.current <= 1}
            >
              <ArrowLeft size={16} />
            </button>
            <button
              className={`nav-arrow next-arrow ${slidePosition.current >= slidePosition.total ? "disabled" : ""}`}
              onClick={goToNextSlide}
              disabled={slidePosition.current >= slidePosition.total}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right sidebar - Editor */}
        <div className="right-sidebar">
          <div className="editor-header">
            <div className="editor-badge">STANDARD</div>
            <div className="editor-type">
              {selectedSlide
                ? selectedSlide.type === "title"
                  ? "Title"
                  : selectedSlide.type === "bulleted-list"
                    ? "Bulleted list"
                    : selectedSlide.type === "comparison"
                      ? "Comparison"
                      : selectedSlide.type === "horizontal-series"
                        ? "Horizontal series"
                        : selectedSlide.type === "media-collection"
                          ? "Media collection"
                          : selectedSlide.type === "single-video"
                            ? "Single video"
                            : "Slide"
                : "Slide"}
            </div>
          </div>

          <div className="editor-content">
            {/* Title slide editor */}
            {selectedSlide?.type === "title" && (
              <div className="title-editor">
                <div className="form-group">
                  <label className="form-label">TITLE</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.title}
                    onChange={(e) => handleUpdateSlide("title", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SUBTITLE</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.subtitle || ""}
                    onChange={(e) => handleUpdateSlide("subtitle", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">BUTTON TEXT</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.buttonText || ""}
                    onChange={(e) => handleUpdateSlide("buttonText", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Bulleted list editor */}
            {selectedSlide?.type === "bulleted-list" && (
              <div className="list-editor">
                <div className="form-group">
                  <label className="form-label">TITLE</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.title}
                    onChange={(e) => handleUpdateSlide("title", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <label className="form-label">LIST</label>
                  </div>

                  {selectedSlide.items?.map((item, index) => (
                    <div key={index} className="list-item-editor">
                      <div className="item-controls">
                        <button className="item-control-button">
                          <ChevronDown size={16} />
                        </button>
                        <button className="item-control-button delete" onClick={() => handleRemoveListItem(index)}>
                          <X size={16} />
                        </button>
                      </div>
                      <input
                        type="text"
                        className="text-input"
                        value={item}
                        onChange={(e) => handleUpdateListItem(index, e.target.value)}
                      />
                    </div>
                  ))}

                  <button className="add-item-button" onClick={handleAddListItem}>
                    <Plus size={16} />
                    Add an item
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">DONE TEXT</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.doneText || "Continue"}
                    onChange={(e) => handleUpdateSlide("doneText", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Comparison editor */}
            {selectedSlide?.type === "comparison" && (
              <div className="comparison-editor">
                <div className="form-group">
                  <label className="form-label">TITLE</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.title}
                    onChange={(e) => handleUpdateSlide("title", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">LEFT PRODUCT</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.leftProduct?.name || "Product X"}
                    onChange={(e) =>
                      handleUpdateSlide("leftProduct", {
                        ...selectedSlide.leftProduct,
                        name: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    className="text-input mt-2"
                    value={selectedSlide.leftProduct?.tagline || "Brilliant. In every way."}
                    onChange={(e) =>
                      handleUpdateSlide("leftProduct", {
                        ...selectedSlide.leftProduct,
                        tagline: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">RIGHT PRODUCT</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.rightProduct?.name || "Product Y"}
                    onChange={(e) =>
                      handleUpdateSlide("rightProduct", {
                        ...selectedSlide.rightProduct,
                        name: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    className="text-input mt-2"
                    value={selectedSlide.rightProduct?.tagline || "Almost as good."}
                    onChange={(e) =>
                      handleUpdateSlide("rightProduct", {
                        ...selectedSlide.rightProduct,
                        tagline: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">DONE TEXT</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.doneText || "Continue"}
                    onChange={(e) => handleUpdateSlide("doneText", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Horizontal series editor */}
            {selectedSlide?.type === "horizontal-series" && (
              <div className="horizontal-series-editor">
                <div className="form-group">
                  <label className="form-label">TITLE</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.title}
                    onChange={(e) => handleUpdateSlide("title", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">DONE TEXT</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.doneText || "Continue"}
                    onChange={(e) => handleUpdateSlide("doneText", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Media collection editor */}
            {selectedSlide?.type === "media-collection" && (
              <div className="media-editor">
                <div className="form-group">
                  <label className="form-label">TITLE</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.title}
                    onChange={(e) => handleUpdateSlide("title", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <label className="form-label">CONTENT</label>
                    <div className="media-type-buttons">
                      <button className="media-type-button">
                        <Video size={16} />
                      </button>
                      <button className="media-type-button">
                        <ImageIcon size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="upload-area">
                    <input
                      type="file"
                      id="media-upload"
                      className="file-input"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="media-upload" className="upload-button">
                      <Upload size={16} />
                      Upload file
                    </label>
                    <div className="upload-info">Max size: 150MB</div>
                    <div className="file-types">Supported file types: mp4, mov, webm, jpg, png, gif</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">CAPTION</label>
                  <textarea
                    className="textarea"
                    value={selectedSlide.caption || "Select each item for more details"}
                    onChange={(e) => handleUpdateSlide("caption", e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">DONE TEXT</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.doneText || "Continue"}
                    onChange={(e) => handleUpdateSlide("doneText", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Single video editor */}
            {selectedSlide?.type === "single-video" && (
              <div className="video-editor">
                <div className="form-group">
                  <label className="form-label">TITLE</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.title}
                    onChange={(e) => handleUpdateSlide("title", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <div className="section-header">
                    <label className="form-label">VIDEO</label>
                  </div>

                  <div className="upload-area">
                    <input
                      type="file"
                      id="video-upload"
                      className="file-input"
                      accept="video/*"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="video-upload" className="upload-button">
                      <Upload size={16} />
                      Upload file
                    </label>
                    <div className="upload-info">Max size: 150MB</div>
                    <div className="file-types">Supported file types: mp4, mov, webm</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">CAPTION</label>
                  <textarea
                    className="textarea"
                    value={selectedSlide.caption || "Watch how our product works"}
                    onChange={(e) => handleUpdateSlide("caption", e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">DONE TEXT</label>
                  <input
                    type="text"
                    className="text-input"
                    value={selectedSlide.doneText || "Continue"}
                    onChange={(e) => handleUpdateSlide("doneText", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide library dialog */}
      {slideLibraryOpen && (
        <div className="dialog-overlay" onClick={() => setSlideLibraryOpen(false)}>
          <div className="slide-library-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Slide library</h2>
              <div className="dialog-search">
                <div className="search-container">
                  <Search className="search-icon" />
                  <input type="text" placeholder="Search" className="search-input" />
                </div>
                <button className="close-button" onClick={() => setSlideLibraryOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="library-content">
              {/* Categories sidebar */}
              <div className="library-sidebar">
                <div className="category-section">
                  <h3 className="category-header">TEACH</h3>
                  <button
                    className={`category-button ${selectedCategory === "text" ? "selected" : ""}`}
                    onClick={() => setSelectedCategory("text")}
                  >
                    <FileText size={16} />
                    <span>Text</span>
                  </button>
                  <button
                    className={`category-button ${selectedCategory === "image" ? "selected" : ""}`}
                    onClick={() => setSelectedCategory("image")}
                  >
                    <ImageIcon size={16} />
                    <span>Image</span>
                  </button>
                  <button
                    className={`category-button ${selectedCategory === "media" ? "selected" : ""}`}
                    onClick={() => setSelectedCategory("media")}
                  >
              {/* Categories sidebar */}
              <div className="library-sidebar">
                <div className="category-section">
                  <h3 className="category-header">TEACH</h3>
                  <button
                    className={`category-button ${selectedCategory === "text" ? "selected" : ""}`}
                    onClick={() => setSelectedCategory("text")}
                  >
                    <FileText size={16} />
                    <span>Text</span>
                  </button>
                  <button
                    className={`category-button ${selectedCategory === "image" ? "selected" : ""}`}
                    onClick={() => setSelectedCategory("image")}
                  >
                    <ImageIcon size={16} />
                    <span>Image</span>
                  </button>
                  <button
                    className={`category-button ${selectedCategory === "media" ? "selected" : ""}`}
                    onClick={() => setSelectedCategory("media")}
                  >
                    <Video size={16} />
                    <span>Video</span>
                  </button>
                </div>
              </div>

              {/* Templates grid */}
              <div className="templates-grid">
                {slideTemplates
                  .filter((template) => template.category === selectedCategory)
                  .map((template) => (
                    <div
                      key={template.id}
                      className="template-card"
                      onClick={() => handleAddSlide(template.id, insertAfterSlideId)}
                    >
                      <div className="template-preview">{template.preview}</div>
                      <div className="template-info">
                        <h3 className="template-name">{template.name}</h3>
                        <p className="template-description">{template.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
