import { useState, useRef, useEffect } from "react";
import VideoMockup from "@/components/VideoMockup";
import VideoOverlays from "@/components/VideoOverlays";
import ImageUpload from "@/components/ImageUpload";
import RenderButton from "@/components/RenderButton";
import ApiRenderButton from "@/components/ApiRenderButton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Video, X, Server } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(16/9);
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

  const removeVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
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
    const previewVideoElement = document.querySelector('.video-mockup-container video') as HTMLVideoElement | null;
    
    if (!previewVideoElement) {
      toast.error("Preview video not found");
      setRendering(false);
      return;
    }
    
    const previewContainer = document.querySelector('.video-mockup-container');
    if (!previewContainer) {
      toast.error("Preview container not found");
      setRendering(false);
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      toast.error("Error creating video");
      setRendering(false);
      return;
    }
    
    const containerWidth = previewContainer.clientWidth;
    const containerHeight = previewContainer.clientHeight;
    
    const scaleFactor = 2;
    canvas.width = containerWidth * scaleFactor;
    canvas.height = containerHeight * scaleFactor;
    
    const videoFps = previewVideoElement.videoWidth > 0 ? 
      Math.round(previewVideoElement.getVideoPlaybackQuality?.().totalVideoFrames || 30) : 30;
    
    const targetFps = Math.min(Math.max(videoFps, 24), 60);
    
    const chunks: Blob[] = [];
    const stream = canvas.captureStream(targetFps);
    
    let mediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 12000000
      });
    } catch (e) {
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: 12000000
        });
      } catch (e2) {
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm',
            videoBitsPerSecond: 12000000
          });
        } catch (e3) {
          try {
            mediaRecorder = new MediaRecorder(stream, {
              videoBitsPerSecond: 12000000
            });
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
    
    previewVideoElement.currentTime = 0;
    previewVideoElement.playbackRate = 1.0;
    previewVideoElement.play();
    
    let overlayVideoElement: HTMLVideoElement | null = null;
    if (selectedOverlay !== null && overlays[selectedOverlay]) {
      overlayVideoElement = document.createElement('video');
      overlayVideoElement.src = overlays[selectedOverlay].url;
      overlayVideoElement.muted = true;
      overlayVideoElement.crossOrigin = "anonymous";
      overlayVideoElement.load();
      overlayVideoElement.currentTime = 0;
      overlayVideoElement.playbackRate = previewVideoElement.playbackRate;
      overlayVideoElement.play();
    }
    
    const imageElement = new Image();
    if (uploadedImage) {
      imageElement.src = uploadedImage;
      imageElement.crossOrigin = "anonymous";
    }
    
    const captureExactPreview = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(
        previewVideoElement, 
        0, 0, 
        canvas.width, canvas.height
      );
      
      if (uploadedImage && savedPosition) {
        ctx.save();
        
        const scaleFactor = {
          x: canvas.width / previewContainer.clientWidth,
          y: canvas.height / previewContainer.clientHeight
        };
        
        const scaledLeft = savedPosition.left * scaleFactor.x;
        const scaledTop = savedPosition.top * scaleFactor.y;
        const scaledWidth = savedPosition.width * scaleFactor.x;
        const scaledHeight = savedPosition.height * scaleFactor.y;
        
        ctx.translate(scaledLeft, scaledTop);
        ctx.rotate((savedPosition.angle || 0) * Math.PI / 180);
        
        ctx.drawImage(
          imageElement,
          0, 0,
          savedPosition.originalWidth,
          savedPosition.originalHeight,
          0, 0,
          scaledWidth / savedPosition.scaleX,
          scaledHeight / savedPosition.scaleY
        );
        ctx.restore();
      } else if (uploadedImage) {
        const imgWidth = canvas.width / 2;
        const imgHeight = (imageElement.height / imageElement.width) * imgWidth;
        ctx.drawImage(
          imageElement,
          canvas.width / 4,
          canvas.height / 4,
          imgWidth,
          imgHeight
        );
      }
      
      if (overlayVideoElement && selectedOverlay !== null) {
        ctx.globalAlpha = 0.15;
        ctx.drawImage(overlayVideoElement, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
      }
      
      const fontSize = Math.floor(canvas.height/20);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('tothefknmoon', canvas.width/2, canvas.height/15);
    };
    
    const baseDuration = 8;
    const duration = baseDuration / previewVideoElement.playbackRate;
    const fps = targetFps;
    const totalFrames = Math.round(duration * fps);
    let frameCount = 0;
    
    const frameInterval = 1000 / fps;
    let lastFrameTime = 0;
    
    Promise.all([
      new Promise<void>(resolve => {
        if (imageElement.complete) {
          resolve();
        } else {
          imageElement.onload = () => resolve();
          imageElement.onerror = () => resolve();
        }
      }),
      new Promise<void>(resolve => {
        if (overlayVideoElement) {
          overlayVideoElement.oncanplay = () => resolve();
          overlayVideoElement.onerror = () => resolve();
        } else {
          resolve();
        }
      })
    ]).then(() => {
      const renderFrame = (timestamp: number) => {
        if (!lastFrameTime) lastFrameTime = timestamp;
        
        const elapsed = timestamp - lastFrameTime;
        
        if (elapsed >= frameInterval) {
          lastFrameTime = timestamp;
          captureExactPreview();
          frameCount++;
        }
        
        if (frameCount < totalFrames) {
          requestAnimationFrame(renderFrame);
        } else {
          mediaRecorder.stop();
          previewVideoElement.pause();
          if (overlayVideoElement) overlayVideoElement.pause();
        }
      };
      
      requestAnimationFrame(renderFrame);
    });
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
      if (videoUrl) {
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
            3 Steps to Create Stunning Video Mockups
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
            
            <Tabs defaultValue="browser" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-4">
                <TabsTrigger value="browser">Browser Rendering</TabsTrigger>
                <TabsTrigger value="api">API Rendering</TabsTrigger>
              </TabsList>
              
              <TabsContent value="browser" className="mt-0">
                <RenderButton 
                  onRender={handleRender} 
                  disabled={!uploadedImage || selectedOverlay === null || rendering}
                  rendering={rendering}
                  progress={renderProgress}
                  downloadReady={downloadReady}
                  onDownload={handleDownload}
                />
              </TabsContent>
              
              <TabsContent value="api" className="mt-0">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded shadow-sm">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> This API rendering feature requires implementation of a separate backend service. 
                    See the documentation in <code>src/docs/api-implementation-guide.md</code> for implementation details.
                  </p>
                </div>
                <ApiRenderButton
                  backgroundVideoUrl={videoUrl}
                  imageUrl={uploadedImage}
                  overlayVideoUrl={selectedOverlay !== null && overlays[selectedOverlay] ? overlays[selectedOverlay].url : null}
                  savedPosition={savedPosition}
                  videoAspectRatio={videoAspectRatio}
                  disabled={!uploadedImage || selectedOverlay === null}
                />
              </TabsContent>
            </Tabs>
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
