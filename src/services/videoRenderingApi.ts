import { toast } from "sonner";

interface RenderVideoParams {
  backgroundVideo: File;
  overlayImage: File;
  overlayPosition: {
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    originalWidth: number;
    originalHeight: number;
    angle?: number;
  };
  overlayVideo?: File;
  aspectRatio: number;
  quality?: 'standard' | 'high' | 'ultra';  // Added quality parameter
}

interface RenderResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
  progress?: number;
}

// Update this URL to point to the mockify API service
export const API_URL = process.env.NODE_ENV === 'production' 
  ? "https://mockify.onrender.com/api/render"  // Use mockify.onrender.com for production
  : "https://mockify.onrender.com/api/render";  // Use mockify.onrender.com for development

// A flag to track if we've shown the API connection error already
let apiErrorShown = false;

// Map to store mock job data without using sessionStorage
const mockJobsMap = new Map();

// Mock implementation for demonstration purposes
const mockRenderProcess = async (params: RenderVideoParams): Promise<string> => {
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

// Mock implementation for checking render status
const mockCheckStatus = async (jobId: string): Promise<RenderResponse> => {
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

/**
 * Sends a request to start rendering a video on the backend API
 */
export const startVideoRender = async (params: RenderVideoParams): Promise<string> => {
  try {
    // For demonstration, check if we should use the mock implementation
    if (API_URL.includes('mockify.onrender.com')) {
      return mockRenderProcess(params);
    }
    
    // Create form data to send files
    const formData = new FormData();
    formData.append('backgroundVideo', params.backgroundVideo);
    formData.append('overlayImage', params.overlayImage);
    formData.append('overlayPosition', JSON.stringify(params.overlayPosition));
    formData.append('aspectRatio', params.aspectRatio.toString());
    
    if (params.overlayVideo) {
      formData.append('overlayVideo', params.overlayVideo);
    }
    
    // Add quality parameter if specified
    if (params.quality) {
      formData.append('quality', params.quality);
    }

    console.log("Sending render request to API:", API_URL);
    console.log("Background video size:", params.backgroundVideo.size);
    console.log("Overlay image size:", params.overlayImage.size);
    console.log("Overlay position:", JSON.stringify(params.overlayPosition));
    console.log("Quality setting:", params.quality || 'standard');

    // Set timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Send the request
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || `Server error: ${response.status}`;
      console.error("API error:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Render job started, ID:", data.id);
    return data.id; // Return the job ID for status checking
  } catch (error) {
    console.error('Error starting video render:', error);
    
    // Check if this is a network error (API server not running)
    if (
      error instanceof TypeError && 
      (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))
    ) {
      if (!apiErrorShown) {
        toast.error("Cannot connect to video rendering API server. Using mock implementation instead.");
        apiErrorShown = true;
        
        setTimeout(() => {
          toast.info("See API implementation guide in src/docs/api-implementation-guide.md for setting up a real API server");
          apiErrorShown = false;
        }, 3000);
      }
      
      // Fall back to mock implementation
      return mockRenderProcess(params);
    }
    
    throw error;
  }
};

/**
 * Checks the status of a rendering job
 */
export const checkRenderStatus = async (jobId: string): Promise<RenderResponse> => {
  // For demonstration, check if we should use the mock implementation
  if (API_URL.includes('mockify.onrender.com')) {
    return mockCheckStatus(jobId);
  }
  
  const statusUrl = `${API_URL}/${jobId}`;
  
  try {
    console.log("Checking render status for job:", jobId);
    
    // Set timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(statusUrl, {
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || `Server error: ${response.status}`;
      console.error("API status check error:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Render status:", data.status, "Progress:", data.progress || "unknown");
    return data;
  } catch (error) {
    console.error('Error checking render status:', error);
    
    // Check if this is a network error (API server not running)
    if (
      error instanceof TypeError && 
      (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))
    ) {
      // Fall back to mock implementation
      return mockCheckStatus(jobId);
    }
    
    throw error;
  }
};

/**
 * Downloads the rendered video
 */
export const downloadRenderedVideo = (downloadUrl: string, filename = 'tothefknmoon-video.mp4'): void => {
  console.log("Downloading video from:", downloadUrl);
  
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  toast.success("Video downloaded successfully!");
};

/**
 * Checks if the API server is reachable
 */
export const checkApiAvailability = async (): Promise<boolean> => {
  if (API_URL.includes('mockify.onrender.com')) {
    return true; // Mock API is always available
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(API_URL.replace(/\/render$/, '/health'), {
      method: 'GET',
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });
    
    return response.ok;
  } catch (error) {
    console.log('API server not available:', error);
    return false;
  }
};
