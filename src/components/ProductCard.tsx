"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Eye, ExternalLink } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";
import CategoryBadge from "./categories/CategoryBadge";
import type { Product } from "@/src/types";
import { truncateText } from "@/src/utils/helpers";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5"
    >
      <Link href={`/products/${product.id}`} className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={firstImage || placeholder}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        <div className="absolute top-3 right-3 flex gap-2">
          <div className="rounded-full bg-background/80 p-2 text-foreground backdrop-blur-md transition-transform hover:scale-110">
            <ExternalLink className="h-4 w-4" />
          </div>
        </div>

        {!firstImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">No image available</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="space-y-1">
            <Link href={`/products/${product.id}`}>
              <h3 className="font-bold leading-tight text-foreground transition-colors hover:text-primary">
                {truncateText(product.name, 50)}
              </h3>
            </Link>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              ID: {product.unique_product_id}
            </p>
          </div>
        </div>

        {shownCategories.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {shownCategories.map((c) => (
              <CategoryBadge
                key={c.id}
                category={c}
                size="sm"
                href={`/products?categories=${c.id}`}
              />
            ))}
            {extraCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                +{extraCount}
              </span>
            )}
          </div>
        )}

        <div className="mb-5 space-y-2">
          {(product.location_1 || product.location_2) && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {[product.location_1, product.location_2]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground/80 line-clamp-2">
              {truncateText(product.description, 100)}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2">
          <Link
            href={`/products/${product.id}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground transition-all hover:bg-secondary/80"
          >
            <Eye className="h-4 w-4" />
            Details
          </Link>
          <WhatsAppButton
            product={product}
            firstImage={firstImage}
          />
        </div>
      </div>
    </motion.div>
  );
}
