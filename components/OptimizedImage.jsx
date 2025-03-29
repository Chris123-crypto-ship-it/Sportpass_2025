import { useState } from 'react'
import Image from 'next/image'

export default function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  className = '' 
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  
  // Fallback-Bild bei Ladefehler
  const imgSrc = error ? '/placeholder.png' : src
  
  return (
    <div className={`image-container ${className}`}>
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        quality={80}
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {!loaded && !error && (
        <div className="placeholder-shimmer"></div>
      )}
    </div>
  )
} 