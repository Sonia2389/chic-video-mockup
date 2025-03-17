
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Plus } from "lucide-react";
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
  isCustom?: boolean;
}

const defaultOverlays: Overlay[] = [
  {
    name: "Elegant Frame",
    description: "Classic bordered frame with subtle blur effect",
    preview: "linear-gradient(to right, #e6e9f0 0%, #eef1f5 100%)"
  }
];

const VideoOverlays = ({ selectedOverlay, onSelectOverlay }: VideoOverlaysProps) => {
  const [overlays, setOverlays] = useState<Overlay[]>(defaultOverlays);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.match('image.*')) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Add new overlay to the list
        const newOverlay: Overlay = {
          name: `Custom Overlay ${overlays.length - defaultOverlays.length + 1}`,
          description: "Your custom uploaded overlay",
          preview: result,
          isCustom: true
        };
        
        const newOverlays = [...overlays, newOverlay];
        setOverlays(newOverlays);
        
        // Select the newly added overlay
        onSelectOverlay(newOverlays.length - 1);
        toast.success("Custom overlay uploaded successfully");
      }
    };
    
    reader.onerror = () => {
      toast.error("Error reading file");
    };
    
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium mb-3">Available Overlays</h3>
      
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
              <div 
                className="w-14 h-14 rounded flex-shrink-0"
                style={{ 
                  background: overlay.isCustom ? 'none' : overlay.preview,
                  backgroundImage: overlay.isCustom ? `url(${overlay.preview})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div>
                <h3 className="font-medium text-sm">{overlay.name}</h3>
                <p className="text-xs text-muted-foreground">{overlay.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        className="w-full flex gap-2 items-center"
        onClick={handleUploadClick}
      >
        <Plus size={14} />
        <span>Upload Custom Overlay</span>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </Button>
    </div>
  );
};

export default VideoOverlays;
