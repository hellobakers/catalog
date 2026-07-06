import type { Category, Product } from "@/src/types";

const BASE = "/api/categories";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options?.headers as Record<string, string>),
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }

  return json;
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

/** Fetch the flat list of the user's categories (each carrying product_count). */
export async function getCategories(): Promise<Category[]> {
  const { data } = await fetchJson<{ data: Category[] }>(BASE);
  return data || [];
}

/** Fetch a single category with its direct children and product_count. */
export async function getCategory(id: string): Promise<Category> {
  const { data } = await fetchJson<{ data: Category }>(`${BASE}/${id}`);
  return data;
}

export async function createCategory(
  data: Record<string, unknown>
): Promise<Category> {
  const { data: category } = await fetchJson<{ data: Category }>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return category;
}

export async function updateCategory(
  id: string,
  data: Record<string, unknown>
): Promise<Category> {
  const { data: category } = await fetchJson<{ data: Category }>(
    `${BASE}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return category;
}

export async function deleteCategory(id: string): Promise<boolean> {
  await fetchJson<{ success: boolean }>(`${BASE}/${id}`, {
    method: "DELETE",
  });
  return true;
}

/** Persist a new sort order for a set of categories. */
export async function reorderCategories(
  items: { id: string; sort_order: number }[]
): Promise<boolean> {
  await fetchJson<{ success: boolean }>(`${BASE}/reorder`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
  return true;
}

/** Fetch a paginated list of the products assigned to a category. */
export async function getCategoryProducts(
  categoryId: string,
  page = 1,
  pageSize = 12
): Promise<{ data: Product[]; count: number; page: number; pageSize: number }> {
  return fetchJson<{
    data: Product[];
    count: number;
    page: number;
    pageSize: number;
  }>(`${BASE}/${categoryId}/products?page=${page}&pageSize=${pageSize}`);
}

/**
 * Build a nested tree from a flat category list, ordered by sort_order.
 * Categories whose parent is missing from the list surface as roots so
 * nothing is silently dropped.
 */
export function buildCategoryTree(
  categories: Category[]
): CategoryWithChildren[] {
  const byId = new Map<string, CategoryWithChildren>();
  categories.forEach((c) => byId.set(c.id, { ...c, children: [] }));

  const roots: CategoryWithChildren[] = [];
  byId.forEach((node) => {
    const parent = node.parent_id ? byId.get(node.parent_id) : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRec = (nodes: CategoryWithChildren[]) => {
    nodes.sort(
      (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
    );
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);

  return roots;
}

/** Human-readable path for a category, e.g. "Electronics > Phones > iOS". */
export function getCategoryPath(
  categoryId: string,
  categories: Category[]
): string[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const path: string[] = [];
  let current: Category | undefined = byId.get(categoryId);
  const guard = new Set<string>();
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    path.unshift(current.name);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return path;
}

/**
 * Ordered ancestor ids of a category (nearest parent first), excluding the
 * category itself. Cycle-safe.
 */
export function getAncestorIds(
  categoryId: string,
  categories: Category[]
): string[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const out: string[] = [];
  const guard = new Set<string>([categoryId]);
  let parentId = byId.get(categoryId)?.parent_id ?? null;
  while (parentId && !guard.has(parentId)) {
    guard.add(parentId);
    out.push(parentId);
    parentId = byId.get(parentId)?.parent_id ?? null;
  }
  return out;
}

/**
 * Expand a set of selected category ids to also include every ancestor, so a
 * product assigned to a sub-category is implicitly assigned to its parents.
 * Only ids present in `categories` are added. Order is not significant.
 */
export function withAncestors(
  selectedIds: string[],
  categories: Category[]
): string[] {
  const result = new Set<string>(selectedIds);
  for (const id of selectedIds) {
    for (const ancestorId of getAncestorIds(id, categories)) {
      result.add(ancestorId);
    }
  }
  return Array.from(result);
}
