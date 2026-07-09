"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import ProductForm from "@/src/components/ProductForm";
import { ProductDetailSkeleton } from "@/src/components/LoadingSkeleton";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabaseClient";
import { getProduct, updateProduct } from "@/src/lib/products";
import { compressImage } from "@/src/utils/helpers";
import type { Product } from "@/src/types";
import type { ProductFormData } from "@/src/lib/validations";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !params.id) return;

    const loadProduct = async () => {
      try {
        const data = await getProduct(params.id as string, user.id);
        setProduct(data);
        setExistingImages(
          (data.product_images || []).map(
            (img: { image_url: string }) => img.image_url
          )
        );
      } catch {
        toast.error("Product not found or you do not have access");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [user, params.id, router]);

  const onSubmit = async (formData: ProductFormData) => {
    if (!product || !user) return;
    setIsSubmitting(true);
    try {
      const uniqueProductId =
        formData.unique_product_id || product.unique_product_id;

      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("unique_product_id", uniqueProductId)
        .neq("id", product.id)
        .maybeSingle();

      if (existing) {
        toast.error("Product ID already exists. Please use a different ID.");
        setIsSubmitting(false);
        return;
      }

      await updateProduct(
        product.id,
        {
          name: formData.name,
          unique_product_id: uniqueProductId,
          description: formData.description || null,
          location_1: formData.location_1 || null,
          location_2: formData.location_2 || null,
          website_url: formData.website_url || null,
          category_ids: formData.category_ids || [],
          updated_at: new Date().toISOString(),
        },
        user.id
      );

      if (formData.images && formData.images.length > 0) {
        const compressedImages = await Promise.all(
          formData.images.map((file) => compressImage(file))
        );

        const imageUrls = await Promise.all(
          compressedImages.map((file) => uploadImageToStorage(file, product.id))
        );

        const existingCount = existingImages.length;
        const imageRecords = imageUrls.map((url, index) => ({
          product_id: product.id,
          image_url: url,
          is_primary: existingCount === 0 && index === 0,
        }));

        const { error: imageError } = await supabase
          .from("product_images")
          .insert(imageRecords);

        if (imageError) throw imageError;
      }

      toast.success("Product updated successfully!");
      router.push(`/products/${product.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveExistingImage = async (index: number) => {
    const urlToRemove = existingImages[index];
    const imageToDelete = product?.product_images?.find(
      (img) => img.image_url === urlToRemove
    );

    if (imageToDelete) {
      const fileName = urlToRemove.split("/").pop();
      if (fileName) {
        await supabase.storage.from("product-images").remove([fileName]);
      }
      await supabase
        .from("product_images")
        .delete()
        .eq("id", imageToDelete.id);

      setExistingImages((prev) => prev.filter((_, i) => i !== index));
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

  if (!product) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/products/${product.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update the details for {product.name}
          </p>
        </div>
      </div>
      <ProductForm
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        defaultValues={{
          name: product.name,
          unique_product_id: product.unique_product_id,
          description: product.description || "",
          location_1: product.location_1 || "",
          location_2: product.location_2 || "",
          website_url: product.website_url || "",
          category_ids: (product.categories || []).map((c) => c.id),
        }}
        existingImages={existingImages}
        onRemoveExistingImage={handleRemoveExistingImage}
        submitLabel="Update Product"
      />
    </div>
  );
}

async function uploadImageToStorage(
  file: File,
  productId: string
): Promise<string> {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${productId}/${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(fileName);

  return publicUrl;
}
