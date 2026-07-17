"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SplitType } from "@/lib/types";

export async function addTripExpense(tripId: string, formData: FormData) {
  const supabase = await createClient();

  const description = formData.get("description") as string;
  const amount = Number(formData.get("amount"));
  const paid_by = formData.get("paid_by") as string;
  const split_type = (formData.get("split_type") as SplitType) || "50_50";
  const split_percent_a = formData.get("split_percent_a")
    ? Number(formData.get("split_percent_a"))
    : null;
  const occurred_on = (formData.get("occurred_on") as string) || new Date().toISOString().slice(0, 10);

  await supabase.from("trip_expenses").insert({
    trip_id: tripId,
    description,
    amount,
    paid_by,
    split_type,
    split_percent_a,
    occurred_on,
  });

  revalidatePath(`/viagens/${tripId}`);
  revalidatePath("/viagens");
}

export async function deleteTripExpense(tripId: string, expenseId: string) {
  const supabase = await createClient();
  await supabase.from("trip_expenses").delete().eq("id", expenseId);
  revalidatePath(`/viagens/${tripId}`);
  revalidatePath("/viagens");
}
