import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { canAccessModule, canEditSchoolBranding, getUserRoles } from '../../utils/rbac';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Building,
  Palette,
  ShieldAlert,
  Settings,
  History,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  FileText,
  FileCode,
  BarChart3,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, activeSchool, superAdminInspectingSchool } = useAuth();

  const isSuperAdminPlatformMode = currentUser?.role === 'SUPER_ADMIN' && !superAdminInspectingSchool;
  const primaryColor = activeSchool?.primaryColor || '#2563eb';

  // Permission Checks
  const userRolesList = getUserRoles(currentUser);
  const canAccessUsers = canAccessModule(currentUser, 'users');
  const canAccessAssessments = canAccessModule(currentUser, 'assessment_workspace');
  const canAccessKnowledge = canAccessModule(currentUser, 'knowledge_hub');
  const canAccessAcademic = canAccessModule(currentUser, 'departments');
  const canAccessTemplates = canAccessModule(currentUser, 'templates');
  const canAccessReports = canAccessModule(currentUser, 'reports');
  const canAccessProfile = canAccessModule(currentUser, 'school_profile');
  const canAccessBranding = canEditSchoolBranding(currentUser);
  const canAccessSettings = canAccessModule(currentUser, 'school_settings');
  const canAccessAudit = canAccessModule(currentUser, 'audit_trail');

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col border-r border-slate-800 shrink-0">
      {/* Platform Branding Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm shadow-xs">
            S
          </div>
          <div>
            <span className="font-bold text-sm text-white tracking-tight block">SAMP Core</span>
            <span className="text-blue-400 text-[10px] uppercase font-bold tracking-widest block">v1.0 Platform</span>
          </div>
        </div>
      </div>

      {/* School Context & Role Badge */}
      {activeSchool && (
        <div className="px-3 pt-4 pb-2">
          <div className="px-2 mb-2 text-slate-500 text-[10px] uppercase font-bold tracking-widest italic">School Context</div>
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0 border border-slate-600">
                {activeSchool.logo ? (
                  <img src={activeSchool.logo} alt={activeSchool.name} className="w-full h-full object-contain p-0.5 bg-white" />
                ) : activeSchool.badge ? (
                  <img src={activeSchool.badge} alt={activeSchool.name} className="w-full h-full object-contain p-0.5 bg-white" />
                ) : (
                  activeSchool.name.charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">{activeSchool.name}</p>
                <p className="text-slate-400 text-[10px] font-mono truncate">ID: {activeSchool.id}</p>
              </div>
            </div>

            {/* Display Assigned Roles */}
            <div className="pt-2 border-t border-slate-700/60">
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Your Assigned Role(s):</span>
              <div className="flex flex-wrap gap-1">
                {userRolesList.map(r => (
                  <span
                    key={r}
                    className="px-1.5 py-0.5 bg-blue-900/60 text-blue-300 border border-blue-700/50 text-[9px] font-bold rounded uppercase tracking-wider"
                  >
                    {r.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Options */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {isSuperAdminPlatformMode ? (
          /* Super Admin Navigation */
          <>
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
              Platform Administration
            </div>
            <button
              onClick={() => setActiveTab('superadmin-dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'superadmin-dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Platform Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('superadmin-schools')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'superadmin-schools'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Registered Schools</span>
            </button>
            <button
              onClick={() => setActiveTab('superadmin-audit')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'superadmin-audit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Platform Audit Logs</span>
            </button>
          </>
        ) : (
          /* School Context Navigation */
          <>
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
              Academic Operations
            </div>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              style={activeTab === 'dashboard' ? { backgroundColor: primaryColor } : {}}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {canAccessAssessments && (
              <button
                onClick={() => setActiveTab('assessments')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'assessments'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                style={activeTab === 'assessments' ? { backgroundColor: primaryColor } : {}}
              >
                <FileText className="w-4 h-4" />
                <span>Assessment Workspace</span>
              </button>
            )}

            {canAccessKnowledge && (
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'knowledge'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                style={activeTab === 'knowledge' ? { backgroundColor: primaryColor } : {}}
              >
                <BookOpen className="w-4 h-4" />
                <span>Knowledge Hub</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('archive')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'archive' || activeTab === 'templates'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              style={activeTab === 'archive' || activeTab === 'templates' ? { backgroundColor: primaryColor } : {}}
            >
              <FileCode className="w-4 h-4" />
              <span>Assessment Archive</span>
            </button>

            {canAccessReports && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                style={activeTab === 'reports' ? { backgroundColor: primaryColor } : {}}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports & Analytics</span>
              </button>
            )}

            <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
              School Administration
            </div>

            {canAccessUsers && (
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                style={activeTab === 'users' ? { backgroundColor: primaryColor } : {}}
              >
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </button>
            )}

            {canAccessProfile && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                style={activeTab === 'profile' ? { backgroundColor: primaryColor } : {}}
              >
                <Building className="w-4 h-4" />
                <span>School Profile</span>
              </button>
            )}

            {canAccessBranding && (
              <button
                onClick={() => setActiveTab('branding')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'branding'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                style={activeTab === 'branding' ? { backgroundColor: primaryColor } : {}}
              >
                <Palette className="w-4 h-4" />
                <span>Branding & Theme</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              style={activeTab === 'roles' ? { backgroundColor: primaryColor } : {}}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Roles & Permissions</span>
            </button>

            {canAccessSettings && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                style={activeTab === 'settings' ? { backgroundColor: primaryColor } : {}}
              >
                <Settings className="w-4 h-4" />
                <span>School Settings</span>
              </button>
            )}

            {canAccessAudit && (
              <button
                onClick={() => setActiveTab('audit')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                style={activeTab === 'audit' ? { backgroundColor: primaryColor } : {}}
              >
                <History className="w-4 h-4" />
                <span>School Audit Trail</span>
              </button>
            )}
          </>
        )}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-semibold uppercase tracking-widest flex items-center justify-between">
        <span>RBAC Protected</span>
        <span className="text-emerald-400 italic">Enforced</span>
      </div>
    </aside>
  );
};

