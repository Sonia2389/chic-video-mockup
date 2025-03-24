
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
    
    let canvasWidth = 1920; // Default width
    let canvasHeight = 1080; // Default height
    
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
    if (params.overlayVideo) {
      overlayVideo = await loadVideoElement(params.overlayVideo);
      console.log("Overlay video loaded with dimensions:", overlayVideo.videoWidth, "x", overlayVideo.videoHeight);
      
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
    
    console.log("Image dimensions for rendering:", {
      imgWidth: img.width,
      imgHeight: img.height,
      originalWidth: params.overlayPosition.originalWidth,
      originalHeight: params.overlayPosition.originalHeight,
      scaleX: params.overlayPosition.scaleX,
      scaleY: params.overlayPosition.scaleY
    });
    
    console.log("Using exact positioning:", params.exactPositioning);
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || "video/webm" });
      completeJob(jobId, URL.createObjectURL(blob));
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
    
    console.log("Drawing with overlay position:", JSON.stringify(params.overlayPosition));
    
    // Create a 5-second looping video (changed from 10 to 5 seconds)
    const renderDuration = 5000; // 5 seconds for the loop
    const startTime = Date.now();
    
    // For overlay video, determine loop duration
    let overlayDuration = 0;
    if (overlayVideo) {
      overlayDuration = overlayVideo.duration * 1000 || 5000;
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
        
        // Calculate the exact position based on the scaling factors
        let scaledLeft = left;
        let scaledTop = top;
        let scaledScaleX = scaleX;
        let scaledScaleY = scaleY;
        
        // Only apply render scale factor if not using exact positioning
        if (!params.exactPositioning) {
          scaledLeft *= renderScaleFactor.x;
          scaledTop *= renderScaleFactor.y;
          scaledScaleX *= renderScaleFactor.x;
          scaledScaleY *= renderScaleFactor.y;
        }
        
        // Apply transformations in order: translate → rotate → scale
        ctx.translate(scaledLeft, scaledTop);
        
        if (angle) {
          ctx.rotate((angle * Math.PI) / 180);
        }
        
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
      
      // Create a perfect 5-second looping video (changed from 10 to 5 seconds)
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
  // Simulate progress at different stages to match 5 second rendering (changed from 10 to 5 seconds)
  setTimeout(() => updateJobProgress(jobId, 20), 1000);
  setTimeout(() => updateJobProgress(jobId, 40), 2000);
  setTimeout(() => updateJobProgress(jobId, 60), 3000);
  setTimeout(() => updateJobProgress(jobId, 80), 4000);
  setTimeout(() => updateJobProgress(jobId, 95), 4800);
}
