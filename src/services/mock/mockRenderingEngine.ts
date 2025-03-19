
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
    const renderScaleFactor = calculateRenderScaleFactor(
      canvas.width,
      canvas.height,
      params.containerWidth,
      params.containerHeight
    );
    
    console.log("Render scale factors:", renderScaleFactor);
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || "video/webm" });
      completeJob(jobId, URL.createObjectURL(blob));
    };
    
    // Start recording
    recorder.start();
    
    // Play the background video
    video.play();
    
    console.log("Drawing with overlay position:", JSON.stringify(params.overlayPosition));
    
    // Render function to draw each frame - EXACT LAYERING ORDER: background → image → overlay
    const render = () => {
      // Clear the canvas for a clean slate each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // LAYER 1: Background video (bottom layer)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // LAYER 2: Overlay image (middle layer)
      if (img && params.overlayPosition) {
        const { left, top, scaleX, scaleY, angle } = params.overlayPosition;
        
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
        
        // Apply the scale
        ctx.scale(scaleX, scaleY);
        
        // Draw the image at the origin (we've already translated)
        ctx.drawImage(
          img,
          0, 0,
          img.naturalWidth, img.naturalHeight
        );
        
        // Restore context state
        ctx.restore();
        
        // Log actual position for debugging
        console.log("Drawing image at:", {
          originalLeft: left,
          originalTop: top,
          scaledLeft,
          scaledTop,
          scaleX,
          scaleY,
          angle
        });
      }
      
      // LAYER 3: Overlay video (top layer)
      if (overlayVideo) {
        ctx.save();
        // Make the overlay slightly transparent but clearly visible
        ctx.globalAlpha = 0.6;
        ctx.drawImage(overlayVideo, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        console.log("Drawing overlay video at full canvas size");
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
};
