"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "");

  if (!id || !name) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ name, color }).eq("id", id);

  // nome aparece em todas as telas
  revalidatePath("/", "layout");
}
