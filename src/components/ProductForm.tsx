"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, FolderTree, Info } from "lucide-react";
import ImageUpload from "./ImageUpload";
import CategorySelect from "./categories/CategorySelect";
import { productSchema, type ProductFormData } from "@/src/lib/validations";
import { generateProductId } from "@/src/utils/helpers";
import { getCategories } from "@/src/lib/categories";
import type { Category } from "@/src/types";

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting: boolean;
  defaultValues?: Partial<ProductFormData>;
  existingImages?: string[];
  onRemoveExistingImage?: (index: number) => void;
  submitLabel?: string;
}

export default function ProductForm({
  onSubmit,
  isSubmitting,
  defaultValues,
  existingImages = [],
  onRemoveExistingImage,
  submitLabel = "Save Product",
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      unique_product_id: defaultValues?.unique_product_id || generateProductId(),
      description: "",
      location_1: "",
      location_2: "",
      website_url: "",
      images: [],
      ...defaultValues,
    },
  });

  const images = watch("images");
  const categoryIds = watch("category_ids") || [];

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        /* non-fatal: form still works without category options */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Unique Product ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("unique_product_id")}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Auto-generated if empty"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to auto-generate (PROD-{Date.now()}-XXXXXX)
            </p>
            {errors.unique_product_id && (
              <p className="mt-1 text-sm text-red-500">
                {errors.unique_product_id.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Images
        </h2>
        <ImageUpload
          images={images || []}
          onChange={(newImages) => setValue("images", newImages)}
          existingImages={existingImages}
          onRemoveExisting={onRemoveExistingImage}
          error={errors.images?.message}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FolderTree className="h-5 w-5 text-blue-600" />
            Categories
          </h2>
          <Link
            href="/categories"
            target="_blank"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Manage
          </Link>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Assign this product to one or more categories to organize your catalog.
        </p>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/60 px-4 py-8 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <FolderTree className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              No categories yet
            </p>
            <Link
              href="/categories"
              target="_blank"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create your first category
            </Link>
          </div>
        ) : (
          <>
            <CategorySelect
              categories={categories}
              value={categoryIds}
              onChange={(ids) => setValue("category_ids", ids)}
            />
            <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              Choosing a sub-category automatically includes its parent
              categories too.
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Additional Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
              placeholder="Enter product description"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Location 1
              </label>
              <input
                type="text"
                {...register("location_1")}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g., Warehouse A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Location 2
              </label>
              <input
                type="text"
                {...register("location_2")}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g., Shelf 42"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Website URL
            </label>
            <input
              type="url"
              {...register("website_url")}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="https://example.com/product"
            />
            {errors.website_url && (
              <p className="mt-1 text-sm text-red-500">
                {errors.website_url.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-blue-200"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
