
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RenderButtonProps {
  onRender: () => void;
  disabled: boolean;
  rendering: boolean;
  progress?: number;
  downloadReady?: boolean;
  onDownload?: () => void;
}

const RenderButton = ({ 
  onRender, 
  disabled, 
  rendering, 
  progress = 0, 
  downloadReady = false,
  onDownload
}: RenderButtonProps) => {
  return (
    <div className="flex flex-col justify-center items-center gap-3">
      {rendering && (
        <Progress value={progress} className="w-full max-w-md" />
      )}
      
      <Button
        className="gradient-bg border-0 text-white py-6 px-8 text-lg shadow-lg hover:opacity-90 transition-opacity"
        size="lg"
        onClick={downloadReady ? onDownload : onRender}
        disabled={disabled && !downloadReady}
      >
        {rendering ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Rendering Video... {progress}%
          </>
        ) : downloadReady ? (
          <>
            <Download className="mr-2 h-5 w-5" />
            Download MP4 Video
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
