"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ImageTransformerProps {
  imageSrc: string;
}

const ImageTransformer: React.FC<ImageTransformerProps> = ({ imageSrc }) => {
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(150);
  const [isResizing, setIsResizing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    setIsResizing(true);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isResizing) return;

    const newWidth = e.clientX - imgRef.current!.offsetLeft;
    const newHeight = e.clientY - imgRef.current!.offsetTop;

    setWidth(newWidth > 0 ? newWidth : 0);
    setHeight(newHeight > 0 ? newHeight : 0);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={imageSrc || "/placeholder.svg?height=150&width=200"}
        alt="Uploaded"
        ref={imgRef}
        style={{
          width: width,
          height: height,
          maxWidth: 'none',
          maxHeight: 'none',
          objectFit: 'fill',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
};

export default ImageTransformer;
