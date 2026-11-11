// ============================================================
// SellerEditorModal — Switch Scenarios or Input Custom Seller Telemetry
// Proves multi-user & dynamic data capability for the assignment
// ============================================================

import React, { useState } from "react";
import type { SellerData } from "../types";
import { SELLER_PROFILES, computeSellerInsights } from "../data/sellerData";

interface SellerEditorModalProps {
  currentData: SellerData;
  onSave: (newData: SellerData) => void;
  onClose: () => void;
}

export const SellerEditorModal: React.FC<SellerEditorModalProps> = ({
  currentData,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(currentData.seller.name);
  const [lastSales, setLastSales] = useState(currentData.metrics.lastMonth.sales);
  const [thisSales, setThisSales] = useState(currentData.metrics.thisMonth.sales);
  const [lastOrders, setLastOrders] = useState(currentData.metrics.lastMonth.orders);
  const [thisOrders, setThisOrders] = useState(currentData.metrics.thisMonth.orders);
  const [lastCancel, setLastCancel] = useState(currentData.metrics.lastMonth.cancellationRate * 100);
  const [thisCancel, setThisCancel] = useState(currentData.metrics.thisMonth.cancellationRate * 100);
  const [lastAsp, setLastAsp] = useState(currentData.metrics.lastMonth.avgSellingPrice);
  const [thisAsp, setThisAsp] = useState(currentData.metrics.thisMonth.avgSellingPrice);
  const [lastOos, setLastOos] = useState(currentData.metrics.lastMonth.outOfStockProducts);
  const [thisOos, setThisOos] = useState(currentData.metrics.thisMonth.outOfStockProducts);

  const applyPreset = (preset: SellerData) => {
    setName(preset.seller.name);
    setLastSales(preset.metrics.lastMonth.sales);
    setThisSales(preset.metrics.thisMonth.sales);
    setLastOrders(preset.metrics.lastMonth.orders);
    setThisOrders(preset.metrics.thisMonth.orders);
    setLastCancel(preset.metrics.lastMonth.cancellationRate * 100);
    setThisCancel(preset.metrics.thisMonth.cancellationRate * 100);
    setLastAsp(preset.metrics.lastMonth.avgSellingPrice);
    setThisAsp(preset.metrics.thisMonth.avgSellingPrice);
    setLastOos(preset.metrics.lastMonth.outOfStockProducts);
    setThisOos(preset.metrics.thisMonth.outOfStockProducts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const metrics = {
      lastMonth: {
        sales: Number(lastSales),
        orders: Number(lastOrders),
        cancellationRate: Number(lastCancel) / 100,
        avgSellingPrice: Number(lastAsp),
        outOfStockProducts: Number(lastOos),
      },
      thisMonth: {
        sales: Number(thisSales),
        orders: Number(thisOrders),
        cancellationRate: Number(thisCancel) / 100,
        avgSellingPrice: Number(thisAsp),
        outOfStockProducts: Number(thisOos),
      },
    };

    const computedInsights = computeSellerInsights(metrics);

    const updatedSellerData: SellerData = {
      seller: {
        name,
        platform: "Snapdeal",
      },
      metrics,
      computedInsights,
    };

    onSave(updatedSellerData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              ⚙️ Switch or Customize Seller Account
            </h2>
            <p className="text-xs text-gray-500">
              Test how the AI KAM dynamically adapts its questions & recommendations to different sellers
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div className="my-4">
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            Select Pre-Built Scenario:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SELLER_PROFILES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className={`p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                  name === p.seller.name
                    ? "bg-red-50 border-red-500 text-red-950 font-bold"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <div className="font-semibold truncate">{p.seller.name}</div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Sales: ₹{p.metrics.thisMonth.sales.toLocaleString()} (↓{p.computedInsights.salesDeclinePct}%)
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Data Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Seller Name / Account Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Sales */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-700 block mb-2">
                Monthly Sales (₹)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block">Last Month</label>
                  <input
                    type="number"
                    value={lastSales}
                    onChange={(e) => setLastSales(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block">This Month</label>
                  <input
                    type="number"
                    value={thisSales}
                    onChange={(e) => setThisSales(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white font-bold text-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Orders */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-700 block mb-2">
                Orders Completed
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block">Last Month</label>
                  <input
                    type="number"
                    value={lastOrders}
                    onChange={(e) => setLastOrders(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block">This Month</label>
                  <input
                    type="number"
                    value={thisOrders}
                    onChange={(e) => setThisOrders(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white font-bold text-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Cancellation Rate */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-700 block mb-2">
                Cancellation Rate (%)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block">Last Month (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={lastCancel}
                    onChange={(e) => setLastCancel(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block">This Month (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={thisCancel}
                    onChange={(e) => setThisCancel(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white font-bold text-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Out of Stock Products */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-700 block mb-2">
                Out-of-Stock SKUs
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block">Last Month</label>
                  <input
                    type="number"
                    value={lastOos}
                    onChange={(e) => setLastOos(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block">This Month</label>
                  <input
                    type="number"
                    value={thisOos}
                    onChange={(e) => setThisOos(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded bg-white font-bold text-red-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer"
            >
              Apply Scenario to KAM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

