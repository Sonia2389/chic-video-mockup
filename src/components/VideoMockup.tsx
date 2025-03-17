
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Move, Maximize, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from "lucide-react";
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

interface ImagePosition {
  left: number;
  top: number;
  scale: number;
  width: number;
  height: number;
}

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
  const [userImageSize, setUserImageSize] = useState(100); // User image size (percentage)
  const [customOverlays, setCustomOverlays] = useState<string[]>([]);
  const [savedPosition, setSavedPosition] = useState<ImagePosition | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{width: number, height: number} | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !isEditing) return;
    
    const canvas = new Canvas(canvasRef.current, {
      width: containerRef.current?.clientWidth || 800,
      height: (containerRef.current?.clientWidth || 800) / videoAspectRatio,
      backgroundColor: 'transparent',
    });
    
    setFabricCanvas(canvas);
    
    if (imageUrl) {
      Image.fromURL(imageUrl).then(img => {
        // Save original dimensions for reference
        if (!originalImageDimensions) {
          setOriginalImageDimensions({
            width: img.width!,
            height: img.height!
          });
        }
        
        const baseScale = Math.min(
          (canvas.width! * imageScale) / img.width!,
          (canvas.height! * imageScale) / img.height!
        );
        
        const adjustedScale = baseScale * (userImageSize / 100);
        
        // Use saved position if available
        if (savedPosition) {
          img.set({
            left: savedPosition.left,
            top: savedPosition.top,
            scaleX: savedPosition.scale,
            scaleY: savedPosition.scale,
            cornerSize: 12,
            cornerColor: '#9b87f5',
            borderColor: '#9b87f5',
            cornerStyle: 'circle',
            transparentCorners: false,
          });
        } else {
          img.set({
            left: canvas.width! / 2 - (img.width! * adjustedScale) / 2,
            top: canvas.height! / 2 - (img.height! * adjustedScale) / 2,
            scaleX: adjustedScale,
            scaleY: adjustedScale,
            cornerSize: 12,
            cornerColor: '#9b87f5',
            borderColor: '#9b87f5',
            cornerStyle: 'circle',
            transparentCorners: false,
          });
        }
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    }
    
    return () => {
      canvas.dispose();
    };
  }, [imageUrl, isEditing, videoAspectRatio, imageScale, userImageSize, savedPosition, originalImageDimensions]);

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

  const handleEditToggle = () => {
    if (isEditing) {
      // Save the position before closing edit mode
      if (fabricCanvas && fabricCanvas.getActiveObject()) {
        const activeObject = fabricCanvas.getActiveObject();
        setSavedPosition({
          left: activeObject.left!,
          top: activeObject.top!,
          scale: activeObject.scaleX!,
          width: activeObject.width! * activeObject.scaleX!,
          height: activeObject.height! * activeObject.scaleY!
        });
      }
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

  const handleImageSizeChange = (value: number[]) => {
    setUserImageSize(value[0]);
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
                    {savedPosition ? (
                      <img 
                        ref={imageRef}
                        src={imageUrl} 
                        alt="Uploaded content" 
                        className="absolute object-contain"
                        style={{ 
                          left: `${savedPosition.left}px`,
                          top: `${savedPosition.top}px`,
                          transform: `scale(${savedPosition.scale})`,
                          transformOrigin: 'left top',
                          width: originalImageDimensions?.width,
                          height: originalImageDimensions?.height
                        }}
                      />
                    ) : (
                      <img 
                        src={imageUrl} 
                        alt="Uploaded content" 
                        className="object-cover w-full h-full"
                        style={{ 
                          transform: `scale(${userImageSize / 100})`,
                          transformOrigin: 'center'
                        }}
                      />
                    )}
                    
                    {overlayIndex !== null && (
                      <div 
                        className="absolute inset-0 custom-overlay"
                        aria-label="Custom Overlay"
                        style={{
                          border: 'none',
                          backgroundImage: `url(${customOverlays[overlayIndex]})`,
                          backgroundPosition: 'center',
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none'
                        }}
                      >
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          Custom Overlay
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

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Image Size</label>
                    <Slider 
                      defaultValue={[userImageSize]} 
                      value={[userImageSize]}
                      max={200}
                      min={20}
                      step={5}
                      onValueChange={handleImageSizeChange}
                      className="w-full"
                    />
                    <div className="text-xs text-right text-muted-foreground">{userImageSize}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {imageUrl && !isEditing && !savedPosition && (
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-md shadow-sm p-2 flex gap-2 items-center z-20">
            <span className="text-xs font-medium">Image Size:</span>
            <Slider 
              value={[userImageSize]}
              max={200}
              min={20}
              step={5}
              onValueChange={handleImageSizeChange}
              className="w-32"
            />
            <span className="text-xs font-medium">{userImageSize}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoMockup;
