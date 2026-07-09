"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Folder, 
  ChevronRight, 
  Package, 
  LayoutGrid,
  Search,
  FilterX,
  Sparkles
} from "lucide-react";
import { 
  getCategories, 
  getCategory, 
  getCategoryProducts, 
  buildCategoryTree, 
  type CategoryWithChildren 
} from "@/src/lib/categories";
import ProductCard from "@/src/components/ProductCard";
import { ProductCardSkeleton } from "@/src/components/LoadingSkeleton";
import { FadeIn, ScaleIn } from "@/src/components/Motion";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import type { Category, Product } from "@/src/types";

export default function CategoryBrowsePage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [catData, allCats, prodData] = await Promise.all([
          getCategory(categoryId),
          getCategories(),
          getCategoryProducts(categoryId, 1, 100) // Load many for browsing
        ]);
        
        setCategory(catData);
        setAllCategories(allCats);
        setProducts(prodData.data);
      } catch (error) {
        console.error("Failed to load category data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (categoryId) loadData();
  }, [categoryId]);

  const tree = useMemo(() => buildCategoryTree(allCategories), [allCategories]);
  
  const currentCategoryWithChildren = useMemo(() => {
    const findInTree = (nodes: CategoryWithChildren[]): CategoryWithChildren | null => {
      for (const node of nodes) {
        if (node.id === categoryId) return node;
        const found = findInTree(node.children);
        if (found) return found;
      }
      return null;
    };
    return findInTree(tree);
  }, [tree, categoryId]);

  const breadcrumbs = useMemo(() => {
    const path: Category[] = [];
    let currentId = categoryId;
    const byId = new Map(allCategories.map(c => [c.id, c]));
    
    while (currentId) {
      const cat = byId.get(currentId);
      if (cat) {
        path.unshift(cat);
        currentId = cat.parent_id || "";
      } else {
        break;
      }
    }
    return path;
  }, [allCategories, categoryId]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query)) ||
      p.unique_product_id.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-8 pb-20">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-32 w-full animate-pulse rounded-[2.5rem] bg-muted" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="space-y-10 pb-20">
      {/* Breadcrumbs & Header */}
      <div className="space-y-6">
        <FadeIn direction="down" className="flex items-center gap-4">
          <Link
            href="/browse"
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-secondary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <nav className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Link href="/browse" className="hover:text-primary transition-colors">Browse</Link>
            {breadcrumbs.map((bc, i) => (
              <div key={bc.id} className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5" />
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-foreground">{bc.name}</span>
                ) : (
                  <Link href={`/browse/${bc.id}`} className="hover:text-primary transition-colors">
                    {bc.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </FadeIn>

        <FadeIn delay={0.1} className="overflow-hidden rounded-[3rem] border bg-card shadow-2xl shadow-primary/5">
          <div className="relative p-10 lg:p-14">
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-16 w-16 items-center justify-center rounded-3xl text-3xl shadow-lg"
                    style={{ backgroundColor: `${category.color || "#3b82f6"}1a`, color: category.color || "#3b82f6" }}
                  >
                    {category.icon || <Folder className="h-8 w-8" />}
                  </div>
                  <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground lg:text-5xl">
                      {category.name}
                    </h1>
                    <div className="mt-1 flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {category.product_count || 0} Products in this collection
                      </span>
                    </div>
                  </div>
                </div>
                {category.description && (
                  <p className="max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            {/* Background Accent */}
            <div 
              className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-20"
              style={{ backgroundColor: category.color || "#3b82f6" }}
            />
          </div>
        </FadeIn>
      </div>

      {/* Sub-categories Section */}
      {currentCategoryWithChildren && currentCategoryWithChildren.children.length > 0 && (
        <FadeIn delay={0.2} className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Sub-collections</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {currentCategoryWithChildren.children.map((sub, i) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Link 
                  href={`/browse/${sub.id}`}
                  className="group flex items-center gap-4 rounded-3xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div 
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${sub.color || "#3b82f6"}1a`, color: sub.color || "#3b82f6" }}
                  >
                    {sub.icon || <Folder className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-black text-foreground group-hover:text-primary transition-colors">
                      {sub.name}
                    </h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {sub.product_count || 0} Items
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Products Section */}
      <FadeIn delay={0.3} className="space-y-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Products Listing</h2>
          </div>
          
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter products..."
              className="w-full rounded-2xl border bg-card pl-11 pr-4 py-3 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed bg-muted/20 py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-inner">
              <Package className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-black text-foreground">No products found</h3>
            <p className="mt-2 text-muted-foreground">Try adjusting your search or explore other categories.</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-6 flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                <FilterX className="h-4 w-4" />
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </FadeIn>
    </div>
  );
}
