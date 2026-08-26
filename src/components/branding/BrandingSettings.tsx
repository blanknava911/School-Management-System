import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Palette, Save, CheckCircle2, Sparkles, Building2 } from 'lucide-react';

export const BrandingSettings: React.FC = () => {
  const { activeSchool, updateSchoolBranding, isLoading } = useAuth();

  const [primaryColor, setPrimaryColor] = useState(activeSchool?.primaryColor || '#1e3a8a');
  const [secondaryColor, setSecondaryColor] = useState(activeSchool?.secondaryColor || '#0d9488');
  const [academicYear, setAcademicYear] = useState(activeSchool?.academicYear || '2026');
  const [terms, setTerms] = useState(activeSchool?.terms || '4 Terms');
  const [language, setLanguage] = useState(activeSchool?.language || 'English');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!activeSchool) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    try {
      await updateSchoolBranding({
        primaryColor,
        secondaryColor,
        academicYear,
        terms,
        language,
      });
      setSuccessMsg('School branding and theme updated successfully across workspace!');
    } catch (err) {
      console.error('Failed to update branding:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            <span>School Branding & Theme Palette</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Customize visual theme, primary colors, and academic structure for <strong className="text-slate-800">{activeSchool.name}</strong>
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Live Color Theme Preview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Live Workspace Theme Preview</span>
        </h3>

        <div
          className="p-6 rounded-xl text-white shadow-lg space-y-3 transition-colors"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xl">
                {activeSchool.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-bold">{activeSchool.name}</h4>
                <p className="text-xs opacity-80">{activeSchool.motto}</p>
              </div>
            </div>

            <span
              className="px-3 py-1 rounded-md text-xs font-bold text-slate-950 shadow-xs"
              style={{ backgroundColor: secondaryColor }}
            >
              Academic Year {academicYear} ({terms})
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block font-bold text-slate-700 mb-2">Primary Accent Color</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm font-mono uppercase text-slate-900 outline-none w-full"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Used for header backgrounds, active navigation, and primary banners.</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-2">Secondary Accent Color</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={e => setSecondaryColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={e => setSecondaryColor(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm font-mono uppercase text-slate-900 outline-none w-full"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Used for highlight badges, status tags, and callouts.</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
            <input
              type="text"
              required
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Academic Term System</label>
            <select
              value={terms}
              onChange={e => setTerms(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 bg-white outline-none"
            >
              <option value="4 Terms">4 Terms System</option>
              <option value="3 Trimesters">3 Trimesters System</option>
              <option value="2 Semesters">2 Semesters System</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Primary Instruction Language</label>
            <input
              type="text"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Apply Theme & Branding Updates</span>
          </button>
        </div>
      </form>
    </div>
  );
};
