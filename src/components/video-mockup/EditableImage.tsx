
"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import ImageTransformer from "./ImageTransformer"

interface EditableImageProps {
  imageSrc: string
  onSave?: (position: { x: number; y: number; width: number; height: number }) => void
}

const EditableImage: React.FC<EditableImageProps> = ({ imageSrc, onSave }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [position, setPosition] = useState({ x: 50, y: 50, width: 300, height: 200 })
  const savedPositionRef = useRef({ x: 50, y: 50, width: 300, height: 200 })

  // Use useCallback to prevent recreation of this function on every render
  const handlePositionChange = useCallback(
    (newPosition: { x: number; y: number; width: number; height: number }) => {
      // Only update state if we're in editing mode to prevent unnecessary renders
      if (isEditing) {
        setPosition(newPosition)
      }
    },
    [isEditing],
  )

  // When exiting edit mode, restore the saved position if user cancels
  useEffect(() => {
    if (!isEditing) {
      // When exiting edit mode without saving, restore the previous saved position
      setPosition(savedPositionRef.current)
    }
  }, [isEditing])

  const handleSave = () => {
    // Save the current position to our ref for future reference
    savedPositionRef.current = { ...position }
    setIsEditing(false)
    if (onSave) {
      onSave(position)
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="secondary" className="bg-white/90 hover:bg-white">
            Edit Position
          </Button>
        ) : (
          <>
            <Button onClick={handleSave} variant="secondary" className="bg-white/90 hover:bg-white">
              Save Position
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" className="bg-white/90 hover:bg-white">
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Image transformer */}
      <ImageTransformer 
        imageSrc={imageSrc} 
        isEditing={isEditing} 
        onPositionChange={handlePositionChange}
        initialPosition={savedPositionRef.current}
      />

      {/* Overlay instructions when editing */}
      {isEditing && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="bg-black/70 text-white px-4 py-2 rounded-md text-sm">
            Drag image to move • Drag corners to resize
          </div>
        </div>
      )}
    </div>
  )
}

export default EditableImage
