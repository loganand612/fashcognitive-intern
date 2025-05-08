"use client"

import Link from "next/link";
import React, { useState, useRef, useEffect, RefObject } from "react";

// Define types for slides and lessons
interface Slide {
  id: number;
  type: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  items?: string[];
  before?: { content: string; label: string };
  after?: { content: string; label: string };
  quote?: string;
  author?: string;
  content?: string;
}

interface Lesson {
  id: number;
  title: string;
  duration: string;
  slides: Slide[];
}

// Slide type definitions
const SLIDE_TYPES: Record<string, Slide[]> = {
  TEXT: [
    {
      id: 1,
      type: "bulleted-list",
      title: "Bulleted list",
      items: ["Point 1", "Point 2"],
      buttonText: "Continue",
    },
    {
      id: 2,
      type: "comparison",
      title: "Product X",
      before: {
        content: "Brilliant in every way",
        label: "",
      },
      after: {
        content: "Our brilliant new sleek design allows the user to have unparalleled comfort when using the device",
        label: "",
      },
      buttonText: "Continue",
    },
    {
      id: 3,
      type: "expandable-list",
      title: "Learn more about our product range",
      items: [
        {
          title: "Product X",
          content:
            "Our brilliant new sleek design allows the user to have unparalleled comfort when using the device.",
        },
        {
          title: "Product Y",
          content: "Crystal clear display performs better than any of our competitors.",
        },
        {
          title: "Product Z",
          content: "Affordable and reliable for everyday use.",
        },
      ],
      buttonText: "SELECT AN ITEM TO SEE MORE",
    },
    {
      id: 4,
      type: "horizontal-series",
      title: "Horizontal series",
      content: "Show text blocks in order",
      buttonText: "Continue",
    },
    {
      id: 5,
      type: "quote",
      title: "Quote",
      quote: "Product X has defied my expectations.",
      author: "Satisfied customer",
      buttonText: "Continue",
    },
    {
      id: 6,
      type: "reveal",
      title: "Learn more about our product range",
      items: [
        {
          title: "Product X",
          description:
            "Our brilliant new sleek design allows the user to have unparalleled comfort when using the device.",
        },
        {
          title: "Product Y",
          description: "Crystal clear display performs better than any of our competitors.",
        },
        {
          title: "Product Z",
          description: "Affordable and reliable for everyday use.",
        },
      ],
      buttonText: "SELECT EACH ITEM TO FIND OUT MORE",
    },
    {
      id: 7,
      type: "scrolling-text",
      title: "Scrolling text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent quis lectus mattis, at posuere neque. Sed placerat diam sed vide eget erat convallis at posuere leo convallis. Sed blandit odio convallis suscipit elementum, ante ipsum cursus augue.",
      buttonText: "Continue",
    },
    {
      id: 8,
      type: "scrolling-mix",
      title: "About Product Z",
      content:
        "Product Z is our latest product in the Product line. While other products focus on capability, Product Z focuses on ease of use and big on capability. Don't believe us? Just see below!",
      buttonText: "Continue",
    },
    {
      id: 9,
      type: "title-slide",
      title: "A title slide",
      subtitle: "An optional subtitle",
      buttonText: "Ok, let's go!",
    },
  ],
  IMAGE: [
    {
      id: 10,
      type: "image-slide",
      title: "Image slide",
      subtitle: "An image with text",
      buttonText: "Continue",
    },
  ],
  VIDEO: [
    {
      id: 11,
      type: "video-slide",
      title: "Video slide",
      subtitle: "A video with text",
      buttonText: "Continue",
    },
  ],
}

