
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Move, MousePointer, Maximize, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Canvas, Image } from 'fabric';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

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
  const [videoAspectRatio, setVideoAspectRatio] = useState(16/9); // Default aspect ratio
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [activeMode, setActiveMode] = useState<'select' | 'move'>('select');
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageScale, setImageScale] = useState(0.8);

  useEffect(() => {
    if (!canvasRef.current || !isEditing) return;
    
    const canvas = new Canvas(canvasRef.current, {
      width: containerRef.current?.clientWidth || 800,
      height: (containerRef.current?.clientWidth || 800) / videoAspectRatio,
      backgroundColor: 'transparent',
    });
    
    setFabricCanvas(canvas);
    
    if (imageUrl) {
      // Fix: Use the correct API for Fabric.js v6
      Image.fromURL(imageUrl).then(img => {
        const scale = Math.min(
          (canvas.width! * imageScale) / img.width!,
          (canvas.height! * imageScale) / img.height!
        );
        
        img.scale(scale);
        img.set({
          left: canvas.width! / 2 - (img.width! * scale) / 2,
          top: canvas.height! / 2 - (img.height! * scale) / 2,
          cornerSize: 12,
          cornerColor: '#9b87f5',
          borderColor: '#9b87f5',
          cornerStyle: 'circle',
          transparentCorners: false,
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    }
    
    return () => {
      canvas.dispose();
    };
  }, [imageUrl, isEditing, videoAspectRatio, imageScale]);

  useEffect(() => {
    if (videoUrl) {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.onloadedmetadata = () => {
        setIsVideoLoaded(true);
        if (video.videoWidth && video.videoHeight) {
          setVideoAspectRatio(video.videoWidth / video.videoHeight);
        }
      };
      video.onerror = () => console.error("Error loading video");
    }
  }, [videoUrl]);

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

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      toast.success("Image position saved");
    } else {
      if (!imageUrl) {
        toast.error("Please upload an image first");
        return;
      }
      setIsEditing(true);
    }
  };

  const handleModeChange = (mode: 'select' | 'move') => {
    setActiveMode(mode);
    if (fabricCanvas) {
      if (mode === 'select') {
        fabricCanvas.selection = true;
        fabricCanvas.getObjects().forEach(obj => {
          obj.selectable = true;
          obj.evented = true;
        });
      } else {
        fabricCanvas.selection = false;
        fabricCanvas.getObjects().forEach(obj => {
          obj.selectable = false;
          obj.evented = true;
        });
        fabricCanvas.discardActiveObject();
      }
      fabricCanvas.renderAll();
    }
  };

  const moveImage = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) {
      if (fabricCanvas.getObjects().length > 0) {
        fabricCanvas.setActiveObject(fabricCanvas.getObjects()[0]);
        fabricCanvas.renderAll();
        return;
      }
      toast.error("No image selected");
      return;
    }

    const MOVE_AMOUNT = 10; // pixels to move
    
    switch (direction) {
      case 'up':
        activeObject.set('top', activeObject.top! - MOVE_AMOUNT);
        break;
      case 'down':
        activeObject.set('top', activeObject.top! + MOVE_AMOUNT);
        break;
      case 'left':
        activeObject.set('left', activeObject.left! - MOVE_AMOUNT);
        break;
      case 'right':
        activeObject.set('left', activeObject.left! + MOVE_AMOUNT);
        break;
    }
    
    fabricCanvas.renderAll();
  };

  const resizeImage = (scaleChange: number) => {
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) {
      if (fabricCanvas.getObjects().length > 0) {
        fabricCanvas.setActiveObject(fabricCanvas.getObjects()[0]);
        fabricCanvas.renderAll();
        return;
      }
      toast.error("No image selected");
      return;
    }
    
    const currentScale = activeObject.scaleX!;
    const newScale = Math.max(0.1, currentScale + scaleChange); // Prevent scaling to zero or negative
    
    activeObject.scale(newScale);
    fabricCanvas.renderAll();
  };

  const handleImageScale = (value: number[]) => {
    setImageScale(value[0] / 100);
  };

  return (
    <Card className="overflow-hidden shadow-xl">
      <CardContent className="p-0 relative">
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
                  setVideoAspectRatio(video.videoWidth / video.videoHeight);
                }
              }}
            />
          )}

          {isEditing && (
            <div className="absolute inset-0 z-20">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
          )}

          {!isEditing && (
            <>
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
                    <img 
                      src={imageUrl} 
                      alt="Uploaded content" 
                      className="object-cover w-full h-full"
                    />
                    
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
            </>
          )}
        </div>

        {imageUrl && (
          <div className="absolute top-2 right-2 flex items-center gap-2 z-30">
            <Button 
              size="sm" 
              variant={isEditing ? "default" : "outline"} 
              onClick={handleEditToggle}
              className="h-8 text-xs"
            >
              {isEditing ? "Save Position" : "Edit Position"}
            </Button>
            
            {isEditing && (
              <div className="bg-white/90 backdrop-blur-sm rounded-md shadow-sm">
                <div className="p-3 space-y-3">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={activeMode === 'select' ? "secondary" : "ghost"}
                      onClick={() => handleModeChange('select')}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Select & Resize"
                    >
                      <Maximize size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant={activeMode === 'move' ? "secondary" : "ghost"}
                      onClick={() => handleModeChange('move')}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Move"
                    >
                      <Move size={14} />
                    </Button>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resizeImage(-0.1)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Decrease Size"
                    >
                      <ZoomOut size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resizeImage(0.1)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Increase Size"
                    >
                      <ZoomIn size={14} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <div></div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage('up')}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Move Up"
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <div></div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage('left')}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Move Left"
                    >
                      <ArrowLeft size={14} />
                    </Button>
                    <div></div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage('right')}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Move Right"
                    >
                      <ArrowRight size={14} />
                    </Button>
                    <div></div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage('down')}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Move Down"
                    >
                      <ArrowDown size={14} />
                    </Button>
                    <div></div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Image Scale</label>
                    <Slider 
                      defaultValue={[imageScale * 100]} 
                      max={100}
                      min={10}
                      step={5}
                      onValueChange={handleImageScale}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoMockup;
