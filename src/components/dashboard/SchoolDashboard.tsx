import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import {
  Building2,
  Users,
  BookOpen,
  Layers,
  GraduationCap,
  Palette,
  ShieldCheck,
  CheckCircle2,
  Activity,
  History,
  ArrowRight,
  Settings,
  Sparkles,
  Lock,
  Clock,
  FileText,
  AlertCircle,
  FileCheck,
  ChevronRight,
  BarChart3,
  Calendar,
  Share2,
  Check,
  PlusCircle,
  FolderOpen,
} from 'lucide-react';

import { MyWorkSection } from './MyWorkSection';
import { ContinueWorkingWidget } from './ContinueWorkingWidget';
import { SchoolCalendarWidget } from './SchoolCalendarWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { Role } from '../../types';

interface SchoolDashboardProps {
  setActiveTab: (tab: string) => void;
}

export const SchoolDashboard: React.FC<SchoolDashboardProps> = ({ setActiveTab }) => {
  const { activeSchool, currentUser } = useAuth();

  const [stats, setStats] = useState({
    usersCount: 0,
    deptCount: 0,
    subjectCount: 0,
    gradeCount: 0,
    classCount: 0,
    auditCount: 0,
    assessmentsDraft: 3,
    assessmentsPending: 8,
    assessmentsApproved: 14,
    resourcesCount: 22,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchool) return;

    const loadStats = async () => {
      setLoading(true);
      try {
        const [users, depts, subjs, gc, logs] = await Promise.all([
          ApiService.getUsers(activeSchool.id),
          ApiService.getDepartments(activeSchool.id),
          ApiService.getSubjects(activeSchool.id),
          ApiService.getGradesAndClasses(activeSchool.id),
          ApiService.getAuditLogs(activeSchool.id),
        ]);

        setStats(prev => ({
          ...prev,
          usersCount: users.length,
          deptCount: depts.length,
          subjectCount: subjs.length,
          gradeCount: gc.grades.length,
          classCount: gc.classes.length,
          auditCount: logs.length,
        }));
      } catch (err) {
        console.error('Failed to load school dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [activeSchool]);

  if (!activeSchool || !currentUser) return null;

  // Time-of-day greeting calculation
  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userRoles: Role[] = currentUser.roles && currentUser.roles.length > 0 ? currentUser.roles : [currentUser.role];

  const primaryRole = currentUser.role;

  // Calculate School Profile Completion Percentage
  const calculateProfileCompletion = (): number => {
    let score = 0;
    if (activeSchool.name) score += 10;
    if (activeSchool.type) score += 10;
    if (activeSchool.province) score += 10;
    if (activeSchool.country) score += 10;
    if (activeSchool.motto) score += 5;
    if (activeSchool.phone) score += 5;
    if (activeSchool.email) score += 5;
    if (activeSchool.address) score += 5;
    if (activeSchool.postalAddress) score += 5;
    if (activeSchool.website) score += 5;
    if (activeSchool.emisNumber) score += 5;
    if (activeSchool.registrationNumber) score += 5;
    if (activeSchool.logo && !activeSchool.logo.includes('unsplash')) score += 10;
    if (activeSchool.badge) score += 10;
    return Math.min(100, score);
  };

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Personalized Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Personalized Workspace Active &bull; {activeSchool.name}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {getGreetingTime()}, {currentUser.fullName}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Welcome to your personalized school command center. Prioritize tasks requiring immediate attention,
            resume recent drafts, and manage academic workflows.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {userRoles.map(r => (
              <span
                key={r}
                className="bg-blue-600/30 text-blue-200 border border-blue-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider"
              >
                {r.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Academic Context Stat */}
        <div className="bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 rounded-xl p-4 shrink-0 flex items-center space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-inner overflow-hidden shrink-0 border border-blue-400/30">
            {activeSchool.logo ? (
              <img src={activeSchool.logo} alt={activeSchool.name} className="w-full h-full object-contain p-1 bg-white" />
            ) : activeSchool.badge ? (
              <img src={activeSchool.badge} alt={activeSchool.name} className="w-full h-full object-contain p-1 bg-white" />
            ) : (
              activeSchool.name.charAt(0)
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-white">{activeSchool.name}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Academic Year {activeSchool.academicYear} &bull; {activeSchool.terms}
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-1 uppercase tracking-wider">
              Tenant ID: {activeSchool.id}
            </div>
          </div>
        </div>
      </div>

      {/* Complete School Profile Banner */}
      {profileCompletion < 100 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-amber-950">Complete your School Profile</h3>
                <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 font-extrabold text-[10px] rounded-full border border-amber-300">
                  Profile Completion {profileCompletion}%
                </span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed max-w-xl">
                Finish setting up your telephone number, physical address, EMIS registration number, school motto, and crest badge.
              </p>
              <div className="w-full max-w-md bg-amber-200/60 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <span>Continue Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. WHAT REQUIRES MY ATTENTION TODAY? ("MY WORK" SECTION) */}
      <MyWorkSection setActiveTab={setActiveTab} />

      {/* 2. WHAT HAVE I RECENTLY BEEN WORKING ON? ("CONTINUE WORKING") */}
      <ContinueWorkingWidget setActiveTab={setActiveTab} />

      {/* 3. QUICK ACTIONS & ACADEMIC CALENDAR */}
      <QuickActionsWidget setActiveTab={setActiveTab} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SchoolCalendarWidget setActiveTab={setActiveTab} />
        </div>

        {/* Knowledge Hub Quick Feature Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Knowledge Hub Resources</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Access CAPS curriculum guidelines, past exam exemplars, rubrics, and departmental teaching files.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div
                onClick={() => setActiveTab('knowledge')}
                className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200/80 rounded-xl transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="font-semibold text-slate-800">My Uploaded Resources</div>
                <span className="text-[10px] font-bold text-purple-600">6 Files &rarr;</span>
              </div>
              <div
                onClick={() => setActiveTab('knowledge')}
                className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200/80 rounded-xl transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="font-semibold text-slate-800">Shared Department Guidelines</div>
                <span className="text-[10px] font-bold text-purple-600">16 Files &rarr;</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('knowledge')}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Open Knowledge Hub
          </button>
        </div>
      </div>

      {/* ROLE-SPECIFIC DEEP SUMMARY CARDS & SECTIONS */}

      {/* TEACHER DASHBOARD SPECIFIC VIEW */}
      {(primaryRole === 'TEACHER' || userRoles.includes('TEACHER')) && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Teacher Workspace & Teaching Assignments</h2>
              <p className="text-xs text-slate-500">Your assigned subjects, classes, and assessment drafts</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Role: Educator / Teacher
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Teaching Assignments</span>
              <p className="text-2xl font-bold text-slate-900">3 Classes</p>
              <div className="text-[11px] text-blue-600 font-medium">Grades 4, 5 & 6 Math</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Draft Assessments</span>
              <p className="text-2xl font-bold text-slate-900">2 In Progress</p>
              <div className="text-[11px] text-amber-600 font-medium">Needs completion</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Awaiting Review</span>
              <p className="text-2xl font-bold text-slate-900">4 Submitted</p>
              <div className="text-[11px] text-purple-600 font-medium">With HOD / Principal</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Approved Assessments</span>
              <p className="text-2xl font-bold text-slate-900">8 Published</p>
              <div className="text-[11px] text-emerald-600 font-medium">Ready for learners</div>
            </div>
          </div>

          {/* Teaching Assignments Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm">My Assigned Teaching Classes</h3>
              <button onClick={() => setActiveTab('assessments')} className="text-xs font-bold text-blue-600">
                Create Assessment &rarr;
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs">IP</div>
                  <div>
                    <div className="font-bold text-slate-900">Grade 4A - Mathematics</div>
                    <div className="text-slate-500 text-[11px]">Intermediate Phase &bull; Term 3 CAPS Curriculum</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('assessments')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
                >
                  Create Assessment
                </button>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs">IP</div>
                  <div>
                    <div className="font-bold text-slate-900">Grade 5B - Natural Sciences & Technology</div>
                    <div className="text-slate-500 text-[11px]">Intermediate Phase &bull; Term 3 CAPS Curriculum</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('assessments')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
                >
                  Create Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENTAL HEAD (DP / HOD) SPECIFIC VIEW */}
      {(primaryRole === 'HOD' || userRoles.includes('HOD')) && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Departmental Moderation & Oversight</h2>
              <p className="text-xs text-slate-500">Moderation queue for department assessments</p>
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Role: Departmental Head (HOD)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Awaiting Moderation</span>
              <p className="text-2xl font-bold text-purple-600">8 Items</p>
              <div className="text-[11px] text-slate-500 font-medium">Pending HOD signoff</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Returned to Teachers</span>
              <p className="text-2xl font-bold text-rose-600">3 Items</p>
              <div className="text-[11px] text-slate-500 font-medium">Revisions requested</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Approved This Week</span>
              <p className="text-2xl font-bold text-emerald-600">12 Items</p>
              <div className="text-[11px] text-slate-500 font-medium">CAPS compliant</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Department Teachers</span>
              <p className="text-2xl font-bold text-slate-900">6 Educators</p>
              <div className="text-[11px] text-slate-500 font-medium">Active this term</div>
            </div>
          </div>
        </div>
      )}

      {/* PRINCIPAL DASHBOARD SPECIFIC VIEW */}
      {(primaryRole === 'PRINCIPAL' || userRoles.includes('PRINCIPAL')) && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">School Command Center & Phase Overview</h2>
              <p className="text-xs text-slate-500">School-wide academic submission status by phase</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Role: Principal / Head of School
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 text-xs">Foundation Phase (Grade R–3)</h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">FP</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-slate-400 text-[9px] uppercase font-bold">Submitted</div>
                  <div className="font-bold text-slate-900">12</div>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <div className="text-amber-600 text-[9px] uppercase font-bold">Returned</div>
                  <div className="font-bold text-amber-900">1</div>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <div className="text-emerald-600 text-[9px] uppercase font-bold">Approved</div>
                  <div className="font-bold text-emerald-900">11</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 text-xs">Intermediate Phase (Grade 4–6)</h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">IP</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-slate-400 text-[9px] uppercase font-bold">Submitted</div>
                  <div className="font-bold text-slate-900">18</div>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <div className="text-amber-600 text-[9px] uppercase font-bold">Returned</div>
                  <div className="font-bold text-amber-900">2</div>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <div className="text-emerald-600 text-[9px] uppercase font-bold">Approved</div>
                  <div className="font-bold text-emerald-900">16</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 text-xs">Senior Phase (Grade 7)</h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">SP</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-slate-400 text-[9px] uppercase font-bold">Submitted</div>
                  <div className="font-bold text-slate-900">8</div>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <div className="text-amber-600 text-[9px] uppercase font-bold">Returned</div>
                  <div className="font-bold text-amber-900">0</div>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <div className="text-emerald-600 text-[9px] uppercase font-bold">Approved</div>
                  <div className="font-bold text-emerald-900">8</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHOOL ADMINISTRATOR SPECIFIC VIEW */}
      {(primaryRole === 'SCHOOL_ADMIN' || userRoles.includes('SCHOOL_ADMIN')) && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">School Operations & User Administration</h2>
              <p className="text-xs text-slate-500">Tenant setup, staff management, and system logs</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Role: School Administrator
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Staff</span>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.usersCount}</p>
              <div className="text-[11px] text-emerald-600 font-medium">Verified Accounts</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Departments</span>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.deptCount}</p>
              <div className="text-[11px] text-slate-500 font-medium">Academic Groups</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Storage Usage</span>
              <p className="text-2xl font-bold text-slate-900">1.2 GB</p>
              <div className="text-[11px] text-slate-500 font-medium">Of 50 GB Quota</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Audit Trail</span>
              <p className="text-2xl font-bold text-slate-900">{loading ? '...' : stats.auditCount}</p>
              <div className="text-[11px] text-slate-500 font-medium">Events Recorded</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
