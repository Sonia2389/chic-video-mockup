
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

    // Log exact position values for debugging
    console.log("Sending video render request with exact position values:", {
      position: JSON.stringify(params.overlayPosition, null, 2),
      containerDimensions: params.containerWidth && params.containerHeight 
        ? `${params.containerWidth}x${params.containerHeight}` 
        : 'Not provided'
    });

    // Always use exact positioning without any rounding
    const adjustedParams = { 
      ...params, 
      preserveOriginalSpeed: params.preserveOriginalSpeed ?? true,
      exactPositioning: true, // Force exact positioning
    };

    // Ensure position values are passed as-is without any rounding
    if (adjustedParams.overlayPosition) {
      // Clone the position object to avoid reference issues
      adjustedParams.overlayPosition = JSON.parse(JSON.stringify(adjustedParams.overlayPosition));
      console.log("Using exact overlay position values:", JSON.stringify(adjustedParams.overlayPosition, null, 2));
    }

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

  // Ensure filename has mp4 extension for Windows compatibility
  if (!filename.endsWith('.mp4')) {
    filename = filename.replace(/\.[^/.]+$/, '') + '.mp4';
  }

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  toast.success(`Video downloaded as ${filename}`);
};

// Export the checkApiAvailability function from apiRenderingService
export { checkApiAvailability, API_URL };
