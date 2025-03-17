
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { Canvas } from 'fabric';
import { toast } from "sonner";

// Import the new components
import VideoContainer from "./video-mockup/VideoContainer";
import ImageDisplay from "./video-mockup/ImageDisplay";
import VideoOverlay from "./video-mockup/VideoOverlay";
import EmptyState from "./video-mockup/EmptyState";
import EditorControls from "./video-mockup/EditorControls";
import CanvasEditor from "./video-mockup/CanvasEditor";

interface Overlay {
  type: "image" | "video";
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

interface VideoMockupProps {
  imageUrl: string | null;
  overlayIndex: number | null;
  videoUrl?: string;
  overlays: Overlay[];
  onPositionSave?: (position: ImagePosition) => void;
  savedPosition?: ImagePosition | null;
}

const VideoMockup = ({ 
  imageUrl, 
  overlayIndex, 
  videoUrl, 
  overlays,
  onPositionSave,
  savedPosition: externalSavedPosition
}: VideoMockupProps) => {
  const [videoAspectRatio, setVideoAspectRatio] = useState(16/9); // Default aspect ratio
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [activeMode, setActiveMode] = useState<'select' | 'move'>('select');
  const [isEditing, setIsEditing] = useState(false);
  const [savedPosition, setSavedPosition] = useState<ImagePosition | null>(externalSavedPosition || null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [containerDimensions, setContainerDimensions] = useState<{width: number, height: number} | null>(null);
  const [lastEditDimensions, setLastEditDimensions] = useState<{width: number, height: number} | null>(null);

  useEffect(() => {
    if (externalSavedPosition) {
      setSavedPosition(externalSavedPosition);
    }
  }, [externalSavedPosition]);

  const handleEditToggle = () => {
    if (isEditing && fabricCanvas) {
      const activeObject = fabricCanvas.getActiveObject();
      if (activeObject) {
        // Ensure we precisely capture all dimensions and transformations
        const newPosition = {
          left: activeObject.left!,
          top: activeObject.top!,
          scale: Math.max(activeObject.scaleX!, activeObject.scaleY!),
          scaleX: activeObject.scaleX!,
          scaleY: activeObject.scaleY!,
          width: activeObject.getScaledWidth(),
          height: activeObject.getScaledHeight(),
          originalWidth: activeObject.width!,
          originalHeight: activeObject.height!,
          angle: activeObject.angle
        };
        
        setSavedPosition(newPosition);
        
        if (onPositionSave) {
          onPositionSave(newPosition);
        }
        
        if (containerDimensions) {
          setLastEditDimensions(containerDimensions);
        }
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
    <Card className="overflow-hidden shadow-xl video-mockup-container">
      <CardContent className="p-0 relative">
        <VideoContainer 
          videoUrl={videoUrl} 
          videoAspectRatio={videoAspectRatio}
          onAspectRatioChange={setVideoAspectRatio}
          setContainerDimensions={setContainerDimensions}
        >
          <CanvasEditor
            isEditing={isEditing}
            imageUrl={imageUrl}
            savedPosition={savedPosition}
            containerDimensions={containerDimensions}
            setOriginalImageDimensions={setOriginalImageDimensions}
            originalImageDimensions={originalImageDimensions}
            fabricCanvas={fabricCanvas}
            setFabricCanvas={setFabricCanvas}
          />

          {!isEditing && (
            <>
              {!imageUrl ? (
                <EmptyState />
              ) : (
                <ImageDisplay 
                  imageUrl={imageUrl} 
                  savedPosition={savedPosition}
                  isEditing={isEditing}
                />
              )}
            </>
          )}

          <VideoOverlay 
            overlayIndex={overlayIndex} 
            overlays={overlays} 
          />
        </VideoContainer>

        <EditorControls 
          isEditing={isEditing}
          onEditToggle={handleEditToggle}
          activeMode={activeMode}
          onModeChange={handleModeChange}
          onMove={moveImage}
          onResize={resizeImage}
          imageUrl={imageUrl}
        />
      </CardContent>
    </Card>
  );
};

export default VideoMockup;
