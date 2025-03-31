
import { completeJob, failJob, updateJobProgress } from "./mockJobManager";
import { calculateRenderScaleFactor, loadImageElement, loadVideoElement, setupMediaRecorder } from "./mockMediaProcessor";
import { RenderVideoParams } from "../types/renderingTypes";

/**
 * Performs the actual video rendering
 */
export const renderVideo = async (params: RenderVideoParams, jobId: string): Promise<void> => {
  try {
    // Create a canvas to composite the image and overlay
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Canvas context creation failed");
    }
    
    // Default dimensions
    let canvasWidth = 1920;
    let canvasHeight = 1080;
    
    // Load background image
    let backgroundImg: HTMLImageElement | null = null;
    
    if (params.backgroundImage) {
      // Load the background image
      backgroundImg = await loadImageElement(params.backgroundImage);
      canvasWidth = backgroundImg.naturalWidth;
      canvasHeight = backgroundImg.naturalHeight;
      console.log("Background image loaded with dimensions:", canvasWidth, "x", canvasHeight);
    } else {
      throw new Error("No background image provided");
    }
    
    // Set canvas dimensions based on background media
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Load the overlay image
    const img = await loadImageElement(params.overlayImage);
    console.log("Overlay image loaded with dimensions:", img.naturalWidth, "x", img.naturalHeight);
    
    // Check if we have an overlay video
    let overlayVideo: HTMLVideoElement | null = null;
    let renderDuration = 5000; // Default to 5 seconds for the loop
    
    if (params.overlayVideo) {
      overlayVideo = await loadVideoElement(params.overlayVideo);
      console.log("Overlay video loaded with dimensions:", overlayVideo.videoWidth, "x", overlayVideo.videoHeight);
      
      // Calculate render duration based on overlay video
      if (overlayVideo.duration) {
        renderDuration = Math.round(overlayVideo.duration * 1000);
        // Ensure reasonable duration (3 seconds to 30 seconds)
        renderDuration = Math.max(3000, Math.min(renderDuration, 30000));
        console.log(`Using overlay video duration for rendering: ${renderDuration}ms`);
      }
      
      // Start playing the overlay video
      await overlayVideo.play();
    }
    
    // Set up for recording - explicitly request MP4 format for Windows compatibility
    const { recorder, chunks, mimeType } = setupMediaRecorder(canvas, true); // Pass true to prefer MP4
    
    // Calculate the correct scaling factor between preview and render
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
    
    console.log("Using overlay position for rendering:", JSON.stringify(params.overlayPosition, null, 2));
    
    recorder.onstop = () => {
      // Create blob with MP4 mimetype specifically for Windows compatibility
      const blob = new Blob(chunks, { type: mimeType || "video/mp4" });
      
      // Create a URL for the blob
      const videoUrl = URL.createObjectURL(blob);
      console.log("Video created with MIME type:", mimeType || "video/mp4");
      
      // Complete the job with the video URL
      completeJob(jobId, videoUrl);
      console.log("Rendering complete for job:", jobId);
      
      // Clean up resources
      if (overlayVideo) {
        overlayVideo.pause();
        URL.revokeObjectURL(overlayVideo.src);
      }
      if (backgroundImg) {
        URL.revokeObjectURL(backgroundImg.src);
      }
      if (img) {
        URL.revokeObjectURL(img.src);
      }
    };
    
    // Start recording
    recorder.start();
    
    // Create a video that matches the overlay video duration or default 5 seconds
    const startTime = Date.now();
    
    // For overlay video, determine loop duration
    let overlayDuration = 0;
    if (overlayVideo) {
      overlayDuration = overlayVideo.duration * 1000 || renderDuration;
    }
    
    // Render function to draw each frame
    const render = () => {
      // Clear the canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // LAYER 1: Background image (bottom layer)
      if (backgroundImg) {
        // Draw background image
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
      }
      
      // LAYER 2: Overlay image (middle layer)
      if (img && params.overlayPosition) {
        const { left, top, scaleX, scaleY, angle, originalWidth, originalHeight } = params.overlayPosition;
        
        // Save current context state
        ctx.save();
        
        // Apply transformations in order: translate → rotate → scale
        ctx.translate(left, top);
        
        if (angle) {
          ctx.rotate((angle * Math.PI) / 180);
        }
        
        // Draw the image at the origin (we've already translated)
        if (originalWidth && originalHeight) {
          ctx.scale(scaleX, scaleY);
          ctx.drawImage(
            img,
            0, 0,
            originalWidth, 
            originalHeight
          );
        } else {
          // Fallback if original dimensions not provided
          ctx.scale(scaleX, scaleY);
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
      
      // LAYER 3: Overlay video (top layer with 20% opacity)
      if (overlayVideo) {
        // Apply overlay video with 20% opacity
        ctx.save();
        ctx.globalAlpha = 0.2;
        
        // Calculate position in the loop for overlay video
        const elapsed = Date.now() - startTime;
        if (overlayDuration > 0) {
          // If video needs to loop, reset its playback
          const loopPosition = elapsed % overlayDuration;
          if (overlayVideo.currentTime > loopPosition / 1000) {
            overlayVideo.currentTime = 0;
          }
        }
        
        // Cover the entire canvas with the overlay video while maintaining aspect ratio
        const aspectRatio = overlayVideo.videoWidth / overlayVideo.videoHeight;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        
        // Calculate dimensions to fill the entire canvas (same as "cover")
        if (aspectRatio > canvas.width / canvas.height) {
          // Height constrained
          drawWidth = canvas.height * aspectRatio;
          // Center horizontally
          const offsetX = (canvas.width - drawWidth) / 2;
          ctx.drawImage(overlayVideo, offsetX, 0, drawWidth, canvas.height);
        } else {
          // Width constrained
          drawHeight = canvas.width / aspectRatio;
          // Center vertically
          const offsetY = (canvas.height - drawHeight) / 2;
          ctx.drawImage(overlayVideo, 0, offsetY, canvas.width, drawHeight);
        }
        
        ctx.restore();
      }
      
      // Create a video with the overlay video duration
      const elapsed = Date.now() - startTime;
      if (elapsed < renderDuration) {
        requestAnimationFrame(render);
      } else {
        // Stop recording when done
        recorder.stop();
      }
    };
    
    // Start the rendering process
    requestAnimationFrame(render);
    
  } catch (error) {
    console.error("Error in mock rendering:", error);
    failJob(jobId, error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Simulates progress updates for a rendering job
 */
export const simulateProgress = (jobId: string): void => {
  // Simulate progress with more granular updates
  setTimeout(() => updateJobProgress(jobId, 10), 500);
  setTimeout(() => updateJobProgress(jobId, 20), 1000);
  setTimeout(() => updateJobProgress(jobId, 30), 2000);
  setTimeout(() => updateJobProgress(jobId, 40), 3000);
  setTimeout(() => updateJobProgress(jobId, 50), 4000);
  setTimeout(() => updateJobProgress(jobId, 60), 5000);
  setTimeout(() => updateJobProgress(jobId, 70), 6000);
  setTimeout(() => updateJobProgress(jobId, 80), 7000);
  setTimeout(() => updateJobProgress(jobId, 90), 8000);
  setTimeout(() => updateJobProgress(jobId, 95), 9000);
}
