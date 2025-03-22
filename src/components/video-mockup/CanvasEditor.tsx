
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

  useEffect(() => {
    if (!isEditing || !canvasRef.current || !imageUrl) return

    const canvas = new Canvas(canvasRef.current, {
      width: containerDimensions.width,
      height: containerDimensions.height,
      backgroundColor: "rgba(0,0,0,0.1)",
    })

    setFabricCanvas(canvas)

    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl

    img.onload = () => {
      const fabricImage = new FabricImage(img)

      // Enable corner controls for resizing
      fabricImage.set({
        borderColor: '#3b82f6',
        cornerColor: 'white',
        cornerStrokeColor: '#3b82f6',
        cornerSize: 12,
        transparentCorners: false,
        cornerStyle: 'circle',
        hasControls: true,
        hasBorders: true,
      })

      if (savedPosition) {
        fabricImage.set({
          left: savedPosition.left,
          top: savedPosition.top,
          scaleX: savedPosition.scaleX,
          scaleY: savedPosition.scaleY,
          angle: savedPosition.angle || 0,
        })
      } else {
        fabricImage.scaleToWidth(containerDimensions.width * 0.8)
        fabricImage.set({
          left: containerDimensions.width / 2 - (fabricImage.width * fabricImage.scaleX) / 2,
          top: containerDimensions.height / 2 - (fabricImage.height * fabricImage.scaleY) / 2,
        })
      }

      // Add the image to the canvas
      canvas.add(fabricImage)
      canvas.setActiveObject(fabricImage)
      canvas.renderAll()

      setOriginalImageDimensions({
        width: img.width,
        height: img.height,
      })
      setImageLoaded(true)
    }

    return () => {
      canvas.dispose()
    }
  }, [isEditing, imageUrl, containerDimensions, savedPosition, setFabricCanvas, setOriginalImageDimensions])

  return (
    <div className="absolute inset-0 z-50">
      <canvas ref={canvasRef} className="w-full h-full" />
      {!imageLoaded && (
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
