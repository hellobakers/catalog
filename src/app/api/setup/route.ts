import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: existing } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", "admin@inventory.com")
      .maybeSingle();

    if (existing) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password_hash: passwordHash,
          is_active: true,
        })
        .eq("id", existing.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update admin user", details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Admin user password reset successfully",
        email: "admin@inventory.com",
        password: "admin123",
        hash_length: passwordHash.length,
      });
    }

    const passwordHash = await bcrypt.hash("admin123", 10);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email: "admin@inventory.com",
        password_hash: passwordHash,
        full_name: "Admin",
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create admin user", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Admin user created successfully",
      email: "admin@inventory.com",
      password: "admin123",
      user: newUser,
      hash_length: passwordHash.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Setup failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
