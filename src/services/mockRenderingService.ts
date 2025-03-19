
import { RenderVideoParams, RenderResponse } from "./types/renderingTypes";
import { createJob, getJobInfo } from "./mock/mockJobManager";
import { renderVideo, simulateProgress } from "./mock/mockRenderingEngine";

/**
 * Mock implementation for demonstration purposes
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
  setTimeout(() => renderVideo(params, jobId), 12000);
  
  return jobId;
};

/**
 * Mock implementation for checking render status
 */
export const mockCheckStatus = async (jobId: string): Promise<RenderResponse> => {
  console.log("Using mock status check implementation");
  const jobInfo = getJobInfo(jobId);
  
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
