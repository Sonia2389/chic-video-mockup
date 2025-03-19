
import { Canvas } from 'fabric';
import { toast } from "sonner";

interface ImageTransformerProps {
  fabricCanvas: Canvas | null;
}

const ImageTransformer = ({ fabricCanvas }: ImageTransformerProps) => {
  const moveImage = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) {
      if (fabricCanvas.getObjects().length > 0) {
        fabricCanvas.setActiveObject(fabricCanvas.getObjects()[0]);
        fabricCanvas.renderAll();
        return;
      }
      toast.error("No image selected");
      return;
    }

    const MOVE_AMOUNT = 10; // pixels to move
    
    switch (direction) {
      case 'up':
        activeObject.set('top', activeObject.top! - MOVE_AMOUNT);
        break;
      case 'down':
        activeObject.set('top', activeObject.top! + MOVE_AMOUNT);
        break;
      case 'left':
        activeObject.set('left', activeObject.left! - MOVE_AMOUNT);
        break;
      case 'right':
        activeObject.set('left', activeObject.left! + MOVE_AMOUNT);
        break;
    }
    
    fabricCanvas.renderAll();
  };

  const resizeImage = (scaleChange: number) => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) {
      if (fabricCanvas.getObjects().length > 0) {
        fabricCanvas.setActiveObject(fabricCanvas.getObjects()[0]);
        fabricCanvas.renderAll();
        return;
      }
      toast.error("No image selected");
      return;
    }
    
    const currentScale = activeObject.scaleX!;
    const newScale = Math.max(0.1, currentScale + scaleChange); // Prevent scaling to zero or negative
    
    activeObject.scale(newScale);
    fabricCanvas.renderAll();
  };

  return {
    moveImage,
    resizeImage
  };
};

export default ImageTransformer;
