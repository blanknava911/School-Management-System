import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { canAccessModule } from '../../utils/rbac';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Download,
  ShieldAlert,
  Layers,
  Users,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { currentUser, activeSchool } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);

  const canAccess = canAccessModule(currentUser, 'reports');

  if (!canAccess) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-rose-900">Access Restricted by RBAC</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">
          Academic Reports and Analytics are restricted based on your role assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">School Reports & Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Academic compliance, moderation completion rates, and phase performance metrics for <strong className="text-slate-800">{activeSchool?.name}</strong>.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Executive Report</span>
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Workspaces</span>
          <div className="text-2xl font-black text-slate-900">12</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active Term 1 Assessments</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Moderation Rate</span>
          <div className="text-2xl font-black text-emerald-600">83.3%</div>
          <div className="text-[11px] text-slate-500 font-medium">10 of 12 Moderated / Approved</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending Revisions</span>
          <div className="text-2xl font-black text-amber-600">2</div>
          <div className="text-[11px] text-amber-700 font-medium">Returned to Educator</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Phases</span>
          <div className="text-2xl font-black text-indigo-600">3</div>
          <div className="text-[11px] text-slate-500 font-medium">FP, IP, and SP Active</div>
        </div>
      </div>

      {/* Phase Completion Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm">Phase Moderation Compliance Breakdown</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-3">Academic Phase</th>
                <th className="px-6 py-3">Grades Covered</th>
                <th className="px-6 py-3">Submissions</th>
                <th className="px-6 py-3">Approved</th>
                <th className="px-6 py-3">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">Foundation Phase (FP)</td>
                <td className="px-6 py-4 text-slate-600 font-mono">Grade R, 1, 2, 3</td>
                <td className="px-6 py-4 font-semibold">4 Assessments</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">4 Approved</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded border border-emerald-200">
                    100% Complete
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">Intermediate Phase (IP)</td>
                <td className="px-6 py-4 text-slate-600 font-mono">Grade 4, 5, 6</td>
                <td className="px-6 py-4 font-semibold">5 Assessments</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">4 Approved</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-[10px] rounded border border-amber-200">
                    80% (1 Pending)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">Senior Phase (SP)</td>
                <td className="px-6 py-4 text-slate-600 font-mono">Grade 7</td>
                <td className="px-6 py-4 font-semibold">3 Assessments</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">2 Approved</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-[10px] rounded border border-amber-200">
                    66.7% (1 Revision)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
