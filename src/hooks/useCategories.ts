"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "@/src/lib/categories";
import type { Category } from "@/src/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (data: Record<string, unknown>) => {
    const newCategory = await createCategory(data);
    setCategories((prev) => [...prev, newCategory]);
    toast.success("Category created");
    return newCategory;
  }, []);

  const editCategory = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      const updated = await updateCategory(id, data);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
      toast.success("Category updated");
      return updated;
    },
    []
  );

  const removeCategory = useCallback(async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Category deleted");
  }, []);

  /**
   * Optimistically apply a new ordering, then persist. On failure the caller's
   * catch restores the previous list via loadCategories.
   */
  const saveOrder = useCallback(
    async (items: { id: string; sort_order: number }[]) => {
      setCategories((prev) => {
        const orderMap = new Map(items.map((i) => [i.id, i.sort_order]));
        return prev.map((c) =>
          orderMap.has(c.id)
            ? { ...c, sort_order: orderMap.get(c.id)! }
            : c
        );
      });
      await reorderCategories(items);
    },
    []
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    loadCategories,
    addCategory,
    editCategory,
    removeCategory,
    saveOrder,
  };
}
