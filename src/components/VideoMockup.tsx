Image.fromURL(imageUrl, (img) => {
  if (!img) return;

  // Store original dimensions if not already stored
  if (!originalImageDimensions) {
    setOriginalImageDimensions({
      width: img.width!,
      height: img.height!
    });
  }

  if (savedPosition) {
    // Apply saved transformations
    img.set({
      left: savedPosition.left,
      top: savedPosition.top,
      scaleX: savedPosition.scaleX,
      scaleY: savedPosition.scaleY,
      angle: savedPosition.angle || 0,
      width: savedPosition.originalWidth,
      height: savedPosition.originalHeight,
      cornerSize: 12,
      cornerColor: '#9b87f5',
      borderColor: '#9b87f5',
      cornerStyle: 'circle',
      transparentCorners: false,
      originX: 'left',
      originY: 'top',
      selectable: true,
      hasControls: true,
      hasBorders: true
    });
  } else {
    // Center the image initially with appropriate scaling
    const baseScale = Math.min(
      (containerDimensions.width * 0.8) / img.width!,
      (containerDimensions.height * 0.8) / img.height!
    );

    img.set({
      left: containerDimensions.width / 2 - (img.width! * baseScale) / 2,
      top: containerDimensions.height / 2 - (img.height! * baseScale) / 2,
      scaleX: baseScale,
      scaleY: baseScale,
      cornerSize: 12,
      cornerColor: '#9b87f5',
      borderColor: '#9b87f5',
      cornerStyle: 'circle',
      transparentCorners: false,
      originX: 'left',
      originY: 'top',
      selectable: true,
      hasControls: true,
      hasBorders: true
    });
  }

  canvas.add(img);
  canvas.setActiveObject(img);

  // Enable free movement and scaling
  canvas.on('object:scaling', function () {
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      const bounds = activeObj.getBoundingRect();
      console.log("Object dimensions during scaling:", {
        width: bounds.width,
        height: bounds.height,
        top: bounds.top,
        left: bounds.left
      });
    }
  });

  canvas.on('object:moving', function (e) {
    const obj = e.target;
    if (obj) {
      obj.setCoords();
    }
  });

  canvas.renderAll();
}, { crossOrigin: 'anonymous' });
