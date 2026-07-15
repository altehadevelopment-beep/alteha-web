'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Stethoscope, Building2, ShieldCheck, Truck, Activity, Pill } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

// Selector de perfil para /register: cada tarjeta lleva al formulario de su rol.
// Las clases de color van completas y literales: Tailwind escanea el texto del archivo
// y no genera clases armadas por interpolación.
const profiles = [
  {
    href: '/register/specialist',
    name: 'Médico Especialista',
    description: 'Ofrece tus honorarios y participa en subastas de intervenciones.',
    icon: Stethoscope,
    overlay: 'bg-alteha-turquoise',
    iconHover: 'group-hover:bg-alteha-turquoise'
  },
  {
    href: '/register/clinic',
    name: 'Clínica',
    description: 'Postula tu institución para alojar las intervenciones.',
    icon: Building2,
    overlay: 'bg-alteha-violet',
    iconHover: 'group-hover:bg-alteha-violet'
  },
  {
    href: '/register/insurance',
    name: 'Empresa de Seguros',
    description: 'Publica subastas y adjudica a los mejores oferentes.',
    icon: ShieldCheck,
    overlay: 'bg-alteha-turquoise',
    iconHover: 'group-hover:bg-alteha-turquoise'
  },
  {
    href: '/register/pharmacy',
    name: 'Casa de Salud',
    description: 'Cotiza y despacha los insumos de cada intervención.',
    icon: Pill,
    overlay: 'bg-emerald-500',
    iconHover: 'group-hover:bg-emerald-500'
  },
  {
    href: '/register/provider',
    name: 'Proveedor de Insumos',
    description: 'Suministra material médico al ecosistema.',
    icon: Truck,
    overlay: 'bg-blue-500',
    iconHover: 'group-hover:bg-blue-500'
  },
  {
    href: '/register/health-fund',
    name: 'Fondo Administrado',
    description: 'Administra fondos de salud para tus afiliados.',
    icon: Activity,
    overlay: 'bg-rose-500',
    iconHover: 'group-hover:bg-rose-500'
  }
]

export default function RegisterIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-outfit relative overflow-hidden py-10 px-4 md:px-10">
      {/* Fondo decorativo, consistente con el resto del portal */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-alteha-turquoise rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-alteha-violet rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-900 transition-all border border-slate-100 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold hidden md:block">Volver</span>
          </Link>
          <Link href="/" className="hover:scale-105 transition-transform">
            <Logo className="w-10 h-10" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
            Crea tu cuenta en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-alteha-turquoise to-alteha-violet">
              Alteha
            </span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Elige el perfil con el que participarás en el ecosistema. Cada uno tiene su propio formulario de registro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link
                href={profile.href}
                className="group relative flex flex-col items-start gap-4 h-full p-7 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-transparent shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out ${profile.overlay} opacity-[0.07]`}
                />
                <div
                  className={`relative z-10 p-4 rounded-2xl bg-slate-50 text-slate-400 group-hover:text-white transition-colors duration-300 ${profile.iconHover}`}
                >
                  <profile.icon className="w-7 h-7" />
                </div>
                <div className="relative z-10">
                  <h2 className="font-black text-slate-900 text-lg mb-1">{profile.name}</h2>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{profile.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 font-medium mt-12">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-alteha-violet font-bold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
