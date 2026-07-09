"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { Category } from "@/src/types";
import { cn } from "@/src/lib/utils";

const DEFAULT_COLOR = "#3b82f6";

function contrastText(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? "#111827" : "#ffffff";
}

interface CategoryBadgeProps {
  category: Pick<Category, "id" | "name" | "color" | "icon">;
  href?: string;
  onRemove?: (id: string) => void;
  title?: string;
  size?: "sm" | "md" | "lg";
}

export default function CategoryBadge({
  category,
  href,
  onRemove,
  title,
  size = "md",
}: CategoryBadgeProps) {
  const color = category.color || DEFAULT_COLOR;
  const text = contrastText(color);
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
    md: "px-3 py-1 text-xs font-bold",
    lg: "px-4 py-2 text-sm font-bold",
  };

  const inner = (
    <span
      className={cn(
        "inline-flex max-w-[15rem] items-center gap-1.5 rounded-full shadow-sm transition-all",
        sizeClasses[size]
      )}
      style={{ backgroundColor: color, color: text }}
      title={title || category.name}
    >
      {category.icon && <span className="shrink-0 scale-110">{category.icon}</span>}
      <span className="truncate">{category.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(category.id);
          }}
          className="ml-1 shrink-0 rounded-full transition-opacity hover:opacity-70"
          aria-label={`Remove ${category.name}`}
        >
          <X className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5")} />
        </button>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="transition-all hover:scale-105 active:scale-95">
        {inner}
      </Link>
    );
  }

  return inner;
}
