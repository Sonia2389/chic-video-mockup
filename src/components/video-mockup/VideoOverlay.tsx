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
  }, [overlayIndex, overlays[overlayIndex]?.url, isEditing]);

  if (overlayIndex === null || !overlays[overlayIndex]) return null;

  const currentOverlay = overlays[overlayIndex];

  const overlayStyles = {
    zIndex: isEditing ? 25 : 30,
    pointerEvents: isEditing ? "none" : "auto",
    opacity: isEditing ? 0.2 : 0.6, // Lower opacity in edit mode
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
            pointerEvents: "none",
            opacity: overlayStyles.opacity, // Lower opacity in edit mode
          }}
        />
      ) : (
        <video
          ref={overlayVideoRef}
          src={currentOverlay.url}
          className="w-full h-full object-cover"
          style={{ opacity: overlayStyles.opacity }} // Lower opacity in edit mode
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
