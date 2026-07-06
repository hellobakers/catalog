// src/app/(protected)/products/[id]/page.tsx
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && params.id) {
      fetchProduct();
    }
  }, [user, params.id]);

  const fetchProduct = async () => {
    if (!user) return;
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
      <div>
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-6" />
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <div className="flex items-center gap-2">
          <WhatsAppButton product={product} firstImage={firstImage} />
          <Link
            href={`/products/${product.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductGallery
          images={
            product.product_images?.length > 0
              ? product.product_images
              : [{ image_url: "/placeholder.svg", is_primary: true }]
          }
          productName={product.name}
        />

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500 font-mono">
              {product.unique_product_id}
            </p>
          </div>

          <div className="space-y-3">
            {(product.location_1 || product.location_2) && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <span>
                  {[product.location_1, product.location_2]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {product.website_url && (
              <div className="flex items-start gap-2 text-sm">
                <Globe className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <a
                  href={product.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {product.website_url}
                </a>
              </div>
            )}
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
              <span>Created {formatDate(product.created_at)}</span>
            </div>
          </div>

          {product.categories && product.categories.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                Categories
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {product.categories.map((c) => (
                  <CategoryBadge
                    key={c.id}
                    category={c}
                    href={`/categories/${c.id}`}
                  />
                ))}
              </div>
            </div>
          )}

          {product.description && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                Description
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone and will remove all associated images.`}
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </div>
  );
}