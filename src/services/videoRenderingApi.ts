
import { toast } from "sonner";
import { RenderVideoParams, RenderResponse } from "./types/renderingTypes";
import { API_URL, apiErrorShown, setApiErrorShown } from "./config/apiConfig";
import { mockRenderProcess, mockCheckStatus } from "./mockRenderingService";
import { apiStartVideoRender, apiCheckRenderStatus, checkApiAvailability } from "./apiRenderingService";

/**
 * Sends a request to start rendering a video on the backend API
 */
export const startVideoRender = async (params: RenderVideoParams): Promise<string> => {
  try {
    // For demonstration, check if we should use the mock implementation
    if (API_URL.includes('mockify.onrender.com')) {
      return mockRenderProcess(params);
    }
    
    return await apiStartVideoRender(params);
  } catch (error) {
    console.error('Error starting video render:', error);
    
    // Check if this is a network error (API server not running)
    if (
      error instanceof TypeError && 
      (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))
    ) {
      if (!apiErrorShown) {
        toast.error("Cannot connect to video rendering API server. Using mock implementation instead.");
        setApiErrorShown(true);
        
        setTimeout(() => {
          toast.info("See API implementation guide in src/docs/api-implementation-guide.md for setting up a real API server");
          setApiErrorShown(false);
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
  
  try {
    return await apiCheckRenderStatus(jobId);
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

// Export the checkApiAvailability function from apiRenderingService
export { checkApiAvailability, API_URL };
