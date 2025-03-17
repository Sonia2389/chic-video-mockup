
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2 } from "lucide-react";

interface RenderButtonProps {
  onRender: () => void;
  disabled: boolean;
  rendering: boolean;
}

const RenderButton = ({ onRender, disabled, rendering }: RenderButtonProps) => {
  return (
    <div className="flex justify-center">
      <Button
        className="gradient-bg border-0 text-white py-6 px-8 text-lg shadow-lg hover:opacity-90 transition-opacity"
        size="lg"
        onClick={onRender}
        disabled={disabled}
      >
        {rendering ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Rendering Video...
          </>
        ) : (
          <>
            <PlayCircle className="mr-2 h-5 w-5" />
            Render Final Video
          </>
        )}
      </Button>
    </div>
  );
};

export default RenderButton;
