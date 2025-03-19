
import { toast } from "sonner";
import { RenderVideoParams, RenderResponse, JobInfo } from "./types/renderingTypes";

// Map to store mock job data without using sessionStorage
const mockJobsMap = new Map<string, JobInfo>();

/**
 * Mock implementation for demonstration purposes
 */
export const mockRenderProcess = async (params: RenderVideoParams): Promise<string> => {
  console.log("Using mock API implementation");
  console.log("Overlay position:", JSON.stringify(params.overlayPosition));
  
  // Generate a random job ID
  const jobId = Math.random().toString(36).substring(2, 15);
  
  // Store job info in our Map instead of sessionStorage
  mockJobsMap.set(jobId, {
    id: jobId,
    status: 'processing',
    progress: 0,
    startTime: Date.now(),
    params: {
      aspectRatio: params.aspectRatio,
      quality: params.quality || 'standard',
      preserveOriginalSpeed: params.preserveOriginalSpeed,
      exactPositioning: params.exactPositioning
    }
  });
  
  // Start mock processing
  setTimeout(() => {
    const jobInfo = mockJobsMap.get(jobId);
    if (jobInfo) {
      jobInfo.progress = 25;
      mockJobsMap.set(jobId, jobInfo);
    }
  }, 3000);
  
  setTimeout(() => {
    const jobInfo = mockJobsMap.get(jobId);
    if (jobInfo) {
      jobInfo.progress = 50;
      mockJobsMap.set(jobId, jobInfo);
    }
  }, 6000);
  
  setTimeout(() => {
    const jobInfo = mockJobsMap.get(jobId);
    if (jobInfo) {
      jobInfo.progress = 75;
      mockJobsMap.set(jobId, jobInfo);
    }
  }, 9000);
  
  // Actually create a composite video with the overlay
  setTimeout(async () => {
    try {
      // Create a canvas to composite the video and image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Canvas context creation failed");
      }
      
      // Create a video element for the background
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      
      // Set up the video source with the background video
      video.src = URL.createObjectURL(params.backgroundVideo);
      
      // Wait for video to load metadata
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
        video.load();
      });
      
      // Set canvas dimensions based on video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Create an image element for the overlay image
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // Load the overlay image
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load overlay image"));
        img.src = URL.createObjectURL(params.overlayImage);
      });
      
      // Check if we have an overlay video
      let overlayVideo: HTMLVideoElement | null = null;
      if (params.overlayVideo) {
        overlayVideo = document.createElement('video');
        overlayVideo.muted = true;
        overlayVideo.playsInline = true;
        overlayVideo.loop = true;
        overlayVideo.crossOrigin = "anonymous";
        
        // Load the overlay video
        await new Promise<void>((resolve, reject) => {
          if (!overlayVideo) return reject(new Error("Overlay video element not created"));
          
          overlayVideo.onloadedmetadata = () => resolve();
          overlayVideo.onerror = () => reject(new Error("Failed to load overlay video"));
          overlayVideo.src = URL.createObjectURL(params.overlayVideo);
          overlayVideo.load();
        });
        
        // Start playing the overlay video
        await overlayVideo.play();
      }
      
      // Set up for recording
      const chunks: Blob[] = [];
      const stream = canvas.captureStream(30);
      
      // Try different mime types to find one that the browser supports
      let mimeType = '';
      let recorder: MediaRecorder;
      
      // Test different codecs in order of preference
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
        ''  // Default, let browser decide
      ];
      
      // Find the first supported mime type
      for (const type of mimeTypes) {
        if (type === '' || MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      // Create the MediaRecorder with the supported mime type
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: mimeType || undefined,
          videoBitsPerSecond: 5000000
        });
      } catch (e) {
        console.error("MediaRecorder error:", e);
        throw new Error("Your browser doesn't support video recording");
      }
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || "video/webm" });
        const jobInfo = mockJobsMap.get(jobId);
        if (jobInfo) {
          jobInfo.status = 'completed';
          jobInfo.progress = 100;
          jobInfo.downloadUrl = URL.createObjectURL(blob);
          mockJobsMap.set(jobId, jobInfo);
        }
      };
      
      // Start recording
      recorder.start();
      
      // Play the background video
      video.play();
      
      console.log("Drawing with overlay position:", JSON.stringify(params.overlayPosition));
      
      // Render function to draw each frame - LAYERING ORDER IS CRUCIAL HERE
      const render = () => {
        // Clear the canvas first to start with a clean slate each frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // LAYER 1: Draw the background video (bottom layer)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // LAYER 2: Draw the overlay image with correct positioning (middle layer)
        if (img && params.overlayPosition) {
          const { left, top, scaleX, scaleY, angle } = params.overlayPosition;
          
          // Save the current context state before applying transformations
          ctx.save();
          
          // Apply transformations in the correct order: translate -> rotate -> scale
          ctx.translate(left, top);
          
          if (angle) {
            // Convert degrees to radians for rotation
            ctx.rotate((angle * Math.PI) / 180);
          }
          
          // Apply the scale
          ctx.scale(scaleX, scaleY);
          
          // Draw the image at origin (0,0) since we've already translated
          ctx.drawImage(
            img,
            0, 0,
            img.naturalWidth, img.naturalHeight
          );
          
          // Restore the context to its state before transformations
          ctx.restore();
        }
        
        // LAYER 3: Draw the overlay video if present (top layer)
        if (overlayVideo) {
          // Draw the overlay video with slight transparency (opacity 0.15)
          ctx.save();
          ctx.globalAlpha = 0.15; // Transparency level
          ctx.drawImage(overlayVideo, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
        
        // Continue rendering until the end of the video
        if (video.currentTime < video.duration) {
          requestAnimationFrame(render);
        } else {
          // Stop recording when the video ends
          recorder.stop();
          video.pause();
          if (overlayVideo) {
            overlayVideo.pause();
          }
        }
      };
      
      // Start the rendering process
      requestAnimationFrame(render);
      
      // Set a safety timeout in case the video is too long
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          video.pause();
          if (overlayVideo) {
            overlayVideo.pause();
          }
        }
      }, 20000); // Limit to 20 seconds max
      
    } catch (error) {
      console.error("Error in mock video rendering:", error);
      const jobInfo = mockJobsMap.get(jobId);
      if (jobInfo) {
        jobInfo.status = 'failed';
        jobInfo.error = error instanceof Error ? error.message : 'Unknown error';
        mockJobsMap.set(jobId, jobInfo);
      }
    }
  }, 12000);
  
  return jobId;
};

/**
 * Mock implementation for checking render status
 */
export const mockCheckStatus = async (jobId: string): Promise<RenderResponse> => {
  console.log("Using mock status check implementation");
  const jobInfo = mockJobsMap.get(jobId);
  
  if (!jobInfo || !jobInfo.id) {
    throw new Error("Job not found");
  }
  
  return {
    id: jobInfo.id,
    status: jobInfo.status,
    progress: jobInfo.progress,
    downloadUrl: jobInfo.downloadUrl
  };
};
