"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"

interface ImageTransformerProps {
  imageSrc: string
  isEditing: boolean
  onPositionChange?: (position: { x: number; y: number; width: number; height: number }) => void
}

const ImageTransformer: React.FC<ImageTransformerProps> = ({ imageSrc, isEditing = false, onPositionChange }) => {
  // State for image dimensions and position
  const [dimensions, setDimensions] = useState({ width: 300, height: 200 })
  const [position, setPosition] = useState({ x: 50, y: 50 })

  // State for tracking interactions
  const [activeHandle, setActiveHandle] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Refs for tracking mouse positions
  const startMousePosRef = useRef({ x: 0, y: 0 })
  const startDimensionsRef = useRef({ width: 0, height: 0 })
  const startPositionRef = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const lastPositionRef = useRef({ x: 50, y: 50, width: 300, height: 200 })

  // Only notify parent when interaction ends to avoid infinite loops
  const notifyPositionChange = useCallback(() => {
    if (!onPositionChange) return

    const newPosition = {
      x: position.x,
      y: position.y,
      width: dimensions.width,
      height: dimensions.height,
    }

    // Only update if values have changed
    if (
      newPosition.x !== lastPositionRef.current.x ||
      newPosition.y !== lastPositionRef.current.y ||
      newPosition.width !== lastPositionRef.current.width ||
      newPosition.height !== lastPositionRef.current.height
    ) {
      lastPositionRef.current = newPosition
      onPositionChange(newPosition)
    }
  }, [position.x, position.y, dimensions.width, dimensions.height, onPositionChange])

  // Start dragging the image
  const startDragImage = (e: React.MouseEvent) => {
    if (!isEditing) return

    e.preventDefault()
    e.stopPropagation()

    setIsDragging(true)
    startMousePosRef.current = { x: e.clientX, y: e.clientY }
    startPositionRef.current = { ...position }

    // Capture pointer to ensure we get all mouse events
    if (containerRef.current) {
      containerRef.current.style.cursor = "grabbing"
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }
  }

  // Start resizing with a specific handle
  const startResize = (e: React.MouseEvent, handle: string) => {
    if (!isEditing) return

    e.preventDefault()
    e.stopPropagation()

    setActiveHandle(handle)
    startMousePosRef.current = { x: e.clientX, y: e.clientY }
    startDimensionsRef.current = { ...dimensions }
    startPositionRef.current = { ...position }

    // Capture pointer to ensure we get all mouse events
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  // Handle mouse/pointer movement
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isEditing || (!isDragging && !activeHandle)) return

    e.preventDefault()
    e.stopPropagation()

    // Calculate mouse movement delta
    const deltaX = e.clientX - startMousePosRef.current.x
    const deltaY = e.clientY - startMousePosRef.current.y

    // Handle image dragging
    if (isDragging) {
      setPosition({
        x: startPositionRef.current.x + deltaX,
        y: startPositionRef.current.y + deltaY,
      })
      return
    }

    // Handle resizing with different handles
    if (activeHandle) {
      let newWidth = startDimensionsRef.current.width
      let newHeight = startDimensionsRef.current.height
      let newX = startPositionRef.current.x
      let newY = startPositionRef.current.y

      switch (activeHandle) {
        case "top-left":
          newWidth = Math.max(50, startDimensionsRef.current.width - deltaX)
          newHeight = Math.max(50, startDimensionsRef.current.height - deltaY)
          newX = startPositionRef.current.x + (startDimensionsRef.current.width - newWidth)
          newY = startPositionRef.current.y + (startDimensionsRef.current.height - newHeight)
          break

        case "top-right":
          newWidth = Math.max(50, startDimensionsRef.current.width + deltaX)
          newHeight = Math.max(50, startDimensionsRef.current.height - deltaY)
          newY = startPositionRef.current.y + (startDimensionsRef.current.height - newHeight)
          break

        case "bottom-left":
          newWidth = Math.max(50, startDimensionsRef.current.width - deltaX)
          newHeight = Math.max(50, startDimensionsRef.current.height + deltaY)
          newX = startPositionRef.current.x + (startDimensionsRef.current.width - newWidth)
          break

        case "bottom-right":
          newWidth = Math.max(50, startDimensionsRef.current.width + deltaX)
          newHeight = Math.max(50, startDimensionsRef.current.height + deltaY)
          break
      }

      setDimensions({ width: newWidth, height: newHeight })
      setPosition({ x: newX, y: newY })
    }
  }

  // Handle pointer up to stop dragging/resizing
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isEditing) return

    if (isDragging || activeHandle) {
      e.preventDefault()
      e.stopPropagation()

      // Release pointer capture
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

      setIsDragging(false)
      setActiveHandle(null)

      if (containerRef.current) {
        containerRef.current.style.cursor = "grab"
      }

      // Notify parent of position change when interaction ends
      notifyPositionChange()
    }
  }

  return (
    <div
      ref={containerRef}
      className="image-transformer-container"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        zIndex: isEditing ? 100 : 1, // Ensure it's above other elements when editing
        pointerEvents: isEditing ? "auto" : "none", // Only capture events when editing
      }}
    >
      <div
        className="image-container"
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          cursor: isEditing ? (isDragging ? "grabbing" : "grab") : "default",
          border: isEditing ? "2px solid #3b82f6" : "none",
          boxSizing: "border-box",
          zIndex: 10,
        }}
      >
        {/* The image itself */}
        <img
          src={imageSrc || "/placeholder.svg?height=200&width=300"}
          alt="Transformable image"
          onPointerDown={startDragImage}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "fill",
            userSelect: "none",
            pointerEvents: isEditing ? (activeHandle ? "none" : "auto") : "none",
            touchAction: "none",
          }}
          draggable="false"
        />

        {/* Resize handles - only show when editing */}
        {isEditing &&
          ["top-left", "top-right", "bottom-left", "bottom-right"].map((handle) => (
            <div
              key={handle}
              className={`resize-handle ${handle}`}
              onPointerDown={(e) => startResize(e, handle)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                position: "absolute",
                width: "20px", // Larger handles for easier grabbing
                height: "20px",
                backgroundColor: "white",
                border: "2px solid #3b82f6",
                borderRadius: "50%",
                zIndex: 20,
                cursor: handle.includes("top-left") || handle.includes("bottom-right") ? "nwse-resize" : "nesw-resize",
                ...(handle.includes("top") ? { top: "-10px" } : { bottom: "-10px" }),
                ...(handle.includes("left") ? { left: "-10px" } : { right: "-10px" }),
                touchAction: "none",
              }}
            />
          ))}
      </div>

      {/* Debug info - uncomment if needed */}
      {isEditing && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "5px",
            fontSize: "12px",
            zIndex: 30,
          }}
        >
          Position: {position.x.toFixed(0)}, {position.y.toFixed(0)} | Size: {dimensions.width.toFixed(0)} ×{" "}
          {dimensions.height.toFixed(0)} |
          {isDragging ? "Dragging" : activeHandle ? `Resizing: ${activeHandle}` : "Idle"}
        </div>
      )}
    </div>
  )
}

export default ImageTransformer

