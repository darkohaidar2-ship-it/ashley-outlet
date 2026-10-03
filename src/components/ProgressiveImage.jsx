import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../utils/imageUrl';
import { useCachedImage } from '../utils/imageLocalCache';
import { ImageOff } from 'lucide-react';

/**
 * ProgressiveImage Component
 * Displays a tiny, lightweight blurred placeholder (~1-2 KB) while the HD/Full HD image
 * loads smoothly in the background, providing an instant visual preview so staff never
 * wait on blank screens. Integrates with Browser Local CacheStorage for 0ms loads.
 */
export default function ProgressiveImage({
  src,
  alt = '',
  preset = 'card',
  className = '',
  containerClassName = '',
  objectFit = 'cover',
  loading = 'lazy',
  onClick,
  fallbackText = 'بێ وێنە'
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const placeholderSrc = getOptimizedImageUrl(src, 'placeholder');
  const { src: cachedTargetSrc, isLoaded: isTargetCached } = useCachedImage(targetSrc);
  const finalSrc = cachedTargetSrc || targetSrc;

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src, preset]);

  // If already loaded from cache, mark loaded immediately
  useEffect(() => {
    if (isTargetCached) {
      setIsLoaded(true);
    }
  }, [isTargetCached]);

  if (!src || hasError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-2 text-center select-none ${containerClassName}`}>
        <ImageOff className="w-5 h-5 mb-1 text-slate-400" />
        <span className="text-[10px] font-semibold text-slate-500">{fallbackText}</span>
      </div>
    );
  }

  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  return (
    <div 
      className={`relative overflow-hidden w-full h-full flex items-center justify-center bg-slate-100/80 ${containerClassName}`}
      onClick={onClick}
    >
      {/* 1. Low-Quality Blurred Placeholder (~1-2 KB, loads almost instantaneously) */}
      {!isLoaded && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full ${fitClass} object-center filter blur-md scale-105 opacity-80 pointer-events-none transition-opacity duration-300`}
        />
      )}

      {/* 2. Target HD Image (Fades in smoothly when loaded) */}
      <img
        src={finalSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full ${fitClass} object-center transition-all duration-500 ease-out ${
          isLoaded 
            ? 'opacity-100 filter-none' 
            : 'opacity-0 filter blur-xs'
        } ${className}`}
      />
    </div>
  );
}
