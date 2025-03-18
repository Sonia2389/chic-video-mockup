
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { startVideoRender, checkRenderStatus, downloadRenderedVideo } from "@/services/videoRenderingApi";

interface ApiRenderButtonProps {
  backgroundVideoUrl: string | null;
  imageUrl: string | null;
  overlayVideoUrl: string | null;
  savedPosition: any | null;
  videoAspectRatio: number;
  disabled?: boolean;
}

const ApiRenderButton = ({ 
  backgroundVideoUrl, 
  imageUrl, 
  overlayVideoUrl,
  savedPosition,
  videoAspectRatio,
  disabled = false
}: ApiRenderButtonProps) => {
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleRender = async () => {
    if (!backgroundVideoUrl || !imageUrl) {
      toast.error("Please upload both a background video and an image");
      return;
    }

    if (!savedPosition) {
      toast.error("Please position your image overlay before rendering");
      return;
    }

    try {
      setRendering(true);
      setRenderProgress(0);
      setDownloadReady(false);

      // Convert URL objects to Blob files
      const backgroundVideoBlob = await fetch(backgroundVideoUrl).then(r => r.blob());
      const backgroundVideoFile = new File(
        [backgroundVideoBlob], 
        "background.mp4", 
        { type: backgroundVideoBlob.type || "video/mp4" }
      );
      
      const imageBlob = await fetch(imageUrl).then(r => r.blob());
      const imageFile = new File(
        [imageBlob], 
        "overlay.png", 
        { type: imageBlob.type || "image/png" }
      );

      let overlayVideoFile = undefined;
      if (overlayVideoUrl) {
        const overlayVideoBlob = await fetch(overlayVideoUrl).then(r => r.blob());
        overlayVideoFile = new File(
          [overlayVideoBlob], 
          "overlay.mp4", 
          { type: overlayVideoBlob.type || "video/mp4" }
        );
      }

      toast.info("Preparing files and sending to rendering API...");

      // Start the rendering process
      const newJobId = await startVideoRender({
        backgroundVideo: backgroundVideoFile,
        overlayImage: imageFile,
        overlayPosition: savedPosition,
        overlayVideo: overlayVideoFile,
        aspectRatio: videoAspectRatio
      });
      
      setJobId(newJobId);
      toast.success("Rendering job started! Tracking progress...");
      
      // Start polling for status
      let pollCount = 0;
      const maxPolls = 60; // Stop after about 2 minutes (60 * 2sec)
      
      const checkInterval = setInterval(async () => {
        try {
          pollCount++;
          if (pollCount > maxPolls) {
            clearInterval(checkInterval);
            setRendering(false);
            toast.error("Rendering is taking too long. Please check status manually later.");
            return;
          }
          
          const status = await checkRenderStatus(newJobId);
          
          switch (status.status) {
            case 'processing':
              // Simulate progress since the API might not provide it
              setRenderProgress(prev => Math.min(prev + 5, 95));
              break;
            
            case 'completed':
              clearInterval(checkInterval);
              setRenderProgress(100);
              setDownloadReady(true);
              setDownloadUrl(status.downloadUrl || null);
              toast.success("Video rendered successfully!");
              break;
            
            case 'failed':
              clearInterval(checkInterval);
              setRendering(false);
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
          if (pollCount > 3) {
            clearInterval(checkInterval);
            setRendering(false);
          }
        }
      }, 2000);
      
    } catch (error) {
      setRendering(false);
      if (error instanceof Error) {
        toast.error(`Error starting video render: ${error.message}`);
      } else {
        toast.error("Error starting video render");
      }
      console.error(error);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      downloadRenderedVideo(downloadUrl);
    } else {
      toast.error("Download URL not available");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center gap-3">
      {rendering && (
        <div className="w-full max-w-md space-y-2">
          <Progress value={renderProgress} className="w-full" />
          <p className="text-xs text-center text-muted-foreground">
            {downloadReady 
              ? "Rendering complete!" 
              : `Rendering video on server... ${renderProgress}%`}
          </p>
        </div>
      )}
      
      <Button
        className="gradient-bg border-0 text-white py-6 px-8 text-lg shadow-lg hover:opacity-90 transition-opacity"
        size="lg"
        onClick={downloadReady ? handleDownload : handleRender}
        disabled={(disabled && !downloadReady) || (rendering && !downloadReady)}
      >
        {rendering && !downloadReady ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Rendering Video... {renderProgress}%
          </>
        ) : downloadReady ? (
          <>
            <Download className="mr-2 h-5 w-5" />
            Download MP4 Video
          </>
        ) : (
          <>
            <PlayCircle className="mr-2 h-5 w-5" />
            Render Video via API
          </>
        )}
      </Button>
    </div>
  );
};

export default ApiRenderButton;
