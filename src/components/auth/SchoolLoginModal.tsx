import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, X, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface SchoolLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SchoolLoginModal: React.FC<SchoolLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SchoolLoginModal] Submitting login credentials:', { email });
    try {
      await login(email, password);
      console.log('[SchoolLoginModal] Login succeeded, triggering onSuccess callback');
      onSuccess();
    } catch (err: any) {
      console.warn('[SchoolLoginModal] Login failed:', err?.message || err);
      // error is handled in context
    }
  };

  const setDemoAccount = (demoEmail: string, demoPass: string) => {
    console.log('[SchoolLoginModal] Quick-selecting demo account:', demoEmail);
    clearError();
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-600 text-white rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">School Login</h2>
            <p className="text-xs text-slate-500">Access your school's private workspace</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">School Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@apex.edu"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? <span>Logging in...</span> : <><span>Login to School</span> <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {/* Demo Account Quick-Fill Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Quick Demo Credentials</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoAccount('admin@apexprimary.edu.za', 'apex123')}
              className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-slate-800">Apex Admin</div>
              <div className="text-[10px] text-slate-500 truncate">admin@apexprimary.edu.za</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('principal@apexprimary.edu.za', 'apex123')}
              className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-slate-800">Apex Principal</div>
              <div className="text-[10px] text-slate-500 truncate">principal@apexprimary.edu.za</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('m.smith@apexprimary.edu.za', 'apex123')}
              className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-slate-800">Apex Educator</div>
              <div className="text-[10px] text-slate-500 truncate">m.smith@apexprimary.edu.za</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('admin@stjudeprimary.edu.za', 'stjude123')}
              className="p-2 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-slate-800">St. Jude Admin</div>
              <div className="text-[10px] text-slate-500 truncate">admin@stjudeprimary.edu.za</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
