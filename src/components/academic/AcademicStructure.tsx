import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import {
  AcademicPhase,
  Grade,
  Subject,
  SchoolClass,
  CurriculumMap,
  User,
  TeachingAssignment,
  HodPhaseAssignment,
  HodGradeAssignment,
  AcademicAssignment,
} from '../../types';
import {
  BookOpen,
  Layers,
  GraduationCap,
  Plus,
  Grid,
  Users,
  Archive,
  RotateCcw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const AcademicStructure: React.FC = () => {
  const { activeSchool } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'phases' | 'grades' | 'subjects' | 'matrix' | 'assignments'>('phases');

  const [phases, setPhases] = useState<AcademicPhase[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [curriculumMaps, setCurriculumMaps] = useState<CurriculumMap[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [hodAssignments, setHodAssignments] = useState<HodPhaseAssignment[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);

  // Form states
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradePhaseId, setNewGradePhaseId] = useState('');

  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjPhaseId, setNewSubjPhaseId] = useState('');

  // Editing state for rename grade
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [editGradeName, setEditGradeName] = useState('');

  // Teaching assignment form state
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignPhaseId, setAssignPhaseId] = useState('');
  const [assignGradeId, setAssignGradeId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');

  // HOD assignment state
  const [selectedHodId, setSelectedHodId] = useState('');
  const [hodPhaseIds, setHodPhaseIds] = useState<string[]>([]);
  const [hodGradeIds, setHodGradeIds] = useState<string[]>([]);
  const [hodGradeAssignments, setHodGradeAssignments] = useState<HodGradeAssignment[]>([]);
  const [academicAssignments, setAcademicAssignments] = useState<AcademicAssignment[]>([]);

  const loadData = async () => {
    if (!activeSchool) return;
    setLoading(true);
    try {
      const [structData, userList, assignList, hodList, hodGradeList, acadAssignList] = await Promise.all([
        ApiService.getAcademicStructure(activeSchool.id, includeArchived),
        ApiService.getUsers(activeSchool.id),
        ApiService.getTeachingAssignments(activeSchool.id),
        ApiService.getHodPhaseAssignments(activeSchool.id),
        ApiService.getHodGradeAssignments(activeSchool.id),
        ApiService.getAcademicAssignments(activeSchool.id),
      ]);

      setPhases(structData.phases);
      setGrades(structData.grades);
      setSubjects(structData.subjects);
      setClasses(structData.classes);
      setCurriculumMaps(structData.curriculumMaps);
      setUsers(userList);
      setTeachingAssignments(assignList);
      setHodAssignments(hodList);
      setHodGradeAssignments(hodGradeList);
      setAcademicAssignments(acadAssignList);

      if (structData.phases.length > 0 && !selectedPhaseId) {
        setSelectedPhaseId(structData.phases[0].id);
        setNewGradePhaseId(structData.phases[0].id);
        setNewSubjPhaseId(structData.phases[0].id);
      }
    } catch (err) {
      console.error('Failed to load primary academic structure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSchool, includeArchived]);

  // Actions: Grade
  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchool || !newGradeName || !newGradePhaseId) return;
    try {
      await ApiService.createGrade(activeSchool.id, {
        phaseId: newGradePhaseId,
        name: newGradeName,
      });
      setNewGradeName('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameGrade = async (gradeId: string) => {
    if (!activeSchool || !editGradeName) return;
    try {
      await ApiService.updateGrade(activeSchool.id, gradeId, { name: editGradeName });
      setEditingGradeId(null);
      setEditGradeName('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveGrade = async (gradeId: string) => {
    if (!activeSchool) return;
    try {
      await ApiService.archiveGrade(activeSchool.id, gradeId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreGrade = async (gradeId: string) => {
    if (!activeSchool) return;
    try {
      await ApiService.restoreGrade(activeSchool.id, gradeId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchool || !newSubjName || !newSubjPhaseId) return;
    try {
      await ApiService.createSubject(activeSchool.id, {
        phaseId: newSubjPhaseId,
        name: newSubjName,
        code: newSubjCode || `SUB-${newSubjName.substring(0, 3).toUpperCase()}`,
        isCustom: true,
      });
      setNewSubjName('');
      setNewSubjCode('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveSubject = async (subjectId: string) => {
    if (!activeSchool) return;
    try {
      await ApiService.archiveSubject(activeSchool.id, subjectId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreSubject = async (subjectId: string) => {
    if (!activeSchool) return;
    try {
      await ApiService.restoreSubject(activeSchool.id, subjectId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!activeSchool) return;
    try {
      await ApiService.deleteSubject(activeSchool.id, subjectId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: Matrix Curriculum Toggle
  const handleToggleCurriculumMap = async (phaseId: string, subjectId: string, gradeId: string) => {
    if (!activeSchool) return;
    try {
      const res = await ApiService.toggleCurriculumMap(activeSchool.id, phaseId, subjectId, gradeId);
      setCurriculumMaps(res.curriculumMaps);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: Teaching Assignment
  const handleCreateTeachingAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchool || !assignTeacherId || !assignPhaseId || !assignGradeId || !assignClassId || !assignSubjectId) return;
    try {
      await ApiService.createTeachingAssignment(activeSchool.id, {
        teacherUserId: assignTeacherId,
        phaseId: assignPhaseId,
        gradeId: assignGradeId,
        classId: assignClassId,
        subjectId: assignSubjectId,
      });
      setAssignTeacherId('');
      setAssignClassId('');
      setAssignSubjectId('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeachingAssignment = async (assignmentId: string) => {
    if (!activeSchool) return;
    try {
      await ApiService.deleteTeachingAssignment(activeSchool.id, assignmentId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: HOD Phase & Grade Assignments
  const handleSaveHodAssignments = async () => {
    if (!activeSchool || !selectedHodId) return;
    try {
      await ApiService.setHodPhaseAssignments(activeSchool.id, selectedHodId, hodPhaseIds);
      await ApiService.setHodGradeAssignments(activeSchool.id, selectedHodId, hodGradeIds);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeSchool) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              South African Primary School Structure
            </span>
            <span className="text-xs text-slate-400">&bull; CAPS Aligned</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Academic Structure & Curriculum Mapping</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase-based foundation &bull; Grades R–7 &bull; Multi-grade subject curriculum mapping &bull; Strict historical audit safety
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={e => setIncludeArchived(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show Archived Entities</span>
          </label>
        </div>
      </div>

      {/* Primary Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold text-slate-500 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('phases')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'phases' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. Academic Phases ({phases.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('grades')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'grades' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>2. Grades & Classes ({grades.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('subjects')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'subjects' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. Subjects & CAPS ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'matrix' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>4. Curriculum Mapping Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('assignments')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>5. HOD & Teaching Assignments</span>
        </button>
      </div>

      {/* SUB-TAB 1: PHASES */}
      {activeSubTab === 'phases' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {phases.map(p => {
            const phaseGrades = grades.filter(g => g.phaseId === p.id);
            const phaseSubjects = subjects.filter(s => s.phaseId === p.id);
            const phaseHods = hodAssignments
              .filter(h => h.phaseId === p.id)
              .map(h => users.find(u => u.id === h.hodUserId)?.fullName)
              .filter(Boolean);

            return (
              <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">Phase Code: {p.code}</span>
                    <h3 className="text-lg font-black text-slate-900">{p.name}</h3>
                  </div>
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium">{p.description}</p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Included Grades</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {phaseGrades.map(g => (
                        <span key={g.id} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 font-bold text-[11px] rounded-md">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Core CAPS Subjects ({phaseSubjects.length})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {phaseSubjects.map(s => (
                        <span key={s.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium text-[10px] rounded">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Assigned Phase HOD(s)</span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {phaseHods.length > 0 ? phaseHods.join(', ') : 'No HOD assigned yet'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 2: GRADES & CLASSES */}
      {activeSubTab === 'grades' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Configured Primary School Grades</h3>
              <span className="text-xs text-slate-500 font-medium">{grades.length} Grades Total</span>
            </div>

            <div className="space-y-3">
              {grades.map(g => {
                const phase = phases.find(p => p.id === g.phaseId);
                const gradeClasses = classes.filter(c => c.gradeId === g.id);
                const isEditing = editingGradeId === g.id;

                return (
                  <div
                    key={g.id}
                    className={`p-4 rounded-xl border transition-all ${
                      g.isArchived ? 'bg-slate-100/80 border-slate-300 opacity-75' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editGradeName}
                              onChange={e => setEditGradeName(e.target.value)}
                              className="px-2 py-1 border rounded text-xs font-bold text-slate-900"
                            />
                            <button
                              onClick={() => handleRenameGrade(g.id)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingGradeId(null)}
                              className="p-1 bg-slate-300 text-slate-700 rounded hover:bg-slate-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-black text-base text-slate-900">{g.name}</span>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                              {g.code}
                            </span>
                            {g.isArchived && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                                Archived
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                          {phase?.name || 'Phase'}
                        </span>

                        {!isEditing && !g.isArchived && (
                          <button
                            onClick={() => {
                              setEditingGradeId(g.id);
                              setEditGradeName(g.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="Rename Grade"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {g.isArchived ? (
                          <button
                            onClick={() => handleRestoreGrade(g.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center space-x-1 text-xs font-bold"
                            title="Restore Grade"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveGrade(g.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Archive Grade (Preserves Historical Data)"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Class Sections */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Class Sections:</span>
                        {gradeClasses.length > 0 ? (
                          gradeClasses.map(c => (
                            <span key={c.id} className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold text-xs rounded border border-slate-200">
                              {c.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No class sections</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Custom Grade Form */}
          <form onSubmit={handleCreateGrade} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs h-fit">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Add Custom Grade Level</span>
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Academic Phase *</label>
              <select
                required
                value={newGradePhaseId}
                onChange={e => setNewGradePhaseId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-slate-900 text-xs bg-white outline-none"
              >
                {phases.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gradeRange})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Grade Name *</label>
              <input
                type="text"
                required
                value={newGradeName}
                onChange={e => setNewGradeName(e.target.value)}
                placeholder="e.g. Grade 1 (Remedial) or Grade RR"
                className="w-full px-3 py-2 border rounded-lg text-slate-900 text-xs outline-none"
              />
            </div>

            <p className="text-[11px] text-slate-500 italic">
              New grades automatically create Section A and map to all core subjects in the selected phase.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Create Grade</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: SUBJECTS & CAPS */}
      {activeSubTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {/* Phase Filter Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setSelectedPhaseId('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedPhaseId === '' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Phases
              </button>
              {phases.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhaseId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedPhaseId === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjects
                .filter(s => !selectedPhaseId || s.phaseId === selectedPhaseId)
                .map(s => {
                  const phase = phases.find(p => p.id === s.phaseId);

                  return (
                    <div
                      key={s.id}
                      className={`p-4 rounded-xl border space-y-2 transition-all ${
                        s.isArchived ? 'bg-slate-100 border-slate-300 opacity-75' : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{s.name}</span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {s.code}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {phase?.name || 'Phase'}
                        </span>

                        <div className="flex items-center space-x-1">
                          {s.isArchived ? (
                            <button
                              onClick={() => handleRestoreSubject(s.id)}
                              className="text-xs font-bold text-emerald-600 hover:underline flex items-center space-x-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleArchiveSubject(s.id)}
                                className="p-1 text-slate-400 hover:text-amber-600 rounded"
                                title="Archive Subject"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(s.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete Subject (Archived if historical data exists)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Add Custom Subject Form */}
          <form onSubmit={handleCreateSubject} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs h-fit">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Add Custom Subject</span>
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Academic Phase *</label>
              <select
                required
                value={newSubjPhaseId}
                onChange={e => setNewSubjPhaseId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-slate-900 text-xs bg-white outline-none"
              >
                {phases.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject Name *</label>
              <input
                type="text"
                required
                value={newSubjName}
                onChange={e => setNewSubjName(e.target.value)}
                placeholder="e.g. Coding & Robotics"
                className="w-full px-3 py-2 border rounded-lg text-slate-900 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject Code</label>
              <input
                type="text"
                value={newSubjCode}
                onChange={e => setNewSubjCode(e.target.value)}
                placeholder="e.g. ROB-01"
                className="w-full px-3 py-2 border rounded-lg text-slate-900 text-xs font-mono uppercase outline-none"
              />
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Custom subjects are automatically mapped to all grades in the chosen phase. You can refine grade availability in the Curriculum Mapping Matrix.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Create Subject</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 4: CURRICULUM MAPPING MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Curriculum Mapping Architecture:</strong> Subjects belong to a Phase and are mapped across Grades.
              Click any checkbox to enable or disable a subject for a specific Grade. Changes persist immediately.
            </div>
          </div>

          {phases.map(phase => {
            const phaseGrades = grades.filter(g => g.phaseId === phase.id && !g.isArchived);
            const phaseSubjects = subjects.filter(s => s.phaseId === phase.id && !s.isArchived);

            return (
              <div key={phase.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black">{phase.name} Matrix</h3>
                    <p className="text-xs text-slate-400 font-medium">{phase.description}</p>
                  </div>
                  <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-indigo-300">
                    {phaseGrades.length} Grades &bull; {phaseSubjects.length} Subjects
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <th className="p-4 font-bold border-r border-slate-200 min-w-[200px]">Subject Name</th>
                        <th className="p-4 font-bold border-r border-slate-200 w-28">Subject Code</th>
                        {phaseGrades.map(g => (
                          <th key={g.id} className="p-4 font-bold text-center border-r border-slate-200 min-w-[100px]">
                            {g.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {phaseSubjects.map(subj => (
                        <tr key={subj.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-900 border-r border-slate-200">{subj.name}</td>
                          <td className="p-4 font-mono text-slate-600 text-[11px] border-r border-slate-200">{subj.code}</td>
                          {phaseGrades.map(grd => {
                            const isMapped = curriculumMaps.some(cm => cm.subjectId === subj.id && cm.gradeId === grd.id);

                            return (
                              <td key={grd.id} className="p-4 text-center border-r border-slate-200">
                                <button
                                  onClick={() => handleToggleCurriculumMap(phase.id, subj.id, grd.id)}
                                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all mx-auto ${
                                    isMapped
                                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                                      : 'bg-slate-100 border-slate-300 text-slate-400 hover:bg-slate-200'
                                  }`}
                                  title={isMapped ? `Disable ${subj.name} for ${grd.name}` : `Enable ${subj.name} for ${grd.name}`}
                                >
                                  {isMapped ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 5: HOD & TEACHING ASSIGNMENTS */}
      {activeSubTab === 'assignments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* HOD Grade & Phase Allocations */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>HOD Grade & Phase Allocations</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select HOD User</label>
              <select
                value={selectedHodId}
                onChange={e => {
                  const hodId = e.target.value;
                  setSelectedHodId(hodId);
                  const existingPhases = hodAssignments.filter(h => h.hodUserId === hodId).map(h => h.phaseId);
                  const existingGrades = hodGradeAssignments.filter(h => h.hodUserId === hodId).map(h => h.gradeId);
                  setHodPhaseIds(existingPhases);
                  setHodGradeIds(existingGrades);
                }}
                className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900 font-medium"
              >
                <option value="">Select an HOD or School Admin...</option>
                {users
                  .filter(u => u.role === 'HOD' || u.role === 'SCHOOL_ADMIN' || u.role === 'PRINCIPAL')
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
              </select>
            </div>

            {selectedHodId && (
              <div className="space-y-4 pt-2">
                {/* Grade-based Allocation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Assign Managed Grades (Grade-Based Routing):</label>
                  <div className="grid grid-cols-2 gap-2">
                    {grades.map(g => {
                      const isChecked = hodGradeIds.includes(g.id);
                      return (
                        <label key={g.id} className="flex items-center space-x-2 p-2.5 rounded-xl border bg-slate-50 border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setHodGradeIds([...hodGradeIds, g.id]);
                              } else {
                                setHodGradeIds(hodGradeIds.filter(id => id !== g.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-bold text-slate-900 text-xs">{g.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Phase-based Allocation */}
                <div className="border-t border-slate-100 pt-3">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Assign Managed Phases:</label>
                  <div className="space-y-2">
                    {phases.map(p => {
                      const isChecked = hodPhaseIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center space-x-3 p-2.5 rounded-xl border bg-slate-50 border-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setHodPhaseIds([...hodPhaseIds, p.id]);
                              } else {
                                setHodPhaseIds(hodPhaseIds.filter(id => id !== p.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                            <p className="text-[11px] text-slate-500">{p.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSaveHodAssignments}
                  className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  Save HOD Allocations
                </button>
              </div>
            )}
          </div>

          {/* Teacher Subject-Class Assignments */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Teaching Assignments</span>
            </h3>

            <form onSubmit={handleCreateTeachingAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Teacher *</label>
                <select
                  required
                  value={assignTeacherId}
                  onChange={e => setAssignTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-slate-900 text-xs bg-white"
                >
                  <option value="">Select Teacher...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phase *</label>
                  <select
                    required
                    value={assignPhaseId}
                    onChange={e => {
                      setAssignPhaseId(e.target.value);
                      setAssignGradeId('');
                      setAssignClassId('');
                      setAssignSubjectId('');
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900 text-xs bg-white"
                  >
                    <option value="">Select Phase...</option>
                    {phases.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade *</label>
                  <select
                    required
                    value={assignGradeId}
                    onChange={e => {
                      setAssignGradeId(e.target.value);
                      const gradeClasses = classes.filter(c => c.gradeId === e.target.value);
                      if (gradeClasses.length > 0) setAssignClassId(gradeClasses[0].id);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900 text-xs bg-white"
                  >
                    <option value="">Select Grade...</option>
                    {grades
                      .filter(g => !assignPhaseId || g.phaseId === assignPhaseId)
                      .map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Section *</label>
                  <select
                    required
                    value={assignClassId}
                    onChange={e => setAssignClassId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900 text-xs bg-white"
                  >
                    <option value="">Select Class Section...</option>
                    {classes
                      .filter(c => !assignGradeId || c.gradeId === assignGradeId)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                  <select
                    required
                    value={assignSubjectId}
                    onChange={e => setAssignSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-slate-900 text-xs bg-white"
                  >
                    <option value="">Select Subject...</option>
                    {subjects
                      .filter(s => !assignPhaseId || s.phaseId === assignPhaseId)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Teaching Workload</span>
              </button>
            </form>

            <div className="border-t border-slate-100 pt-3 space-y-2 max-h-56 overflow-y-auto">
              <span className="text-xs font-bold text-slate-700 block">Current Teaching Assignments ({teachingAssignments.length})</span>
              {teachingAssignments.map(ta => (
                <div key={ta.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{ta.teacherName}</span>
                    <div className="text-[11px] text-slate-500">
                      {ta.gradeName} ({ta.className}) &bull; <strong className="text-indigo-600">{ta.subjectName}</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTeachingAssignment(ta.id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="Remove Assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
