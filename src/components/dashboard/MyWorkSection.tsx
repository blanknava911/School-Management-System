import React, { useState } from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Users,
  ShieldCheck,
  ArrowRight,
  Eye,
  Check,
  X,
  Sparkles,
  ChevronRight,
  Building2,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface PriorityItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  phase: string;
  submittedBy: string;
  dueDate: string;
  status: 'RETURNED' | 'AWAITING_MODERATION' | 'DRAFT' | 'AWAITING_REVIEW' | 'AWAITING_PRINCIPAL' | 'STAFF_REQUEST';
  statusBadge: string;
  badgeColor: string;
  comments?: string;
  targetTab: string;
}

export const MyWorkSection: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [selectedItemForAction, setSelectedItemForAction] = useState<PriorityItem | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');

  if (!currentUser) return null;

  const userRoles: Role[] = currentUser.roles && currentUser.roles.length > 0 ? currentUser.roles : [currentUser.role];

  // Derive priority work items for the current user based on roles
  const getPriorityItems = (): PriorityItem[] => {
    const items: PriorityItem[] = [];

    // TEACHER PRIORITIES
    if (userRoles.includes('TEACHER')) {
      items.push({
        id: 'work-t1',
        title: 'Grade 4 Mathematics Term 3 Test',
        subject: 'Mathematics',
        grade: 'Grade 4',
        phase: 'Intermediate Phase',
        submittedBy: 'HOD Mr. Sipho Nkosi',
        dueDate: 'Today 16:00',
        status: 'RETURNED',
        statusBadge: '1 Assessment Returned',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        comments: 'Please revise Section B Bloom\'s taxonomy distribution and add formal memo grid.',
        targetTab: 'assessments',
      });
      items.push({
        id: 'work-t2',
        title: 'Grade 5 Natural Sciences & Tech Project',
        subject: 'Natural Sciences',
        grade: 'Grade 5',
        phase: 'Intermediate Phase',
        submittedBy: 'Self (Draft)',
        dueDate: 'In 2 days',
        status: 'DRAFT',
        statusBadge: '2 Draft Assessments',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        comments: 'Section A multiple choice completed. Section B practical rubric draft pending.',
        targetTab: 'assessments',
      });
    }

    // HOD / DP PRIORITIES
    if (userRoles.includes('HOD')) {
      items.push({
        id: 'work-hod1',
        title: 'Grade 6 Mathematics Mid-Term Assessment',
        subject: 'Mathematics',
        grade: 'Grade 6',
        phase: 'Intermediate Phase',
        submittedBy: 'Mr. J. van der Merwe',
        dueDate: 'Today 17:00',
        status: 'AWAITING_MODERATION',
        statusBadge: '8 Assessments Awaiting Moderation',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        comments: 'Submitted for formal Departmental CAPS Moderation & Sign-Off.',
        targetTab: 'assessments',
      });
      items.push({
        id: 'work-hod2',
        title: 'Grade 7 English FAL Formal Test',
        subject: 'English FAL',
        grade: 'Grade 7',
        phase: 'Senior Phase',
        submittedBy: 'Ms. P. Dlamini',
        dueDate: 'In 1 day',
        status: 'AWAITING_MODERATION',
        statusBadge: 'Awaiting Moderation',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        comments: 'Submitted with Memorandum and Cognitive Level Weighting breakdown.',
        targetTab: 'assessments',
      });
    }

    // DEPUTY PRINCIPAL PRIORITIES
    if (userRoles.includes('DEPUTY_PRINCIPAL')) {
      items.push({
        id: 'work-dp1',
        title: 'Senior Phase Life Orientation Term 3 Project',
        subject: 'Life Orientation',
        grade: 'Grade 7',
        phase: 'Senior Phase',
        submittedBy: 'HOD Senior Phase',
        dueDate: 'In 3 days',
        status: 'AWAITING_REVIEW',
        statusBadge: '4 Pending Deputy Principal Reviews',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        comments: 'Phase-wide academic alignment verification pending.',
        targetTab: 'assessments',
      });
    }

    // PRINCIPAL PRIORITIES
    if (userRoles.includes('PRINCIPAL')) {
      items.push({
        id: 'work-p1',
        title: 'Grade 7 Mathematics Final Examination Blueprint',
        subject: 'Mathematics',
        grade: 'Grade 7',
        phase: 'Senior Phase',
        submittedBy: 'HOD Math (Mr. S. Nkosi)',
        dueDate: 'Today 18:00',
        status: 'AWAITING_PRINCIPAL',
        statusBadge: '5 Assessments Awaiting Final Sign-off',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        comments: 'Moderated by HOD. Awaiting Principal final approval and printing authorization.',
        targetTab: 'assessments',
      });
    }

    // SCHOOL ADMIN PRIORITIES
    if (userRoles.includes('SCHOOL_ADMIN')) {
      items.push({
        id: 'work-sa1',
        title: '2 New Staff Accounts Pending Role Assignment',
        subject: 'User Access',
        grade: 'All Phases',
        phase: 'Administration',
        submittedBy: 'Registration Portal',
        dueDate: 'Immediate',
        status: 'STAFF_REQUEST',
        statusBadge: '2 New Staff Requests',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        comments: 'New educators registered for Apex Primary. Verify email domain and assign teaching subjects.',
        targetTab: 'users',
      });
    }

    // SUPER ADMIN PRIORITIES
    if (userRoles.includes('SUPER_ADMIN')) {
      items.push({
        id: 'work-su1',
        title: 'St. Jude Primary Setup Pending Verification',
        subject: 'Platform Tenant',
        grade: 'School Level',
        phase: 'Platform Onboarding',
        submittedBy: 'School Registrar',
        dueDate: 'Today',
        status: 'STAFF_REQUEST',
        statusBadge: '1 Pending Tenant Activation',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        comments: 'New school account created. Verify EMIS registration document and grant license.',
        targetTab: 'superadmin-dashboard',
      });
    }

    return items;
  };

  const priorityItems = getPriorityItems();

  const handleActionClick = (item: PriorityItem, actionType: 'APPROVE' | 'RETURN' | 'OPEN') => {
    if (actionType === 'OPEN') {
      setActiveTab(item.targetTab);
      return;
    }

    setActionSuccess(`Action '${actionType}' applied to ${item.title}`);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-6 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
              Action Required Today &bull; My Work Priority Queue
            </span>
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-white">My Work</h2>
          <p className="text-xs text-slate-400">
            Work items requiring your immediate attention, review, moderation, or revision
          </p>
        </div>

        <button
          onClick={() => setActiveTab('assessments')}
          className="self-start sm:self-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
        >
          <span>Open Assessment Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {priorityItems.map(item => (
          <div
            key={item.id}
            className="p-4 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all flex flex-col justify-between space-y-3 group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                  {item.statusBadge}
                </span>
                <span className="text-[10px] font-mono text-amber-300 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Due: {item.dueDate}</span>
                </span>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 mt-2">{item.title}</h3>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span className="font-semibold text-slate-200">{item.subject}</span>
                <span>&bull;</span>
                <span>{item.grade}</span>
                <span>&bull;</span>
                <span className="italic">{item.phase}</span>
              </div>

              {item.comments && (
                <div className="mt-2.5 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-300 italic">
                  "{item.comments}"
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Submitted by: <strong className="text-slate-200 font-semibold">{item.submittedBy}</strong>
              </span>

              <div className="flex items-center space-x-2">
                {item.status === 'AWAITING_MODERATION' || item.status === 'AWAITING_PRINCIPAL' ? (
                  <>
                    <button
                      onClick={() => handleActionClick(item, 'RETURN')}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-rose-600/30 hover:text-rose-300 text-slate-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Return
                    </button>
                    <button
                      onClick={() => handleActionClick(item, 'APPROVE')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors shadow-xs cursor-pointer flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleActionClick(item, 'OPEN')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors shadow-xs cursor-pointer flex items-center space-x-1"
                  >
                    <span>Resume Work</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
