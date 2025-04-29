"use client"

import React, { useState, useRef } from "react"
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Edit, FileText, Filter, LayoutGrid, List, Lock, MoreVertical, Plus, Search, Settings, Upload, Video, X, ImageIcon } from 'lucide-react'
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
    type: 'image' | 'video'
    name: string
    url: string
  }[]
  video?: {
    id: string
    type: 'video'
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
    type: 'image' | 'video'
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
    type: 'video'
    name: string
    url: string
  }
  caption: string
  doneText: string
}

type Slide = SlideTitle | SlideEnd | SlideBulletedList | SlideComparison | SlideMediaCollection | SlideSingleVideo

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
    title: "Untitled course6",
    description: "",
    image: "blue-gradient",
    status: "Draft",
    lessonCount: 1
  },
  {
    id: "course2",
    title: "Fashcognitive",
    description: "teaching How to inspect",
    image: "blue-gradient",
    status: "Draft",
    lessonCount: 1
  },
  {
    id: "course3",
    title: "Untitled course",
    description: "",
    image: "blue-gradient",
    status: "Draft",
    lessonCount: 1
  }
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
          exitButton: false
        },
        {
          id: "slide2",
          type: "end",
          title: "That's it!"
        }
      ]
    }
  ]
}

// Slide templates for the library
const slideTemplates = [
  {
    id: "bulleted-list",
    name: "Bulleted list",
    description: "Show a list of bullet points",
    category: "text",
    preview: (
      <div className="slide-preview bulleted-list">
        <div className="preview-title">Bulleted list</div>
        <ul className="preview-list">
          <li>Has several points</li>
          <li>Displays each point with a bullet</li>
          <li>Is similar to a PowerPoint slide</li>
        </ul>
      </div>
    )
  },
  {
    id: "comparison",
    name: "Comparison",
    description: "Compare two text blocks",
    category: "text",
    preview: (
      <div className="slide-preview comparison">
        <div className="preview-title">Product X vs. Product Y</div>
        <div className="comparison-container">
          <div className="comparison-item blue">
            <div className="product-label">Product X</div>
            <div className="product-tagline">Brilliant. In every way.</div>
          </div>
          <div className="comparison-item yellow">
            <div className="product-label">Product Y</div>
            <div className="product-tagline">Almost as good.</div>
          </div>
        </div>
      </div>
    )
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
    )
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
    )
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
    )
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
    )
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
    )
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
    )
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
    )
  }
]

