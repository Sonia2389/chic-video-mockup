
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

  // Overlay container style to match background video exactly
  const overlayStyles = {
    position: "absolute" as const,
    inset: 0,
    zIndex: 100,
    pointerEvents: "none" as const,
    opacity: 0.4,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
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
          className="w-full h-full"
          style={{
            objectFit: "contain", // Match the background video's objectFit
            width: "100%",
            height: "100%",
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
