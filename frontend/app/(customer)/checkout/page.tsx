"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Address } from '@/lib/types';
import CustomerNavigation from '@/components/customer/Navigation';
import { MapPin, CreditCard, DollarSign, Upload, FileText, ShoppingBag, ShieldCheck, CheckCircle2, ChevronRight, Gift } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cartItems, cartTotal, requiresRx, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [addressId, setAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [rxFile, setRxFile] = useState<File | null>(null);

  // Phase 6 loyalty/coupon states
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/cart');
      return;
    }

    const fetchAddresses = async () => {
      try {
        const data = await apiFetch('/addresses');
        setAddresses(data);
        const defaultAddr = data.find((a: Address) => a.is_default);
        if (defaultAddr) {
          setAddressId(defaultAddr.id);
        } else if (data.length > 0) {
          setAddressId(data[0].id);
        }
      } catch (err: any) {
        console.error('Failed to fetch addresses:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    const fetchLoyaltyBalance = async () => {
      try {
        const data = await apiFetch('/loyalty/balance');
        setLoyaltyPoints(data.balance);
      } catch (err) {
        console.error('Failed to fetch loyalty balance:', err);
      }
    };

    fetchAddresses();
    fetchLoyaltyBalance();
  }, [cartItems, router]);

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponSuccess('');
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const result = await apiFetch('/coupons/validate', {
        method: 'POST',
        body: {
          code: couponCode.trim(),
          cart_total: Number(cartTotal),
        },
      });
      if (result.valid) {
        setCouponDiscount(Number(result.discount_amount));
        setAppliedCouponCode(couponCode.trim());
        setCouponSuccess(result.message);
      } else {
        setCouponError(result.message);
        setCouponDiscount(0);
        setAppliedCouponCode('');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate coupon.');
      setCouponDiscount(0);
      setAppliedCouponCode('');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleApplyMaxPoints = () => {
    const remainingPayable = Number(cartTotal) - couponDiscount;
    const maxRedeemablePoints = Math.min(loyaltyPoints, Math.floor(remainingPayable * 10));
    // Must be at least 100 points to redeem
    if (maxRedeemablePoints >= 100) {
      setPointsToRedeem(maxRedeemablePoints);
    } else {
      setPointsToRedeem(0);
    }
  };

  const pointsDiscount = pointsToRedeem >= 100 ? (pointsToRedeem / 10) : 0;
  const finalPayable = Math.max(0, Number(cartTotal) - couponDiscount - pointsDiscount);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRxFile(e.target.files[0]);
    }
  };

  const handleOrderSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (deliveryType === 'delivery' && !addressId) {
      setError('Please select a delivery address or add a new one.');
      return;
    }

    if (requiresRx && !rxFile) {
      setError('Please upload a valid prescription file to proceed.');
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Create Order
      const itemsPayload = cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const orderPayload = {
        delivery_type: deliveryType,
        address_id: deliveryType === 'delivery' ? addressId : null,
        payment_method: paymentMethod,
        items: itemsPayload,
        coupon_code: appliedCouponCode || null,
        points_to_redeem: pointsToRedeem || 0,
      };

      const order = await apiFetch('/orders', {
        method: 'POST',
        body: orderPayload,
      });

      const orderId = order.id;

      // Step 2: Upload prescription if needed
      if (requiresRx && rxFile) {
        const formData = new FormData();
        formData.append('file', rxFile);

        await apiFetch(`/orders/${orderId}/prescription`, {
          method: 'POST',
          body: formData,
        });
      }

      // Step 3: Handle Online Payment or Cash Checkout
      if (paymentMethod === 'online' && finalPayable > 0) {
        await initiateRazorpayPayment(orderId);
      } else {
        // COD or fully discounted order completed successfully
        clearCart();
        router.push(`/orders/${orderId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place the order.');
      setSubmitting(false);
    }
  };

  const initiateRazorpayPayment = async (orderId: number) => {
    try {
      // Call backend to create Razorpay Order
      const paymentOrder = await apiFetch('/payments/create', {
        method: 'POST',
        body: { order_id: orderId },
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: paymentOrder.amount * 100, // in paisa
        currency: paymentOrder.currency,
        name: `${process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Pharmacy`,
        description: `Order Payment for #${orderId}`,
        order_id: paymentOrder.razorpay_order_id,
        handler: async function (response: any) {
          // Success callback: Verify signature
          try {
            await apiFetch('/payments/verify', {
              method: 'POST',
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            clearCart();
            router.push(`/orders/${orderId}`);
          } catch (err: any) {
            setError(err.message || 'Payment signature verification failed.');
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            // Payment cancelled: Redirect to order detail page to retry
            clearCart();
            router.push(`/orders/${orderId}`);
          },
        },
        theme: {
          color: '#14b8a6', // Teal 500
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to initiate Razorpay transaction.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <CustomerNavigation />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleOrderSubmission} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Checkout Steps (Left) */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Checkout</h1>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-sm rounded-2xl">
                {error}
              </div>
            )}

            {/* Step 1: Delivery Mode */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-teal-400" />
                1. Delivery Method
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-4 rounded-2xl border text-center font-bold text-sm cursor-pointer transition-all ${
                    deliveryType === 'delivery'
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-400'
                      : 'bg-slate-950/20 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Home Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-4 rounded-2xl border text-center font-bold text-sm cursor-pointer transition-all ${
                    deliveryType === 'pickup'
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-400'
                      : 'bg-slate-950/20 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Store Pickup
                </button>
              </div>
            </div>

            {/* Step 2: Address Selection */}
            {deliveryType === 'delivery' && (
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-teal-400" />
                    2. Delivery Address
                  </h3>
                  <button
                    type="button"
                    onClick={() => router.push('/account/addresses')}
                    className="text-xs font-bold text-teal-400 hover:underline flex items-center"
                  >
                    Manage Addresses <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="h-20 bg-slate-950/40 rounded-2xl animate-pulse" />
                ) : addresses.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                    <p className="text-xs text-slate-500 mb-3">No addresses found.</p>
                    <button
                      type="button"
                      onClick={() => router.push('/account/addresses')}
                      className="py-2.5 px-4 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs rounded-xl"
                    >
                      Add New Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        onClick={() => setAddressId(addr.id)}
                        className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                          addressId === addr.id
                            ? 'bg-teal-500/5 border-teal-500/30 text-slate-200'
                            : 'bg-slate-950/10 border-slate-900 hover:border-slate-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={addressId === addr.id}
                          onChange={() => setAddressId(addr.id)}
                          className="mt-1 h-4 w-4 border-slate-800 text-teal-500 focus:ring-teal-500/50"
                        />
                        <div className="space-y-1">
                          <span className="text-xxs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                            {addr.label}
                          </span>
                          <p className="text-xs font-semibold leading-relaxed pt-1">
                            {addr.full_address}
                          </p>
                          {addr.landmark && (
                            <span className="text-xxs text-slate-550 block">
                              Landmark: {addr.landmark}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment Option */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-teal-400" />
                {deliveryType === 'delivery' ? '3.' : '2.'} Payment Option
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border text-center font-bold text-sm cursor-pointer transition-all flex flex-col items-center gap-2 ${
                    paymentMethod === 'cod'
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-400'
                      : 'bg-slate-950/20 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="h-5 w-5" />
                  {deliveryType === 'delivery' ? 'Cash on Delivery' : 'Pay at Counter'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`p-4 rounded-2xl border text-center font-bold text-sm cursor-pointer transition-all flex flex-col items-center gap-2 ${
                    paymentMethod === 'online'
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-400'
                      : 'bg-slate-950/20 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  Pay Online
                </button>
              </div>
            </div>

            {/* Step 4: Coupons & Loyalty */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="h-5 w-5 text-teal-400" />
                {deliveryType === 'delivery' ? '4.' : '3.'} Coupons & Loyalty Rewards
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coupons */}
                <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-3">
                  <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">
                    Promo Coupon Code
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-grow px-3 py-2 border border-slate-800 rounded-xl bg-slate-900/20 text-slate-200 uppercase placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon}
                      className="px-4 py-2 bg-teal-450 hover:bg-teal-400 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-extrabold cursor-pointer transition-colors"
                    >
                      {validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xxs text-rose-400 font-semibold">{couponError}</p>
                  )}
                  {couponSuccess && (
                    <p className="text-xxs text-emerald-405 font-semibold">{couponSuccess}</p>
                  )}
                </div>

                {/* Loyalty */}
                <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider">
                      Redeem Points
                    </span>
                    <span className="text-xxs font-extrabold text-teal-400">
                      Balance: {loyaltyPoints} pts
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Points to redeem"
                      value={pointsToRedeem || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setPointsToRedeem(Math.min(val, loyaltyPoints));
                      }}
                      className="flex-grow px-3 py-2 border border-slate-800 rounded-xl bg-slate-900/20 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyMaxPoints}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors"
                    >
                      Use Max
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                    Min 100 points required. 10 points = ₹1.00 discount.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5: Prescription File Upload */}
            {requiresRx && (
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-400" />
                  {deliveryType === 'delivery' ? '5.' : '4.'} Upload Doctor Prescription
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your order contains regulated medications that require medical validation. Upload a clear photograph or digital PDF of your doctor prescription.
                </p>

                <div className="relative border border-dashed border-slate-850 rounded-2xl bg-slate-950/20 p-6 flex flex-col items-center justify-center text-center hover:border-teal-500/40 transition-colors">
                  <input
                    type="file"
                    required
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="p-3 bg-teal-500/10 rounded-full text-teal-400 mb-3">
                    <Upload className="h-6 w-6" />
                  </div>
                  {rxFile ? (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white block">
                        Selected File:
                      </span>
                      <span className="text-xs text-teal-400 font-semibold break-all">
                        {rxFile.name}
                      </span>
                      <span className="text-xxs text-slate-500 block">
                        ({(rxFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-slate-300 block">
                        Click to select or drag PDF / Image
                      </span>
                      <span className="text-xxs text-slate-500 block mt-1">
                        Max file size: 5MB
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Checkout Panel Summary (Right) */}
          <div className="space-y-6 lg:mt-14">
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white border-b border-slate-900 pb-3">
                Order Review
              </h3>

              {/* Items Summary list */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-xs">
                    <div className="max-w-[70%]">
                      <span className="font-bold text-slate-200 block line-clamp-1">
                        {item.product.name}
                      </span>
                      <span className="text-slate-500">
                        Qty: {item.quantity} · {item.product.unit}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-300">
                      ₹{(Number(item.product.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="border-slate-900" />

              <div className="space-y-3 text-xs font-semibold text-slate-450">
                <div className="flex justify-between">
                  <span>Cart Items Subtotal</span>
                  <span className="text-slate-200">₹{Number(cartTotal).toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Coupon Applied</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Points Redeemed ({pointsToRedeem} pts)</span>
                    <span>-₹{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t border-slate-900">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Total Pay
                  </span>
                  <span className="text-2xl font-black text-teal-400">
                    ₹{finalPayable.toFixed(2)}
                  </span>
                </div>
                
                {finalPayable > 0 && (
                  <p className="text-[10px] text-slate-550 pt-2 text-center">
                    You will earn approximately {Math.floor(finalPayable / 100)} loyalty points on this order.
                  </p>
                )}
              </div>

              {/* Security Badge */}
              <div className="flex gap-2.5 p-4 bg-slate-950/40 border border-slate-900 rounded-2xl">
                <ShieldCheck className="h-5 w-5 text-teal-400 flex-shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-xxs font-bold text-white">Security & FDA Compliance</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Prescriptions are securely encrypted. Orders remain locked until verified by an on-duty licensed pharmacist.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 border border-transparent rounded-2xl text-sm font-extrabold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-300 shadow-lg shadow-teal-500/20"
              >
                {submitting ? 'Placing Order...' : 'Pay & Confirm Order'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
