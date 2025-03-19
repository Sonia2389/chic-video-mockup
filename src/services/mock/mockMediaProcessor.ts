
/**
 * Creates a media recorder for the canvas
 * @returns The MediaRecorder and chunks array
 */
export const setupMediaRecorder = (canvas: HTMLCanvasElement): { 
  recorder: MediaRecorder; 
  chunks: Blob[]; 
  mimeType: string;
} => {
  const chunks: Blob[] = [];
  const stream = canvas.captureStream(30);
  
  // Try different mime types to find one that the browser supports
  let mimeType = '';
  
  // Test different codecs in order of preference
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
    ''  // Default, let browser decide
  ];
  
  // Find the first supported mime type
  for (const type of mimeTypes) {
    if (type === '' || MediaRecorder.isTypeSupported(type)) {
      mimeType = type;
      break;
    }
  }
  
  // Create the MediaRecorder with the supported mime type
  try {
    const recorder = new MediaRecorder(stream, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: 5000000
    });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    return { recorder, chunks, mimeType };
  } catch (e) {
    console.error("MediaRecorder error:", e);
    throw new Error("Your browser doesn't support video recording");
  }
};

/**
 * Calculates the render scale factor between preview and final output
 */
export const calculateRenderScaleFactor = (
  canvasWidth: number,
  canvasHeight: number,
  containerWidth?: number,
  containerHeight?: number
): { x: number; y: number } => {
  return {
    x: canvasWidth / (containerWidth || canvasWidth),
    y: canvasHeight / (containerHeight || canvasHeight)
  };
};

/**
 * Loads a video element with a file
 */
export const loadVideoElement = async (videoFile: File): Promise<HTMLVideoElement> => {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  
  // Set up the video source with the file
  video.src = URL.createObjectURL(videoFile);
  
  // Wait for video to load metadata
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
    video.load();
  });
  
  return video;
};

/**
 * Loads an image element with a file
 */
export const loadImageElement = async (imageFile: File): Promise<HTMLImageElement> => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  
  // Load the image
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(imageFile);
  });
  
  return img;
};
