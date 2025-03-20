
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
  
  // When editing, set z-index to a very low value so it doesn't interfere with the canvas
  // This ensures the overlay is behind the canvas during editing but on top during preview
  const zIndexValue = isEditing ? 5 : 30;

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
            opacity: 0.6 // Match the opacity used in rendering (60%)
          }}
        />
      ) : (
        <video
          ref={overlayVideoRef}
          src={overlays[overlayIndex].url}
          className="w-full h-full object-cover"
          style={{ opacity: 0.6 }} // Match the opacity used in rendering (60%)
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
