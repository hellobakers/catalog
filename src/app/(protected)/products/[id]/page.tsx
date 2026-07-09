"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import ProductGallery from "@/src/components/ProductGallery";
import WhatsAppButton from "@/src/components/WhatsAppButton";
import ConfirmDialog from "@/src/components/ConfirmDialog";
import CategoryBadge from "@/src/components/categories/CategoryBadge";
import { ProductDetailSkeleton } from "@/src/components/LoadingSkeleton";
import { useAuth } from "@/src/context/AuthContext";
import { getProduct, deleteProduct } from "@/src/lib/products";
import { supabase } from "@/src/lib/supabaseClient";
import { formatDate } from "@/src/utils/helpers";
import type { Product } from "@/src/types";
import { motion } from "framer-motion";
import { FadeIn, ScaleIn } from "@/src/components/Motion";
import { cn } from "@/src/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;

    const loadProduct = async () => {
      setLoading(true);
      try {
        const data = await getProduct(params.id as string, user.id);
        setProduct(data);
      } catch {
        toast.error("Product not found or you do not have access");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [user, params.id, router]);

  const handleDelete = async () => {
    if (!product || !user) return;
    setDeleting(true);
    try {
      const images = product.product_images || [];
      for (const img of images) {
        const fileName = img.image_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("product-images").remove([fileName]);
        }
      }

      await deleteProduct(product.id, user.id);
      toast.success("Product deleted successfully");
      router.push("/products");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete product"
      );
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const primaryImage = product.product_images?.find(
    (img) => img.is_primary
  )?.image_url;
  const firstImage =
    primaryImage || product.product_images?.[0]?.image_url || null;

  return (
    <div className="space-y-8 pb-12">
      <FadeIn direction="down" className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/products"
          className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-transform group-hover:-translate-x-1">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Back to Inventory
        </Link>
        <div className="flex items-center gap-3">
          <WhatsAppButton product={product} firstImage={firstImage} />
          <Link
            href={`/products/${product.id}/edit`}
            className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-5 py-2.5 text-sm font-bold text-secondary-foreground transition-all hover:bg-secondary/80"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-destructive/10 px-5 py-2.5 text-sm font-bold text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <ScaleIn className="overflow-hidden rounded-[2.5rem] border bg-card p-4 shadow-2xl shadow-primary/5">
          <ProductGallery
            images={
              product.product_images?.length > 0
                ? product.product_images
                : [{ image_url: "/placeholder.svg", is_primary: true }]
            }
            productName={product.name}
          />
        </ScaleIn>

        <div className="flex flex-col space-y-8 py-4">
          <FadeIn delay={0.1} direction="none" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Product Details</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground lg:text-5xl">
                {product.name}
              </h1>
              <div className="inline-flex rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                ID: {product.unique_product_id}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 rounded-3xl border bg-muted/30 p-6">
              {(product.location_1 || product.location_2) && (
                <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Location</span>
                    <span>{[product.location_1, product.location_2].filter(Boolean).join(", ")}</span>
                  </div>
                </div>
              )}
              {product.website_url && (
                <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">External Link</span>
                    <a
                      href={product.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Visit Site <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Added On</span>
                  <span>{formatDate(product.created_at)}</span>
                </div>
              </div>
            </div>
          </FadeIn>

          {product.categories && product.categories.length > 0 && (
            <FadeIn delay={0.2} direction="none" className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Assigned Categories</h2>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((c) => (
                  <CategoryBadge
                    key={c.id}
                    category={c}
                    href={`/categories/${c.id}`}
                    size="lg"
                  />
                ))}
              </div>
            </FadeIn>
          )}

          {product.description && (
            <FadeIn delay={0.3} direction="none" className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Product Narrative</h2>
              <div className="rounded-[2rem] border bg-card p-8 shadow-sm">
                <p className="text-base leading-relaxed text-muted-foreground/90 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone and will remove all associated images.`}
        confirmLabel="Delete Permanently"
        isLoading={deleting}
      />
    </div>
  );
}
