import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, X, Lock, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';

interface PlatformLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PlatformLoginModal: React.FC<PlatformLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PlatformLoginModal] Submitting platform super admin login:', { email });
    try {
      await login(email, password);
      console.log('[PlatformLoginModal] Super admin login succeeded');
      onSuccess();
    } catch (err: any) {
      console.warn('[PlatformLoginModal] Platform login failed:', err?.message || err);
      // handled in context
    }
  };

  const setDemoSuperAdmin = () => {
    console.log('[PlatformLoginModal] Quick-filling Super Admin demo account');
    clearError();
    setEmail('admin@platform.com');
    setPassword('admin123');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-amber-500/30">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Platform Super Admin</h2>
            <p className="text-xs text-amber-400/80">Global multi-tenant platform control</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Super Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-lg transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? <span>Authenticating...</span> : <><span>Login to Platform</span> <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={setDemoSuperAdmin}
            className="text-xs text-amber-400 hover:underline inline-flex items-center space-x-1 font-medium"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Auto-fill Super Admin Credentials</span>
          </button>
        </div>
      </div>
    </div>
  );
};
