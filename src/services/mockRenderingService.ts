
import { toast } from "sonner";
import { RenderVideoParams, RenderResponse, JobInfo } from "./types/renderingTypes";

// Map to store mock job data without using sessionStorage
const mockJobsMap = new Map<string, JobInfo>();

/**
 * Mock implementation for demonstration purposes
 */
export const mockRenderProcess = async (params: RenderVideoParams): Promise<string> => {
  console.log("Using mock API implementation");
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
      quality: params.quality || 'standard'
    }
  });
  
  // Start mock processing
  setTimeout(() => {
    const jobInfo = mockJobsMap.get(jobId) || {};
    jobInfo.progress = 25;
    mockJobsMap.set(jobId, jobInfo);
  }, 3000);
  
  setTimeout(() => {
    const jobInfo = mockJobsMap.get(jobId) || {};
    jobInfo.progress = 50;
    mockJobsMap.set(jobId, jobInfo);
  }, 6000);
  
  setTimeout(() => {
    const jobInfo = mockJobsMap.get(jobId) || {};
    jobInfo.progress = 75;
    mockJobsMap.set(jobId, jobInfo);
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
      
      // Create an image element for the overlay
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // Load the overlay image
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load overlay image"));
        img.src = URL.createObjectURL(params.overlayImage);
      });
      
      // Set up for recording
      const chunks: Blob[] = [];
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const jobInfo = mockJobsMap.get(jobId) || {};
        jobInfo.status = 'completed';
        jobInfo.progress = 100;
        jobInfo.downloadUrl = URL.createObjectURL(blob);
        mockJobsMap.set(jobId, jobInfo);
      };
      
      // Start recording
      recorder.start();
      
      // Play the video and render frames with overlay
      video.play();
      
      // Render function to draw each frame
      const render = () => {
        // Draw the background video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Draw the overlay image with the correct positioning and transformation
        ctx.save();
        
        // Calculate scaled position based on canvas size vs original container
        const scaleFactor = {
          x: canvas.width / (params.overlayPosition.originalWidth * 2),  // Estimate original container width
          y: canvas.height / (params.overlayPosition.originalHeight * 2)  // Estimate original container height
        };
        
        const scaledLeft = params.overlayPosition.left * scaleFactor.x;
        const scaledTop = params.overlayPosition.top * scaleFactor.y;
        
        // Apply transformations in the correct order
        ctx.translate(scaledLeft, scaledTop);
        if (params.overlayPosition.angle) {
          ctx.rotate((params.overlayPosition.angle * Math.PI) / 180);
        }
        
        ctx.drawImage(
          img,
          0, 0,
          img.width, img.height,
          0, 0,
          params.overlayPosition.width * scaleFactor.x,
          params.overlayPosition.height * scaleFactor.y
        );
        
        ctx.restore();
        
        // Continue rendering until the end of the video
        if (video.currentTime < video.duration) {
          requestAnimationFrame(render);
        } else {
          recorder.stop();
          video.pause();
        }
      };
      
      requestAnimationFrame(render);
      
      // Set a safety timeout in case the video is too long
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          video.pause();
        }
      }, 20000); // Limit to 20 seconds max
      
    } catch (error) {
      console.error("Error in mock video rendering:", error);
      const jobInfo = mockJobsMap.get(jobId) || {};
      jobInfo.status = 'failed';
      jobInfo.error = error instanceof Error ? error.message : 'Unknown error';
      mockJobsMap.set(jobId, jobInfo);
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
