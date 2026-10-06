export type Role =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'PRINCIPAL'
  | 'DEPUTY_PRINCIPAL'
  | 'HOD'
  | 'TEACHER';

export type SchoolType = 'Primary School' | 'Secondary School' | 'Combined School' | 'Public' | 'Private' | 'Academy' | 'International' | 'Charter';

export type TermSystem = '4 Terms' | '3 Trimesters' | '2 Semesters';

export interface School {
  id: string; // Unique school ID e.g., SCH-1001
  name: string;
  logo: string;
  badge?: string;
  profilePicture?: string;
  motto: string;
  type: SchoolType;
  country: string;
  province: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
  academicYear: string;
  terms: TermSystem;
  language: string;
  status: 'Active' | 'Pending Setup' | 'Suspended';
  isFirstLogin: boolean;
  createdAt: string;
  emisNumber?: string;
  registrationNumber?: string;
  postalAddress?: string;
  loginBackgroundPlaceholder?: string;
  dashboardBannerPlaceholder?: string;
  customThemePlaceholder?: string;
}

export interface User {
  id: string;
  schoolId: string | null; // null for Super Admin, strictly set for school staff
  fullName: string;
  email: string;
  role: Role; // Primary role
  roles?: Role[]; // Multi-role support (e.g. ['PRINCIPAL', 'TEACHER'])
  departmentIds?: string[];
  gradeIds?: string[];
  hodUserId?: string;
  createdByUserId?: string;
  tutorialCompletedAt?: string;
  firebaseUid?: string;
  status: 'Active' | 'Pending Setup' | 'Inactive' | 'Disabled';
  createdAt: string;
  lastLogin?: string;
}

export interface AcademicPhase {
  id: string;
  schoolId: string;
  name: string; // 'Foundation Phase' | 'Intermediate Phase' | 'Senior Phase'
  code: string; // 'FP' | 'IP' | 'SP'
  description: string;
  isSystemDefault: boolean;
}

export interface Department {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  hodUserId?: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  phaseId: string; // References AcademicPhase
  departmentId?: string;
  name: string;
  code: string;
  isCustom?: boolean;
  isArchived?: boolean;
}

export interface Grade {
  id: string;
  schoolId: string;
  phaseId: string; // References AcademicPhase
  name: string; // 'Grade R', 'Grade 1', 'Grade 2', etc.
  code: string;
  order: number;
  isArchived?: boolean;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  gradeId: string;
  name: string;
  teacherUserId?: string;
}

export interface CurriculumMap {
  id: string;
  schoolId: string;
  phaseId: string;
  gradeId: string;
  subjectId: string;
}

export interface TeachingAssignment {
  id: string;
  schoolId: string;
  teacherUserId: string;
  teacherName?: string;
  phaseId: string;
  phaseName?: string;
  gradeId: string;
  gradeName?: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  academicYear: string;
}

