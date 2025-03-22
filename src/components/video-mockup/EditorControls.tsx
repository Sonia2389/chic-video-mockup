
import { Button } from "@/components/ui/button";

interface EditorControlsProps {
  isEditing: boolean;
  onEditToggle: () => void;
  imageUrl: string | null;
}

const EditorControls = ({ 
  isEditing, 
  onEditToggle,
  imageUrl
}: EditorControlsProps) => {
  if (!imageUrl) return null;
  
  return (
    <div className="absolute top-2 right-2 flex items-center gap-2 z-30">
      <Button 
        size="sm" 
        variant={isEditing ? "default" : "outline"} 
        onClick={onEditToggle}
        className="h-8 text-xs font-bold"
      >
        {isEditing ? "Save Position" : "Edit Position"}
      </Button>
    </div>
  );
};

export default EditorControls;
