
/**
 * Creates a media recorder for the canvas
 * @returns The MediaRecorder and chunks array
 */
export const setupMediaRecorder = (canvas: HTMLCanvasElement, preferMp4 = false): { 
  recorder: MediaRecorder; 
  chunks: Blob[]; 
  mimeType: string;
} => {
  const chunks: Blob[] = [];
  const stream = canvas.captureStream(30);
  
  // Try different mime types to find one that the browser supports
  let mimeType = '';
  
  // Test different codecs in order of preference
  let mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
    ''  // Default, let browser decide
  ];
  
  // If MP4 is preferred for Windows compatibility, prioritize it
  if (preferMp4) {
    mimeTypes = [
      'video/mp4',
      'video/mp4;codecs=h264',
      'video/mp4;codecs=avc1',
      'video/webm',
      ''  // Default, let browser decide
    ];
  }
  
  // Find the first supported mime type
  for (const type of mimeTypes) {
    if (type === '' || MediaRecorder.isTypeSupported(type)) {
      mimeType = type;
      console.log("Using MIME type for recording:", mimeType || "browser default");
      break;
    }
  }
  
  // Create the MediaRecorder with the supported mime type
  try {
    const recorder = new MediaRecorder(stream, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: 5000000 // High bitrate for quality
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
 * Enhanced for pixel-perfect accuracy
 */
export const calculateRenderScaleFactor = (
  canvasWidth: number,
  canvasHeight: number,
  containerWidth: number = 0,
  containerHeight: number = 0
): { x: number; y: number } => {
  // Prevent division by zero
  if (!containerWidth || !containerHeight || !canvasWidth || !canvasHeight) {
    console.warn("Invalid dimensions in scale factor calculation, using 1:1 ratio");
    return { x: 1, y: 1 };
  }

  // Validate that dimensions are reasonable
  if (containerWidth < 10 || containerHeight < 10) {
    console.warn("Container dimensions suspiciously small, using 1:1 ratio");
    return { x: 1, y: 1 };
  }

  if (canvasWidth < 10 || canvasHeight < 10) {
    console.warn("Canvas dimensions suspiciously small, using 1:1 ratio");
    return { x: 1, y: 1 };
  }

  // Calculate scaling factors - this is critical for accurate positioning
  const scaleX = canvasWidth / containerWidth;
  const scaleY = canvasHeight / containerHeight;

  console.log("Scale factor calculation:", {
    canvasWidth,
    canvasHeight,
    containerWidth,
    containerHeight,
    scaleX,
    scaleY
  });

  return { x: scaleX, y: scaleY };
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
  
  console.log(`Video loaded: ${videoFile.name}, dimensions: ${video.videoWidth}x${video.videoHeight}`);
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
    img.onload = () => {
      console.log(`Image loaded: ${imageFile.name}, dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
      resolve();
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(imageFile);
  });
  
  return img;
}
