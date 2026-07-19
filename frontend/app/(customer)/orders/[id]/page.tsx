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
  FileText, Clock, AlertTriangle, CheckCircle2, RotateCcw, Activity
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
        name: `${process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Pharmacy`,
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
          color: '#3A7563', // Brand accent sage green
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
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <CustomerNavigation />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-ink/60 hover:text-accent transition-colors uppercase tracking-wider"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <span className="text-[10px] font-mono text-ink/50 flex items-center gap-1.5 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            LIVE POLLING ENABLED
          </span>
        </div>

        {loading ? (
          <div className="h-96 bg-white border border-primary-dark/10 rounded animate-pulse" />
        ) : error || !order ? (
          <div className="p-12 rounded bg-white border border-primary-dark/15 text-center space-y-4 shadow-xxs">
            <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-xl font-bold font-serif text-primary-dark">Order Details Unavailable</h3>
            <p className="text-xs text-ink/65 max-w-sm mx-auto">
              We couldn't retrieve information for this order. It may not belong to this account, or the backend database is offline.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header stats summary card */}
            <div className="p-8 rounded bg-white border border-primary-dark/15 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xxs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block">
                  Reference #OR-{order.id}
                </span>
                <h1 className="text-2xl font-bold font-serif text-primary-dark">
                  {getStatusLabel(order.status)}
                </h1>
                <p className="text-xs text-ink/60 font-mono">
                  Placed on {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block text-left md:text-right">
                    Total Amount
                  </span>
                  <span className="text-2xl font-mono font-bold text-primary-dark">
                    ₹{Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rejection Banner */}
            {order.status === 'cancelled' && order.prescriptions.some((p) => p.rejection_reason) && (
              <div className="p-6 rounded bg-rose-50 border border-rose-200 text-rose-600 space-y-2 shadow-xxs">
                <h3 className="font-serif font-bold text-rose-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <AlertTriangle className="h-5 w-5" />
                  Prescription Rejected by Pharmacist
                </h3>
                <p className="text-xs leading-relaxed text-ink/80 font-sans">
                  <span className="font-bold text-rose-600 uppercase font-mono">Reason:</span>{' '}
                  {order.prescriptions.find((p) => p.rejection_reason)?.rejection_reason}
                </p>
                <p className="text-[10px] text-ink/50 font-mono">
                  Your order has been cancelled automatically. Please place a new order with a valid prescription document.
                </p>
              </div>
            )}

            {/* Waiting for approval banner */}
            {order.status === 'rx_pending' && (
              <div className="p-6 rounded bg-white border border-primary-dark/15 text-primary-dark flex items-start gap-4 shadow-xxs">
                <Clock className="h-5 w-5 flex-shrink-0 mt-0.5 text-accent" />
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-sm">Awaiting Pharmacist Verification</h3>
                  <p className="text-xs text-ink/75 leading-relaxed font-sans">
                    Your prescription has been uploaded and queued. On-duty pharmacists verify uploaded files manually against local regulations. The screen will automatically refresh once approved!
                  </p>
                </div>
              </div>
            )}

            {/* Retry Payment Option */}
            {order.status === 'pending' && order.payment_method === 'online' && order.payment_status === 'unpaid' && (
              <div className="p-6 rounded bg-white border border-primary-dark/15 text-primary-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xxs">
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-sm">Online Payment Pending</h3>
                  <p className="text-xs text-ink/70 leading-relaxed font-sans">
                    The online transaction wasn't finalized. Click pay now to complete the Razorpay payment.
                  </p>
                </div>
                <button
                  onClick={handleRetryPayment}
                  disabled={retryPaying}
                  className="py-2.5 px-5 bg-accent hover:bg-accent/90 text-white font-sans font-bold text-xs rounded flex-shrink-0 cursor-pointer shadow-sm border border-transparent"
                >
                  {retryPaying ? 'Processing...' : 'Pay with Razorpay'}
                </button>
              </div>
            )}

            {/* Progress tracker timeline */}
            {order.status !== 'cancelled' && (
              <div className="bg-white border border-primary-dark/15 rounded-lg p-6 sm:p-8 shadow-xxs">
                <h3 className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest mb-6">
                  Delivery Tracking Timeline
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-6 relative">
                  {trackingSteps.map((step, index) => {
                    const isCompleted = currentStepIndex >= index;
                    const isActive = currentStepIndex === index;

                    return (
                      <div key={index} className="flex flex-col items-center text-center space-y-2 relative">
                        {/* Dot */}
                        <div
                          className={`h-7 w-7 rounded-full border flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-accent/10 border-accent text-accent font-mono font-bold text-xs'
                              : 'bg-paper border-primary-dark/15 text-ink/30 text-xs'
                          } ${isActive ? 'ring-4 ring-accent/15 animate-pulse' : ''}`}
                        >
                          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                        </div>
                        {/* Text */}
                        <div className="space-y-0.5">
                          <span className={`text-[11px] font-bold block ${isCompleted ? 'text-primary-dark' : 'text-ink/40'}`}>
                            {step.label}
                          </span>
                          <span className="text-[9px] text-ink/50 block leading-tight font-mono">
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
                <div className="bg-white border border-primary-dark/15 rounded-lg p-6 space-y-4 shadow-xxs">
                  <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-primary-dark/10 pb-3">
                    <Package className="h-4 w-4 text-accent" />
                    Medicines & Items
                  </h3>

                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2.5 border-b border-primary-dark/10 last:border-0">
                        <div className="space-y-1">
                          <span className="text-sm font-serif font-bold text-primary-dark block leading-tight">
                            {item.product_name}
                          </span>
                          <span className="text-[10px] font-mono text-ink/55 block">
                            UNIT PRICE: ₹{Number(item.price_at_order).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-8 items-center">
                          <span className="text-[10px] font-mono text-ink/50">
                            QTY: {item.quantity}
                          </span>
                          <span className="text-sm font-mono font-bold text-primary-dark">
                            ₹{(Number(item.price_at_order) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Receipts Summary */}
                    <div className="pt-4 border-t border-primary-dark/10 space-y-2 text-xs font-sans text-ink/75">
                      <div className="flex justify-between">
                        <span>Items Subtotal</span>
                        <span className="font-mono text-primary-dark">
                          ₹{(Number(order.total_amount) + Number(order.discount_amount || 0)).toFixed(2)}
                        </span>
                      </div>
                      {Number(order.discount_amount) > 0 && (
                        <div className="space-y-2">
                          {order.points_redeemed > 0 && (
                            <div className="flex justify-between text-accent font-bold">
                              <span>Points Redeemed ({order.points_redeemed} pts)</span>
                              <span className="font-mono">-₹{(order.points_redeemed / 10).toFixed(2)}</span>
                            </div>
                          )}
                          {Number(order.discount_amount) - (order.points_redeemed / 10) > 0 && (
                            <div className="flex justify-between text-accent font-bold">
                              <span>Coupon Discount</span>
                              <span className="font-mono">-₹{(Number(order.discount_amount) - (order.points_redeemed / 10)).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-accent pt-2 border-t border-primary-dark/10">
                        <span>Total Paid</span>
                        <span className="font-mono text-lg">₹{Number(order.total_amount).toFixed(2)}</span>
                      </div>
                      {order.points_earned > 0 && (
                        <p className="text-[10px] text-ink/40 pt-1 text-right font-mono">
                          Estimated points earned: {order.points_earned} pts
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery info & Prescriptions (Right col) */}
              <div className="space-y-6">
                {/* Fulfillment Destination Card */}
                <div className="bg-white border border-primary-dark/15 rounded-lg p-6 space-y-4 shadow-xxs">
                  <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-2 border-b border-primary-dark/10 pb-3">
                    <MapPin className="h-4 w-4 text-accent" />
                    Fulfillment
                  </h3>

                  {order.delivery_type === 'delivery' ? (
                    <div className="space-y-2 text-xs">
                      <span className="px-2 py-0.5 bg-accent/10 text-accent font-mono font-bold border border-accent/20 rounded uppercase text-[10px]">
                        Home Delivery
                      </span>
                      <p className="text-ink/70 font-medium leading-relaxed font-sans">
                        Order will be dispatched to your delivery address once confirmed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <span className="px-2 py-0.5 bg-highlight/15 text-primary-dark font-mono font-bold border border-highlight/25 rounded uppercase text-[10px]">
                        Store Pickup
                      </span>
                      <p className="text-ink/75 leading-relaxed font-medium font-sans">
                        Pick up your medicines at the counter. Present your Order ID #{order.id} to the pharmacist.
                      </p>
                    </div>
                  )}
                </div>

                {/* Prescription Attachment Card */}
                {order.requires_rx_check && (
                  <div className="bg-white border border-primary-dark/15 rounded-lg p-6 space-y-4 shadow-xxs">
                    <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-2 border-b border-primary-dark/10 pb-3">
                      <FileText className="h-4 w-4 text-accent" />
                      Prescription File
                    </h3>

                    {order.prescriptions.map((pres) => (
                      <div key={pres.id} className="p-3 bg-paper/40 border border-primary-dark/10 rounded space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-ink/60 font-bold truncate max-w-[60%]">
                            {pres.file_url.split('/').pop()}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold border uppercase tracking-wider ${
                            pres.verified 
                              ? 'bg-accent/10 border-accent/20 text-accent'
                              : 'bg-highlight/10 border-highlight/20 text-primary-dark'
                          }`}>
                            {pres.verified ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}${pres.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-accent hover:text-accent/80 block hover:underline"
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

      {/* Footer */}
      <footer className="border-t border-primary-dark/10 bg-primary-dark py-8 mt-12 text-paper/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-highlight" />
          <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Order Tracking · 2026</span>
        </div>
      </footer>
    </div>
  );
}
