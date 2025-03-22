
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

  // Ensure overlay is always on top with z-index 50 (higher than image z-index which is 20)
  const overlayStyles = {
    zIndex: 50,
    pointerEvents: isEditing ? "none" as const : "auto" as const,
    opacity: 0.4, // Set opacity to 40%
  };

  return (
    <div className="absolute inset-0" aria-label="Overlay" style={overlayStyles}>
      {currentOverlay.type === "image" ? (
        <div
          style={{
            backgroundImage: `url(${currentOverlay.url})`,
            backgroundPosition: "center",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            width: "100%",
            height: "100%",
            pointerEvents: "none" as const,
          }}
        />
      ) : (
        <video
          ref={overlayVideoRef}
          src={currentOverlay.url}
          className="w-full h-full object-cover"
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
