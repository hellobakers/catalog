"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, ChevronDown, Check } from "lucide-react";
import { buildCategoryTree, type CategoryWithChildren } from "@/src/lib/categories";
import type { Category } from "@/src/types";
import CategoryBadge from "./CategoryBadge";

interface CategoryFilterProps {
  categories: Category[];
  value: string[];
  onChange: (ids: string[]) => void;
}

function flatten(
  nodes: CategoryWithChildren[],
  depth = 0
): { category: Category; depth: number }[] {
  const out: { category: Category; depth: number }[] = [];
  for (const node of nodes) {
    out.push({ category: node, depth });
    out.push(...flatten(node.children, depth + 1));
  }
  return out;
}

/** Compact multi-category filter with an "active filters" chip row. */
export default function CategoryFilter({
  categories,
  value,
  onChange,
}: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = useMemo(
    () => flatten(buildCategoryTree(categories)),
    [categories]
  );
  const selected = useMemo(
    () => categories.filter((c) => value.includes(c.id)),
    [categories, value]
  );

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = (id: string) =>
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium shadow-sm transition-colors ${
            value.length
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Filter className="h-4 w-4" />
          Category
          {value.length > 0 && (
            <span className="rounded-full bg-blue-600 px-1.5 text-xs text-white">
              {value.length}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute z-30 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-xl">
            <ul className="max-h-72 overflow-y-auto py-1">
              {options.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-gray-400">
                  No categories
                </li>
              )}
              {options.map(({ category, depth }) => {
                const isSelected = value.includes(category.id);
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => toggle(category.id)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                      style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full border"
                        style={{
                          backgroundColor: category.color || "transparent",
                          borderColor: category.color || "#d1d5db",
                        }}
                      />
                      <span className="flex-1 truncate text-gray-700">
                        {category.icon ? `${category.icon} ` : ""}
                        {category.name}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {value.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-2">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selected.map((c) => (
        <CategoryBadge
          key={c.id}
          category={c}
          size="sm"
          onRemove={(id) => onChange(value.filter((v) => v !== id))}
        />
      ))}
    </div>
  );
}
