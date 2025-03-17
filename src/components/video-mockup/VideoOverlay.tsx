
import { useEffect, useRef } from "react";

interface Overlay {
  type: "image" | "video";
  url: string;
}

interface VideoOverlayProps {
  overlayIndex: number | null;
  overlays: Overlay[];
}

const VideoOverlay = ({ overlayIndex, overlays }: VideoOverlayProps) => {
  const overlayVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (overlayIndex !== null && overlays[overlayIndex]?.type === "video" && overlayVideoRef.current) {
      overlayVideoRef.current.play().catch(error => {
        console.error("Error playing overlay video:", error);
      });
    }
  }, [overlayIndex, overlays]);

  if (overlayIndex === null || !overlays[overlayIndex]) return null;

  return (
    <div 
      className="absolute inset-0"
      aria-label="Overlay"
      style={{ zIndex: 2 }}
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
            opacity: 0.15
          }}
        />
      ) : (
        <video
          ref={overlayVideoRef}
          src={overlays[overlayIndex].url}
          className="w-full h-full object-cover"
          style={{ opacity: 0.15 }}
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
