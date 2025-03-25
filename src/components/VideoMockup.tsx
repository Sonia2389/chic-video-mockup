
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

  useEffect(() => {
    console.log("VideoMockup props:", { imageUrl, backgroundImageUrl, savedPosition })
  }, [imageUrl, backgroundImageUrl, savedPosition])

  useEffect(() => {
    if (savedPosition && JSON.stringify(savedPosition) !== JSON.stringify(currentImagePosition)) {
      setCurrentImagePosition(savedPosition);
      console.log("Updated currentImagePosition from savedPosition:", savedPosition);
    }
  }, [savedPosition, currentImagePosition]);

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
            left: Math.round(containerWidth / 2 - (img.width * scale) / 2),
            top: Math.round(containerHeight / 2 - (img.height * scale) / 2),
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

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && onContainerDimensionsChange) {
        const rect = containerRef.current.getBoundingClientRect()
        onContainerDimensionsChange({ 
          width: Math.round(rect.width), 
          height: Math.round(rect.height) 
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

  const handleSavePosition = () => {
    if (fabricCanvas) {
      try {
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject) {
          console.log("Active object before saving:", {
            left: activeObject.left,
            top: activeObject.top,
            scaleX: activeObject.scaleX,
            scaleY: activeObject.scaleY,
            angle: activeObject.angle,
            width: activeObject.width,
            height: activeObject.height
          });
          
          const originalWidth = activeObject.width ?? 0;
          const originalHeight = activeObject.height ?? 0;
          
          const newPosition = {
            left: Math.round(activeObject.left ?? 0),
            top: Math.round(activeObject.top ?? 0),
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
          setCurrentImagePosition(newPosition);
          onPositionSave(newPosition);
        }
      } catch (error) {
        console.error("Error saving position:", error);
      }
    }

    if (editorTimeoutRef.current) {
      clearTimeout(editorTimeoutRef.current);
    }

    // First, hide the editor to prevent flicker
    setIsTransitioning(true);
    setIsEditing(false);
    
    // Then show the image after a brief delay
    editorTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  };

  const toggleEditMode = () => {
    if (isEditing) {
      handleSavePosition();
    } else {
      if (editorTimeoutRef.current) {
        clearTimeout(editorTimeoutRef.current);
      }
      
      setIsTransitioning(true);
      
      // Start editing with a slight delay to allow for transition
      editorTimeoutRef.current = setTimeout(() => {
        setIsEditing(true);
        editorTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, 150);
      }, 50);
    }
  };

  useEffect(() => {
    return () => {
      if (editorTimeoutRef.current) {
        clearTimeout(editorTimeoutRef.current);
      }
    }
  }, []);

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

      {imageUrl && !isEditing && !isTransitioning && (
        <ImageDisplay 
          imageUrl={imageUrl} 
          savedPosition={currentImagePosition} 
          isEditing={isEditing} 
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
