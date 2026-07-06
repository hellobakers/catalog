import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { supabase } from "@/src/lib/supabaseClient";
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = supabaseAdmin
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
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,unique_product_id.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data || []).map(flattenCategories) });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("auth_token")?.value;
  const token = authHeader?.replace("Bearer ", "") || cookieToken;

  if (!token) {
    return NextResponse.json({ error: "No auth token" }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("sessions").delete().eq("token", token);
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const userId = session.user_id;
  const keyPresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const body = await request.json();

    const insertPayload = {
      name: body.name,
      unique_product_id: body.unique_product_id,
      description: body.description || null,
      location_1: body.location_1 || null,
      location_2: body.location_2 || null,
      website_url: body.website_url || null,
      created_by: userId,
    };

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from("products")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("products")
      .update({ created_by: userId })
      .eq("id", insertResult.id)
      .select(`*,
        product_images (id, image_url, is_primary)
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Link any selected categories (owned by this user) to the new product.
    if (Array.isArray(body.category_ids)) {
      await syncProductCategories(insertResult.id, body.category_ids, userId);
    }

    return NextResponse.json({
      data: updated,
      debug: { userId, keyPresent },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({
      error: "Invalid request body",
      details: String(err),
    }, { status: 400 });
  }
}
