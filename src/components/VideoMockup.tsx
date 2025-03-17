
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Monitor } from "lucide-react";

interface VideoMockupProps {
  imageUrl: string | null;
  overlayIndex: number | null;
}

const OVERLAY_PLACEHOLDER = [
  "Elegant Frame",
  "Modern Split",
  "Dynamic Motion"
];

const VideoMockup = ({ imageUrl, overlayIndex }: VideoMockupProps) => {
  return (
    <Card className="overflow-hidden shadow-xl">
      <CardContent className="p-0 relative">
        <div className="aspect-video bg-muted relative overflow-hidden">
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
                {/* Base image */}
                <img 
                  src={imageUrl} 
                  alt="Uploaded content" 
                  className="object-cover w-full h-full"
                />
                
                {/* Overlay effect */}
                {overlayIndex !== null && (
                  <div 
                    className={`absolute inset-0 ${getOverlayClass(overlayIndex)}`}
                    aria-label={`Overlay: ${OVERLAY_PLACEHOLDER[overlayIndex]}`}
                  >
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {OVERLAY_PLACEHOLDER[overlayIndex]}
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

// Helper function to get overlay CSS classes based on selected index
function getOverlayClass(index: number): string {
  switch (index) {
    case 0: // Elegant Frame
      return "border-[20px] border-white/90 backdrop-blur-sm";
    case 1: // Modern Split
      return "bg-gradient-to-r from-transparent via-white/20 to-transparent backdrop-blur-[2px]";
    case 2: // Dynamic Motion
      return "bg-gradient-to-t from-black/50 to-transparent";
    default:
      return "";
  }
}

export default VideoMockup;
