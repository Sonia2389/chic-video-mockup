
import { useRef, useEffect, useState } from "react";

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Store position in ref to compare changes
  useEffect(() => {
    if (savedPosition && JSON.stringify(savedPosition) !== JSON.stringify(positionRef.current)) {
      positionRef.current = savedPosition;
      console.log("Display using exact position:", savedPosition);
    }
  }, [savedPosition]);

  if (!imageUrl) {
    console.log("ImageDisplay: No image URL provided");
    return null;
  }

  if (isEditing) {
    console.log("ImageDisplay: Editor is active, not displaying static image");
    return null; // When editing, the canvas handles the display
  }

  console.log("ImageDisplay: Rendering with image URL:", imageUrl, "Position:", savedPosition);

  return (
    <div className="absolute inset-0 z-10">
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
              transformOrigin: 'top left',
              transform: `scale(${savedPosition.scaleX}, ${savedPosition.scaleY}) rotate(${savedPosition.angle || 0}deg)`,
              zIndex: 10,
              objectFit: 'contain'
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
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
              zIndex: 10
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
            Loading image...
          </div>
        )}
        
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-red-600">
            Error loading image
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;
