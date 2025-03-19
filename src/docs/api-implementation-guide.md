
# Video Rendering API Implementation Guide

This document provides guidelines for implementing the backend API service for video rendering that will work with the tothefknmoon application.

## Technology Stack Recommendations

- **Server Framework**: Node.js with Express.js
- **Video Processing**: FFmpeg
- **File Storage**: AWS S3, Google Cloud Storage, or similar
- **Queue System**: Bull with Redis (for handling long-running rendering jobs)
- **Deployment**: Docker containers on AWS, Google Cloud, or similar

## API Endpoints

### 1. Start Rendering Job

```
POST /api/render
```

**Request Body**: `multipart/form-data`
- `backgroundVideo`: The background video file
- `overlayImage`: The image to overlay on the video
- `overlayPosition`: JSON string with position data:
  ```json
  {
    "left": number,
    "top": number,
    "width": number,
    "height": number,
    "scaleX": number,
    "scaleY": number,
    "originalWidth": number,
    "originalHeight": number,
    "angle": number (optional)
  }
  ```
- `overlayVideo`: (Optional) Video overlay file
- `aspectRatio`: Number representing the aspect ratio (e.g., 16/9)
- `quality`: (Optional) Quality level: "standard", "high", or "ultra"
- `preserveOriginalSpeed`: (Optional) Boolean to maintain original video speed
- `exactPositioning`: (Optional) Boolean to ensure exact positioning as in preview

**Response**: 
```json
{
  "id": "job-unique-id",
  "status": "processing"
}
```

### 2. Check Rendering Status

```
GET /api/render/:jobId
```

**Response**:
```json
{
  "id": "job-unique-id",
  "status": "processing|completed|failed",
  "progress": number (0-100),
  "downloadUrl": "https://url-to-download-video.mp4" (if completed),
  "error": "Error message" (if failed)
}
```

## Implementation Steps

### 1. Server Setup

1. Initialize a Node.js project
2. Install dependencies:
   ```bash
   npm install express multer ffmpeg-static @ffmpeg/ffmpeg @ffmpeg/core bull cors
   ```
3. Set up Express server with appropriate middleware

### 2. File Handling

1. Use Multer to handle file uploads
2. Implement temporary storage for uploaded files
3. Set up cloud storage for the rendered videos

### 3. Video Processing

1. Create a worker process using Bull queue for handling rendering jobs
2. Use FFmpeg to process the video with the following steps:
   - Extract frames from the background video
   - Apply the image overlay at the specified position
   - Apply the video overlay effect (if provided)
   - Combine all elements into a final video
   - Export at high quality (consider using h264 or h265 codec)

### 4. API Routes

1. Implement the `/api/render` POST endpoint to accept job parameters
2. Implement the `/api/render/:jobId` GET endpoint to check job status
3. Add proper error handling and validation

### 5. Sample FFmpeg Command

Here's a sample FFmpeg command that can achieve similar effects to the browser-based rendering:

```bash
ffmpeg -i background.mp4 -i overlay.png -filter_complex "[0:v][1:v]overlay=x=100:y=100:enable='between(t,0,5)'" -c:v libx264 -crf 18 -preset veryslow -c:a copy output.mp4
```

For more complex overlays with rotation and scaling:

```bash
ffmpeg -i background.mp4 -i overlay.png -filter_complex "[1:v]rotate=30*PI/180:c=none:ow=rotw(30*PI/180):oh=roth(30*PI/180)[rotated];[0:v][rotated]overlay=100:100:enable='between(t,0,5)'" -c:v libx264 -crf 18 -preset veryslow -c:a copy output.mp4
```

## Ensuring Exact Preview Matching

To ensure the rendered video matches exactly what users see in the preview:

1. Use the exact overlay positioning parameters from the frontend
2. Maintain the original video speed when `preserveOriginalSpeed` is set to true
3. Use high-quality encoding settings for visual accuracy
4. Preserve the aspect ratio throughout the rendering process
5. Apply the exact rotation and scaling factors to the overlay image

## Performance Considerations

1. Use server instances with adequate CPU and memory for video processing
2. Implement job queueing to handle multiple rendering requests
3. Consider using GPU acceleration where available
4. Set appropriate timeouts for long-running processes
5. Implement clean-up procedures for temporary files

## Security Considerations

1. Validate all input files (type, size, content)
2. Implement rate limiting to prevent abuse
3. Add authentication if this is a public-facing API
4. Sanitize all user inputs
5. Use HTTPS for all communication

## Integration with Frontend

The frontend application should:
1. Upload all necessary assets
2. Poll for job status periodically
3. Provide a download link when processing is complete
4. Handle errors gracefully
