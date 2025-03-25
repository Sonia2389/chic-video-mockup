
import React from 'react';

interface ImagePosition {
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  originalWidth: number;
  originalHeight: number;
  angle?: number;
}

interface ImageDisplayProps {
  imageUrl: string;
  savedPosition: ImagePosition | null;
  isEditing: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl, savedPosition, isEditing }) => {
  // If no position data or we're editing, don't render
  if (!savedPosition || isEditing) {
    return null;
  }

  const {
    left,
    top,
    scaleX,
    scaleY,
    originalWidth,
    originalHeight,
    angle = 0
  } = savedPosition;

  // Use exact values from savedPosition, avoiding any rounding
  const imageStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    transform: `rotate(${angle}deg)`,
    transformOrigin: 'top left',
    width: `${originalWidth}px`,
    height: `${originalHeight}px`,
    objectFit: 'fill', // Use fill to match editor behavior
    zIndex: 10,
    boxSizing: 'border-box',
    pointerEvents: 'none',
    display: 'block',
    willChange: 'transform', // Optimize for transforms
    imageRendering: 'auto', // Changed from 'high-quality' to 'auto'
  };

  // Apply exact scaling without rounding
  if (scaleX !== undefined && scaleY !== undefined) {
    imageStyle.transform = `rotate(${angle}deg) scale(${scaleX}, ${scaleY})`;
  }

  // Use key with position values to force re-render when position changes
  const positionKey = JSON.stringify(savedPosition);

  return (
    <img
      key={positionKey}
      src={imageUrl}
      alt="Overlay"
      style={imageStyle}
      onLoad={() => console.log("ImageDisplay: Image loaded with position:", savedPosition)}
      crossOrigin="anonymous"
    />
  );
};

export default ImageDisplay;
