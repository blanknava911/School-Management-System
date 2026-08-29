import {
  School,
  User,
  Department,
  Subject,
  Grade,
  SchoolClass,
  AuditLog,
  AcademicPhase,
  CurriculumMap,
  TeachingAssignment,
  HodPhaseAssignment,
  HodGradeAssignment,
  AcademicAssignment,
  AssessmentWorkspace,
  KnowledgeResource,
  StudentRecord,
  StudentMark,
  MarkImportReviewRow,
  PlatformSchoolAdmin,
} from '../types.js';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase/config';

export const API_BASE = '/api';

let sessionToken = typeof window !== 'undefined'
  ? window.sessionStorage.getItem('samp-session-token')
  : null;

function setSessionToken(token: string | null) {
  sessionToken = token;
  if (typeof window === 'undefined') return;
  if (token) window.sessionStorage.setItem('samp-session-token', token);
  else window.sessionStorage.removeItem('samp-session-token');
}

async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);
  return fetch(input, { ...init, headers });
}

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  const errorData = await res.json().catch(() => ({}));
  return typeof errorData.error === 'string' && errorData.error.trim()
    ? errorData.error
    : fallback;
}

export class ApiService {
  static clearSession() {
    setSessionToken(null);
  }

  static async downloadFile(url: string, suggestedName: string): Promise<void> {
    const res = await apiFetch(url);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not download this file.');
    const objectUrl = URL.createObjectURL(await res.blob());
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = suggestedName;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  // Login
  static async login(email: string, password: string): Promise<{ user: User; school: School | null; token: string }> {
    setSessionToken(null);
    if ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_USE_FIREBASE_AUTH === 'true') {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await credential.user.getIdToken();
      const firebaseResponse = await fetch(`${API_BASE}/auth/firebase-session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }),
      });
      if (!firebaseResponse.ok) throw new Error((await firebaseResponse.json().catch(() => ({}))).error || 'Firebase login failed.');
      const data = await firebaseResponse.json();
      setSessionToken(data.token);
      return data;
    }
    console.log('[ApiService.login] Sending login payload to /api/auth/login:', { email });
    const res = await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn('[ApiService.login] Request failed with status:', res.status, errorData);
      throw new Error(errorData.error || 'Login failed. Please check your credentials.');
    }
    const data = await res.json();
    setSessionToken(data.token);
    console.log('[ApiService.login] Received successful auth response:', { userId: data.user?.id, role: data.user?.role });
    return data;
  }

  // Register new school + school admin
  static async registerSchool(payload: {
    schoolInfo: Partial<School>;
    adminInfo: { fullName: string; email: string; password: string };
  }): Promise<{ school: School; user: User; token: string }> {
    const res = await apiFetch(`${API_BASE}/schools/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'School registration failed.');
    }
    return res.json();
  }

  // Get list of all schools
  static async getSchools(): Promise<School[]> {
    const res = await apiFetch(`${API_BASE}/schools`);
    if (!res.ok) throw new Error('Failed to fetch schools');
    return res.json();
  }

