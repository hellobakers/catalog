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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface CategoryTreeProps {
  tree: CategoryWithChildren[];
  selectedId?: string | null;
  onEdit: (category: CategoryWithChildren) => void;
  onDelete: (category: CategoryWithChildren) => void;
  onAddChild: (parent: CategoryWithChildren) => void;
  onToggleActive: (category: CategoryWithChildren) => void;
  onReorder: (siblings: CategoryWithChildren[]) => void;
}

function softBg(hex?: string | null): string {
  const c = hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#3b82f6";
  return `${c}1a`;
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
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-muted/20 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-inner">
          <FolderTree className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-bold text-foreground">No categories yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
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
        <ul className="space-y-3">
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
    zIndex: isDragging ? 50 : 1,
  };

  const isSelected = handlers.selectedId === node.id;
  const color = node.color || "#3b82f6";

  return (
    <li ref={setNodeRef} style={style} className="relative">
      <motion.div
        layout
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl border p-3 transition-all",
          isSelected
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/20"
            : "border-border bg-muted/20 hover:border-primary/30 hover:bg-accent/50",
          isDragging ? "shadow-2xl scale-[1.02] border-primary" : ""
        )}
      >
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none rounded-lg p-1 text-muted-foreground/40 opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all",
            hasChildren
              ? "text-muted-foreground hover:bg-accent hover:text-foreground"
              : "pointer-events-none opacity-0"
          )}
        >
          <ChevronRight
            className={cn("h-4 w-4 transition-transform duration-300", expanded ? "rotate-90" : "")}
          />
        </button>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm"
          style={{ backgroundColor: softBg(color), color }}
        >
          {node.icon ? (
            <span className="scale-110">{node.icon}</span>
          ) : hasChildren ? (
            <Folder className="h-5 w-5" />
          ) : (
            <Tag className="h-5 w-5" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className={cn(
              "truncate text-sm font-bold tracking-tight",
              node.is_active ? "text-foreground" : "text-muted-foreground/60"
            )}>
              {node.name}
            </span>
            {!node.is_active && (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Hidden
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            <span className="truncate font-mono lowercase">/{node.slug}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="inline-flex items-center gap-1">
              <Package className="h-3 w-3" />
              {node.product_count ?? 0}
            </span>
            {hasChildren && (
              <>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>
                  {childCount} Nested
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => handlers.onToggleActive(node)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
              node.is_active ? "text-emerald-500 hover:bg-emerald-50" : "text-muted-foreground hover:bg-muted"
            )}
            title={node.is_active ? "Deactivate" : "Activate"}
          >
            <div className={cn("h-2 w-2 rounded-full", node.is_active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")} />
          </button>
          <button
            type="button"
            onClick={() => handlers.onAddChild(node)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-all hover:bg-primary/10"
            title="Add Nested"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handlers.onEdit(node)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handlers.onDelete(node)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-destructive transition-all hover:bg-destructive/10"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-10 mt-2 border-l-2 border-border pl-4"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
