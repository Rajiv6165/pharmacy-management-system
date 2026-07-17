"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, LayoutDashboard, ClipboardList, Database, Users, LogOut, Menu, X, ArrowLeft, Tag } from 'lucide-react';

export default function StaffNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/staff/login');
    router.refresh();
  };

  const navLinks = [
    { label: 'Dashboard', href: '/staff/dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { label: 'Order Queue', href: '/staff/orders', icon: <ClipboardList className="h-4.5 w-4.5" /> },
    { label: 'Inventory control', href: '/staff/products', icon: <Database className="h-4.5 w-4.5" /> },
    { label: 'Coupons', href: '/staff/coupons', icon: <Tag className="h-4.5 w-4.5" /> },
  ];

  // Only admins can see staff management
  const isAdmin = user?.role === 'admin';
  if (isAdmin) {
    navLinks.push({ label: 'Manage Staff', href: '/staff/admin/staff', icon: <Users className="h-4.5 w-4.5" /> });
  }

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Indicator */}
          <div className="flex items-center gap-3">
            <Link href="/staff/dashboard" className="flex items-center gap-2 text-violet-400 font-extrabold text-lg tracking-wider">
              <ShieldAlert className="h-5.5 w-5.5 text-violet-400" />
              <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Ops</span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-lg text-xxs font-bold text-slate-400 bg-slate-800 uppercase tracking-widest border border-slate-700">
              {user?.role || 'Staff'}
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 text-xs font-bold transition-all duration-200 py-1.5 px-3 rounded-xl ${
                  pathname === link.href 
                    ? 'text-violet-400 bg-violet-500/10' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Logout & Profile */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-350 flex items-center gap-1 border border-slate-800 rounded-xl px-3 py-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Customer Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                pathname === link.href
                  ? 'text-violet-400 bg-violet-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <hr className="border-slate-800 my-2" />
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 border border-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Shop Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold text-rose-450 bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
