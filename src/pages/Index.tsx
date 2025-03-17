
import { useState } from "react";
import VideoMockup from "@/components/VideoMockup";
import VideoOverlays from "@/components/VideoOverlays";
import ImageUpload from "@/components/ImageUpload";
import RenderButton from "@/components/RenderButton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [rendering, setRendering] = useState(false);

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    toast.success("Image uploaded successfully");
  };

  const handleSelectOverlay = (index: number) => {
    setSelectedOverlay(index);
    toast.success(`Overlay ${index + 1} selected`);
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
    
    // Simulate rendering process
    setTimeout(() => {
      setRendering(false);
      toast.success("Video rendered successfully! Download ready.");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/50 to-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 mb-2">
            Chic Video Mockup
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
            />
            
            <RenderButton 
              onRender={handleRender} 
              disabled={!uploadedImage || selectedOverlay === null || rendering}
              rendering={rendering}
            />
          </div>
          
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Upload Your Image</h2>
              <ImageUpload onImageUpload={handleImageUpload} />
            </div>
            
            <Separator className="bg-primary/10" />
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Choose Video Overlay</h2>
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
