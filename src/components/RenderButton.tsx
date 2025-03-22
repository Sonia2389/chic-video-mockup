import { Button } from "@/components/ui/button";
import { Server, Loader2, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { startVideoRender, checkRenderStatus, downloadRenderedVideo } from "@/services/videoRenderingApi";
import { useState } from "react";
import { toast } from "sonner";

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

  const capturePreviewAndDownload = () => {
    const mockupContainer = document.querySelector('.video-mockup-container');
    if (!mockupContainer) {
      toast.error("Could not find the mockup container element");
      return false;
    }
    
    // Create a canvas to capture the preview
    const canvas = document.createElement('canvas');
    const containerRect = mockupContainer.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    
    // Use html2canvas to capture the content
    import('html2canvas').then(({ default: html2canvas }) => {
      toast.info("Preparing to capture mockup preview...");
      
      html2canvas(mockupContainer as HTMLElement, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      }).then(canvas => {
        // Convert to mp4 using MediaRecorder
        const stream = canvas.captureStream(30);
        const recordedChunks: BlobPart[] = [];
        
        // Find supported mime type
        let mimeType = '';
        const mimeTypes = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4',
          ''
        ];
        
        for (const type of mimeTypes) {
          if (type === '' || MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }
        
        // Create and configure media recorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType || undefined,
          videoBitsPerSecond: 5000000
        });
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          // Create the downloadable video from recorded chunks
          const videoBlob = new Blob(recordedChunks, { type: 'video/mp4' });
          const videoUrl = URL.createObjectURL(videoBlob);
          
          // Set the download URL and complete
          setDownloadUrl(videoUrl);
          setRenderProgress(100);
          setDownloadReady(true);
          setIsRendering(false);
          toast.success("Mockup processed successfully!");
        };
        
        // Start recording for a brief duration (5 seconds)
        mediaRecorder.start();
        setIsRendering(true);
        setRenderProgress(25);
        
        // Update progress while recording
        const interval = setInterval(() => {
          setRenderProgress(prev => {
            const newProgress = prev + 15;
            return newProgress < 95 ? newProgress : 95;
          });
        }, 1000);
        
        // Stop recording after 5 seconds
        setTimeout(() => {
          clearInterval(interval);
          mediaRecorder.stop();
        }, 5000);
      }).catch(error => {
        console.error("Error capturing preview:", error);
        toast.error("Failed to capture mockup preview");
        setIsRendering(false);
      });
    }).catch(error => {
      console.error("Error importing html2canvas:", error);
      toast.error("Failed to load capture library");
      setIsRendering(false);
    });
    
    return true;
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

    // Try to capture preview directly
    const captureSuccessful = capturePreviewAndDownload();
    
    // If capture fails, fall back to the server-side rendering
    if (!captureSuccessful) {
      try {
        setIsRendering(true);
        setRenderProgress(0);
        setDownloadReady(false);

        console.log("Rendering with saved position:", JSON.stringify(savedPosition));
        console.log("Container dimensions:", containerDimensions);

        const newJobId = await startVideoRender({
          backgroundImage,
          overlayImage,
          overlayPosition: savedPosition,
          overlayVideo: overlayVideo || undefined,
          aspectRatio: videoAspectRatio,
          quality: 'high',
          preserveOriginalSpeed: true,
          exactPositioning: true,
          containerWidth: containerDimensions?.width,
          containerHeight: containerDimensions?.height
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