export default function Training() {
  // State for view (dashboard or editor)
  const [view, setView] = useState("dashboard")
  
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
  
  // State for slide navigation
  
const handleCreateCourse = (): void => {
  const newCourse: Course = {
    ...initialNewCourse,
    title: newCourseTitle,
    description: newCourseDescription,
    lessonCount: initialNewCourse.lessons ? initialNewCourse.lessons.length : 0
  }
  
  setCourses([...courses, newCourse])
  setCurrentCourse(newCourse)
  setCreateDialogOpen(false)
  setView("editor")
}
  
const handleAddSlide = (templateId: string, afterSlideId: string | null = null): void => {
  const template = slideTemplates.find(t => t.id === templateId)
  
  if (!template) return
  
  let newSlide: Slide = {
    id: `slide${Date.now()}`,
    type: template.id,
    title: template.name
  } as Slide
  
  if (template.id === "bulleted-list") {
    newSlide = {
      ...newSlide,
      items: [
        "Has several points",
        "Displays each point with a bullet",
        "Is similar to a PowerPoint slide"
      ],
      doneText: "Continue"
    } as SlideBulletedList
  } else if (template.id === "comparison") {
    newSlide = {
      ...newSlide,
      title: "Product X vs. Product Y",
      leftProduct: {
        name: "Product X",
        tagline: "Brilliant. In every way."
      },
      rightProduct: {
        name: "Product Y",
        tagline: "Almost as good."
      },
      doneText: "Continue"
    } as SlideComparison
  } else if (template.id === "media-collection") {
    newSlide = {
      ...newSlide,
      title: "Media Gallery",
      media: [],
      caption: "Select each item for more details",
      doneText: "Continue"
    } as SlideMediaCollection
  }
  
  const updatedLessons = currentCourse.lessons!.map(lesson => {
    if (lesson.id === selectedLessonId) {
      let newSlides = [...lesson.slides]
      
      if (afterSlideId) {
        // Insert after the specified slide
        const insertIndex = newSlides.findIndex(slide => slide.id === afterSlideId)
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
        slides: newSlides
      }
    }
    return lesson
  })
  
  setCurrentCourse({
    ...currentCourse,
    lessons: updatedLessons
  })
  
  setSelectedSlideId(newSlide.id)
  setSlideLibraryOpen(false)
  setInsertAfterSlideId(null)
  setShowInsertButton(false)
}
  
const handleUpdateSlide = (field: string, value: any): void => {
  const updatedLessons = currentCourse.lessons!.map(lesson => {
    if (lesson.id === selectedLessonId) {
      return {
        ...lesson,
        slides: lesson.slides.map(slide => {
          if (slide.id === selectedSlideId) {
            return {
              ...slide,
              [field]: value
            }
          }
          return slide
        })
      }
    }
    return lesson
  })
  
  setCurrentCourse({
    ...currentCourse,
    lessons: updatedLessons
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
    
    const currentIndex = selectedLesson.slides.findIndex(slide => slide.id === selectedSlideId)
    return {
      current: currentIndex + 1,
      total: selectedLesson.slides.length
    }
  }
  
  // Function to navigate to the next slide in preview
  const goToNextSlide = () => {
    if (!selectedLesson) return
    
    const currentIndex = selectedLesson.slides.findIndex(slide => slide.id === selectedSlideId)
    if (currentIndex < selectedLesson.slides.length - 1) {
      setSelectedSlideId(selectedLesson.slides[currentIndex + 1].id)
    }
  }
  
  // Function to navigate to the previous slide in preview
  const goToPrevSlide = () => {
    if (!selectedLesson) return
    
    const currentIndex = selectedLesson.slides.findIndex(slide => slide.id === selectedSlideId)
    if (currentIndex > 0) {
      setSelectedSlideId(selectedLesson.slides[currentIndex - 1].id)
    }
  }
  
const handleSlideItemMouseEnter = (e: React.MouseEvent<HTMLDivElement>, slideId: string, index: number): void => {
  if (slidesContainerRef.current) {
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = slidesContainerRef.current.getBoundingClientRect()
    
    setInsertButtonPosition({
      top: rect.bottom - containerRect.top
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
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (isImage || isVideo) {
        const mediaItem = {
          id: `media-${Date.now()}`,
          type: isImage ? 'image' : 'video',
          name: file.name,
          // In a real app, we would upload the file and get a URL
          url: URL.createObjectURL(file)
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
        <div className="top-nav">
          <div className="nav-content">
            <div className="nav-links">
              <button className="nav-link">Learn</button>
              <button className="nav-link active">Content</button>
            </div>
            <div className="nav-actions">
              <button className="icon-button">
                <Settings />
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="main-content">
          <div className="content-header">
            <h1>Content</h1>
            <button className="create-button" onClick={() => setCreateDialogOpen(true)}>
              <Plus />
              Create course
            </button>
          </div>
          
          {/* Tabs */}
          <div className="tabs">
            <button className="tab active">Courses</button>
          </div>
          
          {/* Controls */}
          <div className="controls">
            <div className="search-filters">
              <div className="search-container">
                <Search className="search-icon" />
                <input type="text" placeholder="Search" className="search-input" />
              </div>
              <button className="filter-button">
                <Filter />
                Filters
              </button>
            </div>
            <div className="view-controls">
              <span className="results-count">3 results</span>
              <button className="sort-button">
                Last modified (Newest)
                <ChevronDown />
              </button>
              <button className="view-button">
                <LayoutGrid />
              </button>
            </div>
          </div>
          
          {/* Course grid */}
          <div className="course-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card" onClick={() => {
                setCurrentCourse({...initialNewCourse, title: course.title, description: course.description})
                setView("editor")
              }}>
                <div className="card-image"></div>
                <div className="card-content">
                  <div className="card-label">
                    <BookOpen />
                    COURSE
                  </div>
                  <h3 className="card-title">{course.title}</h3>
                  {course.description && (
                    <p className="card-description">{course.description}</p>
                  )}
                  <div className="card-footer">
                    <div className="card-meta">
                      <span>GM</span>
                      <List />
                      <span>1</span>
                    </div>
                    <div className="card-status">{course.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Create course dialog */}
        {createDialogOpen && (
          <div className="dialog-overlay" onClick={() => setCreateDialogOpen(false)}>
            <div className="dialog" onClick={e => e.stopPropagation()}>
              <div className="dialog-header">
                <h2>Course details</h2>
                <button className="close-button" onClick={() => setCreateDialogOpen(false)}>
                  <X />
                </button>
              </div>
              <div className="dialog-content">
                <div className="upload-area">
                  <div className="upload-icon">
                    <Upload />
                  </div>
                  <div className="upload-icon">
                    <ImageIcon />
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
            <button className="back-button" onClick={() => setView("dashboard")}>
              <ArrowLeft />
              Back
            </button>
          </div>
          
          <div className="editor-tabs">
            <button className="editor-tab active">Edit</button>
            <button className="editor-tab">Set up</button>
            <button className="editor-tab">Publish</button>
          </div>
          
          <div className="header-right">
            <div className="saved-status">
              Saved
            </div>
            <button className="share-button">
              Share
            </button>
            <button className="next-button">
              Next: Set up
              <ArrowRight />
            </button>
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
                  <Edit />
                </button>
              </div>
              <div className="course-meta">
                <div className="course-status">Draft</div>
                <div className="lesson-count">
                  {currentCourse.lessons.length} lesson{currentCourse.lessons.length !== 1 && 's'}
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
                  <MoreVertical />
                </button>
                <button className="icon-button">
                  <Plus />
                </button>
              </div>
            </div>
            
            {/* Lessons list */}
            <div className="lessons-list">
              {currentCourse.lessons.map((lesson) => (
                <div 
                  key={lesson.id} 
                  className={`lesson-item ${selectedLessonId === lesson.id ? 'selected' : ''}`}
                >
                  <div 
                    className="lesson-header"
                    onClick={() => setSelectedLessonId(lesson.id)}
                  >
                    <FileText />
                    <div className="lesson-info">
                      <div className="lesson-title">{lesson.title}</div>
                      <div className="lesson-duration">{lesson.duration}</div>
                    </div>
                    {selectedLessonId === lesson.id && (
                      <div className="selected-indicator"></div>
                    )}
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
                          className={`slide-item ${selectedSlideId === slide.id ? 'selected' : ''}`}
                          onClick={() => setSelectedSlideId(slide.id)}
                          onMouseEnter={(e) => handleSlideItemMouseEnter(e, slide.id, index)}
                        >
                          <span className="slide-number">{index + 1}</span>
                          {slide.type === "end" ? (
                            <Lock className="slide-icon" />
                          ) : (
                            <FileText className="slide-icon" />
                          )}
                          <span className="slide-title">{slide.title}</span>
                          {slide.type !== "end" && (
                            <button className="slide-menu-button">
                              <MoreVertical />
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
                          <Plus />
                        </div>
                      )}
                      
                      {/* New slide button */}
                      <button 
                        className="new-slide-button"
                        onClick={() => setSlideLibraryOpen(true)}
                      >
                        <Plus />
                        New slide
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
                    <span className="lesson-name">
                      {selectedLesson?.title || "Untitled lesson"}
                    </span>
                  </div>
                  <div className="slide-counter">
                    {slidePosition.current} / {slidePosition.total}
                  </div>
                </div>
                
                {/* Slide content area */}
                <div className="slide-body">
                  {selectedSlide?.type === "title" && (
                    <div className="title-slide">
                      <h2 className="slide-title">{selectedSlide.title}</h2>
                      {selectedSlide.subtitle && (
                        <p className="slide-subtitle">{selectedSlide.subtitle}</p>
                      )}
                      <button className="slide-button" onClick={goToNextSlide}>
                        {selectedSlide.buttonText || "Continue"}
                      </button>
                    </div>
                  )}
                  
                  {selectedSlide?.type === "bulleted-list" && (
                    <div className="bulleted-list-slide">
                      <h2 className="slide-title">{selectedSlide.title}</h2>
                      <ul className="bullet-list">
                        {selectedSlide.items?.map((item, index) => (
                          <li key={index} className="bullet-item">
                            <span className="bullet">•</span>
                            <span className="item-text">{item}</span>
                          </li>
                        ))}
                      </ul>
                      <button className="slide-button" onClick={goToNextSlide}>
                        {selectedSlide.doneText || "Continue"}
                      </button>
                    </div>
                  )}
                  
                  {selectedSlide?.type === "comparison" && (
                    <div className="comparison-slide">
                      <h2 className="slide-title">{selectedSlide.title}</h2>
                      <div className="comparison-container">
                        <div className="comparison-slider">
                          <div className="product left-product">
                            <div className="product-image blue"></div>
                            <div className="product-info">
                              <div className="product-name">{selectedSlide.leftProduct?.name || "Product X"}</div>
                              <div className="product-tagline">{selectedSlide.leftProduct?.tagline || "Brilliant. In every way."}</div>
                            </div>
                          </div>
                          <div className="slider-handle"></div>
                          <div className="product right-product">
                            <div className="product-image yellow"></div>
                            <div className="product-info">
                              <div className="product-name">{selectedSlide.rightProduct?.name || "Product Y"}</div>
                              <div className="product-tagline">{selectedSlide.rightProduct?.tagline || "Almost as good."}</div>
                            </div>
                          </div>
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
                              {item.type === 'image' ? (
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
                      {selectedSlide.video ? (
                        <div className="video-container">
                          <video src={selectedSlide.video.url} controls className="video-player"></video>
                        </div>
                      ) : (
                        <div className="video-placeholder">
                          <div className="placeholder-icon">
                            <Video />
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
                        <Lock />
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
              className={`nav-arrow prev-arrow ${slidePosition.current <= 1 ? 'disabled' : ''}`}
              onClick={goToPrevSlide}
              disabled={slidePosition.current <= 1}
            >
              <ArrowLeft />
            </button>
            <button 
              className={`nav-arrow next-arrow ${slidePosition.current >= slidePosition.total ? 'disabled' : ''}`}
              onClick={goToNextSlide}
              disabled={slidePosition.current >= slidePosition.total}
            >
              <ArrowRight />
            </button>
          </div>
        </div>
        
        {/* Right sidebar - Editor */}
        <div className="right-sidebar">
          <div className="editor-header">
            <div className="editor-badge">STANDARD</div>
            <div className="editor-type">
              {selectedSlide?.type === "title" ? "Title" : 
               selectedSlide?.type === "bulleted-list" ? "Bulleted list" : 
               selectedSlide?.type === "comparison" ? "Comparison" :
               selectedSlide?.type === "media-collection" ? "Media collection" : 
               selectedSlide?.type === "single-video" ? "Single video" :
               "Slide"}
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
                          <ChevronDown />
                        </button>
                        <button 
                          className="item-control-button delete"
                          onClick={() => handleRemoveListItem(index)}
                        >
                          <X />
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
                  
                  <button 
                    className="add-item-button"
                    onClick={handleAddListItem}
                  >
                    <Plus />
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
                    onChange={(e) => handleUpdateSlide("leftProduct", {
                      ...selectedSlide.leftProduct,
                      name: e.target.value
                    })}
                  />
                  <input 
                    type="text"
                    className="text-input mt-2"
                    value={selectedSlide.leftProduct?.tagline || "Brilliant. In every way."} 
                    onChange={(e) => handleUpdateSlide("leftProduct", {
                      ...selectedSlide.leftProduct,
                      tagline: e.target.value
                    })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">RIGHT PRODUCT</label>
                  <input 
                    type="text"
                    className="text-input"
                    value={selectedSlide.rightProduct?.name || "Product Y"} 
                    onChange={(e) => handleUpdateSlide("rightProduct", {
                      ...selectedSlide.rightProduct,
                      name: e.target.value
                    })}
                  />
                  <input 
                    type="text"
                    className="text-input mt-2"
                    value={selectedSlide.rightProduct?.tagline || "Almost as good."} 
                    onChange={(e) => handleUpdateSlide("rightProduct", {
                      ...selectedSlide.rightProduct,
                      tagline: e.target.value
                    })}
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
                        <Video />
                      </button>
                      <button className="media-type-button">
                        <ImageIcon />
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
                      <Upload />
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
                      <Upload />
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
          <div className="slide-library-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Slide library</h2>
              <div className="dialog-search">
                <div className="search-container">
                  <Search className="search-icon" />
                  <input type="text" placeholder="Search" className="search-input" />
                </div>
                <button className="close-button" onClick={() => setSlideLibraryOpen(false)}>
                  <X />
                </button>
              </div>
            </div>
            
            <div className="library-content">
              {/* Categories sidebar */}
              <div className="library-sidebar">
                <div className="category-section">
                  <h3 className="category-header">TEACH</h3>
                  <button
                    className={`category-button ${selectedCategory === 'text' ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory('text')}
                  >
                    <FileText />
                    <span>Text</span>
                  </button>
                  <button
                    className={`category-button ${selectedCategory === 'image' ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory('image')}
                  >
                    <ImageIcon />
                    <span>Image</span>
                  </button>
                  <button
                    className={`category-button ${selectedCategory === 'media' ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory('media')}
                  >
                    <Video />
                    <span>Video</span>
                  </button>
                </div>
              </div>
              
              {/* Templates grid */}
              <div className="templates-grid">
                {slideTemplates
                  .filter(template => template.category === selectedCategory)
                  .map((template) => (
                    <div 
                      key={template.id}
                      className="template-card"
                      onClick={() => handleAddSlide(template.id, insertAfterSlideId)}
                    >
                      <div className="template-preview">
                        {template.preview}
                      </div>
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