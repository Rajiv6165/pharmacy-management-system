"use client";

import React, { useState } from 'react';
import { Pill } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  brand?: string;
}

/**
 * Renders a product image with a styled placeholder fallback.
 * Handles broken/placeholder URLs gracefully. Client component only.
 */
export default function ProductImage({ src, alt, brand }: ProductImageProps) {
  const [errored, setErrored] = useState(false);

  const resolvedSrc = src && src.startsWith('http')
    ? src
    : src
      ? `${process.env.NEXT_PUBLIC_API_URL}${src}`
      : null;

  if (resolvedSrc && !errored) {
    return (
      <div className="relative w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedSrc}
          alt={alt}
          className="object-cover w-full h-full transition-transform duration-300"
          onError={() => setErrored(true)}
        />
        {brand && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-white/80 border border-primary-dark/10 rounded text-[9px] font-mono font-semibold uppercase text-ink/75">
            {brand}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-paper/60 select-none">
      <Pill className="h-10 w-10 text-primary-dark/20" strokeWidth={1.5} />
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/30 text-center px-4 line-clamp-2">
        {alt}
      </span>
      {brand && (
        <span className="text-[9px] font-mono text-accent/60 uppercase tracking-widest">{brand}</span>
      )}
    </div>
  );
}
