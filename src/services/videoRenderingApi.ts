
/**
 * This file contains the functions to interact with the video rendering API.
 * Use this as a reference for the API implementation in your separate project.
 */

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
}

interface RenderResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
}

/**
 * Sends a request to start rendering a video on the backend API
 */
export const startVideoRender = async (params: RenderVideoParams): Promise<string> => {
  // This is a placeholder for the actual API implementation
  // Replace with your actual API URL
  const API_URL = "https://your-rendering-api.example.com/api/render";
  
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

    // Send the request
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to start rendering');
    }

    const data = await response.json();
    return data.id; // Return the job ID for status checking
  } catch (error) {
    console.error('Error starting video render:', error);
    throw error;
  }
};

/**
 * Checks the status of a rendering job
 */
export const checkRenderStatus = async (jobId: string): Promise<RenderResponse> => {
  // Replace with your actual API URL
  const API_URL = `https://your-rendering-api.example.com/api/render/${jobId}`;
  
  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to check rendering status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking render status:', error);
    throw error;
  }
};

/**
 * Downloads the rendered video
 */
export const downloadRenderedVideo = (downloadUrl: string, filename = 'tothefknmoon-video.mp4'): void => {
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  toast.success("Video downloaded successfully!");
};
