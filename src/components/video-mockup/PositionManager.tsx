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
      
      // Get the original unscaled dimensions for proper scaling during rendering
      const originalWidth = activeObject.width || scaledWidth / (activeObject.scaleX || 1);
      const originalHeight = activeObject.height || scaledHeight / (activeObject.scaleY || 1);
      
      // Log exact measurements before saving
      console.log("Saving position with measurements:", {
        left: activeObject.left,
        top: activeObject.top,
        scaleX: activeObject.scaleX,
        scaleY: activeObject.scaleY,
        scaledWidth,
        scaledHeight,
        originalWidth,
        originalHeight,
        angle: activeObject.angle,
        containerWidth: containerDimensions?.width,
        containerHeight: containerDimensions?.height
      });
      
      // Ensure we precisely capture all dimensions and transformations
      const newPosition = {
        left: activeObject.left!,
        top: activeObject.top!,
        scale: Math.max(activeObject.scaleX!, activeObject.scaleY!),
        scaleX: activeObject.scaleX!,
        scaleY: activeObject.scaleY!,
        width: scaledWidth,
        height: scaledHeight,
        originalWidth,
        originalHeight,
        angle: activeObject.angle
      };
      
      onSave(newPosition);
      
      if (containerDimensions) {
        setLastEditDimensions(containerDimensions);
        // Store container dimensions for accurate scaling during rendering
        console.log("Container dimensions at save time:", containerDimensions);
      }
      
      toast.success("Image position saved");
    }
  };

  // Automatically save position when editing mode is active and canvas changes
  useEffect(() => {
    if (!isEditing || !fabricCanvas) return;
    
    const handleObjectModified = () => {
      handleSavePosition();
    };
    
    fabricCanvas.on('object:modified', handleObjectModified);
    
    return () => {
      fabricCanvas.off('object:modified', handleObjectModified);
    };
  }, [isEditing, fabricCanvas, containerDimensions]);

  // Return null as this is a logic component with no UI
  if (!isEditing) return null;
  
  return null;
};

export default PositionManager;
