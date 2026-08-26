import React, { useState } from 'react';
import { ArrowRight, GraduationCap, Lock, Mail, ShieldCheck, X } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface UnifiedLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UnifiedLoginModal: React.FC<UnifiedLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password);
      onSuccess();
    } catch {
      // AuthContext exposes the server error above the form.
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
        <button
          aria-label="Close login"
          onClick={() => { clearError(); onClose(); }}
          className="absolute right-4 top-5 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-7 sm:p-9">
          <div className="mb-7 flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-600 p-3 shadow-lg shadow-indigo-600/30">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Sign in</h2>
              <p className="text-sm text-slate-400">One secure login for every account</p>
            </div>
          </div>

          <div className="mb-6 flex gap-2 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span>Your account role is detected automatically after your credentials are verified.</span>
          </div>

          {error && <div className="mb-4 rounded-xl border border-rose-800 bg-rose-950/60 p-3 text-sm text-rose-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Email address</span>
              <span className="relative block">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  autoFocus
                  type="email"
                  required
                  value={email}
                  onChange={event => { clearError(); setEmail(event.target.value); }}
                  placeholder="you@school.edu"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Password</span>
              <span className="relative block">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={event => { clearError(); setPassword(event.target.value); }}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-black hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{isLoading ? 'Checking account…' : 'Continue'}</span>
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
