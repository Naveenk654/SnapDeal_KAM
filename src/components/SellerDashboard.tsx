// ============================================================
// SellerDashboard — Displays seller metrics & comparison dynamically
// ============================================================

import React from "react";
import type { SellerData } from "../types";
import { formatINR, formatPct } from "../data/sellerData";

interface SellerDashboardProps {
  data: SellerData;
  onEdit?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  data,
  onEdit,
}) => {
  const m = data.metrics;
  const i = data.computedInsights;

  const cards = [
    {
      title: "Monthly Revenue",
      lastMonth: formatINR(m.lastMonth.sales),
      thisMonth: formatINR(m.thisMonth.sales),
      change: `${i.salesDeclinePct > 0 ? "↓" : "↑"} ${Math.abs(i.salesDeclinePct)}%`,
      isNegative: i.salesDeclinePct > 0,
      description: i.salesDeclinePct > 20 ? "Severe top-line contraction" : "Revenue change",
      icon: "💰",
    },
    {
      title: "Completed Orders",
      lastMonth: `${m.lastMonth.orders} orders`,
      thisMonth: `${m.thisMonth.orders} orders`,
      change: `${i.orderDeclinePct > 0 ? "↓" : "↑"} ${Math.abs(i.orderDeclinePct)}%`,
      isNegative: i.orderDeclinePct > 0,
      description: "Order volume trajectory",
      icon: "📦",
    },
    {
      title: "Cancellation Rate",
      lastMonth: formatPct(m.lastMonth.cancellationRate * 100),
      thisMonth: formatPct(m.thisMonth.cancellationRate * 100),
      change: `${i.cancellationIncreasePct > 0 ? "↑" : "↓"} ${Math.abs(i.cancellationIncreasePct)}%`,
      isNegative: i.cancellationIncreasePct > 15,
      description:
        m.thisMonth.cancellationRate > 0.1
          ? "Critical! Algorithm penalty zone"
          : "Healthy fulfillment rate",
      icon: "⚠️",
    },
    {
      title: "Avg. Selling Price (ASP)",
      lastMonth: formatINR(m.lastMonth.avgSellingPrice),
      thisMonth: formatINR(m.thisMonth.avgSellingPrice),
      change:
        m.lastMonth.avgSellingPrice === m.thisMonth.avgSellingPrice
          ? "0.0% (Stable)"
          : `${formatINR(m.thisMonth.avgSellingPrice - m.lastMonth.avgSellingPrice)}`,
      isNegative: m.thisMonth.avgSellingPrice < m.lastMonth.avgSellingPrice,
      neutral: m.lastMonth.avgSellingPrice === m.thisMonth.avgSellingPrice,
      description:
        m.lastMonth.avgSellingPrice === m.thisMonth.avgSellingPrice
          ? "Pricing is constant — rules out price elasticity"
          : "Average order ticket shift",
      icon: "🏷️",
    },
    {
      title: "Out-of-Stock SKUs",
      lastMonth: `${m.lastMonth.outOfStockProducts} items`,
      thisMonth: `${m.thisMonth.outOfStockProducts} items`,
      change: `${i.oosIncreasePct > 0 ? "↑" : "↓"} ${Math.abs(i.oosIncreasePct)}%`,
      isNegative: i.oosIncreasePct > 30,
      description:
        m.thisMonth.outOfStockProducts > 10
          ? `Estimated loss: ~${formatINR(i.estimatedLostRevenueFromOOS)}`
          : "Stock levels nominal",
      icon: "📉",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📊</span> Seller Performance Telemetry
          </h2>
          <p className="text-xs text-gray-500">
            Account: {data.seller.name} • MoM Verified Telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              ✏️ Edit Metrics
            </button>
          )}
          <span className="text-xs px-2.5 py-1 bg-red-50 text-red-700 font-semibold rounded-full border border-red-200">
            {i.salesDeclinePct > 20 ? "⚠️ Action Required" : "Live Monitor"}
          </span>
        </div>
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
        {cards.map((c, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border transition-all ${
              c.isNegative && !c.neutral
                ? "bg-rose-50/40 border-rose-200/80 hover:border-rose-300"
                : "bg-gray-50/60 border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <span>{c.icon}</span> {c.title}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  c.neutral
                    ? "bg-gray-200 text-gray-700"
                    : c.isNegative
                    ? "bg-rose-100 text-rose-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {c.change}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">
                  Last Month
                </span>
                <span className="text-xs text-gray-500 font-medium line-through">
                  {c.lastMonth}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">
                  This Month
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {c.thisMonth}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-200/60 italic">
              {c.description}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom quick insight summary bar */}
      <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
        <span className="text-base">💡</span>
        <div>
          <span className="font-bold">Active KAM Grounding: </span>
          Sales: {i.salesDeclinePct}% drop • Cancellations: {formatPct(m.thisMonth.cancellationRate * 100)} • OOS SKUs: {m.thisMonth.outOfStockProducts} items. Math is pre-computed and dynamically linked to Riya&apos;s system prompt.
        </div>
      </div>
    </div>
  );
};
