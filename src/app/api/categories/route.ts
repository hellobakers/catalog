import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { getUserIdFromRequest } from "@/src/lib/api-utils";

// GET /api/categories -> all of the current user's categories (flat) with product_count
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: categories, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("created_by", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Tally product counts per category, scoped to the user's own products.
  const { data: links, error: linkError } = await supabaseAdmin
    .from("product_categories")
    .select("category_id, products!inner(created_by)")
    .eq("products.created_by", userId);

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const row of links || []) {
    const id = (row as { category_id: string }).category_id;
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  const withCounts = (categories || []).map((c) => ({
    ...c,
    product_count: counts.get(c.id) || 0,
  }));

  return NextResponse.json({ data: withCounts });
}

// POST /api/categories -> create a category owned by the current user
export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Validate parent (if any) belongs to this user.
    if (body.parent_id) {
      const { data: parent } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("id", body.parent_id)
        .eq("created_by", userId)
        .maybeSingle();
      if (!parent) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        );
      }
    }

    const insertPayload: Record<string, unknown> = {
      name: body.name,
      description: body.description || null,
      parent_id: body.parent_id || null,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      icon: body.icon || null,
      color: body.color || null,
      is_active: body.is_active ?? true,
      created_by: userId,
    };

    // Only set slug when provided; otherwise the DB trigger generates it.
    if (body.slug) {
      insertPayload.slug = body.slug;
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      // 23505 = unique_violation (duplicate slug)
      const status = error.code === "23505" ? 409 : 500;
      const message =
        error.code === "23505"
          ? "A category with this slug already exists"
          : error.message;
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", details: String(err) },
      { status: 400 }
    );
  }
}
