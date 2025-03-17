import { useState } from "react";
import VideoMockup from "@/components/VideoMockup";
import VideoOverlays from "@/components/VideoOverlays";
import ImageUpload from "@/components/ImageUpload";
import RenderButton from "@/components/RenderButton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Video, X } from "lucide-react";

// Sample background video
const SAMPLE_VIDEO = {
  name: "Abstract Waves", 
  url: "https://assets.mixkit.co/videos/preview/mixkit-white-waves-digital-animation-6580-large.mp4"
};

interface Overlay {
  type: "video";
  url: string;
}

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [rendering, setRendering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    toast.success("Image uploaded successfully");
  };

  const handleSelectOverlay = (index: number) => {
    setSelectedOverlay(index);
    toast.success(`Overlay selected`);
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
      toast.success("Background video uploaded successfully");
    }
  };

  const handleSelectSampleVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(SAMPLE_VIDEO.url);
    toast.success("Sample background video selected");
  };

  const removeVideo = () => {
    if (videoUrl) {
      if (videoUrl !== SAMPLE_VIDEO.url) {
        URL.revokeObjectURL(videoUrl);
      }
      setVideoUrl(null);
      toast.success("Background video removed");
    }
  };

  const handleRender = () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }
    
    if (selectedOverlay === null) {
      toast.error("Please select a video overlay");
      return;
    }

    setRendering(true);
    
    setTimeout(() => {
      setRendering(false);
      toast.success("Video rendered successfully! Download ready.");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/50 to-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 mb-2 font-cursive">
            tothefknmoon
          </h1>
          <p className="text-muted-foreground">
            Upload your image, choose an overlay, create stunning video mockups
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <VideoMockup 
              imageUrl={uploadedImage} 
              overlayIndex={selectedOverlay}
              videoUrl={videoUrl || undefined}
              overlays={overlays}
            />
            
            <RenderButton 
              onRender={handleRender} 
              disabled={!uploadedImage || selectedOverlay === null || rendering}
              rendering={rendering}
            />
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

                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Or use sample video:</h3>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-2 px-3 w-full"
                    onClick={handleSelectSampleVideo}
                  >
                    <Video size={14} className="mr-2 text-primary" />
                    <span className="text-xs">{SAMPLE_VIDEO.name}</span>
                  </Button>
                </div>
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
