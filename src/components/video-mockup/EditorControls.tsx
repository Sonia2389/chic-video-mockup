
import { Button } from "@/components/ui/button";
import { Move, Maximize, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from "lucide-react";

interface EditorControlsProps {
  isEditing: boolean;
  onEditToggle: () => void;
  activeMode: 'select' | 'move';
  onModeChange: (mode: 'select' | 'move') => void;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onResize: (scaleChange: number) => void;
  imageUrl: string | null;
}

const EditorControls = ({ 
  isEditing, 
  onEditToggle, 
  activeMode, 
  onModeChange, 
  onMove, 
  onResize,
  imageUrl
}: EditorControlsProps) => {
  if (!imageUrl) return null;
  
  return (
    <div className="absolute top-2 right-2 flex items-center gap-2 z-30">
      <Button 
        size="sm" 
        variant={isEditing ? "default" : "outline"} 
        onClick={onEditToggle}
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
                onClick={() => onModeChange('select')}
                className="h-8 w-8 p-0 flex-shrink-0"
                title="Select & Resize"
              >
                <Maximize size={14} />
              </Button>
              <Button
                size="sm"
                variant={activeMode === 'move' ? "secondary" : "ghost"}
                onClick={() => onModeChange('move')}
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
                onClick={() => onResize(-0.1)}
                className="h-8 w-8 p-0 flex-shrink-0"
                title="Decrease Size"
              >
                <ZoomOut size={14} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResize(0.1)}
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
                onClick={() => onMove('up')}
                className="h-8 w-8 p-0 flex-shrink-0"
                title="Move Up"
              >
                <ArrowUp size={14} />
              </Button>
              <div></div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMove('left')}
                className="h-8 w-8 p-0 flex-shrink-0"
                title="Move Left"
              >
                <ArrowLeft size={14} />
              </Button>
              <div></div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMove('right')}
                className="h-8 w-8 p-0 flex-shrink-0"
                title="Move Right"
              >
                <ArrowRight size={14} />
              </Button>
              <div></div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMove('down')}
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
  );
};

export default EditorControls;
