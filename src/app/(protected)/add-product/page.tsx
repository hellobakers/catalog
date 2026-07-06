"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProductForm from "@/src/components/ProductForm";
import { useAuth } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabaseClient";
import { createProduct } from "@/src/lib/products";
import { compressImage } from "@/src/utils/helpers";
import type { ProductFormData } from "@/src/lib/validations";

export default function AddProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: ProductFormData) => {
    if (!user) {
      toast.error("You must be logged in to add products");
      return;
    }

    setIsSubmitting(true);
    try {
      let uniqueProductId = data.unique_product_id;
      if (!uniqueProductId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        uniqueProductId = `PROD-${timestamp}-${random}`;
      }

      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("unique_product_id", uniqueProductId)
        .maybeSingle();

      if (existing) {
        toast.error("Product ID already exists. Please use a different ID.");
        setIsSubmitting(false);
        return;
      }

      const compressedImages = await Promise.all(
        (data.images || []).map((file) => compressImage(file))
      );

      const productData = await createProduct(
        {
          name: data.name,
          unique_product_id: uniqueProductId,
          description: data.description || null,
          location_1: data.location_1 || null,
          location_2: data.location_2 || null,
          website_url: data.website_url || null,
          category_ids: data.category_ids || [],
        },
        user.id
      );

      if (compressedImages.length > 0) {
        const imageUrls = await Promise.all(
          compressedImages.map((file) =>
            uploadImageToStorage(file, productData.id)
          )
        );

        const imageRecords = imageUrls.map((url, index) => ({
          product_id: productData.id,
          image_url: url,
          is_primary: index === 0,
        }));

        const { error: imageError } = await supabase
          .from("product_images")
          .insert(imageRecords);

        if (imageError) {
          await supabase.from("products").delete().eq("id", productData.id);
          throw new Error(`Failed to save images: ${imageError.message}`);
        }
      }

      toast.success("Product added successfully!");
      router.push("/products");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add product"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the details below to add a new product to your catalog.
        </p>
      </div>
      <ProductForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
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
