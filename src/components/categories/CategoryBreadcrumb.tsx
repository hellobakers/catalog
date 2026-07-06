"use client";

import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";
import type { Category } from "@/src/types";

interface CategoryBreadcrumbProps {
  /** Root-to-leaf chain of categories (leaf is the current page). */
  trail: Pick<Category, "id" | "name">[];
}

/**
 * Home > Parent > Child > Current. The last item is rendered as plain text.
 * On small screens the middle of long trails collapses to an ellipsis.
 */
export default function CategoryBreadcrumb({ trail }: CategoryBreadcrumbProps) {
  const collapse = trail.length > 3;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <li className="flex items-center gap-1">
          <Link
            href="/categories"
            className="flex items-center gap-1 hover:text-gray-900 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Categories</span>
          </Link>
        </li>

        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          const isMiddle = index > 0 && index < trail.length - 1;
          // Collapse everything but first and last on mobile.
          const hideOnMobile = collapse && isMiddle;

          return (
            <li
              key={item.id}
              className={`flex items-center gap-1 ${
                hideOnMobile ? "hidden sm:flex" : "flex"
              }`}
            >
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
              {isLast ? (
                <span className="font-medium text-gray-900">{item.name}</span>
              ) : (
                <Link
                  href={`/categories/${item.id}`}
                  className="hover:text-gray-900 transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}

        {collapse && (
          <li className="flex items-center gap-1 sm:hidden">
            <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            <span className="text-gray-400">…</span>
          </li>
        )}
      </ol>
    </nav>
  );
}
