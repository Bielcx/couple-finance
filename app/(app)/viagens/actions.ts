"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTrip(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const destination = (formData.get("destination") as string) || null;
  const start_date = (formData.get("start_date") as string) || null;
  const end_date = (formData.get("end_date") as string) || null;

  const { data } = await supabase
    .from("trips")
    .insert({ name, destination, start_date, end_date })
    .select("id")
    .single();

  revalidatePath("/viagens");

  if (data) {
    redirect(`/viagens/${data.id}`);
  }
}

export async function toggleTripStatus(id: string, currentlyOpen: boolean) {
  const supabase = await createClient();
  await supabase
    .from("trips")
    .update({ status: currentlyOpen ? "closed" : "open" })
    .eq("id", id);

  revalidatePath("/viagens");
  revalidatePath(`/viagens/${id}`);
}

export async function deleteTrip(id: string) {
  const supabase = await createClient();
  await supabase.from("trips").delete().eq("id", id);
  revalidatePath("/viagens");
}
