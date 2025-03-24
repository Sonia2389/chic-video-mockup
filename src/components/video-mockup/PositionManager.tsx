
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
  // Track the last valid position to prevent position shifts
  const [lastSavedPosition, setLastSavedPosition] = useState<ImagePosition | null>(null);
  
  const handleSavePosition = () => {
    if (!fabricCanvas) {
      console.warn("PositionManager: Cannot save position - canvas not available");
      return;
    }
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      // Get exact original dimensions - crucial for accurate display
      const originalWidth = activeObject.width ?? activeObject.getScaledWidth() / (activeObject.scaleX ?? 1);
      const originalHeight = activeObject.height ?? activeObject.getScaledHeight() / (activeObject.scaleY ?? 1);
      
      // Create position object with all necessary data for exact reproduction
      const newPosition = {
        left: activeObject.left ?? 0,
        top: activeObject.top ?? 0,
        scale: Math.max(activeObject.scaleX ?? 1, activeObject.scaleY ?? 1),
        scaleX: activeObject.scaleX ?? 1,
        scaleY: activeObject.scaleY ?? 1,
        width: activeObject.getScaledWidth(),
        height: activeObject.getScaledHeight(),
        originalWidth,
        originalHeight,
        angle: activeObject.angle ?? 0
      };
      
      // Log exact measurements for debugging
      console.log("Saving precise position:", {
        left: newPosition.left,
        top: newPosition.top,
        originalWidth,
        originalHeight,
        scaleX: newPosition.scaleX,
        scaleY: newPosition.scaleY,
        angle: newPosition.angle
      });
      
      // Store this position to use as reference
      setLastSavedPosition(newPosition);
      onSave(newPosition);
      
      if (containerDimensions) {
        setLastEditDimensions(containerDimensions);
      }
      
      toast.success("Image position saved");
    } else {
      console.warn("PositionManager: No active object to save position");
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
  };

  // When returning to editing mode, ensure we apply the last saved position
  useEffect(() => {
    if (isEditing && fabricCanvas && lastSavedPosition) {
      console.log("PositionManager: Applying last saved position in edit mode:", lastSavedPosition);
      const activeObject = fabricCanvas.getActiveObject();
      if (activeObject) {
        // Apply last saved position to ensure consistency
        activeObject.set({
          left: lastSavedPosition.left,
          top: lastSavedPosition.top,
          scaleX: lastSavedPosition.scaleX,
          scaleY: lastSavedPosition.scaleY,
          angle: lastSavedPosition.angle || 0
        });
        fabricCanvas.renderAll();
      }
    }
  }, [isEditing, fabricCanvas, lastSavedPosition]);

  // Expose functions for external components to use
  return {
    save: handleSavePosition,
    move: moveObject,
    resize: changeSize
  };
};

export default PositionManager;
