
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
  
  // Methods for adjusting position and size
  const moveObject = (direction: 'up' | 'down' | 'left' | 'right', amount = 10) => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;
    
    switch(direction) {
      case 'up':
        activeObject.set('top', (activeObject.top || 0) - amount);
        break;
      case 'down':
        activeObject.set('top', (activeObject.top || 0) + amount);
        break;
      case 'left':
        activeObject.set('left', (activeObject.left || 0) - amount);
        break;
      case 'right':
        activeObject.set('left', (activeObject.left || 0) + amount);
        break;
    }
    
    fabricCanvas.renderAll();
    // Save position after moving
    handleSavePosition();
  };
  
  const changeSize = (scaleChange: number) => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;
    
    const currentScaleX = activeObject.scaleX || 1;
    const currentScaleY = activeObject.scaleY || 1;
    
    // Apply the scale change
    activeObject.set({
      scaleX: Math.max(0.1, currentScaleX + scaleChange),
      scaleY: Math.max(0.1, currentScaleY + scaleChange)
    });
    
    fabricCanvas.renderAll();
    // Save position after resizing
    handleSavePosition();
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

  // Expose functions for external components to use
  return {
    save: handleSavePosition,
    move: moveObject,
    resize: changeSize
  };
};

export default PositionManager;
