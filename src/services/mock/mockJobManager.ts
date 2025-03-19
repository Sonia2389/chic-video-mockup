
import { JobInfo } from "../types/renderingTypes";

// Map to store mock job data without using sessionStorage
const mockJobsMap = new Map<string, JobInfo>();

/**
 * Creates a new rendering job
 */
export const createJob = (params: {
  aspectRatio: number;
  quality: string;
  preserveOriginalSpeed?: boolean;
  exactPositioning?: boolean;
}): string => {
  // Generate a random job ID
  const jobId = Math.random().toString(36).substring(2, 15);
  
  // Store job info in our Map
  mockJobsMap.set(jobId, {
    id: jobId,
    status: 'processing',
    progress: 0,
    startTime: Date.now(),
    params
  });
  
  return jobId;
};

/**
 * Updates an existing job with new progress
 */
export const updateJobProgress = (jobId: string, progress: number): void => {
  const jobInfo = mockJobsMap.get(jobId);
  if (jobInfo) {
    jobInfo.progress = progress;
    mockJobsMap.set(jobId, jobInfo);
  }
};

/**
 * Completes a job with download URL
 */
export const completeJob = (jobId: string, downloadUrl: string): void => {
  const jobInfo = mockJobsMap.get(jobId);
  if (jobInfo) {
    jobInfo.status = 'completed';
    jobInfo.progress = 100;
    jobInfo.downloadUrl = downloadUrl;
    mockJobsMap.set(jobId, jobInfo);
  }
};

/**
 * Marks a job as failed
 */
export const failJob = (jobId: string, error: string): void => {
  const jobInfo = mockJobsMap.get(jobId);
  if (jobInfo) {
    jobInfo.status = 'failed';
    jobInfo.error = error;
    mockJobsMap.set(jobId, jobInfo);
  }
};

/**
 * Gets job info
 */
export const getJobInfo = (jobId: string): JobInfo | undefined => {
  return mockJobsMap.get(jobId);
};
