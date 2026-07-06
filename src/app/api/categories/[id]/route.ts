import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { getUserIdFromRequest } from "@/src/lib/api-utils";

interface FlatCategory {
  id: string;
  parent_id: string | null;
}

// Collect the id + every descendant id, given the user's full flat category list.
function collectSubtreeIds(rootId: string, all: FlatCategory[]): Set<string> {
  const ids = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const c of all) {
      if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
        ids.add(c.id);
        added = true;
      }
    }
  }
  return ids;
}

// GET /api/categories/[id] -> single category with children + product_count
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: category, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("id", params.id)
    .eq("created_by", userId)
    .single();

  if (error || !category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: children } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("parent_id", params.id)
    .eq("created_by", userId)
    .order("sort_order", { ascending: true });

  // Product count for this category, scoped to the user's own products.
  const { count } = await supabaseAdmin
    .from("product_categories")
    .select("id, products!inner(created_by)", { count: "exact", head: true })
    .eq("category_id", params.id)
    .eq("products.created_by", userId);

  return NextResponse.json({
    data: {
      ...category,
      children: children || [],
      product_count: count || 0,
    },
  });
}

// PUT /api/categories/[id] -> update own category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Guard: parent change must not create a cycle (self or descendant).
    if (body.parent_id) {
      if (body.parent_id === params.id) {
        return NextResponse.json(
          { error: "A category cannot be its own parent" },
          { status: 400 }
        );
      }

      const { data: all } = await supabaseAdmin
        .from("categories")
        .select("id, parent_id")
        .eq("created_by", userId);

      const subtree = collectSubtreeIds(params.id, (all as FlatCategory[]) || []);
      if (subtree.has(body.parent_id)) {
        return NextResponse.json(
          { error: "Cannot move a category into its own subtree" },
          { status: 400 }
        );
      }

      // Ensure the new parent belongs to this user.
      const parentExists = (all || []).some((c) => c.id === body.parent_id);
      if (!parentExists) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        );
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.slug !== undefined && body.slug !== "") updatePayload.slug = body.slug;
    if (body.description !== undefined)
      updatePayload.description = body.description || null;
    if (body.parent_id !== undefined)
      updatePayload.parent_id = body.parent_id || null;
    if (body.sort_order !== undefined) updatePayload.sort_order = body.sort_order;
    if (body.icon !== undefined) updatePayload.icon = body.icon || null;
    if (body.color !== undefined) updatePayload.color = body.color || null;
    if (body.is_active !== undefined) updatePayload.is_active = body.is_active;

    const { data, error } = await supabaseAdmin
      .from("categories")
      .update(updatePayload)
      .eq("id", params.id)
      .eq("created_by", userId)
      .select("*")
      .single();

    if (error) {
      const status = error.code === "23505" ? 409 : 404;
      const message =
        error.code === "23505"
          ? "A category with this slug already exists"
          : "Not found or access denied";
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", details: String(err) },
      { status: 400 }
    );
  }
}

// DELETE /api/categories/[id] -> block if it has sub-categories or assigned products
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ownership check.
  const { data: existing } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("id", params.id)
    .eq("created_by", userId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: "Not found or access denied" },
      { status: 404 }
    );
  }

  const { count: childCount } = await supabaseAdmin
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", params.id);

  if (childCount && childCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a category that has sub-categories" },
      { status: 409 }
    );
  }

  const { count: productCount } = await supabaseAdmin
    .from("product_categories")
    .select("id", { count: "exact", head: true })
    .eq("category_id", params.id);

  if (productCount && productCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a category that has assigned products" },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", params.id)
    .eq("created_by", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