export default function CreateTraining() {
  const [activeTab, setActiveTab] = useState("edit")
  const [courseTitle, setCourseTitle] = useState("Untitled course")
  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState(false)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [showSlideLibrary, setShowSlideLibrary] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSlideType, setSelectedSlideType] = useState("TEXT")

  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: 1,
      title: "Untitled lesson",
      duration: "0:00",
      slides: [
        {
          id: 1,
          type: "title-slide",
          title: "A title slide",
          subtitle: "An optional subtitle",
          buttonText: "Ok, let's go!",
        },
      ],
    },
  ])

  // Fixed ref typing
  const slideLibraryRef: RefObject<HTMLDivElement> = useRef(null)

  // Close slide library when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (slideLibraryRef.current && !slideLibraryRef.current.contains(event.target as Node)) {
        setShowSlideLibrary(false)
      }
    }

    if (showSlideLibrary) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showSlideLibrary])

  const addNewLesson = () => {
    const newLesson = {
      id: Date.now(),
      title: `Untitled lesson ${lessons.length + 1}`,
      duration: "0:00",
      slides: [
        {
          id: Date.now(),
          type: "title-slide",
          title: "A title slide",
          subtitle: "An optional subtitle",
          buttonText: "Ok, let's go!",
        },
      ],
    }
    setLessons([...lessons, newLesson])
    setCurrentLessonIndex(lessons.length)
    setCurrentSlideIndex(0)
  }

  // Fixed function parameter types
  const addNewSlide = (slideTemplate: Slide): void => {
    const updatedLessons = [...lessons]
    const newSlide: Slide = {
      id: Date.now(),
      ...slideTemplate,
    }

    updatedLessons[currentLessonIndex].slides.push(newSlide)
    setLessons(updatedLessons)
    setCurrentSlideIndex(updatedLessons[currentLessonIndex].slides.length - 1)
    setShowSlideLibrary(false)
  }

  const handleNextSlide = () => {
    const currentLesson = lessons[currentLessonIndex]
    if (currentSlideIndex < currentLesson.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    } else if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1)
      setCurrentSlideIndex(0)
    }
  }

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1)
      setCurrentSlideIndex(lessons[currentLessonIndex - 1].slides.length - 1)
    }
  }

  const updateSlideContent = (field: keyof Slide, value: any): void => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex][field] = value
    setLessons(updatedLessons)
  }

  const updateBulletedListItem = (index: number, value: string): void => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items![index] = value
    setLessons(updatedLessons)
  }

  const addBulletedListItem = (): void => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items!.push("New item")
    setLessons(updatedLessons)
  }

  const removeBulletedListItem = (index: number): void => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items!.splice(index, 1)
    setLessons(updatedLessons)
  }

  const updateComparisonContent = (section: string, field: string, value: string) => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex][section][field] = value
    setLessons(updatedLessons)
  }

  const updateExpandableListItem = (index: number, field: string, value: string) => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items[index][field] = value
    setLessons(updatedLessons)
  }

  const addExpandableListItem = () => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.push({
      title: "New Product",
      content: "Description goes here",
    })
    setLessons(updatedLessons)
  }

  const removeExpandableListItem = (index: number) => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.splice(index, 1)
    setLessons(updatedLessons)
  }

  const updateRevealItem = (index: number, field: string, value: string) => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items[index][field] = value
    setLessons(updatedLessons)
  }

  const addRevealItem = () => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.push({
      title: "New Product",
      description: "Description goes here",
    })
    setLessons(updatedLessons)
  }

  const removeRevealItem = (index: number) => {
    const updatedLessons = [...lessons]
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.splice(index, 1)
    setLessons(updatedLessons)
  }

  const selectLesson = (lessonIndex: number) => {
    setCurrentLessonIndex(lessonIndex)
    setCurrentSlideIndex(0)
  }

  const selectSlide = (slideIndex: number) => {
    setCurrentSlideIndex(slideIndex)
  }

  const updateLessonTitle = (index: number, title: string) => {
    const updatedLessons = [...lessons]
    updatedLessons[index].title = title
    setLessons(updatedLessons)
  }

  const currentLesson = lessons[currentLessonIndex]
  const currentSlide = currentLesson.slides[currentSlideIndex]

  const renderSlidePreview = () => {
    switch (currentSlide.type) {
      case "title-slide":
        return (
          <div className="slide-content">
            <h2 className="slide-title-preview">{currentSlide.title}</h2>
            <p className="slide-subtitle-preview">{currentSlide.subtitle}</p>
            <button className="slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "bulleted-list":
        return (
          <div className="slide-content">
            <h2 className="slide-title-preview">{currentSlide.title}</h2>
            <ul className="bulleted-list-preview">
              {currentSlide.items?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <button className="slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "comparison":
        return (
          <div className="slide-content">
            <h2 className="slide-title-preview">{currentSlide.title}</h2>
            <div className="comparison-container">
              <div className="comparison-box">
                <div className="comparison-content">{currentSlide.before?.content}</div>
              </div>
            </div>
            <button className="slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "expandable-list":
        return (
          <div className="slide-content">
            <h2 className="slide-title-preview">{currentSlide.title}</h2>
            <div className="expandable-list-preview">
              {currentSlide.items?.map((item, index) => (
                <div key={index} className="expandable-item">
                  <div className={`expandable-header ${index === 0 ? "expanded" : ""}`}>
                    <span>{item.title}</span>
                    <span className="expandable-icon">{index === 0 ? "−" : "+"}</span>
                  </div>
                  {index === 0 && <div className="expandable-content">{item.content}</div>}
                </div>
              ))}
            </div>
            <button className="slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "reveal":
        return (
          <div className="slide-content">
            <h2 className="slide-title-preview">{currentSlide.title}</h2>
            <div className="reveal-preview">
              <div className="reveal-item active">
                <div className="reveal-content">{currentSlide.items[0].description}</div>
              </div>
              {currentSlide.items.map((item, index) => (
                <div key={index} className="reveal-button">
                  <button>{item.title}</button>
                </div>
              ))}
            </div>
            <button className="slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "quote":
        return (
          <div className="slide-content">
            <div className="quote-container">
              <blockquote className="quote-text">{currentSlide.quote}</blockquote>
              <cite className="quote-author">{currentSlide.author}</cite>
            </div>
            <button className="slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "scrolling-text":
      case "scrolling-mix":
        return (
          <div className="slide-content">
            <h2 className="slide-title-preview">{currentSlide.title}</h2>
            <div className="scrolling-content">
              <p>{currentSlide.content}</p>
            </div>
            <button className="slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      default:
        return (
          <div className="slide-content">
            <h2 className="slide-title-preview">{currentSlide.title}</h2>
            <p className="slide-subtitle-preview">{currentSlide.subtitle || ""}</p>
            <button className="slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )
    }
  }

  const renderSlideEditor = () => {
    switch (currentSlide.type) {
      case "title-slide":
        return (
          <>
            <div className="form-group">
              <label className="form-label">TITLE</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SUBTITLE</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.subtitle}
                onChange={(e) => updateSlideContent("subtitle", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "bulleted-list":
        return (
          <>
            <div className="form-group">
              <label className="form-label">TITLE</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="form-section-header">
                <label className="form-label">LIST</label>
                <button className="form-section-toggle">−</button>
              </div>

              <div className="bulleted-list-editor">
                {currentSlide.items?.map((item, index) => (
                  <div key={index} className="bulleted-list-item">
                    <div className="item-controls">
                      <button className="item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      value={item}
                      onChange={(e) => updateBulletedListItem(index, e.target.value)}
                    />
                    <div className="item-actions">
                      <button className="item-copy">
                        <Copy size={16} />
                      </button>
                      <button className="item-delete" onClick={() => removeBulletedListItem(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="add-item-button" onClick={addBulletedListItem}>
                  <Plus size={16} /> Add an item
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">DONE TEXT</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "comparison":
        return (
          <>
            <div className="form-group">
              <label className="form-label">TITLE</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="form-section-header">
                <label className="form-label">BEFORE</label>
                <button className="form-section-toggle">−</button>
              </div>

              <div className="form-section-content">
                <label className="form-label">CONTENT</label>
                <textarea
                  className="form-textarea"
                  value={currentSlide.before?.content}
                  onChange={(e) => updateComparisonContent("before", "content", e.target.value)}
                />

                <label className="form-label">LABEL</label>
                <input
                  type="text"
                  className="form-input"
                  value={currentSlide.before?.label}
                  onChange={(e) => updateComparisonContent("before", "label", e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-section-header">
                <label className="form-label">AFTER</label>
                <button className="form-section-toggle">−</button>
              </div>

              <div className="form-section-content">
                <label className="form-label">CONTENT</label>
                <textarea
                  className="form-textarea"
                  value={currentSlide.after?.content}
                  onChange={(e) => updateComparisonContent("after", "content", e.target.value)}
                />

                <label className="form-label">LABEL</label>
                <input
                  type="text"
                  className="form-input"
                  value={currentSlide.after?.label}
                  onChange={(e) => updateComparisonContent("after", "label", e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "expandable-list":
        return (
          <>
            <div className="form-group">
              <label className="form-label">TITLE</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="form-section-header">
                <label className="form-label">LIST</label>
                <button className="form-section-toggle">−</button>
              </div>

              <div className="expandable-list-editor">
                {currentSlide.items?.map((item, index) => (
                  <div key={index} className="expandable-list-item-editor">
                    <div className="item-controls">
                      <button className="item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="item-fields">
                      <label className="form-label">TITLE</label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.title}
                        onChange={(e) => updateExpandableListItem(index, "title", e.target.value)}
                      />

                      <label className="form-label">CONTENT</label>
                      <textarea
                        className="form-textarea"
                        value={item.content}
                        onChange={(e) => updateExpandableListItem(index, "content", e.target.value)}
                      />
                    </div>

                    <div className="item-actions">
                      <button className="item-copy">
                        <Copy size={16} />
                      </button>
                      <button className="item-delete" onClick={() => removeExpandableListItem(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="add-item-button" onClick={addExpandableListItem}>
                  <Plus size={16} /> Add an item
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "reveal":
        return (
          <>
            <div className="form-group">
              <label className="form-label">TITLE</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="form-section-header">
                <label className="form-label">CONTENT</label>
                <button className="form-section-toggle">−</button>
              </div>

              <div className="reveal-editor">
                {currentSlide.items?.map((item, index) => (
                  <div key={index} className="reveal-item-editor">
                    <div className="item-controls">
                      <button className="item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="item-fields">
                      <label className="form-label">TITLE</label>
                      <input
                        type="text"
                        className="form-input"
                        value={item.title}
                        onChange={(e) => updateRevealItem(index, "title", e.target.value)}
                      />

                      <label className="form-label">DESCRIPTION</label>
                      <textarea
                        className="form-textarea"
                        value={item.description}
                        onChange={(e) => updateRevealItem(index, "description", e.target.value)}
                      />
                    </div>

                    <div className="item-actions">
                      <button className="item-copy">
                        <Copy size={16} />
                      </button>
                      <button className="item-delete" onClick={() => removeRevealItem(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="add-item-button" onClick={addRevealItem}>
                  <Plus size={16} /> Add an item
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "quote":
        return (
          <>
            <div className="form-group">
              <label className="form-label">QUOTE</label>
              <textarea
                className="form-textarea"
                value={currentSlide.quote}
                onChange={(e) => updateSlideContent("quote", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">AUTHOR</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.author}
                onChange={(e) => updateSlideContent("author", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "scrolling-text":
      case "scrolling-mix":
        return (
          <>
            <div className="form-group">
              <label className="form-label">TITLE</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">CONTENT</label>
              <textarea
                className="form-textarea"
                value={currentSlide.content}
                onChange={(e) => updateSlideContent("content", e.target.value)}
                rows={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      default:
        return (
          <>
            <div className="form-group">
              <label className="form-label">TITLE</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SUBTITLE</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.subtitle || ""}
                onChange={(e) => updateSlideContent("subtitle", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="create-training-container">
      {/* Top Navigation Bar */}
      <header className="header">
        <div className="back-button">
          <Link href="#" className="back-link">
            <ArrowLeft className="back-icon" />
            <span>Back</span>
          </Link>
        </div>

        <div className="tabs">
          <div className={`tab ${activeTab === "edit" ? "active" : ""}`} onClick={() => setActiveTab("edit")}>
            <span>Edit</span>
            {activeTab === "edit" && <Circle className="tab-indicator" />}
          </div>
          <div className={`tab ${activeTab === "setup" ? "active" : ""}`} onClick={() => setActiveTab("setup")}>
            <span>Set up</span>
            {activeTab === "setup" && <Circle className="tab-indicator" />}
          </div>
          <div className={`tab ${activeTab === "publish" ? "active" : ""}`} onClick={() => setActiveTab("publish")}>
            <span>Publish</span>
            {activeTab === "publish" && <Circle className="tab-indicator" />}
          </div>
        </div>

        <div className="action-buttons">
          <button className="share-button">Share</button>
          <button className="next-button">
            Next: Set up
            <ChevronRight className="next-icon" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          <div className="course-info">
            <div className="course-thumbnail"></div>
            <div className="course-details">
              {isEditingCourseTitle ? (
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  onBlur={() => setIsEditingCourseTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingCourseTitle(false)}
                  autoFocus
                  className="course-title-input"
                />
              ) : (
                <h2 className="course-title" onClick={() => setIsEditingCourseTitle(true)}>
                  {courseTitle}
                </h2>
              )}
              <div className="course-meta">
                <span className="course-status">Draft</span>
                <span className="lesson-count">
                  {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <button className="edit-button" onClick={() => setIsEditingCourseTitle(true)}>
              <Edit className="edit-icon" />
            </button>
          </div>

          <div className="lessons-header">
            <h3>Lessons</h3>
            <button className="add-lesson-button" onClick={addNewLesson}>
              <Plus className="add-icon" />
            </button>
          </div>

          <div className="lessons-list">
            {lessons.map((lesson, lessonIndex) => (
              <div
                key={lesson.id}
                className={`lesson-item ${lessonIndex === currentLessonIndex ? "active" : ""}`}
                onClick={() => selectLesson(lessonIndex)}
              >
                <div className="lesson-header">
                  <div className="lesson-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M12 8L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span
                    className="lesson-title"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newTitle = prompt("Enter lesson title:", lesson.title)
                      if (newTitle) updateLessonTitle(lessonIndex, newTitle)
                    }}
                  >
                    {lesson.title}
                  </span>
                </div>
                <div className="lesson-duration">{lesson.duration}</div>

                <div className="slides-list">
                  {lesson.slides.map((slide, slideIndex) => (
                    <div
                      key={slide.id}
                      className={`slide-item ${lessonIndex === currentLessonIndex && slideIndex === currentSlideIndex ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (lessonIndex === currentLessonIndex) {
                          selectSlide(slideIndex)
                        } else {
                          selectLesson(lessonIndex)
                          selectSlide(slideIndex)
                        }
                      }}
                    >
                      <span className="slide-number">{slideIndex + 1}</span>
                      {slideIndex === lesson.slides.length - 1 && lessonIndex === lessons.length - 1 && (
                        <Lock className="lock-icon" />
                      )}
                      <span className="slide-title">{slide.title}</span>
                    </div>
                  ))}
                  {lessonIndex === currentLessonIndex && (
                    <div className="new-slide" onClick={() => setShowSlideLibrary(true)}>
                      <Plus className="new-slide-icon" />
                      <span>New slide</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="content-area">
          <div className="mobile-preview">
            <div className="mobile-frame">
              <div className="mobile-header">
                <div className="lesson-title-preview">{currentLesson.title}</div>
                <div className="slide-counter">
                  {currentSlideIndex + 1} / {currentLesson.slides.length}
                </div>
              </div>

              {renderSlidePreview()}

              <div className="navigation-controls">
                {(currentSlideIndex > 0 || currentLessonIndex > 0) && (
                  <button className="prev-button" onClick={handlePrevSlide}>
                    <ChevronRight className="prev-icon" style={{ transform: "rotate(180deg)" }} />
                  </button>
                )}
                {(currentSlideIndex < currentLesson.slides.length - 1 || currentLessonIndex < lessons.length - 1) && (
                  <button className="next-button-preview" onClick={handleNextSlide}>
                    <ChevronRight className="next-icon-preview" />
                  </button>
                )}
              </div>

              <div className="progress-bar"></div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="right-sidebar">
            <div className="sidebar-header">
              <div className="standard-badge">STANDARD</div>
              <div className="content-type">
                {currentSlide.type === "title-slide"
                  ? "Title"
                  : currentSlide.type
                      .split("-")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
              </div>
            </div>

            {renderSlideEditor()}
          </div>
        </div>
      </div>

      {/* Slide Library Modal */}
      {showSlideLibrary && (
        <div className="slide-library-overlay">
          <div className="slide-library-modal" ref={slideLibraryRef}>
            <div className="slide-library-header">
              <h2>Slide library</h2>
              <div className="slide-library-search">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <button className="close-button" onClick={() => setShowSlideLibrary(false)}>
                <X className="close-icon" />
              </button>
            </div>

            <div className="slide-library-content">
              <div className="slide-library-sidebar">
                <h3 className="slide-library-category-header">TEACH</h3>
                <div
                  className={`slide-library-category ${selectedSlideType === "TEXT" ? "active" : ""}`}
                  onClick={() => setSelectedSlideType("TEXT")}
                >
                  <div className="category-icon text-icon"></div>
                  <span>Text</span>
                </div>
                <div
                  className={`slide-library-category ${selectedSlideType === "IMAGE" ? "active" : ""}`}
                  onClick={() => setSelectedSlideType("IMAGE")}
                >
                  <div className="category-icon image-icon"></div>
                  <span>Image</span>
                </div>
                <div
                  className={`slide-library-category ${selectedSlideType === "VIDEO" ? "active" : ""}`}
                  onClick={() => setSelectedSlideType("VIDEO")}
                >
                  <div className="category-icon video-icon"></div>
                  <span>Video</span>
                </div>
              </div>

              <div className="slide-library-templates">
                <div className="slide-templates-grid">
                  {SLIDE_TYPES[selectedSlideType]
                    .filter(
                      (template) =>
                        searchQuery === "" ||
                        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        template.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((template) => (
                      <div key={template.id} className="slide-template" onClick={() => addNewSlide(template)}>
                        <div className="slide-template-preview">
                          {template.id === 1 && (
                            <div className="template-preview-content bulleted-list-preview">
                              <ul>
                                <li>Has several points</li>
                                <li>Displays each point with a bullet</li>
                                <li>Is similar to a PowerPoint slide</li>
                              </ul>
                            </div>
                          )}
                          {template.id === 2 && (
                            <div className="template-preview-content comparison-preview">
                              <div className="preview-title">Product X</div>
                              <div className="preview-box"></div>
                            </div>
                          )}
                          {template.id === 3 && (
                            <div className="template-preview-content expandable-list-preview">
                              <div className="preview-title">Learn more about our product range</div>
                              <div className="preview-expandable-item">Product X</div>
                              <div className="preview-expandable-item">Product Y</div>
                              <div className="preview-expandable-item">Product Z</div>
                            </div>
                          )}
                          {template.id === 4 && (
                            <div className="template-preview-content horizontal-series-preview">
                              <div className="preview-dots">
                                <span className="dot active"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                              </div>
                            </div>
                          )}
                          {template.id === 5 && (
                            <div className="template-preview-content quote-preview">
                              <div className="preview-quote">Product X has defied my expectations.</div>
                              <div className="preview-author">Satisfied customer</div>
                            </div>
                          )}
                          {template.id === 6 && (
                            <div className="template-preview-content reveal-preview">
                              <div className="preview-title">Learn more about our product range</div>
                              <div className="preview-reveal-content"></div>
                              <div className="preview-reveal-buttons">
                                <div className="preview-button">Product Y</div>
                              </div>
                            </div>
                          )}
                          {template.id === 8 && (
                            <div className="template-preview-content scrolling-mix-preview">
                              <div className="preview-title">About Product Z</div>
                              <div className="preview-scrolling-content"></div>
                            </div>
                          )}
                          {template.id === 7 && (
                            <div className="template-preview-content scrolling-text-preview">
                              <div className="preview-title">Scrolling content</div>
                              <div className="preview-scrolling-lines"></div>
                            </div>
                          )}
                          {template.id === 9 && (
                            <div className="template-preview-content title-slide-preview">
                              <div className="preview-title">A title slide</div>
                              <div className="preview-subtitle">An optional subtitle</div>
                            </div>
                          )}
                          {template.id === 10 && (
                            <div className="template-preview-content image-slide-preview">
                              <div className="preview-image-placeholder"></div>
                            </div>
                          )}
                          {template.id === 11 && (
                            <div className="template-preview-content video-slide-preview">
                              <div className="preview-video-placeholder">
                                <div className="play-icon"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="slide-template-info">
                          <h4>{template.title}</h4>
                          <p>{template.subtitle}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
