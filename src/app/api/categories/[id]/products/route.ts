import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { getUserIdFromRequest } from "@/src/lib/api-utils";

// GET /api/categories/[id]/products?page=&pageSize= -> paginated products in a category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10))
  );
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, error, count } = await supabaseAdmin
    .from("products")
    .select(
      `*,
      product_images (id, image_url, is_primary),
      product_categories!inner (category_id)`,
      { count: "exact" }
    )
    .eq("created_by", userId)
    .eq("product_categories.category_id", params.id)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    count: count || 0,
    page,
    pageSize,
  });
}
