
import { useState, useEffect, useRef } from "react";

interface VideoContainerProps {
  videoUrl?: string;
  videoAspectRatio: number;
  onAspectRatioChange: (ratio: number) => void;
  setContainerDimensions: (dimensions: { width: number, height: number } | null) => void;
  children: React.ReactNode;
}

const VideoContainer = ({ 
  videoUrl, 
  videoAspectRatio, 
  onAspectRatioChange,
  setContainerDimensions,
  children 
}: VideoContainerProps) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoUrl) {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.onloadedmetadata = () => {
        setIsVideoLoaded(true);
        if (video.videoWidth && video.videoHeight) {
          onAspectRatioChange(video.videoWidth / video.videoHeight);
        }
      };
      video.onerror = () => console.error("Error loading video");
    }
  }, [videoUrl, onAspectRatioChange]);

  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        const containerWidth = containerRef.current?.clientWidth || 0;
        const containerHeight = containerWidth / videoAspectRatio;
        setContainerDimensions({ width: containerWidth, height: containerHeight });
      };
      
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      
      return () => {
        window.removeEventListener('resize', updateDimensions);
      };
    }
  }, [videoAspectRatio, setContainerDimensions]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden" 
      style={{ 
        paddingBottom: `${(1 / videoAspectRatio) * 100}%`,
      }}
    >
      {videoUrl && (
        <video 
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            if (video.videoWidth && video.videoHeight) {
              onAspectRatioChange(video.videoWidth / video.videoHeight);
            }
          }}
        />
      )}

      {children}
    </div>
  );
};

export default VideoContainer;
