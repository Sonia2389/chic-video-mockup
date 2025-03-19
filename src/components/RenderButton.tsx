
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2, Download, Server } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { startVideoRender, checkRenderStatus, downloadRenderedVideo } from "@/services/videoRenderingApi";
import { useState } from "react";
import { toast } from "sonner";

interface RenderButtonProps {
  onRender: () => void;
  disabled: boolean;
  rendering: boolean;
  progress?: number;
  downloadReady?: boolean;
  onDownload?: () => void;
  // New props for API rendering
  backgroundVideo?: File;
  overlayImage?: File;
  overlayVideo?: File;
  savedPosition?: any;
  videoAspectRatio?: number;
  useApi?: boolean;
}

const RenderButton = ({ 
  onRender, 
  disabled, 
  rendering, 
  progress = 0, 
  downloadReady = false,
  onDownload,
  // New API props
  backgroundVideo,
  overlayImage,
  overlayVideo,
  savedPosition,
  videoAspectRatio = 16/9,
  useApi = false
}: RenderButtonProps) => {
  const [isApiRendering, setIsApiRendering] = useState(false);
  const [apiRenderProgress, setApiRenderProgress] = useState(0);
  const [apiDownloadReady, setApiDownloadReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleApiRender = async () => {
    if (!backgroundVideo || !overlayImage || !savedPosition) {
      toast.error("Please upload a background video, an image, and position your overlay before rendering");
      return;
    }

    try {
      setIsApiRendering(true);
      setApiRenderProgress(0);
      setApiDownloadReady(false);

      // Start the rendering process
      const newJobId = await startVideoRender({
        backgroundVideo,
        overlayImage,
        overlayPosition: savedPosition,
        overlayVideo: overlayVideo || undefined,
        aspectRatio: videoAspectRatio,
        quality: 'high' // Use high quality by default
      });
      
      setJobId(newJobId);
      toast.success("API rendering started! Creating high-quality video...");
      
      // Start polling for status
      let pollCount = 0;
      const maxPolls = 120; // Allow up to 4 minutes for rendering (120 * 2sec)
      
      const checkInterval = setInterval(async () => {
        try {
          pollCount++;
          if (pollCount > maxPolls) {
            clearInterval(checkInterval);
            setIsApiRendering(false);
            toast.error("Rendering is taking too long. Please check status manually later.");
            return;
          }
          
          const status = await checkRenderStatus(newJobId);
          
          // Update progress if available from API
          if (status.progress) {
            setApiRenderProgress(status.progress);
          } else {
            // Simulate progress if API doesn't provide it
            setApiRenderProgress(prev => Math.min(prev + 2, 95));
          }
          
          switch (status.status) {
            case 'processing':
              // Continue polling
              break;
            
            case 'completed':
              clearInterval(checkInterval);
              setApiRenderProgress(100);
              setApiDownloadReady(true);
              setDownloadUrl(status.downloadUrl || null);
              toast.success("High-quality video rendered successfully!");
              break;
            
            case 'failed':
              clearInterval(checkInterval);
              setIsApiRendering(false);
              toast.error(`Rendering failed: ${status.error || 'Unknown error'}`);
              break;
          }
        } catch (error) {
          if (error instanceof Error) {
            toast.error(`Error checking render status: ${error.message}`);
          } else {
            toast.error("Error checking render status");
          }
          console.error(error);
          
          // Don't clear interval on first few errors, API might still be starting up
          if (pollCount > 5) {
            clearInterval(checkInterval);
            setIsApiRendering(false);
          }
        }
      }, 2000);
      
    } catch (error) {
      setIsApiRendering(false);
      if (error instanceof Error) {
        toast.error(`Error starting video render: ${error.message}`);
      } else {
        toast.error("Error starting video render");
      }
      console.error(error);
    }
  };

  const handleApiDownload = () => {
    if (downloadUrl) {
      downloadRenderedVideo(downloadUrl, "high-quality-video.mp4");
    } else {
      toast.error("Download URL not available");
    }
  };

  // If using API rendering and we have the necessary files
  if (useApi && backgroundVideo && overlayImage) {
    return (
      <div className="flex flex-col justify-center items-center gap-3">
        {isApiRendering && (
          <div className="w-full max-w-md space-y-2">
            <Progress value={apiRenderProgress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">
              {apiDownloadReady 
                ? "High-quality rendering complete!" 
                : `Rendering high-quality video on server... ${apiRenderProgress}%`}
            </p>
          </div>
        )}
        
        <Button
          className="gradient-bg border-0 text-white py-6 px-8 text-lg shadow-lg hover:opacity-90 transition-opacity"
          size="lg"
          onClick={apiDownloadReady ? handleApiDownload : handleApiRender}
          disabled={(disabled && !apiDownloadReady) || (isApiRendering && !apiDownloadReady)}
        >
          {isApiRendering && !apiDownloadReady ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Rendering High-Quality Video... {apiRenderProgress}%
            </>
          ) : apiDownloadReady ? (
            <>
              <Download className="mr-2 h-5 w-5" />
              Download High-Quality MP4
            </>
          ) : (
            <>
              <Server className="mr-2 h-5 w-5" />
              Render High-Quality Video
            </>
          )}
        </Button>
      </div>
    );
  }
  
  // If not using API or missing necessary files, fall back to browser rendering
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

