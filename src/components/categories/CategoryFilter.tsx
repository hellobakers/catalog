"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, ChevronDown, Check, X } from "lucide-react";
import { buildCategoryTree, type CategoryWithChildren } from "@/src/lib/categories";
import type { Category } from "@/src/types";
import CategoryBadge from "./CategoryBadge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

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
    <div className="flex flex-wrap items-center gap-3">
      <div ref={ref} className="relative">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-2xl border px-5 text-sm font-bold transition-all shadow-sm",
            value.length
              ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
              : "border-border bg-card text-foreground hover:bg-accent hover:border-primary/30"
          )}
        >
          <Filter className="h-4 w-4" />
          Categories
          {value.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
              {value.length}
            </span>
          )}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-300", open ? "rotate-180" : "")}
          />
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute left-0 z-50 mt-2 w-72 origin-top-left overflow-hidden rounded-[1.5rem] border bg-card shadow-2xl shadow-primary/10"
            >
              <div className="border-b bg-muted/30 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Categories</p>
              </div>
              <ul className="max-h-80 overflow-y-auto p-2">
                {options.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm font-medium text-muted-foreground">
                    No categories found
                  </li>
                )}
                {options.map(({ category, depth }) => {
                  const isSelected = value.includes(category.id);
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        onClick={() => toggle(category.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                          isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                        )}
                        style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
                      >
                        <div
                          className="h-3 w-3 shrink-0 rounded-full border shadow-inner"
                          style={{
                            backgroundColor: category.color || "transparent",
                            borderColor: category.color || "hsl(var(--border))",
                          }}
                        />
                        <span className="flex-1 truncate">
                          {category.icon ? `${category.icon} ` : ""}
                          {category.name}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 stroke-[3px]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {value.length > 0 && (
                <div className="border-t bg-muted/10 p-2">
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/5"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset All Filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="popLayout">
        {selected.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            layout
          >
            <CategoryBadge
              category={c}
              size="md"
              onRemove={(id) => onChange(value.filter((v) => v !== id))}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
