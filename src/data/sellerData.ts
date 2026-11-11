// ============================================================
// Seller Data Engine — Multi-Seller Telemetry & Dynamic Insights
// Supports multiple seller scenarios and custom data editing
// Pre-computed mathematical grounding eliminates hallucinations
// ============================================================

import type { PeriodMetrics, SellerData } from "../types";

/**
 * Pure function to compute all mathematical deltas & business telemetry
 * dynamically for ANY seller profile or custom input.
 */
export function computeSellerInsights(metrics: {
  lastMonth: PeriodMetrics;
  thisMonth: PeriodMetrics;
}): SellerData["computedInsights"] {
  const lm = metrics.lastMonth;
  const tm = metrics.thisMonth;

  // Percentage deltas
  const salesDeclinePct =
    lm.sales > 0
      ? Number((((lm.sales - tm.sales) / lm.sales) * 100).toFixed(1))
      : 0;

  const orderDeclinePct =
    lm.orders > 0
      ? Number((((lm.orders - tm.orders) / lm.orders) * 100).toFixed(1))
      : 0;

  const cancellationIncreasePct =
    lm.cancellationRate > 0
      ? Number(
          (
            ((tm.cancellationRate - lm.cancellationRate) /
              lm.cancellationRate) *
            100
          ).toFixed(1)
        )
      : 0;

  const oosIncreasePct =
    lm.outOfStockProducts > 0
      ? Number(
          (
            ((tm.outOfStockProducts - lm.outOfStockProducts) /
              lm.outOfStockProducts) *
            100
          ).toFixed(1)
        )
      : 0;

  // Revenue loss models
  // Estimated revenue lost from newly OOS items: (OOS delta) * (historical revenue per SKU)
  const oosDelta = Math.max(0, tm.outOfStockProducts - lm.outOfStockProducts);
  const avgMonthlyRevPerSku = lm.outOfStockProducts > 0 ? lm.sales / 40 : 5000;
  const estimatedLostRevenueFromOOS = Math.round(oosDelta * avgMonthlyRevPerSku);

  // Revenue lost from cancellations
  const revenueLostToCancellations = Math.round(
    tm.orders * tm.avgSellingPrice * tm.cancellationRate
  );

  return {
    salesDeclinePct,
    orderDeclinePct,
    cancellationIncreasePct,
    oosIncreasePct,
    estimatedLostRevenueFromOOS,
    revenueLostToCancellations,
  };
}

/** Pre-configured seller profiles representing distinct business scenarios */
export const SELLER_PROFILES: SellerData[] = [
  // 1. Assignment Default Scenario
  {
    seller: {
      name: "SD-FashionHub (Apparel & Footwear)",
      platform: "Snapdeal",
    },
    metrics: {
      lastMonth: {
        sales: 200000,
        orders: 400,
        cancellationRate: 0.08,
        avgSellingPrice: 500,
        outOfStockProducts: 5,
      },
      thisMonth: {
        sales: 135000,
        orders: 270,
        cancellationRate: 0.14,
        avgSellingPrice: 500,
        outOfStockProducts: 18,
      },
    },
    computedInsights: {
      salesDeclinePct: 32.5,
      orderDeclinePct: 32.5,
      cancellationIncreasePct: 75.0,
      oosIncreasePct: 260.0,
      estimatedLostRevenueFromOOS: 65000,
      revenueLostToCancellations: 18900,
    },
  },

  // 2. High Cancellation / Logistics Crisis Scenario
  {
    seller: {
      name: "SD-TechGizmos (Consumer Electronics)",
      platform: "Snapdeal",
    },
    metrics: {
      lastMonth: {
        sales: 450000,
        orders: 450,
        cancellationRate: 0.06,
        avgSellingPrice: 1000,
        outOfStockProducts: 4,
      },
      thisMonth: {
        sales: 270000,
        orders: 270,
        cancellationRate: 0.22, // Critical courier return / damage crisis
        avgSellingPrice: 1000,
        outOfStockProducts: 7,
      },
    },
    computedInsights: {
      salesDeclinePct: 40.0,
      orderDeclinePct: 40.0,
      cancellationIncreasePct: 266.7,
      oosIncreasePct: 75.0,
      estimatedLostRevenueFromOOS: 33750,
      revenueLostToCancellations: 59400,
    },
  },

  // 3. Catastrophic Stockout Scenario
  {
    seller: {
      name: "SD-HomeDecor (Kitchen & Furniture)",
      platform: "Snapdeal",
    },
    metrics: {
      lastMonth: {
        sales: 300000,
        orders: 500,
        cancellationRate: 0.05,
        avgSellingPrice: 600,
        outOfStockProducts: 3,
      },
      thisMonth: {
        sales: 120000,
        orders: 200,
        cancellationRate: 0.06,
        avgSellingPrice: 600,
        outOfStockProducts: 29, // 29 out of stock!
      },
    },
    computedInsights: {
      salesDeclinePct: 60.0,
      orderDeclinePct: 60.0,
      cancellationIncreasePct: 20.0,
      oosIncreasePct: 866.7,
      estimatedLostRevenueFromOOS: 195000,
      revenueLostToCancellations: 7200,
    },
  },
];

