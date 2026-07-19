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
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <CustomerNavigation />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold font-serif text-primary-dark tracking-tight sm:text-4xl">
            Loyalty Rewards
          </h1>
          <p className="mt-1 text-xs text-ink/70">
            Earn points on every purchase and redeem them for direct discounts on your future orders.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded font-mono uppercase tracking-wider">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-white border border-primary-dark/10 rounded md:col-span-1" />
            <div className="h-32 bg-white border border-primary-dark/10 rounded md:col-span-2" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Balance Card */}
              <div className="p-6 rounded bg-white border border-primary-dark/15 hover:border-accent/30 transition-colors flex flex-col justify-between space-y-4 shadow-xxs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                    Points Balance
                  </span>
                  <div className="p-2 bg-accent/10 border border-accent/20 rounded text-accent">
                    <Award className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div>
                  <span className="text-4xl font-mono font-bold text-primary-dark">{balance ?? 0}</span>
                  <span className="text-xs text-ink/60 block mt-1 font-sans">
                    Equivalent to <span className="font-mono">₹{((balance ?? 0) / 10).toFixed(2)}</span> off
                  </span>
                </div>
              </div>

              {/* Rules/Info Card */}
              <div className="p-6 rounded bg-white border border-primary-dark/15 hover:border-accent/30 transition-colors md:col-span-2 space-y-4 shadow-xxs">
                <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-1.5 border-b border-primary-dark/10 pb-3">
                  <Info className="h-4.5 w-4.5 text-accent" />
                  Program Benefits & Rules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans text-ink">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 bg-paper border border-primary-dark/10 rounded text-accent mt-0.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-primary-dark">Earning points</p>
                      <p className="text-[10px] text-ink/65 leading-relaxed mt-0.5">Earn 1 loyalty point for every ₹100 spent on completed orders.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 bg-paper border border-primary-dark/10 rounded text-accent mt-0.5">
                      <Gift className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-primary-dark">Redeeming points</p>
                      <p className="text-[10px] text-ink/65 leading-relaxed mt-0.5">Redeem points at checkout (10 points = ₹1 off). Min 100 points required to redeem.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-primary-dark flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-accent" />
                Points Transaction History
              </h3>

              {history.length === 0 ? (
                <div className="p-12 text-center rounded bg-white border border-primary-dark/15 space-y-2 shadow-xxs">
                  <p className="text-xs text-ink/50 font-sans">No point transactions found.</p>
                  <p className="text-[10px] text-ink/40 font-mono">Place your first order to start earning points!</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-primary-dark/15 rounded bg-white shadow-xxs">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-primary-dark/10 text-xs">
                      <thead>
                        <tr className="bg-paper/85 text-accent font-mono font-bold text-[10px] uppercase tracking-wider text-left border-b border-primary-dark/10">
                          <th className="px-6 py-3.5">Transaction Details</th>
                          <th className="px-6 py-3.5">Reason</th>
                          <th className="px-6 py-3.5">Points Change</th>
                          <th className="px-6 py-3.5">Balance After</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary-dark/10 font-sans text-ink/80">
                        {history.map((tx) => {
                          const isPositive = tx.points_change > 0;
                          return (
                            <tr key={tx.id} className="hover:bg-paper/40 transition-colors">
                              <td className="px-6 py-4 text-ink/60">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-primary-dark font-mono text-xs">
                                    <Calendar className="h-3.5 w-3.5 text-accent" />
                                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                                  </div>
                                  {tx.order_id && (
                                    <span className="text-[10px] text-ink/40 block font-mono">
                                      ORDER REF: #OR-{tx.order_id}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium">
                                {getReasonLabel(tx.reason)}
                              </td>
                              <td className="px-6 py-4 font-mono font-bold text-sm">
                                <span className={`inline-flex items-center gap-1 ${isPositive ? 'text-accent' : 'text-rose-600'}`}>
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
                              <td className="px-6 py-4 text-primary-dark font-mono font-bold">
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

      <footer className="border-t border-primary-dark/10 bg-primary-dark py-8 mt-12 text-paper/70 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-highlight" />
          <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Loyalty Hub · 2026</span>
        </div>
      </footer>
    </div>
  );
}
