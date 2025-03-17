
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Move, Maximize, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Canvas, Image } from 'fabric';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Overlay {
  type: "image" | "video";
  url: string;
}

interface VideoMockupProps {
  imageUrl: string | null;
  overlayIndex: number | null;
  videoUrl?: string;
  overlays: Overlay[];
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

const VideoMockup = ({ imageUrl, overlayIndex, videoUrl, overlays }: VideoMockupProps) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16/9); // Default aspect ratio
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [activeMode, setActiveMode] = useState<'select' | 'move'>('select');
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [savedPosition, setSavedPosition] = useState<ImagePosition | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{width: number, height: number} | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !isEditing || !containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerWidth / videoAspectRatio;
    
    const canvas = new Canvas(canvasRef.current, {
      width: containerWidth,
      height: containerHeight,
      backgroundColor: 'transparent',
    });
    
    setFabricCanvas(canvas);
    
    if (imageUrl) {
      Image.fromURL(imageUrl).then(img => {
        if (!originalImageDimensions) {
          setOriginalImageDimensions({
            width: img.width!,
            height: img.height!
          });
        }
        
        if (savedPosition) {
          // Apply exact saved position and transformations
          img.set({
            left: savedPosition.left,
            top: savedPosition.top,
            scaleX: savedPosition.scaleX,
            scaleY: savedPosition.scaleY,
            angle: savedPosition.angle || 0,
            cornerSize: 12,
            cornerColor: '#9b87f5',
            borderColor: '#9b87f5',
            cornerStyle: 'circle',
            transparentCorners: false,
            originX: 'left',
            originY: 'top'
          });
        } else {
          const baseScale = Math.min(
            (canvas.width! * 0.8) / img.width!,
            (canvas.height! * 0.8) / img.height!
          );
          
          img.set({
            left: canvas.width! / 2 - (img.width! * baseScale) / 2,
            top: canvas.height! / 2 - (img.height! * baseScale) / 2,
            scaleX: baseScale,
            scaleY: baseScale,
            cornerSize: 12,
            cornerColor: '#9b87f5',
            borderColor: '#9b87f5',
            cornerStyle: 'circle',
            transparentCorners: false,
            originX: 'left',
            originY: 'top'
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
  }, [imageUrl, isEditing, videoAspectRatio, savedPosition, originalImageDimensions, containerRef]);

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

  useEffect(() => {
    if (overlayIndex !== null && overlays[overlayIndex]?.type === "video" && overlayVideoRef.current) {
      overlayVideoRef.current.play().catch(error => {
        console.error("Error playing overlay video:", error);
      });
    }
  }, [overlayIndex, overlays]);

  const handleEditToggle = () => {
    if (isEditing && fabricCanvas) {
      const activeObject = fabricCanvas.getActiveObject();
      if (activeObject) {
        // Store exact position, scale and rotation information
        setSavedPosition({
          left: activeObject.left!,
          top: activeObject.top!,
          scale: activeObject.scaleX!,
          scaleX: activeObject.scaleX!,
          scaleY: activeObject.scaleY!,
          width: activeObject.width! * activeObject.scaleX!,
          height: activeObject.height! * activeObject.scaleY!,
          originalWidth: activeObject.width!,
          originalHeight: activeObject.height!,
          angle: activeObject.angle
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
                          width: `${savedPosition.originalWidth}px`, 
                          height: `${savedPosition.originalHeight}px`,
                          transformOrigin: 'left top',
                          transform: `scale(${savedPosition.scaleX}, ${savedPosition.scaleY}) rotate(${savedPosition.angle || 0}deg)`
                        }}
                      />
                    ) : (
                      <img 
                        src={imageUrl} 
                        alt="Uploaded content" 
                        className="object-cover w-full h-full"
                      />
                    )}
                    
                    {overlayIndex !== null && overlays[overlayIndex] && (
                      <div 
                        className="absolute inset-0"
                        aria-label="Overlay"
                      >
                        {overlays[overlayIndex].type === "image" ? (
                          <div 
                            style={{
                              backgroundImage: `url(${overlays[overlayIndex].url})`,
                              backgroundPosition: 'center',
                              backgroundSize: 'contain',
                              backgroundRepeat: 'no-repeat',
                              width: '100%',
                              height: '100%',
                              pointerEvents: 'none',
                              opacity: 0.3 // 30% opacity (70% transparency)
                            }}
                          />
                        ) : (
                          <video
                            ref={overlayVideoRef}
                            src={overlays[overlayIndex].url}
                            className="w-full h-full object-contain"
                            style={{ opacity: 0.3 }} // 30% opacity (70% transparency)
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        )}
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
