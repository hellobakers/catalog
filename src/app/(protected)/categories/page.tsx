"use client";

import { useMemo, useState } from "react";
import {
  FolderTree,
  Plus,
  X,
  Layers,
  Folder,
  Tag,
  CheckCircle2,
  GripVertical,
  MousePointerClick,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import CategoryTree from "@/src/components/categories/CategoryTree";
import CategoryForm from "@/src/components/categories/CategoryForm";
import ConfirmDialog from "@/src/components/ConfirmDialog";
import { useCategories } from "@/src/hooks/useCategories";
import { useCategoryTree, type CategoryWithChildren } from "@/src/hooks/useCategoryTree";
import type { CategoryFormData } from "@/src/lib/validations";
import type { Category } from "@/src/types";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, ScaleIn } from "@/src/components/Motion";
import { cn } from "@/src/lib/utils";

type PanelMode =
  | { kind: "closed" }
  | { kind: "create"; parentId: string | null }
  | { kind: "edit"; category: Category };

export default function CategoriesPage() {
  const {
    categories,
    loading,
    loadCategories,
    addCategory,
    editCategory,
    removeCategory,
    saveOrder,
  } = useCategories();
  const { tree } = useCategoryTree(categories);

  const [panel, setPanel] = useState<PanelMode>({ kind: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithChildren | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const stats = useMemo(() => {
    const total = categories.length;
    const roots = categories.filter((c) => !c.parent_id).length;
    const active = categories.filter((c) => c.is_active).length;
    return { total, roots, sub: total - roots, active };
  }, [categories]);

  const nextSortOrder = (parentId: string | null) =>
    categories.filter((c) => (c.parent_id ?? null) === parentId).length;

  const handleCreate = async (data: CategoryFormData) => {
    setSubmitting(true);
    try {
      await addCategory(data as Record<string, unknown>);
      setPanel({ kind: "closed" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (data: CategoryFormData) => {
    if (panel.kind !== "edit") return;
    setSubmitting(true);
    try {
      await editCategory(panel.category.id, data as Record<string, unknown>);
      setPanel({ kind: "closed" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (category: CategoryWithChildren) => {
    try {
      await editCategory(category.id, { is_active: !category.is_active });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleReorder = async (siblings: CategoryWithChildren[]) => {
    const items = siblings.map((s, index) => ({ id: s.id, sort_order: index }));
    try {
      await saveOrder(items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder");
      loadCategories();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeCategory(deleteTarget.id);
      if (panel.kind === "edit" && panel.category.id === deleteTarget.id) {
        setPanel({ kind: "closed" });
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const editingDefaults = (c: Category): Partial<CategoryFormData> => ({
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    parent_id: c.parent_id,
    sort_order: c.sort_order,
    icon: c.icon || "",
    color: c.color || "#3b82f6",
    is_active: c.is_active,
  });

  return (
    <div className="space-y-8 pb-12">
      <FadeIn direction="down" className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <FolderTree className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Taxonomy</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Category Manager
          </h1>
          <p className="text-muted-foreground">
            Structure your catalog hierarchy with nested categories and custom icons.
          </p>
        </div>
        <button
          onClick={() => setPanel({ kind: "create", parentId: null })}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Create Category
        </button>
      </FadeIn>

      <FadeIn delay={0.1} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Items",
            value: stats.total,
            icon: Layers,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Top Level",
            value: stats.roots,
            icon: Folder,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
          },
          {
            label: "Nested",
            value: stats.sub,
            icon: Tag,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
          },
          {
            label: "Active",
            value: stats.active,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", s.bg)}>
              <s.icon className={cn("h-6 w-6", s.color)} />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-foreground">
                {s.value}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </FadeIn>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <FadeIn delay={0.2} className="lg:col-span-2">
          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                Quick Guide:
              </div>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                <GripVertical className="h-3.5 w-3.5" />
                Drag to Reorder
              </span>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                <MousePointerClick className="h-3.5 w-3.5" />
                Click to Manage
              </span>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-2xl bg-muted/50"
                    />
                  ))}
                </div>
              ) : (
                <CategoryTree
                  tree={tree}
                  selectedId={
                    panel.kind === "edit" ? panel.category.id : null
                  }
                  onEdit={(c) => setPanel({ kind: "edit", category: c })}
                  onDelete={(c) => setDeleteTarget(c)}
                  onAddChild={(parent) =>
                    setPanel({ kind: "create", parentId: parent.id })
                  }
                  onToggleActive={handleToggleActive}
                  onReorder={handleReorder}
                />
              )}
            </div>
          </div>
        </FadeIn>

        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {panel.kind === "closed" ? (
              <motion.div 
                key="closed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex h-full min-h-[20rem] flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-muted/20 p-8 text-center"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-inner">
                  <Plus className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Editor Inactive</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select a category from the tree or create a new one to begin editing.
                </p>
                <button
                  onClick={() => setPanel({ kind: "create", parentId: null })}
                  className="mt-8 rounded-2xl bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground transition-all hover:bg-secondary/80"
                >
                  Create New Root
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="open"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="sticky top-24 overflow-hidden rounded-3xl border bg-card shadow-xl shadow-primary/5"
              >
                <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      panel.kind === "create" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {panel.kind === "create" ? (
                        <Plus className="h-5 w-5" />
                      ) : (
                        <FolderTree className="h-5 w-5" />
                      )}
                    </div>
                    <h2 className="text-lg font-black tracking-tight text-foreground">
                      {panel.kind === "create" ? "New Category" : "Edit Category"}
                    </h2>
                  </div>
                  <button
                    onClick={() => setPanel({ kind: "closed" })}
                    className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  {panel.kind === "create" && panel.parentId && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl bg-primary/5 p-4 text-xs font-bold text-primary">
                      <Tag className="h-4 w-4 shrink-0" />
                      <span className="min-w-0">
                        Nesting under: <span className="underline decoration-primary/30 underline-offset-4">
                          {categories.find((c) => c.id === panel.parentId)?.name}
                        </span>
                      </span>
                    </div>
                  )}
                  {panel.kind === "create" ? (
                    <CategoryForm
                      key={`create-${panel.parentId ?? "root"}`}
                      categories={categories}
                      isSubmitting={submitting}
                      onSubmit={handleCreate}
                      onCancel={() => setPanel({ kind: "closed" })}
                      submitLabel="Create Category"
                      defaultValues={{
                        parent_id: panel.parentId,
                        sort_order: nextSortOrder(panel.parentId),
                        color: "#3b82f6",
                        is_active: true,
                      }}
                    />
                  ) : (
                    <CategoryForm
                      key={`edit-${panel.category.id}`}
                      categories={categories}
                      editingId={panel.category.id}
                      isSubmitting={submitting}
                      onSubmit={handleEdit}
                      onCancel={() => setPanel({ kind: "closed" })}
                      submitLabel="Save Changes"
                      defaultValues={editingDefaults(panel.category)}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone if it has sub-categories or products.`
            : ""
        }
        confirmLabel="Delete Category"
        isLoading={deleting}
      />
    </div>
  );
}
