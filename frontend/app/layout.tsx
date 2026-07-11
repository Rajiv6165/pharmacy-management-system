import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import PWARegister from "@/components/PWARegister";
import SupportChatWidget from "@/components/customer/SupportChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "Pharmacy";

export const metadata: Metadata = {
  title: `${brandName} - Smart Pharmacy Management`,
  description: `Phase 2 Next.js App for ${brandName} and Prescription Operations`,
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-200">
        <AuthProvider>
          <CartProvider>
            <PWARegister />
            {children}
            <SupportChatWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
