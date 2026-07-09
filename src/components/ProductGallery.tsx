"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface ProductGalleryProps {
  images: { image_url: string; is_primary: boolean }[];
  productName: string;
}

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-[2rem] bg-muted flex items-center justify-center">
        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground/40">No Visuals Available</span>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="space-y-4">
        <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-muted group shadow-inner">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="relative h-full w-full"
            >
              <Image
                src={currentImage.image_url}
                alt={`${productName} - Image ${currentIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          {images.length > 1 && (
            <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between opacity-0 transition-all group-hover:opacity-100">
              <button
                onClick={goToPrevious}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/80 text-foreground shadow-xl backdrop-blur-md transition-all hover:bg-background active:scale-90"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goToNext}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/80 text-foreground shadow-xl backdrop-blur-md transition-all hover:bg-background active:scale-90"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}

          <button
            onClick={() => setShowFullscreen(true)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-background/80 text-foreground shadow-xl backdrop-blur-md opacity-0 transition-all group-hover:opacity-100 hover:bg-background active:scale-90"
          >
            <Expand className="h-5 w-5" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-background/40 px-3 py-1.5 backdrop-blur-md">
            {images.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 transition-all rounded-full",
                  i === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-background/60"
                )} 
              />
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden transition-all duration-300",
                  index === currentIndex
                    ? "ring-4 ring-primary ring-offset-4 ring-offset-background scale-95"
                    : "opacity-40 hover:opacity-100 hover:scale-105"
                )}
              >
                <Image
                  src={image.image_url}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-2xl p-4 md:p-12"
            onClick={() => setShowFullscreen(false)}
          >
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground transition-all hover:bg-destructive hover:text-destructive-foreground active:scale-90"
            >
              <X className="h-6 w-6" />
            </button>
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative h-full w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={currentImage.image_url}
                alt={`${productName} - Fullscreen`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </motion.div>

            {images.length > 1 && (
              <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground shadow-2xl transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground shadow-2xl transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
