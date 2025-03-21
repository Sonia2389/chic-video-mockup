"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas, Image as FabricImage } from "fabric"
import { useDimensions } from "@/hooks/useDimensions"

// Simplified VideoOverlay component with proper checks for undefined props
const VideoOverlay = ({ overlayIndex, overlays = [], isEditing }) => {
  // Check if overlays exists and is an array
  if (!overlays || !Array.isArray(overlays) || overlayIndex === null || isEditing) {
    return null
  }

  // Check if the overlay at the specified index exists
  const overlay = overlays[overlayIndex]
  if (!overlay) return null

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {overlay.type === "video" ? (
        <video className="w-full h-full object-cover" src={overlay.url} autoPlay loop muted playsInline />
      ) : (
        <img src={overlay.url || "/placeholder.svg"} alt="Overlay" className="w-full h-full object-cover" />
      )}
    </div>
  )
}

// Simplified CanvasEditor component
const CanvasEditor = ({
  isEditing,
  imageUrl,
  savedPosition,
  containerDimensions,
  setOriginalImageDimensions,
  originalImageDimensions,
  fabricCanvas,
  setFabricCanvas,
  onImageLoaded,
}) => {
  const canvasRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (!isEditing || !canvasRef.current || !imageUrl) return

    // Initialize fabric canvas
    const canvas = new Canvas(canvasRef.current, {
      width: containerDimensions.width,
      height: containerDimensions.height,
    })

    setFabricCanvas(canvas)

    // Load image
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl

    img.onload = () => {
      const fabricImage = new FabricImage(img)

      // Store original dimensions
      const imgDimensions = {
        width: img.width,
        height: img.height,
      }
      setOriginalImageDimensions(imgDimensions)

      // Set initial position if saved position exists
      if (savedPosition) {
        fabricImage.set({
          left: savedPosition.left,
          top: savedPosition.top,
          scaleX: savedPosition.scaleX,
          scaleY: savedPosition.scaleY,
          angle: savedPosition.angle || 0,
        })
      } else {
        // Center the image and scale it to fit nicely in the container
        const scale = Math.min(
          (containerDimensions.width * 0.8) / img.width,
          (containerDimensions.height * 0.8) / img.height,
        )

        fabricImage.scale(scale)
        fabricImage.set({
          left: containerDimensions.width / 2 - (img.width * scale) / 2,
          top: containerDimensions.height / 2 - (img.height * scale) / 2,
        })
      }

      canvas.add(fabricImage)
      canvas.setActiveObject(fabricImage)
      canvas.renderAll()

      setImageLoaded(true)
      if (onImageLoaded) {
        onImageLoaded(fabricImage)
      }
    }

    return () => {
      canvas.dispose()
    }
  }, [
    isEditing,
    imageUrl,
    containerDimensions,
    savedPosition,
    setFabricCanvas,
    setOriginalImageDimensions,
    onImageLoaded,
  ])

  return (
    <div className="absolute inset-0 z-100">
      <canvas ref={canvasRef} className="w-full h-full" />
      {!imageLoaded && imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 text-white">
          Loading image...
        </div>
      )}
    </div>
  )
}

interface ImagePosition {
  left: number
  top: number
  scale: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  originalWidth: number
  originalHeight: number
  angle?: number
}

interface Overlay {
  type: "image" | "video"
  url: string
}

interface VideoMockupProps {
  imageUrl: string | null
  overlayIndex: number | null
  videoUrl?: string
  overlays?: Overlay[]
  onPositionSave: (position: ImagePosition) => void
  savedPosition: ImagePosition | null
}

