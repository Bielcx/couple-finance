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
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2044" />
          <XAxis dataKey="month" stroke="#8579a3" fontSize={12} />
          <YAxis
            stroke="#8579a3"
            fontSize={12}
            tickFormatter={(value) => formatCurrency(value).replace("R$", "")}
          />
          <Tooltip
            contentStyle={{
              background: "#160f24",
              border: "1px solid #2a2044",
              borderRadius: 16,
              fontSize: 12,
            }}
            labelStyle={{ color: "#f5f3ff" }}
            formatter={(value: number) => [formatCurrency(value), "Saldo"]}
          />
          <ReferenceLine
            y={0}
            stroke="#8b5cf6"
            strokeDasharray="4 4"
            label={{ value: "Equilíbrio", fill: "#8b5cf6", fontSize: 11, position: "insideTopLeft" }}
          />
          <Line
            type="monotone"
            dataKey="saldo"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#8b5cf6" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
