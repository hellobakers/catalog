"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Sparkles } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  existingImages?: string[];
  onRemoveExisting?: (index: number) => void;
  error?: string;
  maxImages?: number;
}

export default function ImageUpload({
  images,
  onChange,
  existingImages = [],
  onRemoveExisting,
  error,
  maxImages = 10,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>(() =>
    images.map((file) => URL.createObjectURL(file))
  );
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalImages = images.length + existingImages.length;

  const handleFileChange = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remaining = maxImages - totalImages;
      const filesToAdd = Array.from(files).slice(0, remaining);

      if (filesToAdd.length === 0) return;

      const newImages = [...images, ...filesToAdd];
      onChange(newImages);

      const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    },
    [images, onChange, maxImages, totalImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileChange(e.dataTransfer.files);
    },
    [handleFileChange]
  );

  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);

      URL.revokeObjectURL(previews[index]);
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [images, onChange, previews]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-foreground">
          Gallery Assets
        </label>
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest",
          totalImages >= maxImages ? "text-destructive" : "text-muted-foreground"
        )}>
          {totalImages} / {maxImages} Images
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {existingImages.map((url, index) => (
            <motion.div
              key={`existing-${url}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative aspect-square overflow-hidden rounded-2xl border bg-muted shadow-sm"
            >
              <Image
                src={url}
                alt={`Existing image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(index)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl bg-destructive text-destructive-foreground opacity-0 transition-all hover:scale-110 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-primary/90 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-primary-foreground backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" />
                  Primary
                </div>
              )}
            </motion.div>
          ))}
          
          {previews.map((preview, index) => (
            <motion.div
              key={preview}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative aspect-square overflow-hidden rounded-2xl border bg-muted shadow-sm"
            >
              <Image
                src={preview}
                alt={`New image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl bg-destructive text-destructive-foreground opacity-0 transition-all hover:scale-110 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
              {existingImages.length === 0 && index === 0 && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-primary/90 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-primary-foreground backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" />
                  Primary
                </div>
              )}
            </motion.div>
          ))}

          {totalImages < maxImages && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all",
                dragOver
                  ? "border-primary bg-primary/5 scale-[0.98]"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm mb-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Upload</span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-bold text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
