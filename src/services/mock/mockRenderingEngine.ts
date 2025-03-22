
import { completeJob, failJob, updateJobProgress } from "./mockJobManager";
import { calculateRenderScaleFactor, loadImageElement, loadVideoElement, setupMediaRecorder } from "./mockMediaProcessor";
import { RenderVideoParams } from "../types/renderingTypes";

/**
 * Performs the actual video rendering
 */
export const renderVideo = async (params: RenderVideoParams, jobId: string): Promise<void> => {
  try {
    // Create a canvas to composite the video and image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Canvas context creation failed");
    }
    
    // Load the background video
    const video = await loadVideoElement(params.backgroundVideo);
    
    // Set canvas dimensions based on video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Load the overlay image
    const img = await loadImageElement(params.overlayImage);
    
    // Check if we have an overlay video
    let overlayVideo: HTMLVideoElement | null = null;
    if (params.overlayVideo) {
      overlayVideo = await loadVideoElement(params.overlayVideo);
      
      // Start playing the overlay video
      await overlayVideo.play();
    }
    
    // Set up for recording
    const { recorder, chunks, mimeType } = setupMediaRecorder(canvas);
    
    // Calculate the correct scaling factor between preview and render
    // This ensures that positions in the preview match positions in the rendered video
    const renderScaleFactor = calculateRenderScaleFactor(
      canvas.width,
      canvas.height,
      params.containerWidth || 0,
      params.containerHeight || 0
    );
    
    // Log dimensions for debugging
    console.log("Render dimensions:", {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      containerWidth: params.containerWidth,
      containerHeight: params.containerHeight,
      scaleFactorX: renderScaleFactor.x,
      scaleFactorY: renderScaleFactor.y
    });
    
    console.log("Image dimensions:", {
      imgWidth: img.width,
      imgHeight: img.height,
      originalWidth: params.overlayPosition.originalWidth,
      originalHeight: params.overlayPosition.originalHeight
    });
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || "video/webm" });
      completeJob(jobId, URL.createObjectURL(blob));
    };
    
    // Start recording
    recorder.start();
    
    // Play the background video
    video.play();
    
    console.log("Drawing with overlay position:", JSON.stringify(params.overlayPosition));
    
    // Render function to draw each frame
    const render = () => {
      // Clear the canvas for a clean slate each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // LAYER 1: Background video (bottom layer)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // LAYER 2: Overlay video (2nd layer, on top of background but below image)
      if (overlayVideo) {
        // Updated: Draw overlay video with 80% opacity
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(overlayVideo, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      
      // LAYER 3: Overlay image (top layer)
      if (img && params.overlayPosition) {
        const { left, top, scaleX, scaleY, angle, originalWidth, originalHeight } = params.overlayPosition;
        
        // Save current context state
        ctx.save();
        
        // Scale the positioning values to match the video dimensions
        const scaledLeft = left * renderScaleFactor.x;
        const scaledTop = top * renderScaleFactor.y;
        
        // Apply transformations in order: translate → rotate → scale
        ctx.translate(scaledLeft, scaledTop);
        
        if (angle) {
          ctx.rotate((angle * Math.PI) / 180);
        }
        
        // Scale properly based on original dimensions
        const scaledScaleX = scaleX * renderScaleFactor.x;
        const scaledScaleY = scaleY * renderScaleFactor.y;
        
        // Log actual position for each frame
        console.log("Frame rendering:", {
          left, top, 
          scaledLeft, scaledTop,
          scaleX, scaleY,
          scaledScaleX, scaledScaleY,
          angle
        });
        
        // Draw the image at the origin (we've already translated)
        if (originalWidth && originalHeight) {
          ctx.drawImage(
            img,
            0, 0,
            originalWidth * scaledScaleX, 
            originalHeight * scaledScaleY
          );
        } else {
          // Fallback if original dimensions not provided
          ctx.scale(scaledScaleX, scaledScaleY);
          ctx.drawImage(
            img,
            0, 0,
            img.naturalWidth, 
            img.naturalHeight
          );
        }
        
        // Restore context state
        ctx.restore();
      }
      
      // Continue rendering until the video ends
      if (video.currentTime < video.duration) {
        requestAnimationFrame(render);
      } else {
        // Stop recording when done
        recorder.stop();
        video.pause();
        if (overlayVideo) {
          overlayVideo.pause();
        }
      }
    };
    
    // Start the rendering process
    requestAnimationFrame(render);
    
    // Set a safety timeout in case the video is too long
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
        video.pause();
        if (overlayVideo) {
          overlayVideo.pause();
        }
      }
    }, 20000); // Limit to 20 seconds max
    
  } catch (error) {
    console.error("Error in mock video rendering:", error);
    failJob(jobId, error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Simulates progress updates for a rendering job
 */
export const simulateProgress = (jobId: string): void => {
  // Simulate progress at different stages
  setTimeout(() => updateJobProgress(jobId, 25), 3000);
  setTimeout(() => updateJobProgress(jobId, 50), 6000);
  setTimeout(() => updateJobProgress(jobId, 75), 9000);
}
