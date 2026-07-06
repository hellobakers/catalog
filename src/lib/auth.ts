import { supabase } from "./supabaseClient";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export async function login(email: string, password: string) {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (error || !user) {
    return { success: false, error: "Invalid email or password" };
  }

  if (!user.is_active) {
    return {
      success: false,
      error: "Account is disabled. Please contact support.",
    };
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }

  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (sessionError) {
    console.error("Session creation error:", sessionError);
    return { success: false, error: "Failed to create session" };
  }

  await supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", user.id);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
    },
    token,
    session,
  };
}
