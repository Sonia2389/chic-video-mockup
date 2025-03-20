import React, { useState, useEffect, useRef } from "react";
import { Canvas, Image } from 'fabric';
import VideoOverlay from "./video-mockup/VideoOverlay";
import { useDimensions } from "@/hooks/useDimensions";
import CanvasEditor from "./video-mockup/CanvasEditor";

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

interface Overlay {
  type: "image" | "video";
  url: string;
}

interface VideoMockupProps {
  imageUrl: string | null;
  overlayIndex: number | null;
  videoUrl?: string;
  overlays: Overlay[];
  onPositionSave: (position: ImagePosition) => void;
  savedPosition: ImagePosition | null;
}

const VideoMockup: React.FC<VideoMockupProps> = ({
  imageUrl,
  overlayIndex,
  videoUrl,
  overlays,
  onPositionSave,
  savedPosition
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { 
    containerDimensions, 
    setContainerDimensions,
    originalImageDimensions,
    setOriginalImageDimensions
  } = useDimensions();
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);

  // Handle container size detection
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [setContainerDimensions]);

  // Save position when exiting edit mode
  const handleSavePosition = () => {
    if (fabricCanvas && fabricCanvas.getObjects().length > 0) {
      const activeObject = fabricCanvas.getActiveObject() || fabricCanvas.getObjects()[0];
      
      if (activeObject) {
        const coords = activeObject.getBoundingRect();
        
        onPositionSave({
          left: activeObject.left || 0,
          top: activeObject.top || 0,
          scale: 1,
          width: coords.width,
          height: coords.height,
          scaleX: activeObject.scaleX || 1,
          scaleY: activeObject.scaleY || 1,
          originalWidth: activeObject.width || 0,
          originalHeight: activeObject.height || 0,
          angle: activeObject.angle || 0
        });
      }
    }
    
    setIsEditing(false);
  };

  return (
    <div className="relative w-full h-0 pb-[56.25%] bg-gray-900 rounded-lg overflow-hidden shadow-xl" ref={containerRef}>
      {/* Background video */}
      {videoUrl && (
        <video
          className="absolute inset-0 w-full h-full object-cover" // Changed back to object-cover
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{ zIndex: 10 }}
        />
      )}
      
      {/* Video overlay */}
      <VideoOverlay 
        overlayIndex={overlayIndex} 
        overlays={overlays} 
        isEditing={isEditing}
      />
      
      {/* Editing interface */}
      {isEditing ? (
        <>
          <CanvasEditor
            isEditing={isEditing}
            imageUrl={imageUrl}
            savedPosition={savedPosition}
            containerDimensions={containerDimensions}
            setOriginalImageDimensions={setOriginalImageDimensions}
            originalImageDimensions={originalImageDimensions}
            fabricCanvas={fabricCanvas}
            setFabricCanvas={setFabricCanvas}
          />
          <div className="absolute bottom-4 right-4 z-[200] flex gap-2">
            <button
              onClick={handleSavePosition}
              className="bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            >
              Save Position
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="absolute bottom-4 right-4 z-30">
          {imageUrl && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            >
              Edit Position
            </button>
          )}
        </div>
      )}
      
      {/* Display uploaded image */}
      {!isEditing && imageUrl && savedPosition && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
          <img
            src={imageUrl}
            alt="Uploaded image"
            style={{
              position: 'absolute',
              left: savedPosition.left,
              top: savedPosition.top,
              width: savedPosition.originalWidth,
              height: savedPosition.originalHeight,
              transform: `scale(${savedPosition.scaleX}, ${savedPosition.scaleY}) rotate(${savedPosition.angle || 0}deg)`,
              transformOrigin: 'top left',
              pointerEvents: 'none'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoMockup;
