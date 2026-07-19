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
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <CustomerNavigation />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif text-primary-dark tracking-tight">
              My Addresses
            </h1>
            <p className="mt-1 text-xs text-ink/70">
              Manage your billing and delivery destinations for quick checkout.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-accent hover:bg-accent/90 text-white rounded text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded text-rose-600 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Address modal form */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/30 backdrop-blur-xs p-4">
            <div className="bg-white border border-primary-dark/15 rounded p-8 w-full max-w-lg shadow-md relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-ink/40 hover:text-primary-dark rounded transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-bold font-serif text-primary-dark mb-6">
                {editAddress ? 'Edit Delivery Destination' : 'New Delivery Destination'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">
                      Address Label
                    </label>
                    <select
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="block w-full px-3 py-2 border border-primary-dark/15 rounded bg-white text-ink placeholder-ink/40 focus:outline-none focus:ring-1 focus:ring-accent sm:text-xs font-sans cursor-pointer"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {label === 'Other' && (
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">
                        Custom Label Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Parents, Gym"
                        onChange={(e) => setLabel(e.target.value)}
                        className="block w-full px-3 py-2 border border-primary-dark/15 rounded bg-white text-ink placeholder-ink/40 focus:outline-none focus:ring-1 focus:ring-accent sm:text-xs font-sans"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">
                    Full Destination Address
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="House/Flat number, Street name, City, Pin Code"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="block w-full px-3 py-2 border border-primary-dark/15 rounded bg-white text-ink placeholder-ink/40 focus:outline-none focus:ring-1 focus:ring-accent sm:text-xs font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">
                    Landmark <span className="text-ink/40 font-mono text-[9px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite Central Park"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="block w-full px-3 py-2 border border-primary-dark/15 rounded bg-white text-ink placeholder-ink/40 focus:outline-none focus:ring-1 focus:ring-accent sm:text-xs font-sans"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="setDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-primary-dark/25 text-accent focus:ring-accent cursor-pointer"
                  />
                  <label
                    htmlFor="setDefault"
                    className="text-xs text-ink/75 font-sans select-none cursor-pointer"
                  >
                    Set as default delivery address
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-4 justify-end font-sans">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="py-2 px-4 border border-primary-dark/20 text-ink/70 hover:text-primary-dark hover:bg-paper rounded text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2 px-4 bg-accent hover:bg-accent/90 text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
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
            <div className="h-28 bg-white border border-primary-dark/10 rounded animate-pulse" />
            <div className="h-28 bg-white border border-primary-dark/10 rounded animate-pulse" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="p-16 text-center rounded bg-white border border-primary-dark/15 space-y-4 shadow-xxs">
            <div className="p-4 bg-paper rounded-full inline-block text-accent border border-primary-dark/10">
              <MapPin className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold font-serif text-primary-dark">No Addresses Created</h3>
            <p className="text-xs text-ink/60 max-w-xs mx-auto">
              Add a delivery address to enable ordering and checkouts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-6 rounded border transition-colors flex flex-col justify-between shadow-xxs ${
                  addr.is_default
                    ? 'bg-accent/5 border-accent/30'
                    : 'bg-white border-primary-dark/15 hover:border-primary-dark/25'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-paper rounded border border-primary-dark/10 text-[10px] font-mono font-bold text-accent">
                      {getLabelIcon(addr.label)}
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-accent">
                        <Check className="h-3.5 w-3.5" />
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary-dark font-bold leading-relaxed">
                    {addr.full_address}
                  </p>
                  {addr.landmark && (
                    <p className="text-[10px] text-ink/50 font-mono">
                      LANDMARK: {addr.landmark}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-primary-dark/10 mt-4 justify-end">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="p-2 text-ink/40 hover:text-primary-dark hover:bg-paper rounded transition-all cursor-pointer"
                    title="Edit Address"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-2 text-ink/40 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                    title="Delete Address"
                  >
                    <Trash2 className="h-4 w-4" />
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
