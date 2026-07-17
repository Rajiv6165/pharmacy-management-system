"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Order } from '@/lib/types';
import StaffNavigation from '@/components/staff/Navigation';
import { 
  ChevronLeft, Package, Calendar, CreditCard, 
  MapPin, FileText, CheckCircle2, XCircle, Clock, ShieldAlert 
} from 'lucide-react';

export default function StaffOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchOrderDetails = useCallback(async () => {
    try {
      const data = await apiFetch(`/orders/${id}`);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Handle prescription validation
  const handleVerifyPrescription = async (prescriptionId: number, verified: boolean) => {
    if (!verified && !rejectionReason.trim()) {
      alert('Please specify a rejection reason for this prescription.');
      return;
    }

    setError('');
    setActioning(true);

    try {
      await apiFetch(`/staff/prescriptions/${prescriptionId}/verify`, {
        method: 'PUT',
        body: {
          verified,
          rejection_reason: verified ? undefined : rejectionReason.trim(),
        },
      });
      setRejectionReason('');
      fetchOrderDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to update prescription verification status.');
    } finally {
      setActioning(false);
    }
  };

  // Handle status transitions
  const handleUpdateStatus = async (statusVal: string) => {
    setError('');
    setActioning(true);

    try {
      await apiFetch(`/staff/orders/${order?.id}/status`, {
        method: 'PUT',
        body: { status: statusVal },
      });
      fetchOrderDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to update order status.');
      setActioning(false);
    } finally {
      setActioning(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      rx_pending: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      confirmed: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      preparing: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      out_for_delivery: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      ready_for_pickup: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
      completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      cancelled: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    };
    return colors[status] || 'text-slate-405 bg-slate-900 border-slate-800';
  };

  const isPendingRx = order?.status === 'rx_pending';

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <StaffNavigation />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/staff/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Queue
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-96 bg-slate-900/30 rounded-3xl animate-pulse" />
        ) : !order ? (
          <div className="p-12 text-center border border-slate-900 rounded-3xl bg-slate-900/10">
            <h3 className="text-xl font-bold">Order Not Found</h3>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header card */}
            <div className="p-8 rounded-3xl bg-slate-900/20 border border-slate-900 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                  Fulfillment Ticket #OR-{order.id}
                </span>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-white">Fulfillment Details</h1>
                  <span className={`inline-flex items-center border px-3 py-1 rounded-xl text-xxs font-extrabold uppercase ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Received {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <span className="text-xxs text-slate-550 font-bold uppercase tracking-wider block md:text-right">
                  Order Revenue
                </span>
                <span className="text-2xl font-black text-violet-400">
                  ₹{Number(order.total_amount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Step: Prescription Verification */}
            {isPendingRx && order.prescriptions.map((pres) => (
              <div key={pres.id} className="p-8 bg-violet-950/5 border border-violet-900/20 rounded-3xl space-y-6">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-lg">
                  <FileText className="h-6 w-6" />
                  <h2>Pending Pharmacist Prescription Review</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* File preview info */}
                  <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-3">
                    <span className="text-xxs text-slate-500 font-bold uppercase tracking-wider block">
                      Uploaded File
                    </span>
                    <p className="text-xs font-bold text-white break-all">
                      {pres.file_url.split('/').pop()}
                    </p>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}${pres.file_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 py-2.5 px-4 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Open File in New Tab
                    </a>
                  </div>

                  {/* Actions form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Rejection Reason <span className="text-slate-600">(Mandatory if rejecting)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Outdated prescription date, mismatched medicine name"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleVerifyPrescription(pres.id, true)}
                        disabled={actioning}
                        className="flex-grow py-3 px-4 border border-transparent rounded-2xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-350 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve Rx
                      </button>
                      <button
                        onClick={() => handleVerifyPrescription(pres.id, false)}
                        disabled={actioning}
                        className="flex-grow py-3 px-4 border border-transparent rounded-2xl text-xs font-bold text-slate-950 bg-rose-400 hover:bg-rose-350 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Rx
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Step: Advance Order Status */}
            {order.status !== 'cancelled' && order.status !== 'completed' && !isPendingRx && (
              <div className="p-8 bg-slate-900/10 border border-slate-900 rounded-3xl space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  Fulfillment Status transition
                </h3>
                <div className="flex flex-wrap gap-3">
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus('preparing')}
                      disabled={actioning}
                      className="py-3 px-6 rounded-2xl text-xs font-bold text-slate-950 bg-violet-400 hover:bg-violet-300 transition-all cursor-pointer shadow-lg shadow-violet-500/10"
                    >
                      Start Assembling Meds
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.delivery_type === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup')}
                      disabled={actioning}
                      className="py-3 px-6 rounded-2xl text-xs font-bold text-slate-950 bg-violet-400 hover:bg-violet-300 transition-all cursor-pointer shadow-lg shadow-violet-500/10"
                    >
                      {order.delivery_type === 'delivery' ? 'Dispatch for Delivery' : 'Mark Ready for Pickup'}
                    </button>
                  )}

                  {(order.status === 'out_for_delivery' || order.status === 'ready_for_pickup') && (
                    <button
                      onClick={() => handleUpdateStatus('completed')}
                      disabled={actioning}
                      className="py-3 px-6 rounded-2xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-350 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                    >
                      Fulfill Order (Mark Completed)
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateStatus('cancelled')}
                    disabled={actioning}
                    className="py-3 px-6 rounded-2xl text-xs font-bold text-rose-450 hover:bg-rose-500/10 border border-slate-800 transition-all cursor-pointer"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            )}

            {/* Layout grids for order metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column (Items) */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Package className="h-4.5 w-4.5 text-violet-400" />
                    Medications Summary
                  </h3>

                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2.5 border-b border-slate-900/50 last:border-0 text-sm">
                        <div>
                          <span className="font-bold text-slate-200 block">
                            {item.product_name}
                          </span>
                          <span className="text-xs text-slate-500">
                            Unit Price: ₹{Number(item.price_at_order).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-10 items-center">
                          <span className="text-xs font-medium text-slate-500">
                            Qty: {item.quantity}
                          </span>
                          <span className="text-sm font-extrabold text-slate-200">
                            ₹{(Number(item.price_at_order) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Fulfillment Destination Card */}
                <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5 text-violet-400" />
                    Delivery Destination
                  </h3>

                  {order.delivery_type === 'delivery' ? (
                    <div className="space-y-2 text-xs">
                      <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 font-bold border border-violet-500/20 rounded uppercase text-[10px]">
                        Home Delivery
                      </span>
                      <p className="text-slate-350 leading-relaxed font-semibold">
                        Home delivery destination is loaded from checkout. Ensure address coordinates align on courier dispatch.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 rounded uppercase text-[10px]">
                        Counter Pickup
                      </span>
                      <p className="text-slate-350 leading-relaxed font-semibold">
                        Customer will pick up items in person. Fulfill orders only upon identity match against Order ID.
                      </p>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-4.5 w-4.5 text-violet-400" />
                    Payments & Audit
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Method:</span>
                      <span className="font-bold text-slate-300 uppercase">{order.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Status:</span>
                      <span className={`font-black uppercase ${order.payment_status === 'paid' ? 'text-emerald-450' : 'text-amber-400'}`}>
                        {order.payment_status}
                      </span>
                    </div>
                    {Number(order.discount_amount) > 0 && (
                      <div className="border-t border-slate-900 pt-2 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Promo Discount:</span>
                          <span className="text-rose-400 font-bold">-₹{Number(order.discount_amount).toFixed(2)}</span>
                        </div>
                        {order.points_redeemed > 0 && (
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Points Used:</span>
                            <span>{order.points_redeemed} pts</span>
                          </div>
                        )}
                      </div>
                    )}
                    {order.points_earned > 0 && (
                      <div className="flex justify-between border-t border-slate-900 pt-2">
                        <span className="text-slate-500">Points Awarded:</span>
                        <span className="text-emerald-400 font-bold">+{order.points_earned} pts</span>
                      </div>
                    )}
                    {order.razorpay_payment_id && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-slate-900">
                        <span className="text-[10px] text-slate-550 font-bold">Transaction Ref ID</span>
                        <span className="text-xxs text-slate-400 bg-slate-950 px-2 py-1.5 rounded font-mono break-all">{order.razorpay_payment_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
