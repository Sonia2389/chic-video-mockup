
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface VideoOverlaysProps {
  selectedOverlay: number | null;
  onSelectOverlay: (index: number) => void;
  onOverlaysChange: (overlays: Overlay[]) => void;
  videoAspectRatio?: number; // Add this prop to receive aspect ratio from parent
}

interface Overlay {
  name: string;
  description: string;
  preview: string;
  isCustom: boolean;
  type: "video";
  url: string;
}

const VideoOverlays = ({ 
  selectedOverlay, 
  onSelectOverlay, 
  onOverlaysChange,
  videoAspectRatio = 16/9 // Default to 16:9 if not provided
}: VideoOverlaysProps) => {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // When overlays change, notify the parent component
  useEffect(() => {
    onOverlaysChange(overlays);
  }, [overlays, onOverlaysChange]);

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processVideo(files[0]);
    }
  };

  const processVideo = (file: File) => {
    if (!file.type.match('video.*')) {
      toast.error("Please upload a video file");
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    
    // Create a video element to generate a thumbnail
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    
    video.onloadedmetadata = () => {
      // Set the video to start at 1 second to get a better thumbnail
      video.currentTime = 1;
      
      video.onseeked = () => {
        // Create a canvas to capture the thumbnail
        const canvas = document.createElement('canvas');
        
        // Set canvas dimensions to match the target aspect ratio
        // but maintain the resolution quality of the source video
        const sourceAspect = video.videoWidth / video.videoHeight;
        
        // If video's natural aspect ratio is wider than target ratio
        if (sourceAspect > videoAspectRatio) {
          // Width is limiting factor
          canvas.width = video.videoWidth;
          canvas.height = video.videoWidth / videoAspectRatio;
        } else {
          // Height is limiting factor
          canvas.height = video.videoHeight;
          canvas.width = video.videoHeight * videoAspectRatio;
        }
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Center the video in the canvas
          let drawX = 0;
          let drawY = 0;
          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          
          // Adjust draw parameters to center the content
          if (sourceAspect > videoAspectRatio) {
            // Video is wider than canvas ratio - center vertically
            drawHeight = video.videoHeight;
            drawWidth = drawHeight * videoAspectRatio;
            drawX = (video.videoWidth - drawWidth) / 2;
          } else {
            // Video is taller than canvas ratio - center horizontally
            drawWidth = video.videoWidth;
            drawHeight = drawWidth / videoAspectRatio;
            drawY = (video.videoHeight - drawHeight) / 2;
          }
          
          // Draw the video frame to canvas with adjusted dimensions
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight, 0, 0, canvas.width, canvas.height);
          
          const thumbnailUrl = canvas.toDataURL('image/jpeg');
          
          // Add new video overlay to the list
          const newOverlay: Overlay = {
            name: `Video Overlay ${overlays.length + 1}`,
            description: `${file.name} (${Math.round(file.size / 1024 / 1024 * 10) / 10} MB)`,
            preview: thumbnailUrl,
            isCustom: true,
            type: "video",
            url: videoUrl
          };
          
          const newOverlays = [...overlays, newOverlay];
          setOverlays(newOverlays);
          
          // Select the newly added overlay
          onSelectOverlay(newOverlays.length - 1);
          toast.success("Video overlay uploaded successfully");
        }
      };
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      toast.error("Error processing video");
    };
    
    // Start loading the video
    video.load();
  };

  const handleUploadClick = () => {
    videoInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium mb-3">Uploaded Overlays</h3>
      
      {overlays.length > 0 ? (
        <div className="space-y-3 mb-4">
          {overlays.map((overlay, index) => (
            <Card 
              key={index}
              className={cn(
                "cursor-pointer overflow-hidden transition-all hover:shadow-md",
                selectedOverlay === index && "ring-2 ring-primary shadow-md"
              )}
              onClick={() => onSelectOverlay(index)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="relative w-14 h-14 rounded flex-shrink-0">
                  <div
                    className="w-full h-full rounded"
                    style={{ 
                      backgroundImage: `url(${overlay.preview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <div className="absolute top-1 right-1 bg-black/70 rounded-full p-1">
                    <Video size={12} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-sm">{overlay.name}</h3>
                  <p className="text-xs text-muted-foreground">{overlay.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mb-4 p-4 border-2 border-dashed rounded-lg text-center">
          <p className="text-sm text-muted-foreground">No video overlays uploaded yet</p>
        </div>
      )}

      <div className="flex justify-center">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full flex gap-2 items-center"
          onClick={handleUploadClick}
        >
          <Video size={14} />
          <span>Upload Video Overlay</span>
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoChange}
            accept="video/*"
            className="hidden"
          />
        </Button>
      </div>
    </div>
  );
};

export default VideoOverlays;
