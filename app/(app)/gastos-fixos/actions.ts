"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SplitType } from "@/lib/types";

export async function createFixedExpense(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const amount = Number(formData.get("amount"));
  const category_id = (formData.get("category_id") as string) || null;
  const due_day = Number(formData.get("due_day"));
  const responsible_id = (formData.get("responsible_id") as string) || null;
  const split_type = formData.get("split_type") as SplitType;
  const split_percent_a = formData.get("split_percent_a")
    ? Number(formData.get("split_percent_a"))
    : null;

  await supabase.from("fixed_expenses").insert({
    name,
    amount,
    category_id,
    due_day,
    responsible_id,
    split_type,
    split_percent_a,
  });

  revalidatePath("/gastos-fixos");
  revalidatePath("/dashboard");
}

export async function deactivateFixedExpense(id: string) {
  const supabase = await createClient();
  await supabase.from("fixed_expenses").update({ active: false }).eq("id", id);
  revalidatePath("/gastos-fixos");
  revalidatePath("/dashboard");
}

export async function togglePayment(
  fixedExpenseId: string,
  paidByProfileId: string,
  currentlyPaid: boolean,
  month_ref: string
) {
  const supabase = await createClient();

  if (currentlyPaid) {
    await supabase
      .from("fixed_expense_payments")
      .delete()
      .eq("fixed_expense_id", fixedExpenseId)
      .eq("month_ref", month_ref);
  } else {
    await supabase.from("fixed_expense_payments").upsert(
      {
        fixed_expense_id: fixedExpenseId,
        month_ref,
        paid: true,
        paid_by: paidByProfileId,
        paid_at: new Date().toISOString(),
      },
      { onConflict: "fixed_expense_id,month_ref" }
    );
  }

  revalidatePath("/gastos-fixos");
  revalidatePath("/dashboard");
}
