
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
    if (overlayVideoRef.current) {
      if (overlayIndex !== null && overlays[overlayIndex]?.type === "video") {
        if (isEditing) {
          overlayVideoRef.current.pause();
        } else {
          overlayVideoRef.current.play().catch(error => {
            console.error("Error playing overlay video:", error);
          });
        }
      }
    }
  }, [overlayIndex, overlays, isEditing]);

  if (overlayIndex === null || !overlays[overlayIndex]) return null;

  const currentOverlay = overlays[overlayIndex];

  return (
    <div 
      className="absolute inset-0 flex justify-center items-center" 
      aria-label="Overlay" 
      style={{ 
        zIndex: 100, 
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        opacity: 0.4,
      }}
    >
      {currentOverlay.type === "image" ? (
        <div
          style={{
            backgroundImage: `url(${currentOverlay.url})`,
            backgroundPosition: "center",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      ) : (
        <video
          ref={overlayVideoRef}
          src={currentOverlay.url}
          className="w-full h-full"
          style={{
            objectFit: "contain",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
          autoPlay={!isEditing}
          loop
          muted
          playsInline
        />
      )}
    </div>
  );
};

export default VideoOverlay;