  // Get specific school
  static async getSchool(schoolId: string): Promise<School> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}`);
    if (!res.ok) throw new Error('Failed to fetch school details');
    return res.json();
  }

  // Update school details / branding
  static async updateSchool(
    schoolId: string,
    updates: Partial<School>,
    actorUser: User,
    auditEntries?: Array<{ action: string; details: string }>
  ): Promise<School> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorUser, updates, auditEntries }),
    });
    if (!res.ok) throw new Error('Failed to update school profile');
    return res.json();
  }

  // Complete First-Time Setup Wizard
  static async completeFirstTimeSetup(schoolId: string, payload: any): Promise<{ school: School }> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/first-time-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save first-time setup configuration');
    return res.json();
  }

  // Get Users for a School
  static async getUsers(schoolId: string): Promise<User[]> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  }

  // Add User to School
  static async createUser(schoolId: string, userData: any, actorUser: User): Promise<User> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, actorUser }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create user');
    }
    return res.json();
  }

  static async updateUserStatus(schoolId: string, userId: string, status: 'Active' | 'Disabled'): Promise<User> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update user status');
    }
    return res.json();
  }

  static async updateUser(schoolId: string, userId: string, updates: Partial<User> & { password?: string }): Promise<User> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/users/${userId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update user');
    return res.json();
  }

  static async replaceHod(schoolId: string, outgoingHodUserId: string, replacementHodUserId: string): Promise<{ teachersTransferred: number }> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/hod-replacement`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outgoingHodUserId, replacementHodUserId }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to replace Departmental Head');
    return res.json();
  }

  static async getPlatformSchoolAdmins(): Promise<PlatformSchoolAdmin[]> {
    const res = await apiFetch(`${API_BASE}/platform/school-admins`);
    if (!res.ok) throw new Error('Failed to load school administrators');
    return res.json();
  }

  static async updatePlatformSchoolAdmin(userId: string, updates: Partial<User> & { password?: string }): Promise<PlatformSchoolAdmin> {
    const res = await apiFetch(`${API_BASE}/platform/school-admins/${userId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update school administrator');
    return res.json();
  }

  // --- PRIMARY SCHOOL ACADEMIC STRUCTURE SERVICES ---

  static async getAcademicStructure(
    schoolId: string,
    includeArchived = false
  ): Promise<{
    phases: AcademicPhase[];
    grades: Grade[];
    subjects: Subject[];
    classes: SchoolClass[];
    curriculumMaps: CurriculumMap[];
  }> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/academic-structure?includeArchived=${includeArchived}`);
    if (!res.ok) throw new Error('Failed to fetch academic structure');
    return res.json();
  }

  // Subjects
  static async getSubjects(schoolId: string, phaseId?: string, includeArchived = false): Promise<Subject[]> {
    let url = `${API_BASE}/schools/${schoolId}/subjects?includeArchived=${includeArchived}`;
    if (phaseId) url += `&phaseId=${phaseId}`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to fetch subjects');
    return res.json();
  }

  static async createSubject(
    schoolId: string,
    payload: { phaseId: string; name: string; code: string; isCustom?: boolean }
  ): Promise<Subject> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create subject');
    }
    return res.json();
  }

  static async updateSubject(schoolId: string, subjectId: string, updates: Partial<Subject>): Promise<Subject> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/subjects/${subjectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update subject');
    return res.json();
  }

  static async archiveSubject(schoolId: string, subjectId: string): Promise<Subject> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/subjects/${subjectId}/archive`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to archive subject');
    return res.json();
  }

  static async restoreSubject(schoolId: string, subjectId: string): Promise<Subject> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/subjects/${subjectId}/restore`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to restore subject');
    return res.json();
  }

  static async deleteSubject(schoolId: string, subjectId: string): Promise<boolean> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/subjects/${subjectId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete subject');
    const data = await res.json();
    return data.success;
  }

  // Grades & Classes
  static async getGradesAndClasses(schoolId: string, includeArchived = false): Promise<{ grades: Grade[]; classes: SchoolClass[] }> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/grades?includeArchived=${includeArchived}`);
    if (!res.ok) throw new Error('Failed to fetch grades');
    return res.json();
  }

  static async createGrade(schoolId: string, payload: { phaseId: string; name: string; code?: string }): Promise<Grade> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/grades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create grade');
    }
    return res.json();
  }

  static async updateGrade(schoolId: string, gradeId: string, updates: Partial<Grade>): Promise<Grade> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/grades/${gradeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update grade');
    return res.json();
  }

  static async archiveGrade(schoolId: string, gradeId: string): Promise<Grade> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/grades/${gradeId}/archive`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to archive grade');
    return res.json();
  }

  static async restoreGrade(schoolId: string, gradeId: string): Promise<Grade> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/grades/${gradeId}/restore`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to restore grade');
    return res.json();
  }

  // Curriculum Mapping Toggle
  static async toggleCurriculumMap(
    schoolId: string,
    phaseId: string,
    subjectId: string,
    gradeId: string
  ): Promise<{ isMapped: boolean; curriculumMaps: CurriculumMap[] }> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/curriculum-map/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phaseId, subjectId, gradeId }),
    });
    if (!res.ok) throw new Error('Failed to toggle curriculum mapping');
    return res.json();
  }

  // Teaching Assignments
  static async getTeachingAssignments(schoolId: string, teacherUserId?: string): Promise<TeachingAssignment[]> {
    let url = `${API_BASE}/schools/${schoolId}/teaching-assignments`;
    if (teacherUserId) url += `?teacherUserId=${teacherUserId}`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to fetch teaching assignments');
    return res.json();
  }

  static async createTeachingAssignment(
    schoolId: string,
    payload: {
      teacherUserId: string;
      phaseId: string;
      gradeId: string;
      classId: string;
      subjectId: string;
      academicYear?: string;
    }
  ): Promise<TeachingAssignment> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/teaching-assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create teaching assignment');
    }
    return res.json();
  }

  static async deleteTeachingAssignment(schoolId: string, assignmentId: string): Promise<boolean> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/teaching-assignments/${assignmentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete teaching assignment');
    const data = await res.json();
    return data.success;
  }

  static async getStudents(schoolId: string, assignmentId: string, actorUserId: string): Promise<StudentRecord[]> {
    const params = new URLSearchParams({ assignmentId, actorUserId });
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/students?${params.toString()}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load students');
    return res.json();
  }

  static async createStudent(schoolId: string, payload: {
    actorUserId: string;
    assignmentId: string;
    admissionNumber: string;
    fullName: string;
    guardianName?: string;
    guardianContact?: string;
  }): Promise<StudentRecord> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/students`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to add student');
    return res.json();
  }

  static async updateStudent(schoolId: string, studentId: string, payload: Partial<StudentRecord> & { actorUserId: string; assignmentId: string }): Promise<StudentRecord> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/students/${studentId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to update student');
    return res.json();
  }

  static async deleteStudent(schoolId: string, studentId: string, assignmentId: string, actorUserId: string): Promise<boolean> {
    const params = new URLSearchParams({ assignmentId, actorUserId });
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/students/${studentId}?${params.toString()}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to remove student');
    return (await res.json()).success;
  }

  static async getStudentMarks(schoolId: string, assignmentId: string, actorUserId: string): Promise<StudentMark[]> {
    const params = new URLSearchParams({ assignmentId, actorUserId });
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/student-marks?${params.toString()}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load marks');
    return res.json();
  }

  static async analyseMarksImport(schoolId: string, payload: {
    actorUserId: string;
    assignmentId: string;
    fileName: string;
    mimeType: string;
    dataBase64: string;
  }): Promise<{ importId: string; extractionMethod: string; rows: MarkImportReviewRow[]; unmatchedRows: any[]; fileName: string }> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/marks-import/analyse`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not analyse file');
    return res.json();
  }

  static async confirmMarksImport(schoolId: string, payload: {
    actorUserId: string;
    assignmentId: string;
    importId: string;
    assessmentTitle: string;
    term: string;
    totalMarks: number;
    rows: Array<{ studentId: string; score: number }>;
  }): Promise<{ marks: StudentMark[]; resource: KnowledgeResource }> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/marks-import/confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not save marks');
    return res.json();
  }

  // HOD Grade Assignments
  static async getHodGradeAssignments(schoolId: string, hodUserId?: string): Promise<HodGradeAssignment[]> {
    let url = `${API_BASE}/schools/${schoolId}/hod-grade-assignments`;
    if (hodUserId) url += `?hodUserId=${hodUserId}`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to fetch HOD grade assignments');
    return res.json();
  }

  static async setHodGradeAssignments(schoolId: string, hodUserId: string, gradeIds: string[]): Promise<HodGradeAssignment[]> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/hod-grade-assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hodUserId, gradeIds }),
    });
    if (!res.ok) throw new Error('Failed to save HOD grade assignments');
    return res.json();
  }

  // Academic Assignments
  static async getAcademicAssignments(
    schoolId: string,
    filter?: { userId?: string; role?: string; gradeId?: string }
  ): Promise<AcademicAssignment[]> {
    const params = new URLSearchParams();
    if (filter?.userId) params.append('userId', filter.userId);
    if (filter?.role) params.append('role', filter.role);
    if (filter?.gradeId) params.append('gradeId', filter.gradeId);

    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/academic-assignments?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch academic assignments');
    return res.json();
  }

  static async createAcademicAssignment(schoolId: string, payload: any): Promise<AcademicAssignment> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/academic-assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to create academic assignment'));
    return res.json();
  }

  static async deleteAcademicAssignment(schoolId: string, id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/academic-assignments/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete academic assignment');
    return res.json();
  }

  // HOD Phase Assignments
  static async getHodPhaseAssignments(schoolId: string, hodUserId?: string): Promise<HodPhaseAssignment[]> {
    let url = `${API_BASE}/schools/${schoolId}/hod-phase-assignments`;
    if (hodUserId) url += `?hodUserId=${hodUserId}`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Failed to fetch HOD phase assignments');
    return res.json();
  }

  static async setHodPhaseAssignments(schoolId: string, hodUserId: string, phaseIds: string[]): Promise<HodPhaseAssignment[]> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/hod-phase-assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hodUserId, phaseIds }),
    });
    if (!res.ok) throw new Error('Failed to save HOD phase assignments');
    return res.json();
  }

  // Assessment Workspaces
  static async getAssessmentWorkspaces(
    schoolId: string,
    filter?: { phaseId?: string; gradeId?: string; subjectId?: string; teacherUserId?: string }
  ): Promise<AssessmentWorkspace[]> {
    const params = new URLSearchParams();
    if (filter?.phaseId) params.append('phaseId', filter.phaseId);
    if (filter?.gradeId) params.append('gradeId', filter.gradeId);
    if (filter?.subjectId) params.append('subjectId', filter.subjectId);
    if (filter?.teacherUserId) params.append('teacherUserId', filter.teacherUserId);

    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/assessment-workspaces?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch assessment workspaces');
    return res.json();
  }

  static async createAssessmentWorkspace(
    schoolId: string,
    payload: {
      phaseId: string;
      gradeId: string;
      subjectId: string;
      term: string;
      title: string;
      teacherUserId: string;
    }
  ): Promise<AssessmentWorkspace> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/assessment-workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to create assessment workspace'));
    return res.json();
  }

  static async updateAssessmentWorkspaceStatus(
    schoolId: string,
    workspaceId: string,
    status: AssessmentWorkspace['status'],
    hodUserId?: string,
    actorUser?: User
  ): Promise<AssessmentWorkspace> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/assessment-workspaces/${workspaceId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, hodUserId, actorUser }),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to update assessment workspace status'));
    return res.json();
  }

  static async updateAssessmentWorkspace(
    schoolId: string,
    workspaceId: string,
    updates: Partial<AssessmentWorkspace>
  ): Promise<AssessmentWorkspace> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/assessment-workspaces/${workspaceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to update assessment workspace'));
    return res.json();
  }

  static async uploadAssessmentFile(schoolId: string, workspaceId: string, target: 'paper' | 'memo', file: File): Promise<AssessmentWorkspace> {
    const dataBase64 = await this.fileToBase64(file);
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/assessment-workspaces/${workspaceId}/files`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, fileName: file.name, mimeType: file.type, dataBase64 }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to upload assessment file');
    return res.json();
  }

  static async deleteAssessmentWorkspace(
    schoolId: string,
    workspaceId: string,
    actorUser?: User
  ): Promise<{ success: boolean }> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/assessment-workspaces/${workspaceId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorUser }),
    });
    if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to delete assessment workspace'));
    return res.json();
  }

  static async toggleSchoolStatus(
    schoolId: string,
    status: 'Active' | 'Disabled',
    actorUser?: User
  ): Promise<School> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actorUser }),
    });
    if (!res.ok) throw new Error('Failed to update school status');
    return res.json();
  }

  // Get Departments
  static async getDepartments(schoolId: string): Promise<Department[]> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/departments`);
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  }

  static async createDepartment(schoolId: string, dept: { name: string; code: string }): Promise<Department> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dept),
    });
    if (!res.ok) throw new Error('Failed to create department');
    return res.json();
  }

  // Audit Logs
  static async getAuditLogs(schoolId: string | 'PLATFORM'): Promise<AuditLog[]> {
    const res = await apiFetch(`${API_BASE}/audit-logs?schoolId=${schoolId}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }

  // Super Admin context switch
  static async switchSchoolInspection(actorUser: User, targetSchoolId: string): Promise<{ targetSchool: School }> {
    const res = await apiFetch(`${API_BASE}/platform/switch-school`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorUser, targetSchoolId }),
    });
    if (!res.ok) throw new Error('Failed to switch school context');
    return res.json();
  }

  // Knowledge Hub Resources
  static async getKnowledgeResources(schoolId: string): Promise<KnowledgeResource[]> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/knowledge-resources`);
    if (!res.ok) throw new Error('Failed to fetch knowledge resources');
    return res.json();
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(new Error('Could not read the selected file.'));
      reader.readAsDataURL(file);
    });
  }

  static async createKnowledgeResource(schoolId: string, payload: Partial<KnowledgeResource> & { file: File }, actorUser?: User): Promise<KnowledgeResource> {
    const { file, ...metadata } = payload;
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/knowledge-resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...metadata, actorUser, fileName: file.name, mimeType: file.type, dataBase64: await this.fileToBase64(file) }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to create knowledge resource');
    return res.json();
  }

  static async deleteKnowledgeResource(schoolId: string, resourceId: string, actorUser?: User): Promise<{ success: boolean }> {
    const res = await apiFetch(`${API_BASE}/schools/${schoolId}/knowledge-resources/${resourceId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorUser }),
    });
    if (!res.ok) throw new Error('Failed to delete knowledge resource');
    return res.json();
  }

  // AI Suggestion
  static async suggestCurriculum(schoolType: string, country: string): Promise<{ departments: any[]; subjects: any[] }> {
    const res = await apiFetch(`${API_BASE}/ai/suggest-curriculum`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolType, country }),
    });
    if (!res.ok) throw new Error('AI suggestion failed');
    return res.json();
  }
}