export interface StudentRecord {
  id: string;
  schoolId: string;
  admissionNumber: string;
  fullName: string;
  gradeId: string;
  classId: string;
  guardianName?: string;
  guardianContact?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface StudentMark {
  id: string;
  schoolId: string;
  studentId: string;
  teachingAssignmentId: string;
  assessmentTitle: string;
  term: string;
  score: number;
  totalMarks: number;
  percentage: number;
  sourceResourceId: string;
  capturedByUserId: string;
  capturedByName: string;
  createdAt: string;
}

export interface MarkImportReviewRow {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  extractedName?: string;
  score: number | null;
  confidence: number;
  status: 'matched' | 'manual-review' | 'not-found';
}

export interface UnmatchedMarkImportRow {
  admissionNumber?: string;
  name?: string;
  score?: number | null;
}

export interface PlatformSchoolAdmin extends User {
  schoolName: string;
}

export interface HodPhaseAssignment {
  id: string;
  schoolId: string;
  hodUserId: string;
  phaseId: string;
}

export interface HodGradeAssignment {
  id: string;
  schoolId: string;
  hodUserId: string;
  gradeId: string;
}

export interface AcademicAssignment {
  id: string;
  schoolId: string;
  userId: string;
  userName?: string;
  role: Role;
  gradeId: string;
  gradeName?: string;
  subjectId?: string; // Optional or 'ALL'
  subjectName?: string;
  classId?: string;
  className?: string;
  academicYear: string;
  status: 'Active' | 'Inactive';
  createdBy?: string;
  createdAt: string;
}

export type AssessmentStatus =
  | 'Draft'
  | 'Submitted'
  | 'DP Review'
  | 'Approved'
  | 'Archived';

export interface ModerationNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

export interface AssessmentApprovalHistory {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  notes?: string;
}

export interface AssessmentVersion {
  id: string;
  versionNumber: number;
  title: string;
  updatedBy: string;
  timestamp: string;
  summary: string;
}

export interface AssessmentWorkspace {
  id: string;
  schoolId: string;
  phaseId: string;
  phaseName?: string;
  gradeId: string;
  gradeName?: string;
  subjectId: string;
  subjectName?: string;
  className?: string;
  academicYear: string;
  term: string;
  title: string;
  assessmentType: string; // 'Formal Test' | 'Exam' | 'Assignment' | 'Project' | 'Practical Task' | 'Investigation'
  totalMarks: number;
  duration: string;
  language: string;
  status: AssessmentStatus;
  teacherUserId: string;
  teacherName?: string;
  hodUserId?: string;
  submissionDate?: string;
  approvalDate?: string;
  archiveDate?: string;
  createdAt: string;
  updatedAt: string;
  paperFile?: { fileName: string; fileType: string; mimeType?: string; uploadDate: string; fileUrl?: string; objectPath?: string };
  memoFile?: { fileName: string; fileType: string; mimeType?: string; uploadDate: string; fileUrl?: string; objectPath?: string };
  moderationNotes?: ModerationNote[];
  approvalHistory?: AssessmentApprovalHistory[];
  versionHistory?: AssessmentVersion[];
}

export interface KnowledgeResource {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  resourceType:
    | 'CAPS Document'
    | 'Annual Teaching Plan'
    | 'Lesson Plan'
    | 'Worksheet'
    | 'PowerPoint Presentation'
    | 'Department Policy'
    | 'School Policy'
    | 'Meeting Minutes'
    | 'Training Material'
    | 'Reference Document'
    | 'Assessment Evidence'
    | 'General Teaching Resource';
  folder: string;
  tags: string[];
  fileType: string;
  fileSize: string;
  uploadedByUserId: string;
  uploadedByName: string;
  departmentSharing: boolean;
  departmentId?: string;
  wholeSchoolSharing: boolean;
  fileUrl?: string;
  storageObjectPath?: string;
  mimeType?: string;
  sourceType?: 'manual-upload' | 'marks-import';
  linkedTeachingAssignmentId?: string;
  linkedStudentIds?: string[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  schoolId: string | null; // null for platform level events
  actorUserId: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface RolePermission {
  role: Role;
  label: string;
  permissions: {
    manageUsers: boolean;
    manageSchoolProfile: boolean;
    manageDepartments: boolean;
    manageSettings: boolean;
    viewAuditLogs: boolean;
    switchSchool: boolean;
  };
}

export interface AuthState {
  currentUser: User | null;
  currentSchool: School | null; // Currently active tenant context
  superAdminInspectingSchool: School | null; // If Super Admin switched to inspect a school
  token: string | null;
}

export interface UserEngagementSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: Role;
  schoolId: string | null;
  schoolName?: string;
  loginTime: string; // ISO format
  lastActiveTime: string; // ISO format
  durationSeconds: number;
  interactionCount: number;
  isBounced: boolean;
  bounceReason?: string;
  exitPage?: string;
  device?: string;
}

export interface UserActionEvent {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userRole: Role;
  schoolId: string | null;
  featureId: string;
  featureName: string;
  category: 'assessments' | 'students_marks' | 'knowledge_hub' | 'admin' | 'navigation' | 'academic' | 'settings';
  actionType: 'view' | 'click' | 'create' | 'update' | 'delete' | 'export' | 'upload';
  details: string;
  timestamp: string; // ISO format
}

export interface FeatureEngagementMetric {
  featureId: string;
  featureName: string;
  category: string;
  totalInteractions: number;
  uniqueUsersCount: number;
  avgPerUser: number;
  lastUsedAt: string;
  usageTier: 'high' | 'moderate' | 'low' | 'avoided';
  statusRecommendation: 'leave_be' | 'refine' | 'simplify_or_promote';
  recommendationReason: string;
}

export interface BounceAnalytics {
  totalSessions: number;
  totalBounceSessions: number;
  bounceRatePercentage: number;
  avgBounceDurationSeconds: number;
  bouncedSessions: UserEngagementSession[];
  roleBounceBreakdown: Record<string, { total: number; bounced: number; rate: number }>;
}

export interface EngagementAnalyticsSummary {
  schoolId: string | null;
  timeframe: string;
  totalInteractions: number;
  totalActiveUsers: number;
  totalSessions: number;
  mostUsedFeatures: FeatureEngagementMetric[];
  avoidedFeatures: FeatureEngagementMetric[];
  featuresToLeaveBe: FeatureEngagementMetric[];
  featuresToRefine: FeatureEngagementMetric[];
  bounceStats: BounceAnalytics;
  recentSessions: UserEngagementSession[];
  recentActions: UserActionEvent[];
}

