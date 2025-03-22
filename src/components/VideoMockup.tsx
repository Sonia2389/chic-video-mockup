
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas } from "fabric"
import EditorControls from "./video-mockup/EditorControls"
import CanvasEditor from "./video-mockup/CanvasEditor"
import VideoOverlay from "./video-mockup/VideoOverlay"

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
  backgroundImageUrl: string | null
  overlayIndex: number | null
  overlays?: Overlay[]
  onPositionSave: (position: ImagePosition) => void
  savedPosition: ImagePosition | null
  onContainerDimensionsChange?: (dimensions: {width: number, height: number} | null) => void
}

const VideoMockup: React.FC<VideoMockupProps> = ({
  imageUrl,
  backgroundImageUrl,
  overlayIndex,
  overlays = [],
  onPositionSave,
  savedPosition,
  onContainerDimensionsChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false)
  const [backgroundImageError, setBackgroundImageError] = useState(false)
  const [scaledDimensions, setScaledDimensions] = useState({ width: 0, height: 0 })
  const [currentImagePosition, setCurrentImagePosition] = useState<ImagePosition | null>(savedPosition)
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null)
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 })
  const backgroundImageRef = useRef<HTMLImageElement>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const editorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const SCALE_FACTOR = 0.5

  // Log key props for debugging
  useEffect(() => {
    console.log("VideoMockup props:", { imageUrl, backgroundImageUrl, savedPosition })
  }, [imageUrl, backgroundImageUrl, savedPosition])

  // Update current position when savedPosition changes
  useEffect(() => {
    if (savedPosition && JSON.stringify(savedPosition) !== JSON.stringify(currentImagePosition)) {
      setCurrentImagePosition(savedPosition);
    }
  }, [savedPosition]);

  // Handle background image loading
  useEffect(() => {
    if (backgroundImageUrl) {
      console.log("Verifying background image URL:", backgroundImageUrl)
      const img = new Image()
      img.onload = () => {
        console.log("Background image verified successfully:", backgroundImageUrl)
        setBackgroundImageLoaded(true)
        setBackgroundImageError(false)
        
        const scaledWidth = Math.round(img.width * SCALE_FACTOR)
        const scaledHeight = Math.round(img.height * SCALE_FACTOR)
        console.log("Scaled background dimensions (50%):", scaledWidth, scaledHeight)
        
        setScaledDimensions({ width: scaledWidth, height: scaledHeight })
        
        if (onContainerDimensionsChange) {
          onContainerDimensionsChange({ width: scaledWidth, height: scaledHeight })
        }
      }
      img.onerror = () => {
        console.error("Failed to load background image:", backgroundImageUrl)
        setBackgroundImageLoaded(false)
        setBackgroundImageError(true)
      }
      img.src = backgroundImageUrl
    }
  }, [backgroundImageUrl, onContainerDimensionsChange])

  // Handle image loading
  useEffect(() => {
    if (imageUrl) {
      console.log("Verifying image URL:", imageUrl)
      const img = new Image()
      img.onload = () => {
        console.log("Image verified successfully:", imageUrl)
        setImageLoaded(true)
        setImageError(false)

        if (!currentImagePosition) {
          const containerWidth = scaledDimensions.width || 300
          const containerHeight = scaledDimensions.height || 200

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
          onPositionSave(newPosition)
        }
      }
      img.onerror = () => {
        console.error("Failed to load image:", imageUrl)
        setImageLoaded(false)
        setImageError(true)
      }
      img.src = imageUrl
    }
  }, [imageUrl, scaledDimensions, currentImagePosition, onPositionSave])

  // Update container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && onContainerDimensionsChange) {
        const rect = containerRef.current.getBoundingClientRect()
        onContainerDimensionsChange({ 
          width: rect.width, 
          height: rect.height 
        })
      }
    }
    
    updateDimensions()
    
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(updateDimensions)
      resizeObserver.observe(containerRef.current)
      
      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current)
        }
      }
    }
  }, [scaledDimensions, onContainerDimensionsChange])

  // Save position function
  const handleSavePosition = () => {
    if (fabricCanvas) {
      try {
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
      } catch (error) {
        console.error("Error saving position:", error)
      }
    }

    // Clean up any existing timeouts
    if (editorTimeoutRef.current) {
      clearTimeout(editorTimeoutRef.current)
    }

    setIsTransitioning(true)
    // First wait to fade out the editor
    editorTimeoutRef.current = setTimeout(() => {
      setIsEditing(false)
      // Then wait for the transition to complete before showing the static image
      editorTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false)
      }, 500)
    }, 500)
  }

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      handleSavePosition()
    } else {
      // Clean up any existing timeouts
      if (editorTimeoutRef.current) {
        clearTimeout(editorTimeoutRef.current)
      }
      
      setIsTransitioning(true)
      // First fade out the current view
      editorTimeoutRef.current = setTimeout(() => {
        setIsEditing(true)
        // Then wait for the editor to initialize before fading it in
        editorTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false)
        }, 500)
      }, 500)
    }
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (editorTimeoutRef.current) {
        clearTimeout(editorTimeoutRef.current)
      }
    }
  }, [])

  const containerStyle = {
    width: scaledDimensions.width > 0 ? `${scaledDimensions.width}px` : "100%",
    maxWidth: "100%",
    height: scaledDimensions.height > 0 ? `${scaledDimensions.height}px` : "auto",
    maxHeight: "80vh",
    position: "relative" as const,
    backgroundColor: "transparent",
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  }

  return (
    <div style={containerStyle} ref={containerRef} className="bg-transparent">
      {backgroundImageUrl && (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-transparent text-white" style={{ zIndex: 5 }}>
            {!backgroundImageLoaded && !backgroundImageError && <p>Loading background image...</p>}
            {backgroundImageError && <p>Error loading background image. Please check the URL.</p>}
          </div>
          <img
            ref={backgroundImageRef}
            className="absolute inset-0 w-full h-full"
            src={backgroundImageUrl || "/placeholder.svg"}
            alt="Background"
            onLoad={() => setBackgroundImageLoaded(true)}
            onError={() => setBackgroundImageError(true)}
            style={{ zIndex: 5, objectFit: "cover", backgroundColor: "transparent" }}
          />
        </>
      )}

      {imageUrl && !isEditing && currentImagePosition && !isTransitioning && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent transition-opacity duration-500 opacity-100" style={{ zIndex: 20 }}>
          {imageError ? (
            <div className="bg-red-500 text-white p-2 rounded">Failed to load image. Please check the URL.</div>
          ) : !imageLoaded ? (
            <div className="bg-gray-800 text-white p-2 rounded">Loading image...</div>
          ) : (
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
                zIndex: 20,
              }}
            />
          )}
        </div>
      )}

      {(isEditing || isTransitioning) && (
        <CanvasEditor
          isEditing={isEditing}
          imageUrl={imageUrl}
          savedPosition={currentImagePosition}
          containerDimensions={scaledDimensions.width > 0 ? scaledDimensions : { width: 600, height: 400 }}
          setOriginalImageDimensions={setOriginalImageDimensions}
          originalImageDimensions={originalImageDimensions}
          fabricCanvas={fabricCanvas}
          setFabricCanvas={setFabricCanvas}
          onSavePosition={handleSavePosition}
        />
      )}

      {overlayIndex !== null && overlays && overlays[overlayIndex] && (
        <VideoOverlay 
          overlayIndex={overlayIndex} 
          overlays={overlays} 
          isEditing={isEditing} 
        />
      )}

      <EditorControls 
        isEditing={isEditing}
        onEditToggle={toggleEditMode}
        imageUrl={imageUrl}
      />
    </div>
  );
};

export default VideoMockup;
