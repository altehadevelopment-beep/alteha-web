import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

// Use Outfit for a more modern, tech feel as requested ("minimalista pero muy moderno")
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Alteha - Gestión de Subastas Médicas',
  description: 'Portal avanzado de subastas de reservas médicas para especialistas y clínicas.',
  icons: {
    icon: '/doctor-avatar.png', // Using doctor avatar as placeholder logo if specific favicon is missing, user requested "logo de alteha"
  }
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
          <Toaster position="top-center" richColors />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
