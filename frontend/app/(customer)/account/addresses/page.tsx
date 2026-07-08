"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Address } from '@/lib/types';
import CustomerNavigation from '@/components/customer/Navigation';
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase, Check, X, ShieldAlert } from 'lucide-react';

export default function AddressManagementPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form/Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  
  const [label, setLabel] = useState('Home');
  const [fullAddress, setFullAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    try {
      const data = await apiFetch('/addresses');
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch addresses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleOpenCreate = () => {
    setEditAddress(null);
    setLabel('Home');
    setFullAddress('');
    setLandmark('');
    setIsDefault(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditAddress(addr);
    setLabel(addr.label);
    setFullAddress(addr.full_address);
    setLandmark(addr.landmark || '');
    setIsDefault(addr.is_default);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const method = editAddress ? 'PUT' : 'POST';
      const path = editAddress ? `/addresses/${editAddress.id}` : '/addresses';
      
      const payload = {
        label,
        full_address: fullAddress,
        landmark: landmark.trim() || undefined,
        is_default: isDefault,
      };

      await apiFetch(path, {
        method,
        body: payload,
      });

      setIsOpen(false);
      fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to save address.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setError('');
    try {
      await apiFetch(`/addresses/${id}`, { method: 'DELETE' });
      fetchAddresses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete address.');
    }
  };

  const getLabelIcon = (lbl: string) => {
    if (lbl.toLowerCase() === 'home') return <Home className="h-4 w-4" />;
    if (lbl.toLowerCase() === 'work') return <Briefcase className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <CustomerNavigation />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              My Addresses
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage your billing and delivery destinations for quick checkout.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 py-3 px-5 border border-transparent rounded-2xl text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-all cursor-pointer shadow-lg shadow-teal-500/10"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Address modal form */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-6">
                {editAddress ? 'Edit Delivery Destination' : 'New Delivery Destination'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Address Label
                    </label>
                    <select
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-300 focus:ring-2 focus:ring-teal-500/50 sm:text-sm cursor-pointer"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {label === 'Other' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Custom Label Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Parents, Gym"
                        onChange={(e) => setLabel(e.target.value)}
                        className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Full Destination Address
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="House/Flat number, Street name, City, Pin Code"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Landmark <span className="text-slate-600">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite Central Park"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="setDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950/40 text-teal-450 focus:ring-teal-500/50 cursor-pointer"
                  />
                  <label
                    htmlFor="setDefault"
                    className="text-sm text-slate-300 font-medium select-none cursor-pointer"
                  >
                    Set as default delivery address
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="py-3 px-5 border border-slate-800 rounded-2xl text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-3 px-6 border border-transparent rounded-2xl text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Addresses list */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 bg-slate-900/30 rounded-3xl animate-pulse" />
            <div className="h-28 bg-slate-900/30 rounded-3xl animate-pulse" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-full inline-block text-slate-600">
              <MapPin className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">No Addresses Created</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Add a delivery address to enable ordering and checkouts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                  addr.is_default
                    ? 'bg-slate-900/40 border-teal-500/20'
                    : 'bg-slate-900/10 border-slate-900/60 hover:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 rounded-lg text-xs font-bold text-teal-400 border border-slate-900">
                      {getLabelIcon(addr.label)}
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <span className="flex items-center gap-1 text-xs text-teal-400 font-bold">
                        <Check className="h-3.5 w-3.5" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 font-semibold leading-relaxed">
                    {addr.full_address}
                  </p>
                  {addr.landmark && (
                    <p className="text-xs text-slate-500">
                      <span className="font-bold">Landmark:</span> {addr.landmark}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-slate-900/50 mt-4 justify-end">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Edit Address"
                  >
                    <Edit2 className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    title="Delete Address"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
