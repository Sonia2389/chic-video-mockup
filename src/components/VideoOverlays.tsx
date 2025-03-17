
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface VideoOverlaysProps {
  selectedOverlay: number | null;
  onSelectOverlay: (index: number) => void;
}

interface Overlay {
  name: string;
  description: string;
  preview: string;
  isCustom: boolean;
  type: "video";
  url: string;
}

const VideoOverlays = ({ selectedOverlay, onSelectOverlay }: VideoOverlaysProps) => {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
    video.currentTime = 1; // Seek to 1 second to get thumbnail
    
    video.onloadeddata = () => {
      // Create a canvas to capture the thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
    
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      toast.error("Error processing video");
    };
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
