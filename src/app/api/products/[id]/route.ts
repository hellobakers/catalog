import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import {
  getUserIdFromRequest,
  syncProductCategories,
} from "@/src/lib/api-utils";

type ProductCategoryJoin = { categories: unknown };

// Flatten the product_categories(categories(*)) embed into a `categories` array.
function flattenCategories<T extends { product_categories?: ProductCategoryJoin[] }>(
  product: T
) {
  const { product_categories, ...rest } = product;
  return {
    ...rest,
    categories: (product_categories || [])
      .map((pc) => pc.categories)
      .filter(Boolean),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      `*,
      product_images (
        id,
        image_url,
        is_primary
      ),
      product_categories (
        categories (*)
      )`
    )
    .eq("id", params.id)
    .eq("created_by", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: flattenCategories(data) });
}

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

    const { data, error } = await supabaseAdmin
      .from("products")
      .update({
        name: body.name,
        unique_product_id: body.unique_product_id,
        description: body.description || null,
        location_1: body.location_1 || null,
        location_2: body.location_2 || null,
        website_url: body.website_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("created_by", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    }

    // Replace category links when the client sends an explicit list.
    if (Array.isArray(body.category_ids)) {
      await syncProductCategories(params.id, body.category_ids, userId);
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", params.id)
    .eq("created_by", userId);

  if (error) {
    return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
