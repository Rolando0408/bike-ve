import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bike VE | Calculadora de Arbitraje y Conversión P2P",
  description: "Calculadora avanzada de arbitraje y conversión de tasas BCV a Binance P2P en Venezuela. Optimiza tus ganancias con tasas en tiempo real.",
  keywords: ["arbitraje", "binance p2p", "bcv", "tasa de cambio", "venezuela", "calculadora usdt", "pago movil", "ganancia", "dolar oficial", "criptomonedas"],
  openGraph: {
    title: "Bike VE | Calculadora de Arbitraje",
    description: "Calculadora avanzada para optimizar tus finanzas, arbitraje y conversión de bolívares a USDT.",
    url: "https://bike-ve.vercel.app",
    siteName: "Bike VE",
    locale: "es_VE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bike VE | Calculadora de Arbitraje",
    description: "Calculadora avanzada de conversión de tasas BCV a Binance P2P en Venezuela.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
