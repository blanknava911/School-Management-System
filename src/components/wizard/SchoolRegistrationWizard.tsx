import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  X,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Globe,
  Mail,
  Lock,
  User,
  Sparkles,
} from 'lucide-react';

interface SchoolRegistrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SchoolRegistrationWizard: React.FC<SchoolRegistrationWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerSchool, isLoading, error } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Create School Required Fields
  const [schoolName, setSchoolName] = useState('');
  const [schoolType, setSchoolType] = useState<'Primary School' | 'Secondary School' | 'Combined School'>('Primary School');
  const [province, setProvince] = useState('Gauteng');
  const [country, setCountry] = useState('South Africa');

  // Step 2: Create Administrator Required Fields
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    if (!schoolName.trim()) {
      setValidationError('School Name is required.');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setValidationError(null);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!adminFullName.trim() || !adminEmail.trim()) {
      setValidationError('Administrator Full Name and Email are required.');
      return;
    }

    if (adminPassword.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (adminPassword !== adminConfirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    try {
      await registerSchool({
        schoolInfo: {
          name: schoolName,
          type: schoolType,
          province,
          country,
        },
        adminInfo: {
          fullName: adminFullName,
          email: adminEmail,
          password: adminPassword,
        },
      });
      onSuccess();
    } catch (err: any) {
      // Handled in context
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/30 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Create New School</h2>
            <p className="text-xs text-slate-500">
              Step {step} of 2: {step === 1 ? 'School Details' : 'Administrator Account'}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
        </div>

        {(validationError || error) && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        {/* STEP 1: CREATE SCHOOL */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">School Name *</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                placeholder="e.g. Apex Primary School"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">School Type *</label>
              <select
                value={schoolType}
                onChange={e => setSchoolType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm font-medium"
              >
                <option value="Primary School">Primary School</option>
                <option value="Secondary School">Secondary School</option>
                <option value="Combined School">Combined School</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Province *</label>
                <select
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm font-medium"
                >
                  <option value="Gauteng">Gauteng</option>
                  <option value="Western Cape">Western Cape</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="Northern Cape">Northern Cape</option>
                  <option value="North West">North West</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Country *</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="South Africa"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Continue to Step 2</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: CREATE ADMINISTRATOR */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={adminFullName}
                  onChange={e => setAdminFullName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="e.g. admin@apex.edu"
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={adminConfirmPassword}
                    onChange={e => setAdminConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 text-xs flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isLoading ? 'Creating School...' : 'Create School & Log In'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
