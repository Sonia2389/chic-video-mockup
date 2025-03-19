
import { useState, useRef, useEffect } from "react";
import VideoMockup from "@/components/VideoMockup";
import VideoOverlays from "@/components/VideoOverlays";
import ImageUpload from "@/components/ImageUpload";
import RenderButton from "@/components/RenderButton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Video, X } from "lucide-react";
import { API_URL } from "@/services/videoRenderingApi";

interface Overlay {
  type: "video";
  url: string;
}

interface ImagePosition {
  left: number;
  top: number;
  scale: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  originalWidth: number;
  originalHeight: number;
  angle?: number;
}

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [savedPosition, setSavedPosition] = useState<ImagePosition | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(16/9);
  const [backgroundVideoFile, setBackgroundVideoFile] = useState<File | null>(null);
  const [overlayImageFile, setOverlayImageFile] = useState<File | null>(null);
  const [overlayVideoFile, setOverlayVideoFile] = useState<File | null>(null);
  const [containerDimensions, setContainerDimensions] = useState<{width: number, height: number} | null>(null);

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "overlay.png", { type: "image/png" });
        setOverlayImageFile(file);
      })
      .catch(err => console.error("Error converting image URL to File:", err));
      
    toast.success("Image uploaded successfully");
  };

  const handleSelectOverlay = (index: number) => {
    setSelectedOverlay(index);
    
    if (overlays[index]) {
      fetch(overlays[index].url)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "overlay.mp4", { type: "video/mp4" });
          setOverlayVideoFile(file);
        })
        .catch(err => console.error("Error converting overlay URL to File:", err));
    }
    
    toast.success(`Overlay selected`);
  };

  const handleOverlaysChange = (newOverlays: Overlay[]) => {
    setOverlays(newOverlays);
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      if (!file.type.startsWith('video/')) {
        toast.error("Please upload a video file");
        return;
      }
      
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setBackgroundVideoFile(file);
      
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        if (video.videoWidth && video.videoHeight) {
          setVideoAspectRatio(video.videoWidth / video.videoHeight);
        }
      };
      video.load();
      
      toast.success("Background video uploaded successfully");
    }
  };

  const removeVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
      toast.success("Background video removed");
    }
  };

  const handlePositionSave = (position: ImagePosition) => {
    setSavedPosition(position);
  };

  const handleContainerDimensions = (dimensions: {width: number, height: number} | null) => {
    setContainerDimensions(dimensions);
    console.log("Container dimensions updated:", dimensions);
  };

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/50 to-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 mb-2 font-cursive">
            tothefknmoon
          </h1>
          <p className="text-muted-foreground">
            3 Steps to Create Stunning Video Mockups
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="video-mockup-container">
              <VideoMockup 
                imageUrl={uploadedImage} 
                overlayIndex={selectedOverlay}
                videoUrl={videoUrl || undefined}
                overlays={overlays}
                onPositionSave={handlePositionSave}
                savedPosition={savedPosition}
              />
            </div>
            
            <RenderButton
              disabled={!uploadedImage || selectedOverlay === null}
              backgroundVideo={backgroundVideoFile || undefined}
              overlayImage={overlayImageFile || undefined}
              overlayVideo={overlayVideoFile || undefined}
              savedPosition={savedPosition}
              videoAspectRatio={videoAspectRatio}
              containerDimensions={containerDimensions}
            />
            
            {!API_URL.includes("mockify.onrender.com") && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded shadow-sm">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> Currently using a mock implementation. For production rendering, update the API_URL in <code>src/services/config/apiConfig.ts</code>.
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Step 1: Add background video</h2>
              <div className="space-y-4">
                {videoUrl ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Video added</span>
                    <Button variant="outline" size="sm" onClick={removeVideo}>
                      <X size={16} className="mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Video size={16} className="text-primary" />
                        </div>
                        <p className="text-sm font-medium">Upload background video</p>
                        <p className="text-xs text-muted-foreground">MP4, WebM up to 50MB</p>
                      </div>
                      <input
                        id="video-upload"
                        type="file"
                        onChange={handleVideoUpload}
                        accept="video/*"
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
                
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Step 2: Upload your image</h2>
              <ImageUpload onImageUpload={handleImageUpload} />
            </div>
            
            <Separator className="bg-primary/10" />
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Step 3: Add video overlay</h2>
              <VideoOverlays 
                selectedOverlay={selectedOverlay} 
                onSelectOverlay={handleSelectOverlay} 
                onOverlaysChange={handleOverlaysChange}
                videoAspectRatio={videoAspectRatio}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
