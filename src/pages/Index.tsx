
import { useState, useRef, useEffect } from "react";
import VideoMockup from "@/components/VideoMockup";
import VideoOverlays from "@/components/VideoOverlays";
import ImageUpload from "@/components/ImageUpload";
import RenderButton from "@/components/RenderButton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Video, X } from "lucide-react";

const SAMPLE_VIDEO = {
  name: "Abstract Waves", 
  url: "https://assets.mixkit.co/videos/preview/mixkit-white-waves-digital-animation-6580-large.mp4"
};

interface Overlay {
  type: "video";
  url: string;
}

interface ImagePosition {
  left: number;
  top: number;
  scale: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  originalWidth: number;
  originalHeight: number;
  angle?: number;
}

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [downloadReady, setDownloadReady] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [savedPosition, setSavedPosition] = useState<ImagePosition | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(16/9); // Default 16:9
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    toast.success("Image uploaded successfully");
  };

  const handleSelectOverlay = (index: number) => {
    setSelectedOverlay(index);
    toast.success(`Overlay selected`);
  };

  const handleOverlaysChange = (newOverlays: Overlay[]) => {
    setOverlays(newOverlays);
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      if (!file.type.startsWith('video/')) {
        toast.error("Please upload a video file");
        return;
      }
      
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        if (video.videoWidth && video.videoHeight) {
          setVideoAspectRatio(video.videoWidth / video.videoHeight);
        }
      };
      video.load();
      
      toast.success("Background video uploaded successfully");
    }
  };

  const handleSelectSampleVideo = () => {
    if (videoUrl && videoUrl !== SAMPLE_VIDEO.url) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(SAMPLE_VIDEO.url);
    
    const video = document.createElement('video');
    video.src = SAMPLE_VIDEO.url;
    video.crossOrigin = "anonymous";
    video.onloadedmetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setVideoAspectRatio(video.videoWidth / video.videoHeight);
      }
    };
    video.load();
    
    toast.success("Sample background video selected");
  };

  const removeVideo = () => {
    if (videoUrl) {
      if (videoUrl !== SAMPLE_VIDEO.url) {
        URL.revokeObjectURL(videoUrl);
      }
      setVideoUrl(null);
      toast.success("Background video removed");
    }
  };

  const handleRender = () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }
    
    if (selectedOverlay === null) {
      toast.error("Please select a video overlay");
      return;
    }

    if (!videoUrl) {
      toast.error("Please select a background video");
      return;
    }

    setRendering(true);
    setRenderProgress(0);
    setDownloadReady(false);
    
    const interval = setInterval(() => {
      setRenderProgress((prev) => {
        const newProgress = prev + Math.floor(Math.random() * 10);
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            simulateVideoRender();
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  const simulateVideoRender = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error("Error creating video");
      setRendering(false);
      return;
    }
    
    // Get the preview container dimensions to match the aspect ratio exactly
    const previewContainer = document.querySelector('.video-mockup-container');
    if (!previewContainer) {
      toast.error("Preview container not found");
      setRendering(false);
      return;
    }
    
    // Set the canvas dimensions to match the preview's aspect ratio
    const previewWidth = previewContainer.clientWidth;
    const previewHeight = previewContainer.clientHeight; 
    canvas.width = 1280; // Use a higher resolution for quality
    canvas.height = Math.round(1280 * (previewHeight / previewWidth));
    
    const scaleFactor = canvas.width / previewWidth;
    
    const chunks: Blob[] = [];
    const stream = canvas.captureStream(30);
    
    let mediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
    } catch (e) {
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8'
        });
      } catch (e2) {
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm'
          });
        } catch (e3) {
          try {
            mediaRecorder = new MediaRecorder(stream);
          } catch (e4) {
            toast.error("Your browser doesn't support video recording");
            setRendering(false);
            return;
          }
        }
      }
    }
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      
      if (renderedVideoUrl) {
        URL.revokeObjectURL(renderedVideoUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setRenderedVideoUrl(url);
      setRendering(false);
      setDownloadReady(true);
      
      toast.success("Video rendered successfully!");
    };
    
    mediaRecorder.start();
    
    let frameCount = 0;
    const maxFrames = 90; // 3 seconds at 30fps
    
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl!;
    videoElement.muted = true;
    videoElement.crossOrigin = "anonymous";
    
    videoElement.oncanplay = () => {
      videoElement.play();
      
      let overlayVideoElement: HTMLVideoElement | null = null;
      if (selectedOverlay !== null && overlays[selectedOverlay]) {
        overlayVideoElement = document.createElement('video');
        overlayVideoElement.src = overlays[selectedOverlay].url;
        overlayVideoElement.muted = true;
        overlayVideoElement.crossOrigin = "anonymous";
        overlayVideoElement.play().catch(e => console.error("Error playing overlay video", e));
      }
      
      const drawFrame = () => {
        if (frameCount < maxFrames) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw background video
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          
          // Draw overlay video
          if (overlayVideoElement && selectedOverlay !== null) {
            ctx.globalAlpha = 0.3;
            ctx.drawImage(overlayVideoElement, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
          }
          
          // Draw the user image with the exact same position and transformation as in the preview
          if (uploadedImage && savedPosition) {
            const img = new Image();
            img.src = uploadedImage;
            img.crossOrigin = "anonymous";
            
            // Apply the same transformations as in the preview, but scaled to the output resolution
            ctx.save();
            ctx.translate(savedPosition.left * scaleFactor, savedPosition.top * scaleFactor);
            ctx.rotate((savedPosition.angle || 0) * Math.PI / 180);
            ctx.scale(
              savedPosition.scaleX * scaleFactor,
              savedPosition.scaleY * scaleFactor
            );
            ctx.drawImage(
              img,
              0, 0,
              savedPosition.originalWidth,
              savedPosition.originalHeight
            );
            ctx.restore();
          } else if (uploadedImage) {
            // If no position is saved, center the image
            const img = new Image();
            img.src = uploadedImage;
            img.crossOrigin = "anonymous";
            
            const imgWidth = canvas.width / 2;
            const imgHeight = (img.height / img.width) * imgWidth;
            ctx.drawImage(
              img,
              canvas.width / 4,
              canvas.height / 4,
              imgWidth,
              imgHeight
            );
          }
          
          // Add watermark
          ctx.fillStyle = '#fff';
          ctx.font = '30px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('tothefknmoon', canvas.width/2, 50);
          
          frameCount++;
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
          videoElement.pause();
          if (overlayVideoElement) overlayVideoElement.pause();
        }
      };
      
      requestAnimationFrame(drawFrame);
    };
    
    videoElement.load();
  };

  const handleDownload = () => {
    if (!renderedVideoUrl) return;
    
    const a = document.createElement('a');
    a.href = renderedVideoUrl;
    a.download = 'tothefknmoon-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success("Video downloaded successfully!");
  };

  const handlePositionSave = (position: ImagePosition) => {
    setSavedPosition(position);
  };

  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl !== SAMPLE_VIDEO.url) {
        URL.revokeObjectURL(videoUrl);
      }
      if (renderedVideoUrl) {
        URL.revokeObjectURL(renderedVideoUrl);
      }
    };
  }, [videoUrl, renderedVideoUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/50 to-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 mb-2 font-cursive">
            tothefknmoon
          </h1>
          <p className="text-muted-foreground">
            Upload your image, choose an overlay, create stunning video mockups
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="video-mockup-container">
              <VideoMockup 
                imageUrl={uploadedImage} 
                overlayIndex={selectedOverlay}
                videoUrl={videoUrl || undefined}
                overlays={overlays}
                onPositionSave={handlePositionSave}
                savedPosition={savedPosition}
              />
            </div>
            
            <RenderButton 
              onRender={handleRender} 
              disabled={!uploadedImage || selectedOverlay === null || rendering}
              rendering={rendering}
              progress={renderProgress}
              downloadReady={downloadReady}
              onDownload={handleDownload}
            />
          </div>
          
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Step 1: Add background video</h2>
              <div className="space-y-4">
                {videoUrl ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Video added</span>
                    <Button variant="outline" size="sm" onClick={removeVideo}>
                      <X size={16} className="mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Video size={16} className="text-primary" />
                        </div>
                        <p className="text-sm font-medium">Upload background video</p>
                        <p className="text-xs text-muted-foreground">MP4, WebM up to 50MB</p>
                      </div>
                      <input
                        id="video-upload"
                        type="file"
                        onChange={handleVideoUpload}
                        accept="video/*"
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Or use sample video:</h3>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-2 px-3 w-full"
                    onClick={handleSelectSampleVideo}
                  >
                    <Video size={14} className="mr-2 text-primary" />
                    <span className="text-xs">{SAMPLE_VIDEO.name}</span>
                  </Button>
                </div>
              </div>
            </div>
                
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Step 2: Upload your image</h2>
              <ImageUpload onImageUpload={handleImageUpload} />
            </div>
            
            <Separator className="bg-primary/10" />
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Step 3: Add video overlay</h2>
              <VideoOverlays 
                selectedOverlay={selectedOverlay} 
                onSelectOverlay={handleSelectOverlay} 
                onOverlaysChange={handleOverlaysChange}
                videoAspectRatio={videoAspectRatio}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
