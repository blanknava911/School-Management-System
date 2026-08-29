import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { AssessmentWorkspace } from '../../types';
import {
  canCreateAssessmentWorkspace,
  canReviewAssessment,
  canRequestRevisions,
  canApproveAssessment,
  getUserRoles,
} from '../../utils/rbac';
import {
  FileText,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Upload,
  Send,
  AlertCircle,
  Eye,
  Check,
  RotateCcw,
  BookOpen,
  User,
  X,
  FileCheck,
  Trash2,
  Archive,
} from 'lucide-react';

export const AssessmentWorkspaceView: React.FC = () => {
  const { activeSchool, currentUser } = useAuth();
  const [workspaces, setWorkspaces] = useState<AssessmentWorkspace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [termFilter, setTermFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Academic Structure State for creation modal
  const [phases, setPhases] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<AssessmentWorkspace | null>(null);
  const [deleteConfirmWorkspace, setDeleteConfirmWorkspace] = useState<AssessmentWorkspace | null>(null);

  // New Workspace Form
  const [title, setTitle] = useState<string>('');
  const [term, setTerm] = useState<string>('Term 1');
  const [assessmentType, setAssessmentType] = useState<string>('Formal Test');
  const [phaseId, setPhaseId] = useState<string>('');
  const [gradeId, setGradeId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [memoFile, setMemoFile] = useState<File | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Review Comment & Upload States
  const [reviewComment, setReviewComment] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const canCreate = canCreateAssessmentWorkspace(currentUser);
  const canReview = canReviewAssessment(currentUser);
  const canRequestRev = canRequestRevisions(currentUser);
  const canApprove = canApproveAssessment(currentUser);

  const userRoles = getUserRoles(currentUser);
  const isPrincipalOrAdmin = userRoles.some(
    r => r === 'SUPER_ADMIN' || r === 'SCHOOL_ADMIN' || r === 'PRINCIPAL'
  );

  const loadData = async () => {
    if (!activeSchool) return;
    setLoading(true);
    try {
      const [wsData, structData, teachingAssignData, academicAssignData] = await Promise.all([
        ApiService.getAssessmentWorkspaces(activeSchool.id, {}),
        ApiService.getAcademicStructure(activeSchool.id),
        ApiService.getTeachingAssignments(activeSchool.id, currentUser && !isPrincipalOrAdmin ? currentUser.id : undefined),
        ApiService.getAcademicAssignments(activeSchool.id, currentUser ? { userId: currentUser.id } : undefined),
      ]);
      setWorkspaces(wsData);
      setPhases(structData.phases);
      setGrades(structData.grades);
      setSubjects(structData.subjects);
      setTeacherAssignments(teachingAssignData.length > 0 ? teachingAssignData : academicAssignData);

      if (structData.phases.length > 0) setPhaseId(structData.phases[0].id);
      if (structData.grades.length > 0) setGradeId(structData.grades[0].id);
      if (structData.subjects.length > 0) setSubjectId(structData.subjects[0].id);
    } catch (err) {
      console.error('Failed to load assessment workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSchool, currentUser, isPrincipalOrAdmin]);

  // Compute available grades for current user
  const availableGrades = React.useMemo(() => {
    if (!currentUser || isPrincipalOrAdmin) {
      return grades;
    }
    const assignedGradeIds = teacherAssignments.map(ta => ta.gradeId);
    const filtered = grades.filter(g => assignedGradeIds.includes(g.id));
    return filtered.length > 0 ? filtered : grades;
  }, [grades, teacherAssignments, currentUser, isPrincipalOrAdmin]);

  // Compute available subjects for current user and selected grade
  const availableSubjects = React.useMemo(() => {
    if (!currentUser || isPrincipalOrAdmin) {
      return subjects;
    }
    const assignedSubjects = teacherAssignments
      .filter(ta => !gradeId || ta.gradeId === gradeId)
      .map(ta => ta.subjectId);
    const filtered = subjects.filter(s => assignedSubjects.includes(s.id) || assignedSubjects.includes('ALL'));
    return filtered.length > 0 ? filtered : subjects;
  }, [subjects, teacherAssignments, gradeId, currentUser, isPrincipalOrAdmin]);

  useEffect(() => {
    if (availableGrades.length === 0) return;
    if (!gradeId || !availableGrades.some(g => g.id === gradeId)) {
      const nextGrade = availableGrades[0];
      setGradeId(nextGrade.id);
      setPhaseId(nextGrade.phaseId);
    }
  }, [availableGrades, gradeId]);

  useEffect(() => {
    if (availableSubjects.length === 0) return;
    if (!subjectId || !availableSubjects.some(s => s.id === subjectId)) {
      setSubjectId(availableSubjects[0].id);
    }
  }, [availableSubjects, subjectId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'paper' | 'memo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (target === 'paper') {
      setQuestionPaperFile(file);
    } else {
      setMemoFile(file);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent, initialStatus: 'Draft' | 'Submitted' = 'Draft') => {
    e.preventDefault();
    if (!activeSchool || !currentUser) return;
    setModalError(null);

    if (!title.trim()) {
      setModalError('Assessment Title is required.');
      return;
    }

    if (!gradeId || !subjectId) {
      setModalError('Choose a grade and subject before creating the assessment.');
      return;
    }

    const selectedGrade = grades.find(g => g.id === gradeId);
    const resolvedPhaseId = phaseId || selectedGrade?.phaseId || (phases[0]?.id || 'ph-foundation');

    try {
      const created = await ApiService.createAssessmentWorkspace(activeSchool.id, {
        phaseId: resolvedPhaseId,
        gradeId,
        subjectId,
        term,
        title,
        teacherUserId: currentUser.id,
      });

      if (questionPaperFile) await ApiService.uploadAssessmentFile(activeSchool.id, created.id, 'paper', questionPaperFile);
      if (memoFile) await ApiService.uploadAssessmentFile(activeSchool.id, created.id, 'memo', memoFile);
      if (assessmentType) {
        await ApiService.updateAssessmentWorkspace(activeSchool.id, created.id, {
          assessmentType,
        });
      }
      if (initialStatus === 'Submitted') await ApiService.updateAssessmentWorkspaceStatus(activeSchool.id, created.id, 'Submitted');

      setIsCreateOpen(false);
      setTitle('');
      setQuestionPaperFile(null);
      setMemoFile(null);
      setActionSuccess(
        initialStatus === 'Submitted'
          ? 'Assessment created and submitted to DH for moderation!'
          : 'Assessment workspace draft saved successfully!'
      );
      setTimeout(() => setActionSuccess(null), 3500);
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create workspace');
    }
  };

  const handleUpdateStatus = async (workspaceId: string, newStatus: AssessmentWorkspace['status']) => {
    if (!activeSchool || !currentUser) return;
    try {
      await ApiService.updateAssessmentWorkspaceStatus(
        activeSchool.id,
        workspaceId,
        newStatus,
        currentUser.id,
        currentUser
      );
      if (newStatus === 'Submitted') {
        const ws = workspaces.find(w => w.id === workspaceId);
        setActionSuccess(`Assessment submitted! Automatically routed to DH assigned to ${ws?.gradeName || 'this Grade'} for moderation.`);
      } else if (newStatus === 'Approved') {
        setActionSuccess(`Assessment approved successfully! Status set to Approved (Waiting for Principal/Admin archiving).`);
      } else if (newStatus === 'Archived') {
        setActionSuccess(`Assessment archived successfully.`);
      } else {
        setActionSuccess(`Assessment status updated to "${newStatus}"`);
      }
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
      if (selectedWorkspace && selectedWorkspace.id === workspaceId) {
        setSelectedWorkspace({ ...selectedWorkspace, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update workspace status');
    }
  };

  const canDeleteWorkspace = (w: AssessmentWorkspace): boolean => {
    if (!currentUser) return false;
    if (isPrincipalOrAdmin) return true; // Principal and School Administrator: May delete any assessment
    if (userRoles.includes('TEACHER') && w.teacherUserId === currentUser.id && w.status === 'Draft') {
      return true; // Teachers: May delete Draft / unsubmitted assessments only
    }
    return false;
  };

  const handleDeleteWorkspace = async () => {
    if (!deleteConfirmWorkspace || !activeSchool || !currentUser) return;
    try {
      await ApiService.deleteAssessmentWorkspace(activeSchool.id, deleteConfirmWorkspace.id, currentUser);
      setActionSuccess(`Assessment "${deleteConfirmWorkspace.title}" deleted successfully.`);
      setDeleteConfirmWorkspace(null);
      if (selectedWorkspace?.id === deleteConfirmWorkspace.id) {
        setSelectedWorkspace(null);
      }
      setTimeout(() => setActionSuccess(null), 3500);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete assessment workspace');
    }
  };

  const filteredWorkspaces = workspaces.filter(w => {
    const matchesTerm = termFilter === 'ALL' || w.term === termFilter;
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesTerm && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between">
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
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Assessment Workspaces</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, upload, review, moderate, and approve question papers and memorandums.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Assessment Workspace</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Workspaces:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={termFilter}
            onChange={e => setTermFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-xs text-slate-800 outline-none font-medium"
          >
            <option value="ALL">All Terms</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
            <option value="Term 4">Term 4</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-xs text-slate-800 outline-none font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted (Awaiting Moderation)</option>
            <option value="Approved">Approved</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border">
            Loading assessment workspaces...
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border">
            No assessment workspaces found for the selected criteria.
          </div>
        ) : (
          filteredWorkspaces.map(w => {
            const isDraft = w.status === 'Draft';
            const isSubmitted = w.status === 'Submitted' || w.status === 'Grade Head Review' || w.status === 'DP Review';
            const isApproved = w.status === 'Approved';
            const isArchived = w.status === 'Archived';
            const deletable = canDeleteWorkspace(w);

            return (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      {w.term}
                    </span>
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border ${
                        isArchived
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isSubmitted
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{w.title}</h3>

                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{w.teacherName || 'Assigned Educator'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span>{w.subjectName || 'Subject'} &bull; {w.gradeName || 'Grade'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedWorkspace(w)}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Open</span>
                    </button>

                    {deletable && (
                      <button
                        onClick={() => setDeleteConfirmWorkspace(w)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Assessment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isDraft && currentUser?.id === w.teacherUserId && (
                    <button
                      onClick={() => handleUpdateStatus(w.id, 'Submitted')}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
                    >
                      Submit
                    </button>
                  )}

                  {isSubmitted && canApprove && (
                    <button
                      onClick={() => handleUpdateStatus(w.id, 'Approved')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
                    >
                      Approve
                    </button>
                  )}

                  {isApproved && isPrincipalOrAdmin && (
                    <button
                      onClick={() => handleUpdateStatus(w.id, 'Archived')}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Workspace Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-600 text-white rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Assessment Workspace</h3>
                <p className="text-xs text-slate-500">Provide assessment details, question paper & memorandum</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Grade 4 Mathematics Term 1 Formal Test"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade *</label>
                  <select
                    value={gradeId}
                    onChange={e => {
                      const newGrdId = e.target.value;
                      setGradeId(newGrdId);
                      const gObj = grades.find(g => g.id === newGrdId);
                      if (gObj) setPhaseId(gObj.phaseId);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 bg-white text-sm font-medium"
                  >
                    {availableGrades.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                  <select
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 bg-white text-sm font-medium"
                  >
                    {availableSubjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Term *</label>
                  <select
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 bg-white text-sm font-medium"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Term 4">Term 4</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assessment Type *</label>
                  <select
                    value={assessmentType}
                    onChange={e => setAssessmentType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 bg-white text-sm font-medium"
                  >
                    <option value="Formal Test">Formal Test</option>
                    <option value="Exam">Exam</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Project">Project</option>
                    <option value="Practical Task">Practical Task</option>
                    <option value="Investigation">Investigation</option>
                  </select>
                </div>
              </div>

              {/* File Upload Fields */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Question Paper (document, PDF, or image)</label>
                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold flex items-center space-x-1.5 text-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept=".docx,.pdf,.doc,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'paper')}
                      />
                    </label>
                    <span className="text-xs text-slate-600 truncate">
                      {questionPaperFile ? questionPaperFile.name : 'No file chosen'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Memorandum (document, PDF, or image)</label>
                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold flex items-center space-x-1.5 text-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept=".docx,.pdf,.doc,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                        className="hidden"
                        onChange={e => handleFileUpload(e, 'memo')}
                      />
                    </label>
                    <span className="text-xs text-slate-600 truncate">
                      {memoFile ? memoFile.name : 'No file chosen'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={e => handleCreateWorkspace(e, 'Draft')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={e => handleCreateWorkspace(e, 'Submitted')}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Submit Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmWorkspace && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Confirm Assessment Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the assessment workspace{' '}
              <strong className="text-slate-900 font-bold">"{deleteConfirmWorkspace.title}"</strong>?
              This action cannot be undone and will be logged in the audit trail.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmWorkspace(null)}
                className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail & Review Modal */}
      {selectedWorkspace && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setSelectedWorkspace(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                  {selectedWorkspace.term}
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase">
                  {selectedWorkspace.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{selectedWorkspace.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Workspace ID: {selectedWorkspace.id} &bull; Created by {selectedWorkspace.teacherName || 'Teacher'}
              </p>
            </div>

            {/* Uploaded Documents Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Question Paper</span>
                  {selectedWorkspace.paperFile ? (
                    <span className="text-emerald-600 text-[10px] font-bold flex items-center space-x-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Uploaded</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Pending</span>
                  )}
                </div>
                {selectedWorkspace.paperFile?.fileUrl ? <button onClick={() => ApiService.downloadFile(selectedWorkspace.paperFile!.fileUrl!, selectedWorkspace.paperFile!.fileName)} className="text-left text-xs font-bold text-indigo-700 hover:underline">Download {selectedWorkspace.paperFile.fileName}</button> : <div className="text-xs font-medium text-slate-700">No question paper attached</div>}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Memorandum</span>
                  {selectedWorkspace.memoFile ? (
                    <span className="text-emerald-600 text-[10px] font-bold flex items-center space-x-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Uploaded</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Pending</span>
                  )}
                </div>
                {selectedWorkspace.memoFile?.fileUrl ? <button onClick={() => ApiService.downloadFile(selectedWorkspace.memoFile!.fileUrl!, selectedWorkspace.memoFile!.fileName)} className="text-left text-xs font-bold text-indigo-700 hover:underline">Download {selectedWorkspace.memoFile.fileName}</button> : <div className="text-xs font-medium text-slate-700">No memorandum attached</div>}
              </div>
            </div>

            {/* Workflow Review Actions (DH / Grade Head / Principal) */}
            {canReview && (
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                <h4 className="font-bold text-xs text-indigo-900 flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Academic Moderation & Feedback Notes</span>
                </h4>

                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Enter moderation feedback or required revision details for the educator..."
                  className="w-full p-2.5 text-xs bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {canRequestRev && selectedWorkspace.status !== 'Approved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedWorkspace.id, 'Draft')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Request Revision</span>
                    </button>
                  )}

                  {canApprove && selectedWorkspace.status !== 'Approved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedWorkspace.id, 'Approved')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Assessment</span>
                    </button>
                  )}

                  {isPrincipalOrAdmin && selectedWorkspace.status === 'Approved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedWorkspace.id, 'Archived')}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive Assessment</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
