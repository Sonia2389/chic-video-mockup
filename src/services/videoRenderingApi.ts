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
      console.log("Using mock rendering service...");
      return mockRenderProcess(params); // Use mock rendering if API_URL points to mockify
    }

    // Ensure that the rendering API receives all necessary params
    console.log("Sending video render request to API with params:", params);

    // Adjust parameters to ensure original speed and position are preserved
    const adjustedParams = { 
      ...params, 
      preserveOriginalSpeed: params.preserveOriginalSpeed ?? true, // Default to true if not specified
      exactPositioning: true, // Always use exact positioning to ensure consistency
    };

    // Log and confirm overlay position and other params are as expected
    console.log("Adjusted params for rendering:", adjustedParams);

    // Ensure overlayPosition is passed correctly with precise values
    if (adjustedParams.overlayPosition) {
      // Preserve exact values without any rounding that could cause size shifting
      console.log("Overlay position being sent to API:", JSON.stringify(adjustedParams.overlayPosition));
    } else {
      console.warn("Overlay position is not defined or not set correctly.");
    }

    // Ensure that the aspect ratio and quality are correctly passed if provided
    console.log("Aspect Ratio:", adjustedParams.aspectRatio);
    console.log("Video Quality:", adjustedParams.quality);
    console.log("Exact Positioning:", adjustedParams.exactPositioning);

    // Call the actual API to start the rendering
    return await apiStartVideoRender(adjustedParams);
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

      // Fall back to mock implementation if API is unavailable
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
    console.log("Using mock status check...");
    return mockCheckStatus(jobId); // Use mock status check if API_URL points to mockify
  }

  try {
    // Call the actual API to check the render status
    return await apiCheckRenderStatus(jobId);
  } catch (error) {
    console.error('Error checking render status:', error);

    // Check if this is a network error (API server not running)
    if (
      error instanceof TypeError && 
      (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))
    ) {
      // Fall back to mock implementation if API is unavailable
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
