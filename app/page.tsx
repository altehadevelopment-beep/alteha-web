import Link from 'next/link'
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
  Wallet
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-12 md:p-24 bg-slate-50 relative overflow-hidden font-outfit">

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-alteha-turquoise/20 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-alteha-violet/20 rounded-full blur-[120px]" />
      </div>

      {/* Floating Social Links */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-6">
        <a href="#" className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-slate-600 hover:text-alteha-violet border border-white/50 group">
          <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </a>
        <a href="#" className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-slate-600 hover:text-alteha-turquoise border border-white/50 group">
          <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </a>
        <a href="#" className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-slate-600 hover:text-blue-600 border border-white/50 group">
          <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </a>
      </div>

      <div className="z-10 text-center max-w-4xl flex flex-col items-center my-auto">
        <Link href="/">
          <Logo className="w-32 h-32 mb-8 animate-fade-in-up drop-shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer" />
        </Link>

        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
          Portal de Subastas Médicas Invertidas
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-alteha-turquoise to-alteha-violet animate-gradient bg-[length:200%_auto] tracking-[0.05em]">
            ALTEHA
          </span>
          <br />
          <span className="tracking-tighter italic text-slate-400 text-4xl md:text-5xl">Ecosistema de Salud</span>
        </h1>

        <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl">
          Conectamos a médicos especialistas, clínicas y aseguradoras en un entorno seguro, eficiente y transparente.
        </p>

        <div className="flex flex-col items-center gap-6 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full px-4">
            <Link
              href="/login?role=specialist"
              className="group relative px-6 py-10 bg-slate-900 text-white rounded-3xl font-semibold overflow-hidden shadow-2xl shadow-slate-900/20 hover:shadow-slate-900/40 transition-all hover:-translate-y-1 text-center flex flex-col items-center justify-center gap-4"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-alteha-turquoise/80 via-alteha-violet/80 to-alteha-turquoise/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient" />
              <Stethoscope className="w-12 h-12 relative z-10 text-alteha-turquoise group-hover:text-white transition-colors duration-300" />
              <span className="relative flex items-center gap-2 text-base z-10">
                Médico Especialista
              </span>
            </Link>

            <Link
              href="/login?role=insurance"
              className="group relative px-6 py-10 bg-white text-slate-700 border border-slate-200 rounded-3xl font-semibold overflow-hidden hover:border-alteha-turquoise/50 hover:text-alteha-turquoise transition-all hover:-translate-y-1 text-center flex flex-col items-center justify-center gap-4 shadow-xl shadow-slate-200/50 hover:shadow-slate-300/60"
            >
              <ShieldCheck className="w-12 h-12 text-slate-400 group-hover:text-alteha-turquoise transition-colors duration-300" />
              <span className="relative flex items-center gap-2 text-base">
                Empresa de Seguros
              </span>
            </Link>

            <Link
              href="/login?role=clinic"
              className="group relative px-6 py-10 bg-white text-slate-700 border border-slate-200 rounded-3xl font-semibold overflow-hidden hover:border-alteha-violet/50 hover:text-alteha-violet transition-all hover:-translate-y-1 text-center flex flex-col items-center justify-center gap-4 shadow-xl shadow-slate-200/50 hover:shadow-slate-300/60"
            >
              <Building2 className="w-12 h-12 text-slate-400 group-hover:text-alteha-violet transition-colors duration-300" />
              <span className="relative flex items-center gap-2 text-base">
                Clínica
              </span>
            </Link>

            <Link
              href="/login?role=provider"
              className="group relative px-6 py-10 bg-white text-slate-700 border border-slate-200 rounded-3xl font-semibold overflow-hidden hover:border-blue-400/50 hover:text-blue-500 transition-all hover:-translate-y-1 text-center flex flex-col items-center justify-center gap-4 shadow-xl shadow-slate-200/50 hover:shadow-slate-300/60"
            >
              <Truck className="w-12 h-12 text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
              <span className="relative flex items-center gap-2 text-base">
                Proveedor de Insumos
              </span>
            </Link>
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
