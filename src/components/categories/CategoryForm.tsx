"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { categorySchema, type CategoryFormData } from "@/src/lib/validations";
import { buildCategoryTree, type CategoryWithChildren } from "@/src/lib/categories";
import type { Category } from "@/src/types";

/** Client-side mirror of the DB slug trigger, for live preview. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const PRESET_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#64748b",
];

const PRESET_ICONS = ["📦", "📱", "💻", "🎧", "👕", "👟", "🪑", "📚", "🎮", "🏠"];

interface CategoryFormProps {
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isSubmitting: boolean;
  /** Full category list, used to populate the parent dropdown. */
  categories: Category[];
  defaultValues?: Partial<CategoryFormData>;
  /** Editing this category — excluded (with its subtree) from parent options. */
  editingId?: string;
  submitLabel?: string;
  onCancel?: () => void;
}

/** Flatten tree into indented <option> labels for the parent selector. */
function parentOptions(
  nodes: CategoryWithChildren[],
  excludedIds: Set<string>,
  depth = 0
): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const node of nodes) {
    if (excludedIds.has(node.id)) continue;
    out.push({
      id: node.id,
      label: `${"  ".repeat(depth)}${depth ? "└ " : ""}${node.name}`,
    });
    out.push(...parentOptions(node.children, excludedIds, depth + 1));
  }
  return out;
}

export default function CategoryForm({
  onSubmit,
  isSubmitting,
  categories,
  defaultValues,
  editingId,
  submitLabel = "Save Category",
  onCancel,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parent_id: null,
      sort_order: 0,
      icon: "",
      color: PRESET_COLORS[0],
      is_active: true,
      ...defaultValues,
    },
  });

  // Reset when switching between add / different edit targets.
  useEffect(() => {
    reset({
      name: "",
      slug: "",
      description: "",
      parent_id: null,
      sort_order: 0,
      icon: "",
      color: PRESET_COLORS[0],
      is_active: true,
      ...defaultValues,
    });
  }, [defaultValues, editingId, reset]);

  const name = watch("name");
  const slug = watch("slug");
  const description = watch("description") || "";
  const color = watch("color") || PRESET_COLORS[0];
  const icon = watch("icon") || "";
  const isActive = watch("is_active");

  // Descendant subtree of the edited node is ineligible as a parent.
  const excludedIds = useMemo(() => {
    const set = new Set<string>();
    if (!editingId) return set;
    set.add(editingId);
    let added = true;
    while (added) {
      added = false;
      for (const c of categories) {
        if (c.parent_id && set.has(c.parent_id) && !set.has(c.id)) {
          set.add(c.id);
          added = true;
        }
      }
    }
    return set;
  }, [categories, editingId]);

  const options = useMemo(
    () => parentOptions(buildCategoryTree(categories), excludedIds),
    [categories, excludedIds]
  );

  const previewSlug = slug?.trim() ? slug : slugify(name || "");

  const submit = async (data: CategoryFormData) => {
    await onSubmit({
      ...data,
      parent_id: data.parent_id || null,
      slug: data.slug?.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("name")}
          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="e.g., Electronics"
        />
        {previewSlug && (
          <p className="mt-1 text-xs text-gray-500">
            Slug preview: <span className="font-mono">{previewSlug}</span>
          </p>
        )}
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Slug
        </label>
        <input
          type="text"
          {...register("slug")}
          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="auto-generated from name"
        />
        {errors.slug && (
          <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Parent Category
        </label>
        <select
          {...register("parent_id")}
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">— None (top level) —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          {...register("description")}
          rows={3}
          maxLength={500}
          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
          placeholder="Optional description"
        />
        <div className="mt-1 flex justify-between">
          {errors.description ? (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">
            {description.length}/500
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Sort Order
          </label>
          <input
            type="number"
            min={0}
            {...register("sort_order", { valueAsNumber: true })}
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.sort_order && (
            <p className="mt-1 text-sm text-red-500">
              {errors.sort_order.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Status
          </label>
          <button
            type="button"
            onClick={() => setValue("is_active", !isActive)}
            className={`flex h-[2.75rem] w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
              isActive
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            {isActive ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Icon
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_ICONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setValue("icon", emoji === icon ? "" : emoji)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors ${
                icon === emoji
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {emoji}
            </button>
          ))}
          <input
            type="text"
            {...register("icon")}
            className="h-9 w-24 rounded-lg border border-gray-300 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="or type"
          />
        </div>
        {errors.icon && (
          <p className="mt-1 text-sm text-red-500">{errors.icon.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Color
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setValue("color", preset)}
              className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                color.toLowerCase() === preset.toLowerCase()
                  ? "border-gray-900"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: preset }}
              aria-label={`Select color ${preset}`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setValue("color", e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-gray-300 bg-white"
            aria-label="Custom color"
          />
        </div>
        {errors.color && (
          <p className="mt-1 text-sm text-red-500">{errors.color.message}</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-blue-200"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
