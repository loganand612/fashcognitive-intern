import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import "./create-training.css";

// Type definitions
interface SlideTemplate {
  type: string;
  title: string;
  buttonText: string;
  [key: string]: any;
}

interface SlideType {
  id: string;
  name: string;
  description: string;
  template: SlideTemplate;
}

// Slide type definitions
const SLIDE_TYPES: { [key: string]: SlideType[] } = {
  TEXT: [
    {
      id: "bulleted-list",
      name: "Bulleted list",
      description: "Show a list of bullet points",
      template: {
        type: "bulleted-list",
        title: "Bulleted list",
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
        items: [
          {
            title: "Product X",
            content: "Our brilliant new sleek design allows the user to have unparalleled comfort when using the device.",
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
        items: [
          {
            title: "Product X",
            description: "Our brilliant new sleek design allows the user to have unparalleled comfort when using the device.",
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
        content:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent quis lectus mattis, at posuere neque. Sed placerat diam sed vide eget erat convallis at posuere leo convallis. Sed blandit odio convallis suscipit elementum, ante ipsum cursus augue.",
        buttonText: "Continue",
      },
    },
    {
      id: "scrolling-mix",
      name: "Scrolling mix",
      description: "Show a mix of text and media",
      template: {
        type: "scrolling-mix",
        title: "About Product Z",
        content:
          "Product Z is our latest product in the Product line. While other products focus on capability, Product Z focuses on ease of use and big on capability. Don't believe us? Just see below!",
        media: null,
        mediaType: "image",
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
        media: [
          { type: "image", source: null },
          { type: "image", source: null },
          { type: "image", source: null },
        ],
        buttonText: "Continue",
      },
    },
    {
      id: "scratch-to-reveal",
      name: "Scratch to reveal",
      description: "Reveal text or another image",
      template: {
        type: "scratch-to-reveal",
        title: "Product X vs. Product Y",
        topImage: null,
        bottomImage: null,
        revealPercent: 0,
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
        media: [
          { type: "video", source: null },
          { type: "image", source: null },
          { type: "image", source: null },
        ],
        buttonText: "Continue",
      },
    },
    {
      id: "scrolling-mix",
      name: "Scrolling mix",
      description: "Show a mix of text and media",
      template: {
        type: "video-scrolling-mix",
        title: "About Product Z",
        content:
          "Product Z is our latest product in the Product line. While other products focus on capability, Product Z focuses on ease of use and big on capability. Don't believe us? Just see below!",
        video: null,
        buttonText: "Continue",
      },
    },
    {
      id: "single-video",
      name: "Single video",
      description: "Show a single video",
      template: {
        type: "single-video",
        title: "Single video",
        video: null,
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
        youtubeUrl: "",
        buttonText: "Continue",
      },
    },
  ],
};

export default function CreateTraining() {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [courseTitle, setCourseTitle] = useState("Untitled course");
  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSlideLibrary, setShowSlideLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlideType, setSelectedSlideType] = useState<"TEXT" | "IMAGE" | "VIDEO">("TEXT");
  const [activeRevealItem, setActiveRevealItem] = useState(0);
  const [expandedItems, setExpandedItems] = useState<number[]>([0]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [horizontalSeriesIndex, setHorizontalSeriesIndex] = useState(0);
  const [imageStackIndex, setImageStackIndex] = useState(0);
  const [waypointIndex, setWaypointIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<number | null>(null);
  const [showAddSlideIndicator, setShowAddSlideIndicator] = useState<number | null>(null);

  const slideLibraryRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [lessons, setLessons] = useState([
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
  ]);

  // Close slide library when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (slideLibraryRef.current && !slideLibraryRef.current.contains(event.target as Node)) {
        setShowSlideLibrary(false);
      }
    }

    if (showSlideLibrary) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSlideLibrary]);

  // Handle comparison slide dragging
  useEffect(() => {
    const slideType = lessons[currentLessonIndex]?.slides[currentSlideIndex]?.type;
    if (slideType === "comparison" || slideType === "image-comparison" || slideType === "scratch-to-reveal") {
      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && comparisonRef.current) {
          const rect = comparisonRef.current.getBoundingClientRect();
          const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
          const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
          setSliderPosition(newPosition);

          const updatedLessons = JSON.parse(JSON.stringify(lessons));
          if (slideType === "comparison" || slideType === "image-comparison") {
            updatedLessons[currentLessonIndex].slides[currentSlideIndex].sliderPosition = newPosition;
          } else if (slideType === "scratch-to-reveal") {
            updatedLessons[currentLessonIndex].slides[currentSlideIndex].revealPercent = newPosition;
          }
          setLessons(updatedLessons);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (isDragging && comparisonRef.current && e.touches[0]) {
          const rect = comparisonRef.current.getBoundingClientRect();
          const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
          const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
          setSliderPosition(newPosition);

          const updatedLessons = JSON.parse(JSON.stringify(lessons));
          if (slideType === "comparison" || slideType === "image-comparison") {
            updatedLessons[currentLessonIndex].slides[currentSlideIndex].sliderPosition = newPosition;
          } else if (slideType === "scratch-to-reveal") {
            updatedLessons[currentLessonIndex].slides[currentSlideIndex].revealPercent = newPosition;
          }
          setLessons(updatedLessons);
        }
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isDragging, currentLessonIndex, currentSlideIndex, lessons]);

  // Handle scratch to reveal canvas
  useEffect(() => {
    const slideType = lessons[currentLessonIndex]?.slides[currentSlideIndex]?.type;
    if (slideType === "scratch-to-reveal" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      let isDrawing = false;

      const resizeCanvas = () => {
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.offsetWidth;
          canvas.height = container.offsetHeight;
        }
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      const startDrawing = (e: MouseEvent | TouchEvent) => {
        isDrawing = true;
        draw(e);
      };

      const stopDrawing = () => {
        isDrawing = false;
        ctx?.beginPath();
      };

      const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ("clientX" in e ? e.clientX : e.touches[0].clientX) - rect.left;
        const y = ("clientY" in e ? e.clientY : e.touches[0].clientY) - rect.top;

        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 40;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;
        let clearedPixels = 0;

        for (let i = 3; i < pixelData.length; i += 4) {
          if (pixelData[i] < 128) clearedPixels++;
        }

        const totalPixels = canvas.width * canvas.height;
        const revealPercent = Math.min(100, Math.round((clearedPixels / totalPixels) * 100));

        const updatedLessons = JSON.parse(JSON.stringify(lessons));
        updatedLessons[currentLessonIndex].slides[currentSlideIndex].revealPercent = revealPercent;
        setLessons(updatedLessons);
      };

      canvas.addEventListener("mousedown", startDrawing);
      canvas.addEventListener("mousemove", draw);
      canvas.addEventListener("mouseup", stopDrawing);
      canvas.addEventListener("mouseout", stopDrawing);
      canvas.addEventListener("touchstart", startDrawing);
      canvas.addEventListener("touchmove", draw);
      canvas.addEventListener("touchend", stopDrawing);

      const initCanvas = () => {
        if (!ctx) return;
        const currentSlide = lessons[currentLessonIndex].slides[currentSlideIndex];
        if (currentSlide.topImage) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = currentSlide.topImage;
        } else {
          ctx.fillStyle = "rgba(200, 200, 200, 0.8)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "rgba(150, 150, 150, 1)";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.fillText("Scratch here to reveal", canvas.width / 2, canvas.height / 2);
        }
      };

      initCanvas();

      return () => {
        canvas.removeEventListener("mousedown", startDrawing);
        canvas.removeEventListener("mousemove", draw);
        canvas.removeEventListener("mouseup", stopDrawing);
        canvas.removeEventListener("mouseout", stopDrawing);
        canvas.removeEventListener("touchstart", startDrawing);
        canvas.removeEventListener("touchmove", draw);
        canvas.removeEventListener("touchend", stopDrawing);
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [currentLessonIndex, currentSlideIndex, lessons]);

  // Update horizontal series index
  useEffect(() => {
    const slideType = lessons[currentLessonIndex]?.slides[currentSlideIndex]?.type;
    if (slideType === "horizontal-series" || slideType === "image-horizontal-series") {
      const currentSlide = lessons[currentLessonIndex].slides[currentSlideIndex];
      setHorizontalSeriesIndex(currentSlide.currentIndex || 0);
    }
  }, [currentLessonIndex, currentSlideIndex, lessons]);

  // Update image stack index
  useEffect(() => {
    const slideType = lessons[currentLessonIndex]?.slides[currentSlideIndex]?.type;
    if (slideType === "image-stack") {
      const currentSlide = lessons[currentLessonIndex].slides[currentSlideIndex];
      setImageStackIndex(currentSlide.currentIndex || 0);
    }
  }, [currentLessonIndex, currentSlideIndex, lessons]);

  // Update waypoint index
  useEffect(() => {
    const slideType = lessons[currentLessonIndex]?.slides[currentSlideIndex]?.type;
    if (slideType === "image-waypoints") {
      const currentSlide = lessons[currentLessonIndex].slides[currentSlideIndex];
      setWaypointIndex(currentSlide.currentWaypoint || 0);
    }
  }, [currentLessonIndex, currentSlideIndex, lessons]);

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
    };
    setLessons([...lessons, newLesson]);
    setCurrentLessonIndex(lessons.length);
    setCurrentSlideIndex(0);
  };

  const addNewSlide = (template: SlideTemplate, position: number | null = null) => {
    const newSlide = {
      id: Date.now(),
      ...template,
    };

    const updatedLessons = [...lessons];
    const currentLesson = updatedLessons[currentLessonIndex];

    if (position !== null) {
      currentLesson.slides.splice(position, 0, newSlide);
    } else {
      currentLesson.slides.push(newSlide);
    }

    setLessons(updatedLessons);
    setCurrentSlideIndex(position !== null ? position : currentLesson.slides.length - 1);
    setShowSlideLibrary(false);
    setShowAddSlideIndicator(null);
  };

  const deleteSlide = (index: number | null) => {
    if (index === null) return;

    const updatedLessons = [...lessons];
    const currentLesson = updatedLessons[currentLessonIndex];

    if (currentLesson.slides.length <= 1) {
      setShowDeleteConfirm(false);
      setSlideToDelete(null);
      return;
    }

    currentLesson.slides.splice(index, 1);
    setLessons(updatedLessons);

    if (index >= currentLesson.slides.length) {
      setCurrentSlideIndex(currentLesson.slides.length - 1);
    }

    setShowDeleteConfirm(false);
    setSlideToDelete(null);
  };

  const handleNextSlide = () => {
    const currentLesson = lessons[currentLessonIndex];
    if (currentSlideIndex < currentLesson.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setCurrentSlideIndex(0);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setCurrentSlideIndex(lessons[currentLessonIndex - 1].slides.length - 1);
    }
  };

  const updateSlideContent = (field: string, value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex][field] = value;
    setLessons(updatedLessons);
  };

  const updateBulletedListItem = (index: number, value: string) => {
    const updatedLessons = [...lessons];
    const currentSlide = updatedLessons[currentLessonIndex].slides[currentSlideIndex];

    if (!currentSlide.items) currentSlide.items = [];
    if (typeof currentSlide.items[0] === "string") {
      (currentSlide.items as string[])[index] = value;
    } else {
      (currentSlide.items as any[])[index].title = value;
    }

    setLessons(updatedLessons);
  };

  const addBulletedListItem = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.push("New item");
    setLessons(updatedLessons);
  };

  const removeBulletedListItem = (index: number) => {
    const updatedLessons = [...lessons];
    const currentSlide = updatedLessons[currentLessonIndex].slides[currentSlideIndex];

    if (!currentSlide.items) return;
    currentSlide.items.splice(index, 1);

    setLessons(updatedLessons);
  };

  const updateComparisonContent = (section: "before" | "after", field: "content" | "label", value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex][section][field] = value;
    setLessons(updatedLessons);
  };

  const updateExpandableListItem = (index: number, field: "title" | "content", value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items[index][field] = value;
    setLessons(updatedLessons);
  };

  const addExpandableListItem = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.push({
      title: "New Product",
      content: "Description goes here",
    });
    setLessons(updatedLessons);
  };

  const removeExpandableListItem = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.splice(index, 1);
    setLessons(updatedLessons);
  };

  const updateRevealItem = (index: number, field: "title" | "description", value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items[index][field] = value;
    setLessons(updatedLessons);
  };

  const addRevealItem = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.push({
      title: "New Product",
      description: "Description goes here",
    });
    setLessons(updatedLessons);
  };

  const removeRevealItem = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.splice(index, 1);
    setLessons(updatedLessons);
  };

  const toggleExpandItem = (index: number) => {
    if (expandedItems.includes(index)) {
      setExpandedItems(expandedItems.filter((i) => i !== index));
    } else {
      setExpandedItems([...expandedItems, index]);
    }
  };

  const handleRevealItemClick = (index: number) => {
    setActiveRevealItem(index);
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].activeItem = index;
    setLessons(updatedLessons);
  };

  const handleImageUpload = (field: string, index?: number) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        const updatedLessons = [...lessons];
        const currentSlide = updatedLessons[currentLessonIndex].slides[currentSlideIndex];

        if (index !== undefined && field === "images") {
          if (!currentSlide.images) currentSlide.images = [];
          currentSlide.images[index] = imageUrl;
        } else if (index !== undefined && field === "media") {
          if (!currentSlide.media) currentSlide.media = [];
          currentSlide.media[index].source = imageUrl;
        } else {
          (currentSlide as any)[field] = imageUrl;
        }

        setLessons(updatedLessons);
      };
      reader.readAsDataURL(file);
    };

    fileInput.click();
  };

  const handleVideoUpload = (field: string, index: number | null = null) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const updatedLessons = JSON.parse(JSON.stringify(lessons));
          const currentSlide = updatedLessons[currentLessonIndex].slides[currentSlideIndex];

          if (index !== null) {
            if (field === "videos") {
              currentSlide.videos[index] = event.target?.result;
            } else if (field === "media") {
              currentSlide.media[index].source = event.target?.result;
              currentSlide.media[index].type = "video";
            }
          } else {
            currentSlide[field] = event.target?.result;
          }

          setLessons(updatedLessons);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const selectLesson = (lessonIndex: number) => {
    setCurrentLessonIndex(lessonIndex);
    setCurrentSlideIndex(0);
  };

  const selectSlide = (slideIndex: number) => {
    setCurrentSlideIndex(slideIndex);
  };

  const updateLessonTitle = (index: number, title: string) => {
    const updatedLessons = [...lessons];
    updatedLessons[index].title = title;
    setLessons(updatedLessons);
  };

  const updateHorizontalSeriesIndex = (index: number) => {
    setHorizontalSeriesIndex(index);
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].currentIndex = index;
    setLessons(updatedLessons);
  };

  const updateImageStackIndex = (index: number) => {
    setImageStackIndex(index);
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].currentIndex = index;
    setLessons(updatedLessons);
  };

  const updateSexualIndex = (index: number) => {
    setWaypointIndex(index);
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].currentWaypoint = index;
    setLessons(updatedLessons);
  };

  const updateHorizontalSeriesItem = (index: number, value: string) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items[index].content = value;
    setLessons(updatedLessons);
  };

  const addHorizontalSeriesItem = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.push({
      content: "New item in the series",
    });
    setLessons(updatedLessons);
  };

  const removeHorizontalSeriesItem = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].items.splice(index, 1);
    setLessons(updatedLessons);
  };

  const addHotspot = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].hotspots.push({
      x: 50,
      y: 50,
      title: "New Feature",
      description: "Description of new feature",
    });
    setLessons(updatedLessons);
  };

  const removeHotspot = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].hotspots.splice(index, 1);
    setLessons(updatedLessons);
  };

  const updateHotspot = (index: number, field: "x" | "y" | "title" | "description", value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].hotspots[index][field] = value;
    setLessons(updatedLessons);
  };

  const addWaypoint = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].waypoints.push({
      x: 50,
      y: 50,
      label: String(updatedLessons[currentLessonIndex].slides[currentSlideIndex].waypoints.length + 1),
    });
    setLessons(updatedLessons);
  };

  const removeWaypoint = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].waypoints.splice(index, 1);
    setLessons(updatedLessons);
  };

  const updateWaypoint = (index: number, field: "x" | "y" | "label", value: any) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].waypoints[index][field] = value;
    setLessons(updatedLessons);
  };

  const addMediaItem = () => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    if (updatedLessons[currentLessonIndex].slides[currentSlideIndex].media.length < 3) {
      updatedLessons[currentLessonIndex].slides[currentSlideIndex].media.push({
        type: "image",
        source: null,
      });
      setLessons(updatedLessons);
    }
  };

  const removeMediaItem = (index: number) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].media.splice(index, 1);
    setLessons(updatedLessons);
  };

  const handleYouTubeUrlChange = (url: string) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].youtubeUrl = url;

    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      updatedLessons[currentLessonIndex].slides[currentSlideIndex].youtubeVideoId = videoId;
    } else {
      updatedLessons[currentLessonIndex].slides[currentSlideIndex].youtubeVideoId = null;
    }

    setLessons(updatedLessons);
  };

  const handleVimeoUrlChange = (url: string) => {
    const updatedLessons = JSON.parse(JSON.stringify(lessons));
    updatedLessons[currentLessonIndex].slides[currentSlideIndex].vimeoUrl = url;

    const videoId = extractVimeoVideoId(url);
    if (videoId) {
      updatedLessons[currentLessonIndex].slides[currentSlideIndex].vimeoVideoId = videoId;
    } else {
      updatedLessons[currentLessonIndex].slides[currentSlideIndex].vimeoVideoId = null;
    }

    setLessons(updatedLessons);
  };

  const extractYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const extractVimeoVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const currentLesson = lessons[currentLessonIndex];
  const currentSlide = currentLesson.slides[currentSlideIndex];

  const renderSlidePreview = () => {
    switch (currentSlide.type) {
      case "title-slide":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <p className="train-slide-subtitle-preview">{currentSlide.subtitle}</p>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "bulleted-list":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <ul className="train-bulleted-list-preview">
              {currentSlide.items.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "comparison":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div
              className="train-comparison-container"
              ref={comparisonRef}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              <div
                className="train-comparison-slider"
                style={{ left: `${currentSlide.sliderPosition || sliderPosition}%` }}
              >
                <div
                  className="train-comparison-slider-handle"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                ></div>
              </div>
              <div
                className="train-comparison-before"
                style={{ width: `${currentSlide.sliderPosition || sliderPosition}%` }}
              >
                <div className="train-comparison-content">{currentSlide.before.content}</div>
                {currentSlide.before.label && <div className="train-comparison-label">{currentSlide.before.label}</div>}
              </div>
              <div
                className="train-comparison-after"
                style={{ width: `${100 - (currentSlide.sliderPosition || sliderPosition)}%` }}
              >
                <div className="train-comparison-content">{currentSlide.after.content}</div>
                {currentSlide.after.label && <div className="train-comparison-label">{currentSlide.after.label}</div>}
              </div>
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "expandable-list":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-expandable-list-preview">
              {currentSlide.items.map((item: { title: string; content: string }, index: number) => (
                <div key={index} className="train-expandable-item">
                  <div
                    className={`train-expandable-header ${expandedItems.includes(index) ? "expanded" : ""}`}
                    onClick={() => toggleExpandItem(index)}
                  >
                    <span>{item.title}</span>
                    <span className="train-expandable-icon">{expandedItems.includes(index) ? "−" : "+"}</span>
                  </div>
                  {expandedItems.includes(index) && <div className="train-expandable-content">{item.content}</div>}
                </div>
              ))}
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "horizontal-series":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-horizontal-series-preview">
              <div className="train-horizontal-series-item">
                {currentSlide.items[horizontalSeriesIndex]?.content || "No content"}
              </div>
              <div className="train-horizontal-series-navigation">
                {currentSlide.items.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`train-horizontal-series-dot ${index === horizontalSeriesIndex ? "active" : ""}`}
                    onClick={() => updateHorizontalSeriesIndex(index)}
                  ></div>
                ))}
              </div>
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "reveal":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-reveal-preview">
              <div className="train-reveal-item active">
                <div className="train-reveal-content">
                  {currentSlide.items[activeRevealItem]?.description || "Select an item below"}
                </div>
              </div>
              <div className="train-reveal-buttons">
                {currentSlide.items.map((item: { title: string }, index: number) => (
                  <div key={index} className="train-reveal-button">
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
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "quote":
        return (
          <div className="train-slide-content">
            <div className="train-quote-container">
              <blockquote className="train-quote-text">{currentSlide.quote}</blockquote>
              <cite className="train-quote-author">{currentSlide.author}</cite>
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "scrolling-text":
      case "scrolling-mix":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-scrolling-content">
              <p>{currentSlide.content}</p>
              {currentSlide.media && (
                <div className="train-scrolling-media">
                  {currentSlide.mediaType === "image" ? (
                    <img
                      src={currentSlide.media || "/placeholder.svg"}
                      alt="Content media"
                      className="train-scrolling-image"
                    />
                  ) : (
                    <video src={currentSlide.media} controls className="train-scrolling-video"></video>
                  )}
                </div>
              )}
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "image-slide":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <p className="train-slide-subtitle-preview">{currentSlide.subtitle}</p>
            {currentSlide.image ? (
              <div className="train-image-container">
                <img
                  src={currentSlide.image || "/placeholder.svg"}
                  alt={currentSlide.title}
                  className="train-slide-image"
                />
              </div>
            ) : (
              <div className="train-image-placeholder">
                <ImageIcon size={48} className="train-placeholder-icon" />
              </div>
            )}
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "video-slide":
      case "single-video":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <p className="train-slide-subtitle-preview">{currentSlide.subtitle || ""}</p>
            {currentSlide.video ? (
              <div className="train-video-container">
                <video src={currentSlide.video} controls className="train-slide-video"></video>
              </div>
            ) : (
              <div className="train-video-placeholder">
                <Video size={48} className="train-placeholder-icon" />
              </div>
            )}
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "image-comparison":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div
              className="train-image-comparison-container"
              ref={comparisonRef}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              <div
                className="train-comparison-slider"
                style={{ left: `${currentSlide.sliderPosition || sliderPosition}%` }}
              >
                <div
                  className="train-comparison-slider-handle"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                ></div>
              </div>
              <div
                className="train-comparison-before-image"
                style={{ width: `${currentSlide.sliderPosition || sliderPosition}%` }}
              >
                {currentSlide.beforeImage ? (
                  <img
                    src={currentSlide.beforeImage || "/placeholder.svg"}
                    alt="Before"
                    className="train-comparison-img"
                  />
                ) : (
                  <div className="train-image-placeholder">
                    <ImageIcon size={48} className="train-placeholder-icon" />
                  </div>
                )}
              </div>
              <div
                className="train-comparison-after-image"
                style={{ width: `${100 - (currentSlide.sliderPosition || sliderPosition)}%` }}
              >
                {currentSlide.afterImage ? (
                  <img
                    src={currentSlide.afterImage || "/placeholder.svg"}
                    alt="After"
                    className="train-comparison-img"
                  />
                ) : (
                  <div className="train-image-placeholder">
                    <ImageIcon size={48} className="train-placeholder-icon" />
                  </div>
                )}
              </div>
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "scratch-to-reveal":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-scratch-reveal-container">
              <canvas
                ref={canvasRef}
                className="train-scratch-canvas"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}
              ></canvas>
              <div className="train-scratch-bottom" style={{ width: `100%` }}>
                {currentSlide.bottomImage ? (
                  <img
                    src={currentSlide.bottomImage || "/placeholder.svg"}
                    alt="Bottom layer"
                    className="train-scratch-img"
                  />
                ) : (
                  <div className="train-image-placeholder">
                    <ImageIcon size={48} className="train-placeholder-icon" />
                  </div>
                )}
              </div>
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "image-horizontal-series":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-horizontal-series-preview">
              <div className="train-image-container">
                {currentSlide.images[horizontalSeriesIndex] ? (
                  <img
                    src={currentSlide.images[horizontalSeriesIndex] || "/placeholder.svg"}
                    alt={`Image ${horizontalSeriesIndex + 1}`}
                    className="train-slide-image"
                  />
                ) : (
                  <div className="train-image-placeholder">
                    <ImageIcon size={48} className="train-placeholder-icon" />
                  </div>
                )}
              </div>
              <div className="train-horizontal-series-navigation">
                {currentSlide.images.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`train-horizontal-series-dot ${index === horizontalSeriesIndex ? "active" : ""}`}
                    onClick={() => updateHorizontalSeriesIndex(index)}
                  ></div>
                ))}
              </div>
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "image-collection":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-image-collection-preview">
              {currentSlide.images.map((image: string | null, index: number) => (
                <div key={index} className="train-image-collection-item">
                  {image ? (
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Image ${index + 1}`}
                      className="train-image-collection-img"
                    />
                  ) : (
                    <div className="train-image-placeholder">
                      <ImageIcon size={24} className="train-placeholder-icon" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "image-map":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-image-map-container">
              {currentSlide.image ? (
                <img src={currentSlide.image || "/placeholder.svg"} alt="Image map" className="train-image-map-img" />
              ) : (
                <div className="train-image-placeholder">
                  <ImageIcon size={48} className="train-placeholder-icon" />
                </div>
              )}

              {currentSlide.image &&
                currentSlide.hotspots.map(
                  (hotspot: { x: number; y: number; title: string; description: string }, index: number) => (
                    <div
                      key={index}
                      className="train-image-map-hotspot"
                      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                      onClick={() => setActiveHotspot(activeHotspot === index ? null : index)}
                    >
                      {index + 1}
                    </div>
                  )
                )}

              {activeHotspot !== null && currentSlide.hotspots[activeHotspot] && (
                <div
                  className="train-image-map-tooltip"
                  style={{
                    left: `${Math.min(Math.max(currentSlide.hotspots[activeHotspot].x, 20), 80)}%`,
                    top: `${
                      currentSlide.hotspots[activeHotspot].y > 50
                        ? currentSlide.hotspots[activeHotspot].y - 20
                        : currentSlide.hotspots[activeHotspot].y + 20
                    }%`,
                  }}
                >
                  <div className="train-image-map-tooltip-title">{currentSlide.hotspots[activeHotspot].title}</div>
                  <div>{currentSlide.hotspots[activeHotspot].description}</div>
                </div>
              )}
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "image-stack":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-image-stack-container">
              {currentSlide.images.map((image: string | null, index: number) => (
                <img
                  key={index}
                  src={image || "/placeholder.svg"}
                  alt={`Stack image ${index + 1}`}
                  className="train-image-stack-img"
                  style={{
                    opacity: index === imageStackIndex ? 1 : 0,
                    position: index === 0 ? "relative" : "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
              ))}
              <div className="train-horizontal-series-navigation">
                {currentSlide.images.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`train-horizontal-series-dot ${index === imageStackIndex ? "active" : ""}`}
                    onClick={() => updateImageStackIndex(index)}
                  ></div>
                ))}
              </div>
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "image-waypoints":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-image-waypoints-container">
              {currentSlide.image ? (
                <img
                  src={currentSlide.image || "/placeholder.svg"}
                  alt="Waypoints image"
                  className="train-image-waypoints-img"
                />
              ) : (
                <div className="train-image-placeholder">
                  <ImageIcon size={48} className="train-placeholder-icon" />
                </div>
              )}

              {currentSlide.image &&
                currentSlide.waypoints.map((waypoint: { x: number; y: number; label: string }, index: number) => (
                  <div
                    key={index}
                    className={`train-image-waypoint ${index === waypointIndex ? "active" : ""}`}
                    style={{ left: `${waypoint.x}%`, top: `${waypoint.y}%` }}
                    onClick={() => updateWaypointIndex(index)}
                  >
                    {waypoint.label}
                  </div>
                ))}
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "media-collection":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-media-collection">
              {currentSlide.media.map((item: { type: string; source: string | null }, index: number) => (
                <div key={index} className="train-media-item">
                  {item.source ? (
                    item.type === "image" ? (
                      <img
                        src={item.source || "/placeholder.svg"}
                        alt={`Media ${index + 1}`}
                        className="train-media-image"
                      />
                    ) : (
                      <video src={item.source} controls className="train-media-video"></video>
                    )
                  ) : (
                    <div className="train-media-placeholder">
                      {item.type === "image" ? (
                        <ImageIcon size={24} className="train-placeholder-icon" />
                      ) : (
                        <Video size={24} className="train-placeholder-icon" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "video-collection":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            <div className="train-media-collection">
              {currentSlide.videos.map((video: string | null, index: number) => (
                <div key={index} className="train-media-item">
                  {video ? (
                    <video src={video} controls className="train-media-video"></video>
                  ) : (
                    <div className="train-media-placeholder">
                      <Video size={24} className="train-placeholder-icon" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </ components
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "youtube":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            {currentSlide.youtubeVideoId ? (
              <div className="train-video-container">
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${currentSlide.youtubeVideoId}`}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="train-video-placeholder">
                <Video size={48} className="train-placeholder-icon" />
              </div>
            )}
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      case "vimeo":
        return (
          <div className="train-slide-content">
            <h2 className="train-slide-title-preview">{currentSlide.title}</h2>
            {currentSlide.vimeoVideoId ? (
              <div className="train-video-container">
                <iframe
                  src={`https://player.vimeo.com/video/${currentSlide.vimeoVideoId}`}
                  width="100%"
                  height="315"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Vimeo video"
                ></iframe>
              </div>
            ) : (
              <div className="train-video-placeholder">
                <Video size={48} className="train-placeholder-icon" />
              </div>
            )}
            <button className="train-slide-button-preview" onClick={handleNextSlide}>
              {currentSlide.buttonText}
            </button>
            <button
              className="train-delete-slide-button"
              onClick={() => {
                setSlideToDelete(currentSlideIndex);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSlideEditor = () => {
    switch (currentSlide.type) {
      case "title-slide":
        return (
          <>
            <div className="train-form-group">
              <label className="train-form-label">TITLE</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>
            <div className="train-form-group">
              <label className="train-form-label">SUBTITLE</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.subtitle}
                onChange={(e) => updateSlideContent("subtitle", e.target.value)}
              />
            </div>
            <div className="train-form-group">
              <label className="train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        );

      case "bulleted-list":
        return (
          <>
            <div className="train-form-group">
              <label className="train-form-label">TITLE</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>
            <div className="train-form-group">
              <div className="train-form-section-header">
                <label className="train-form-label">ITEMS</label>
                <button className="train-form-section-toggle">−</button>
              </div>
              <div className="train-expandable-list-editor">
                {currentSlide.items.map((item: string, index: number) => (
                  <div key={index} className="train-expandable-list-item-editor">
                    <div className="train-item-controls">
                      <button className="train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <div className="train-item-fields">
                      <label className="train-form-label">ITEM {index + 1}</label>
                      <input
                        type="text"
                        className="train-form-input"
                        value={item}
                        onChange={(e) => updateBulletedListItem(index, e.target.value)}
                      />
                    </div>
                    <div className="train-item-actions">
                      <button className="train-item-delete" onClick={() => removeBulletedListItem(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="train-add-item-button" onClick={addBulletedListItem}>
                  <Plus size={16} /> Add an item
                </button>
              </div>
            </div>
            <div className="train-form-group">
              <label className="train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        );

      case "comparison":
        return (
          <>
            <div className="train-form-group">
              <label className="train-form-label">TITLE</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>
            <div className="train-form-group">
              <div className="train-form-section-header">
                <label className="train-form-label">BEFORE</label>
                <button className="train-form-section-toggle">−</button>
              </div>
              <label className="train-form-label">CONTENT</label>
              <textarea
                className="train-form-textarea"
                value={currentSlide.before.content}
                onChange={(e) => updateComparisonContent("before", "content", e.target.value)}
              />
              <label className="train-form-label">LABEL</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.before.label}
                onChange={(e) => updateComparisonContent("before", "label", e.target.value)}
              />
            </div>
            <div className="train-form-group">
              <div className="train-form-section-header">
                <label className="train-form-label">AFTER</label>
                <button className="train-form-section-toggle">−</button>
              </div>
              <label className="train-form-label">CONTENT</label>
              <textarea
                className="train-form-textarea"
                value={currentSlide.after.content}
                onChange={(e) => updateComparisonContent("after", "content", e.target.value)}
              />
              <label className="train-form-label">LABEL</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.after.label}
                onChange={(e) => updateComparisonContent("after", "label", e.target.value)}
              />
            </div>
            <div className="train-form-group">
              <label className="train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        );

      case "expandable-list":
        return (
          <>
            <div className="train-form-group">
              <label className="train-form-label">TITLE</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>
            <div className="train-form-group">
              <div className="train-form-section-header">
                <label className="train-form-label">ITEMS</label>
                <button className="train-form-section-toggle">−</button>
              </div>
              <div className="train-expandable-list-editor">
                {currentSlide.items.map((item: { title: string; content: string }, index: number) => (
                  <div key={index} className="train-expandable-list-item-editor">
                    <div className="train-item-controls">
                      <button className="train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <div className="train-item-fields">
                      <label className="train-form-label">TITLE</label>
                      <input
                        type="text"
                        className="train-form-input"
                        value={item.title}
                        onChange={(e) => updateExpandableListItem(index, "title", e.target.value)}
                      />
                      <label className="train-form-label">CONTENT</label>
                      <textarea
                        className="train-form-textarea"
                        value={item.content}
                        onChange={(e) => updateExpandableListItem(index, "content", e.target.value)}
                      />
                    </div>
                    <div className="train-item-actions">
                      <button className="train-item-delete" onClick={() => removeExpandableListItem(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="train-add-item-button" onClick={addExpandableListItem}>
                  <Plus size={16} /> Add an item
                </button>
              </div>
            </div>
            <div className="train-form-group">
              <label className="train-form-label">BUTTON TEXT</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.buttonText}
                onChange={(e) => updateSlideContent("buttonText", e.target.value)}
              />
            </div>
          </>
        );

      case "horizontal-series":
        return (
          <>
            <div className="train-form-group">
              <label className="train-form-label">TITLE</label>
              <input
                type="text"
                className="train-form-input"
                value={currentSlide.title}
                onChange={(e) => updateSlideContent("title", e.target.value)}
              />
            </div>
            <div className="train-form-group">
              <div className="train-form-section-header">
                <label className="train-form-label">ITEMS</label>
                <button className="train-form-section-toggle">−</button>
              </div>
              <div className="train-expandable-list-editor">
                {currentSlide.items.map((item: { content: string }, index: number) => (
                  <div key={index} className="train-expandable-list-item-editor">
                    <div className="train-item-controls">
                      <button className="train-item-move-up">
                        <ChevronUp size={16} />
                      </button>
                      <button className="train-item-move-down">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <div className