"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Package } from "lucide-react";
import ProductCard from "@/src/components/ProductCard";
import { ProductCardSkeleton } from "@/src/components/LoadingSkeleton";
import CategoryFilter from "@/src/components/categories/CategoryFilter";
import { useAuth } from "@/src/context/AuthContext";
import { getUserProducts, searchUserProducts } from "@/src/lib/products";
import { getCategories } from "@/src/lib/categories";
import { useCategoryTree } from "@/src/hooks/useCategoryTree";
import type { Category, Product } from "@/src/types";

function ProductsPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Selected category filter, seeded from the URL (?categories=id,id).
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const raw = searchParams.get("categories");
    return raw ? raw.split(",").filter(Boolean) : [];
  });
  const [includeChildren, setIncludeChildren] = useState(true);

  const { getDescendantIds } = useCategoryTree(categories);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserProducts(user.id);
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProducts();
      getCategories()
        .then(setCategories)
        .catch(() => {
          /* non-fatal */
        });
    }
  }, [user, loadProducts]);

  // Keep the URL in sync with the active category filter (shareable views).
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCategories.length) {
      params.set("categories", selectedCategories.join(","));
    } else {
      params.delete("categories");
    }
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories]);

  const handleSearch = async (term: string) => {
    setSearch(term);
    if (!user) return;
    setLoading(true);
    try {
      if (term.trim()) {
        const results = await searchUserProducts(user.id, term);
        setProducts(results);
      } else {
        await loadProducts();
      }
    } catch (error) {
      console.error("Failed to search products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Expand the selected filter to include descendant categories when enabled.
  const activeCategoryIds = useMemo(() => {
    if (selectedCategories.length === 0) return null;
    if (!includeChildren) return new Set(selectedCategories);
    const set = new Set<string>();
    selectedCategories.forEach((id) =>
      getDescendantIds(id).forEach((d) => set.add(d))
    );
    return set;
  }, [selectedCategories, includeChildren, getDescendantIds]);

  const filteredProducts = useMemo(() => {
    if (!activeCategoryIds) return products;
    return products.filter((p) =>
      (p.categories || []).some((c) => activeCategoryIds.has(c.id))
    );
  }, [products, activeCategoryIds]);

  const hasFilter = selectedCategories.length > 0;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your product catalog
          </p>
        </div>
        <Link
          href="/add-product"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 shadow-lg shadow-blue-200"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search your products by name or ID..."
          className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CategoryFilter
            categories={categories}
            value={selectedCategories}
            onChange={setSelectedCategories}
          />
          <div className="flex items-center gap-3">
            {hasFilter && (
              <>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={includeChildren}
                    onChange={(e) => setIncludeChildren(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Include sub-categories
                </label>
                <span className="text-xs text-gray-500">
                  {filteredProducts.length} of {products.length}
                </span>
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {search || hasFilter ? "No products found" : "No products yet"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {search || hasFilter
              ? "Try adjusting your search or filters"
              : "Get started by adding your first product"}
          </p>
          {!search && !hasFilter && (
            <Link
              href="/add-product"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <ProductsPageInner />
    </Suspense>
  );
}
