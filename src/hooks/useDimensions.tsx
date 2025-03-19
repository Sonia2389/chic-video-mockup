
import { useState, useEffect } from "react";

export function useDimensions() {
  const [containerDimensions, setContainerDimensions] = useState<{width: number, height: number} | null>(null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [lastEditDimensions, setLastEditDimensions] = useState<{width: number, height: number} | null>(null);

  // Export container dimensions for rendering engine
  useEffect(() => {
    // This ensures Index.tsx can access containerDimensions when needed
    if (window && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('containerDimensionsChange', { 
        detail: containerDimensions 
      }));
      
      // Log dimensions to help with debugging
      console.log("Container dimensions changed:", containerDimensions);
    }
  }, [containerDimensions]);

  return {
    containerDimensions,
    setContainerDimensions,
    originalImageDimensions,
    setOriginalImageDimensions,
    lastEditDimensions,
    setLastEditDimensions
  };
}
