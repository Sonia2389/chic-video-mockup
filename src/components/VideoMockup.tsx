
import { Card, CardContent } from "@/components/ui/card";
import { Monitor } from "lucide-react";
import { useState, useEffect } from "react";

interface VideoMockupProps {
  imageUrl: string | null;
  overlayIndex: number | null;
  videoUrl?: string;
}

const OVERLAY_PLACEHOLDER = [
  "Elegant Frame",
  "Simple Border",
  "Soft Glow"
];

const VideoMockup = ({ imageUrl, overlayIndex, videoUrl }: VideoMockupProps) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    if (videoUrl) {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.onloadeddata = () => setIsVideoLoaded(true);
      video.onerror = () => console.error("Error loading video");
    }
  }, [videoUrl]);

  // Function to get the appropriate overlay styles based on index
  const getOverlayStyles = (index: number | null) => {
    if (index === null) return "";
    
    switch (index) {
      case 0: // Elegant Frame
        return "border-[20px] border-white/90 backdrop-blur-sm";
      case 1: // Simple Border
        return "border-[15px] border-white";
      case 2: // Soft Glow
        return "border-[12px] border-white/80 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]";
      default:
        return "border-[20px] border-white/90 backdrop-blur-sm";
    }
  };

  return (
    <Card className="overflow-hidden shadow-xl">
      <CardContent className="p-0 relative">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {/* Video background */}
          {videoUrl && (
            <video 
              src={videoUrl}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          )}

          {!imageUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Monitor size={48} className="text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium text-muted-foreground">Upload an image to preview</h3>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Your image will appear here in the mockup
              </p>
            </div>
          ) : (
            <div className="absolute inset-0">
              <div className="w-full h-full relative">
                {/* User uploaded image */}
                <img 
                  src={imageUrl} 
                  alt="Uploaded content" 
                  className="object-cover w-full h-full"
                />
                
                {/* Overlay effect */}
                {overlayIndex !== null && (
                  <div 
                    className={`absolute inset-0 ${getOverlayStyles(overlayIndex)}`}
                    aria-label={`Overlay: ${OVERLAY_PLACEHOLDER[overlayIndex] || 'Custom'}`}
                  >
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {OVERLAY_PLACEHOLDER[overlayIndex] || 'Custom Overlay'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoMockup;
