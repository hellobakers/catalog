"use client";

import { useCallback, useMemo } from "react";
import { buildCategoryTree, type CategoryWithChildren } from "@/src/lib/categories";
import type { Category } from "@/src/types";

/**
 * Derive tree structure and hierarchy helpers from a flat category list.
 * All helpers are memoised against the input array identity.
 */
export function useCategoryTree(categories: Category[]) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  const byId = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const getCategoryPath = useCallback(
    (categoryId: string): string => {
      const path: string[] = [];
      let current: Category | undefined = byId.get(categoryId);
      const guard = new Set<string>();
      while (current && !guard.has(current.id)) {
        guard.add(current.id);
        path.unshift(current.name);
        current = current.parent_id ? byId.get(current.parent_id) : undefined;
      }
      return path.join(" > ");
    },
    [byId]
  );

  const getDescendantIds = useCallback(
    (categoryId: string): string[] => {
      const result: string[] = [categoryId];
      const childrenOf = (id: string) =>
        categories.filter((c) => c.parent_id === id);
      const stack = [...childrenOf(categoryId)];
      while (stack.length) {
        const node = stack.pop()!;
        result.push(node.id);
        stack.push(...childrenOf(node.id));
      }
      return result;
    },
    [categories]
  );

  return { tree, getCategoryPath, getDescendantIds };
}

export type { CategoryWithChildren };
