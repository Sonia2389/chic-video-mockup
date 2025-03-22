
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Canvas, Image as FabricImage, Rect } from "fabric"

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
  const fabricCanvasRef = useRef<Canvas | null>(null)

  // Initialize the fabric canvas only once when editing starts
  useEffect(() => {
    if (!isEditing || !canvasRef.current || !imageUrl) return

    const initCanvas = () => {
      try {
        // Clean up any existing canvas first
        if (fabricCanvas) {
          fabricCanvas.dispose()
          setFabricCanvas(null)
        }

        // Create a new fabric canvas with exact dimensions
        const canvas = new Canvas(canvasRef.current!, {
          width: containerDimensions.width,
          height: containerDimensions.height,
          backgroundColor: "rgba(0,0,0,0.1)",
          selection: false, // Disable group selection
          preserveObjectStacking: true,
        })

        console.log("Canvas created with dimensions:", containerDimensions.width, containerDimensions.height)
        
        // Store canvas references
        setFabricCanvas(canvas)
        fabricCanvasRef.current = canvas
        
        // Load and add the image
        loadImage(canvas)
        
        return canvas
      } catch (error) {
        console.error("Error initializing canvas:", error)
        return null
      }
    }

    // Initialize the canvas
    initCanvas()

    // Cleanup function
    return () => {
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose()
        } catch (error) {
          console.error("Error disposing canvas:", error)
        }
        fabricCanvasRef.current = null
        setFabricCanvas(null)
      }
    }
  }, [isEditing, containerDimensions, imageUrl])

  // Function to load and add image to canvas
  const loadImage = (canvas: Canvas) => {
    if (!canvas || !imageUrl) return
    
    setImageLoaded(false)
    
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl

    img.onload = () => {
      try {
        console.log("Image loaded:", img.width, img.height)
        
        if (!canvas) return // Safety check
        
        // Track original image dimensions
        setOriginalImageDimensions({
          width: img.width,
          height: img.height,
        })
        
        const fabricImage = new FabricImage(img)

        // Configure controls for better resizing and moving experience
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

        // Enable all corner and edge controls
        fabricImage.setControlsVisibility({
          mt: true, // middle top
          mb: true, // middle bottom
          ml: true, // middle left
          mr: true, // middle right
          tl: true, // top left
          tr: true, // top right
          bl: true, // bottom left
          br: true, // bottom right
        });

        // Position the image based on saved position or center it
        if (savedPosition) {
          // Set position exactly as saved, with original dimensions
          fabricImage.set({
            left: savedPosition.left,
            top: savedPosition.top,
            scaleX: savedPosition.scaleX,
            scaleY: savedPosition.scaleY,
            angle: savedPosition.angle || 0,
            // Set the width and height to match original saved dimensions
            width: savedPosition.originalWidth,
            height: savedPosition.originalHeight,
          })
        } else {
          // Center the image if there's no saved position
          fabricImage.scaleToWidth(containerDimensions.width * 0.8)
          fabricImage.set({
            left: containerDimensions.width / 2 - (fabricImage.width * fabricImage.scaleX) / 2,
            top: containerDimensions.height / 2 - (fabricImage.height * fabricImage.scaleY) / 2,
          })
        }

        // Clear any existing objects on the canvas
        canvas.clear()
        
        // Add image to canvas and select it automatically
        canvas.add(fabricImage)
        canvas.setActiveObject(fabricImage)
        canvas.renderAll()

        // Add event listeners for interactive feedback
        canvas.on('object:moving', function() {
          canvas.renderAll()
        })
        
        canvas.on('object:scaling', function() {
          canvas.renderAll()
        })
        
        canvas.on('object:rotating', function() {
          canvas.renderAll()
        })
        
        setImageLoaded(true)
      } catch (error) {
        console.error("Error loading image:", error)
      }
    }

    img.onerror = (error) => {
      console.error("Failed to load image:", error)
      setImageLoaded(false)
    }
  }

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
