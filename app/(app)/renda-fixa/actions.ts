"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentMonthRef } from "@/lib/utils";

export async function createFixedIncome(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const amount = Number(formData.get("amount"));
  const category_id = (formData.get("category_id") as string) || null;
  const profile_id = formData.get("profile_id") as string;
  const receive_day = Number(formData.get("receive_day"));

  await supabase.from("fixed_incomes").insert({
    name,
    amount,
    category_id,
    profile_id,
    receive_day,
  });

  revalidatePath("/renda-fixa");
  revalidatePath("/dashboard");
}

export async function deactivateFixedIncome(id: string) {
  const supabase = await createClient();
  await supabase.from("fixed_incomes").update({ active: false }).eq("id", id);
  revalidatePath("/renda-fixa");
  revalidatePath("/dashboard");
}

export async function toggleReceipt(fixedIncomeId: string, currentlyReceived: boolean) {
  const supabase = await createClient();
  const month_ref = currentMonthRef();

  if (currentlyReceived) {
    await supabase
      .from("fixed_income_receipts")
      .delete()
      .eq("fixed_income_id", fixedIncomeId)
      .eq("month_ref", month_ref);
  } else {
    await supabase.from("fixed_income_receipts").upsert(
      {
        fixed_income_id: fixedIncomeId,
        month_ref,
        received: true,
        received_at: new Date().toISOString(),
      },
      { onConflict: "fixed_income_id,month_ref" }
    );
  }

  revalidatePath("/renda-fixa");
  revalidatePath("/dashboard");
}
