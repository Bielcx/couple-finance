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

/** Formata valores do eixo Y de forma compacta (ex: 1,2k / -500), sem símbolo de moeda. */
function formatAxisValue(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1000) {
    const thousands = abs / 1000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1).replace(".", ",");
    return `${sign}${formatted}k`;
  }

  return `${sign}${abs.toFixed(0)}`;
}

function SelectedDot(props: {
  cx?: number;
  cy?: number;
  payload?: BalancePoint;
  selectedMonth: string;
}) {
  const { cx, cy, payload, selectedMonth } = props;
  if (cx === undefined || cy === undefined || !payload) return null;

  const isSelected = payload.month === selectedMonth;

  if (isSelected) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#8b5cf6" fillOpacity={0.25} />
        <circle cx={cx} cy={cy} r={4.5} fill="#ffffff" stroke="#8b5cf6" strokeWidth={2} />
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={3} fill="#8b5cf6" />;
}

export function BalanceChart({ data, selectedMonth }: { data: BalancePoint[]; selectedMonth: string }) {
  return (
    <div className="h-52 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2044" />
          <XAxis dataKey="month" stroke="#8579a3" fontSize={11} tickMargin={6} />
          <YAxis stroke="#8579a3" fontSize={11} width={44} tickFormatter={formatAxisValue} />
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
            dot={(props) => (
              <SelectedDot
                key={`dot-${props.payload?.month ?? props.cx}`}
                cx={props.cx}
                cy={props.cy}
                payload={props.payload}
                selectedMonth={selectedMonth}
              />
            )}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
