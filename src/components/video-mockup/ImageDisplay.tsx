
import { useRef, useEffect } from "react";

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
  const positionRef = useRef<ImagePosition | null>(null);

  // Store position in ref to compare changes
  useEffect(() => {
    if (savedPosition && JSON.stringify(savedPosition) !== JSON.stringify(positionRef.current)) {
      positionRef.current = savedPosition;
      console.log("Updated display position:", savedPosition);
    }
  }, [savedPosition]);

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
              width: savedPosition.originalWidth ? `${savedPosition.originalWidth * savedPosition.scaleX}px` : `${savedPosition.width}px`,
              height: savedPosition.originalHeight ? `${savedPosition.originalHeight * savedPosition.scaleY}px` : `${savedPosition.height}px`,
              transformOrigin: 'left top',
              transform: `rotate(${savedPosition.angle || 0}deg)`,
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
