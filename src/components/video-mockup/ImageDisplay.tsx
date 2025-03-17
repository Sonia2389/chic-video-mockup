
import { useRef } from "react";

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

interface ImageDisplayProps {
  imageUrl: string | null;
  savedPosition: ImagePosition | null;
  isEditing: boolean;
}

const ImageDisplay = ({ imageUrl, savedPosition, isEditing }: ImageDisplayProps) => {
  const imageRef = useRef<HTMLImageElement>(null);

  if (!imageUrl) return null;

  if (isEditing) return null; // When editing, the canvas handles the display

  return (
    <div className="absolute inset-0">
      <div className="w-full h-full relative">
        {savedPosition ? (
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt="Uploaded content" 
            className="absolute"
            style={{ 
              left: `${savedPosition.left}px`,
              top: `${savedPosition.top}px`,
              width: `${savedPosition.originalWidth}px`, 
              height: `${savedPosition.originalHeight}px`,
              transformOrigin: 'left top',
              transform: `scale(${savedPosition.scaleX}, ${savedPosition.scaleY}) rotate(${savedPosition.angle || 0}deg)`,
              zIndex: 1
            }}
          />
        ) : (
          <img 
            src={imageUrl} 
            alt="Uploaded content" 
            className="object-contain w-auto h-auto max-w-full max-h-full absolute"
            style={{ 
              left: '50%', 
              top: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 1 
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;
