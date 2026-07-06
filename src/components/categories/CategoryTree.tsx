"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  Package,
  Folder,
  Tag,
  FolderTree,
} from "lucide-react";
import type { CategoryWithChildren } from "@/src/lib/categories";

interface CategoryTreeProps {
  tree: CategoryWithChildren[];
  selectedId?: string | null;
  onEdit: (category: CategoryWithChildren) => void;
  onDelete: (category: CategoryWithChildren) => void;
  onAddChild: (parent: CategoryWithChildren) => void;
  onToggleActive: (category: CategoryWithChildren) => void;
  /** Called with the reordered sibling group (same parent) after a drag. */
  onReorder: (siblings: CategoryWithChildren[]) => void;
}

/** Soft translucent tint of a hex color, for avatar backgrounds. */
function softBg(hex?: string | null): string {
  const c = hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#3b82f6";
  return `${c}1a`; // ~10% alpha
}

export default function CategoryTree({
  tree,
  selectedId,
  onEdit,
  onDelete,
  onAddChild,
  onToggleActive,
  onReorder,
}: CategoryTreeProps) {
  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          <FolderTree className="h-6 w-6 text-blue-400" />
        </div>
        <p className="text-sm font-medium text-gray-700">No categories yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Create your first category to start organizing products.
        </p>
      </div>
    );
  }

  return (
    <SiblingGroup
      siblings={tree}
      depth={0}
      selectedId={selectedId}
      onEdit={onEdit}
      onDelete={onDelete}
      onAddChild={onAddChild}
      onToggleActive={onToggleActive}
      onReorder={onReorder}
    />
  );
}

interface SiblingGroupProps extends Omit<CategoryTreeProps, "tree"> {
  siblings: CategoryWithChildren[];
  depth: number;
}

/** A drag-sortable list of categories that share a parent. */
function SiblingGroup({ siblings, depth, ...handlers }: SiblingGroupProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = siblings.findIndex((s) => s.id === active.id);
    const newIndex = siblings.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    handlers.onReorder(arrayMove(siblings, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={siblings.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-1">
          {siblings.map((node) => (
            <SortableRow key={node.id} node={node} depth={depth} {...handlers} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

interface SortableRowProps extends Omit<CategoryTreeProps, "tree"> {
  node: CategoryWithChildren;
  depth: number;
}

function SortableRow({ node, depth, ...handlers }: SortableRowProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const childCount = node.children.length;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isSelected = handlers.selectedId === node.id;
  const color = node.color || "#3b82f6";

  return (
    <li ref={setNodeRef} style={style} className="relative">
      {/* Horizontal connector tick for nested rows */}
      {depth > 0 && (
        <span
          aria-hidden
          className="absolute -left-4 top-[1.55rem] h-0.5 w-3 rounded bg-gray-200"
        />
      )}
      <div
        className={`group relative flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all ${
          isSelected
            ? "border-blue-300 bg-blue-50 shadow-sm ring-1 ring-blue-200"
            : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/80"
        } ${isDragging ? "shadow-lg" : ""}`}
      >
        {/* Drag handle */}
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none rounded p-0.5 text-gray-300 opacity-60 transition hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing group-hover:opacity-100"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Expand / collapse */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
            hasChildren
              ? "text-gray-500 hover:bg-gray-200"
              : "pointer-events-none opacity-0"
          }`}
          aria-label={expanded ? "Collapse" : "Expand"}
          aria-expanded={expanded}
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </button>

        {/* Avatar: icon/emoji, or folder/leaf glyph, tinted with the category color */}
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: softBg(color), color }}
        >
          {node.icon ? (
            <span>{node.icon}</span>
          ) : hasChildren ? (
            <Folder className="h-4 w-4" />
          ) : (
            <Tag className="h-4 w-4" />
          )}
        </span>

        {/* Name + meta (two lines, gives the row room to breathe) */}
        <Link
          href={`/categories/${node.id}`}
          className="flex min-w-0 flex-1 flex-col leading-tight"
        >
          <span className="flex items-center gap-2">
            <span
              className={`truncate text-sm font-semibold ${
                node.is_active ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {node.name}
            </span>
            {!node.is_active && (
              <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Hidden
              </span>
            )}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
            <span className="truncate font-mono">/{node.slug}</span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Package className="h-3 w-3" />
              {node.product_count ?? 0}
            </span>
            {hasChildren && (
              <>
                <span className="text-gray-300">·</span>
                <span className="whitespace-nowrap">
                  {childCount} sub{childCount === 1 ? "" : "s"}
                </span>
              </>
            )}
          </span>
        </Link>

        {/* Status toggle */}
        <button
          type="button"
          onClick={() => handlers.onToggleActive(node)}
          title={node.is_active ? "Click to hide" : "Click to activate"}
          className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors sm:inline-flex ${
            node.is_active
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              node.is_active ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {node.is_active ? "Active" : "Hidden"}
        </button>

        {/* Actions — always visible (touch-friendly), emphasised on hover */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => handlers.onAddChild(node)}
            title="Add sub-category"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handlers.onEdit(node)}
            title="Edit"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handlers.onDelete(node)}
            title="Delete"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Children indented with a vertical guide rail */}
      {hasChildren && expanded && (
        <div className="ml-[2.4rem] mt-1 border-l-2 border-gray-100 pl-4">
          <SiblingGroup
            siblings={node.children}
            depth={depth + 1}
            selectedId={handlers.selectedId}
            onEdit={handlers.onEdit}
            onDelete={handlers.onDelete}
            onAddChild={handlers.onAddChild}
            onToggleActive={handlers.onToggleActive}
            onReorder={handlers.onReorder}
          />
        </div>
      )}
    </li>
  );
}
