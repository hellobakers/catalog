"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Product Images
        <span className="text-gray-400 font-normal ml-1">
          ({totalImages}/{maxImages})
        </span>
      </label>

      {(previews.length > 0 || existingImages.length > 0) && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {existingImages.map((url, index) => (
            <div
              key={`existing-${index}`}
              className="group relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
            >
              <Image
                src={url}
                alt={`Existing image ${index + 1}`}
                fill
                className="object-cover"
              />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(index)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                  Primary
                </span>
              )}
            </div>
          ))}
          {previews.map((preview, index) => (
            <div
              key={preview}
              className="group relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
            >
              <Image
                src={preview}
                alt={`New image ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {existingImages.length === 0 && index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {totalImages < maxImages && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <Upload className="mb-2 h-8 w-8 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">
            Click or drag to upload images
          </span>
          <span className="mt-1 text-xs text-gray-500">
            PNG, JPG, WEBP up to 10MB
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}
