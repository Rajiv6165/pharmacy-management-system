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
    <nav className="sticky top-0 z-50 bg-primary-dark border-b border-white/10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Indicator */}
          <div className="flex items-center gap-3">
            <Link href="/staff/dashboard" className="flex items-center gap-2 text-white font-serif font-bold text-lg tracking-wider">
              <ShieldAlert className="h-5.5 w-5.5 text-highlight" />
              <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Ops</span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold text-paper/70 bg-white/10 border border-white/15 uppercase tracking-wider">
              {user?.role || 'Staff'}
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 text-xs font-bold transition-all py-1.5 px-3 rounded ${
                  pathname === link.href 
                    ? 'text-white bg-accent' 
                    : 'text-paper/75 hover:text-white hover:bg-white/5'
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
              className="text-xs font-bold text-paper/70 hover:text-white flex items-center gap-1 border border-white/20 hover:bg-white/5 rounded px-3 py-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-highlight" />
              Customer Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 rounded transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-paper hover:text-white hover:bg-white/5 focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-dark border-b border-white/10 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-bold transition-colors ${
                pathname === link.href
                  ? 'text-white bg-accent'
                  : 'text-paper/75 hover:bg-white/5 hover:text-white'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <hr className="border-white/10 my-2" />
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1 py-2 rounded text-xs font-bold text-paper/75 border border-white/20 hover:bg-white/5"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-highlight" />
              Shop Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1 py-2 rounded text-xs font-bold text-rose-300 bg-rose-600/20"
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