/** Default seller data for backwards compatibility */
export let currentSellerData: SellerData = SELLER_PROFILES[0];

export function setCurrentSellerData(data: SellerData): void {
  currentSellerData = data;
}

/** Format currency in Indian Rupees */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format percentage */
export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Get human-readable seller data summary for LLM context dynamically */
export function getSellerDataSummary(data: SellerData = currentSellerData): string {
  const m = data.metrics;
  const i = data.computedInsights;

  return `
SELLER ACCOUNT: ${data.seller.name}
PLATFORM: ${data.seller.platform}
======================================================
Metric              | Last Month       | This Month       | Change
--------------------|------------------|------------------|---------
Sales               | ${formatINR(m.lastMonth.sales).padEnd(16)} | ${formatINR(m.thisMonth.sales).padEnd(16)} | ↓ ${i.salesDeclinePct}%
Orders              | ${String(m.lastMonth.orders).padEnd(16)} | ${String(m.thisMonth.orders).padEnd(16)} | ↓ ${i.orderDeclinePct}%
Cancellation Rate   | ${formatPct(m.lastMonth.cancellationRate * 100).padEnd(16)} | ${formatPct(m.thisMonth.cancellationRate * 100).padEnd(16)} | ↑ ${i.cancellationIncreasePct}%
Avg Selling Price   | ${formatINR(m.lastMonth.avgSellingPrice).padEnd(16)} | ${formatINR(m.thisMonth.avgSellingPrice).padEnd(16)} | ${m.lastMonth.avgSellingPrice === m.thisMonth.avgSellingPrice ? "No change" : formatINR(m.thisMonth.avgSellingPrice - m.lastMonth.avgSellingPrice)}
Out-of-Stock Items  | ${String(m.lastMonth.outOfStockProducts).padEnd(16)} | ${String(m.thisMonth.outOfStockProducts).padEnd(16)} | ↑ ${i.oosIncreasePct}%

KEY INSIGHTS (pre-computed, use these numbers directly):
- Sales dropped ${i.salesDeclinePct}% (${formatINR(m.lastMonth.sales)} → ${formatINR(m.thisMonth.sales)})
- Orders fell ${i.orderDeclinePct}% (${m.lastMonth.orders} → ${m.thisMonth.orders})
- Cancellation rate: ${formatPct(m.lastMonth.cancellationRate * 100)} → ${formatPct(m.thisMonth.cancellationRate * 100)} (${i.cancellationIncreasePct}% shift)
- Out-of-stock products: ${m.lastMonth.outOfStockProducts} → ${m.thisMonth.outOfStockProducts} items (↑${i.oosIncreasePct}%)
- Average selling price: ${formatINR(m.lastMonth.avgSellingPrice)} → ${formatINR(m.thisMonth.avgSellingPrice)}
- Estimated revenue lost from OOS items: ~${formatINR(i.estimatedLostRevenueFromOOS)}
- Revenue lost to cancellations: ~${formatINR(i.revenueLostToCancellations)}
`.trim();
}
