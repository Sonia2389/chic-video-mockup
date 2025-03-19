
import { useState, useEffect } from "react";
import { Canvas } from 'fabric';
import { toast } from "sonner";

export interface ImagePosition {
  left: number;
  top: number;
  scale: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  originalWidth: number;
  originalHeight: number;
  angle?: number;
}

interface PositionManagerProps {
  isEditing: boolean;
  fabricCanvas: Canvas | null;
  onSave: (position: ImagePosition) => void;
  containerDimensions: {width: number, height: number} | null;
  setLastEditDimensions: (dimensions: {width: number, height: number} | null) => void;
}

const PositionManager = ({
  isEditing,
  fabricCanvas,
  onSave,
  containerDimensions,
  setLastEditDimensions
}: PositionManagerProps) => {
  
  const handleSavePosition = () => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      // Calculate the actual display dimensions to maintain consistency
      const scaledWidth = activeObject.getScaledWidth();
      const scaledHeight = activeObject.getScaledHeight();
      
      // Ensure we precisely capture all dimensions and transformations
      const newPosition = {
        left: activeObject.left!,
        top: activeObject.top!,
        scale: Math.max(activeObject.scaleX!, activeObject.scaleY!),
        scaleX: activeObject.scaleX!,
        scaleY: activeObject.scaleY!,
        width: scaledWidth,
        height: scaledHeight,
        originalWidth: activeObject.width!,
        originalHeight: activeObject.height!,
        angle: activeObject.angle
      };
      
      onSave(newPosition);
      
      if (containerDimensions) {
        setLastEditDimensions(containerDimensions);
      }
      
      toast.success("Image position saved");
    }
  };

  // Return null as this is a logic component with no UI
  if (!isEditing) return null;
  
  return null;
};

export default PositionManager;
export type { ImagePosition };
