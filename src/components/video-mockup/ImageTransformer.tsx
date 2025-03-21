"use client"

import type React from "react"
import { useState } from "react"

interface ImageTransformerProps {
  imageSrc: string
}

const ImageTransformer: React.FC<ImageTransformerProps> = ({ imageSrc }) => {
  const [scale, setScale] = useState(1)
  const [xOffset, setXOffset] = useState(0)
  const [yOffset, setYOffset] = useState(0)

  const handleScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScale(Number.parseFloat(event.target.value))
  }

  const handleXOffsetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setXOffset(Number.parseFloat(event.target.value))
  }

  const handleYOffsetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYOffset(Number.parseFloat(event.target.value))
  }

  return (
    <div>
      <img
        src={imageSrc || "/placeholder.svg"}
        alt="Uploaded"
        style={{
          transform: `scale(${scale}) translate(${xOffset}px, ${yOffset}px)`,
          transformOrigin: "center",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      />
      <div>
        <label>Scale:</label>
        <input type="range" min="0.1" max="2" step="0.01" value={scale} onChange={handleScaleChange} />
      </div>
      <div>
        <label>X Offset:</label>
        <input type="number" step="1" value={xOffset} onChange={handleXOffsetChange} />
      </div>
      <div>
        <label>Y Offset:</label>
        <input type="number" step="1" value={yOffset} onChange={handleYOffsetChange} />
      </div>
    </div>
  )
}

export default ImageTransformer

