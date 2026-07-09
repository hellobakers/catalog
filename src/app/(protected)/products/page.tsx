"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Package, FilterX, ArrowUpDown, LayoutGrid } from "lucide-react";
import ProductCard from "@/src/components/ProductCard";
import { ProductCardSkeleton } from "@/src/components/LoadingSkeleton";
import CategoryFilter from "@/src/components/categories/CategoryFilter";
import { useAuth } from "@/src/context/AuthContext";
import { getUserProducts, searchUserProducts } from "@/src/lib/products";
import { getCategories } from "@/src/lib/categories";
import { useCategoryTree } from "@/src/hooks/useCategoryTree";
import type { Category, Product } from "@/src/types";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/src/components/Motion";
import { cn } from "@/src/lib/utils";

function ProductsPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        .catch(() => {});
    }
  }, [user, loadProducts]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCategories.length) {
      params.set("categories", selectedCategories.join(","));
    } else {
      params.delete("categories");
    }
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  }, [selectedCategories, router, searchParams]);

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
    <div className="space-y-8 pb-12">
      <FadeIn direction="down" className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <LayoutGrid className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Inventory</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Product Catalog
          </h1>
          <p className="text-muted-foreground">
            Manage and organize your collection of {products.length} items.
          </p>
        </div>
        <Link
          href="/add-product"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-95"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          Add New Product
        </Link>
      </FadeIn>

      <FadeIn delay={0.1} className="grid gap-4 md:grid-cols-[1fr,auto]">
        <div className="group relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, ID or description..."
            className="w-full rounded-2xl border bg-card pl-12 pr-4 py-4 text-sm font-medium shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/60"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {categories.length > 0 && (
            <CategoryFilter
              categories={categories}
              value={selectedCategories}
              onChange={setSelectedCategories}
            />
          )}
          <button className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-card text-muted-foreground transition-all hover:bg-accent hover:text-foreground">
            <ArrowUpDown className="h-5 w-5" />
          </button>
        </div>
      </FadeIn>

      {hasFilter && (
        <FadeIn delay={0.15} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/50 p-4">
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-foreground">
              <input
                type="checkbox"
                checked={includeChildren}
                onChange={(e) => setIncludeChildren(e.target.checked)}
                className="h-4 w-4 rounded border-muted-foreground/30 bg-background text-primary focus:ring-primary/20"
              />
              Include Sub-categories
            </label>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredProducts.length}</span> of {products.length} products
            </span>
          </div>
          <button
            onClick={() => setSelectedCategories([])}
            className="flex items-center gap-2 text-sm font-bold text-destructive transition-colors hover:text-destructive/80"
          >
            <FilterX className="h-4 w-4" />
            Clear All Filters
          </button>
        </FadeIn>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-muted/30 py-24 text-center"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background shadow-inner mb-6">
                <Package className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2">
                {search || hasFilter ? "No matches found" : "Your catalog is empty"}
              </h3>
              <p className="max-w-xs text-muted-foreground mb-8">
                {search || hasFilter
                  ? "We couldn't find any products matching your current criteria."
                  : "Start building your digital catalog by adding your very first product."}
              </p>
              {!search && !hasFilter && (
                <Link
                  href="/add-product"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90"
                >
                  <Plus className="h-5 w-5" />
                  Add First Product
                </Link>
              )}
              {(search || hasFilter) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategories([]);
                  }}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Reset all search and filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
