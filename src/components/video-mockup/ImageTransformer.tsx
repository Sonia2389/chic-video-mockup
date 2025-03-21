"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface ImageTransformerProps {
  imageSrc: string
}

const ImageTransformer: React.FC<ImageTransformerProps> = ({ imageSrc }) => {
  const [width, setWidth] = useState(300)
  const [height, setHeight] = useState(200)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startDimensionsRef = useRef({ width: 0, height: 0, x: 0, y: 0 })

  // Handle image movement
  const handleImageMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isResizing) return

    setIsDragging(true)
    startPosRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  // Handle resize handle mousedown
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    startPosRef.current = { x: e.clientX, y: e.clientY }
    startDimensionsRef.current = {
      width,
      height,
      x: position.x,
      y: position.y,
    }
  }

  // Handle mouse movement for both dragging and resizing
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPosRef.current.x,
        y: e.clientY - startPosRef.current.y,
      })
    } else if (isResizing && resizeHandle) {
      const deltaX = e.clientX - startPosRef.current.x
      const deltaY = e.clientY - startPosRef.current.y

      let newWidth = startDimensionsRef.current.width
      let newHeight = startDimensionsRef.current.height
      let newX = startDimensionsRef.current.x
      let newY = startDimensionsRef.current.y

      // Handle different resize corners
      switch (resizeHandle) {
        case "bottom-right":
          newWidth = Math.max(50, startDimensionsRef.current.width + deltaX)
          newHeight = Math.max(50, startDimensionsRef.current.height + deltaY)
          break
        case "bottom-left":
          newWidth = Math.max(50, startDimensionsRef.current.width - deltaX)
          newHeight = Math.max(50, startDimensionsRef.current.height + deltaY)
          newX = startDimensionsRef.current.x + deltaX
          break
        case "top-right":
          newWidth = Math.max(50, startDimensionsRef.current.width + deltaX)
          newHeight = Math.max(50, startDimensionsRef.current.height - deltaY)
          newY = startDimensionsRef.current.y + deltaY
          break
        case "top-left":
          newWidth = Math.max(50, startDimensionsRef.current.width - deltaX)
          newHeight = Math.max(50, startDimensionsRef.current.height - deltaY)
          newX = startDimensionsRef.current.x + deltaX
          newY = startDimensionsRef.current.y + deltaY
          break
      }

      setWidth(newWidth)
      setHeight(newHeight)
      setPosition({ x: newX, y: newY })
    }
  }

  // Handle mouse up to stop dragging/resizing
  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
  }

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, resizeHandle])

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${width}px`,
          height: `${height}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <img
          src={imageSrc || "/placeholder.svg?height=200&width=300"}
          alt="Uploaded"
          onMouseDown={handleImageMouseDown}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "fill",
            pointerEvents: isResizing ? "none" : "auto",
          }}
        />

        {/* Resize handles (circles) */}
        <div
          className="resize-handle top-left"
          style={{
            position: "absolute",
            top: "-6px",
            left: "-6px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "white",
            border: "2px solid #3b82f6",
            cursor: "nwse-resize",
            zIndex: 10,
          }}
          onMouseDown={(e) => handleResizeStart(e, "top-left")}
        />

        <div
          className="resize-handle top-right"
          style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "white",
            border: "2px solid #3b82f6",
            cursor: "nesw-resize",
            zIndex: 10,
          }}
          onMouseDown={(e) => handleResizeStart(e, "top-right")}
        />

        <div
          className="resize-handle bottom-left"
          style={{
            position: "absolute",
            bottom: "-6px",
            left: "-6px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "white",
            border: "2px solid #3b82f6",
            cursor: "nesw-resize",
            zIndex: 10,
          }}
          onMouseDown={(e) => handleResizeStart(e, "bottom-left")}
        />

        <div
          className="resize-handle bottom-right"
          style={{
            position: "absolute",
            bottom: "-6px",
            right: "-6px",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "white",
            border: "2px solid #3b82f6",
            cursor: "nwse-resize",
            zIndex: 10,
          }}
          onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
        />
      </div>
    </div>
  )
}

export default ImageTransformer

