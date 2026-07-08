"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Staff } from '@/lib/types';
import StaffNavigation from '@/components/staff/Navigation';
import { Users, Plus, Shield, UserCheck, UserX, X, RefreshCw, Key } from 'lucide-react';

export default function AdminStaffManagementPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchStaffList = async () => {
    try {
      const data = await apiFetch('/admin/staff');
      setStaffList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve staff listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  const handleOpenCreate = () => {
    setEditStaff(null);
    setName('');
    setPhone('');
    setPassword('');
    setRole('staff');
    setIsActive(true);
    setIsOpen(true);
  };

  const handleOpenEdit = (st: Staff) => {
    setEditStaff(st);
    setName(st.name);
    setPhone(st.phone);
    setPassword(''); // Leave password empty unless updating
    setRole(st.role);
    setIsActive(st.is_active);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const method = editStaff ? 'PUT' : 'POST';
      const path = editStaff ? `/admin/staff/${editStaff.id}` : '/admin/staff';

      const payload: any = {
        name,
        phone,
        role,
        is_active: isActive,
      };

      // Only send password if provided
      if (password.trim()) {
        payload.password = password;
      } else if (!editStaff) {
        // Required for creation
        throw new Error('Password is required for new staff accounts.');
      }

      await apiFetch(path, {
        method,
        body: payload,
      });

      setIsOpen(false);
      fetchStaffList();
    } catch (err: any) {
      setError(err.message || 'Failed to save staff account details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <StaffNavigation />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Staff Management</h1>
            <p className="mt-1 text-sm text-slate-400">
              Admin Control Panel: register pharmacists, update privileges, and edit login access.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 py-3.5 px-5 border border-transparent rounded-2xl text-xs font-bold text-slate-950 bg-violet-400 hover:bg-violet-300 transition-all cursor-pointer shadow-lg shadow-violet-500/10"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Staff Member
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {/* Modal Form */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-6">
                {editStaff ? 'Edit Staff Credentials' : 'Register Operations Staff'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Pharmacist"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Password {editStaff && <span className="text-slate-600">(Leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editStaff}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Access Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'staff' | 'admin')}
                      className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-350 focus:ring-2 focus:ring-violet-500/50 sm:text-xs cursor-pointer"
                    >
                      <option value="staff">Pharmacist (Staff)</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  {editStaff && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Account Status
                      </label>
                      <select
                        value={isActive ? 'true' : 'false'}
                        onChange={(e) => setIsActive(e.target.value === 'true')}
                        className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-350 focus:ring-2 focus:ring-violet-500/50 sm:text-xs cursor-pointer"
                      >
                        <option value="true">Active</option>
                        <option value="false">Deactivated</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="py-3 px-5 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-3 px-6 bg-violet-400 hover:bg-violet-300 text-slate-950 font-bold text-xs rounded-2xl cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Confirm Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Staff accounts list */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-20 bg-slate-900/30 rounded-3xl animate-pulse" />
            <div className="h-20 bg-slate-900/30 rounded-3xl animate-pulse" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-20 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-full inline-block text-slate-655">
              <Users className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-300">No Staff Logged</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {staffList.map((st) => (
              <div
                key={st.id}
                className={`p-6 rounded-3xl border transition-all flex justify-between items-start gap-4 ${
                  st.is_active 
                    ? 'bg-slate-900/20 border-slate-900 hover:border-slate-850' 
                    : 'bg-slate-950 border-slate-950 opacity-45'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">
                      {st.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                      st.role === 'admin' 
                        ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' 
                        : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}>
                      {st.role === 'admin' ? 'Administrator' : 'Pharmacist'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Phone: {st.phone} · Registered on {new Date(st.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xxs font-black border ${
                    st.is_active 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {st.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                    {st.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(st)}
                    className="p-2 border border-slate-850 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
                    title="Edit account details"
                  >
                    <Key className="h-4 w-4 text-slate-450 hover:text-white" />
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
