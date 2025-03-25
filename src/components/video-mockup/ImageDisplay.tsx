
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isShowing, setIsShowing] = useState(false);

  // Reset states when the image URL changes
  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [imageUrl]);

  // Show image after edit mode is toggled
  useEffect(() => {
    if (!isEditing && imageUrl) {
      // Delay showing the image to allow for smooth transition
      const timer = setTimeout(() => {
        setIsShowing(true);
        setImageLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsShowing(false);
    }
  }, [isEditing, imageUrl]);

  if (!imageUrl) {
    return null;
  }

  if (isEditing) {
    return null; // When editing, the canvas handles the display
  }

  return (
    <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${isShowing ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-full h-full relative">
        {savedPosition ? (
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt="Uploaded content" 
            className={`absolute ${imageLoaded ? 'block' : 'hidden'}`}
            style={{ 
              left: `${savedPosition.left}px`,
              top: `${savedPosition.top}px`,
              width: `${savedPosition.originalWidth}px`,
              height: `${savedPosition.originalHeight}px`,
              transformOrigin: 'top left',
              transform: `scale(${savedPosition.scaleX}, ${savedPosition.scaleY}) rotate(${savedPosition.angle || 0}deg)`,
              zIndex: 10
            }}
            onLoad={() => {
              console.log("Image loaded in static display with exact dimensions:", 
                savedPosition.originalWidth, 
                "×", 
                savedPosition.originalHeight,
                "Scale:", 
                savedPosition.scaleX, 
                savedPosition.scaleY
              );
              setImageLoaded(true);
            }}
            onError={() => {
              console.error("Failed to load image in static display");
              setImageError(true);
            }}
          />
        ) : (
          <img 
            src={imageUrl} 
            alt="Uploaded content" 
            className={`object-contain w-auto h-auto max-w-full max-h-full absolute ${imageLoaded ? 'block' : 'hidden'}`}
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
        
        {!imageLoaded && !imageError && !isEditing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white transition-opacity duration-300">
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
