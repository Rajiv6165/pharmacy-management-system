"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import StaffNavigation from '@/components/staff/Navigation';
import { Tag, Plus, Calendar, Settings, List, Trash2, Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit_total?: number;
  usage_limit_per_user: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  usage_count: number;
}

interface CouponUsage {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  order_id: number;
  discount_applied: number;
  used_at: string;
}

export default function StaffCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimitTotal, setUsageLimitTotal] = useState('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState('1');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Usage modal state
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponUsages, setCouponUsages] = useState<CouponUsage[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);

  const fetchCoupons = async () => {
    try {
      const data = await apiFetch('/staff/coupons');
      setCoupons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!code || !discountValue || !validFrom || !validUntil) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_order_amount: parseFloat(minOrderAmount) || 0,
        max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        usage_limit_total: usageLimitTotal ? parseInt(usageLimitTotal) : null,
        usage_limit_per_user: parseInt(usageLimitPerUser) || 1,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil).toISOString(),
        is_active: true,
      };

      await apiFetch('/staff/coupons', {
        method: 'POST',
        body: payload,
      });

      setSuccess('Coupon created successfully!');
      setShowCreate(false);
      // Reset form
      setCode('');
      setDescription('');
      setDiscountValue('');
      setMinOrderAmount('0');
      setMaxDiscountAmount('');
      setUsageLimitTotal('');
      setUsageLimitPerUser('1');
      setValidFrom('');
      setValidUntil('');
      
      fetchCoupons();
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon.');
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/staff/coupons/${coupon.id}`, {
        method: 'PUT',
        body: {
          is_active: !coupon.is_active,
        },
      });
      setSuccess(`Coupon ${coupon.code} updated successfully.`);
      fetchCoupons();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle coupon status.');
    }
  };

  const handleViewUsages = async (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setLoadingUsages(true);
    try {
      const data = await apiFetch(`/staff/coupons/${coupon.id}/usage`);
      setCouponUsages(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupon usages.');
    } finally {
      setLoadingUsages(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <StaffNavigation />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Coupons Control</h1>
            <p className="mt-2 text-sm text-slate-400 font-medium">
              Create and manage promotional discount coupons for pharmacy checkouts.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-1.5 py-3 px-5 bg-violet-400 hover:bg-violet-350 text-slate-950 font-bold rounded-2xl text-sm transition-all shadow-md shadow-violet-500/10 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {showCreate ? 'View Coupons' : 'New Promo Coupon'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-sm rounded-2xl">
            {success}
          </div>
        )}

        {showCreate ? (
          /* Create Coupon Form */
          <div className="p-8 bg-slate-900/20 border border-slate-900 rounded-3xl max-w-2xl mx-auto space-y-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-3">
              <Tag className="text-violet-450 h-5.5 w-5.5" />
              Configure Coupon Rules
            </h2>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-semibold text-slate-400">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-xxs">Coupon Code (Mandatory)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME10"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 uppercase placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-xxs">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Cash (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 uppercase tracking-wider text-xxs">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Flat ₹50 off for first order"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-xxs">Discount Value</label>
                  <input
                    type="number"
                    required
                    placeholder="10 or 50"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-xxs">Min Order Value</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-xxs">Max Discount Cap (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-xxs">Total Usage Limit</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={usageLimitTotal}
                    onChange={(e) => setUsageLimitTotal(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-xxs">Limit Per User</label>
                  <input
                    type="number"
                    value={usageLimitPerUser}
                    onChange={(e) => setUsageLimitPerUser(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-xxs">Valid From (Date & Time)</label>
                  <input
                    type="datetime-local"
                    required
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 uppercase tracking-wider text-xxs">Valid Until (Date & Time)</label>
                  <input
                    type="datetime-local"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 border border-transparent rounded-2xl text-sm font-extrabold text-slate-950 bg-violet-400 hover:bg-violet-350 transition-all shadow-lg shadow-violet-500/20 cursor-pointer"
              >
                Create Promo Coupon
              </button>
            </form>
          </div>
        ) : (
          /* Coupons List Table */
          <div className="space-y-6">
            {loading ? (
              <div className="h-64 bg-slate-900/30 rounded-3xl animate-pulse" />
            ) : coupons.length === 0 ? (
              <div className="p-16 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/10 space-y-4">
                <Tag className="h-10 w-10 text-slate-650 mx-auto" />
                <h3 className="text-lg font-bold text-slate-350">No Coupons Available</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Create discount codes for flat prices or percentage caps to stimulate checkout sales.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden border border-slate-900 rounded-3xl bg-slate-900/10 backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-900 text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-950/40 text-slate-500 uppercase font-bold tracking-wider text-left">
                        <th className="px-6 py-4">Coupon Info</th>
                        <th className="px-6 py-4">Benefit</th>
                        <th className="px-6 py-4">Restrictions</th>
                        <th className="px-6 py-4">Usage stats</th>
                        <th className="px-6 py-4">Validity status</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-medium">
                      {coupons.map((c) => {
                        const now = new Date();
                        const validFromDate = new Date(c.valid_from);
                        const validUntilDate = new Date(c.valid_until);
                        const isExpired = now > validUntilDate;
                        const isNotStarted = now < validFromDate;

                        let statusBadge = (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 rounded">Active</span>
                        );
                        if (!c.is_active) {
                          statusBadge = (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-500 border border-slate-700 rounded">Deactivated</span>
                          );
                        } else if (isExpired) {
                          statusBadge = (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">Expired</span>
                          );
                        } else if (isNotStarted) {
                          statusBadge = (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">Scheduled</span>
                          );
                        }

                        return (
                          <tr key={c.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <span className="font-extrabold text-sm text-white bg-slate-900 border border-slate-800 rounded px-2 py-0.5 uppercase tracking-wide">
                                  {c.code}
                                </span>
                                <p className="text-slate-400 text-xxs pt-1 max-w-[200px] leading-relaxed truncate">
                                  {c.description || 'No description'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {c.discount_type === 'percentage' ? (
                                <div className="space-y-0.5">
                                  <span className="text-white text-sm font-black">{c.discount_value}% Off</span>
                                  {c.max_discount_amount && (
                                    <span className="text-xxs text-slate-550 block">Cap: ₹{c.max_discount_amount}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-white text-sm font-black">₹{c.discount_value} Off</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xxs space-y-0.5 leading-relaxed">
                              <p>Min Order: ₹{c.min_order_amount}</p>
                              {c.usage_limit_total && <p>Total Cap: {c.usage_limit_total} uses</p>}
                              <p>Per User: {c.usage_limit_per_user} time(s)</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-extrabold text-sm">{c.usage_count}</span>
                                {c.usage_count > 0 && (
                                  <button
                                    onClick={() => handleViewUsages(c)}
                                    className="p-1 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-slate-900 cursor-pointer"
                                    title="View Usages"
                                  >
                                    <List className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xxs space-y-1">
                              <div>{statusBadge}</div>
                              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{validFromDate.toLocaleDateString()} - {validUntilDate.toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleToggleStatus(c)}
                                className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                                  c.is_active
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                                title={c.is_active ? 'Deactivate Coupon' : 'Activate Coupon'}
                              >
                                {c.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
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
        )}

        {/* Usages Modal */}
        {selectedCoupon && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Tag className="h-5 w-5 text-violet-400" />
                    Usage Logs: {selectedCoupon.code}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">History of orders that redeemed this promo coupon.</p>
                </div>
                <button
                  onClick={() => setSelectedCoupon(null)}
                  className="py-1 px-3 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {loadingUsages ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-10 bg-slate-800/40 rounded-xl" />
                    <div className="h-10 bg-slate-800/40 rounded-xl" />
                  </div>
                ) : couponUsages.length === 0 ? (
                  <p className="text-center text-xs text-slate-550 py-6">No order usages found.</p>
                ) : (
                  <div className="overflow-hidden border border-slate-800 rounded-2xl bg-slate-950/30">
                    <table className="min-w-full text-xs font-semibold">
                      <thead>
                        <tr className="bg-slate-950/70 text-slate-500 uppercase font-bold tracking-wider text-left border-b border-slate-800">
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Order Ref</th>
                          <th className="px-4 py-3">Discount Applied</th>
                          <th className="px-4 py-3">Used At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-medium">
                        {couponUsages.map((usage) => (
                          <tr key={usage.id} className="hover:bg-slate-900/10">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-white font-bold">{usage.customer_name}</p>
                                <p className="text-xxs text-slate-500 font-semibold">{usage.customer_phone}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              #OR-{usage.order_id}
                            </td>
                            <td className="px-4 py-3 text-emerald-450 font-black">
                              -₹{Number(usage.discount_applied).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-slate-450">
                              {new Date(usage.used_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
