import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LandingPage } from './components/landing/LandingPage';
import { UnifiedLoginModal } from './components/auth/SchoolLoginModal';
import { SchoolRegistrationWizard } from './components/wizard/SchoolRegistrationWizard';
import { FirstTimeSetupWizard } from './components/wizard/FirstTimeSetupWizard';
import { SchoolDashboard } from './components/dashboard/SchoolDashboard';
import { UserManagement } from './components/users/UserManagement';
import { SchoolProfileView } from './components/profile/SchoolProfileView';
import { BrandingSettings } from './components/branding/BrandingSettings';
import { AcademicStructure } from './components/academic/AcademicStructure';
import { RolesAndPermissionsView } from './components/roles/RolesAndPermissionsView';
import { SchoolSettingsView } from './components/settings/SchoolSettingsView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { AssessmentWorkspaceView } from './components/assessments/AssessmentWorkspaceView';
import { KnowledgeHubView } from './components/knowledge/KnowledgeHubView';
import { TemplatesView } from './components/templates/TemplatesView';
import { AssessmentArchiveView } from './components/archive/AssessmentArchiveView';
import { ReportsView } from './components/reports/ReportsView';
import { StudentWorkspace } from './components/students/StudentWorkspace';

function MainLayout() {
  const { currentUser, activeSchool, superAdminInspectingSchool, refreshSchoolData } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modal Dialog states
  const [isRegisterWizardOpen, setIsRegisterWizardOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [showManualSetupWizard, setShowManualSetupWizard] = useState<boolean>(false);

  // If user is not logged in, render the Landing Page
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onOpenLogin={() => setIsLoginOpen(true)}
        />

        <UnifiedLoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onSuccess={() => {
            setIsLoginOpen(false);
            setActiveTab('dashboard');
          }}
        />
      </>
    );
  }

  // First Time Setup Wizard Trigger for new School Admins
  const isFirstLogin = activeSchool?.isFirstLogin && !superAdminInspectingSchool && currentUser.role === 'SCHOOL_ADMIN';

  if (isFirstLogin || showManualSetupWizard) {
    return (
      <FirstTimeSetupWizard
        onComplete={() => {
          setShowManualSetupWizard(false);
          refreshSchoolData();
          setActiveTab('dashboard');
        }}
      />
    );
  }

  // Determine active view tab
  const renderContent = () => {
    if (currentUser.role === 'STUDENT') {
      return <StudentWorkspace />;
    }
    // Super Admin platform mode tabs
    if (currentUser.role === 'SUPER_ADMIN' && !superAdminInspectingSchool) {
      if (activeTab === 'superadmin-audit') {
        return <AuditTrailView isPlatformMode={true} />;
      }
      return (
        <SuperAdminDashboard
          onOpenCreateSchool={() => setIsRegisterWizardOpen(true)}
          setActiveTab={setActiveTab}
        />
      );
    }

    // School Context Views
    switch (activeTab) {
      case 'dashboard':
        return <SchoolDashboard setActiveTab={setActiveTab} />;
      case 'assessments':
        return <AssessmentWorkspaceView />;
      case 'knowledge':
        return <KnowledgeHubView />;
      case 'users':
        return <UserManagement />;
      case 'academic':
        return <AcademicStructure />;
      case 'archive':
      case 'templates':
        return <AssessmentArchiveView onNavigateToWorkspace={() => setActiveTab('assessments')} />;
      case 'reports':
        return <ReportsView />;
      case 'profile':
        return <SchoolProfileView />;
      case 'branding':
        return <BrandingSettings />;
      case 'roles':
        return <RolesAndPermissionsView />;
      case 'settings':
        return <SchoolSettingsView onRestartWizard={() => setShowManualSetupWizard(true)} />;
      case 'audit':
        return <AuditTrailView isPlatformMode={false} />;
      default:
        return <SchoolDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex w-full">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 min-w-0 p-6 sm:p-8 bg-slate-50 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Professional Polish Footer */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
        <div>SAMP Core Engine &bull; Multi-Tenant Isolated Architecture</div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          <span>Tenant Context Valid &bull; Isolation Enforced</span>
        </div>
      </footer>

      <SchoolRegistrationWizard
        isOpen={isRegisterWizardOpen}
        onClose={() => setIsRegisterWizardOpen(false)}
        onSuccess={() => {
          setIsRegisterWizardOpen(false);
          setActiveTab('dashboard');
        }}
      />
    </div>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
