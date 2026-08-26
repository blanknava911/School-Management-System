import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { AssessmentWorkspace } from '../../types';
import {
  FileCode,
  Search,
  Filter,
  Eye,
  Download,
  Printer,
  Copy,
  BookOpen,
  Calendar,
  User,
  CheckCircle2,
  Lock,
  X,
  Plus,
  ArrowRight,
  FileText,
} from 'lucide-react';

export const AssessmentArchiveView: React.FC<{ onNavigateToWorkspace?: () => void }> = ({
  onNavigateToWorkspace,
}) => {
  const { activeSchool, currentUser } = useAuth();
  const [archivedAssessments, setArchivedAssessments] = useState<AssessmentWorkspace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter state
  const [keyword, setKeyword] = useState<string>('');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('ALL');
  const [termFilter, setTermFilter] = useState<string>('ALL');
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [teacherFilter, setTeacherFilter] = useState<string>('ALL');

  // Preview / Action Modal
  const [selectedItem, setSelectedItem] = useState<AssessmentWorkspace | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadArchive = async () => {
    if (!activeSchool) return;
    setLoading(true);
    try {
      const data = await ApiService.getAssessmentWorkspaces(activeSchool.id);
      // Filter for Archived or Approved completed assessments
      const completedOrArchived = data.filter(
        a => a.status === 'Archived' || a.status === 'Approved'
      );
      setArchivedAssessments(completedOrArchived);
    } catch (err) {
      console.error('Failed to load assessment archive:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchive();
  }, [activeSchool]);

  const handleDuplicate = async (workspace: AssessmentWorkspace) => {
    if (!activeSchool || !currentUser) return;
    try {
      await ApiService.createAssessmentWorkspace(activeSchool.id, {
        phaseId: workspace.phaseId,
        gradeId: workspace.gradeId,
        subjectId: workspace.subjectId,
        term: workspace.term,
        title: `[Copy] ${workspace.title}`,
        teacherUserId: currentUser.id,
        assessmentType: workspace.assessmentType || 'Formal Test',
        totalMarks: workspace.totalMarks || 50,
        duration: workspace.duration || '60 mins',
        language: workspace.language || 'English',
        academicYear: activeSchool.academicYear || '2026',
        status: 'Draft',
      } as any);
      setActionSuccess(`Duplicated "${workspace.title}" into a new active Draft Workspace.`);
      setSelectedItem(null);
      setTimeout(() => {
        setActionSuccess(null);
        if (onNavigateToWorkspace) onNavigateToWorkspace();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate assessment');
    }
  };

  const filteredItems = archivedAssessments.filter(item => {
    const matchesKeyword =
      !keyword ||
      item.title.toLowerCase().includes(keyword.toLowerCase()) ||
      (item.teacherName && item.teacherName.toLowerCase().includes(keyword.toLowerCase())) ||
      (item.subjectName && item.subjectName.toLowerCase().includes(keyword.toLowerCase()));

    const matchesYear = academicYearFilter === 'ALL' || item.academicYear === academicYearFilter;
    const matchesTerm = termFilter === 'ALL' || item.term === termFilter;
    const matchesPhase = phaseFilter === 'ALL' || item.phaseId === phaseFilter;
    const matchesGrade = gradeFilter === 'ALL' || item.gradeId === gradeFilter;
    const matchesSubject = subjectFilter === 'ALL' || item.subjectId === subjectFilter;
    const matchesType = typeFilter === 'ALL' || item.assessmentType === typeFilter;
    const matchesTeacher = teacherFilter === 'ALL' || item.teacherUserId === teacherFilter;

    return (
      matchesKeyword &&
      matchesYear &&
      matchesTerm &&
      matchesPhase &&
      matchesGrade &&
      matchesSubject &&
      matchesType &&
      matchesTeacher
    );
  });

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Assessment Archive</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Read-only central repository of approved and historical assessments for <strong className="text-slate-800">{activeSchool?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Read Only Enforced</span>
          </span>
        </div>
      </div>

      {/* Search & Advanced Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Search & Filter Archive</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Keyword search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Search by assessment title, subject, or educator..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Academic Year */}
          <div>
            <select
              value={academicYearFilter}
              onChange={e => setAcademicYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 outline-none font-medium"
            >
              <option value="ALL">All Academic Years</option>
              <option value="2026">2026 Academic Year</option>
              <option value="2025">2025 Academic Year</option>
              <option value="2024">2024 Academic Year</option>
            </select>
          </div>

          {/* Term */}
          <div>
            <select
              value={termFilter}
              onChange={e => setTermFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 outline-none font-medium"
            >
              <option value="ALL">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
              <option value="Term 4">Term 4</option>
            </select>
          </div>

          {/* Assessment Type */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 outline-none font-medium"
            >
              <option value="ALL">All Assessment Types</option>
              <option value="Formal Test">Formal Test</option>
              <option value="Exam">Exam</option>
              <option value="Assignment">Assignment</option>
              <option value="Project">Project</option>
              <option value="Practical Task">Practical Task</option>
              <option value="Investigation">Investigation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Archive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border">
            Loading archived assessments...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border">
            No archived assessments match your search criteria.
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {item.term} &bull; {item.academicYear || '2026'}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Archived</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{item.title}</h3>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.subjectName || 'Subject'} &bull; {item.gradeName || 'Grade'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Educator: {item.teacherName || 'Assigned Staff'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview & Actions</span>
                </button>

                <button
                  onClick={() => handleDuplicate(item)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Duplicate</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview & Action Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                  {selectedItem.term} ({selectedItem.academicYear || '2026'})
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded uppercase flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Archived (Read Only)</span>
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{selectedItem.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Subject: {selectedItem.subjectName} &bull; Grade: {selectedItem.gradeName} &bull; Created by {selectedItem.teacherName}
              </p>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                <span className="font-bold text-slate-900">{selectedItem.totalMarks || 50} Marks</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                <span className="font-bold text-slate-900">{selectedItem.duration || '60 Mins'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Language</span>
                <span className="font-bold text-slate-900">{selectedItem.language || 'English'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Type</span>
                <span className="font-bold text-slate-900">{selectedItem.assessmentType || 'Formal Test'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Submission Date</span>
                <span className="font-bold text-slate-900">{selectedItem.submissionDate ? new Date(selectedItem.submissionDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Approval Date</span>
                <span className="font-bold text-slate-900">{selectedItem.approvalDate ? new Date(selectedItem.approvalDate).toLocaleDateString() : 'Approved'}</span>
              </div>
            </div>

            {/* Read-only Document Preview Box */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[10px] border-b border-slate-800 pb-2 uppercase tracking-wider font-sans">
                <span>Assessment Document Preview</span>
                <span className="text-emerald-400 font-bold">CAPS Standard Compliant</span>
              </div>
              <div className="space-y-1 font-sans">
                <p className="font-bold text-sm text-white">{selectedItem.title}</p>
                <p className="text-xs text-slate-400">Question Paper & Memorandum archived and indexed for retrieval.</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>

              <button
                onClick={() => {
                  alert(`Downloading complete document package for "${selectedItem.title}"`);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download (Paper + Memo)</span>
              </button>

              <button
                onClick={() => handleDuplicate(selectedItem)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicate into New Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
