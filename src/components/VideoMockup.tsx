
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas } from "fabric"
import EditorControls from "./video-mockup/EditorControls"
import CanvasEditor from "./video-mockup/CanvasEditor"
import VideoOverlay from "./video-mockup/VideoOverlay"
import ImageDisplay from "./video-mockup/ImageDisplay"

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

  // Log props for debugging
  useEffect(() => {
    console.log("VideoMockup props:", { imageUrl, backgroundImageUrl, savedPosition })
  }, [imageUrl, backgroundImageUrl, savedPosition])

  // Update current position when savedPosition changes
  useEffect(() => {
    if (savedPosition && JSON.stringify(savedPosition) !== JSON.stringify(currentImagePosition)) {
      // Use deep clone to avoid reference issues
      setCurrentImagePosition(JSON.parse(JSON.stringify(savedPosition)));
      console.log("Updated currentImagePosition from savedPosition:", savedPosition);
    }
  }, [savedPosition, currentImagePosition]);

  // Handle background image loading
  useEffect(() => {
    if (backgroundImageUrl) {
      console.log("Verifying background image URL:", backgroundImageUrl)
      const img = new Image()
      img.onload = () => {
        console.log("Background image verified successfully:", backgroundImageUrl)
        setBackgroundImageLoaded(true)
        setBackgroundImageError(false)
        
        // Scale dimensions without rounding to prevent shifts
        const scaledWidth = img.width * SCALE_FACTOR
        const scaledHeight = img.height * SCALE_FACTOR
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

  // Handle image verification and default position creation
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

          // Create initial position without rounding to maintain precision
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

  // Update container dimensions when they change
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

  // Handle saving position from canvas editor
  const handleSavePosition = () => {
    if (fabricCanvas) {
      try {
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject) {
          // Get precise values without rounding to prevent drift
          const originalWidth = activeObject.width ?? 0;
          const originalHeight = activeObject.height ?? 0;
          
          const newPosition = {
            left: activeObject.left ?? 0,
            top: activeObject.top ?? 0,
            scale: Math.max(activeObject.scaleX ?? 1, activeObject.scaleY ?? 1),
            width: originalWidth * (activeObject.scaleX ?? 1),
            height: originalHeight * (activeObject.scaleY ?? 1),
            scaleX: activeObject.scaleX ?? 1,
            scaleY: activeObject.scaleY ?? 1,
            originalWidth,
            originalHeight,
            angle: activeObject.angle ?? 0,
          };

          console.log("Saving position with exact dimensions:", newPosition);
          // Use deep clone to break references
          setCurrentImagePosition(JSON.parse(JSON.stringify(newPosition)));
          onPositionSave(newPosition);
        }
      } catch (error) {
        console.error("Error saving position:", error);
      }
    }

    if (editorTimeoutRef.current) {
      clearTimeout(editorTimeoutRef.current);
    }

    setIsTransitioning(true);
    setIsEditing(false);
    
    // Allow time for transition to complete
    editorTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 250);
  };

  // Toggle edit mode with proper transitions
  const toggleEditMode = () => {
    if (isEditing) {
      handleSavePosition();
    } else {
      if (editorTimeoutRef.current) {
        clearTimeout(editorTimeoutRef.current);
      }
      
      setIsTransitioning(true);
      
      // Small delay before showing editor to ensure smooth transition
      editorTimeoutRef.current = setTimeout(() => {
        setIsEditing(true);
        editorTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, 200); // Slightly shorter to ensure visual continuity
      }, 50); // Faster transition in
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (editorTimeoutRef.current) {
        clearTimeout(editorTimeoutRef.current);
      }
    }
  }, []);

  // Container style for mockup
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
    <div style={containerStyle} ref={containerRef} className="video-mockup-container bg-transparent">
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

      {imageUrl && !isEditing && (
        <ImageDisplay 
          imageUrl={imageUrl} 
          savedPosition={currentImagePosition} 
          isEditing={isEditing || isTransitioning} 
        />
      )}

      {imageUrl && (isEditing || isTransitioning) && (
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
