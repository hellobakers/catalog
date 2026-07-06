import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";
import { getUserIdFromRequest } from "@/src/lib/api-utils";

interface ReorderItem {
  id: string;
  sort_order: number;
}

// PUT /api/categories/reorder -> bulk-update sort_order for the user's categories
export async function PUT(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items: ReorderItem[] = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ success: true });
    }

    const ids = items.map((i) => i.id);

    // Verify every id belongs to this user before writing.
    const { data: owned, error: ownErr } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("created_by", userId)
      .in("id", ids);

    if (ownErr) {
      return NextResponse.json({ error: ownErr.message }, { status: 500 });
    }

    const ownedIds = new Set((owned || []).map((c) => c.id));
    if (ownedIds.size !== ids.length) {
      return NextResponse.json(
        { error: "One or more categories are not accessible" },
        { status: 403 }
      );
    }

    // Update each row's sort_order (scoped to owner as a second guard).
    await Promise.all(
      items.map((item) =>
        supabaseAdmin
          .from("categories")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id)
          .eq("created_by", userId)
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", details: String(err) },
      { status: 400 }
    );
  }
}
