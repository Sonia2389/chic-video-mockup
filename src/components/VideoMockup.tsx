
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas, Image as FabricImage } from "fabric"
import EditorControls from "./video-mockup/EditorControls"
import CanvasEditor from "./video-mockup/CanvasEditor"
import ImageDisplay from "./video-mockup/ImageDisplay"
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
  overlays = [],
  onPositionSave,
  savedPosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [originalVideoDimensions, setOriginalVideoDimensions] = useState({ width: 0, height: 0 })
  const [scaledVideoDimensions, setScaledVideoDimensions] = useState({ width: 0, height: 0 })
  const [currentImagePosition, setCurrentImagePosition] = useState<ImagePosition | null>(savedPosition)
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null)
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)

  const SCALE_FACTOR = 0.5

  useEffect(() => {
    console.log("VideoMockup props:", { imageUrl, videoUrl, savedPosition })
  }, [imageUrl, videoUrl, savedPosition])

  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current
      console.log("Original video dimensions:", videoWidth, videoHeight)

      setOriginalVideoDimensions({ width: videoWidth, height: videoHeight })

      const scaledWidth = Math.round(videoWidth * SCALE_FACTOR)
      const scaledHeight = Math.round(videoHeight * SCALE_FACTOR)
      console.log("Scaled video dimensions (50%):", scaledWidth, scaledHeight)

      setScaledVideoDimensions({ width: scaledWidth, height: scaledHeight })
    }
  }

  useEffect(() => {
    if (imageUrl) {
      console.log("Verifying image URL:", imageUrl)
      const img = new Image()
      img.onload = () => {
        console.log("Image verified successfully:", imageUrl)
        setImageLoaded(true)
        setImageError(false)

        if (!currentImagePosition) {
          const containerWidth = scaledVideoDimensions.width || 300
          const containerHeight = scaledVideoDimensions.height || 200

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
  }

  const toggleEditMode = () => {
    if (isEditing) {
      handleSavePosition();
    } else {
      setIsEditing(true);
    }
  };

  const containerStyle = {
    width: scaledVideoDimensions.width > 0 ? `${scaledVideoDimensions.width}px` : "600px",
    height: scaledVideoDimensions.height > 0 ? `${scaledVideoDimensions.height}px` : "400px",
    position: "relative" as const,
    backgroundColor: "#111827",
    borderRadius: "0.5rem",
    overflow: "hidden",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  }

  return (
    <div style={containerStyle} ref={containerRef}>
      {/* Background Video - z-index 10 */}
      {videoUrl && (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white z-10">
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
            style={{ zIndex: 10, objectFit: "cover" }}
          />
        </>
      )}

      {/* Static image display when not editing - z-index 20 */}
      {imageUrl && !isEditing && currentImagePosition && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
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

      {/* Canvas editor component */}
      {isEditing && (
        <CanvasEditor
          isEditing={isEditing}
          imageUrl={imageUrl}
          savedPosition={currentImagePosition}
          containerDimensions={scaledVideoDimensions.width > 0 ? scaledVideoDimensions : { width: 600, height: 400 }}
          setOriginalImageDimensions={setOriginalImageDimensions}
          originalImageDimensions={originalImageDimensions}
          fabricCanvas={fabricCanvas}
          setFabricCanvas={setFabricCanvas}
          onSavePosition={handleSavePosition}
        />
      )}

      {/* Video overlay element - now with z-index 100 to always be on top */}
      {overlayIndex !== null && overlays && overlays[overlayIndex] && (
        <VideoOverlay 
          overlayIndex={overlayIndex} 
          overlays={overlays} 
          isEditing={isEditing} 
        />
      )}

      {/* Editor controls */}
      <EditorControls 
        isEditing={isEditing}
        onEditToggle={toggleEditMode}
        imageUrl={imageUrl}
      />
    </div>
  );
}

export default VideoMockup
