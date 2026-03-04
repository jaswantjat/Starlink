import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Verificación de Instalación — Starlink × Eltex",
  description: "Verificación de calidad de instalación Starlink",
};

export const viewport: Viewport = {
  themeColor: "#06080f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased`}>
        <Script
          src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js"
          type="module"
          strategy="beforeInteractive"
        />
        {children}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
