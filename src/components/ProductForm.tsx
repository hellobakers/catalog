"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, FolderTree, Info, Sparkles, Image as ImageIcon, MapPin, Globe } from "lucide-react";
import ImageUpload from "./ImageUpload";
import CategorySelect from "./categories/CategorySelect";
import { productSchema, type ProductFormData } from "@/src/lib/validations";
import { generateProductId } from "@/src/utils/helpers";
import { getCategories } from "@/src/lib/categories";
import type { Category } from "@/src/types";
import { motion } from "framer-motion";
import { FadeIn } from "./Motion";
import { cn } from "@/src/lib/utils";

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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <FadeIn delay={0.1} className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-foreground">
            Basic Information
          </h2>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Product Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                className={cn(
                  "block w-full rounded-2xl border bg-background px-4 py-3 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
                  errors.name ? "border-destructive ring-destructive/10" : "border-border"
                )}
                placeholder="e.g., Premium Leather Jacket"
              />
              {errors.name && (
                <p className="text-xs font-bold text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Unique Product ID <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                {...register("unique_product_id")}
                className={cn(
                  "block w-full rounded-2xl border bg-background px-4 py-3 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
                  errors.unique_product_id ? "border-destructive ring-destructive/10" : "border-border"
                )}
                placeholder="PRO-XXXXXX"
              />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Auto-generated if left empty
              </p>
              {errors.unique_product_id && (
                <p className="text-xs font-bold text-destructive">
                  {errors.unique_product_id.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.15} className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-foreground">
            Visual Assets
          </h2>
        </div>
        <div className="p-6">
          <ImageUpload
            images={images || []}
            onChange={(newImages) => setValue("images", newImages)}
            existingImages={existingImages}
            onRemoveExisting={onRemoveExistingImage}
            error={errors.images?.message}
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.2} className="rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderTree className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-foreground">
              Categories
            </h2>
          </div>
          <Link
            href="/categories"
            target="_blank"
            className="group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary hover:opacity-80"
          >
            <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
            Manage Taxonomy
          </Link>
        </div>
        <div className="p-6">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/20 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-inner">
                <FolderTree className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-bold text-foreground">No categories defined</p>
              <Link
                href="/categories"
                target="_blank"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Create First Category
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <CategorySelect
                categories={categories}
                value={categoryIds}
                onChange={(ids) => setValue("category_ids", ids)}
              />
              <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs font-medium leading-relaxed text-primary/80">
                  Selecting a sub-category automatically maps the product to all its parent categories for better discoverability.
                </p>
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.25} className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-foreground">
            Logistics & Details
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              Product Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="block w-full rounded-2xl border bg-background px-4 py-3 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none"
              placeholder="Tell us more about this product..."
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Primary Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  {...register("location_1")}
                  className="block w-full rounded-2xl border bg-background pl-11 pr-4 py-3 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                  placeholder="e.g., Warehouse Alpha"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">
                Secondary Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  {...register("location_2")}
                  className="block w-full rounded-2xl border bg-background pl-11 pr-4 py-3 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                  placeholder="e.g., Shelf B-12"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              External Website
            </label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="url"
                {...register("website_url")}
                className={cn(
                  "block w-full rounded-2xl border bg-background pl-11 pr-4 py-3 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
                  errors.website_url ? "border-destructive ring-destructive/10" : "border-border"
                )}
                placeholder="https://your-store.com/product"
              />
            </div>
            {errors.website_url && (
              <p className="text-xs font-bold text-destructive">
                {errors.website_url.message}
              </p>
            )}
          </div>
        </div>
      </FadeIn>

      <div className="flex justify-end pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-primary px-10 py-4 text-sm font-black text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              {submitLabel}
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
