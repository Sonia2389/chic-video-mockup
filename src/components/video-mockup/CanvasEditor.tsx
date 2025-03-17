
import { useEffect, useRef } from "react";
import { Canvas, Image } from 'fabric';

interface ImagePosition {
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

interface CanvasEditorProps {
  isEditing: boolean;
  imageUrl: string | null;
  savedPosition: ImagePosition | null;
  containerDimensions: { width: number, height: number } | null;
  setOriginalImageDimensions: (dimensions: { width: number, height: number } | null) => void;
  originalImageDimensions: { width: number, height: number } | null;
  fabricCanvas: Canvas | null;
  setFabricCanvas: (canvas: Canvas | null) => void;
}

const CanvasEditor = ({ 
  isEditing, 
  imageUrl, 
  savedPosition, 
  containerDimensions,
  setOriginalImageDimensions,
  originalImageDimensions,
  fabricCanvas,
  setFabricCanvas
}: CanvasEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !isEditing || !containerDimensions) return;
    
    const canvas = new Canvas(canvasRef.current, {
      width: containerDimensions.width,
      height: containerDimensions.height,
      backgroundColor: 'transparent',
    });
    
    setFabricCanvas(canvas);
    
    if (imageUrl) {
      Image.fromURL(imageUrl).then(img => {
        if (!originalImageDimensions) {
          setOriginalImageDimensions({
            width: img.width!,
            height: img.height!
          });
        }
        
        if (savedPosition) {
          img.set({
            left: savedPosition.left,
            top: savedPosition.top,
            scaleX: savedPosition.scaleX,
            scaleY: savedPosition.scaleY,
            angle: savedPosition.angle || 0,
            cornerSize: 12,
            cornerColor: '#9b87f5',
            borderColor: '#9b87f5',
            cornerStyle: 'circle',
            transparentCorners: false,
            originX: 'left',
            originY: 'top'
          });
        } else {
          const baseScale = Math.min(
            (containerDimensions.width * 0.8) / img.width!,
            (containerDimensions.height * 0.8) / img.height!
          );
          
          img.set({
            left: containerDimensions.width / 2 - (img.width! * baseScale) / 2,
            top: containerDimensions.height / 2 - (img.height! * baseScale) / 2,
            scaleX: baseScale,
            scaleY: baseScale,
            cornerSize: 12,
            cornerColor: '#9b87f5',
            borderColor: '#9b87f5',
            cornerStyle: 'circle',
            transparentCorners: false,
            originX: 'left',
            originY: 'top'
          });
        }
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    }
    
    return () => {
      canvas.dispose();
    };
  }, [imageUrl, isEditing, savedPosition, originalImageDimensions, containerDimensions, setFabricCanvas, setOriginalImageDimensions]);

  if (!isEditing) return null;

  return (
    <div className="absolute inset-0 z-20">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default CanvasEditor;
