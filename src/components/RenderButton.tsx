
import { Button } from "@/components/ui/button";
import { Server, Loader2, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { startVideoRender, checkRenderStatus, downloadRenderedVideo } from "@/services/videoRenderingApi";
import { useState } from "react";
import { toast } from "sonner";
import { setupMediaRecorder } from "@/services/mock/mockMediaProcessor";

interface RenderButtonProps {
  disabled: boolean;
  backgroundImage?: File;
  overlayImage?: File;
  overlayVideo?: File;
  savedPosition?: any;
  videoAspectRatio?: number;
  containerDimensions?: { width: number, height: number } | null;
}

const RenderButton = ({ 
  disabled, 
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

  const capturePreviewAndDownload = async () => {
    const mockupContainer = document.querySelector('.video-mockup-container');
    if (!mockupContainer) {
      toast.error("Could not find the mockup container element");
      return false;
    }
    
    try {
      setIsRendering(true);
      setRenderProgress(10);
      toast.info("Preparing to capture mockup preview...");
      
      // Import html2canvas dynamically
      const { default: html2canvas } = await import('html2canvas');
      
      setRenderProgress(20);
      
      // Capture the mockup container content
      const canvas = await html2canvas(mockupContainer as HTMLElement, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });
      
      setRenderProgress(40);
      
      // Create and configure the media recorder
      try {
        const { recorder, chunks, mimeType } = setupMediaRecorder(canvas);
        
        // Set up recorder events
        recorder.onstop = () => {
          try {
            // Create a proper video file from the recorded chunks
            let fileType = 'video/mp4';
            
            // If browser used WebM format, maintain that for the file
            if (mimeType.includes('webm')) {
              fileType = 'video/webm';
            }
            
            const videoBlob = new Blob(chunks, { type: fileType });
            const videoUrl = URL.createObjectURL(videoBlob);
            
            // Set the download URL and complete
            setDownloadUrl(videoUrl);
            setRenderProgress(100);
            setDownloadReady(true);
            setIsRendering(false);
            toast.success("Mockup processed successfully!");
          } catch (error) {
            console.error("Error creating video after recording:", error);
            toast.error("Failed to create video file from recording");
            setIsRendering(false);
          }
        };
        
        // Handle recording errors
        recorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          toast.error("Error during recording process");
          setIsRendering(false);
        };
        
        // Start recording for a 5 second duration
        recorder.start();
        setRenderProgress(50);
        
        // Update progress while recording
        const interval = setInterval(() => {
          setRenderProgress(prev => {
            const newProgress = prev + 8;
            return newProgress < 95 ? newProgress : 95;
          });
        }, 1000);
        
        // Stop recording after 5 seconds
        setTimeout(() => {
          clearInterval(interval);
          
          try {
            // Only stop if state is not "inactive"
            if (recorder.state !== "inactive") {
              recorder.stop();
            }
          } catch (stopError) {
            console.error("Error stopping recorder:", stopError);
            setIsRendering(false);
            toast.error("Error stopping video recording");
          }
        }, 5000);
        
        return true;
      } catch (recorderError) {
        console.error("MediaRecorder setup error:", recorderError);
        toast.error("Your browser doesn't fully support video recording. Try using Chrome or Firefox.");
        setIsRendering(false);
        return false;
      }
    } catch (error) {
      console.error("Error capturing preview:", error);
      toast.error("Failed to capture mockup preview");
      setIsRendering(false);
      return false;
    }
  };

  const handleRender = async () => {
    if (!backgroundImage || !overlayImage || !savedPosition) {
      toast.error("Please upload a background image, an overlay image, and position your overlay before rendering");
      return;
    }

    if (!containerDimensions || !containerDimensions.width || !containerDimensions.height) {
      toast.error("Container dimensions not available. Please try repositioning your image first.");
      return;
    }

    // Try to capture preview and create video
    const captureSuccessful = await capturePreviewAndDownload();
    
    // If client-side capture fails, fall back to the server-side rendering
    if (!captureSuccessful) {
      try {
        setIsRendering(true);
        setRenderProgress(0);
        setDownloadReady(false);

        // Log the exact position values we're sending to the renderer
        console.log("Rendering with saved position:", JSON.stringify(savedPosition, null, 2));
        console.log("Container dimensions:", containerDimensions);

        // Create a deep clone of the savedPosition to ensure no references are passed
        const positionClone = JSON.parse(JSON.stringify(savedPosition));

        const newJobId = await startVideoRender({
          backgroundImage,
          overlayImage,
          overlayPosition: positionClone,
          overlayVideo: overlayVideo || undefined,
          aspectRatio: videoAspectRatio,
          quality: 'high',
          preserveOriginalSpeed: true,
          exactPositioning: true,
          containerWidth: containerDimensions.width,
          containerHeight: containerDimensions.height
        });
        
        setJobId(newJobId);
        toast.success("Mockup processing started! Creating high-quality output...");
        
        let pollCount = 0;
        const maxPolls = 120;
        
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
            
            if (status.progress) {
              setRenderProgress(status.progress);
            } else {
              setRenderProgress(prev => Math.min(prev + 2, 95));
            }
            
            switch (status.status) {
              case 'processing':
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
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Create a proper filename with the correct extension
      const filename = downloadUrl.includes('webm') ? 'mockup.webm' : 'mockup.mp4';
      
      // Try playing the video in a new tab first to verify it works
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success(`Video downloaded as ${filename}`);
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
