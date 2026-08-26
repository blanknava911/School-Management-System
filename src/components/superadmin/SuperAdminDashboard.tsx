import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { School, AuditLog } from '../../types';
import {
  Shield,
  Building2,
  Users,
  Eye,
  PlusCircle,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onOpenCreateSchool: () => void;
  setActiveTab: (tab: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onOpenCreateSchool,
  setActiveTab,
}) => {
  const { switchSchoolInspection, currentUser } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [platformLogs, setPlatformLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusToggleSchool, setStatusToggleSchool] = useState<{ school: School; targetStatus: 'Active' | 'Disabled' } | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      const [sList, logs] = await Promise.all([
        ApiService.getSchools(),
        ApiService.getAuditLogs('PLATFORM'),
      ]);
      setSchools(sList);
      setPlatformLogs(logs);
    } catch (err) {
      console.error('Failed to load super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  const handleInspectSchool = async (schoolId: string) => {
    try {
      await switchSchoolInspection(schoolId);
      setActiveTab('dashboard'); // Switch view to school workspace in inspection mode
    } catch (err) {
      console.error('Failed to switch context:', err);
    }
  };

  return (
    <div className="space-y-8">
      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Super Admin Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-xl font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Platform Super Admin Control Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">Global Multi-Tenant Infrastructure</h1>
          </div>
        </div>

        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Logged in as <strong>{currentUser?.fullName}</strong>. You hold global management authority. School data is strictly isolated by default. To inspect any tenant environment, use the <span className="text-amber-400 font-bold">Switch School Context</span> action below.
        </p>
      </div>

      {/* Platform Global Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Registered Tenants</span>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{schools.length}</div>
          <p className="text-[11px] text-slate-500">Isolated school installations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tenant Security Status</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600">Strictly Isolated</div>
          <p className="text-[11px] text-slate-500">Automatic school_id filtering active</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Security Events</span>
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{platformLogs.length}</div>
          <p className="text-[11px] text-slate-500">Audited platform actions</p>
        </div>
      </div>

      {/* Registered Schools Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Registered Schools Directory</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select "Switch Context" to safely inspect any tenant school with recorded audit trails.
            </p>
          </div>

          <button
            onClick={onOpenCreateSchool}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New School</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading schools directory...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schools.map(s => (
              <div key={s.id} className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-3 bg-slate-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs overflow-hidden shrink-0"
                      style={{ backgroundColor: s.primaryColor }}
                    >
                      {s.logo && s.logo.startsWith('http') ? (
                        <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        s.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{s.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span className="bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800">{s.id}</span>
                        <span>•</span>
                        <span className="text-indigo-600 font-bold">{s.registrationNumber || `SCH-2026-${s.id.replace('SCH-', '')}`}</span>
                        <span>•</span>
                        <span>{s.country}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      s.status === 'Disabled'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-1 italic">
                  "{s.motto || 'No motto specified'}"
                </p>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-500 text-[11px]">Academic Year: <strong>{s.academicYear}</strong></span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setStatusToggleSchool({ school: s, targetStatus: s.status === 'Active' ? 'Disabled' : 'Active' })}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                        s.status === 'Active'
                          ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                          : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {s.status === 'Active' ? 'Disable School' : 'Enable School'}
                    </button>

                    <button
                      onClick={() => handleInspectSchool(s.id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Switch Context</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Disable / Enable School */}
      {statusToggleSchool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 space-y-4">
            <div className={`flex items-center space-x-3 ${statusToggleSchool.targetStatus === 'Disabled' ? 'text-rose-600' : 'text-emerald-600'}`}>
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">
                {statusToggleSchool.targetStatus === 'Disabled' ? 'Disable School Tenant' : 'Enable School Tenant'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to {statusToggleSchool.targetStatus === 'Disabled' ? 'disable' : 'enable'} access for{' '}
              <strong className="text-slate-900 font-bold">{statusToggleSchool.school.name}</strong>?
              {statusToggleSchool.targetStatus === 'Disabled' && (
                <span className="block mt-1 text-rose-600 font-medium">
                  When disabled, school staff and administrators will be blocked from logging in until reactivated.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setStatusToggleSchool(null)}
                className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await ApiService.toggleSchoolStatus(
                      statusToggleSchool.school.id,
                      statusToggleSchool.targetStatus,
                      currentUser || undefined
                    );
                    setActionMsg(`School "${statusToggleSchool.school.name}" status updated to ${statusToggleSchool.targetStatus}.`);
                    setTimeout(() => setActionMsg(null), 3500);
                    setStatusToggleSchool(null);
                    loadPlatformData();
                  } catch (err: any) {
                    alert(err.message || 'Failed to update school status');
                  }
                }}
                className={`px-4 py-2 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer ${
                  statusToggleSchool.targetStatus === 'Disabled'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirm {statusToggleSchool.targetStatus === 'Disabled' ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
