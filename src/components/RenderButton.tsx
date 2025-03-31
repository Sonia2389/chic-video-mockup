import { Button } from "@/components/ui/button";
import { Server, Loader2, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { startVideoRender, checkRenderStatus, downloadRenderedVideo } from "@/services/videoRenderingApi";
import { useState, useRef } from "react";
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
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

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
      
      const { default: html2canvas } = await import('html2canvas');
      
      setRenderProgress(20);
      
      const canvas = await html2canvas(mockupContainer as HTMLElement, {
        allowTaint: true,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });
      
      setRenderProgress(40);
      
      let videoDuration = 5000;
      
      if (overlayVideo) {
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        
        try {
          const videoUrl = URL.createObjectURL(overlayVideo);
          
          await new Promise<void>((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
              videoDuration = Math.round(videoElement.duration * 1000);
              console.log(`Using overlay video duration: ${videoDuration}ms`);
              videoDuration = Math.max(3000, Math.min(videoDuration, 30000));
              resolve();
            };
            videoElement.onerror = () => reject(new Error('Failed to load video metadata'));
            videoElement.src = videoUrl;
          });
          
          URL.revokeObjectURL(videoUrl);
        } catch (err) {
          console.error('Error determining video duration:', err);
          toast.error("Could not determine video duration, using default (5 seconds)");
        }
      }
      
      console.log(`Final video duration: ${videoDuration}ms`);
      
      const { recorder, chunks, mimeType } = setupMediaRecorder(canvas);
      recorderRef.current = recorder;
      recordingChunksRef.current = chunks;
      
      recorder.onstop = () => {
        try {
          let fileType = 'video/mp4';
          let fileExtension = 'mp4';
          
          if (mimeType.includes('webm')) {
            fileType = 'video/webm';
            fileExtension = 'webm';
            console.log("Browser created WebM format - may require conversion for Windows compatibility");
          }
          
          const videoBlob = new Blob(chunks, { type: fileType });
          const videoUrl = URL.createObjectURL(videoBlob);
          
          setDownloadUrl(videoUrl);
          setRenderProgress(100);
          setDownloadReady(true);
          setIsRendering(false);
          toast.success(`Mockup processed successfully as ${fileExtension.toUpperCase()} format!`);
        } catch (error) {
          console.error("Error creating video after recording:", error);
          toast.error("Failed to create video file from recording");
          setIsRendering(false);
        }
      };
      
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Error during recording process");
        setIsRendering(false);
      };
      
      recorder.start();
      setRenderProgress(50);
      
      const progressIntervals = 10;
      const intervalTime = Math.floor(videoDuration / progressIntervals);
      let currentInterval = 0;
      
      const interval = setInterval(() => {
        currentInterval++;
        if (currentInterval <= progressIntervals) {
          const newProgress = 50 + Math.floor((currentInterval / progressIntervals) * 45);
          setRenderProgress(newProgress);
        }
      }, intervalTime);
      
      setTimeout(() => {
        clearInterval(interval);
        
        try {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        } catch (stopError) {
          console.error("Error stopping recorder:", stopError);
          setIsRendering(false);
          toast.error("Error stopping video recording");
        }
      }, videoDuration);
      
      return true;
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

    const captureSuccessful = await capturePreviewAndDownload();
    
    if (!captureSuccessful) {
      try {
        setIsRendering(true);
        setRenderProgress(0);
        setDownloadReady(false);

        console.log("Rendering with saved position:", JSON.stringify(savedPosition, null, 2));
        console.log("Container dimensions:", containerDimensions);

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
      let filename = 'mockup.mp4';
      
      if (downloadUrl.includes('webm')) {
        filename = 'mockup.webm';
        toast.info("Video is in WebM format. If it doesn't play on Windows, convert it to MP4 using a video converter.");
      }
      
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
