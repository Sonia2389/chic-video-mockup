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
}) => {
  const canvasRef = useRef(null)

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
        // Center the image
        fabricImage.scaleToWidth(containerDimensions.width * 0.8)
        fabricImage.set({
          left: containerDimensions.width / 2 - (fabricImage.width * fabricImage.scaleX) / 2,
          top: containerDimensions.height / 2 - (fabricImage.height * fabricImage.scaleY) / 2,
        })
      }

      canvas.add(fabricImage)
      canvas.setActiveObject(fabricImage)
      canvas.renderAll()

      // Store original dimensions
      setOriginalImageDimensions({
        width: img.width,
        height: img.height,
      })
    }

    return () => {
      canvas.dispose()
    }
  }, [isEditing, imageUrl, containerDimensions, savedPosition, setFabricCanvas, setOriginalImageDimensions])

  return (
    <div className="absolute inset-0 z-100">
      <canvas ref={canvasRef} className="w-full h-full" />
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
  const { containerDimensions, setContainerDimensions, originalImageDimensions, setOriginalImageDimensions } =
    useDimensions()
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null)

  // Handle container size detection
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setContainerDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [setContainerDimensions])

  // Save position when exiting edit mode
  const handleSavePosition = () => {
    if (fabricCanvas && fabricCanvas.getObjects().length > 0) {
      const activeObject = fabricCanvas.getActiveObject() || fabricCanvas.getObjects()[0]

      if (activeObject) {
        const coords = activeObject.getBoundingRect()

        onPositionSave({
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
    }

    setIsEditing(false)
  }

  return (
    <div
      className="relative w-full h-0 pb-[56.25%] bg-gray-900 rounded-lg overflow-hidden shadow-xl"
      ref={containerRef}
    >
      {/* Background video */}
      {videoUrl && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{ zIndex: 0 }}
        />
      )}

      {/* Display uploaded image */}
      {!isEditing && imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
          <img
            src={imageUrl || "/placeholder.svg"}
            alt="Uploaded image"
            style={{
              position: "absolute",
              left: savedPosition ? savedPosition.left : "50%",
              top: savedPosition ? savedPosition.top : "50%",
              width: savedPosition ? savedPosition.originalWidth : "auto",
              height: savedPosition ? savedPosition.originalHeight : "auto",
              maxWidth: "90%",
              maxHeight: "90%",
              transform: savedPosition
                ? `scale(${savedPosition.scaleX}, ${savedPosition.scaleY}) rotate(${savedPosition.angle || 0}deg)`
                : "translate(-50%, -50%)",
              transformOrigin: savedPosition ? "top left" : "center",
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
            savedPosition={savedPosition}
            containerDimensions={containerDimensions}
            setOriginalImageDimensions={setOriginalImageDimensions}
            originalImageDimensions={originalImageDimensions}
            fabricCanvas={fabricCanvas}
            setFabricCanvas={setFabricCanvas}
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
    </div>
  )
}

export default VideoMockup

