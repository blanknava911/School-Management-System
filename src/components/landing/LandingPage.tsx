import React from 'react';
import {
  Building2,
  Lock,
  Users,
  ShieldCheck,
  PlusCircle,
  LogIn,
  KeyRound,
  GraduationCap,
  Sparkles,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface LandingPageProps {
  onOpenRegisterWizard: () => void;
  onOpenSchoolLogin: () => void;
  onOpenPlatformLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenRegisterWizard,
  onOpenSchoolLogin,
  onOpenPlatformLogin,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block">
                School Assessment Management Platform
              </span>
              <span className="text-xs text-indigo-400 font-medium tracking-wide uppercase">
                Multi-Tenant Architecture v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenSchoolLogin}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <LogIn className="w-4 h-4 text-indigo-400" />
              <span>School Login</span>
            </button>

            <button
              onClick={onOpenPlatformLogin}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-lg transition-all border border-slate-800"
            >
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>Platform Login</span>
            </button>

            <button
              onClick={onOpenRegisterWizard}
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create School</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enterprise-Grade Multi-Tenant Isolation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              School Assessment <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300">
                Management Platform
              </span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              Built on a true multi-tenant foundation. Every school operates as an independent, isolated, and custom-branded workspace with zero cross-tenant access.
            </p>

            {/* Core Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onOpenRegisterWizard}
                className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold rounded-xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Create School</span>
              </button>

              <button
                onClick={onOpenSchoolLogin}
                className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white text-base font-bold rounded-xl border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn className="w-5 h-5 text-indigo-400" />
                <span>School Login</span>
              </button>

              <button
                onClick={onOpenPlatformLogin}
                className="inline-flex items-center justify-center space-x-3 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-amber-300 text-sm font-semibold rounded-xl border border-amber-500/30 transition-all"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Platform Login</span>
              </button>
            </div>

            {/* Architectural Guarantees */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800">
              <div className="flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Total Data Isolation</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Strict `school_id` backend context enforcement.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Building2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Custom Branding</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Custom logos, mottos, and theme palettes.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">7 Security Roles</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">From Super Admin to Teachers & HODs.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Illustration / Live Demo Card */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs text-slate-500 font-mono">Isolated School Environment</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold text-white">Apex International Academy</span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
                    SCH-1001
                  </span>
                </div>
                <p className="text-xs text-slate-400">Excellence Through Innovation and Wisdom</p>
                <div className="flex items-center space-x-2 pt-2">
                  <span className="text-[11px] px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded font-medium">
                    Admin: Eleanor Vance
                  </span>
                  <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-medium">
                    2026 Academic Year
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-purple-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-white">St. Jude College</span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
                    SCH-1002
                  </span>
                </div>
                <p className="text-xs text-slate-400">Faith, Integrity, and Academic Valor</p>
                <div className="flex items-center space-x-2 pt-2">
                  <span className="text-[11px] px-2 py-0.5 bg-purple-950 text-purple-300 rounded font-medium">
                    Admin: David Mokoena
                  </span>
                  <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-medium">
                    3 Trimesters
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center text-xs text-slate-500 font-mono">
              🔒 Automatic tenant filtering active across all database requests
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 bg-slate-950 text-center text-xs text-slate-500">
        <p>School Assessment Management Platform • Version 1.0 Core Architecture</p>
      </footer>
    </div>
  );
};
