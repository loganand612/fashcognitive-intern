"use client"

import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  Filter,
  Globe,
  ImageIcon,
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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

// Mock data for courses
const initialCourses = [
  {
    id: "course1",
    title: "Untitled course6",
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
const initialNewCourse = {
  id: "new-course",
  title: "Untitled course",
  description: "",
  image: "blue-gradient",
  status: "Draft",
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

// Mock data for slide types in the library
const slideLibraryCategories = [
  {
    id: "teach",
    name: "TEACH",
    items: [
      { id: "text", name: "Text", icon: FileText },
      { id: "image", name: "Image", icon: ImageIcon },
      { id: "video", name: "Video", icon: Video },
    ],
  },
  {
    id: "quiz",
    name: "QUIZ",
    items: [
      { id: "create-with-ai", name: "Create with AI", icon: Plus },
      { id: "multiple-choice", name: "Multiple choice", icon: Check },
      { id: "numbers", name: "Numbers", icon: FileText },
      { id: "words", name: "Words", icon: FileText },
      { id: "match", name: "Match", icon: FileText },
    ],
  },
  {
    id: "engage",
    name: "ENGAGE",
    items: [
      { id: "games", name: "Games", icon: FileText },
      { id: "feedback", name: "Feedback", icon: FileText },
    ],
  },
  {
    id: "more",
    name: "MORE",
    items: [
      { id: "advanced", name: "Advanced", icon: FileText },
      { id: "import-slide", name: "Import slide", icon: FileText },
    ],
  },
]

// Slide templates for the library
const slideTemplates = [
  {
    id: "bulleted-list",
    name: "Bulleted list",
    description: "Show a list of bullet points",
    category: "teach",
    type: "text",
    preview: (
      <div className="p-4 bg-gray-100 rounded-md h-32 flex flex-col justify-center">
        <div className="font-bold mb-2">Bulleted list</div>
        <ul className="text-xs">
          <li>• Has several points</li>
          <li>• Displays each point with a bullet</li>
          <li>• Is similar to a PowerPoint slide</li>
        </ul>
      </div>
    ),
  },
  {
    id: "comparison",
    name: "Comparison",
    description: "Compare two text blocks",
    category: "teach",
    type: "text",
    preview: (
      <div className="p-4 bg-gray-100 rounded-md h-32 flex flex-col justify-center">
        <div className="font-bold mb-2">Product X</div>
        <div className="text-xs">Compare two items side by side</div>
      </div>
    ),
  },
  {
    id: "expandable-list",
    name: "Expandable list",
    description: "Show a list of concepts",
    category: "teach",
    type: "text",
    preview: (
      <div className="p-4 bg-gray-100 rounded-md h-32 flex flex-col justify-center">
        <div className="font-bold mb-2">Expandable list</div>
        <div className="text-xs">Click to expand items</div>
      </div>
    ),
  },
  {
    id: "horizontal-series",
    name: "Horizontal series",
    description: "Show text blocks in order",
    category: "teach",
    type: "text",
    preview: (
      <div className="p-4 bg-gray-100 rounded-md h-32 flex flex-col justify-center">
        <div className="font-bold mb-2">Horizontal series</div>
        <div className="text-xs">Swipe through a series</div>
      </div>
    ),
  },
  {
    id: "media-collection",
    name: "Media collection",
    description: "Show up to three pieces of media",
    category: "teach",
    type: "video",
    preview: (
      <div className="p-4 bg-gray-100 rounded-md h-32 flex flex-col justify-center">
        <div className="font-bold mb-2">Media collection</div>
        <div className="text-xs">Multiple media items</div>
      </div>
    ),
  },
  {
    id: "single-video",
    name: "Single video",
    description: "Show a single video",
    category: "teach",
    type: "video",
    preview: (
      <div className="p-4 bg-gray-100 rounded-md h-32 flex flex-col justify-center">
        <div className="font-bold mb-2">Single video</div>
        <div className="text-xs">One video with caption</div>
      </div>
    ),
  },
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
  const [selectedCategory, setSelectedCategory] = useState("teach")
  const [selectedType, setSelectedType] = useState("text")

  // State for selected lesson and slide
  const [selectedLessonId, setSelectedLessonId] = useState("lesson1")
  const [selectedSlideId, setSelectedSlideId] = useState("slide1")

  // Get the selected lesson and slide
  const selectedLesson = currentCourse.lessons.find((lesson) => lesson.id === selectedLessonId)
  const selectedSlide = selectedLesson?.slides.find((slide) => slide.id === selectedSlideId)

  // Function to handle creating a new course
  const handleCreateCourse = () => {
    const newCourse = {
      ...initialNewCourse,
      title: newCourseTitle,
      description: newCourseDescription,
    }

    setCourses([...courses, newCourse])
    setCurrentCourse(newCourse)
    setCreateDialogOpen(false)
    setView("editor")
  }

  // Function to handle adding a new slide
  const handleAddSlide = (templateId) => {
    const template = slideTemplates.find((t) => t.id === templateId)

    if (!template) return

    const newSlide = {
      id: `slide${Date.now()}`,
      type: template.id,
      title: template.name,
    }

    if (template.id === "bulleted-list") {
      newSlide.items = ["Has several points", "Displays each point with a bullet", "Is similar to a PowerPoint slide"]
      newSlide.doneText = "Continue"
    }

    const updatedLessons = currentCourse.lessons.map((lesson) => {
      if (lesson.id === selectedLessonId) {
        return {
          ...lesson,
          slides: [...lesson.slides, newSlide],
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
  }

  // Function to update slide content
  const handleUpdateSlide = (field, value) => {
    const updatedLessons = currentCourse.lessons.map((lesson) => {
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

  // Function to update bulleted list items
  const handleUpdateListItem = (index, value) => {
    if (!selectedSlide || selectedSlide.type !== "bulleted-list") return

    const updatedItems = [...(selectedSlide.items || [])]
    updatedItems[index] = value

    handleUpdateSlide("items", updatedItems)
  }

  // Function to add a new list item
  const handleAddListItem = () => {
    if (!selectedSlide || selectedSlide.type !== "bulleted-list") return

    const updatedItems = [...(selectedSlide.items || []), "New item"]
    handleUpdateSlide("items", updatedItems)
  }

  // Function to remove a list item
  const handleRemoveListItem = (index) => {
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

  const slidePosition = getSlidePosition()

  // Render the dashboard view
  if (view === "dashboard") {
    return (
      <div className="min-h-screen bg-white">
        {/* Top navigation */}
        <div className="border-b">
          <div className="container mx-auto px-4 flex items-center h-14">
            <div className="flex space-x-6">
              <button className="text-gray-600 hover:text-gray-900">Learn</button>
              <button className="text-indigo-600 font-medium border-b-2 border-indigo-600">Content</button>
            </div>
            <div className="ml-auto">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Content</h1>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Create course
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="courses" className="mb-8">
            <TabsList>
              <TabsTrigger value="courses" className="text-base">
                Courses
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search" className="pl-10" />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">3 results</span>
              <Button variant="outline" className="flex items-center gap-2">
                Last modified (Newest)
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Course grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600" />
                <CardContent className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <BookOpen className="h-4 w-4 mr-1" />
                    COURSE
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{course.title}</h3>
                  {course.description && <p className="text-gray-600 text-sm mb-4">{course.description}</p>}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">GM</span>
                      <List className="h-4 w-4 mx-1" />
                      <Check className="h-4 w-4 mx-1" />
                      <span className="ml-1">1</span>
                    </div>
                    <Badge variant="outline" className="text-gray-500">
                      {course.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Create course dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Course details</DialogTitle>
            </DialogHeader>
            <div className="border border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center mb-4">
              <div className="bg-gray-100 rounded-full p-3 mb-2">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <div className="bg-gray-100 rounded-full p-3">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title (required)
                </label>
                <Input id="title" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Add a brief description"
                  value={newCourseDescription}
                  onChange={(e) => setNewCourseDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCourse} className="bg-indigo-600 hover:bg-indigo-700">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Render the editor view
  return (
    <div className="min-h-screen flex flex-col">
      {/* Editor header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="flex items-center" onClick={() => setView("dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="relative">
              <Button variant="outline" size="sm" className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                English (Original)
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="edit" className="w-auto">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="setup">Set up</TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 flex items-center">
              <span className="mr-2">Saved</span>
            </div>
            <Button variant="outline" size="sm">
              Share
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              Next: Set up
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main editor area - 3 column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Lessons and slides */}
        <div className="w-80 border-r bg-white overflow-y-auto">
          {/* Course info */}
          <div className="p-4 border-b">
            <div className="flex items-start">
              <div className="h-12 w-12 rounded bg-gradient-to-br from-blue-400 to-blue-600 mr-3" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">{currentCourse.title}</h2>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <Badge variant="outline" className="mr-2 text-xs">
                    Draft
                  </Badge>
                  <span>
                    {currentCourse.lessons.length} lesson{currentCourse.lessons.length !== 1 && "s"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lessons section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Lessons</h3>
              <div className="flex">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Lessons list */}
            <div className="space-y-1">
              {currentCourse.lessons.map((lesson) => (
                <div key={lesson.id} className={`rounded-lg ${selectedLessonId === lesson.id ? "bg-indigo-50" : ""}`}>
                  <div className="flex items-center p-2 cursor-pointer" onClick={() => setSelectedLessonId(lesson.id)}>
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium">{lesson.title}</div>
                      <div className="text-xs text-gray-500">{lesson.duration}</div>
                    </div>
                    {selectedLessonId === lesson.id && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                  </div>

                  {/* Slides for this lesson */}
                  {selectedLessonId === lesson.id && (
                    <div className="ml-6 border-l pl-4 mt-2 space-y-2">
                      {lesson.slides.map((slide, index) => (
                        <div
                          key={slide.id}
                          className={`flex items-center py-1 px-2 rounded ${selectedSlideId === slide.id ? "bg-indigo-100" : ""}`}
                          onClick={() => setSelectedSlideId(slide.id)}
                        >
                          <span className="text-xs text-gray-500 mr-2">{index + 1}</span>
                          {slide.type === "end" ? (
                            <Lock className="h-3 w-3 mr-2 text-gray-500" />
                          ) : (
                            <FileText className="h-3 w-3 mr-2 text-gray-500" />
                          )}
                          <span className="text-sm">{slide.title}</span>
                          {slide.type === "bulleted-list" && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}

                      {/* New slide button */}
                      <button
                        className="flex items-center text-indigo-600 text-sm py-1"
                        onClick={() => setSlideLibraryOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        New slide
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Theme section */}
          <div className="p-4 border-t mt-auto">
            <div className="flex items-center text-gray-600">
              <FileText className="h-4 w-4 mr-2" />
              <span>Theme</span>
            </div>
          </div>
        </div>

        {/* Center column - Preview */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-8 overflow-y-auto">
          <div className="relative">
            {/* Mobile frame */}
            <div className="w-[375px] h-[667px] bg-white rounded-3xl shadow-lg overflow-hidden border-8 border-gray-300">
              {/* Slide content */}
              <div className="h-full flex flex-col">
                {/* Header with lesson title and slide counter */}
                <div className="p-4 border-b flex items-center">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-400 to-blue-600 mr-2 flex items-center justify-center text-white text-xs">
                      SC
                    </div>
                    <span className="text-sm font-medium">{selectedLesson?.title || "Untitled lesson"}</span>
                  </div>
                  <div className="ml-auto bg-gray-200 rounded px-2 py-1 text-xs">
                    {slidePosition.current} / {slidePosition.total}
                  </div>
                </div>

                {/* Slide content area */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  {selectedSlide?.type === "title" && (
                    <>
                      <h2 className="text-2xl font-bold mb-4">{selectedSlide.title}</h2>
                      {selectedSlide.subtitle && <p className="text-gray-600 mb-8">{selectedSlide.subtitle}</p>}
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        {selectedSlide.buttonText || "Continue"}
                      </Button>
                    </>
                  )}

                  {selectedSlide?.type === "bulleted-list" && (
                    <>
                      <h2 className="text-2xl font-bold mb-6">{selectedSlide.title}</h2>
                      <ul className="text-left w-full space-y-4">
                        {selectedSlide.items?.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-8">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                          {selectedSlide.doneText || "Continue"}
                        </Button>
                      </div>
                    </>
                  )}

                  {selectedSlide?.type === "media-collection" && (
                    <>
                      <h2 className="text-2xl font-bold mb-6">{selectedSlide.title}</h2>
                      <div className="w-full h-48 bg-gray-300 mb-4 flex items-center justify-center">
                        <span className="text-gray-600">No compatible source was found for this media.</span>
                      </div>
                      <p className="text-gray-600 mb-8">
                        {selectedSlide.caption ||
                          "This is the original product in our line and is a great source of pride for the company."}
                      </p>
                      <div className="mt-auto">
                        <p className="text-sm text-gray-500 uppercase mb-4">SELECT EACH ITEM FOR MORE DETAILS</p>
                      </div>
                    </>
                  )}

                  {selectedSlide?.type === "end" && (
                    <div className="flex flex-col items-center justify-center">
                      <Lock className="h-16 w-16 text-gray-400 mb-4" />
                      <h2 className="text-2xl font-bold">That's it!</h2>
                    </div>
                  )}
                </div>

                {/* Footer with navigation controls */}
                <div className="p-4 border-t">
                  <div className="flex justify-center">
                    <hr className="w-16 border-t border-gray-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation arrows */}
            <button className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 bg-white rounded-full p-3 shadow-md">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 bg-white rounded-full p-3 shadow-md">
              <ArrowRight className="h-5 w-5 text-gray-600" />
            </button>

            {/* Device selector */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-12 bg-white rounded-full shadow-md flex items-center p-1">
              <button className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-sm flex items-center">
                <span className="mr-1">Mobile</span>
              </button>
              <button className="px-3 py-1 rounded-full text-gray-600 text-sm">
                <span className="sr-only">Tablet</span>
                <span>󰄶</span>
              </button>
              <button className="px-3 py-1 rounded-full text-gray-600 text-sm">
                <span className="sr-only">Desktop</span>
                <span>󰍹</span>
              </button>
              <button className="px-3 py-1 rounded-full text-gray-600 text-sm">
                <span className="sr-only">Fullscreen</span>
                <span>󰍉</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar - Editor */}
        <div className="w-96 border-l bg-white overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              STANDARD
            </Badge>
            <div className="font-medium">
              {selectedSlide?.type === "title"
                ? "Title"
                : selectedSlide?.type === "bulleted-list"
                  ? "Bulleted list"
                  : selectedSlide?.type === "media-collection"
                    ? "Media collection"
                    : "Slide"}
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Title slide editor */}
            {selectedSlide?.type === "title" && (
              <>
                <div>
                  <label className="block text-xs font-medium uppercase text-gray-500 mb-2">TITLE</label>
                  <Input value={selectedSlide.title} onChange={(e) => handleUpdateSlide("title", e.target.value)} />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase text-gray-500 mb-2">SUBTITLE</label>
                  <Input
                    value={selectedSlide.subtitle || ""}
                    onChange={(e) => handleUpdateSlide("subtitle", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase text-gray-500 mb-2">BUTTON TEXT</label>
                  <Input
                    value={selectedSlide.buttonText || ""}
                    onChange={(e) => handleUpdateSlide("buttonText", e.target.value)}
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="exit-button" />
                  <div>
                    <label htmlFor="exit-button" className="font-medium">
                      Exit button
                    </label>
                    <p className="text-sm text-gray-500">Give users the option to leave the lesson from this slide.</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Narration</h3>
                    <Button variant="ghost" size="sm">
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Play an audio file automatically when users view the slide. Note that automatic play is disabled
                    when editing the course.
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex items-center">
                      <span className="text-indigo-600 mr-2">✨</span>
                      Narrate with AI
                    </Button>
                    <Button variant="outline" className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload file
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button variant="link" className="text-indigo-600 p-0 h-auto">
                      How does this work?
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Bulleted list editor */}
            {selectedSlide?.type === "bulleted-list" && (
              <>
                <div>
                  <label className="block text-xs font-medium uppercase text-gray-500 mb-2">TITLE</label>
                  <Input value={selectedSlide.title} onChange={(e) => handleUpdateSlide("title", e.target.value)} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium uppercase text-gray-500">LIST</label>
                    <Button variant="ghost" size="sm">
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedSlide.items?.map((item, index) => (
                    <div key={index} className="mb-2 relative">
                      <div className="flex items-center mb-1">
                        <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <div className="ml-auto flex items-center">
                          <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                            <span className="text-xs">0</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-6 w-6"
                            onClick={() => handleRemoveListItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Input value={item} onChange={(e) => handleUpdateListItem(index, e.target.value)} />
                    </div>
                  ))}

                  <Button className="w-full mt-2 bg-indigo-900 hover:bg-indigo-800" onClick={handleAddListItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add an item
                  </Button>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase text-gray-500 mb-2">DONE TEXT</label>
                  <Input
                    value={selectedSlide.doneText || "Continue"}
                    onChange={(e) => handleUpdateSlide("doneText", e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Media collection editor */}
            {selectedSlide?.type === "media-collection" && (
              <>
                <div>
                  <label className="block text-xs font-medium uppercase text-gray-500 mb-2">TITLE</label>
                  <Input value={selectedSlide.title} onChange={(e) => handleUpdateSlide("title", e.target.value)} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium uppercase text-gray-500">CONTENT</label>
                    <div className="flex">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-100 rounded-md p-8 flex flex-col items-center justify-center">
                    <div className="flex mb-4">
                      <Button variant="ghost" size="sm" className="rounded-md bg-white">
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-md">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500">Max size: 150MB</div>
                  </div>

                  <div className="text-sm text-gray-500 mt-2">Supported file types: mp4, mov, webm</div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase text-gray-500 mb-2">CAPTION</label>
                  <Textarea
                    value={
                      selectedSlide.caption ||
                      "This is the original product in our line and is a great source of pride for the company."
                    }
                    onChange={(e) => handleUpdateSlide("caption", e.target.value)}
                  />
                </div>

                <Button className="w-full bg-indigo-900 hover:bg-indigo-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add a section
                </Button>

                <div>
                  <label className="block text-xs font-medium uppercase text-gray-500 mb-2">PROMPT</label>
                  <Input
                    value={selectedSlide.prompt || "SELECT EACH ITEM FOR MORE DETAILS"}
                    onChange={(e) => handleUpdateSlide("prompt", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase text-gray-500 mb-2">DONE TEXT</label>
                  <Input
                    value={selectedSlide.doneText || "Continue"}
                    onChange={(e) => handleUpdateSlide("doneText", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Slide library dialog */}
      <Dialog open={slideLibraryOpen} onOpenChange={setSlideLibraryOpen}>
        <DialogContent className="max-w-5xl p-0">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold">Slide library</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search" className="pl-10" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSlideLibraryOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex h-[600px]">
            {/* Categories sidebar */}
            <div className="w-64 border-r overflow-y-auto">
              {slideLibraryCategories.map((category) => (
                <div key={category.id} className="p-4 border-b">
                  <h3 className="font-medium text-sm text-gray-500 mb-2">{category.name}</h3>
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      className={`flex items-center w-full p-2 rounded-md text-left mb-1 ${
                        selectedCategory === category.id && selectedType === item.id
                          ? "bg-indigo-100 text-indigo-600"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setSelectedCategory(category.id)
                        setSelectedType(item.id)
                      }}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Templates grid */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {slideTemplates
                  .filter(
                    (template) =>
                      template.category === selectedCategory ||
                      (selectedCategory === "teach" && template.type === selectedType),
                  )
                  .map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-md overflow-hidden cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                      onClick={() => handleAddSlide(template.id)}
                    >
                      <div className="h-32 bg-gray-50 flex items-center justify-center">{template.preview}</div>
                      <div className="p-3 border-t">
                        <h3 className="font-medium mb-1">{template.name}</h3>
                        <p className="text-xs text-gray-500">{template.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
