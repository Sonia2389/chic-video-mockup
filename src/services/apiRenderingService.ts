
import { RenderVideoParams, RenderResponse } from "./types/renderingTypes";
import { API_URL } from "./config/apiConfig";

/**
 * Utility function to create a timeout for the request
 */
const createTimeoutController = (timeout: number) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
};

/**
 * Sends a request to start rendering a video on the backend API
 */
export const apiStartVideoRender = async (params: RenderVideoParams): Promise<string> => {
  // Create form data to send files
  const formData = new FormData();
  
  // Add required background image
  formData.append('backgroundImage', params.backgroundImage);
  
  formData.append('overlayImage', params.overlayImage);
  formData.append('overlayPosition', JSON.stringify(params.overlayPosition));
  formData.append('aspectRatio', params.aspectRatio.toString());

  if (params.overlayVideo) {
    formData.append('overlayVideo', params.overlayVideo);
  }

  if (params.quality) {
    formData.append('quality', params.quality);
  }

  if (params.preserveOriginalSpeed !== undefined) {
    formData.append('preserveOriginalSpeed', params.preserveOriginalSpeed.toString());
  }

  if (params.exactPositioning !== undefined) {
    formData.append('exactPositioning', params.exactPositioning.toString());
  }

  console.log("Sending render request to API:", API_URL);
  console.log("Background image size:", params.backgroundImage.size);
  console.log("Overlay image size:", params.overlayImage.size);
  console.log("Overlay position:", JSON.stringify(params.overlayPosition));
  console.log("Quality setting:", params.quality || 'standard');
  console.log("Preserve original speed:", params.preserveOriginalSpeed);
  console.log("Exact positioning:", params.exactPositioning);

  const { controller, timeoutId } = createTimeoutController(10000); // 10 second timeout

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Server error: ${response.status}`;
      console.error("API error:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Render job started, ID:", data.id);
    return data.id; // Return the job ID for status checking
  } catch (error) {
    console.error('Error in API start render:', error);
    throw error;
  }
};

/**
 * Checks the status of a rendering job using the API
 */
export const apiCheckRenderStatus = async (jobId: string): Promise<RenderResponse> => {
  const statusUrl = `${API_URL}/${jobId}`;
  
  console.log("Checking render status for job:", jobId);

  const { controller, timeoutId } = createTimeoutController(5000); // 5 second timeout

  try {
    const response = await fetch(statusUrl, {
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Server error: ${response.status}`;
      console.error("API status check error:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Render status:", data.status, "Progress:", data.progress || "unknown");
    return data;
  } catch (error) {
    console.error('Error in API check render status:', error);
    throw error;
  }
};

/**
 * Checks if the API server is reachable
 */
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const { controller, timeoutId } = createTimeoutController(3000); // 3 second timeout

    const response = await fetch(API_URL.replace(/\/render$/, '/health'), {
      method: 'GET',
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    return response.ok;
  } catch (error) {
    console.log('API server not available:', error);
    return false;
  }
};
