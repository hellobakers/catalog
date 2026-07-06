"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check, X, Lock, Folder, Tag } from "lucide-react";
import {
  buildCategoryTree,
  getAncestorIds,
  type CategoryWithChildren,
} from "@/src/lib/categories";
import type { Category } from "@/src/types";
import CategoryBadge from "./CategoryBadge";

interface CategorySelectProps {
  categories: Category[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  /** Allow selecting more than one category. */
  multiple?: boolean;
}

interface FlatOption {
  category: Category;
  depth: number;
  path: string;
  /** Path of the parent chain only (excludes this node's own name). */
  parentPath: string;
  hasChildren: boolean;
}

/** Depth-first flatten of the tree, carrying indentation depth + full path. */
function flattenTree(
  nodes: CategoryWithChildren[],
  depth = 0,
  parentPath = ""
): FlatOption[] {
  const out: FlatOption[] = [];
  for (const node of nodes) {
    const path = parentPath ? `${parentPath} > ${node.name}` : node.name;
    out.push({
      category: node,
      depth,
      path,
      parentPath,
      hasChildren: node.children.length > 0,
    });
    if (node.children.length) {
      out.push(...flattenTree(node.children, depth + 1, path));
    }
  }
  return out;
}

/**
 * Searchable dropdown for assigning categories.
 *
 * Selecting a sub-category automatically selects its parent chain — a product
 * in "Phones" is also in "Electronics". Those auto-included parents are shown
 * as locked; they can't be removed until their sub-categories are cleared.
 */
export default function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = "Select categories...",
  multiple = true,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const options = useMemo(
    () => flattenTree(buildCategoryTree(categories)),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.path.toLowerCase().includes(q));
  }, [options, query]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const byId = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Direct-children lookup, so we can tell when a parent is "implied" by a
  // currently-selected descendant.
  const childrenOf = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of categories) {
      if (!c.parent_id) continue;
      const arr = map.get(c.parent_id) || [];
      arr.push(c.id);
      map.set(c.parent_id, arr);
    }
    return map;
  }, [categories]);

  // A category is "implied" (auto-included) when any of its descendants is
  // selected — it must stay until those sub-categories are removed.
  const isImplied = useMemo(() => {
    const cache = new Map<string, boolean>();
    const check = (id: string): boolean => {
      if (cache.has(id)) return cache.get(id)!;
      cache.set(id, false); // guard against cycles
      let result = false;
      for (const childId of childrenOf.get(id) || []) {
        if (selectedSet.has(childId) || check(childId)) {
          result = true;
          break;
        }
      }
      cache.set(id, result);
      return result;
    };
    return check;
  }, [childrenOf, selectedSet]);

  const selected = useMemo(
    () => categories.filter((c) => selectedSet.has(c.id)),
    [categories, selectedSet]
  );

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const addWithAncestors = (id: string) => {
    const next = new Set(multiple ? value : []);
    next.add(id);
    for (const ancestorId of getAncestorIds(id, categories)) {
      next.add(ancestorId);
    }
    onChange(Array.from(next));
  };

  const remove = (id: string) => {
    // Don't allow removing a parent that still has selected sub-categories.
    if (isImplied(id)) return;
    onChange(value.filter((v) => v !== id));
  };

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      remove(id);
    } else {
      addWithAncestors(id);
      if (!multiple) setOpen(false);
    }
  };

  const pathOf = (id: string): string =>
    options.find((o) => o.category.id === id)?.path || byId.get(id)?.name || "";

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex min-h-[2.75rem] w-full flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
        onClick={() => setOpen(true)}
      >
        {selected.length === 0 && (
          <span className="text-gray-400">{placeholder}</span>
        )}
        {selected.map((c) => {
          const implied = isImplied(c.id);
          return (
            <CategoryBadge
              key={c.id}
              category={c}
              size="sm"
              title={
                implied
                  ? `${pathOf(c.id)} — included via a sub-category`
                  : pathOf(c.id)
              }
              onRemove={implied ? undefined : (id) => remove(id)}
            />
          );
        })}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="ml-auto shrink-0 text-gray-400 hover:text-gray-600"
          aria-label="Toggle category list"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full text-sm outline-none placeholder:text-gray-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-gray-400">
                No categories found
              </li>
            )}
            {filtered.map(({ category, depth, parentPath, hasChildren }) => {
              const checked = selectedSet.has(category.id);
              const implied = checked && isImplied(category.id);
              const isChild = depth > 0;

              return (
                <li key={category.id} role="option" aria-selected={checked}>
                  <button
                    type="button"
                    onClick={() => toggle(category.id)}
                    className={`flex w-full items-start gap-2 py-2 pr-3 text-left transition-colors hover:bg-gray-50 ${
                      checked ? "bg-blue-50/70" : ""
                    }`}
                    style={{ paddingLeft: `${0.75 + depth * 1.15}rem` }}
                  >
                    {/* Tree connector for nested rows. */}
                    {isChild && (
                      <span
                        aria-hidden
                        className="mt-0.5 select-none font-mono text-gray-300"
                      >
                        └
                      </span>
                    )}

                    {/* Checkbox-style indicator. */}
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        checked
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>

                    <span
                      className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border"
                      style={{
                        backgroundColor: category.color || "transparent",
                        borderColor: category.color || "#d1d5db",
                      }}
                    />

                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-1.5">
                        {hasChildren ? (
                          <Folder className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        ) : (
                          <Tag className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                        )}
                        <span
                          className={`truncate ${
                            hasChildren
                              ? "font-semibold text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {category.icon ? `${category.icon} ` : ""}
                          {category.name}
                        </span>
                        {!category.is_active && (
                          <span className="rounded bg-gray-100 px-1 text-[10px] uppercase tracking-wide text-gray-400">
                            inactive
                          </span>
                        )}
                      </span>

                      {/* Parent path hint clarifies where a sub-category sits. */}
                      {isChild && parentPath && (
                        <span className="truncate text-[11px] text-gray-400">
                          in {parentPath}
                        </span>
                      )}
                    </span>

                    {implied && (
                      <span
                        className="mt-0.5 flex shrink-0 items-center gap-1 text-[10px] font-medium text-gray-400"
                        title="Included automatically because a sub-category is selected"
                      >
                        <Lock className="h-3 w-3" />
                        auto
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-gray-100 px-3 py-2">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-gray-400">
              <Folder className="h-3 w-3" />
              <span>Parent</span>
              <Tag className="ml-2 h-3 w-3" />
              <span>Sub-category · picking one also applies its parents</span>
            </div>
            {selected.length > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {selected.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
