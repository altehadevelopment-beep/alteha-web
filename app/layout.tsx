import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

import DeferredGlobals from '@/components/DeferredGlobals'

// Using system font stacks to avoid Google Fonts network dependency in local dev
const outfit = { variable: '--font-outfit' }
const inter = { variable: '--font-inter' }

export const metadata: Metadata = {
  title: 'Alteha - Gestión de Subastas Médicas',
  description: 'Portal avanzado de subastas de reservas médicas para especialistas y clínicas.',
  // Favicon comes from app/favicon.ico and app/icon.png (generated from the Alteha logo).
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen selection:bg-alteha-turquoise/30 selection:text-alteha-violet">
        <AuthProvider>
          <Toaster position="bottom-right" richColors />
          {children}
          <DeferredGlobals />
        </AuthProvider>
      </body>
    </html>
  )
}
