
/**
 * Utility functions for handling image position data
 */

/**
 * Interface for position data
 */
export interface ImagePosition {
  left: number;
  top: number;
  scale: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  originalWidth: number;
  originalHeight: number;
  angle?: number;
}

/**
 * Creates a deep clone of position data to avoid reference issues
 */
export const clonePosition = (position: ImagePosition): ImagePosition => {
  return JSON.parse(JSON.stringify(position));
};

/**
 * Logs position data for debugging
 */
export const logPosition = (
  label: string, 
  position: ImagePosition | null, 
  containerDimensions?: { width: number; height: number } | null
) => {
  if (position) {
    console.log(
      `${label}:`, 
      JSON.stringify(position, null, 2), 
      containerDimensions ? `Container: ${containerDimensions.width}x${containerDimensions.height}` : ''
    );
  } else {
    console.log(`${label}: No position data available`);
  }
};

/**
 * Validates position data to ensure all required properties exist
 */
export const validatePosition = (position: any): ImagePosition | null => {
  if (!position) return null;
  
  // Check for required properties
  const requiredProps = [
    'left', 'top', 'scaleX', 'scaleY', 
    'originalWidth', 'originalHeight'
  ];
  
  const missingProps = requiredProps.filter(prop => 
    position[prop] === undefined || position[prop] === null
  );
  
  if (missingProps.length > 0) {
    console.error(`Invalid position data. Missing properties: ${missingProps.join(', ')}`);
    return null;
  }
  
  // Ensure all numeric values are actually numbers
  const numericProps = [
    'left', 'top', 'scale', 'scaleX', 'scaleY', 
    'width', 'height', 'originalWidth', 'originalHeight'
  ];
  
  numericProps.forEach(prop => {
    if (position[prop] !== undefined && typeof position[prop] !== 'number') {
      position[prop] = parseFloat(position[prop]);
    }
  });
  
  // Fill in missing optional properties
  if (position.scale === undefined) {
    position.scale = Math.max(position.scaleX || 1, position.scaleY || 1);
  }
  
  if (position.width === undefined) {
    position.width = position.originalWidth * position.scaleX;
  }
  
  if (position.height === undefined) {
    position.height = position.originalHeight * position.scaleY;
  }
  
  if (position.angle === undefined) {
    position.angle = 0;
  }
  
  return position as ImagePosition;
};
