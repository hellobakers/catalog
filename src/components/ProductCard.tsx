"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Eye } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";
import CategoryBadge from "./categories/CategoryBadge";
import type { Product } from "@/src/types";
import { truncateText } from "@/src/utils/helpers";

const MAX_BADGES = 3;

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.product_images?.find(
    (img) => img.is_primary
  )?.image_url;
  const firstImage = primaryImage || product.product_images?.[0]?.image_url;
  const placeholder = "/placeholder.svg";

  const categories = product.categories || [];
  const shownCategories = categories.slice(0, MAX_BADGES);
  const extraCount = categories.length - shownCategories.length;

  return (
    <div className="group rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-gray-100">
          <Image
            src={firstImage || placeholder}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {!firstImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-gray-400">No image</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {truncateText(product.name, 50)}
          </h3>
        </Link>
        <p className="mt-0.5 text-xs text-gray-500 font-mono">
          {product.unique_product_id}
        </p>

        {shownCategories.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {shownCategories.map((c) => (
              <CategoryBadge
                key={c.id}
                category={c}
                size="sm"
                href={`/products?categories=${c.id}`}
              />
            ))}
            {extraCount > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        <div className="mt-3 space-y-1">
          {(product.location_1 || product.location_2) && (
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              {[product.location_1, product.location_2]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {truncateText(product.description, 100)}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/products/${product.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Link>
          <WhatsAppButton
            product={product}
            firstImage={firstImage}
          />
        </div>
      </div>
    </div>
  );
}
