
import { useRef, useEffect, useState } from "react";

interface VideoContainerProps {
  videoUrl?: string;
  videoAspectRatio?: number;
  onAspectRatioChange?: (ratio: number) => void;
  children: React.ReactNode;
  setContainerDimensions?: (dimensions: { width: number, height: number } | null) => void;
  isEditing?: boolean;
}

const VideoContainer = ({ 
  videoUrl, 
  videoAspectRatio = 16/9, 
  onAspectRatioChange,
  setContainerDimensions,
  isEditing = false,
  children 
}: VideoContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [containerReady, setContainerReady] = useState(false);

  // Update aspect ratio when video loads
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;
    
    const videoElement = videoRef.current;
    
    const handleMetadataLoaded = () => {
      if (videoElement.videoWidth && videoElement.videoHeight) {
        const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
        if (onAspectRatioChange) {
          onAspectRatioChange(aspectRatio);
        }
      }
    };
    
    videoElement.addEventListener('loadedmetadata', handleMetadataLoaded);
    
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleMetadataLoaded);
    };
  }, [videoUrl, onAspectRatioChange]);

  // Update container dimensions when they change
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current && setContainerDimensions) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width, height });
        setContainerReady(true);
      }
    };
    
    // Initial measurement
    updateDimensions();
    
    // Set up observer for size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    // Also listen for window resize
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener('resize', updateDimensions);
      
      // Clear dimensions when component unmounts
      if (setContainerDimensions) {
        setContainerDimensions(null);
      }
    };
  }, [setContainerDimensions]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-black ${videoUrl ? 'h-[70vh]' : ''}`}
      style={{ 
        paddingBottom: videoUrl ? 'unset' : `${(1 / videoAspectRatio) * 100}%`,
      }}
    >
      <div className={`${videoUrl ? 'absolute inset-0' : ''}`}>
        {videoUrl ? (
          <video 
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            style={{ zIndex: isEditing ? -20 : -10 }}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <div 
            className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800" 
            style={{ zIndex: isEditing ? -20 : -10 }} 
          />
        )}
        
        {containerReady && children}
      </div>
    </div>
  );
};

export default VideoContainer;
