"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import CustomerNavigation from '@/components/customer/Navigation';
import { Gift, Award, TrendingUp, History, Info, Calendar, PlusCircle, MinusCircle, Activity } from 'lucide-react';

interface LoyaltyTransaction {
  id: number;
  points_change: number;
  reason: string;
  balance_after: number;
  created_at: string;
  order_id?: number;
}

export default function LoyaltyDashboardPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      try {
        const balanceData = await apiFetch('/loyalty/balance');
        setBalance(balanceData.balance);

        const historyData = await apiFetch('/loyalty/history');
        setHistory(historyData);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve loyalty points data.');
      } finally {
        setLoading(false);
      }
    };
    fetchLoyaltyData();
  }, []);

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      earned: 'Points Earned on Purchase',
      redeemed: 'Points Redeemed for Discount',
      admin_adjustment: 'Points Adjusted by Admin',
      expired: 'Points Reversed / Expired',
    };
    return labels[reason] || reason;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <CustomerNavigation />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Loyalty Rewards
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Earn points on every purchase and redeem them for direct discounts on your future orders.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-slate-900/30 rounded-3xl md:col-span-1" />
            <div className="h-32 bg-slate-900/30 rounded-3xl md:col-span-2" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Balance Card */}
              <div className="p-6 rounded-3xl bg-slate-900/20 border border-slate-900 hover:border-slate-850 transition-all flex flex-col justify-between space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Points Balance
                  </span>
                  <div className="p-2 bg-teal-500/10 rounded-xl text-teal-400">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <span className="text-4xl font-black text-white">{balance ?? 0}</span>
                  <span className="text-xs text-slate-400 block mt-1 font-semibold">
                    Equivalent to ₹{((balance ?? 0) / 10).toFixed(2)} off
                  </span>
                </div>
              </div>

              {/* Rules/Info Card */}
              <div className="p-6 rounded-3xl bg-slate-900/20 border border-slate-900 hover:border-slate-850 transition-all md:col-span-2 space-y-4 backdrop-blur-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                  <Info className="h-4.5 w-4.5 text-teal-400" />
                  Program Benefits & Rules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-400">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 bg-slate-950 rounded-lg text-teal-400 mt-0.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-slate-200">Earning points</p>
                      <p className="text-xxs text-slate-500 font-medium">Earn 1 loyalty point for every ₹100 spent on completed orders.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 bg-slate-950 rounded-lg text-teal-400 mt-0.5">
                      <Gift className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-slate-200">Redeeming points</p>
                      <p className="text-xxs text-slate-500 font-medium">Redeem points at checkout (10 points = ₹1 off). Minimum 100 points required to redeem.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-teal-400" />
                Points Transaction History
              </h3>

              {history.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 space-y-2">
                  <p className="text-sm text-slate-500">No point transactions found.</p>
                  <p className="text-xxs text-slate-655 max-w-xs mx-auto">Place your first order to start earning points!</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-900 rounded-3xl bg-slate-900/10 backdrop-blur-xl">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-900 text-xs">
                      <thead>
                        <tr className="bg-slate-950/40 text-slate-450 uppercase font-bold tracking-wider text-left">
                          <th className="px-6 py-4">Transaction Details</th>
                          <th className="px-6 py-4">Reason</th>
                          <th className="px-6 py-4">Points Change</th>
                          <th className="px-6 py-4">Balance After</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 font-medium">
                        {history.map((tx) => {
                          const isPositive = tx.points_change > 0;
                          return (
                            <tr key={tx.id} className="hover:bg-slate-900/10 transition-colors">
                              <td className="px-6 py-4 text-slate-350">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-slate-200">
                                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                                  </div>
                                  {tx.order_id && (
                                    <span className="text-[10px] text-slate-550 block">
                                      Order Ref: #OR-{tx.order_id}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-300">
                                {getReasonLabel(tx.reason)}
                              </td>
                              <td className="px-6 py-4 font-bold text-sm">
                                <span className={`inline-flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isPositive ? (
                                    <>
                                      <PlusCircle className="h-4 w-4" />
                                      +{tx.points_change}
                                    </>
                                  ) : (
                                    <>
                                      <MinusCircle className="h-4 w-4" />
                                      {tx.points_change}
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-400 font-bold">
                                {tx.balance_after} pts
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-teal-400/50" />
          <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Loyalty Hub · 2026</span>
        </div>
      </footer>
    </div>
  );
}
