"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useLocation } from "react-router-dom"
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Lock,
  Circle,
  Edit,
  X,
  Search,
  Copy,
  Trash2,
  Upload,
  ImageIcon,
  Video,
  MoreVertical,
} from "lucide-react"
import "./create-training.css"

// Slide type definitions
const SLIDE_TYPES: Record<string, Array<{ id: string; name: string; description: string; template: any }>> = {
  TEXT: [
    {
      id: "bulleted-list",
      name: "Bulleted list",
      description: "Show a list of bullet points",
      template: {
        type: "bulleted-list",
        title: "Bulleted list",
        description: "Optional description for this slide",
        items: ["Has a several points", "Displays each point with a bullet", "Is similar to a PowerPoint slide"],
        buttonText: "Continue",
      },
    },
    {
      id: "comparison",
      name: "Comparison",
      description: "Compare two text blocks",
      template: {
        type: "comparison",
        title: "Product X",
        description: "Optional description for this slide",
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
    },
    {
      id: "expandable-list",
      name: "Expandable list",
      description: "Show a list of concepts",
      template: {
        type: "expandable-list",
        title: "Learn more about our product range",
        description: "Optional description for this slide",
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
    },
    {
      id: "horizontal-series",
      name: "Horizontal series",
      description: "Show text blocks in order",
      template: {
        type: "horizontal-series",
        title: "Horizontal series",
        description: "Optional description for this slide",
        content: "Show text blocks in order",
        items: [
          { content: "First item in the series" },
          { content: "Second item in the series" },
          { content: "Third item in the series" },
        ],
        currentIndex: 0,
        buttonText: "Continue",
      },
    },
    {
      id: "quote",
      name: "Quote",
      description: "Show a quotation",
      template: {
        type: "quote",
        title: "Quote",
        description: "Optional description for this slide",
        quote: "Product X has defied my expectations.",
        author: "Satisfied customer",
        buttonText: "Continue",
      },
    },
    {
      id: "reveal",
      name: "Reveal",
      description: "Show a list of concepts",
      template: {
        type: "reveal",
        title: "Learn more about our product range",
        description: "Optional description for this slide",
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
        activeItem: 0,
        buttonText: "SELECT EACH ITEM TO FIND OUT MORE",
      },
    },
    {
      id: "scrolling-text",
      name: "Scrolling text",
      description: "Show long-form text",
      template: {
        type: "scrolling-text",
        title: "Scrolling text",
        description: "Optional description for this slide",
        content:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent quis lectus mattis, at posuere neque. Sed placerat diam sed vide eget erat convallis at posuere leo convallis. Sed blandit odio convallis suscipit elementum, ante ipsum cursus augue.",
        buttonText: "Continue",
      },
    },
    {
      id: "title-slide",
      name: "Title slide",
      description: "A simple title slide",
      template: {
        type: "title-slide",
        title: "A title slide",
        description: "Optional description for this slide",
        subtitle: "An optional subtitle",
        buttonText: "Ok, let's go!",
      },
    },
  ],
  IMAGE: [
    {
      id: "image-slide",
      name: "Image slide",
      description: "Show an image with text",
      template: {
        type: "image-slide",
        title: "Image slide",
        description: "Optional description for this slide",
        subtitle: "An image with text",
        image: null,
        buttonText: "Continue",
      },
    },
    {
      id: "comparison",
      name: "Comparison",
      description: "Compare two images",
      template: {
        type: "image-comparison",
        title: "Product X vs. Product Y",
        description: "Optional description for this slide",
        beforeImage: null,
        afterImage: null,
        sliderPosition: 50,
        buttonText: "Continue",
      },
    },
    {
      id: "horizontal-series",
      name: "Horizontal series",
      description: "Show images in order",
      template: {
        type: "image-horizontal-series",
        title: "Horizontal series",
        description: "Optional description for this slide",
        images: [null, null, null],
        currentIndex: 0,
        buttonText: "Continue",
      },
    },
    {
      id: "image-collection",
      name: "Image collection",
      description: "Show a grid of images",
      template: {
        type: "image-collection",
        title: "Example Image Collection",
        description: "Optional description for this slide",
        images: [null, null, null, null],
        buttonText: "Continue",
      },
    },
    {
      id: "image-map",
      name: "Image map",
      description: "Describe points on an image",
      template: {
        type: "image-map",
        title: "Image map",
        description: "Optional description for this slide",
        image: null,
        hotspots: [
          { x: 30, y: 30, title: "Feature 1", description: "Description of feature 1" },
          { x: 70, y: 70, title: "Feature 2", description: "Description of feature 2" },
        ],
        activeHotspot: null,
        buttonText: "Continue",
      },
    },
    {
      id: "image-stack",
      name: "Image stack",
      description: "Stack images to form one",
      template: {
        type: "image-stack",
        title: "Image stack",
        description: "Optional description for this slide",
        images: [null, null],
        currentIndex: 0,
        buttonText: "Continue",
      },
    },
    {
      id: "image-waypoints",
      name: "Image waypoints",
      description: "Highlight points on an image",
      template: {
        type: "image-waypoints",
        title: "Image waypoints",
        description: "Optional description for this slide",
        image: null,
        waypoints: [
          { x: 30, y: 30, label: "1" },
          { x: 70, y: 70, label: "2" },
        ],
        currentWaypoint: 0,
        buttonText: "Continue",
      },
    },
    {
      id: "media-collection",
      name: "Media collection",
      description: "Show up to three pieces of media",
      template: {
        type: "media-collection",
        title: "Media collection",
        description: "Optional description for this slide",
        media: [
          { type: "image", source: null },
          { type: "image", source: null },
          { type: "image", source: null },
        ],
        buttonText: "Continue",
      },
    },
  ],
  VIDEO: [
    {
      id: "video-slide",
      name: "Video slide",
      description: "Show a video with text",
      template: {
        type: "video-slide",
        title: "Video slide",
        description: "Optional description for this slide",
        subtitle: "A video with text",
        video: null,
        buttonText: "Continue",
      },
    },
    {
      id: "media-collection",
      name: "Media collection",
      description: "Show up to three pieces of media",
      template: {
        type: "media-collection",
        title: "Media collection",
        description: "Optional description for this slide",
        media: [
          { type: "video", source: null },
          { type: "image", source: null },
          { type: "image", source: null },
        ],
        buttonText: "Continue",
      },
    },
    {
      id: "video-collection",
      name: "Video collection",
      description: "Show a grid of videos",
      template: {
        type: "video-collection",
        title: "Video Collection",
        description: "Optional description for this slide",
        videos: [null, null, null, null],
        buttonText: "Continue",
      },
    },
    {
      id: "vimeo",
      name: "Vimeo",
      description: "Embed a video from Vimeo",
      template: {
        type: "vimeo",
        title: "Vimeo",
        description: "Optional description for this slide",
        vimeoUrl: "",
        buttonText: "Continue",
      },
    },
    {
      id: "youtube",
      name: "YouTube",
      description: "Embed a video from YouTube",
      template: {
        type: "youtube",
        title: "YouTube",
        description: "Optional description for this slide",
        youtubeUrl: "",
        buttonText: "Continue",
      },
    },
  ],
}

// Define types for our component
interface Lesson {
  id: number
  title: string
  duration: string
  slides: Slide[]
}

interface Slide {
  id: number
  type: string
  title: string
  subtitle?: string
  buttonText: string
  [key: string]: any // For additional properties based on slide type
}

// Update the component to handle many lessons properly
// Add this function to generate multiple lessons for testing
const generateDummyLessons = (count: number) => {
  const lessons = []
  for (let i = 1; i <= count; i++) {
    lessons.push({
      id: i,
      title: `Untitled lesson ${i}`,
      duration: "0:00",
      slides: [
        {
          id: Date.now() + i,
          type: "title-slide",
          title: "A title slide",
          subtitle: "An optional subtitle",
          description: i % 3 === 0 ? "Optional description for this slide" : "",
          buttonText: "Ok, let's go!",
        },
      ],
    })
  }
  return lessons
}

const CreateTraining: React.FC = () => {
  const location = useLocation();
  const [courseData, setCourseData] = useState({ 
    courseDescription: (location.state as { courseDescription?: string })?.courseDescription || "",
    courseTitle: (location.state as { courseTitle?: string })?.courseTitle || "",
    courseLogo: (location.state as { courseLogo?: string })?.courseLogo || ""
  });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  // ... existing state declarations ...

  useEffect(() => {
    if (courseData.courseDescription && lessons.length > 0 && lessons[0].slides.length > 0) {
      const updatedLessons = [...lessons];
      const firstSlide = updatedLessons[0].slides[0];

      // Update the subtitle with the course description
      if (firstSlide.type === "title-slide") {
        firstSlide.subtitle = courseData.courseDescription;
        setLessons(updatedLessons);
      }
    }
  }, [courseData, lessons]);

  const [activeTab, setActiveTab] = useState("edit")
  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState(false)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [showSlideLibrary, setShowSlideLibrary] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSlideType, setSelectedSlideType] = useState("TEXT")
  const [activeRevealItem, setActiveRevealItem] = useState(0)
  const [expandedItems, setExpandedItems] = useState([0])
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [horizontalSeriesIndex, setHorizontalSeriesIndex] = useState(0)
  const [imageStackIndex, setImageStackIndex] = useState(0)
  const [waypointIndex, setWaypointIndex] = useState(0)
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [slideToDelete, setSlideToDelete] = useState<number | null>(null)
  const [showAddSlideIndicator, setShowAddSlideIndicator] = useState<number | null>(null)
  // Add state for description visibility
  const [showDescription, setShowDescription] = useState(true)

  const sliderRef = useRef<HTMLDivElement>(null)
  const comparisonRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Replace the useState initialization for lessons with this:
  // Uncomment this line to test with many lessons
  // const [lessons, setLessons] = useState<Lesson[]>(generateDummyLessons(18));

  // Keep the original initialization for normal use
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
          description: "Optional description for this slide",
          buttonText: "Ok, let's go!",
        },
      ],
    },
  ])

  const slideLibraryRef = useRef<HTMLDivElement>(null)

  // Close slide library when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

  // Handle comparison slide dragging
  useEffect(() => {
    const slideType = lessons[currentLessonIndex]?.slides[currentSlideIndex]?.type
    if (slideType === "comparison" || slideType === "image-comparison") {
      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && comparisonRef.current) {
          const rect = comparisonRef.current.getBoundingClientRect()
          const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
          const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100))
          setSliderPosition(newPosition)

          // Update the slide data
          const updatedLessons = JSON.parse(JSON.stringify(lessons))
          updatedLessons[currentLessonIndex].slides[currentSlideIndex].sliderPosition = newPosition

          // Update CSS variable for proper clipping
          if (comparisonRef.current) {
            comparisonRef.current.style.setProperty("--slider-position", `${newPosition}%`)
          }

          setLessons(updatedLessons)
        }
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      const handleTouchMove = (e: TouchEvent) => {
        if (isDragging && comparisonRef.current && e.touches[0]) {
          const rect = comparisonRef.current.getBoundingClientRect()
          const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width))
          const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100))
          setSliderPosition(newPosition)

          // Update the slide data
          const updatedLessons = JSON.parse(JSON.stringify(lessons))
          updatedLessons[currentLessonIndex].slides[currentSlideIndex].sliderPosition = newPosition

          // Update CSS variable for proper clipping
          if (comparisonRef.current) {
            comparisonRef.current.style.setProperty("--slider-position", `${newPosition}%`)
          }

          setLessons(updatedLessons)
        }
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleMouseUp)
      }
    }
  }, [isDragging, currentLessonIndex, currentSlideIndex, lessons])

  // Handle scratch to reveal canvas
  useEffect(() => {
    const slideType = lessons[currentLessonIndex]?.slides[currentSlideIndex]?.type
    if (slideType === "scratch-to-reveal" && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      let isDrawing = false

      // Set canvas dimensions
      const resizeCanvas = () => {
        const container = canvas.parentElement
        if (container) {
          canvas.width = container.offsetWidth
          canvas.height = container.offsetHeight
        }
      }

      resizeCanvas()
      window.addEventListener("resize", resizeCanvas)

      // Draw functions
      const startDrawing = (e: MouseEvent | TouchEvent) => {
        isDrawing = true
        draw(e)
      }

      const stopDrawing = () => {
        isDrawing = false
        ctx.beginPath()
      }

      const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return

        const rect = canvas.getBoundingClientRect()
        let x, y

        if ("touches" in e) {
          x = e.touches[0].clientX - rect.left
          y = e.touches[0].clientY - rect.top
        } else {
          x = (e as MouseEvent).clientX - rect.left
          y = (e as MouseEvent).clientY - rect.top
        }

        ctx.globalCompositeOperation = "destination-out"
        ctx.lineWidth = 40
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y)

        // Update reveal percentage based on cleared pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixelData = imageData.data
        let clearedPixels = 0

        for (let i = 3; i < pixelData.length; i += 4) {
          if (pixelData[i] < 128) clearedPixels++
        }

        const totalPixels = canvas.width * canvas.height
        const revealPercent = Math.min(100, Math.round((clearedPixels / totalPixels) * 100))

        // Update the slide data
        const updatedLessons = JSON.parse(JSON.stringify(lessons))
        updatedLessons[currentLessonIndex].slides[currentSlideIndex].revealPercent = revealPercent
        setLessons(updatedLessons)
      }

      // Add event listeners
      canvas.addEventListener("mousedown", startDrawing as EventListener)
      canvas.addEventListener("mousemove", draw as EventListener)
      canvas.addEventListener("mouseup", stopDrawing)
      canvas.addEventListener("mouseout", stopDrawing)
      canvas.addEventListener("touchstart", startDrawing as EventListener)
      canvas.addEventListener("touchmove", draw as EventListener)
      canvas.addEventListener("touchend", stopDrawing)

      // Initialize canvas with top image
      const initCanvas = () => {
        const currentSlide = lessons[currentLessonIndex].slides[currentSlideIndex]
        if (currentSlide.topImage) {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          }
          img.src = currentSlide.topImage
        } else {
          ctx.fillStyle = "rgba(200, 200, 200, 0.8)"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = "rgba(150, 150, 150, 1)"
          ctx.font = "20px Arial"
          ctx.textAlign = "center"
          ctx.fillText("Scratch here to reveal", canvas.width / 2, canvas.height / 2)
        }
      }

      initCanvas()

      return () => {
        canvas.removeEventListener("mousedown", startDrawing as EventListener)
        canvas.removeEventListener("mousemove", draw as EventListener)
        canvas.removeEventListener("mouseup", stopDrawing)
        canvas.removeEventListener("mouseout", stopDrawing)
        canvas.removeEventListener("touchstart", startDrawing as EventListener)
        canvas.removeEventListener("touchmove", draw as EventListener)
        canvas.removeEventListener("touchend", stopDrawing)
        window.removeEventListener("resize", resizeCanvas)
      }
    }
  }, [currentLessonIndex, currentSlideIndex, lessons])

  // Update horizontal series index
  useEffect(() => {
    const slideType = lessons[currentLessonIndex]?.slides[currentSlideIndex]?.type
    if (slideType === "horizontal-series" || slideType === "image-horizontal-series") {
      const currentSlide = lessons[currentLessonIndex].slides[currentSlideIndex]
      setHorizontalSeriesIndex(currentSlide.currentIndex || 0)
    }
  }, [currentLessonIndex, currentSlideIndex, lessons])

  // Update image stack index
  useEffect(() => {
    const slideType = lessons[currentLessonIndex]?.slides[currentSlideIndex]?.type
    if (slideType === "image-stack") {
      const currentSlide = lessons[currentLessonIndex].slides[currentSlideIndex]
      setImageStackIndex(currentSlide.currentIndex || 0)
    }
  }, [currentLessonIndex, currentSlideIndex, lessons])

  // Update waypoint index
  useEffect(() => {
    const slideType = lessons[currentLessonIndex]?.slides[currentSlideIndex]?.type
    if (slideType === "image-waypoints") {
      const currentSlide = lessons[currentLessonIndex].slides[currentSlideIndex]
      setWaypointIndex(currentSlide.currentWaypoint || 0)
    }
  }, [currentLessonIndex, currentSlideIndex, lessons])

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

  const addNewSlide = (template: any, position: number | null = null) => {
    const newSlide = {
      id: Date.now(),
      ...template,
    }

    const updatedLessons = [...lessons]
    const currentLesson = updatedLessons[currentLessonIndex]

    if (position !== null) {
      currentLesson.slides.splice(position, 0, newSlide)
    } else {
      currentLesson.slides.push(newSlide)
    }

    setLessons(updatedLessons)
    setCurrentSlideIndex(position !== null ? position : currentLesson.slides.length - 1)
    setShowSlideLibrary(false)
    setShowAddSlideIndicator(null)
  }

  const deleteSlide = (index: number | null) => {
    if (index === null) return

    const updatedLessons = [...lessons]
    const currentLesson = updatedLessons[currentLessonIndex]

    if (currentLesson.slides.length <= 1) {
      // Don't delete the last slide
      setShowDeleteConfirm(false)
      setSlideToDelete(null)
      return
    }

    currentLesson.slides.splice(index, 1)
    setLessons(updatedLessons)

    // Adjust current slide index if needed
    if (index >= currentLesson.slides.length) {
      setCurrentSlideIndex(currentLesson.slides.length - 1)
    }

    setShowDeleteConfirm(false)
    setSlideToDelete(null)
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

  const updateSlideContent = (field: string, value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex][field] = value
    setLessons(updatedLessons)
  }

  const updateBulletedListItem = (index: number, value: string) => {
    const updatedLessons = [...lessons]
    const currentSlide = updatedLessons[currentLessonIndex].slides[currentSlideIndex]

    if (!currentSlide.items) currentSlide.items = []
    if (typeof currentSlide.items[0] === "string") {
      ;(currentSlide.items as string[])[index] = value
    } else {
      ;(currentSlide.items as any[])[index].title = value
    }

    setLessons(updatedLessons)
  }

  const addBulletedListItem = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.push("New item")
    setLessons(updatedLessons)
  }

  const removeBulletedListItem = (index: number) => {
    const updatedLessons = [...lessons]
    const currentSlide = updatedLessons[currentLessonIndex].slides[currentSlideIndex]

    if (!currentSlide.items) return
    currentSlide.items.splice(index, 1)

    setLessons(updatedLessons)
  }

  const updateComparisonContent = (section: string, field: string, value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex][section][field] = value
    setLessons(updatedLessons)
  }

  const updateExpandableListItem = (index: number, field: string, value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items[index][field] = value
    setLessons(updatedLessons)
  }

  const addExpandableListItem = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.push({
      title: "New Product",
      content: "Description goes here",
    })
    setLessons(updatedLessons)
  }

  const removeExpandableListItem = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.splice(index, 1)
    setLessons(updatedLessons)
  }

  const updateRevealItem = (index: number, field: string, value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items[index][field] = value
    setLessons(updatedLessons)
  }

  const addRevealItem = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.push({
      title: "New Product",
      description: "Description goes here",
    })
    setLessons(updatedLessons)
  }

  const removeRevealItem = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.splice(index, 1)
    setLessons(updatedLessons)
  }

  const toggleExpandItem = (index: number) => {
    if (expandedItems.includes(index)) {
      setExpandedItems(expandedItems.filter((i) => i !== index))
    } else {
      setExpandedItems([...expandedItems, index])
    }
  }

  const handleRevealItemClick = (index: number) => {
    setActiveRevealItem(index)
    // Also update in the slide data
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].activeItem = index
    setLessons(updatedLessons)
  }

  const handleImageUpload = (field: string, index?: number) => {
    // Simulate file upload
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*"

    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        const imageUrl = reader.result as string
        const updatedLessons = [...lessons]
        const currentSlide = updatedLessons[currentLessonIndex].slides[currentSlideIndex]

        if (index !== undefined && field === "images") {
          if (!currentSlide.images) currentSlide.images = []
          currentSlide.images[index] = imageUrl
        } else if (index !== undefined && field === "media") {
          if (!currentSlide.media) currentSlide.media = []
          currentSlide.media[index].source = imageUrl
        } else {
          ;(currentSlide as any)[field] = imageUrl
        }

        setLessons(updatedLessons)
      }
      reader.readAsDataURL(file)
    }

    fileInput.click()
  }

  const handleVideoUpload = (field: string, index: number | null = null) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "video/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const updatedLessons = JSON.parse(JSON.stringify(lessons))
          const currentSlide = updatedLessons[currentLessonIndex].slides[currentSlideIndex]

          if (index !== null) {
            // For array fields
            if (field === "videos") {
              currentSlide.videos[index] = event.target?.result
            } else if (field === "media") {
              currentSlide.media[index].source = event.target?.result
              currentSlide.media[index].type = "video"
            }
          } else {
            // For single fields
            currentSlide[field] = event.target?.result
          }

          setLessons(updatedLessons)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
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

  const updateHorizontalSeriesIndex = (index: number) => {
    setHorizontalSeriesIndex(index)

    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].currentIndex = index
    setLessons(updatedLessons)
  }

  const updateImageStackIndex = (index: number) => {
    setImageStackIndex(index)

    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].currentIndex = index
    setLessons(updatedLessons)
  }

  const updateWaypointIndex = (index: number) => {
    setWaypointIndex(index)

    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].currentWaypoint = index
    setLessons(updatedLessons)
  }

  const updateHorizontalSeriesItem = (index: number, value: string) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items[index].content = value
    setLessons(updatedLessons)
  }

  const addHorizontalSeriesItem = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.push({
      content: "New item in the series",
    })
    setLessons(updatedLessons)
  }

  const removeHorizontalSeriesItem = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.splice(index, 1)
    setLessons(updatedLessons)
  }

  const addHotspot = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].hotspots.push({
      x: 50,
      y: 50,
      title: "New Feature",
      description: "Description of new feature",
    })
    setLessons(updatedLessons)
  }

  const removeHotspot = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].hotspots.splice(index, 1)
    setLessons(updatedLessons)
  }

  const updateHotspot = (index: number, field: string, value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].hotspots[index][field] = value
    setLessons(updatedLessons)
  }

  const addWaypoint = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].waypoints.push({
      x: 50,
      y: 50,
      label: String(updatedLessons[currentLessonIndex].slides[currentSlideIndex].waypoints.length + 1),
    })
    setLessons(updatedLessons)
  }

  const removeWaypoint = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].waypoints.splice(index, 1)
    setLessons(updatedLessons)
  }

  const updateWaypoint = (index: number, field: string, value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].waypoints[index][field] = value
    setLessons(updatedLessons)
  }

  const addMediaItem = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    if (updatedLessons[currentLessonIndex].slides[currentSlideIndex].media.length < 3) {
      updatedLessons[currentLessonIndex].slides[currentSlideIndex].media.push({
        type: "image",
        source: null,
      })
      setLessons(updatedLessons)
    }
  }

  const removeMediaItem = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].media.splice(index, 1)
    setLessons(updatedLessons)
  }

  const handleYouTubeUrlChange = (url: string) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].youtubeUrl = url

    // Extract video ID for embedding
    const videoId = extractYouTubeVideoId(url)
    if (videoId) {
      updatedLessons[currentLessonIndex].slides[currentSlideIndex].youtubeVideoId = videoId
    } else {
      updatedLessons[currentLessonIndex].slides[currentSlideIndex].youtubeVideoId = null
    }

    setLessons(updatedLessons)
  }

  const handleVimeoUrlChange = (url: string) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons))
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].vimeoUrl = url

    // Extract video ID for embedding
    const videoId = extractVimeoVideoId(url)
    if (videoId) {
      updatedLessons[currentLessonIndex].slides[currentSlideIndex].vimeoVideoId = videoId
    } else {
      updatedLessons[currentLessonIndex].slides[currentSlideIndex].vimeoVideoId = null
    }

    setLessons(updatedLessons)
  }

  const extractYouTubeVideoId = (url: string) => {
    if (!url) return null

    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    return match && match[2].length === 11 ? match[2] : null
  }

  const extractVimeoVideoId = (url: string) => {
    if (!url) return null

    // Handle different Vimeo URL formats
    const regExp =
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/
    const match = url.match(regExp)

    return match ? match[1] : null
  }

  const currentLesson = lessons[currentLessonIndex]
  const currentSlide = currentLesson.slides[currentSlideIndex]

  // Modify the renderSlidePreview function to include the description box
  const renderSlidePreview = () => {
    const renderDescriptionBox = () => {
      if (!showDescription) return null
      return (
        <div className="create-training train-slide-description">
          {currentSlide.description || "Optional description for this slide"}
          <button
            className="create-training train-slide-description-remove"
            onClick={(e) => {
              e.stopPropagation()
              setShowDescription(false)
            }}
          >
            <X size={12} />
          </button>
        </div>
      )
    }

    switch (currentSlide.type) {
      case "title-slide":
        return (
          <div className="create-training train-slide-content">
            {renderDescriptionBox()}
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <p className="create-training train-slide-subtitle-preview">{currentSlide.subtitle}</p>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "bulleted-list":
        return (
          <div className="create-training train-slide-content">
            {renderDescriptionBox()}
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <ul className="create-training train-bulleted-list-preview">
              {currentSlide.items.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "comparison":
        return (
          <div className="create-training train-slide-content">
            {renderDescriptionBox()}
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div
              className="create-training train-comparison-container"
              ref={comparisonRef}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
              style={
                { "--slider-position": `${currentSlide.sliderPosition || sliderPosition}%` } as React.CSSProperties
              }
            >
              <div
                className="create-training train-comparison-slider"
                style={{ left: `${currentSlide.sliderPosition || sliderPosition}%` }}
              >
                <div
                  className="create-training train-comparison-slider-handle"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                ></div>
              </div>
              <div
                className="create-training train-comparison-before"
                style={{ width: `${currentSlide.sliderPosition || sliderPosition}%` }}
              >
                <div className="create-training train-comparison-content">{currentSlide.before.content}</div>
                {currentSlide.before.label && (
                  <div className="create-training train-comparison-label">{currentSlide.before.label}</div>
                )}
              </div>
              <div
                className="create-training train-comparison-after"
                style={{ width: `${100 - (currentSlide.sliderPosition || sliderPosition)}%` }}
              >
                <div className="create-training train-comparison-content">{currentSlide.after.content}</div>
                {currentSlide.after.label && (
                  <div className="create-training train-comparison-label">{currentSlide.after.label}</div>
                )}
              </div>
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "expandable-list":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-expandable-list-preview">
              {currentSlide.items.map((item: any, index: number) => (
                <div key={index} className="create-training train-expandable-item">
                  <div
                    className={`create-training train-expandable-header ${expandedItems.includes(index) ? "expanded" : ""}`}
                    onClick={() => toggleExpandItem(index)}
                  >
                    <span>{item.title}</span>
                    <span className="create-training train-expandable-icon">
                      {expandedItems.includes(index) ? "−" : "+"}
                    </span>
                  </div>
                  {expandedItems.includes(index) && (
                    <div className="create-training train-expandable-content">{item.content}</div>
                  )}
                </div>
              ))}
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "horizontal-series":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-horizontal-series-preview">
              <div className="create-training train-horizontal-series-item">
                {currentSlide.items[horizontalSeriesIndex]?.content || "No content"}
              </div>
              <div className="create-training train-horizontal-series-navigation">
                {currentSlide.items.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`create-training train-horizontal-series-dot ${index === horizontalSeriesIndex ? "active" : ""}`}
                    onClick={() => updateHorizontalSeriesIndex(index)}
                  ></div>
                ))}
              </div>
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "reveal":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-reveal-preview">
              <div className="create-training train-reveal-item active">
                <div className="create-training train-reveal-content">
                  {currentSlide.items[activeRevealItem]?.description || "Select an item below"}
                </div>
              </div>
              <div className="create-training train-reveal-buttons">
                {currentSlide.items.map((item: any, index: number) => (
                  <div key={index} className="create-training train-reveal-button">
                    <button
                      className={activeRevealItem === index ? "active" : ""}
                      onClick={() => handleRevealItemClick(index)}
                    >
                      {item.title}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "quote":
        return (
          <div className="create-training train-slide-content">
            <div className="create-training train-quote-container">
              <blockquote className="create-training train-quote-text">{currentSlide.quote}</blockquote>
              <cite className="create-training train-quote-author">{currentSlide.author}</cite>
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "scrolling-text":
      case "scrolling-mix":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-scrolling-content">
              <p>{currentSlide.content}</p>
              {currentSlide.media && (
                <div className="create-training train-scrolling-media">
                  {currentSlide.mediaType === "image" ? (
                    <img
                      src={currentSlide.media || "/placeholder.svg"}
                      alt="Content media"
                      className="create-training train-scrolling-image"
                    />
                  ) : (
                    <video src={currentSlide.media} controls className="create-training train-scrolling-video"></video>
                  )}
                </div>
              )}
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "image-slide":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <p className="create-training train-slide-subtitle-preview">{currentSlide.subtitle}</p>
            {currentSlide.image ? (
              <div className="create-training train-image-container">
                <img
                  src={currentSlide.image || "/placeholder.svg"}
                  alt={currentSlide.title}
                  className="create-training train-slide-image"
                />
              </div>
            ) : (
              <div className="create-training train-image-placeholder">
                <ImageIcon size={48} className="create-training train-placeholder-icon" />
              </div>
            )}
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "video-slide":
      case "single-video":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <p className="create-training train-slide-subtitle-preview">{currentSlide.subtitle || ""}</p>
            {currentSlide.video ? (
              <div className="create-training train-video-container">
                <video src={currentSlide.video} controls className="create-training train-slide-video"></video>
              </div>
            ) : (
              <div className="create-training train-video-placeholder">
                <Video size={48} className="create-training train-placeholder-icon" />
              </div>
            )}
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "image-comparison":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div
              className="create-training train-image-comparison-container"
              ref={comparisonRef}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              <div
                className="create-training train-comparison-slider"
                style={{ left: `${currentSlide.sliderPosition || sliderPosition}%` }}
              >
                <div
                  className="create-training train-comparison-slider-handle"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                ></div>
              </div>
              <div
                className="create-training train-comparison-before-image"
                style={{ width: `${currentSlide.sliderPosition || sliderPosition}%` }}
              >
                {currentSlide.beforeImage ? (
                  <img
                    src={currentSlide.beforeImage || "/placeholder.svg"}
                    alt="Before"
                    className="create-training train-comparison-img"
                  />
                ) : (
                  <div className="create-training train-image-placeholder">
                    <ImageIcon size={48} className="create-training train-placeholder-icon" />
                  </div>
                )}
              </div>
              <div
                className="create-training train-comparison-after-image"
                style={{ width: `${100 - (currentSlide.sliderPosition || sliderPosition)}%` }}
              >
                {currentSlide.afterImage ? (
                  <img
                    src={currentSlide.afterImage || "/placeholder.svg"}
                    alt="After"
                    className="create-training train-comparison-img"
                  />
                ) : (
                  <div className="create-training train-image-placeholder">
                    <ImageIcon size={48} className="create-training train-placeholder-icon" />
                  </div>
                )}
              </div>
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "scratch-to-reveal":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-scratch-reveal-container">
              <canvas
                ref={canvasRef}
                className="create-training train-scratch-canvas"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}
              ></canvas>
              <div className="create-training train-scratch-bottom" style={{ width: `100%` }}>
                {currentSlide.bottomImage ? (
                  <img
                    src={currentSlide.bottomImage || "/placeholder.svg"}
                    alt="Bottom layer"
                    className="create-training train-scratch-img"
                  />
                ) : (
                  <div className="create-training train-image-placeholder">
                    <ImageIcon size={48} className="create-training train-placeholder-icon" />
                  </div>
                )}
              </div>
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "image-horizontal-series":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-horizontal-series-preview">
              <div className="create-training train-image-container">
                {currentSlide.images[horizontalSeriesIndex] ? (
                  <img
                    src={currentSlide.images[horizontalSeriesIndex] || "/placeholder.svg"}
                    alt={`Image ${horizontalSeriesIndex + 1}`}
                    className="create-training train-slide-image"
                  />
                ) : (
                  <div className="create-training train-image-placeholder">
                    <ImageIcon size={48} className="create-training train-placeholder-icon" />
                  </div>
                )}
              </div>
              <div className="create-training train-horizontal-series-navigation">
                {currentSlide.images.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`create-training train-horizontal-series-dot ${index === horizontalSeriesIndex ? "active" : ""}`}
                    onClick={() => updateHorizontalSeriesIndex(index)}
                  ></div>
                ))}
              </div>
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "image-collection":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-image-collection-preview">
              {currentSlide.images.map((image: string | null, index: number) => (
                <div key={index} className="create-training train-image-collection-item">
                  {image ? (
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Image ${index + 1}`}
                      className="create-training train-image-collection-img"
                    />
                  ) : (
                    <div className="create-training train-image-placeholder">
                      <ImageIcon size={24} className="create-training train-placeholder-icon" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "image-map":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-image-map-container">
              {currentSlide.image ? (
                <img
                  src={currentSlide.image || "/placeholder.svg"}
                  alt="Image map"
                  className="create-training train-image-map-img"
                />
              ) : (
                <div className="create-training train-image-placeholder">
                  <ImageIcon size={48} className="create-training train-placeholder-icon" />
                </div>
              )}

              {currentSlide.image &&
                currentSlide.hotspots.map((hotspot: any, index: number) => (
                  <div
                    key={index}
                    className="create-training train-image-map-hotspot"
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    onClick={() => setActiveHotspot(activeHotspot === index ? null : index)}
                  >
                    {index + 1}
                  </div>
                ))}

              {activeHotspot !== null && currentSlide.hotspots[activeHotspot] && (
                <div
                  className="create-training train-image-map-tooltip"
                  style={{
                    left: `${Math.min(Math.max(currentSlide.hotspots[activeHotspot].x, 20), 80)}%`,
                    top: `${
                      currentSlide.hotspots[activeHotspot].y > 50
                        ? currentSlide.hotspots[activeHotspot].y - 20
                        : currentSlide.hotspots[activeHotspot].y + 20
                    }%`,
                  }}
                >
                  <div className="create-training train-image-map-tooltip-title">
                    {currentSlide.hotspots[activeHotspot].title}
                  </div>
                  <div>{currentSlide.hotspots[activeHotspot].description}</div>
                </div>
              )}
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "image-stack":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-image-stack-container">
              {currentSlide.images.map((image: string | null, index: number) => (
                <img
                  key={index}
                  src={image || "/placeholder.svg"}
                  alt={`Stack image ${index + 1}`}
                  className="create-training train-image-stack-img"
                  style={{
                    opacity: index === imageStackIndex ? 1 : 0,
                    position: index === 0 ? "relative" : "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
              ))}
              <div className="create-training train-horizontal-series-navigation">
                {currentSlide.images.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`create-training train-horizontal-series-dot ${index === imageStackIndex ? "active" : ""}`}
                    onClick={() => updateImageStackIndex(index)}
                  ></div>
                ))}
              </div>
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "image-waypoints":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-image-waypoints-container">
              {currentSlide.image ? (
                <img
                  src={currentSlide.image || "/placeholder.svg"}
                  alt="Waypoints image"
                  className="create-training train-image-waypoints-img"
                />
              ) : (
                <div className="create-training train-image-placeholder">
                  <ImageIcon size={48} className="create-training train-placeholder-icon" />
                </div>
              )}

              {currentSlide.image &&
                currentSlide.waypoints.map((waypoint: any, index: number) => (
                  <div
                    key={index}
                    className={`create-training train-image-waypoint ${index === waypointIndex ? "active" : ""}`}
                    style={{ left: `${waypoint.x}%`, top: `${waypoint.y}%` }}
                    onClick={() => updateWaypointIndex(index)}
                  >
                    {waypoint.label}
                  </div>
                ))}
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "media-collection":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-media-collection">
              {currentSlide.media.map((item: any, index: number) => (
                <div key={index} className="create-training train-media-item">
                  {item.source ? (
                    item.type === "image" ? (
                      <img
                        src={item.source || "/placeholder.svg"}
                        alt={`Media ${index + 1}`}
                        className="create-training train-media-image"
                      />
                    ) : (
                      <video src={item.source} controls className="create-training train-media-video"></video>
                    )
                  ) : (
                    <div className="create-training train-media-placeholder">
                      {item.type === "image" ? (
                        <ImageIcon size={24} className="create-training train-placeholder-icon" />
                      ) : (
                        <Video size={24} className="create-training train-placeholder-icon" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "video-collection":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <div className="create-training train-video-collection-preview">
              {currentSlide.videos.map((video: string | null, index: number) => (
                <div key={index} className="create-training train-video-collection-item">
                  {video ? (
                    <video src={video} controls className="create-training train-video-collection-video"></video>
                  ) : (
                    <div className="create-training train-video-placeholder">
                      <div className="create-training train-video-play-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "youtube":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            {currentSlide.youtubeVideoId ? (
              <div className="create-training train-embed-container">
                <iframe
                  src={`https://www.youtube.com/embed/${currentSlide.youtubeVideoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="create-training train-video-placeholder">
                <div className="create-training train-video-play-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                  </svg>
                </div>
                <div style={{ marginTop: "10px" }}>
                  {currentSlide.youtubeUrl ? (
                    <a href={currentSlide.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      Watch on YouTube
                    </a>
                  ) : (
                    <span>Enter YouTube URL</span>
                  )}
                </div>
              </div>
            )}
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      case "vimeo":
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            {currentSlide.vimeoVideoId ? (
              <div className="create-training train-embed-container">
                <iframe
                  src={`https://player.vimeo.com/video/${currentSlide.vimeoVideoId}`}
                  title="Vimeo video player"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="create-training train-video-placeholder">
                <div className="create-training train-video-play-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                  </svg>
                </div>
                <div style={{ marginTop: "10px" }}>
                  {currentSlide.vimeoUrl ? (
                    <a href={currentSlide.vimeoUrl} target="_blank" rel="noopener noreferrer">
                      Watch on Vimeo
                    </a>
                  ) : (
                    <span>Enter Vimeo URL</span>
                  )}
                </div>
              </div>
            )}
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )

      default:
        return (
          <div className="create-training train-slide-content">
            <h2 className="create-training train-slide-title-preview">{currentSlide.title}</h2>
            <p className="create-training train-slide-subtitle-preview">{currentSlide.subtitle || ""}</p>
            <button className="create-training train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
          </div>
        )
    }
  }

  // Add description field to the slide editor
  const renderSlideEditor = () => {
    switch (currentSlide.type) {
      case "title-slide":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">DESCRIPTION (OPTIONAL)</label>
              <textarea
                className="create-training train-form-textarea"
                value={currentSlide.description || ""}
                onChange={(e) => {
                  updateSlideContent("description", e.target.value)
                  if (!showDescription) setShowDescription(true)
                }}
                placeholder="Add an optional description for this slide"
              />
              {!showDescription && (
                <button
                  className="create-training train-add-item-button"
                  onClick={() => setShowDescription(true)}
                  style={{ marginTop: "0.5rem" }}
                >
                  <Plus size={16} /> Show description
                </button>
              )}
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">SUBTITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.subtitle}
                onChange={(e) => updateSlideContent("subtitle", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "bulleted-list":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">LIST</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-bulleted-list-editor">
                {currentSlide.items.map((item: string, index: number) => (
                  <div key={index} className="create-training train-bulleted-list-item">
                    <div className="create-training train-item-controls">
                      <button className="create-training train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="create-training train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      className="create-training train-form-input"
                      value={item}
                      onChange={(e) => updateBulletedListItem(index, e.target.value)}
                    />
                    <div className="create-training train-item-actions">
                      <button className="create-training train-item-copy">
                        <Copy size={16} />
                      </button>
                      <button
                        className="create-training train-item-delete"
                        onClick={() => removeBulletedListItem(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="create-training train-add-item-button" onClick={addBulletedListItem}>
                  <Plus size={16} /> Add an item
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "comparison":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">BEFORE</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-form-section-content">
                <label className="create-training train-form-label">CONTENT</label>
                <textarea
                  className="create-training train-form-textarea"
                  value={currentSlide.before.content}
                  onChange={(e) => updateComparisonContent("before", "content", e.target.value)}
                />

                <label className="create-training train-form-label">LABEL</label>
                <input
                  type="text"
                  className="create-training train-form-input"
                  value={currentSlide.before.label}
                  onChange={(e) => updateComparisonContent("before", "label", e.target.value)}
                />
              </div>
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">AFTER</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-form-section-content">
                <label className="create-training train-form-label">CONTENT</label>
                <textarea
                  className="create-training train-form-textarea"
                  value={currentSlide.after.content}
                  onChange={(e) => updateComparisonContent("after", "content", e.target.value)}
                />

                <label className="create-training train-form-label">LABEL</label>
                <input
                  type="text"
                  className="create-training train-form-input"
                  value={currentSlide.after.label}
                  onChange={(e) => updateComparisonContent("after", "label", e.target.value)}
                />
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "expandable-list":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">LIST</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-expandable-list-editor">
                {currentSlide.items.map((item: any, index: number) => (
                  <div key={index} className="create-training train-expandable-list-item-editor">
                    <div className="create-training train-item-controls">
                      <button className="create-training train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="create-training train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="create-training train-item-fields">
                      <label className="create-training train-form-label">TITLE</label>
                      <input
                        type="text"
                        className="create-training train-form-input"
                        value={item.title}
                        onChange={(e) => updateExpandableListItem(index, "title", e.target.value)}
                      />

                      <label className="create-training train-form-label">CONTENT</label>
                      <textarea
                        className="create-training train-form-textarea"
                        value={item.content}
                        onChange={(e) => updateExpandableListItem(index, "content", e.target.value)}
                      />
                    </div>

                    <div className="create-training train-item-actions">
                      <button className="create-training train-item-copy">
                        <Copy size={16} />
                      </button>
                      <button
                        className="create-training train-item-delete"
                        onClick={() => removeExpandableListItem(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="create-training train-add-item-button" onClick={addExpandableListItem}>
                  <Plus size={16} /> Add an item
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "horizontal-series":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">ITEMS</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-expandable-list-editor">
                {currentSlide.items.map((item: any, index: number) => (
                  <div key={index} className="create-training train-expandable-list-item-editor">
                    <div className="create-training train-item-controls">
                      <button className="create-training train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="create-training train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="create-training train-item-fields">
                      <label className="create-training train-form-label">CONTENT</label>
                      <textarea
                        className="create-training train-form-textarea"
                        value={item.content}
                        onChange={(e) => updateHorizontalSeriesItem(index, e.target.value)}
                      />
                    </div>

                    <div className="create-training train-item-actions">
                      <button className="create-training train-item-copy">
                        <Copy size={16} />
                      </button>
                      <button
                        className="create-training train-item-delete"
                        onClick={() => removeHorizontalSeriesItem(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="create-training train-add-item-button" onClick={addHorizontalSeriesItem}>
                  <Plus size={16} /> Add an item
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "reveal":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">CONTENT</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-reveal-editor">
                {currentSlide.items.map((item: any, index: number) => (
                  <div key={index} className="create-training train-reveal-item-editor">
                    <div className="create-training train-item-controls">
                      <button className="create-training train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="create-training train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="create-training train-item-fields">
                      <label className="create-training train-form-label">TITLE</label>
                      <input
                        type="text"
                        className="create-training train-form-input"
                        value={item.title}
                        <Copy size={16} />
                      </button>
                      <button className="create-training train-item-delete" onClick={() => removeRevealItem(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="create-training train-add-item-button" onClick={addRevealItem}>
                  <Plus size={16} /> Add an item
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "quote":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">QUOTE</label>
              <textarea
                className="create-training train-form-textarea"
                value={currentSlide.quote}
                onChange={(e) => updateSlideContent("quote", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">AUTHOR</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.author}
                onChange={(e) => updateSlideContent("author", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
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
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">CONTENT</label>
              <textarea
                className="create-training train-form-textarea"
                value={currentSlide.content}
                onChange={(e) => updateSlideContent("content", e.target.value)}
                rows={6}
              />
            </div>

            {currentSlide.type === "scrolling-mix" && (
              <div className="create-training train-form-group">
                <label className="create-training train-form-label">MEDIA</label>
                <div className="create-training train-media-upload">
                  <div className="create-training train-media-preview">
                    {currentSlide.media ? (
                      currentSlide.mediaType === "image" ? (
                        <img
                          src={currentSlide.media || "/placeholder.svg"}
                          alt="Media preview"
                          className="create-training train-media-preview-img"
                        />
                      ) : (
                        <video
                          src={currentSlide.media}
                          className="create-training train-media-preview-video"
                          controls
                        ></video>
                      )
                    ) : (
                      <div className="create-training train-media-placeholder">
                        <Upload size={24} />
                        <span>Upload media</span>
                      </div>
                    )}
                  </div>
                  <div className="create-training train-media-buttons">
                    <button
                      className="create-training train-media-upload-button"
                      onClick={() => {
                        handleImageUpload("media")
                        updateSlideContent("mediaType", "image")
                      }}
                    >
                      <ImageIcon size={16} />
                      <span>Upload Image</span>
                    </button>
                    <button
                      className="create-training train-media-upload-button"
                      onClick={() => {
                        handleVideoUpload("media")
                        updateSlideContent("mediaType", "video")
                      }}
                    >
                      <Video size={16} />
                      <span>Upload Video</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "image-slide":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">SUBTITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.subtitle || ""}
                onChange={(e) => updateSlideContent("subtitle", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">IMAGE</label>
              <div className="create-training train-media-upload">
                <div className="create-training train-media-preview">
                  {currentSlide.image ? (
                    <img
                      src={currentSlide.image || "/placeholder.svg"}
                      alt="Image preview"
                      className="create-training train-media-preview-img"
                    />
                  ) : (
                    <div className="create-training train-media-placeholder">
                      <Upload size={24} />
                      <span>Upload image</span>
                    </div>
                  )}
                </div>
                <button
                  className="create-training train-media-upload-button"
                  onClick={() => handleImageUpload("image")}
                >
                  <ImageIcon size={16} onClick={() => handleImageUpload("image")} />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "video-slide":
      case "single-video":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">SUBTITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.subtitle || ""}
                onChange={(e) => updateSlideContent("subtitle", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">VIDEO</label>
              <div className="create-training train-media-upload">
                <div className="create-training train-media-preview">
                  {currentSlide.video ? (
                    <video
                      src={currentSlide.video}
                      controls
                      className="create-training train-media-preview-video"
                    ></video>
                  ) : (
                    <div className="create-training train-media-placeholder">
                      <Upload size={24} />
                      <span>Upload video</span>
                    </div>
                  )}
                </div>
                <button
                  className="create-training train-media-upload-button"
                  onClick={() => handleVideoUpload("video")}
                >
                  <Video size={16} />
                  <span>Upload Video</span>
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "image-comparison":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">BEFORE IMAGE</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-media-upload">
                <div className="create-training train-media-preview">
                  {currentSlide.beforeImage ? (
                    <img
                      src={currentSlide.beforeImage || "/placeholder.svg"}
                      alt="Before image"
                      className="create-training train-media-preview-img"
                    />
                  ) : (
                    <div className="create-training train-media-placeholder">
                      <Upload size={24} />
                      <span>Upload image</span>
                    </div>
                  )}
                </div>
                <button
                  className="create-training train-media-upload-button"
                  onClick={() => handleImageUpload("beforeImage")}
                >
                  <ImageIcon size={16} />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">AFTER IMAGE</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-media-upload">
                <div className="create-training train-media-preview">
                  {currentSlide.afterImage ? (
                    <img
                      src={currentSlide.afterImage || "/placeholder.svg"}
                      alt="After image"
                      className="create-training train-media-preview-img"
                    />
                  ) : (
                    <div className="create-training train-media-placeholder">
                      <Upload size={24} />
                      <span>Upload image</span>
                    </div>
                  )}
                </div>
                <button
                  className="create-training train-media-upload-button"
                  onClick={() => handleImageUpload("afterImage")}
                >
                  <ImageIcon size={16} />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "scratch-to-reveal":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">TOP IMAGE (TO SCRATCH)</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-media-upload">
                <div className="create-training train-media-preview">
                  {currentSlide.topImage ? (
                    <img
                      src={currentSlide.topImage || "/placeholder.svg"}
                      alt="Top image"
                      className="create-training train-media-preview-img"
                    />
                  ) : (
                    <div className="create-training train-media-placeholder">
                      <Upload size={24} />
                      <span>Upload image</span>
                    </div>
                  )}
                </div>
                <button
                  className="create-training train-media-upload-button"
                  onClick={() => handleImageUpload("topImage")}
                >
                  <ImageIcon size={16} />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">BOTTOM IMAGE (TO REVEAL)</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-media-upload">
                <div className="create-training train-media-preview">
                  {currentSlide.bottomImage ? (
                    <img
                      src={currentSlide.bottomImage || "/placeholder.svg"}
                      alt="Bottom image"
                      className="create-training train-media-preview-img"
                    />
                  ) : (
                    <div className="create-training train-media-placeholder">
                      <Upload size={24} />
                      <span>Upload image</span>
                    </div>
                  )}
                </div>
                <button
                  className="create-training train-media-upload-button"
                  onClick={() => handleImageUpload("bottomImage")}
                >
                  <ImageIcon size={16} />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "image-horizontal-series":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">IMAGES</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-expandable-list-editor">
                {currentSlide.images.map((image: string | null, index: number) => (
                  <div key={index} className="create-training train-expandable-list-item-editor">
                    <div className="create-training train-item-controls">
                      <button className="create-training train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="create-training train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="create-training train-item-fields">
                      <label className="create-training train-form-label">IMAGE {index + 1}</label>
                      <div className="create-training train-media-upload">
                        <div className="create-training train-media-preview">
                          {image ? (
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Image ${index + 1}`}
                              className="create-training train-media-preview-img"
                            />
                          ) : (
                            <div className="create-training train-media-placeholder">
                              <Upload size={24} />
                              <span>Upload image</span>
                            </div>
                          )}
                        </div>
                        <button
                          className="create-training train-media-upload-button"
                          onClick={() => handleImageUpload("images", index)}
                        >
                          <ImageIcon size={16} />
                          <span>Upload Image</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className="create-training train-add-item-button"
                  onClick={() => {
                    const updatedLessons = JSON.parse(JSON.stringify(lessons))
                    updatedLessons[currentLessonIndex].slides[currentSlideIndex].images.push(null)
                    setLessons(updatedLessons)
                  }}
                >
                  <Plus size={16} /> Add an image
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "image-collection":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">IMAGES</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-expandable-list-editor">
                {currentSlide.images.map((image: string | null, index: number) => (
                  <div key={index} className="create-training train-expandable-list-item-editor">
                    <div className="create-training train-item-fields">
                      <label className="create-training train-form-label">IMAGE {index + 1}</label>
                      <div className="create-training train-media-upload">
                        <div className="create-training train-media-preview">
                          {image ? (
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Image ${index + 1}`}
                              className="create-training train-media-preview-img"
                            />
                          ) : (
                            <div className="create-training train-media-placeholder">
                              <Upload size={24} />
                              <span>Upload image</span>
                            </div>
                          )}
                        </div>
                        <button
                          className="create-training train-media-upload-button"
                          onClick={() => handleImageUpload("images", index)}
                        >
                          <ImageIcon size={16} />
                          <span>Upload Image</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className="create-training train-add-item-button"
                  onClick={() => {
                    const updatedLessons = JSON.parse(JSON.stringify(lessons))
                    updatedLessons[currentLessonIndex].slides[currentSlideIndex].images.push(null)
                    setLessons(updatedLessons)
                  }}
                >
                  <Plus size={16} /> Add an image
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "image-map":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BACKGROUND IMAGE</label>
              <div className="create-training train-media-upload">
                <div className="create-training train-media-preview">
                  {currentSlide.image ? (
                    <img
                      src={currentSlide.image || "/placeholder.svg"}
                      alt="Background image"
                      className="create-training train-media-preview-img"
                    />
                  ) : (
                    <div className="create-training train-media-placeholder">
                      <Upload size={24} />
                      <span>Upload image</span>
                    </div>
                  )}
                </div>
                <button
                  className="create-training train-media-upload-button"
                  onClick={() => handleImageUpload("image")}
                >
                  <ImageIcon size={16} />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">HOTSPOTS</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-expandable-list-editor">
                {currentSlide.hotspots.map((hotspot: any, index: number) => (
                  <div key={index} className="create-training train-expandable-list-item-editor">
                    <div className="create-training train-item-controls">
                      <button className="create-training train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="create-training train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="create-training train-item-fields">
                      <label className="create-training train-form-label">TITLE</label>
                      <input
                        type="text"
                        className="create-training train-form-input"
                        value={hotspot.title}
                        onChange={(e) => updateHotspot(index, "title", e.target.value)}
                      />

                      <label className="create-training train-form-label">DESCRIPTION</label>
                      <textarea
                        className="create-training train-form-textarea"
                        value={hotspot.description}
                        onChange={(e) => updateHotspot(index, "description", e.target.value)}
                      />

                      <div className="create-training train-form-row">
                        <div className="create-training train-form-column">
                          <label className="create-training train-form-label">X POSITION (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="create-training train-form-input"
                            value={hotspot.x}
                            onChange={(e) => updateHotspot(index, "x", Number(e.target.value))}
                          />
                        </div>
                        <div className="create-training train-form-column">
                          <label className="create-training train-form-label">Y POSITION (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="create-training train-form-input"
                            value={hotspot.y}
                            onChange={(e) => updateHotspot(index, "y", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="create-training train-item-actions">
                      <button className="create-training train-item-delete" onClick={() => removeHotspot(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="create-training train-add-item-button" onClick={addHotspot}>
                  <Plus size={16} /> Add a hotspot
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "image-stack":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">IMAGES</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-expandable-list-editor">
                {currentSlide.images.map((image: string | null, index: number) => (
                  <div key={index} className="create-training train-expandable-list-item-editor">
                    <div className="create-training train-item-controls">
                      <button className="create-training train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="create-training train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="create-training train-item-fields">
                      <label className="create-training train-form-label">IMAGE {index + 1}</label>
                      <div className="create-training train-media-upload">
                        <div className="create-training train-media-preview">
                          {image ? (
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Image ${index + 1}`}
                              className="create-training train-media-preview-img"
                            />
                          ) : (
                            <div className="create-training train-media-placeholder">
                              <Upload size={24} />
                              <span>Upload image</span>
                            </div>
                          )}
                        </div>
                        <button
                          className="create-training train-media-upload-button"
                          onClick={() => handleImageUpload("images", index)}
                        >
                          <ImageIcon size={16} />
                          <span>Upload Image</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className="create-training train-add-item-button"
                  onClick={() => {
                    const updatedLessons = JSON.parse(JSON.stringify(lessons))
                    updatedLessons[currentLessonIndex].slides[currentSlideIndex].images.push(null)
                    setLessons(updatedLessons)
                  }}
                >
                  <Plus size={16} /> Add an image
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "image-waypoints":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BACKGROUND IMAGE</label>
              <div className="create-training train-media-upload">
                <div className="create-training train-media-preview">
                  {currentSlide.image ? (
                    <img
                      src={currentSlide.image || "/placeholder.svg"}
                      alt="Background image"
                      className="create-training train-media-preview-img"
                    />
                  ) : (
                    <div className="create-training train-media-placeholder">
                      <Upload size={24} />
                      <span>Upload image</span>
                    </div>
                  )}
                </div>
                <button
                  className="create-training train-media-upload-button"
                  onClick={() => handleImageUpload("image")}
                >
                  <ImageIcon size={16} />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">WAYPOINTS</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-expandable-list-editor">
                {currentSlide.waypoints.map((waypoint: any, index: number) => (
                  <div key={index} className="create-training train-expandable-list-item-editor">
                    <div className="create-training train-item-controls">
                      <button className="create-training train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="create-training train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="create-training train-item-fields">
                      <label className="create-training train-form-label">LABEL</label>
                      <input
                        type="text"
                        className="create-training train-form-input"
                        value={waypoint.label}
                        onChange={(e) => updateWaypoint(index, "label", e.target.value)}
                      />

                      <div className="create-training train-form-row">
                        <div className="create-training train-form-column">
                          <label className="create-training train-form-label">X POSITION (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="create-training train-form-input"
                            value={waypoint.x}
                            onChange={(e) => updateWaypoint(index, "x", Number(e.target.value))}
                          />
                        </div>
                        <div className="create-training train-form-column">
                          <label className="create-training train-form-label">Y POSITION (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="create-training train-form-input"
                            value={waypoint.y}
                            onChange={(e) => updateWaypoint(index, "y", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="create-training train-item-actions">
                      <button className="create-training train-item-delete" onClick={() => removeWaypoint(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="create-training train-add-item-button" onClick={addWaypoint}>
                  <Plus size={16} /> Add a waypoint
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "media-collection":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">MEDIA ITEMS</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-expandable-list-editor">
                {currentSlide.media.map((item: any, index: number) => (
                  <div key={index} className="create-training train-expandable-list-item-editor">
                    <div className="create-training train-item-controls">
                      <button className="create-training train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="create-training train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="create-training train-item-fields">
                      <div className="create-training train-form-row">
                        <label className="create-training train-form-label">TYPE</label>
                        <select
                          className="create-training train-form-select"
                          value={item.type}
                          onChange={(e) => {
                            const updatedLessons = JSON.parse(JSON.stringify(lessons))
                            updatedLessons[currentLessonIndex].slides[currentSlideIndex].media[index].type =
                              e.target.value
                            setLessons(updatedLessons)
                          }}
                        >
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                        </select>
                      </div>

                      <div className="create-training train-media-upload">
                        <div className="create-training train-media-preview">
                          {item.source ? (
                            item.type === "image" ? (
                              <img
                                src={item.source || "/placeholder.svg"}
                                alt={`Media ${index + 1}`}
                                className="create-training train-media-preview-img"
                              />
                            ) : (
                              <video
                                src={item.source}
                                controls
                                className="create-training train-media-preview-video"
                              ></video>
                            )
                          ) : (
                            <div className="create-training train-media-placeholder">
                              <Upload size={24} />
                              <span>Upload {item.type}</span>
                            </div>
                          )}
                        </div>
                        {item.type === "image" ? (
                          <button
                            className="create-training train-media-upload-button"
                            onClick={() => handleImageUpload("media", index)}
                          >
                            <ImageIcon size={16} />
                            <span>Upload Image</span>
                          </button>
                        ) : (
                          <button
                            className="create-training train-media-upload-button"
                            onClick={() => handleVideoUpload("media", index)}
                          >
                            <Video size={16} />
                            <span>Upload Video</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="create-training train-item-actions">
                      <button className="create-training train-item-delete" onClick={() => removeMediaItem(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {currentSlide.media.length < 3 && (
                  <button className="create-training train-add-item-button" onClick={addMediaItem}>
                    <Plus size={16} /> Add media item
                  </button>
                )}
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "video-collection":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <div className="create-training train-form-section-header">
                <label className="create-training train-form-label">VIDEOS</label>
                <button className="create-training train-form-section-toggle">−</button>
              </div>

              <div className="create-training train-expandable-list-editor">
                {currentSlide.videos.map((video: string | null, index: number) => (
                  <div key={index} className="create-training train-expandable-list-item-editor">
                    <div className="create-training train-item-fields">
                      <label className="create-training train-form-label">VIDEO {index + 1}</label>
                      <div className="create-training train-media-upload">
                        <div className="create-training train-media-preview">
                          {video ? (
                            <video src={video} controls className="create-training train-media-preview-video" />
                          ) : (
                            <div className="create-training train-media-placeholder">
                              <Upload size={24} />
                              <span>Upload video</span>
                            </div>
                          )}
                        </div>
                        <button
                          className="create-training train-media-upload-button"
                          onClick={() => handleVideoUpload("videos", index)}
                        >
                          <Video size={16} />
                          <span>Upload Video</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className="create-training train-add-item-button"
                  onClick={() => {
                    const updatedLessons = JSON.parse(JSON.stringify(lessons))
                    updatedLessons[currentLessonIndex].slides[currentSlideIndex].videos.push(null)
                    setLessons(updatedLessons)
                  }}
                >
                  <Plus size={16} /> Add a video
                </button>
              </div>
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "youtube":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">YOUTUBE URL</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.youtubeUrl || ""}
                onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      case "vimeo":
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">VIMEO URL</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.vimeoUrl || ""}
                onChange={(e) => handleVimeoUrlChange(e.target.value)}
                placeholder="https://vimeo.com/..."
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )

      default:
        return (
          <>
            <div className="create-training train-form-group">
              <label className="create-training train-form-label">TITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">SUBTITLE</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.subtitle || ""}
                onChange={(e) => updateSlideContent("subtitle", e.target.value)}
              />
            </div>

            <div className="create-training train-form-group">
              <label className="create-training train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="create-training train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="create-training train-create-training-container">
      {/* Top Navigation Bar */}
      <header className="create-training train-header">
        <div className="create-training train-back-button">
          <a href="/training" className="create-training train-back-link">
            <ArrowLeft className="create-training train-back-icon" />
            <span>Back</span>
          </a>
        </div>

        <div className="create-training train-tabs">
          <div
            className={`create-training train-tab ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            <span>Edit</span>
            {activeTab === "edit" && <Circle className="create-training train-tab-indicator" />}
          </div>
          <div
            className={`create-training train-tab ${activeTab === "setup" ? "active" : ""}`}
            onClick={() => setActiveTab("setup")}
          >
            <span>Set up</span>
            {activeTab === "setup" && <Circle className="create-training train-tab-indicator" />}
          </div>
          <div
            className={`create-training train-tab ${activeTab === "publish" ? "active" : ""}`}
            onClick={() => setActiveTab("publish")}
          >
            <span>Publish</span>
            {activeTab === "publish" && <Circle className="create-training train-tab-indicator" />}
          </div>
        </div>

        <div className="create-training train-action-buttons">
          <button className="create-training train-share-button">Share</button>
          <button className="create-training train-next-button">
            Next: Set up
            <ChevronRight className="create-training train-next-icon" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="create-training train-main-content">
        {/* Left Sidebar */}
        <div className="create-training train-left-sidebar">
          <div className="create-training train-course-info">
            <div className="create-training train-course-thumbnail">
              {courseData.courseLogo && (
                <img
                  src={courseData.courseLogo || "/placeholder.svg"}
                  alt="Course logo"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.375rem" }}
                />
              )}
            </div>
            <div className="create-training train-course-details">
              {isEditingCourseTitle ? (
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  onBlur={() => setIsEditingCourseTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingCourseTitle(false)}
                  autoFocus
                  className="create-training train-course-title-input"
                />
              ) : (
                <h2 className="create-training train-course-title" onClick={() => setIsEditingCourseTitle(true)}>
                  {courseTitle}
                </h2>
              )}
              <div className="create-training train-course-meta">
                <span className="create-training train-course-status">Draft</span>
                <span className="create-training train-lesson-count">
                  {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <button className="create-training train-edit-button" onClick={() => setIsEditingCourseTitle(true)}>
              <Edit className="create-training train-edit-icon" />
            </button>
          </div>

          <div className="create-training train-lessons-header">
            <h3>Lessons</h3>
            <button className="create-training train-add-lesson-button" onClick={addNewLesson}>
              <Plus className="create-training train-add-icon" />
            </button>
          </div>

          <div className="create-training train-lessons-list">
            {lessons.map((lesson, lessonIndex) => (
              <div
                key={lesson.id}
                className={`create-training train-lesson-item ${lessonIndex === currentLessonIndex ? "active" : ""}`}
                onClick={() => selectLesson(lessonIndex)}
              >
                <div className="create-training train-lesson-header">
                  <div className="create-training train-lesson-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M12 8L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span
                    className="create-training train-lesson-title"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newTitle = prompt("Enter lesson title:", lesson.title)
                      if (newTitle) updateLessonTitle(lessonIndex, newTitle)
                    }}
                  >
                    {lesson.title}
                  </span>
                </div>
                <div className="create-training train-lesson-duration">{lesson.duration}</div>

                <div className="create-training train-slides-list">
                  {lesson.slides.map((slide, slideIndex) => (
                    <div
                      key={slide.id}
                      className={`create-training train-slide-item ${lessonIndex === currentLessonIndex && slideIndex === currentSlideIndex ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (lessonIndex === currentLessonIndex) {
                          selectSlide(slideIndex)
                        } else {
                          selectLesson(lessonIndex)
                          selectSlide(slideIndex)
                        }
                      }}
                      onMouseEnter={() => setHoverIndex(slideIndex)}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      <span className="create-training train-slide-number">{slideIndex + 1}</span>
                      {slideIndex === lesson.slides.length - 1 && lessonIndex === lessons.length - 1 && (
                        <Lock className="create-training train-lock-icon" />
                      )}
                      <span className="create-training train-slide-title">{slide.title}</span>

                      {hoverIndex === slideIndex && (
                        <button
                          className="create-training train-slide-menu-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSlideToDelete(slideIndex)
                            setShowDeleteConfirm(true)
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  {lessonIndex === currentLessonIndex &&
                    lesson.slides.map((_, slideIndex) => (
                      <div
                        key={`add-indicator-${slideIndex}`}
                        className="create-training train-add-slide-indicator"
                        style={{
                          display: showAddSlideIndicator === slideIndex ? "flex" : "none",
                          justifyContent: "center",
                          padding: "4px 0",
                        }}
                      >
                        <button
                          className="create-training train-add-slide-between-button"
                          onClick={() => setShowSlideLibrary(true)}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#4f46e5",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}

                  {lessonIndex === currentLessonIndex && (
                    <div
                      className="create-training train-new-slide"
                      onClick={() => setShowSlideLibrary(true)}
                      onMouseEnter={() => setShowAddSlideIndicator(lesson.slides.length - 1)}
                      onMouseLeave={() => setShowAddSlideIndicator(null)}
                    >
                      <Plus className="create-training train-new-slide-icon" />
                      <span>New slide</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="create-training train-content-area">
          <div className="create-training train-mobile-preview">
            <div className="create-training train-mobile-frame">
              <div className="create-training train-mobile-header">
                <div className="create-training train-lesson-title-preview">{currentLesson.title}</div>
                <div className="create-training train-slide-counter">
                  {currentSlideIndex + 1} / {currentLesson.slides.length}
                </div>
              </div>

              {renderSlidePreview()}

              <div className="create-training train-navigation-controls">
                {(currentSlideIndex > 0 || currentLessonIndex > 0) && (
                  <button className="create-training train-prev-button" onClick={handlePrevSlide}>
                    <ChevronRight className="create-training train-prev-icon" style={{ transform: "rotate(180deg)" }} />
                  </button>
                )}
                {(currentSlideIndex < currentLesson.slides.length - 1 || currentLessonIndex < lessons.length - 1) && (
                  <button className="create-training train-next-button-preview" onClick={handleNextSlide}>
                    <ChevronRight className="create-training train-next-icon-preview" />
                  </button>
                )}
              </div>

              <div className="create-training train-progress-bar"></div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="create-training train-right-sidebar">
            <div className="create-training train-sidebar-header">
              <div className="create-training train-standard-badge">STANDARD</div>
              <div className="create-training train-content-type">
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="create-training train-delete-confirm-overlay">
          <div className="create-training train-delete-confirm-modal">
            <h3>Delete Slide</h3>
            <p>Are you sure you want to delete this slide? This action cannot be undone.</p>
            <div className="create-training train-delete-confirm-buttons">
              <button
                className="create-training train-delete-cancel-button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setSlideToDelete(null)
                }}
              >
                Cancel
              </button>
              <button
                className="create-training train-delete-confirm-button"
                onClick={() => deleteSlide(slideToDelete)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Library Modal */}
      {showSlideLibrary && (
        <div className="create-training train-slide-library-overlay">
          <div className="create-training train-slide-library-modal" ref={slideLibraryRef}>
            <div className="create-training train-slide-library-header">
              <h2>Slide library</h2>
              <div className="create-training train-slide-library-search">
                <Search className="create-training train-search-icon" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="create-training train-search-input"
                />
              </div>
              <button className="create-training train-close-button" onClick={() => setShowSlideLibrary(false)}>
                <X className="create-training train-close-icon" />
              </button>
            </div>

            <div className="create-training train-slide-library-content">
              <div className="create-training train-slide-library-sidebar">
                <h3 className="create-training train-slide-library-category-header">TEACH</h3>
                <div
                  className={`create-training train-slide-library-category ${selectedSlideType === "TEXT" ? "active" : ""}`}
                  onClick={() => setSelectedSlideType("TEXT")}
                >
                  <div className="create-training train-category-icon train-text-icon"></div>
                  <span>Text</span>
                </div>
                <div
                  className={`create-training train-slide-library-category ${selectedSlideType === "IMAGE" ? "active" : ""}`}
                  onClick={() => setSelectedSlideType("IMAGE")}
                >
                  <div className="create-training train-category-icon train-image-icon"></div>
                  <span>Image</span>
                </div>
                <div
                  className={`create-training train-slide-library-category ${selectedSlideType === "VIDEO" ? "active" : ""}`}
                  onClick={() => setSelectedSlideType("VIDEO")}
                >
                  <div className="create-training train-category-icon train-video-icon"></div>
                  <span>Video</span>
                </div>
              </div>

              <div className="create-training train-slide-library-templates">
                <div className="create-training train-slide-templates-grid">
                  {SLIDE_TYPES[selectedSlideType]
                    .filter(
                      (template: { id: string; name: string; description: string; template: any }) =>
                        searchQuery === "" ||
                        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        template.description.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((template: { id: string; name: string; description: string; template: any }) => (
                      <div
                        key={template.id}
                        className="create-training train-slide-template"
                        onClick={() =>
                          addNewSlide(
                            template.template,
                            showAddSlideIndicator !== null ? showAddSlideIndicator + 1 : null,
                          )
                        }
                      >
                        <div className="create-training train-slide-template-preview">
                          {template.id === "bulleted-list" && (
                            <div className="create-training train-template-preview-content create-training train-bulleted-list-preview">
                              <ul>
                                <li>Has several points</li>
                                <li>Displays each point with a bullet</li>
                                <li>Is similar to a PowerPoint slide</li>
                              </ul>
                            </div>
                          )}
                          {template.id === "comparison" && (
                            <div className="create-training train-template-preview-content create-training train-comparison-preview">
                              <div className="create-training train-preview-title">Product X</div>
                              <div className="create-training train-preview-box"></div>
                            </div>
                          )}
                          {template.id === "expandable-list" && (
                            <div className="create-training train-template-preview-content create-training train-expandable-list-preview">
                              <div className="create-training train-preview-title">
                                Learn more about our product range
                              </div>
                              <div className="create-training train-preview-expandable-item">Product X</div>
                              <div className="create-training train-preview-expandable-item">Product Y</div>
                              <div className="create-training train-preview-expandable-item">Product Z</div>
                            </div>
                          )}
                          {template.id === "horizontal-series" && (
                            <div className="create-training train-template-preview-content create-training train-horizontal-series-preview">
                              <div className="create-training train-preview-dots">
                                <span className="create-training train-dot active"></span>
                                <span className="create-training train-dot"></span>
                                <span className="create-training train-dot"></span>
                              </div>
                            </div>
                          )}
                          {template.id === "quote" && (
                            <div className="create-training train-template-preview-content create-training train-quote-preview">
                              <div className="create-training train-preview-quote">
                                Product X has defied my expectations.
                              </div>
                              <div className="create-training train-preview-author">Satisfied customer</div>
                            </div>
                          )}
                          {template.id === "reveal" && (
                            <div className="create-training train-template-preview-content create-training train-reveal-preview">
                              <div className="create-training train-preview-title">
                                Learn more about our product range
                              </div>
                              <div className="create-training train-preview-reveal-content"></div>
                              <div className="create-training train-preview-reveal-buttons">
                                <div className="create-training train-preview-button">Product Y</div>
                              </div>
                            </div>
                          )}
                          {template.id === "scrolling-mix" && (
                            <div className="create-training train-template-preview-content create-training train-scrolling-mix-preview">
                              <div className="create-training train-preview-title">About Product Z</div>
                              <div className="create-training train-preview-scrolling-content"></div>
                            </div>
                          )}
                          {template.id === "scrolling-text" && (
                            <div className="create-training train-template-preview-content create-training train-scrolling-text-preview">
                              <div className="create-training train-preview-title">Scrolling content</div>
                              <div className="create-training train-preview-scrolling-lines"></div>
                            </div>
                          )}
                          {template.id === "title-slide" && (
                            <div className="create-training train-template-preview-content create-training train-title-slide-preview">
                              <div className="create-training train-preview-title">A title slide</div>
                              <div className="create-training train-preview-subtitle">An optional subtitle</div>
                            </div>
                          )}
                          {template.id === "image-slide" && (
                            <div className="create-training train-template-preview-content create-training train-image-slide-preview">
                              <div className="create-training train-preview-image-placeholder"></div>
                            </div>
                          )}
                          {template.id === "video-slide" && (
                            <div className="create-training train-template-preview-content create-training train-video-slide-preview">
                              <div className="create-training train-preview-video-placeholder">
                                <div className="create-training train-play-icon"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="create-training train-slide-template-info">
                          <h4>{template.name}</h4>
                          <p>{template.description}</p>
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

// Move state and effect hooks into the CreateTraining component
const CreateTraining: React.FC = () => {
  const [courseData, setCourseData] = useState({ courseDescription: "" });
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (courseData.courseDescription && lessons.length > 0 && lessons[0].slides.length > 0) {
      const updatedLessons = [...lessons];
      const firstSlide = updatedLessons[0].slides[0];

      // Update the subtitle with the course description
      if (firstSlide.type === "title-slide") {
        firstSlide.subtitle = courseData.courseDescription;
        setLessons(updatedLessons);
      }
    }
  }, [courseData, lessons]);

  // ...existing code...

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default CreateTraining
