"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SplitType, TransactionType } from "@/lib/types";

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();

  const type = formData.get("type") as TransactionType;
  const description = formData.get("description") as string;
  const amount = Number(formData.get("amount"));
  const category_id = (formData.get("category_id") as string) || null;
  const paid_by = formData.get("paid_by") as string;
  const split_type = (formData.get("split_type") as SplitType) || "50_50";
  const split_percent_a = formData.get("split_percent_a")
    ? Number(formData.get("split_percent_a"))
    : null;
  const occurred_on = (formData.get("occurred_on") as string) || new Date().toISOString().slice(0, 10);

  await supabase.from("transactions").insert({
    type,
    description,
    amount,
    category_id,
    paid_by,
    split_type: type === "income" ? "integral" : split_type,
    split_percent_a,
    occurred_on,
  });

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
}
