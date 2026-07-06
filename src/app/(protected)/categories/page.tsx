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
} from "lucide-react";
import toast from "react-hot-toast";
import CategoryTree from "@/src/components/categories/CategoryTree";
import CategoryForm from "@/src/components/categories/CategoryForm";
import ConfirmDialog from "@/src/components/ConfirmDialog";
import { useCategories } from "@/src/hooks/useCategories";
import { useCategoryTree, type CategoryWithChildren } from "@/src/hooks/useCategoryTree";
import type { CategoryFormData } from "@/src/lib/validations";
import type { Category } from "@/src/types";

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
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FolderTree className="h-6 w-6 text-blue-600" />
            Categories
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Organize your catalog into a hierarchy. Drag to reorder siblings.
          </p>
        </div>
        <button
          onClick={() => setPanel({ kind: "create", parentId: null })}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: Layers,
            tint: "bg-blue-50 text-blue-600",
          },
          {
            label: "Top-level",
            value: stats.roots,
            icon: Folder,
            tint: "bg-indigo-50 text-indigo-600",
          },
          {
            label: "Sub-categories",
            value: stats.sub,
            icon: Tag,
            tint: "bg-violet-50 text-violet-600",
          },
          {
            label: "Active",
            value: stats.active,
            icon: CheckCircle2,
            tint: "bg-green-50 text-green-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.tint}`}
            >
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none text-gray-900">
                {s.value}
              </p>
              <p className="mt-1 truncate text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Legend / hint bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-gray-400" />
                Parent
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-gray-400" />
                Sub-category
              </span>
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <GripVertical className="h-3.5 w-3.5 text-gray-400" />
                Drag to reorder
              </span>
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <MousePointerClick className="h-3.5 w-3.5 text-gray-400" />
                Click a name to open
              </span>
            </div>

            <div className="p-3 sm:p-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-xl bg-gray-100"
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
        </div>

        <div className="lg:col-span-1">
          {panel.kind === "closed" ? (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/50 p-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Plus className="h-6 w-6 text-blue-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Nothing selected
              </p>
              <p className="mt-1 max-w-[15rem] text-xs text-gray-500">
                Pick a category to edit it, or add a new one to get started.
              </p>
              <button
                onClick={() => setPanel({ kind: "create", parentId: null })}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                New category
              </button>
            </div>
          ) : (
            <div className="sticky top-20 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      panel.kind === "create"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {panel.kind === "create" ? (
                      <Plus className="h-4 w-4" />
                    ) : (
                      <FolderTree className="h-4 w-4" />
                    )}
                  </span>
                  {panel.kind === "create" ? "New Category" : "Edit Category"}
                </h2>
                <button
                  onClick={() => setPanel({ kind: "closed" })}
                  className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                {panel.kind === "create" && panel.parentId && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    <Tag className="h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0">
                      Adding a sub-category under{" "}
                      <span className="font-semibold">
                        {categories.find((c) => c.id === panel.parentId)?.name ??
                          "selected category"}
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
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? Categories with sub-categories or assigned products cannot be deleted.`
            : ""
        }
        confirmLabel="Delete"
        isLoading={deleting}
      />
    </div>
  );
}
