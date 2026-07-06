"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { Category } from "@/src/types";

const DEFAULT_COLOR = "#3b82f6";

/** Choose readable text color (black/white) for a given hex background. */
function contrastText(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Perceived luminance (YIQ).
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? "#111827" : "#ffffff";
}

interface CategoryBadgeProps {
  category: Pick<Category, "id" | "name" | "color" | "icon">;
  /** Render as a link to the category's product filter. */
  href?: string;
  /** Show a remove button (for multi-select chips). */
  onRemove?: (id: string) => void;
  /** Tooltip text, e.g. full hierarchy path. */
  title?: string;
  size?: "sm" | "md";
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
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  const inner = (
    <span
      className={`inline-flex max-w-[12rem] items-center gap-1 rounded-full font-medium ${pad}`}
      style={{ backgroundColor: color, color: text }}
      title={title || category.name}
    >
      {category.icon && <span className="shrink-0">{category.icon}</span>}
      <span className="truncate">{category.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(category.id);
          }}
          className="ml-0.5 shrink-0 rounded-full transition-opacity hover:opacity-70"
          aria-label={`Remove ${category.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="transition-transform hover:scale-105">
        {inner}
      </Link>
    );
  }

  return inner;
}
