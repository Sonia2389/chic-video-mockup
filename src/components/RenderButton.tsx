
import { Button } from "@/components/ui/button";
import { Server, Loader2, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { startVideoRender, checkRenderStatus, downloadRenderedVideo } from "@/services/videoRenderingApi";
import { useState } from "react";
import { toast } from "sonner";

interface RenderButtonProps {
  disabled: boolean;
  backgroundVideo?: File;
  backgroundImage?: File;
  overlayImage?: File;
  overlayVideo?: File;
  savedPosition?: any;
  videoAspectRatio?: number;
  containerDimensions?: { width: number, height: number } | null;
}

const RenderButton = ({ 
  disabled, 
  backgroundVideo,
  backgroundImage,
  overlayImage,
  overlayVideo,
  savedPosition,
  videoAspectRatio = 16/9,
  containerDimensions
}: RenderButtonProps) => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleRender = async () => {
    // Check if we have either a background video or background image
    if ((!backgroundVideo && !backgroundImage) || !overlayImage || !savedPosition) {
      toast.error("Please upload a background (image or video), an overlay image, and position your overlay before rendering");
      return;
    }

    try {
      setIsRendering(true);
      setRenderProgress(0);
      setDownloadReady(false);

      console.log("Rendering with saved position:", JSON.stringify(savedPosition));
      console.log("Container dimensions:", containerDimensions);

      // Start the rendering process with exact parameters matching the preview
      const newJobId = await startVideoRender({
        backgroundVideo: backgroundVideo || undefined,
        backgroundImage: backgroundImage || undefined,
        overlayImage,
        overlayPosition: savedPosition,
        overlayVideo: overlayVideo || undefined,
        aspectRatio: videoAspectRatio,
        quality: 'high', // Use high quality by default for best match to preview
        preserveOriginalSpeed: true, // Ensure video speed matches the preview
        exactPositioning: true, // Use exact pixel positioning from the preview
        containerWidth: containerDimensions?.width,
        containerHeight: containerDimensions?.height
      });
      
      setJobId(newJobId);
      toast.success("Mockup processing started! Creating high-quality output...");
      
      // Start polling for status
      let pollCount = 0;
      const maxPolls = 120; // Allow up to 4 minutes for rendering (120 * 2sec)
      
      const checkInterval = setInterval(async () => {
        try {
          pollCount++;
          if (pollCount > maxPolls) {
            clearInterval(checkInterval);
            setIsRendering(false);
            toast.error("Processing is taking too long. Please check status manually later.");
            return;
          }
          
          const status = await checkRenderStatus(newJobId);
          
          // Update progress if available from API
          if (status.progress) {
            setRenderProgress(status.progress);
          } else {
            // Simulate progress if API doesn't provide it
            setRenderProgress(prev => Math.min(prev + 2, 95));
          }
          
          switch (status.status) {
            case 'processing':
              // Continue polling
              break;
            
            case 'completed':
              clearInterval(checkInterval);
              setRenderProgress(100);
              setDownloadReady(true);
              setDownloadUrl(status.downloadUrl || null);
              toast.success("Mockup processed successfully!");
              break;
            
            case 'failed':
              clearInterval(checkInterval);
              setIsRendering(false);
              toast.error(`Processing failed: ${status.error || 'Unknown error'}`);
              break;
          }
        } catch (error) {
          if (error instanceof Error) {
            toast.error(`Error checking process status: ${error.message}`);
          } else {
            toast.error("Error checking process status");
          }
          console.error(error);
          
          // Don't clear interval on first few errors, API might still be starting up
          if (pollCount > 5) {
            clearInterval(checkInterval);
            setIsRendering(false);
          }
        }
      }, 2000);
      
    } catch (error) {
      setIsRendering(false);
      if (error instanceof Error) {
        toast.error(`Error starting processing: ${error.message}`);
      } else {
        toast.error("Error starting processing");
      }
      console.error(error);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      downloadRenderedVideo(downloadUrl, "mockup.mp4");
    } else {
      toast.error("Download URL not available");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center gap-3">
      {isRendering && (
        <div className="w-full max-w-md space-y-2">
          <Progress value={renderProgress} className="w-full" />
          <p className="text-xs text-center text-muted-foreground">
            {downloadReady 
              ? "Mockup processing complete!" 
              : `Processing mockup... ${renderProgress}%`}
          </p>
        </div>
      )}
      
      <Button
        className="gradient-bg border-0 text-white py-6 px-8 text-lg shadow-lg hover:opacity-90 transition-opacity"
        size="lg"
        onClick={downloadReady ? handleDownload : handleRender}
        disabled={(disabled && !downloadReady) || (isRendering && !downloadReady)}
      >
        {isRendering && !downloadReady ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Mockup... {renderProgress}%
          </>
        ) : downloadReady ? (
          <>
            <Download className="mr-2 h-5 w-5" />
            Download Mockup
          </>
        ) : (
          <>
            <Server className="mr-2 h-5 w-5" />
            Process Mockup
          </>
        )}
      </Button>
    </div>
  );
};

export default RenderButton;
