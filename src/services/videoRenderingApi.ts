
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

// Update this URL to point to your actual video rendering API
export const API_URL = process.env.NODE_ENV === 'production' 
  ? "https://api.yourserver.com/api/render"  // Replace with your production API URL
  : "http://localhost:3001/api/render";  // Updated local development server URL

// A flag to track if we've shown the API connection error already
let apiErrorShown = false;

/**
 * Sends a request to start rendering a video on the backend API
 */
export const startVideoRender = async (params: RenderVideoParams): Promise<string> => {
  try {
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
        toast.error("Cannot connect to video rendering API server. Please make sure the server is running at " + API_URL);
        apiErrorShown = true;
        
        setTimeout(() => {
          toast.info("See API implementation guide in src/docs/api-implementation-guide.md for instructions");
          apiErrorShown = false;
        }, 3000);
      }
      throw new Error("API server not available. Please check your server implementation.");
    }
    
    throw error;
  }
};

/**
 * Checks the status of a rendering job
 */
export const checkRenderStatus = async (jobId: string): Promise<RenderResponse> => {
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
      throw new Error("API server not available. Please check your server implementation.");
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
