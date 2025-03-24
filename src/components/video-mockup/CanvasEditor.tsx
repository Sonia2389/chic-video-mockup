
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
  const [canvasInitialized, setCanvasInitialized] = useState(false)
  const imageLoadingRef = useRef(false)
  const lastPositionRef = useRef<ImagePosition | null>(null)
  
  // Store the last saved position for comparison
  useEffect(() => {
    if (savedPosition) {
      lastPositionRef.current = savedPosition;
    }
  }, [savedPosition]);
  
  // Initialize canvas when editing starts
  useEffect(() => {
    if (!isEditing || !canvasRef.current || !imageUrl) return
    
    // If we're already loading the image or canvas is initialized, don't try again
    if (imageLoadingRef.current || canvasInitialized) return
    
    // Set loading flag to prevent multiple initialization attempts
    imageLoadingRef.current = true
    
    // Clean up any existing canvas before creating a new one
    if (fabricCanvas) {
      try {
        // Remove all objects before disposal to prevent memory leaks
        fabricCanvas.clear()
        fabricCanvas.dispose()
      } catch (error) {
        console.error("Error disposing canvas:", error)
      }
      setFabricCanvas(null)
    }
    
    let canvas: Canvas | null = null
    
    try {
      console.log("Creating new canvas with dimensions:", containerDimensions.width, containerDimensions.height)
      
      // Create a new fabric canvas
      canvas = new Canvas(canvasRef.current, {
        width: containerDimensions.width,
        height: containerDimensions.height,
        backgroundColor: "rgba(0,0,0,0.1)",
        selection: false,
        preserveObjectStacking: true,
      })
      
      // Store the canvas reference
      setFabricCanvas(canvas)
      setCanvasInitialized(true)
      
      // Load image onto canvas with delay to ensure DOM is ready
      setTimeout(() => {
        if (!canvas) return
        
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = imageUrl
        
        img.onload = () => {
          try {
            if (!canvas) return
            
            console.log("Image loaded:", img.width, img.height)
            
            // Update original dimensions
            setOriginalImageDimensions({
              width: img.width,
              height: img.height,
            })
            
            // Clear any existing objects
            canvas.clear()
            
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
            
            // Position the image - Use the exact saved position if available
            if (savedPosition) {
              console.log("Using saved position:", savedPosition)
              fabricImage.set({
                left: savedPosition.left,
                top: savedPosition.top,
                scaleX: savedPosition.scaleX,
                scaleY: savedPosition.scaleY,
                angle: savedPosition.angle || 0,
                width: savedPosition.originalWidth,
                height: savedPosition.originalHeight,
              })
              
              // Store this position as reference for future comparisons
              lastPositionRef.current = savedPosition;
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
            imageLoadingRef.current = false
          } catch (error) {
            console.error("Error setting up image on canvas:", error)
            setImageLoaded(false)
            imageLoadingRef.current = false
          }
        }
        
        img.onerror = (error) => {
          console.error("Error loading image:", error)
          setImageLoaded(false)
          imageLoadingRef.current = false
        }
      }, 300) // Add a delay to ensure the canvas is properly mounted
    } catch (error) {
      console.error("Error initializing canvas:", error)
      imageLoadingRef.current = false
      setCanvasInitialized(false)
    }
    
    // Cleanup function
    return () => {
      // No need to dispose here as it will be handled on the next initialization
    }
  }, [isEditing, containerDimensions, imageUrl, savedPosition])
  
  // Reset state when editing mode changes
  useEffect(() => {
    if (!isEditing) {
      setImageLoaded(false)
      setCanvasInitialized(false)
    }
  }, [isEditing])
  
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
    <div className={`absolute inset-0 z-50 transition-opacity duration-300 ${isEditing ? 'opacity-100' : 'opacity-0'}`}>
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
