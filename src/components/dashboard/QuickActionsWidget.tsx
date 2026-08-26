import React from 'react';
import {
  PlusCircle,
  Upload,
  BarChart3,
  UserPlus,
  Building2,
  FileCode,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Database,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  tab: string;
  color: string;
  allowedRoles: Role[];
}

export const QuickActionsWidget: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const userRoles: Role[] = currentUser.roles && currentUser.roles.length > 0 ? currentUser.roles : [currentUser.role];

  const actions: QuickAction[] = [
    {
      id: 'qa-1',
      label: 'Create Assessment',
      description: 'Start a new CAPS compliant assessment workspace',
      icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
      tab: 'assessments',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100/80',
      allowedRoles: ['TEACHER', 'HOD', 'GRADE_HEAD', 'DEPUTY_PRINCIPAL', 'PRINCIPAL', 'SCHOOL_ADMIN'],
    },
    {
      id: 'qa-2',
      label: 'Upload Resource',
      description: 'Add exemplar papers, guidelines, or memorandums',
      icon: <Upload className="w-4 h-4 text-purple-600" />,
      tab: 'knowledge',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100/80',
      allowedRoles: ['TEACHER', 'HOD', 'GRADE_HEAD', 'DEPUTY_PRINCIPAL', 'PRINCIPAL', 'SCHOOL_ADMIN'],
    },
    {
      id: 'qa-3',
      label: 'View Reports',
      description: 'Access academic performance analytics & moderation logs',
      icon: <BarChart3 className="w-4 h-4 text-emerald-600" />,
      tab: 'reports',
      color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/80',
      allowedRoles: ['HOD', 'GRADE_HEAD', 'DEPUTY_PRINCIPAL', 'PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'qa-4',
      label: 'Invite User / Manage Staff',
      description: 'Add teachers, assign roles and phase responsibilities',
      icon: <UserPlus className="w-4 h-4 text-indigo-600" />,
      tab: 'users',
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100/80',
      allowedRoles: ['PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'qa-5',
      label: 'Assessment Templates',
      description: 'Manage standard school assessment cover sheets & rubrics',
      icon: <FileCode className="w-4 h-4 text-amber-600" />,
      tab: 'templates',
      color: 'bg-amber-50 border-amber-200 hover:bg-amber-100/80',
      allowedRoles: ['HOD', 'DEPUTY_PRINCIPAL', 'PRINCIPAL', 'SCHOOL_ADMIN'],
    },
    {
      id: 'qa-6',
      label: 'Manage School Settings',
      description: 'Configure academic year, terms, branding & structure',
      icon: <Building2 className="w-4 h-4 text-slate-700" />,
      tab: 'settings',
      color: 'bg-slate-100 border-slate-300 hover:bg-slate-200/80',
      allowedRoles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'],
    },
  ];

  const visibleActions = actions.filter(act =>
    act.allowedRoles.some(r => userRoles.includes(r))
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-sm">Quick Shortcuts</h3>
        <span className="text-[10px] text-slate-400 font-medium">Role-tailored shortcuts</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {visibleActions.map(act => (
          <button
            key={act.id}
            onClick={() => setActiveTab(act.tab)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group space-y-2 ${act.color}`}
          >
            <div className="p-2 bg-white rounded-lg shadow-2xs w-fit">{act.icon}</div>
            <div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 leading-tight">
                {act.label}
              </div>
              <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{act.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
