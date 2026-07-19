import type { Metadata } from "next";
import { Newsreader, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import PWARegister from "@/components/PWARegister";
import SupportChatWidget from "@/components/customer/SupportChatWidget";

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
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
      className={`${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
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
