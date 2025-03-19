import { RenderVideoParams, RenderResponse } from "./types/renderingTypes";
import { createJob, getJobInfo } from "./mock/mockJobManager";
import { renderVideo, simulateProgress } from "./mock/mockRenderingEngine";

/**
 * Mock implementation for starting the rendering process
 */
export const mockRenderProcess = async (params: RenderVideoParams): Promise<string> => {
  console.log("Using mock API implementation");
  console.log("Overlay position:", JSON.stringify(params.overlayPosition));

  // Create a new job
  const jobId = createJob({
    aspectRatio: params.aspectRatio,
    quality: params.quality || 'standard',
    preserveOriginalSpeed: params.preserveOriginalSpeed,
    exactPositioning: params.exactPositioning
  });

  // Simulate progress updates
  simulateProgress(jobId);

  // Start the actual rendering process after a delay
  await new Promise<void>((resolve) => setTimeout(() => {
    renderVideo(params, jobId);
    resolve();
  }, 12000)); // Simulate a 12-second delay before starting the render process

  return jobId;
};

/**
 * Mock implementation for checking render status
 */
export const mockCheckStatus = async (jobId: string): Promise<RenderResponse> => {
  console.log("Using mock status check implementation");

  // Retrieve job information
  const jobInfo = getJobInfo(jobId);
  
  if (!jobInfo) {
    console.error(`Job not found for ID: ${jobId}`);
    throw new Error(`Job not found for ID: ${jobId}`);
  }
  
  // Return the job information with a fallback to safe defaults if the information is incomplete
  return {
    id: jobInfo.id,
    status: jobInfo.status || 'unknown',
    progress: jobInfo.progress || 0,
    downloadUrl: jobInfo.downloadUrl || ''
  };
};
