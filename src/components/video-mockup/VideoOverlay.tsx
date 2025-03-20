
import { useEffect, useRef } from "react";

interface Overlay {
  type: "image" | "video";
  url: string;
}

interface VideoOverlayProps {
  overlayIndex: number | null;
  overlays: Overlay[];
  isEditing?: boolean;
}

const VideoOverlay = ({ overlayIndex, overlays, isEditing = false }: VideoOverlayProps) => {
  const overlayVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (overlayIndex !== null && overlays[overlayIndex]?.type === "video" && overlayVideoRef.current) {
      overlayVideoRef.current.play().catch(error => {
        console.error("Error playing overlay video:", error);
      });
    }
  }, [overlayIndex, overlays]);

  if (overlayIndex === null || !overlays[overlayIndex]) return null;
  
  // For editing mode vs. preview mode - ensure overlays are behind the fabric canvas in edit mode
  const zIndexValue = isEditing ? 25 : 30;
  const opacityValue = isEditing ? 0.2 : 0.6; // Reduce opacity even more during editing

  return (
    <div 
      className="absolute inset-0"
      aria-label="Overlay"
      style={{ 
        zIndex: zIndexValue, 
        pointerEvents: isEditing ? 'none' : 'auto' // Disable pointer events when editing
      }}
    >
      {overlays[overlayIndex].type === "image" ? (
        <div 
          style={{
            backgroundImage: `url(${overlays[overlayIndex].url})`,
            backgroundPosition: 'center',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: opacityValue // Lower opacity in edit mode
          }}
        />
      ) : (
        <video
          ref={overlayVideoRef}
          src={overlays[overlayIndex].url}
          className="w-full h-full object-cover"
          style={{ opacity: opacityValue }} // Lower opacity in edit mode
          autoPlay
          loop
          muted
          playsInline
        />
      )}
    </div>
  );
};

export default VideoOverlay;
