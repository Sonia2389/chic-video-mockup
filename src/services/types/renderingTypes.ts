
export interface RenderVideoParams {
  backgroundVideo?: File;
  backgroundImage?: File;
  overlayImage: File;
  overlayVideo?: File;
  overlayPosition: {
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    width?: number;
    height?: number;
    originalWidth?: number;
    originalHeight?: number;
    angle?: number;
  };
  aspectRatio: number;
  quality?: 'low' | 'standard' | 'high';
  preserveOriginalSpeed?: boolean;
  exactPositioning?: boolean;
  containerWidth?: number;
  containerHeight?: number;
}

export interface RenderResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
}

export interface JobInfo {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  params: {
    aspectRatio: number;
    quality: string;
    preserveOriginalSpeed?: boolean;
    exactPositioning?: boolean;
  };
  downloadUrl?: string;
  error?: string;
}