const VideoMockup: React.FC<VideoMockupProps> = ({
  imageUrl,
  overlayIndex,
  videoUrl,
  overlays = [], // Provide default empty array
  onPositionSave,
  savedPosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [originalVideoDimensions, setOriginalVideoDimensions] = useState({ width: 0, height: 0 })
  const [scaledVideoDimensions, setScaledVideoDimensions] = useState({ width: 0, height: 0 })
  const [currentImagePosition, setCurrentImagePosition] = useState<ImagePosition | null>(savedPosition)
  const [activeImage, setActiveImage] = useState(null)

  const { containerDimensions, setContainerDimensions, originalImageDimensions, setOriginalImageDimensions } =
    useDimensions()
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null)

  // Scale factor for the preview (25% of original size)
  const SCALE_FACTOR = 0.25

  // Handle video metadata loaded - get video dimensions
  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current
      console.log("Original video dimensions:", videoWidth, videoHeight)

      // Store original dimensions
      setOriginalVideoDimensions({ width: videoWidth, height: videoHeight })

      // Calculate scaled dimensions (25% of original)
      const scaledWidth = Math.round(videoWidth * SCALE_FACTOR)
      const scaledHeight = Math.round(videoHeight * SCALE_FACTOR)
      console.log("Scaled video dimensions (25%):", scaledWidth, scaledHeight)

      setScaledVideoDimensions({ width: scaledWidth, height: scaledHeight })

      // Update container dimensions to match scaled video
      setContainerDimensions({ width: scaledWidth, height: scaledHeight })
    }
  }

  // Handle container size detection
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (!scaledVideoDimensions.width && !scaledVideoDimensions.height) {
          setContainerDimensions({ width, height })
        }
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [setContainerDimensions, scaledVideoDimensions])

  // Update current image position when savedPosition changes
  useEffect(() => {
    setCurrentImagePosition(savedPosition)
  }, [savedPosition])

  // Handle image loaded in canvas editor
  const handleImageLoaded = (fabricImage) => {
    setActiveImage(fabricImage)

    // Update current position based on the loaded image
    if (fabricImage) {
      const coords = fabricImage.getBoundingRect()
      setCurrentImagePosition({
        left: fabricImage.left || 0,
        top: fabricImage.top || 0,
        scale: 1,
        width: coords.width,
        height: coords.height,
        scaleX: fabricImage.scaleX || 1,
        scaleY: fabricImage.scaleY || 1,
        originalWidth: fabricImage.width || 0,
        originalHeight: fabricImage.height || 0,
        angle: fabricImage.angle || 0,
      })
    }
  }

  // Save position when exiting edit mode
  const handleSavePosition = () => {
    if (fabricCanvas && fabricCanvas.getObjects().length > 0) {
      const activeObject = fabricCanvas.getActiveObject() || fabricCanvas.getObjects()[0]

      if (activeObject) {
        const coords = activeObject.getBoundingRect()
        const newPosition = {
          left: activeObject.left || 0,
          top: activeObject.top || 0,
          scale: 1,
          width: coords.width,
          height: coords.height,
          scaleX: activeObject.scaleX || 1,
          scaleY: activeObject.scaleY || 1,
          originalWidth: activeObject.width || 0,
          originalHeight: activeObject.height || 0,
          angle: activeObject.angle || 0,
        }

        // Update current position
        setCurrentImagePosition(newPosition)

        // Save position to parent component
        onPositionSave(newPosition)
      }
    }

    setIsEditing(false)
  }

  // Force video play
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      const playVideo = async () => {
        try {
          await videoRef.current?.play()
          setVideoLoaded(true)
          setVideoError(false)
        } catch (error) {
          console.error("Error playing video:", error)
          setVideoError(true)
        }
      }

      playVideo()
    }
  }, [videoUrl, videoRef])

  // Calculate container style based on scaled video dimensions
  const containerStyle = {
    width: scaledVideoDimensions.width > 0 ? `${scaledVideoDimensions.width}px` : "100%",
    height: scaledVideoDimensions.height > 0 ? `${scaledVideoDimensions.height}px` : "0",
    paddingBottom: scaledVideoDimensions.height > 0 ? "0" : "56.25%", // Default 16:9 ratio if no video
    position: "relative" as const,
    backgroundColor: "#111827",
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  }

  // Update image position in real-time during editing
  useEffect(() => {
    if (isEditing && fabricCanvas) {
      fabricCanvas.on("object:modified", () => {
        const activeObject = fabricCanvas.getActiveObject()
        if (activeObject) {
          const coords = activeObject.getBoundingRect()
          setCurrentImagePosition({
            left: activeObject.left || 0,
            top: activeObject.top || 0,
            scale: 1,
            width: coords.width,
            height: coords.height,
            scaleX: activeObject.scaleX || 1,
            scaleY: activeObject.scaleY || 1,
            originalWidth: activeObject.width || 0,
            originalHeight: activeObject.height || 0,
            angle: activeObject.angle || 0,
          })
        }
      })

      return () => {
        fabricCanvas.off("object:modified")
      }
    }
  }, [isEditing, fabricCanvas])

  return (
    <div style={containerStyle} ref={containerRef}>
      {/* Background video */}
      {videoUrl && (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
            {!videoLoaded && !videoError && <p>Loading video...</p>}
            {videoError && <p>Error loading video. Please check the URL.</p>}
          </div>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full"
            src={videoUrl || "/placeholder.svg"}
            autoPlay
            loop
            muted
            playsInline
            onLoadedMetadata={handleVideoMetadata}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            style={{ zIndex: 1, objectFit: "contain" }}
          />
        </>
      )}

      {/* Display uploaded image - show during both editing and non-editing states */}
      {imageUrl && !isEditing && currentImagePosition && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="Uploaded image"
            style={{
              position: "absolute",
              left: currentImagePosition.left,
              top: currentImagePosition.top,
              width: currentImagePosition.originalWidth,
              height: currentImagePosition.originalHeight,
              transform: `scale(${currentImagePosition.scaleX}, ${currentImagePosition.scaleY}) rotate(${currentImagePosition.angle || 0}deg)`,
              transformOrigin: "top left",
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Video overlay */}
      <VideoOverlay overlayIndex={overlayIndex} overlays={overlays} isEditing={isEditing} />

      {/* Editing interface */}
      {isEditing ? (
        <>
          <CanvasEditor
            isEditing={isEditing}
            imageUrl={imageUrl}
            savedPosition={currentImagePosition}
            containerDimensions={containerDimensions}
            setOriginalImageDimensions={setOriginalImageDimensions}
            originalImageDimensions={originalImageDimensions}
            fabricCanvas={fabricCanvas}
            setFabricCanvas={setFabricCanvas}
            onImageLoaded={handleImageLoaded}
          />
          <div className="absolute bottom-4 right-4 z-[200] flex gap-2">
            <button
              onClick={handleSavePosition}
              className="bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            >
              Save Position
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="absolute bottom-4 right-4 z-30">
          {imageUrl && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            >
              Edit Position
            </button>
          )}
        </div>
      )}

      {/* Debug info */}
      <div className="absolute top-2 left-2 text-xs text-white bg-black bg-opacity-50 p-1 rounded z-50">
        {originalVideoDimensions.width > 0 &&
          `Original: ${originalVideoDimensions.width}x${originalVideoDimensions.height} | 
           Preview (25%): ${scaledVideoDimensions.width}x${scaledVideoDimensions.height}`}
        {currentImagePosition &&
          ` | Image: ${Math.round(currentImagePosition.width)}x${Math.round(currentImagePosition.height)}`}
      </div>
    </div>
  )
}

export default VideoMockup

