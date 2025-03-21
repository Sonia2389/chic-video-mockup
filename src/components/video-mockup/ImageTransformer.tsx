"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface ImageTransformerProps {
  imageSrc: string
}

const ImageTransformer: React.FC<ImageTransformerProps> = ({ imageSrc }) => {
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

  // Start dragging the image
  const startDragImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDragging(true)
    startMousePosRef.current = { x: e.clientX, y: e.clientY }
    startPositionRef.current = { ...position }

    // Add a class to indicate dragging state
    if (containerRef.current) {
      containerRef.current.classList.add("dragging")
    }
  }

  // Start resizing with a specific handle
  const startResize = (e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()

    setActiveHandle(handle)
    startMousePosRef.current = { x: e.clientX, y: e.clientY }
    startDimensionsRef.current = { ...dimensions }
    startPositionRef.current = { ...position }

    // Add a class to indicate resizing state
    if (containerRef.current) {
      containerRef.current.classList.add("resizing")
    }
  }

  // Handle mouse movement for both dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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

    const handleMouseUp = () => {
      setIsDragging(false)
      setActiveHandle(null)

      // Remove state classes
      if (containerRef.current) {
        containerRef.current.classList.remove("dragging", "resizing")
      }
    }

    // Only add listeners when we're in an active state
    if (isDragging || activeHandle) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, activeHandle, position, dimensions])

  return (
    <div
      ref={containerRef}
      className="image-transformer-container"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
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
          cursor: isDragging ? "grabbing" : "grab",
          border: "1px dashed #3b82f6",
          boxSizing: "border-box",
        }}
      >
        {/* The image itself */}
        <img
          src={imageSrc || "/placeholder.svg?height=200&width=300"}
          alt="Transformable image"
          onMouseDown={startDragImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "fill",
            userSelect: "none",
            pointerEvents: activeHandle ? "none" : "auto",
          }}
          draggable="false"
        />

        {/* Resize handles */}
        {["top-left", "top-right", "bottom-left", "bottom-right"].map((handle) => (
          <div
            key={handle}
            className={`resize-handle ${handle}`}
            onMouseDown={(e) => startResize(e, handle)}
            style={{
              position: "absolute",
              width: "14px",
              height: "14px",
              backgroundColor: "white",
              border: "2px solid #3b82f6",
              borderRadius: "50%",
              zIndex: 10,
              cursor: handle.includes("top-left") || handle.includes("bottom-right") ? "nwse-resize" : "nesw-resize",
              ...(handle.includes("top") ? { top: "-7px" } : { bottom: "-7px" }),
              ...(handle.includes("left") ? { left: "-7px" } : { right: "-7px" }),
              touchAction: "none",
            }}
          />
        ))}
      </div>

      {/* Debug info - uncomment if needed */}
      {/* <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px', fontSize: '12px' }}>
        Position: {position.x.toFixed(0)}, {position.y.toFixed(0)} | 
        Size: {dimensions.width.toFixed(0)} × {dimensions.height.toFixed(0)} | 
        {isDragging ? 'Dragging' : activeHandle ? `Resizing: ${activeHandle}` : 'Idle'}
      </div> */}
    </div>
  )
}

export default ImageTransformer

