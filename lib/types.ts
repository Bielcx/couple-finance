export type SplitType = "50_50" | "integral" | "custom";
export type CategoryKind = "fixed" | "variable" | "income";
export type TransactionType = "expense" | "income";

export interface Profile {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: CategoryKind;
  created_at: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category_id: string | null;
  due_day: number;
  responsible_id: string | null;
  split_type: SplitType;
  split_percent_a: number | null;
  active: boolean;
  notes: string | null;
  created_at: string;
}

export interface FixedExpensePayment {
  id: string;
  fixed_expense_id: string;
  month_ref: string; // YYYY-MM-01
  paid: boolean;
  paid_by: string | null;
  paid_at: string | null;
  amount_override: number | null;
}

export interface FixedIncome {
  id: string;
  name: string;
  amount: number;
  category_id: string | null;
  profile_id: string; // dono do rendimento (quem recebe)
  receive_day: number;
  active: boolean;
  notes: string | null;
  created_at: string;
}

export interface FixedIncomeReceipt {
  id: string;
  fixed_income_id: string;
  month_ref: string; // YYYY-MM-01
  received: boolean;
  received_at: string | null;
  amount_override: number | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category_id: string | null;
  paid_by: string;
  split_type: SplitType;
  split_percent_a: number | null;
  occurred_on: string; // YYYY-MM-DD
  created_at: string;
}

export type TripStatus = "open" | "closed";

export interface Trip {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: TripStatus;
  created_at: string;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_type: SplitType;
  split_percent_a: number | null;
  occurred_on: string; // YYYY-MM-DD
  created_at: string;
}
