"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus, FolderTree, Package, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import ProductCard from "@/src/components/ProductCard";
import { ProductCardSkeleton } from "@/src/components/LoadingSkeleton";
import CategoryBreadcrumb from "@/src/components/categories/CategoryBreadcrumb";
import { useAuth } from "@/src/context/AuthContext";
import {
  getCategory,
  getCategories,
  getCategoryProducts,
} from "@/src/lib/categories";
import type { Category, Product } from "@/src/types";

const PAGE_SIZE = 12;

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!user || !categoryId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [cat, all] = await Promise.all([
          getCategory(categoryId),
          getCategories(),
        ]);
        if (cancelled) return;
        setCategory(cat);
        setAllCategories(all);
      } catch {
        if (!cancelled) {
          toast.error("Category not found");
          router.push("/categories");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, categoryId, router]);

  useEffect(() => {
    if (!user || !categoryId) return;
    let cancelled = false;

    (async () => {
      setLoadingProducts(true);
      try {
        const res = await getCategoryProducts(categoryId, page, PAGE_SIZE);
        if (cancelled) return;
        setProducts(res.data);
        setCount(res.count);
      } catch {
        if (!cancelled) toast.error("Failed to load products");
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, categoryId, page]);

  // Root-to-leaf breadcrumb trail.
  const trail = useMemo(() => {
    if (!category) return [];
    const byId = new Map(allCategories.map((c) => [c.id, c]));
    const out: { id: string; name: string }[] = [];
    let current: Category | undefined = byId.get(category.id) || category;
    const guard = new Set<string>();
    while (current && !guard.has(current.id)) {
      guard.add(current.id);
      out.unshift({ id: current.id, name: current.name });
      current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
    return out;
  }, [category, allCategories]);

  const children = category?.children || [];
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!category) return null;

  return (
    <div>
      <CategoryBreadcrumb trail={trail} />

      <div
        className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: category.color || "#3b82f6",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {category.icon && (
                <span className="text-2xl">{category.icon}</span>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {category.name}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  category.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {category.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-gray-500">
              /{category.slug}
            </p>
            {category.description && (
              <p className="mt-3 max-w-2xl text-sm text-gray-600">
                {category.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-4 w-4 text-gray-400" />
                {category.product_count ?? count} products
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FolderTree className="h-4 w-4 text-gray-400" />
                {children.length} sub-categories
              </span>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Link
              href={`/categories?edit=${category.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <Link
              href="/add-product"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Sub-categories
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.id}`}
                className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: child.color || "#3b82f6" }}
                  />
                  {child.icon && <span>{child.icon}</span>}
                  <span className="truncate font-medium text-gray-900 group-hover:text-blue-600">
                    {child.name}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-blue-500" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Products {count > 0 && `(${count})`}
        </h2>

        {loadingProducts ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-center">
            <Package className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              No products in this category yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
