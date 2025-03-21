"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas, Image as FabricImage } from "fabric"

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [originalVideoDimensions, setOriginalVideoDimensions] = useState({ width: 0, height: 0 })
  const [scaledVideoDimensions, setScaledVideoDimensions] = useState({ width: 0, height: 0 })
  const [currentImagePosition, setCurrentImagePosition] = useState<ImagePosition | null>(savedPosition)
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null)

  // Scale factor for the preview (25% of original size)
  const SCALE_FACTOR = 0.25

  // Log props for debugging
  useEffect(() => {
    console.log("VideoMockup props:", { imageUrl, videoUrl, savedPosition })
  }, [imageUrl, videoUrl, savedPosition])

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
    }
  }

  // Verify image URL is valid
  useEffect(() => {
    if (imageUrl) {
      console.log("Verifying image URL:", imageUrl)
      const img = new Image()
      img.onload = () => {
        console.log("Image verified successfully:", imageUrl)
        setImageLoaded(true)
        setImageError(false)

        // If no saved position, create a default centered position
        if (!currentImagePosition) {
          const containerWidth = scaledVideoDimensions.width || 300
          const containerHeight = scaledVideoDimensions.height || 200

          // Calculate scale to fit image within container
          const scale = Math.min((containerWidth * 0.8) / img.width, (containerHeight * 0.8) / img.height)

          const newPosition = {
            left: containerWidth / 2 - (img.width * scale) / 2,
            top: containerHeight / 2 - (img.height * scale) / 2,
            scale: scale,
            width: img.width * scale,
            height: img.height * scale,
            scaleX: scale,
            scaleY: scale,
            originalWidth: img.width,
            originalHeight: img.height,
            angle: 0,
          }

          console.log("Created default position:", newPosition)
          setCurrentImagePosition(newPosition)
        }
      }
      img.onerror = () => {
        console.error("Failed to load image:", imageUrl)
        setImageLoaded(false)
        setImageError(true)
      }
      img.src = imageUrl
    }
  }, [imageUrl, scaledVideoDimensions, currentImagePosition])

  // Initialize fabric canvas for editing
  useEffect(() => {
    if (isEditing && canvasRef.current && imageUrl && imageLoaded) {
      try {
        setCanvasReady(false)

        const containerWidth = scaledVideoDimensions.width || 300
        const containerHeight = scaledVideoDimensions.height || 200

        console.log("Initializing fabric canvas with dimensions:", containerWidth, containerHeight)

        // Initialize fabric canvas
        const canvas = new Canvas(canvasRef.current)

        // Set canvas dimensions
        canvas.setWidth(containerWidth)
        canvas.setHeight(containerHeight)
        canvas.setBackgroundColor("rgba(0,0,0,0.1)", canvas.renderAll.bind(canvas))

        setFabricCanvas(canvas)

        // Load image into fabric
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          console.log("Image loaded into fabric:", img.width, img.height)

          try {
            const fabricImage = new FabricImage(img)

            // Set position from current position
            if (currentImagePosition) {
              console.log("Setting fabric image position:", currentImagePosition)
              fabricImage.set({
                left: currentImagePosition.left,
                top: currentImagePosition.top,
                scaleX: currentImagePosition.scaleX,
                scaleY: currentImagePosition.scaleY,
                angle: currentImagePosition.angle || 0,
              })
            } else {
              // Center the image
              const scale = Math.min((containerWidth * 0.8) / img.width, (containerHeight * 0.8) / img.height)

              fabricImage.scale(scale)
              fabricImage.set({
                left: containerWidth / 2 - (img.width * scale) / 2,
                top: containerHeight / 2 - (img.height * scale) / 2,
              })
            }

            canvas.add(fabricImage)
            canvas.setActiveObject(fabricImage)
            canvas.renderAll()

            // Set up object modified event
            canvas.on("object:modified", () => {
              const activeObject = canvas.getActiveObject()
              if (activeObject) {
                const coords = activeObject.getBoundingRect()
                const updatedPosition = {
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
                setCurrentImagePosition(updatedPosition)
              }
            })

            setCanvasReady(true)
          } catch (error) {
            console.error("Error creating fabric image:", error)
            setCanvasReady(false)
          }
        }

        img.onerror = (error) => {
          console.error("Error loading image into fabric:", error)
          setCanvasReady(false)
        }

        img.src = imageUrl

        return () => {
          canvas.dispose()
        }
      } catch (error) {
        console.error("Error initializing fabric canvas:", error)
        setCanvasReady(false)
      }
    }
  }, [isEditing, imageUrl, imageLoaded, scaledVideoDimensions, currentImagePosition])

  // Save position when exiting edit mode
  const handleSavePosition = () => {
    if (fabricCanvas) {
      const activeObject = fabricCanvas.getActiveObject()
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

        console.log("Saving position:", newPosition)
        setCurrentImagePosition(newPosition)
        onPositionSave(newPosition)
      }
    }

    setIsEditing(false)
    setCanvasReady(false)
  }

  // Calculate container style based on scaled video dimensions
  const containerStyle = {
    width: scaledVideoDimensions.width > 0 ? `${scaledVideoDimensions.width}px` : "300px",
    height: scaledVideoDimensions.height > 0 ? `${scaledVideoDimensions.height}px` : "200px",
    position: "relative" as const,
    backgroundColor: "#111827",
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  }

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

      {/* Display uploaded image in preview mode or when canvas is not ready */}
      {imageUrl && (!isEditing || !canvasReady) && currentImagePosition && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
          {imageError ? (
            <div className="bg-red-500 text-white p-2 rounded">Failed to load image. Please check the URL.</div>
          ) : !imageLoaded ? (
            <div className="bg-gray-800 text-white p-2 rounded">Loading image...</div>
          ) : (
            <img
              ref={imageRef}
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
              onLoad={() => console.log("Preview image loaded")}
              onError={() => console.error("Preview image failed to load")}
            />
          )}
        </div>
      )}

      {/* Video overlay */}
      <VideoOverlay overlayIndex={overlayIndex} overlays={overlays} isEditing={isEditing} />

      {/* Editing interface */}
      {isEditing && (
        <div className="absolute inset-0 z-100">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{
              backgroundColor: "rgba(0,0,0,0.05)",
              display: canvasReady ? "block" : "none",
            }}
          />

          {!canvasReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
              Initializing editor...
            </div>
          )}

          <div className="absolute bottom-4 right-4 z-[200] flex gap-2">
            <button
              onClick={handleSavePosition}
              className="bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            >
              Save Position
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setCanvasReady(false)
              }}
              className="bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit button */}
      {!isEditing && imageUrl && (
        <div className="absolute bottom-4 right-4 z-30">
          <button
            onClick={() => setIsEditing(true)}
            className="bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          >
            Edit Position
          </button>
        </div>
      )}

      {/* Debug info */}
      <div className="absolute top-2 left-2 text-xs text-white bg-black bg-opacity-50 p-1 rounded z-50">
        {originalVideoDimensions.width > 0 &&
          `Video: ${originalVideoDimensions.width}x${originalVideoDimensions.height} (${scaledVideoDimensions.width}x${scaledVideoDimensions.height})`}
        {imageUrl && ` | Image: ${imageLoaded ? "Loaded" : "Loading"}`}
        {isEditing && ` | Canvas: ${canvasReady ? "Ready" : "Initializing"}`}
        {currentImagePosition &&
          ` | Pos: ${Math.round(currentImagePosition.left)},${Math.round(currentImagePosition.top)} Scale: ${currentImagePosition.scaleX.toFixed(2)}`}
      </div>
    </div>
  )
}

export default VideoMockup

