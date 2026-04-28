import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alteha Admin Panel",
  description: "Administrative interface for the Alteha ecosystem.",
  icons: {
    icon: "/logoalteha.svg",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-slate-50 font-sans text-slate-900`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
