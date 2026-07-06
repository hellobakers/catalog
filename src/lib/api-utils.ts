import { NextRequest } from "next/server";
import { supabase } from "./supabaseClient";
import { supabaseAdmin } from "./supabaseAdmin";

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") ||
    request.cookies.get("auth_token")?.value;

  if (!token) return null;

  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("sessions").delete().eq("token", token);
    return null;
  }

  return session.user_id;
}

/**
 * Replace all category links for a product with the given category ids.
 * Only categories owned by `userId` are linked; unknown/foreign ids are ignored.
 */
export async function syncProductCategories(
  productId: string,
  categoryIds: string[],
  userId: string
): Promise<void> {
  // Remove existing links for this product.
  await supabaseAdmin
    .from("product_categories")
    .delete()
    .eq("product_id", productId);

  if (!categoryIds || categoryIds.length === 0) return;

  // Load the user's full category tree so we can (a) validate ownership and
  // (b) expand each selection to include its ancestors.
  const { data: allOwned } = await supabaseAdmin
    .from("categories")
    .select("id, parent_id")
    .eq("created_by", userId);

  const owned = allOwned || [];
  const ownedIds = new Set(owned.map((c) => c.id));
  const parentOf = new Map(owned.map((c) => [c.id, c.parent_id]));

  // Assigning a sub-category implicitly assigns its parent chain too.
  const expanded = new Set<string>();
  for (const id of categoryIds) {
    if (!ownedIds.has(id)) continue; // ignore unknown / foreign ids
    let current: string | null = id;
    const guard = new Set<string>();
    while (current && ownedIds.has(current) && !guard.has(current)) {
      guard.add(current);
      expanded.add(current);
      current = parentOf.get(current) ?? null;
    }
  }

  if (expanded.size === 0) return;

  const rows = Array.from(expanded).map((category_id) => ({
    product_id: productId,
    category_id,
  }));

  await supabaseAdmin.from("product_categories").insert(rows);
}
