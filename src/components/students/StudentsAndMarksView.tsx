import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, FileSpreadsheet, GraduationCap, Pencil, Plus, Search, Trash2, Upload, UserRound, Users, X } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { MarkImportReviewRow, StudentMark, StudentRecord, TeachingAssignment, User } from '../../types';
import { getUserRoles } from '../../utils/rbac';

type StudentForm = Pick<StudentRecord, 'admissionNumber' | 'fullName'> & {
  guardianName: string;
  guardianContact: string;
};

const emptyForm: StudentForm = { admissionNumber: '', fullName: '', guardianName: '', guardianContact: '' };

export const StudentsAndMarksView: React.FC = () => {
  const { activeSchool, currentUser } = useAuth();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [importId, setImportId] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [extractionMethod, setExtractionMethod] = useState('manual-review');
  const [reviewRows, setReviewRows] = useState<MarkImportReviewRow[]>([]);
  const [unmatchedRows, setUnmatchedRows] = useState<any[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [totalMarks, setTotalMarks] = useState(100);
  const [success, setSuccess] = useState('');

  const isTeacher = currentUser?.role === 'TEACHER';
  const visibleAssignments = useMemo(
    () => assignments.filter(item => item.teacherUserId === selectedTeacherId),
    [assignments, selectedTeacherId]
  );
  const selectedAssignment = visibleAssignments.find(item => item.id === selectedAssignmentId);
  const filteredStudents = students.filter(student =>
    `${student.fullName} ${student.admissionNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!activeSchool || !currentUser) return;
    setLoading(true);
    const load = async () => {
      try {
        const assignmentList = await ApiService.getTeachingAssignments(activeSchool.id, isTeacher ? currentUser.id : undefined);
        const teacherList = isTeacher
          ? [currentUser]
          : (await ApiService.getUsers(activeSchool.id)).filter(user => getUserRoles(user).includes('TEACHER'));
        setTeachers(teacherList);
        setAssignments(assignmentList);
        setSelectedTeacherId(isTeacher ? currentUser.id : teacherList[0]?.id || '');
        setError('');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeSchool, currentUser]);

  useEffect(() => {
    const first = assignments.find(item => item.teacherUserId === selectedTeacherId);
    setSelectedAssignmentId(first?.id || '');
  }, [selectedTeacherId, assignments]);

  const loadRoster = async () => {
    if (!activeSchool || !currentUser || !selectedAssignmentId) {
      setStudents([]);
      return;
    }
    setLoading(true);
    try {
      const [roster, markList] = await Promise.all([
        ApiService.getStudents(activeSchool.id, selectedAssignmentId, currentUser.id),
        ApiService.getStudentMarks(activeSchool.id, selectedAssignmentId, currentUser.id),
      ]);
      setStudents(roster);
      setMarks(markList);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoster(); }, [selectedAssignmentId]);

  const openCreate = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setForm({
      admissionNumber: student.admissionNumber,
      fullName: student.fullName,
      guardianName: student.guardianName || '',
      guardianContact: student.guardianContact || '',
    });
    setIsFormOpen(true);
  };

  const saveStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeSchool || !currentUser || !selectedAssignmentId) return;
    try {
      if (editingStudent) {
        await ApiService.updateStudent(activeSchool.id, editingStudent.id, {
          ...form, actorUserId: currentUser.id, assignmentId: selectedAssignmentId,
        });
      } else {
        await ApiService.createStudent(activeSchool.id, {
          ...form, actorUserId: currentUser.id, assignmentId: selectedAssignmentId,
        });
      }
      setIsFormOpen(false);
      await loadRoster();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeStudent = async (student: StudentRecord) => {
    if (!activeSchool || !currentUser || !selectedAssignmentId) return;
    if (!window.confirm(`Remove ${student.fullName} from this school roster? Their saved marks will also be removed.`)) return;
    try {
      await ApiService.deleteStudent(activeSchool.id, student.id, selectedAssignmentId, currentUser.id);
      await loadRoster();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });

  const beginImport = async (file: File) => {
    if (!activeSchool || !currentUser || !selectedAssignmentId) return;
    if (file.size > 15 * 1024 * 1024) {
      setError('Marks files must be 15 MB or smaller.');
      return;
    }
    setIsImportOpen(true);
    setIsAnalysing(true);
    setImportFileName(file.name);
    setAssessmentTitle(file.name.replace(/\.[^.]+$/, ''));
    setReviewRows(students.map(student => ({
      studentId: student.id, admissionNumber: student.admissionNumber, studentName: student.fullName,
      score: null, confidence: 0, status: 'manual-review',
    })));
    try {
      const result = await ApiService.analyseMarksImport(activeSchool.id, {
        actorUserId: currentUser.id,
        assignmentId: selectedAssignmentId,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataBase64: await fileToBase64(file),
      });
      setImportId(result.importId);
      setExtractionMethod(result.extractionMethod);
      setReviewRows(result.rows);
      setUnmatchedRows(result.unmatchedRows || []);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalysing(false);
    }
  };

  const confirmImport = async () => {
    if (!activeSchool || !currentUser || !selectedAssignmentId || !importId) return;
    const rows = reviewRows.filter(row => row.score !== null && Number.isFinite(Number(row.score))).map(row => ({ studentId: row.studentId, score: Number(row.score) }));
    try {
      const result = await ApiService.confirmMarksImport(activeSchool.id, {
        actorUserId: currentUser.id,
        assignmentId: selectedAssignmentId,
        importId,
        assessmentTitle,
        term,
        totalMarks,
        rows,
      });
      setSuccess(`${result.marks.length} marks saved. ${importFileName} was added to the Knowledge Hub as evidence.`);
      setIsImportOpen(false);
      await loadRoster();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!activeSchool || !currentUser) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-700"><GraduationCap className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-widest">Academic records</span></div>
            <h1 className="mt-2 text-2xl font-black text-slate-900">Students &amp; Marks</h1>
            <p className="mt-1 text-sm text-slate-500">Open a teacher, subject, and class to manage the correct roster. Students do not receive login accounts.</p>
          </div>
          {!isTeacher && (
            <label className="min-w-72 text-xs font-bold text-slate-600">
              View teacher
              <select value={selectedTeacherId} onChange={event => setSelectedTeacherId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900">
                {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
              </select>
            </label>
          )}
        </div>
      </section>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      {success && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-5 w-5" />{success}</div>}

      <section>
        <div className="mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-slate-500" /><h2 className="text-sm font-black text-slate-800">Assigned subjects and classes</h2></div>
        {visibleAssignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">This teacher has no subject/class assignments yet. A school administrator can add them in Academic Structure.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleAssignments.map(item => (
              <button key={item.id} onClick={() => setSelectedAssignmentId(item.id)} className={`rounded-2xl border p-4 text-left transition ${selectedAssignmentId === item.id ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>
                <div className="font-black text-slate-900">{item.subjectName}</div>
                <div className="mt-1 text-sm text-slate-600">{item.gradeName} · {item.className}</div>
                <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-indigo-600">{item.academicYear}</div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedAssignment && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-slate-900">{selectedAssignment.subjectName} · {selectedAssignment.className}</h2>
              <p className="mt-1 text-xs text-slate-500">{students.length} student record(s) in this class</p>
            </div>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find student" className="rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm" /></div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100">
                <Upload className="h-4 w-4" />Import marks
                <input type="file" className="sr-only" accept=".xlsx,.xls,.csv,.pdf,image/*" onChange={event => { const file = event.target.files?.[0]; if (file) beginImport(file); event.target.value = ''; }} />
              </label>
              <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700"><Plus className="h-4 w-4" />Add student</button>
            </div>
          </div>

          {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading roster...</div> : filteredStudents.length === 0 ? (
            <div className="p-12 text-center"><Users className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm text-slate-500">No students in this roster yet.</p></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStudents.map(student => {
                const latestMark = marks.find(mark => mark.studentId === student.id);
                return <div key={student.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><UserRound className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1"><div className="font-bold text-slate-900">{student.fullName}</div><div className="text-xs text-slate-500">Admission: {student.admissionNumber}{student.guardianContact ? ` · Guardian: ${student.guardianContact}` : ''}</div></div>
                  {latestMark && <div className="hidden rounded-lg bg-emerald-50 px-3 py-1.5 text-right sm:block"><div className="text-xs font-black text-emerald-800">{latestMark.score}/{latestMark.totalMarks}</div><div className="text-[10px] text-emerald-600">{latestMark.assessmentTitle}</div></div>}
                  <button onClick={() => openEdit(student)} className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700" aria-label={`Edit ${student.fullName}`}><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => removeStudent(student)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`Remove ${student.fullName}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              })}
            </div>
          )}
        </section>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={saveStudent} className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5"><div><h3 className="font-black text-slate-900">{editingStudent ? 'Edit student' : 'Add student'}</h3><p className="text-xs text-slate-500">{selectedAssignment.subjectName} · {selectedAssignment.className}</p></div><button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5" /></button></div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-600">Admission number *<input required value={form.admissionNumber} onChange={e => setForm({ ...form, admissionNumber: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold text-slate-600">Full name *<input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold text-slate-600">Guardian name<input value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold text-slate-600">Guardian contact<input value={form.guardianContact} onChange={e => setForm({ ...form, guardianContact: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" /></label>
            </div>
            <div className="flex justify-end gap-2 border-t p-5"><button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border px-4 py-2 text-xs font-bold">Cancel</button><button className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black text-white">{editingStudent ? 'Save changes' : 'Add student'}</button></div>
          </form>
        </div>
      )}

      {isImportOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><FileSpreadsheet className="h-5 w-5" /></div><div><h3 className="font-black text-slate-900">Review marks before saving</h3><p className="text-xs text-slate-500">{importFileName} · {selectedAssignment.subjectName} · {selectedAssignment.className}</p></div></div>
              <button onClick={() => setIsImportOpen(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-3 border-b bg-slate-50 p-4 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-600">Assessment title<input value={assessmentTitle} onChange={event => setAssessmentTitle(event.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold text-slate-600">Term<select value={term} onChange={event => setTerm(event.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"><option>Term 1</option><option>Term 2</option><option>Term 3</option><option>Term 4</option></select></label>
              <label className="text-xs font-bold text-slate-600">Total marks<input type="number" min="1" value={totalMarks} onChange={event => setTotalMarks(Number(event.target.value))} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm" /></label>
            </div>

            <div className="flex items-center justify-between border-b px-5 py-3 text-xs">
              <span className="font-semibold text-slate-600">Extraction: <strong>{isAnalysing ? 'Scanning locally…' : extractionMethod.replaceAll('-', ' ')}</strong></span>
              <span className="text-slate-500">Check every mark. Blank rows must be entered manually.</span>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-4 py-3">Admission</th><th className="px-4 py-3">Match</th><th className="px-5 py-3 text-right">Mark</th></tr></thead>
                <tbody className="divide-y">
                  {reviewRows.map((row, index) => (
                    <tr key={row.studentId} className={row.status === 'matched' ? 'bg-white' : 'bg-amber-50/50'}>
                      <td className="px-5 py-3 font-bold text-slate-900">{row.studentName}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{row.admissionNumber}</td>
                      <td className="px-4 py-3">{row.status === 'matched' ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{Math.round(row.confidence * 100)}%</span> : <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700"><AlertTriangle className="h-4 w-4" />Check manually</span>}</td>
                      <td className="px-5 py-3 text-right"><input type="number" min="0" max={totalMarks} value={row.score ?? ''} onChange={event => setReviewRows(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, score: event.target.value === '' ? null : Number(event.target.value), status: 'manual-review' } : item))} className="w-24 rounded-lg border px-3 py-2 text-right font-bold" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {unmatchedRows.length > 0 && <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{unmatchedRows.length} extracted row(s) could not be matched to this class. Review the roster and enter those marks manually.</div>}
            </div>

            <div className="flex items-center justify-between border-t p-5"><p className="max-w-xl text-xs text-slate-500">Saving creates student mark records and stores the original file in Knowledge Hub → Assessment Evidence.</p><div className="flex gap-2"><button onClick={() => setIsImportOpen(false)} className="rounded-xl border px-4 py-2 text-xs font-bold">Cancel</button><button disabled={isAnalysing || !importId} onClick={confirmImport} className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white disabled:opacity-50">Confirm and save marks</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
};
