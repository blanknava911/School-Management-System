import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Check, X, ShieldCheck } from 'lucide-react';

interface RoleCapability {
  role: string;
  label: string;
  scope: string;
  capabilities: {
    manageUsers: boolean;
    manageProfile: boolean;
    manageStructure: boolean;
    manageSettings: boolean;
    viewAuditLogs: boolean;
    switchSchool: boolean;
  };
}

export const RolesAndPermissionsView: React.FC = () => {
  const { activeSchool } = useAuth();

  const roleMatrix: RoleCapability[] = [
    {
      role: 'SUPER_ADMIN',
      label: 'Platform Super Admin',
      scope: 'Global Platform',
      capabilities: {
        manageUsers: true,
        manageProfile: true,
        manageStructure: true,
        manageSettings: true,
        viewAuditLogs: true,
        switchSchool: true, // Super admin context inspection
      },
    },
    {
      role: 'SCHOOL_ADMIN',
      label: 'School Administrator',
      scope: activeSchool?.name || 'School Tenant',
      capabilities: {
        manageUsers: true,
        manageProfile: true,
        manageStructure: true,
        manageSettings: true,
        viewAuditLogs: true,
        switchSchool: false,
      },
    },
    {
      role: 'PRINCIPAL',
      label: 'Principal',
      scope: activeSchool?.name || 'School Tenant',
      capabilities: {
        manageUsers: true,
        manageProfile: false,
        manageStructure: true,
        manageSettings: false,
        viewAuditLogs: true,
        switchSchool: false,
      },
    },
    {
      role: 'DEPUTY_PRINCIPAL',
      label: 'Deputy Principal',
      scope: activeSchool?.name || 'School Tenant',
      capabilities: {
        manageUsers: true,
        manageProfile: false,
        manageStructure: true,
        manageSettings: false,
        viewAuditLogs: true,
        switchSchool: false,
      },
    },
    {
      role: 'HOD',
      label: 'Head of Department (HOD)',
      scope: 'Assigned Department',
      capabilities: {
        manageUsers: false,
        manageProfile: false,
        manageStructure: true,
        manageSettings: false,
        viewAuditLogs: false,
        switchSchool: false,
      },
    },
    {
      role: 'TEACHER',
      label: 'Teacher',
      scope: 'Assigned Classes',
      capabilities: {
        manageUsers: false,
        manageProfile: false,
        manageStructure: false,
        manageSettings: false,
        viewAuditLogs: false,
        switchSchool: false,
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <span>Roles & Permission Hierarchy Matrix</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            System permissions configured for 6 user role levels.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Role Title</th>
                <th className="px-6 py-4">Authority Scope</th>
                <th className="px-6 py-4 text-center">Manage Staff</th>
                <th className="px-6 py-4 text-center">School Profile</th>
                <th className="px-6 py-4 text-center">Academic Structure</th>
                <th className="px-6 py-4 text-center">School Settings</th>
                <th className="px-6 py-4 text-center">Audit Logs</th>
                <th className="px-6 py-4 text-center">Switch Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {roleMatrix.map(r => (
                <tr key={r.role} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{r.label}</div>
                    <div className="text-[10px] text-indigo-600 font-mono font-bold">{r.role}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{r.scope}</td>

                  <td className="px-6 py-4 text-center">
                    {r.capabilities.manageUsers ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {r.capabilities.manageProfile ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {r.capabilities.manageStructure ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {r.capabilities.manageSettings ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {r.capabilities.viewAuditLogs ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {r.capabilities.switchSchool ? (
                      <Check className="w-4 h-4 text-amber-500 mx-auto font-bold" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
