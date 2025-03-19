
import { useState, useEffect } from "react";
import { Canvas } from 'fabric';

export function useEditingMode(fabricCanvas: Canvas | null) {
  const [activeMode, setActiveMode] = useState<'select' | 'move'>('select');

  useEffect(() => {
    if (!fabricCanvas) return;
    
    if (activeMode === 'select') {
      fabricCanvas.selection = true;
      fabricCanvas.getObjects().forEach(obj => {
        obj.selectable = true;
        obj.evented = true;
      });
    } else {
      fabricCanvas.selection = false;
      fabricCanvas.getObjects().forEach(obj => {
        obj.selectable = false;
        obj.evented = true;
      });
      fabricCanvas.discardActiveObject();
    }
    
    fabricCanvas.renderAll();
  }, [activeMode, fabricCanvas]);

  const changeMode = (mode: 'select' | 'move') => {
    setActiveMode(mode);
  };

  return {
    activeMode,
    changeMode
  };
}
