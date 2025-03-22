"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas, Image as FabricImage } from "fabric"
import EditorControls from "./video-mockup/EditorControls"
import PositionManager from "./video-mockup/PositionManager"

const VideoOverlay = ({ overlayIndex, overlays = [], isEditing }) => {
  if (!overlays || !Array.isArray(overlays) || overlayIndex === null || isEditing) {
    return null
  }

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
  overlays = [],
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
  const [lastEditDimensions, setLastEditDimensions] = useState<{ width: number, height: number } | null>(null)
  const [editorMode, setEditorMode] = useState<'select' | 'move'>('select')

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

  useEffect(() => {
    if (isEditing && canvasRef.current && imageUrl && imageLoaded) {
      try {
        setCanvasReady(false)

        const containerWidth = scaledVideoDimensions.width || 600
        const containerHeight = scaledVideoDimensions.height || 400

        console.log("Initializing fabric canvas with dimensions:", containerWidth, containerHeight)

        const canvas = new Canvas(canvasRef.current)

        canvas.setWidth(containerWidth)
        canvas.setHeight(containerHeight)
        canvas.backgroundColor = "rgba(0,0,0,0.1)"
        canvas.renderAll()

        setFabricCanvas(canvas)

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          console.log("Image loaded into fabric:", img.width, img.height)

          try {
            const fabricImage = new FabricImage(img)

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

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;
    
    const moveAmount = 10; // pixels to move
    
    switch(direction) {
      case 'up':
        activeObject.set('top', (activeObject.top || 0) - moveAmount);
        break;
      case 'down':
        activeObject.set('top', (activeObject.top || 0) + moveAmount);
        break;
      case 'left':
        activeObject.set('left', (activeObject.left || 0) - moveAmount);
        break;
      case 'right':
        activeObject.set('left', (activeObject.left || 0) + moveAmount);
        break;
    }
    
    fabricCanvas.renderAll();
    
    // Update current position
    const coords = activeObject.getBoundingRect();
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
    });
  };
  
  const handleResize = (scaleChange: number) => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;
    
    const currentScaleX = activeObject.scaleX || 1;
    const currentScaleY = activeObject.scaleY || 1;
    
    // Apply the scale change
    activeObject.set({
      scaleX: Math.max(0.1, currentScaleX + scaleChange),
      scaleY: Math.max(0.1, currentScaleY + scaleChange)
    });
    
    fabricCanvas.renderAll();
    
    // Update current position
    const coords = activeObject.getBoundingRect();
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
    });
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Save before exiting edit mode
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

      {imageUrl && (!isEditing || !canvasReady) && currentImagePosition && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 15 }}>
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
                zIndex: 15,
              }}
              onLoad={() => console.log("Preview image loaded")}
              onError={() => console.error("Preview image failed to load")}
            />
          )}
        </div>
      )}

      <VideoOverlay overlayIndex={overlayIndex} overlays={overlays} isEditing={isEditing} />

      {isEditing && (
        <div className="absolute inset-0 z-100">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{
              backgroundColor: "rgba(0,0,0,0.05)",
              display: canvasReady ? "block" : "none",
              zIndex: 25,
            }}
          />

          {!canvasReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
              Initializing editor...
            </div>
          )}
        </div>
      )}

      <EditorControls 
        isEditing={isEditing}
        onEditToggle={toggleEditMode}
        activeMode={editorMode}
        onModeChange={setEditorMode}
        onMove={handleMove}
        onResize={handleResize}
        imageUrl={imageUrl}
      />

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
