"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { apiFetch } from '@/lib/api';
import { Order } from '@/lib/types';
import CustomerNavigation from '@/components/customer/Navigation';
import { 
  Package, Calendar, MapPin, CreditCard, ChevronLeft, 
  FileText, Clock, AlertTriangle, CheckCircle2, RotateCcw 
} from 'lucide-react';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryPaying, setRetryPaying] = useState(false);

  const fetchOrderDetails = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await apiFetch(`/orders/${id}`);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve order details.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();

    // Poll status updates every 6 seconds to capture pharmacist approvals
    const interval = setInterval(() => {
      fetchOrderDetails(false);
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchOrderDetails]);

  const handleRetryPayment = async () => {
    if (!order) return;
    setRetryPaying(true);
    setError('');

    try {
      // Call backend to create Razorpay Order
      const paymentOrder = await apiFetch('/payments/create', {
        method: 'POST',
        body: { order_id: order.id },
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: paymentOrder.amount * 100, // in paisa
        currency: paymentOrder.currency,
        name: 'AetherRx Pharmacy',
        description: `Order Payment for #${order.id}`,
        order_id: paymentOrder.razorpay_order_id,
        handler: async function (response: any) {
          try {
            await apiFetch('/payments/verify', {
              method: 'POST',
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            fetchOrderDetails();
          } catch (err: any) {
            setError(err.message || 'Payment signature verification failed.');
          } finally {
            setRetryPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setRetryPaying(false);
          },
        },
        theme: {
          color: '#14b8a6', // Teal 500
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment.');
      setRetryPaying(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Awaiting Payment',
      rx_pending: 'Awaiting Pharmacist Approval',
      confirmed: 'Confirmed & Decanted',
      preparing: 'Assembling Medicines',
      out_for_delivery: 'Out with Courier',
      ready_for_pickup: 'Ready at Counter',
      completed: 'Completed & Delivered',
      cancelled: 'Cancelled / Order Declined',
    };
    return labels[status] || status;
  };

  const getProgressStepIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    const steps = [
      'pending',
      'rx_pending',
      'confirmed',
      'preparing',
      'out_for_delivery', // matches shipped/pickup
      'ready_for_pickup',
      'completed'
    ];
    // Custom mapping for simplified tracker
    if (status === 'ready_for_pickup') return 4;
    return steps.indexOf(status);
  };

  const trackingSteps = [
    { label: 'Created', desc: 'Order Placed' },
    { label: 'Approval', desc: 'Pharmacist Review' },
    { label: 'Confirmed', desc: 'Stock Reserved' },
    { label: 'Packaging', desc: 'Assembling Meds' },
    { label: 'Transit', desc: 'Delivery / Pickup Ready' },
    { label: 'Completed', desc: 'Fulfilled' },
  ];

  const currentStepIndex = order ? getProgressStepIndex(order.status) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <CustomerNavigation />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <span className="text-xxs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Live Status Polling Enabled
          </span>
        </div>

        {loading ? (
          <div className="h-96 bg-slate-900/30 rounded-3xl animate-pulse" />
        ) : error || !order ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/85 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Order Details Unavailable</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              We couldn't retrieve information for this order. It may not belong to this account, or the backend database is offline.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header stats summary card */}
            <div className="p-8 rounded-3xl bg-slate-900/20 border border-slate-900 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                  Reference #OR-{order.id}
                </span>
                <h1 className="text-2xl font-black text-white">
                  {getStatusLabel(order.status)}
                </h1>
                <p className="text-xs text-slate-400">
                  Placed on {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-xxs text-slate-500 font-bold uppercase tracking-wider block text-left md:text-right">
                    Total Amount
                  </span>
                  <span className="text-2xl font-black text-teal-400">
                    ₹{Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rejection Banner */}
            {order.status === 'cancelled' && order.prescriptions.some((p) => p.rejection_reason) && (
              <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 space-y-2">
                <h3 className="font-bold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Prescription Rejected by Pharmacist
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  <span className="font-bold text-rose-400">Reason:</span>{' '}
                  {order.prescriptions.find((p) => p.rejection_reason)?.rejection_reason}
                </p>
                <p className="text-xs text-slate-500">
                  Your order has been cancelled automatically. Please place a new order with a valid prescription.
                </p>
              </div>
            )}

            {/* Waiting for approval banner */}
            {order.status === 'rx_pending' && (
              <div className="p-6 rounded-3xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-start gap-4">
                <Clock className="h-6 w-6 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold">Awaiting Pharmacist Verification</h3>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    Your prescription has been uploaded and queued. On-duty pharmacists verify uploaded files manually against local regulations. The screen will automatically refresh once approved!
                  </p>
                </div>
              </div>
            )}

            {/* Retry Payment Option */}
            {order.status === 'pending' && order.payment_method === 'online' && order.payment_status === 'unpaid' && (
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold">Online Payment Pending</h3>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    The online transaction wasn't finalized. Click pay now to complete the Razorpay payment.
                  </p>
                </div>
                <button
                  onClick={handleRetryPayment}
                  disabled={retryPaying}
                  className="py-3 px-6 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm rounded-2xl flex-shrink-0 cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  {retryPaying ? 'Processing...' : 'Pay with Razorpay'}
                </button>
              </div>
            )}

            {/* Progress tracker timeline */}
            {order.status !== 'cancelled' && (
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
                  Delivery Tracking Timeline
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-6 relative">
                  {trackingSteps.map((step, index) => {
                    const isCompleted = currentStepIndex >= index;
                    const isActive = currentStepIndex === index;

                    return (
                      <div key={index} className="flex flex-col items-center text-center space-y-2.5 relative">
                        {/* Dot */}
                        <div
                          className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isCompleted
                              ? 'bg-teal-400/10 border-teal-400 text-teal-400 font-extrabold'
                              : 'bg-slate-950/40 border-slate-800 text-slate-650'
                          } ${isActive ? 'ring-4 ring-teal-500/20 animate-pulse' : ''}`}
                        >
                          {isCompleted ? <CheckCircle2 className="h-4.5 w-4.5" /> : index + 1}
                        </div>
                        {/* Text */}
                        <div className="space-y-0.5">
                          <span className={`text-xs font-bold block ${isCompleted ? 'text-white' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                          <span className="text-[10px] text-slate-650 block leading-tight">
                            {step.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Details layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Order items list (Left 2 cols) */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Package className="h-4.5 w-4.5 text-teal-400" />
                    Medicines & Items
                  </h3>

                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2.5 border-b border-slate-900/50 last:border-0">
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-slate-200 block">
                            {item.product_name}
                          </span>
                          <span className="text-xs text-slate-500">
                            Unit Price: ₹{item.price_at_order.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-10 items-center">
                          <span className="text-xs font-medium text-slate-450">
                            Qty: {item.quantity}
                          </span>
                          <span className="text-sm font-extrabold text-slate-200">
                            ₹{(item.price_at_order * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery info & Prescriptions (Right col) */}
              <div className="space-y-6">
                {/* Fulfillment Destination Card */}
                <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5 text-teal-400" />
                    Fulfillment
                  </h3>

                  {order.delivery_type === 'delivery' ? (
                    <div className="space-y-2 text-xs">
                      <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 font-bold border border-teal-500/20 rounded uppercase text-[10px]">
                        Home Delivery
                      </span>
                      <p className="text-slate-300 font-semibold leading-relaxed">
                        Address details are fetched on creation. Delivery starts once confirmed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 rounded uppercase text-[10px]">
                        Store Pickup
                      </span>
                      <p className="text-slate-350 leading-relaxed font-semibold">
                        Pick up your medicines at the counter. Present your Order ID #{order.id} to the pharmacist.
                      </p>
                    </div>
                  )}
                </div>

                {/* Prescription Attachment Card */}
                {order.requires_rx_check && (
                  <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-teal-400" />
                      Prescription File
                    </h3>

                    {order.prescriptions.map((pres) => (
                      <div key={pres.id} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold truncate max-w-[70%]">
                            {pres.file_url.split('/').pop()}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                            pres.verified 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {pres.verified ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}${pres.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-teal-400 hover:text-teal-350 block hover:underline"
                        >
                          View Uploaded Document
                        </a>
                      </div>
                    ))}
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
