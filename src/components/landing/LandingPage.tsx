import React from 'react';
import { ArrowRight, GraduationCap, ShieldCheck, Users } from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => (
  <div className="min-h-screen bg-slate-950 text-white">
    <header className="border-b border-white/10">
      <div className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-2.5"><GraduationCap className="h-6 w-6" /></div>
          <div>
            <div className="font-black tracking-tight">School Assessment Platform</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-300">One account · Correct access</div>
          </div>
        </div>
      </div>
    </header>

    <main className="mx-auto grid min-h-[calc(100vh-8.75rem)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-200">
          <ShieldCheck className="h-4 w-4" />
          Role-based access is selected automatically
        </div>
        <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
          One secure entrance for your entire school.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Teachers, school leaders, and platform administrators use the same login. Student information is managed securely as academic records inside each school.
        </p>
        <button
          onClick={onOpenLogin}
          className="mt-9 flex items-center gap-3 rounded-2xl bg-white px-7 py-4 font-black text-slate-950 shadow-2xl hover:bg-indigo-50"
        >
          <span>Login to your account</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-300"><Users className="h-5 w-5" /></div>
          <div>
            <h2 className="font-black">Access follows responsibility</h2>
            <p className="text-xs text-slate-400">No portal selection required</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          {[
            ['Teacher', 'Manage assigned classes, students, marks, and evidence'],
            ['School leadership', 'Manage school users, academics, and settings'],
            ['Platform admin', 'Full platform and school oversight'],
          ].map(([role, access]) => (
            <div key={role} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="font-bold text-white">{role}</div>
              <div className="mt-1 text-slate-400">{access}</div>
            </div>
          ))}
        </div>
      </section>
    </main>

    <footer className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
      School Assessment Management Platform
    </footer>
  </div>
);
