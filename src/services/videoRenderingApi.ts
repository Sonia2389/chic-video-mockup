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

// Mock implementation for demonstration purposes
const mockRenderProcess = async (params: RenderVideoParams): Promise<string> => {
  console.log("Using mock API implementation");
  // Generate a random job ID
  const jobId = Math.random().toString(36).substring(2, 15);
  
  // Store job info in sessionStorage for later retrieval
  sessionStorage.setItem(`render_job_${jobId}`, JSON.stringify({
    id: jobId,
    status: 'processing',
    progress: 0,
    startTime: Date.now(),
    params: {
      aspectRatio: params.aspectRatio,
      quality: params.quality || 'standard'
    }
  }));
  
  // Start mock processing
  setTimeout(() => {
    const jobInfo = JSON.parse(sessionStorage.getItem(`render_job_${jobId}`) || '{}');
    jobInfo.progress = 25;
    sessionStorage.setItem(`render_job_${jobId}`, JSON.stringify(jobInfo));
  }, 3000);
  
  setTimeout(() => {
    const jobInfo = JSON.parse(sessionStorage.getItem(`render_job_${jobId}`) || '{}');
    jobInfo.progress = 50;
    sessionStorage.setItem(`render_job_${jobId}`, JSON.stringify(jobInfo));
  }, 6000);
  
  setTimeout(() => {
    const jobInfo = JSON.parse(sessionStorage.getItem(`render_job_${jobId}`) || '{}');
    jobInfo.progress = 75;
    sessionStorage.setItem(`render_job_${jobId}`, JSON.stringify(jobInfo));
  }, 9000);
  
  setTimeout(() => {
    const jobInfo = JSON.parse(sessionStorage.getItem(`render_job_${jobId}`) || '{}');
    jobInfo.status = 'completed';
    jobInfo.progress = 100;
    
    // Create a data URL for the "rendered" video (using the background video)
    const reader = new FileReader();
    reader.onload = function() {
      jobInfo.downloadUrl = reader.result;
      sessionStorage.setItem(`render_job_${jobId}`, JSON.stringify(jobInfo));
    };
    reader.readAsDataURL(params.backgroundVideo);
  }, 12000);
  
  return jobId;
};

// Mock implementation for checking render status
const mockCheckStatus = async (jobId: string): Promise<RenderResponse> => {
  console.log("Using mock status check implementation");
  const jobInfo = JSON.parse(sessionStorage.getItem(`render_job_${jobId}`) || '{}');
  
  if (!jobInfo.id) {
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
