import React, { useState, useRef, useEffect } from 'react'
import { sanitizeImageUrl } from '../utils/sanitize'

const OptimizedImage = ({
  src,
  alt = '',
  width,
  height,
  className = '',
  lazy = true,
  webp = true,
  placeholder = true,
  sizes = '100vw',
  quality = 80,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(!lazy)
  const [error, setError] = useState(false)
  const imgRef = useRef(null)
  const observerRef = useRef(null)

  // Sanitize the image URL
  const sanitizedSrc = sanitizeImageUrl(src)

  useEffect(() => {
    if (!lazy || !imgRef.current) return

    // Intersection Observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    )

    observerRef.current.observe(imgRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [lazy])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setError(true)
    setIsLoaded(true)
  }

  // Generate WebP source if supported
  const generateWebPSrc = (originalSrc) => {
    if (!webp || !originalSrc) return null
    
    // For Supabase storage URLs, we can add transformation parameters
    if (originalSrc.includes('supabase.co/storage')) {
      const url = new URL(originalSrc)
      url.searchParams.set('format', 'webp')
      if (quality) url.searchParams.set('quality', quality.toString())
      if (width) url.searchParams.set('width', width.toString())
      if (height) url.searchParams.set('height', height.toString())
      return url.toString()
    }
    
    return null
  }

  // Generate responsive image sources
  const generateSrcSet = (originalSrc) => {
    if (!originalSrc || !originalSrc.includes('supabase.co/storage')) {
      return undefined
    }

    const breakpoints = [480, 768, 1024, 1280, 1920]
    const srcSet = breakpoints.map(bp => {
      const url = new URL(originalSrc)
      url.searchParams.set('width', bp.toString())
      if (quality) url.searchParams.set('quality', quality.toString())
      return `${url.toString()} ${bp}w`
    }).join(', ')

    return srcSet
  }

  if (!sanitizedSrc) {
    return (
      <div 
        className={`bg-neutral-800 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-neutral-500 text-sm">Invalid image</span>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className={`bg-neutral-800 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-neutral-500 text-sm">Failed to load image</span>
      </div>
    )
  }

  const webpSrc = generateWebPSrc(sanitizedSrc)
  const srcSet = generateSrcSet(sanitizedSrc)

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {placeholder && !isLoaded && (
        <div 
          className="absolute inset-0 bg-neutral-800 animate-pulse flex items-center justify-center"
        >
          <div className="w-8 h-8 text-neutral-600">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <picture>
          {webpSrc && (
            <source 
              srcSet={webpSrc} 
              type="image/webp"
              sizes={sizes}
            />
          )}
          <img
            src={sanitizedSrc}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`
              transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
              ${className}
            `}
            {...props}
          />
        </picture>
      )}
    </div>
  )
}

export default OptimizedImage

// Utility component for blog post images
export const BlogImage = ({ src, alt, caption, ...props }) => (
  <figure className="my-6">
    <OptimizedImage
      src={src}
      alt={alt}
      className="w-full h-auto rounded-lg"
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
      {...props}
    />
    {caption && (
      <figcaption className="text-sm text-neutral-400 text-center mt-2">
        {caption}
      </figcaption>
    )}
  </figure>
)

// Utility component for project images
export const ProjectImage = ({ src, alt, ...props }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    className="w-full h-48 object-cover rounded-lg"
    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
    {...props}
  />
)
