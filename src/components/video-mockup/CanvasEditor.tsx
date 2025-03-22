
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas, Image as FabricImage } from "fabric"

interface CanvasEditorProps {
  isEditing: boolean
  imageUrl: string | null
  savedPosition: ImagePosition | null
  containerDimensions: { width: number; height: number }
  setOriginalImageDimensions: (dimensions: { width: number; height: number }) => void
  originalImageDimensions: { width: number; height: number }
  fabricCanvas: Canvas | null
  setFabricCanvas: (canvas: Canvas | null) => void
  onSavePosition: (position: ImagePosition) => void
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

const CanvasEditor: React.FC<CanvasEditorProps> = ({
  isEditing,
  imageUrl,
  savedPosition,
  containerDimensions,
  setOriginalImageDimensions,
  originalImageDimensions,
  fabricCanvas,
  setFabricCanvas,
  onSavePosition,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  
  // Initialize canvas when editing starts
  useEffect(() => {
    if (!isEditing || !canvasRef.current || !imageUrl || isInitializing) return
    
    // Set initializing flag to prevent multiple initialization attempts
    setIsInitializing(true)
    
    // Clean up any existing canvas
    if (fabricCanvas) {
      try {
        fabricCanvas.dispose()
      } catch (error) {
        console.error("Error disposing canvas:", error)
      }
      setFabricCanvas(null)
    }
    
    try {
      console.log("Creating new canvas with dimensions:", containerDimensions.width, containerDimensions.height)
      
      // Create a new fabric canvas
      const canvas = new Canvas(canvasRef.current, {
        width: containerDimensions.width,
        height: containerDimensions.height,
        backgroundColor: "rgba(0,0,0,0.1)",
        selection: false,
        preserveObjectStacking: true,
      })
      
      // Store the canvas reference
      setFabricCanvas(canvas)
      
      // Load image onto canvas
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageUrl
      
      img.onload = () => {
        try {
          console.log("Image loaded:", img.width, img.height)
          
          // Update original dimensions
          setOriginalImageDimensions({
            width: img.width,
            height: img.height,
          })
          
          // Create fabric image
          const fabricImage = new FabricImage(img)
          
          // Configure controls
          fabricImage.set({
            borderColor: '#3b82f6',
            cornerColor: 'white',
            cornerStrokeColor: '#3b82f6',
            cornerSize: 12,
            transparentCorners: false,
            cornerStyle: 'circle',
            hasControls: true,
            hasBorders: true,
            selectable: true,
            lockUniScaling: false,
            centeredScaling: false,
            objectCaching: false,
            padding: 5,
            borderOpacityWhenMoving: 0.4,
          })
          
          // Enable all corner controls
          fabricImage.setControlsVisibility({
            mt: true,
            mb: true,
            ml: true,
            mr: true,
            tl: true,
            tr: true,
            bl: true,
            br: true,
          })
          
          // Position the image
          if (savedPosition) {
            fabricImage.set({
              left: savedPosition.left,
              top: savedPosition.top,
              scaleX: savedPosition.scaleX,
              scaleY: savedPosition.scaleY,
              angle: savedPosition.angle || 0,
              width: savedPosition.originalWidth,
              height: savedPosition.originalHeight,
            })
          } else {
            // Center the image if no saved position
            fabricImage.scaleToWidth(containerDimensions.width * 0.8)
            fabricImage.set({
              left: containerDimensions.width / 2 - (fabricImage.width! * fabricImage.scaleX!) / 2,
              top: containerDimensions.height / 2 - (fabricImage.height! * fabricImage.scaleY!) / 2,
            })
          }
          
          // Add image to canvas
          canvas.add(fabricImage)
          canvas.setActiveObject(fabricImage)
          canvas.renderAll()
          
          // Add event listeners
          canvas.on('object:moving', () => {
            canvas.renderAll()
          })
          
          canvas.on('object:scaling', () => {
            canvas.renderAll()
          })
          
          canvas.on('object:rotating', () => {
            canvas.renderAll()
          })
          
          setImageLoaded(true)
          setIsInitializing(false)
        } catch (error) {
          console.error("Error setting up image on canvas:", error)
          setImageLoaded(false)
          setIsInitializing(false)
        }
      }
      
      img.onerror = (error) => {
        console.error("Error loading image:", error)
        setImageLoaded(false)
        setIsInitializing(false)
      }
    } catch (error) {
      console.error("Error initializing canvas:", error)
      setIsInitializing(false)
    }
    
    // Cleanup function
    return () => {
      // No need to dispose here as it will be handled on the next initialization
    }
  }, [isEditing, containerDimensions, imageUrl, savedPosition])
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (fabricCanvas) {
        try {
          fabricCanvas.dispose()
          setFabricCanvas(null)
        } catch (error) {
          console.error("Error disposing canvas on unmount:", error)
        }
      }
    }
  }, [])

  return (
    <div className="absolute inset-0 z-50">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {isEditing && !imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 text-white">
          Loading image...
        </div>
      )}
      
      {isEditing && imageLoaded && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded text-sm">
          Drag image to move • Drag corners to resize
        </div>
      )}
    </div>
  )
}

export default CanvasEditor
