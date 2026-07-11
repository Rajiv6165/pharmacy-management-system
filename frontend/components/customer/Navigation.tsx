"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, User, LogOut, Package, MapPin, Activity, Menu, X, KeyRound } from 'lucide-react';

export default function CustomerNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { label: 'Medicines & Products', href: '/products' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 text-teal-400 font-extrabold text-xl tracking-wider">
              <Activity className="h-6 w-6 text-teal-400" />
              <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'}</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors duration-200 ${
                  pathname === link.href ? 'text-teal-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-slate-950 bg-teal-400 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none transition-all duration-200 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-sm">
                    C
                  </div>
                  <span className="text-sm font-semibold text-slate-300">Account</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl py-2 z-50 backdrop-blur-xl">
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                    >
                      <User className="h-4 w-4 text-teal-400" />
                      My Profile
                    </Link>
                    <Link
                      href="/account/addresses"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-teal-400" />
                      Manage Addresses
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors"
                    >
                      <Package className="h-4 w-4 text-teal-400" />
                      Order History
                    </Link>
                    <hr className="border-slate-800 my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="py-2.5 px-5 rounded-xl text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-all duration-300 shadow-md shadow-teal-500/10"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Portal Link */}
            <Link
              href="/staff/login"
              title="Staff Portal"
              className="p-2 text-slate-500 hover:text-violet-400 transition-colors"
            >
              <KeyRound className="h-5 w-5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/cart" className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xxs font-bold leading-none text-slate-950 bg-teal-400 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-900 bg-slate-950 px-4 pt-2 pb-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <hr className="border-slate-900 my-2" />
          {user ? (
            <div className="space-y-1">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-slate-300 hover:bg-slate-900"
              >
                <User className="h-5 w-5 text-teal-400" />
                Profile
              </Link>
              <Link
                href="/account/addresses"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-slate-300 hover:bg-slate-900"
              >
                <MapPin className="h-5 w-5 text-teal-400" />
                Addresses
              </Link>
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-slate-300 hover:bg-slate-900"
              >
                <Package className="h-5 w-5 text-teal-400" />
                Orders
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-base text-rose-400 hover:bg-rose-500/10 text-left"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 px-3 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center py-2.5 border border-slate-800 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-900"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300"
              >
                Sign Up
              </Link>
            </div>
          )}
          
          <div className="pt-2 text-center border-t border-slate-900">
            <Link
              href="/staff/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1.5"
            >
              <KeyRound className="h-4 w-4" />
              Staff Login Gateway
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
