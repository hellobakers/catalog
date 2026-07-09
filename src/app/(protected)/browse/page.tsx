"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  LayoutGrid, 
  Folder, 
  ChevronRight, 
  Package, 
  Search,
  Sparkles
} from "lucide-react";
import { getCategories, buildCategoryTree, type CategoryWithChildren } from "@/src/lib/categories";
import { FadeIn, ScaleIn } from "@/src/components/Motion";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

export default function BrowsePage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getCategories();
        setCategories(buildCategoryTree(data));
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    
    // Simple search through top-level categories
    return categories.filter(c => 
      c.name.toLowerCase().includes(query) || 
      (c.description && c.description.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  return (
    <div className="space-y-10 pb-20">
      <FadeIn direction="down" className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <LayoutGrid className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Discovery</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground lg:text-5xl">
            Browse Catalog
          </h1>
          <p className="text-muted-foreground max-w-lg">
            Navigate through your collections to find the perfect products for your store.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1} className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full rounded-[2rem] border bg-card pl-14 pr-6 py-5 text-sm font-bold shadow-xl shadow-primary/5 transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
        />
      </FadeIn>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-[2.5rem] bg-muted" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <FadeIn className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/30 shadow-inner">
            <Folder className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-2xl font-black text-foreground">No categories found</h3>
          <p className="mt-2 text-muted-foreground">Try adjusting your search query.</p>
        </FadeIn>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredCategories.map((category, i) => (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link 
                  href={`/browse/${category.id}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border bg-card p-8 shadow-sm transition-all hover:-translate-y-2 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
                >
                  <div 
                    className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl text-3xl shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: `${category.color || "#3b82f6"}1a`, color: category.color || "#3b82f6" }}
                  >
                    {category.icon || <Folder className="h-8 w-8" />}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-muted-foreground line-clamp-2">
                      {category.description || "Explore products in this collection."}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-6 border-t border-dashed">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-primary">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-foreground">
                        {category.product_count || 0} Products
                      </span>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:translate-x-1">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>

                  {category.children.length > 0 && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[9px] font-black uppercase tracking-widest text-secondary-foreground">
                        <Sparkles className="h-3 w-3" />
                        {category.children.length} Nested
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
