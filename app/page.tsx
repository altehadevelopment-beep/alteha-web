'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Stethoscope,
  Building2,
  ShieldCheck,
  Truck,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  CreditCard,
  Wallet,
  Activity,
  Sparkles
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function Home() {
  const actors = [
    {
      role: 'specialist',
      name: 'Médico Especialista',
      icon: Stethoscope,
      color: 'alteha-turquoise',
      bg: 'bg-slate-900',
      borderColor: 'border-alteha-turquoise/30',
      hoverColor: 'bg-alteha-turquoise'
    },
    {
      role: 'insurance',
      name: 'Empresa de Seguros',
      icon: ShieldCheck,
      color: 'slate-400',
      bg: 'bg-white',
      borderColor: 'border-slate-200',
      hoverColor: 'bg-alteha-turquoise'
    },
    {
      role: 'clinic',
      name: 'Clínica',
      icon: Building2,
      color: 'slate-400',
      bg: 'bg-white',
      borderColor: 'border-slate-200',
      hoverColor: 'bg-alteha-violet'
    },
    {
      role: 'provider',
      name: 'Proveedor de Insumos',
      icon: Truck,
      color: 'slate-400',
      bg: 'bg-white',
      borderColor: 'border-slate-200',
      hoverColor: 'bg-blue-500'
    },
    {
      role: 'health-fund',
      name: 'Fondo Administrado',
      icon: Activity,
      color: 'slate-400',
      bg: 'bg-white',
      borderColor: 'border-slate-200',
      hoverColor: 'bg-rose-500'
    }
  ]

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12 bg-slate-50 relative overflow-hidden font-outfit">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-alteha-turquoise/30 rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] right-[10%] w-[50%] h-[50%] bg-alteha-violet/20 rounded-full blur-[140px]" 
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
      </div>

      {/* Floating Social Links */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-6">
        {['Instagram', 'Twitter', 'Linkedin'].map((social, i) => (
          <motion.a
            key={social}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + (i * 0.1) }}
            href="#"
            className="p-3 bg-white/40 backdrop-blur-xl rounded-full shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all text-slate-600 hover:text-alteha-violet border border-white/60 group"
          >
            {social === 'Instagram' && <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            {social === 'Twitter' && <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            {social === 'Linkedin' && <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          </motion.a>
        ))}
      </div>

      <div className="z-10 text-center max-w-6xl flex flex-col items-center my-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/">
            <Logo className="w-24 h-24 md:w-32 md:h-32 mb-8 drop-shadow-2xl hover:rotate-6 transition-transform duration-500 cursor-pointer" />
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/80 text-xs md:text-sm font-semibold text-slate-700 shadow-xl shadow-slate-200/50"
        >
          <Sparkles className="w-4 h-4 text-alteha-turquoise animate-pulse" />
          Portal de Subastas Médicas Invertidas
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-8xl font-black text-slate-900 mb-6 leading-none tracking-tight"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-alteha-turquoise via-alteha-violet to-alteha-turquoise animate-gradient bg-[length:200%_auto]">
            ALTEHA
          </span>
          <br />
          <span className="text-3xl md:text-5xl text-slate-400 font-medium tracking-tighter opacity-80 block mt-2">
            Ecosistema de Salud
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg md:text-xl text-slate-500 mb-16 leading-relaxed max-w-2xl font-medium"
        >
          La plataforma definitiva que conecta a médicos, clínicas y aseguradoras para una gestión transparente y eficiente.
        </motion.p>

        <div className="relative w-full overflow-visible py-10 px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-12 max-w-6xl mx-auto">
            {actors.map((actor, i) => (
              <motion.div
                key={actor.role}
                initial={{ opacity: 0, scale: 0.5, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.6 + (i * 0.1),
                  type: "spring",
                  stiffness: 100 
                }}
                className="flex flex-col items-center gap-4 group"
              >
                <Link href={`/login?role=${actor.role}`} className="relative">
                  {/* Outer circle animation */}
                  <div className={`absolute -inset-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md ${actor.hoverColor}/20 group-hover:scale-110`} />
                  
                  <div className={`
                    relative w-32 h-32 md:w-36 md:h-36 rounded-full 
                    ${actor.bg} border-2 ${actor.borderColor} 
                    flex items-center justify-center shadow-2xl 
                    group-hover:border-transparent group-hover:scale-105 
                    transition-all duration-500 overflow-hidden
                  `}>
                    <div className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out ${actor.hoverColor}`} />
                    
                    <actor.icon className={`
                      w-12 h-12 md:w-16 md:h-16 relative z-10 
                      ${actor.role === 'specialist' ? 'text-alteha-turquoise' : 'text-slate-400'} 
                      group-hover:text-white group-hover:rotate-12 transition-all duration-500
                    `} />
                  </div>
                </Link>
                <span className="text-sm md:text-base font-bold text-slate-700 tracking-tight group-hover:text-slate-900 group-hover:translate-y-1 transition-all duration-300 text-center px-2">
                  {actor.name}
                </span>
                <motion.div 
                  initial={{ width: 0 }}
                  whileHover={{ width: '40%' }}
                  className="h-1 bg-gradient-to-r from-alteha-turquoise to-alteha-violet rounded-full mt-[-8px]"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Combined Footer with Partner Logos */}
      <footer className="z-10 w-full mt-20 md:mt-0 pt-12 border-t border-slate-200/60 flex flex-col items-center gap-8 bg-white/40 backdrop-blur-sm rounded-t-[3rem] p-12">
        <div className="flex flex-col items-center gap-6">
          <p className="text-xs font-bold text-slate-400 tracking-[0.4em] uppercase">Nuestra Red de Pagos y Seguridad</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-80 hover:opacity-100 transition-opacity duration-500">
            {/* Binance Logo High-Fi */}
            <div className="flex items-center gap-3 group cursor-pointer grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="w-10 h-10 bg-[#F3BA2F] rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <div className="w-6 h-6 border-4 border-black rotate-45 flex items-center justify-center">
                  <div className="w-2 h-2 bg-black" />
                </div>
              </div>
              <span className="font-bold text-slate-800 text-2xl tracking-tighter">BINANCE</span>
            </div>

            {/* Visa Logo High-Fi */}
            <div className="flex items-center gap-0 group cursor-pointer -translate-y-1 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <span className="text-[#1A1F71] text-4xl font-black italic tracking-tighter flex items-baseline">
                V<span className="text-alteha-turquoise translate-y-[-2px] ml-[-2px]">I</span>SA
              </span>
            </div>

            {/* MasterCard Logo High-Fi */}
            <div className="flex items-center gap-[-10px] group cursor-pointer grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="relative flex items-center h-10 w-16 group-hover:scale-110 transition-transform">
                <div className="absolute left-0 w-10 h-10 bg-[#EB001B] rounded-full mix-blend-multiply" />
                <div className="absolute right-0 w-10 h-10 bg-[#F79E1B] rounded-full mix-blend-multiply" />
              </div>
            </div>

            {/* GuiaPay Logo High-Fi */}
            <div className="flex items-center gap-2 group cursor-pointer grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="bg-slate-900 p-2.5 rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-xl group-hover:shadow-alteha-violet/20 border border-white/10">
                <Link href="/">
                  <Logo className="w-7 h-7 invert cursor-pointer" />
                </Link>
              </div>
              <span className="font-bold text-slate-900 text-2xl tracking-tight italic">Guía<span className="text-alteha-turquoise">pay</span></span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-6xl gap-6 pt-8 border-t border-slate-100 text-slate-400 text-sm">
          <p className="font-medium">&copy; {new Date().getFullYear()} ALTEHA Ecosistema de Salud. Todos los derechos reservados.</p>
          <div className="flex gap-10 font-semibold text-[10px] uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-alteha-turquoise transition-colors">Privacidad</Link>
            <Link href="/terms" className="hover:text-alteha-violet transition-colors">Términos</Link>
            <Link href="/support" className="hover:text-blue-500 transition-colors">Soporte</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
