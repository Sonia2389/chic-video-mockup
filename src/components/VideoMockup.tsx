import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Canvas } from 'fabric';
import { toast } from "sonner";

// Import components and hooks
import VideoContainer from "./video-mockup/VideoContainer";
import ImageDisplay from "./video-mockup/ImageDisplay";
import VideoOverlay from "./video-mockup/VideoOverlay";
import EmptyState from "./video-mockup/EmptyState";
import EditorControls from "./video-mockup/EditorControls";
import CanvasEditor from "./video-mockup/CanvasEditor";
import PositionManager, { ImagePosition } from "./video-mockup/PositionManager";
import ImageTransformer from "./video-mockup/ImageTransformer";
import { useEditingMode } from "@/hooks/useEditingMode";
import { useDimensions } from "@/hooks/useDimensions";

interface Overlay {
  type: "image" | "video";
  url: string;
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
  const [isEditing, setIsEditing] = useState(false);
  const [savedPosition, setSavedPosition] = useState<ImagePosition | null>(externalSavedPosition || null);
  const { activeMode, changeMode } = useEditingMode(fabricCanvas);
  const { 
    containerDimensions, setContainerDimensions,
    originalImageDimensions, setOriginalImageDimensions,
    lastEditDimensions, setLastEditDimensions
  } = useDimensions();
  
  // Initialize the image transformer for moving and resizing
  const imageTransformer = fabricCanvas ? ImageTransformer({ fabricCanvas }) : null;

  useEffect(() => {
    if (externalSavedPosition) {
      setSavedPosition(externalSavedPosition);
    }
  }, [externalSavedPosition]);

  const handleEditToggle = () => {
    if (isEditing && fabricCanvas) {
      const activeObject = fabricCanvas.getActiveObject();
      if (activeObject) {
        // Calculate the actual display dimensions to maintain consistency
        const scaledWidth = activeObject.getScaledWidth();
        const scaledHeight = activeObject.getScaledHeight();
        
        // Ensure we precisely capture all dimensions and transformations
        const newPosition = {
          left: activeObject.left!,
          top: activeObject.top!,
          scale: Math.max(activeObject.scaleX!, activeObject.scaleY!),
          scaleX: activeObject.scaleX!,
          scaleY: activeObject.scaleY!,
          width: scaledWidth,
          height: scaledHeight,
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

  const handlePositionSave = (position: ImagePosition) => {
    setSavedPosition(position);
    
    if (onPositionSave) {
      onPositionSave(position);
    }
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
          
          <PositionManager
            isEditing={isEditing}
            fabricCanvas={fabricCanvas}
            onSave={handlePositionSave}
            containerDimensions={containerDimensions}
            setLastEditDimensions={setLastEditDimensions}
          />
        </VideoContainer>

        <EditorControls 
          isEditing={isEditing}
          onEditToggle={handleEditToggle}
          activeMode={activeMode}
          onModeChange={changeMode}
          onMove={imageTransformer?.moveImage || (() => {})}
          onResize={imageTransformer?.resizeImage || (() => {})}
          imageUrl={imageUrl}
        />
      </CardContent>
    </Card>
  );
};

export default VideoMockup;
