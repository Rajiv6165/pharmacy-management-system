"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, User, LogOut, Package, MapPin, Activity, Menu, X, KeyRound, Gift } from 'lucide-react';

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
    <nav className="sticky top-0 z-50 bg-primary-dark border-b border-primary-dark/30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 text-paper hover:text-white transition-colors font-serif font-bold text-xl tracking-wide">
              <Activity className="h-5 w-5 text-highlight" />
              <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'}</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-sans font-semibold tracking-wide transition-colors duration-200 ${
                  pathname === link.href ? 'text-white border-b-2 border-highlight py-1' : 'text-paper/80 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 text-paper/80 hover:text-white transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono font-bold leading-none text-white bg-accent rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-xl text-paper/85 hover:text-white hover:bg-white/5 focus:outline-none transition-all duration-200 cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-full bg-paper/10 border border-paper/20 flex items-center justify-center text-paper font-sans font-bold text-xs uppercase">
                    {user.type === 'staff' ? 'S' : 'C'}
                  </div>
                  <span className="text-sm font-semibold font-sans">Account</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-primary-dark/15 rounded-xl shadow-xl py-2 z-50">
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink/80 font-sans hover:bg-paper hover:text-primary-dark transition-colors"
                    >
                      <User className="h-4 w-4 text-accent" />
                      My Profile
                    </Link>
                    <Link
                      href="/account/addresses"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink/80 font-sans hover:bg-paper hover:text-primary-dark transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-accent" />
                      Manage Addresses
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink/80 font-sans hover:bg-paper hover:text-primary-dark transition-colors"
                    >
                      <Package className="h-4 w-4 text-accent" />
                      Order History
                    </Link>
                    <Link
                      href="/loyalty"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink/80 font-sans hover:bg-paper hover:text-primary-dark transition-colors"
                    >
                      <Gift className="h-4 w-4 text-accent" />
                      Loyalty Rewards
                    </Link>
                    <hr className="border-paper my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link
                  href="/login"
                  className="text-sm font-semibold font-sans text-paper/80 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="py-2 px-4 rounded-lg text-sm font-bold font-sans text-white bg-accent hover:bg-accent/90 transition-all duration-200 border border-transparent shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Portal Link */}
            <Link
              href="/staff/login"
              title="Staff Portal"
              className="p-2 text-paper/50 hover:text-highlight transition-colors border-l border-paper/10 pl-4"
            >
              <KeyRound className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/cart" className="relative p-2 text-paper/85 hover:text-white transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xxs font-mono font-bold leading-none text-white bg-accent rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-paper/85 hover:text-white hover:bg-white/5 focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary-dark/30 bg-primary-dark px-4 pt-2 pb-4 space-y-3 shadow-inner">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-paper/90 hover:bg-white/5 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <hr className="border-paper/10 my-2" />
          {user ? (
            <div className="space-y-1">
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-base text-paper/90 hover:bg-white/5"
              >
                <User className="h-5 w-5 text-highlight" />
                Profile
              </Link>
              <Link
                href="/account/addresses"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-base text-paper/90 hover:bg-white/5"
              >
                <MapPin className="h-5 w-5 text-highlight" />
                Addresses
              </Link>
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-base text-paper/90 hover:bg-white/5"
              >
                <Package className="h-5 w-5 text-highlight" />
                Orders
              </Link>
              <Link
                href="/loyalty"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-base text-paper/90 hover:bg-white/5"
              >
                <Gift className="h-5 w-5 text-highlight" />
                Loyalty Rewards
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-base text-rose-300 hover:bg-rose-500/10 text-left"
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
                className="flex items-center justify-center py-2 border border-paper/20 rounded-lg text-sm font-semibold text-paper hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center py-2 rounded-lg text-sm font-bold text-white bg-accent hover:bg-accent/90"
              >
                Sign Up
              </Link>
            </div>
          )}
          
          <div className="pt-2 text-center border-t border-paper/10">
            <Link
              href="/staff/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-paper/40 hover:text-paper/80 flex items-center justify-center gap-1.5"
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
