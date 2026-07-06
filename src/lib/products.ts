import type { Product } from "@/src/types";

const BASE = "/api/products";

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

export async function getUserProducts(userId: string): Promise<Product[]> {
  const { data } = await fetchJson<{ data: Product[] }>(BASE);
  return data || [];
}

export async function getProduct(productId: string, userId: string): Promise<Product> {
  const { data } = await fetchJson<{ data: Product }>(`${BASE}/${productId}`);
  return data;
}

export async function createProduct(
  productData: Record<string, unknown>,
  userId: string
): Promise<Product> {
  const { data } = await fetchJson<{ data: Product }>(BASE, {
    method: "POST",
    body: JSON.stringify({ ...productData, created_by: userId }),
  });
  return data;
}

export async function updateProduct(
  productId: string,
  productData: Record<string, unknown>,
  userId: string
): Promise<Product> {
  const { data } = await fetchJson<{ data: Product }>(`${BASE}/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ ...productData, created_by: userId }),
  });
  return data;
}

export async function deleteProduct(
  productId: string,
  userId: string
): Promise<boolean> {
  await fetchJson<{ success: boolean }>(`${BASE}/${productId}`, {
    method: "DELETE",
  });
  return true;
}

export async function searchUserProducts(
  userId: string,
  searchTerm: string
): Promise<Product[]> {
  const { data } = await fetchJson<{ data: Product[] }>(
    `${BASE}?search=${encodeURIComponent(searchTerm)}`
  );
  return data || [];
}
