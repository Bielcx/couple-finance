"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export interface BalancePoint {
  month: string;
  saldo: number;
}

export function BalanceChart({ data }: { data: BalancePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232735" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => formatCurrency(value).replace("R$", "")}
          />
          <Tooltip
            contentStyle={{
              background: "#151821",
              border: "1px solid #232735",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => [formatCurrency(value), "Saldo"]}
          />
          <ReferenceLine y={0} stroke="#6366f1" strokeDasharray="4 4" label={{ value: "Equilíbrio", fill: "#6366f1", fontSize: 11, position: "insideTopLeft" }} />
          <Line
            type="monotone"
            dataKey="saldo"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
