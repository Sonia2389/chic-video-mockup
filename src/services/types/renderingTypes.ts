
export interface RenderVideoParams {
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
  quality?: 'standard' | 'high' | 'ultra';
}

export interface RenderResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
  progress?: number;
}

export interface JobInfo {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  params?: {
    aspectRatio: number;
    quality?: 'standard' | 'high' | 'ultra';
  };
  downloadUrl?: string;
  error?: string;
}
