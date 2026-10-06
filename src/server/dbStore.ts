import fs from 'fs';
import path from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
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
  UserEngagementSession,
  UserActionEvent,
  EngagementAnalyticsSummary,
  FeatureEngagementMetric,
} from '../types.js';

// Pre-seeded multi-tenant storage with Disk Persistence
export class DatabaseStore {
  private schools: Map<string, School> = new Map();
  private users: Map<string, User> = new Map();
  private userPasswords: Map<string, string> = new Map(); // userId -> password
  private departments: Map<string, Department> = new Map();
  private phases: Map<string, AcademicPhase> = new Map();
  private subjects: Map<string, Subject> = new Map();
  private grades: Map<string, Grade> = new Map();
  private classes: Map<string, SchoolClass> = new Map();
  private curriculumMaps: Map<string, CurriculumMap> = new Map();
  private teachingAssignments: Map<string, TeachingAssignment> = new Map();
  private hodPhaseAssignments: Map<string, HodPhaseAssignment> = new Map();
  private hodGradeAssignments: Map<string, HodGradeAssignment> = new Map();
  private academicAssignments: Map<string, AcademicAssignment> = new Map();
  private assessmentWorkspaces: Map<string, AssessmentWorkspace> = new Map();
  private knowledgeResources: Map<string, KnowledgeResource> = new Map();
  private students: Map<string, StudentRecord> = new Map();
  private studentMarks: Map<string, StudentMark> = new Map();
  private auditLogs: AuditLog[] = [];
  private engagementSessions: Map<string, UserEngagementSession> = new Map();
  private userActions: Map<string, UserActionEvent> = new Map();
  private remoteSave?: (state: Record<string, unknown>) => Promise<void>;

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${derivedKey}`;
  }

  constructor() {
    const loaded = this.loadFromDisk();
    if (!loaded) {
      console.log('[dbStore] No persistent storage found on disk. Seeding default data...');
      this.seedData();
      this.saveToDisk();
    }
    if (this.assignMissingTeacherHods()) this.saveToDisk();
    if (this.engagementSessions.size === 0) {
      this.seedEngagementData();
      this.saveToDisk();
    }
  }

  private assignMissingTeacherHods(): boolean {
    let changed = false;
    for (const [id, user] of this.users.entries()) {
      const roles = user.roles?.length ? user.roles : [user.role];
      if (!user.schoolId || !roles.includes('TEACHER') || user.hodUserId) continue;
      const hod = Array.from(this.users.values()).find(candidate =>
        candidate.schoolId === user.schoolId && candidate.status === 'Active' && ((candidate.roles || [candidate.role]).includes('HOD'))
      );
      if (hod) {
        this.users.set(id, { ...user, hodUserId: hod.id });
        changed = true;
      }
    }
    return changed;
  }

  private buildDump(): Record<string, unknown> {
    return {
      schools: Array.from(this.schools.entries()),
      users: Array.from(this.users.entries()),
      userPasswords: Array.from(this.userPasswords.entries()),
      departments: Array.from(this.departments.entries()),
      phases: Array.from(this.phases.entries()),
      subjects: Array.from(this.subjects.entries()),
      grades: Array.from(this.grades.entries()),
      classes: Array.from(this.classes.entries()),
      curriculumMaps: Array.from(this.curriculumMaps.entries()),
      teachingAssignments: Array.from(this.teachingAssignments.entries()),
      hodPhaseAssignments: Array.from(this.hodPhaseAssignments.entries()),
      hodGradeAssignments: Array.from(this.hodGradeAssignments.entries()),
      academicAssignments: Array.from(this.academicAssignments.entries()),
      assessmentWorkspaces: Array.from(this.assessmentWorkspaces.entries()),
      knowledgeResources: Array.from(this.knowledgeResources.entries()),
      students: Array.from(this.students.entries()),
      studentMarks: Array.from(this.studentMarks.entries()),
      auditLogs: this.auditLogs,
      engagementSessions: Array.from(this.engagementSessions.entries()),
      userActions: Array.from(this.userActions.entries()),
    };
  }

  private applyDump(dump: any) {
    if (Array.isArray(dump.schools)) this.schools = new Map(dump.schools);
    if (Array.isArray(dump.users)) this.users = new Map(dump.users);
    if (Array.isArray(dump.userPasswords)) this.userPasswords = new Map(dump.userPasswords);
    if (Array.isArray(dump.departments)) this.departments = new Map(dump.departments);
    if (Array.isArray(dump.phases)) this.phases = new Map(dump.phases);
    if (Array.isArray(dump.subjects)) this.subjects = new Map(dump.subjects);
    if (Array.isArray(dump.grades)) this.grades = new Map(dump.grades);
    if (Array.isArray(dump.classes)) this.classes = new Map(dump.classes);
    if (Array.isArray(dump.curriculumMaps)) this.curriculumMaps = new Map(dump.curriculumMaps);
    if (Array.isArray(dump.teachingAssignments)) this.teachingAssignments = new Map(dump.teachingAssignments);
    if (Array.isArray(dump.hodPhaseAssignments)) this.hodPhaseAssignments = new Map(dump.hodPhaseAssignments);
    if (Array.isArray(dump.hodGradeAssignments)) this.hodGradeAssignments = new Map(dump.hodGradeAssignments);
    if (Array.isArray(dump.academicAssignments)) this.academicAssignments = new Map(dump.academicAssignments);
    if (Array.isArray(dump.assessmentWorkspaces)) this.assessmentWorkspaces = new Map(dump.assessmentWorkspaces);
    if (Array.isArray(dump.knowledgeResources)) this.knowledgeResources = new Map(dump.knowledgeResources);
    if (Array.isArray(dump.students)) this.students = new Map(dump.students);
    if (Array.isArray(dump.studentMarks)) this.studentMarks = new Map(dump.studentMarks);
    if (Array.isArray(dump.auditLogs)) this.auditLogs = dump.auditLogs;
    if (Array.isArray(dump.engagementSessions)) this.engagementSessions = new Map(dump.engagementSessions);
    if (Array.isArray(dump.userActions)) this.userActions = new Map(dump.userActions);
  }

  private saveToDisk() {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dbFilePath = path.join(dataDir, 'db.json');
      const dump = this.buildDump();
      fs.writeFileSync(dbFilePath, JSON.stringify(dump, null, 2), 'utf-8');
      if (this.remoteSave) {
        void this.remoteSave(dump).catch(err => console.error('[dbStore] Firestore persistence failed:', err));
      }
    } catch (err) {
      console.error('[dbStore] Failed to save database to disk:', err);
    }
  }

  private loadFromDisk(): boolean {
    try {
      const dbFilePath = path.join(process.cwd(), 'data', 'db.json');
      if (!fs.existsSync(dbFilePath)) return false;
      const raw = fs.readFileSync(dbFilePath, 'utf-8');
      if (!raw.trim()) return false;
      const dump = JSON.parse(raw);

      this.applyDump(dump);

      // Students are academic records, never login accounts. Remove legacy student users.
      for (const [id, user] of this.users.entries()) {
        if ((user.role as string) === 'STUDENT') {
          this.users.delete(id);
          this.userPasswords.delete(id);
        }
      }

      console.log(`[dbStore] Persistent database state restored: ${this.schools.size} schools, ${this.users.size} users, ${this.assessmentWorkspaces.size} assessment workspaces, ${this.knowledgeResources.size} knowledge hub resources.`);
      return true;
    } catch (err) {
      console.error('[dbStore] Load from disk failed:', err);
      return false;
    }
  }

  public async configureRemotePersistence(
    load: () => Promise<Record<string, unknown> | null>,
    save: (state: Record<string, unknown>) => Promise<void>
  ): Promise<boolean> {
    const remoteState = await load();
    if (remoteState && Array.isArray((remoteState as any).schools)) {
      this.applyDump(remoteState);
      console.log('[dbStore] Firestore platform state restored.');
    } else {
      await save(this.buildDump());
      console.log('[dbStore] Firestore platform state initialized from local seed data.');
    }
    this.remoteSave = save;
    return true;
  }

  private seedData() {
    // 1. Platform Super Admin
    const superAdmin: User = {
      id: 'usr-superadmin-01',
      schoolId: null, // Strictly null for Super Admin
      fullName: 'Dr. Arthur Pendelton',
      email: 'admin@platform.com',
      role: 'SUPER_ADMIN',
      status: 'Active',
      createdAt: '2026-01-01T08:00:00.000Z',
      lastLogin: new Date().toISOString(),
    };
    this.users.set(superAdmin.id, superAdmin);
    this.userPasswords.set(superAdmin.id, this.hashPassword('admin123'));

    // 2. Demo Primary School 1: Apex Primary School (SCH-1001)
    const school1: School = {
      id: 'SCH-1001',
      name: 'Apex Primary School',
      logo: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=200',
      motto: 'Excellence Through Innovation and Foundation Learning',
      type: 'Public',
      country: 'South Africa',
      province: 'Gauteng',
      address: '100 Education Way, Johannesburg, South Africa',
      postalAddress: 'P.O. Box 7812, Randburg, Johannesburg, 2125',
      phone: '+27 11 794 0912',
      email: 'info@apexprimary.edu.za',
      website: 'https://apexprimary.edu.za',
      emisNumber: '700100452',
      registrationNumber: 'REG-2026/APEX894',
      badge: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#1e3a8a', // Deep Blue
      secondaryColor: '#0d9488', // Teal
      academicYear: '2026',
      terms: '4 Terms',
      language: 'English',
      status: 'Active',
      isFirstLogin: false,
      createdAt: '2026-01-10T10:00:00.000Z',
    };
    this.schools.set(school1.id, school1);

    // School 1 Administrator
    const school1Admin: User = {
      id: 'usr-apex-admin-01',
      schoolId: 'SCH-1001',
      fullName: 'Eleanor Vance',
      email: 'admin@apexprimary.edu.za',
      role: 'SCHOOL_ADMIN',
      status: 'Active',
      createdAt: '2026-01-10T10:05:00.000Z',
      lastLogin: new Date().toISOString(),
    };
    this.users.set(school1Admin.id, school1Admin);
    this.userPasswords.set(school1Admin.id, this.hashPassword('apex123'));

    // School 1 Principal
    const school1Principal: User = {
      id: 'usr-apex-principal-01',
      schoolId: 'SCH-1001',
      fullName: 'Prof. Marcus Vance',
      email: 'principal@apexprimary.edu.za',
      role: 'PRINCIPAL',
      status: 'Active',
      createdAt: '2026-01-11T09:00:00.000Z',
    };
    this.users.set(school1Principal.id, school1Principal);
    this.userPasswords.set(school1Principal.id, this.hashPassword('apex123'));

    // School 1 Deputy Principal
    const school1Deputy: User = {
      id: 'usr-apex-deputy-01',
      schoolId: 'SCH-1001',
      fullName: 'Mr. Sipho Dlamini',
      email: 'deputy@apexprimary.edu.za',
      role: 'DEPUTY_PRINCIPAL',
      status: 'Active',
      createdAt: '2026-01-11T09:30:00.000Z',
    };
    this.users.set(school1Deputy.id, school1Deputy);
    this.userPasswords.set(school1Deputy.id, this.hashPassword('apex123'));

    // School 1 HOD (Sarah Jenkins)
    const school1Hod: User = {
      id: 'usr-apex-hod-01',
      schoolId: 'SCH-1001',
      fullName: 'Sarah Jenkins',
      email: 's.jenkins@apexprimary.edu.za',
      role: 'HOD',
      status: 'Active',
      createdAt: '2026-01-12T11:00:00.000Z',
    };
    this.users.set(school1Hod.id, school1Hod);
    this.userPasswords.set(school1Hod.id, this.hashPassword('apex123'));

    // School 1 Teachers (Mrs. Smith, Mr. Mthembu)
    const teacherSmith: User = {
      id: 'usr-apex-teacher-smith',
      schoolId: 'SCH-1001',
      fullName: 'Mrs. Mary Smith',
      email: 'm.smith@apexprimary.edu.za',
      role: 'TEACHER',
      status: 'Active',
      createdAt: '2026-01-12T11:30:00.000Z',
    };
    this.users.set(teacherSmith.id, teacherSmith);
    this.userPasswords.set(teacherSmith.id, this.hashPassword('apex123'));

    const teacherMthembu: User = {
      id: 'usr-apex-teacher-mthembu',
      schoolId: 'SCH-1001',
      fullName: 'Mr. Thabo Mthembu',
      email: 't.mthembu@apexprimary.edu.za',
      role: 'TEACHER',
      status: 'Active',
      createdAt: '2026-01-12T12:00:00.000Z',
    };
    this.users.set(teacherMthembu.id, teacherMthembu);
    this.userPasswords.set(teacherMthembu.id, this.hashPassword('apex123'));

    // Seed South African Primary School Structure for SCH-1001
    this.initializePrimarySchoolAcademicStructure('SCH-1001');

    // Assign HOD (Sarah Jenkins) to Foundation Phase & Intermediate Phase
    const phases = this.getPhases('SCH-1001');
    const fp = phases.find(p => p.code === 'FP');
    const ip = phases.find(p => p.code === 'IP');
    const sp = phases.find(p => p.code === 'SP');

    if (fp) {
      this.setHodPhaseAssignments('SCH-1001', school1Hod.id, [fp.id, ip ? ip.id : '']);
    }

    // Seed Teaching Assignments
    const grades = this.getGrades('SCH-1001');
    const classes = this.getClasses('SCH-1001');
    const subjects = this.getSubjects('SCH-1001');

    const gr2 = grades.find(g => g.name === 'Grade 2');
    const gr3 = grades.find(g => g.name === 'Grade 3');
    const gr4 = grades.find(g => g.name === 'Grade 4');
    const gr7 = grades.find(g => g.name === 'Grade 7');

    const cls2a = classes.find(c => c.gradeId === gr2?.id);
    const cls3a = classes.find(c => c.gradeId === gr3?.id);
    const cls4a = classes.find(c => c.gradeId === gr4?.id);
    const cls7a = classes.find(c => c.gradeId === gr7?.id);

    const mathFP = subjects.find(s => s.phaseId === fp?.id && s.name.includes('Mathematics'));
    const lsFP = subjects.find(s => s.phaseId === fp?.id && s.name.includes('Life Skills'));
    const mathIP = subjects.find(s => s.phaseId === ip?.id && s.name.includes('Mathematics'));
    const nsSP = subjects.find(s => s.phaseId === sp?.id && s.name.includes('Natural Sciences'));
    const techSP = subjects.find(s => s.phaseId === sp?.id && s.name.includes('Technology'));

    // HOD Grade Allocations
    if (gr2 && gr3 && gr4) {
      this.setHodGradeAssignments('SCH-1001', school1Hod.id, [gr2.id, gr3.id, gr4.id]);
    }

    // Teacher Academic Assignments
    if (gr2 && mathFP) {
      this.createAcademicAssignment('SCH-1001', {
        userId: teacherSmith.id,
        userName: teacherSmith.fullName,
        role: 'TEACHER',
        gradeId: gr2.id,
        gradeName: gr2.name,
        subjectId: mathFP.id,
        subjectName: mathFP.name,
        academicYear: '2026',
        status: 'Active',
      });
    }
    if (gr4 && mathIP) {
      this.createAcademicAssignment('SCH-1001', {
        userId: teacherSmith.id,
        userName: teacherSmith.fullName,
        role: 'TEACHER',
        gradeId: gr4.id,
        gradeName: gr4.name,
        subjectId: mathIP.id,
        subjectName: mathIP.name,
        academicYear: '2026',
        status: 'Active',
      });
    }

    if (gr2 && cls2a && mathFP && fp) {
      this.createTeachingAssignment('SCH-1001', {
        teacherUserId: teacherSmith.id,
        phaseId: fp.id,
        gradeId: gr2.id,
        classId: cls2a.id,
        subjectId: mathFP.id,
        academicYear: '2026',
      });
    }
    if (gr3 && cls3a && lsFP && fp) {
      this.createTeachingAssignment('SCH-1001', {
        teacherUserId: teacherSmith.id,
        phaseId: fp.id,
        gradeId: gr3.id,
        classId: cls3a.id,
        subjectId: lsFP.id,
        academicYear: '2026',
      });
    }
    if (gr4 && cls4a && mathIP && ip) {
      this.createTeachingAssignment('SCH-1001', {
        teacherUserId: teacherSmith.id,
        phaseId: ip.id,
        gradeId: gr4.id,
        classId: cls4a.id,
        subjectId: mathIP.id,
        academicYear: '2026',
      });
    }

    if (gr7 && cls7a && nsSP && sp) {
      this.createTeachingAssignment('SCH-1001', {
        teacherUserId: teacherMthembu.id,
        phaseId: sp.id,
        gradeId: gr7.id,
        classId: cls7a.id,
        subjectId: nsSP.id,
        academicYear: '2026',
      });
    }

    if (gr7 && cls7a && techSP && sp) {
      this.createTeachingAssignment('SCH-1001', {
        teacherUserId: teacherMthembu.id,
        phaseId: sp.id,
        gradeId: gr7.id,
        classId: cls7a.id,
        subjectId: techSP.id,
        academicYear: '2026',
      });
    }

    const seedRoster = (gradeId: string | undefined, classId: string | undefined, names: string[]) => {
      if (!gradeId || !classId) return;
      names.forEach((fullName, index) => this.createStudent('SCH-1001', {
        admissionNumber: `APX-${gradeId.slice(-4).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
        fullName,
        gradeId,
        classId,
        status: 'Active',
      }));
    };
    seedRoster(gr2?.id, cls2a?.id, ['Lerato Dube', 'Amara Nkosi', 'Thando Mokoena', 'Naledi Khumalo']);
    seedRoster(gr3?.id, cls3a?.id, ['Sipho Ndlovu', 'Mia Jacobs', 'Ayanda Cele']);
    seedRoster(gr4?.id, cls4a?.id, ['Kagiso Molefe', 'Zoe Daniels', 'Lethabo Maseko']);
    seedRoster(gr7?.id, cls7a?.id, ['Neo Modise', 'Ava Naidoo', 'Tshepo Mhlongo', 'Emma Botha']);

    // Seed Sample Assessment Workspaces
    if (fp && gr2 && mathFP) {
      this.createAssessmentWorkspace('SCH-1001', {
        phaseId: fp.id,
        gradeId: gr2.id,
        subjectId: mathFP.id,
        term: 'Term 1',
        title: 'Grade 2 Mathematics Term 1 Baseline Assessment',
        status: 'Submitted',
        teacherUserId: teacherSmith.id,
      });
    }

    if (ip && gr4 && mathIP) {
      this.createAssessmentWorkspace('SCH-1001', {
        phaseId: ip.id,
        gradeId: gr4.id,
        subjectId: mathIP.id,
        term: 'Term 1',
        title: 'Grade 4 Mathematics Term 1 Practical Task',
        status: 'Approved',
        teacherUserId: teacherSmith.id,
        hodUserId: school1Hod.id,
      });
    }

    // 3. Demo Primary School 2: St. Jude Primary (SCH-1002)
    const school2: School = {
      id: 'SCH-1002',
      name: 'St. Jude Primary School',
      logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=200',
      motto: 'Faith, Integrity, and Primary Academic Valor',
      type: 'Private',
      country: 'South Africa',
      province: 'Gauteng',
      address: '42 Heritage Way, Johannesburg',
      postalAddress: 'Private Bag X104, Rosebank, Johannesburg, 2196',
      phone: '+27 11 555 0199',
      email: 'info@stjudeprimary.edu.za',
      website: 'https://stjudeprimary.edu.za',
      emisNumber: '700200911',
      registrationNumber: 'REG-2026/STJ312',
      badge: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#7c3aed', // Purple
      secondaryColor: '#ea580c', // Orange
      academicYear: '2026',
      terms: '4 Terms',
      language: 'English',
      status: 'Active',
      isFirstLogin: false,
      createdAt: '2026-02-01T09:00:00.000Z',
    };
    this.schools.set(school2.id, school2);

    const school2Admin: User = {
      id: 'usr-stjude-admin-01',
      schoolId: 'SCH-1002',
      fullName: 'David Mokoena',
      email: 'admin@stjudeprimary.edu.za',
      role: 'SCHOOL_ADMIN',
      status: 'Active',
      createdAt: '2026-02-01T09:05:00.000Z',
      lastLogin: new Date().toISOString(),
    };
    this.users.set(school2Admin.id, school2Admin);
    this.userPasswords.set(school2Admin.id, this.hashPassword('stjude123'));

    this.initializePrimarySchoolAcademicStructure('SCH-1002');

    // Audit logs
    this.addAuditLog(null, superAdmin, 'PLATFORM_INITIALIZATION', 'Platform database initialized with multi-tenant South African primary school academic structures.');
    this.addAuditLog('SCH-1001', school1Admin, 'SCHOOL_REGISTERED', 'Apex Primary School registered with 3 Academic Phases (FP, IP, SP) and Curriculum Mapping.');
    this.addAuditLog('SCH-1002', school2Admin, 'SCHOOL_REGISTERED', 'St. Jude Primary School registered with default CAPS Curriculum Mapping.');
  }

  // --- AUTOMATIC SOUTH AFRICAN PRIMARY SCHOOL INITIALIZATION ---
  public initializePrimarySchoolAcademicStructure(schoolId: string) {
    // 1. Create Non-Removable Academic Phases
    const fpPhase: AcademicPhase = {
      id: `phase-${schoolId}-fp`,
      schoolId,
      name: 'Foundation Phase',
      code: 'FP',
      description: 'Grades R to 3: Foundational literacy, numeracy, and life skills',
      isSystemDefault: true,
    };
    const ipPhase: AcademicPhase = {
      id: `phase-${schoolId}-ip`,
      schoolId,
      name: 'Intermediate Phase',
      code: 'IP',
      description: 'Grades 4 to 6: Expanded core subjects and conceptual learning',
      isSystemDefault: true,
    };
    const spPhase: AcademicPhase = {
      id: `phase-${schoolId}-sp`,
      schoolId,
      name: 'Senior Phase',
      code: 'SP',
      description: 'Grade 7: Advanced primary subjects preparing for secondary education',
      isSystemDefault: true,
    };

    this.phases.set(fpPhase.id, fpPhase);
    this.phases.set(ipPhase.id, ipPhase);
    this.phases.set(spPhase.id, spPhase);

    // 2. Default Primary School Grades (Grade R to Grade 7)
    const defaultGradeConfigs = [
      { name: 'Grade R', code: 'GR-R', order: 0, phaseId: fpPhase.id },
      { name: 'Grade 1', code: 'GR-1', order: 1, phaseId: fpPhase.id },
      { name: 'Grade 2', code: 'GR-2', order: 2, phaseId: fpPhase.id },
      { name: 'Grade 3', code: 'GR-3', order: 3, phaseId: fpPhase.id },
      { name: 'Grade 4', code: 'GR-4', order: 4, phaseId: ipPhase.id },
      { name: 'Grade 5', code: 'GR-5', order: 5, phaseId: ipPhase.id },
      { name: 'Grade 6', code: 'GR-6', order: 6, phaseId: ipPhase.id },
      { name: 'Grade 7', code: 'GR-7', order: 7, phaseId: spPhase.id },
    ];

    const createdGrades: Grade[] = [];
    for (const gc of defaultGradeConfigs) {
      const gId = `grd-${schoolId}-${gc.code.toLowerCase()}`;
      const gradeObj: Grade = {
        id: gId,
        schoolId,
        phaseId: gc.phaseId,
        name: gc.name,
        code: gc.code,
        order: gc.order,
        isArchived: false,
      };
      this.grades.set(gId, gradeObj);
      createdGrades.push(gradeObj);

      // Create default Class section (e.g., Grade 1A)
      const cId = `cls-${schoolId}-${gc.code.toLowerCase()}-a`;
      const classObj: SchoolClass = {
        id: cId,
        schoolId,
        gradeId: gId,
        name: `${gc.name}A`,
      };
      this.classes.set(cId, classObj);
    }

    // 3. Default South African Primary School Subjects per Phase
    const defaultSubjectsMap = [
      // Foundation Phase Subjects
      { phaseId: fpPhase.id, name: 'Home Language', code: 'HL-FP' },
      { phaseId: fpPhase.id, name: 'First Additional Language', code: 'FAL-FP' },
      { phaseId: fpPhase.id, name: 'Mathematics', code: 'MATH-FP' },
      { phaseId: fpPhase.id, name: 'Life Skills', code: 'LS-FP' },

      // Intermediate Phase Subjects
      { phaseId: ipPhase.id, name: 'Home Language', code: 'HL-IP' },
      { phaseId: ipPhase.id, name: 'First Additional Language', code: 'FAL-IP' },
      { phaseId: ipPhase.id, name: 'Mathematics', code: 'MATH-IP' },
      { phaseId: ipPhase.id, name: 'Natural Sciences & Technology', code: 'NST-IP' },
      { phaseId: ipPhase.id, name: 'Social Sciences', code: 'SS-IP' },
      { phaseId: ipPhase.id, name: 'Life Skills', code: 'LS-IP' },
      { phaseId: ipPhase.id, name: 'Creative Arts', code: 'CA-IP' },

      // Senior Phase Subjects (Grade 7)
      { phaseId: spPhase.id, name: 'Home Language', code: 'HL-SP' },
      { phaseId: spPhase.id, name: 'First Additional Language', code: 'FAL-SP' },
      { phaseId: spPhase.id, name: 'Mathematics', code: 'MATH-SP' },
      { phaseId: spPhase.id, name: 'Natural Sciences', code: 'NS-SP' },
      { phaseId: spPhase.id, name: 'Technology', code: 'TECH-SP' },
      { phaseId: spPhase.id, name: 'Social Sciences', code: 'SS-SP' },
      { phaseId: spPhase.id, name: 'Creative Arts', code: 'CA-SP' },
      { phaseId: spPhase.id, name: 'Economic and Management Sciences (EMS)', code: 'EMS-SP' },
      { phaseId: spPhase.id, name: 'Life Orientation', code: 'LO-SP' },
    ];

    for (const subConfig of defaultSubjectsMap) {
      const sId = `subj-${schoolId}-${subConfig.code.toLowerCase()}`;
      const subjectObj: Subject = {
        id: sId,
        schoolId,
        phaseId: subConfig.phaseId,
        name: subConfig.name,
        code: subConfig.code,
        isCustom: false,
        isArchived: false,
      };
      this.subjects.set(sId, subjectObj);

      // 4. Curriculum Mapping (Links Phase + Subject -> Relevant Grades in Phase)
      const phaseGrades = createdGrades.filter(g => g.phaseId === subConfig.phaseId);
      for (const gradeItem of phaseGrades) {
        // Special rule: FAL in Foundation Phase usually starts Grade 1, but we map according to curriculum rules
        if (subConfig.code === 'FAL-FP' && gradeItem.name === 'Grade R') {
          continue; // FAL typically starts Grade 1
        }
        const cmId = `cm-${schoolId}-${subConfig.code.toLowerCase()}-${gradeItem.code.toLowerCase()}`;
        this.curriculumMaps.set(cmId, {
          id: cmId,
          schoolId,
          phaseId: subConfig.phaseId,
          gradeId: gradeItem.id,
          subjectId: sId,
        });
      }
    }
  }

  // --- SCHOOL MANAGEMENT ---
  public getSchools(): School[] {
    return Array.from(this.schools.values());
  }

  public getSchoolById(schoolId: string): School | undefined {
    return this.schools.get(schoolId);
  }

  public createSchool(schoolData: Omit<School, 'id' | 'createdAt'>): School {
    const id = `SCH-${Math.floor(100000 + Math.random() * 900000)}`;
    const year = new Date().getFullYear();
    const registrationNumber = schoolData.registrationNumber || `SCH-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newSchool: School = {
      ...schoolData,
      id,
      registrationNumber,
      createdAt: new Date().toISOString(),
    };
    this.schools.set(id, newSchool);
    this.saveToDisk();
    return newSchool;
  }

  public toggleSchoolStatus(schoolId: string, status: 'Active' | 'Disabled', actorUser?: User): School {
    const school = this.schools.get(schoolId);
    if (!school) throw new Error('School not found');
    school.status = status as any;
    if (actorUser) {
      this.addAuditLog(
        schoolId,
        actorUser,
        status === 'Disabled' ? 'SCHOOL_DISABLED' : 'SCHOOL_ACTIVATED',
        `School "${school.name}" status updated to ${status} by ${actorUser.fullName}.`
      );
    }
    this.saveToDisk();
    return school;
  }

  public updateSchool(schoolId: string, updates: Partial<School>): School | undefined {
    const school = this.schools.get(schoolId);
    if (!school) return undefined;
    const updated = { ...school, ...updates };
    this.schools.set(schoolId, updated);
    this.saveToDisk();
    return updated;
  }

  // --- USER MANAGEMENT (ISOLATED BY SCHOOL) ---
  public getUsers(schoolId: string | null): User[] {
    if (schoolId === null) {
      // Platform Super Admin view
      return Array.from(this.users.values());
    }
    // Strict school_id filter
    return Array.from(this.users.values()).filter(u => u.schoolId === schoolId);
  }

  public getUserByEmail(email: string): { user: User; passwordHash: string } | undefined {
    const cleanEmail = email.toLowerCase().trim();
    console.log(`[dbStore.getUserByEmail] Looking up user for email: "${cleanEmail}"`);

    let user = Array.from(this.users.values()).find(u => u.email.toLowerCase() === cleanEmail);

    // Alias fallbacks for short demo domain formats and variations
    if (!user) {
      const [localPart, domainPart] = cleanEmail.split('@');
      const allUsers = Array.from(this.users.values());

      if (cleanEmail === 'admin@apex.edu' || cleanEmail === 'admin@apex.com') {
        user = allUsers.find(u => u.email === 'admin@apexprimary.edu.za');
      } else if (cleanEmail === 'principal@apex.edu' || cleanEmail === 'principal@apex.com') {
        user = allUsers.find(u => u.email === 'principal@apexprimary.edu.za');
      } else if (cleanEmail.includes('smith') && (domainPart?.includes('apex') || domainPart === 'apex.edu')) {
        user = allUsers.find(u => u.email === 'm.smith@apexprimary.edu.za');
      } else if (cleanEmail === 'admin@stjude.edu' || cleanEmail === 'admin@stjude.com') {
        user = allUsers.find(u => u.email === 'admin@stjudeprimary.edu.za');
      } else if (localPart === 'admin' && (domainPart === 'platform.com' || domainPart === 'platform' || !domainPart)) {
        user = allUsers.find(u => u.role === 'SUPER_ADMIN');
      } else if (domainPart && (domainPart.includes('apex') || domainPart.includes('primary'))) {
        user = allUsers.find(u => u.schoolId === 'SCH-1001' && (u.email.toLowerCase().startsWith(localPart) || u.email.toLowerCase().includes(localPart)));
      } else if (domainPart && domainPart.includes('stjude')) {
        user = allUsers.find(u => u.schoolId === 'SCH-1002' && (u.email.toLowerCase().startsWith(localPart) || u.email.toLowerCase().includes(localPart)));
      }
    }

    if (!user) return undefined;

    const passwordHash = this.userPasswords.get(user.id) || '';
    console.log(`[dbStore.getUserByEmail] User found/provisioned: ${user.fullName} (${user.email}) [Role: ${user.role}]`);
    return { user, passwordHash };
  }

  public verifyPassword(user: User, inputPassword: string, storedPasswordHash: string): boolean {
    const cleanInput = inputPassword.trim();
    const cleanStored = storedPasswordHash.trim();

    console.log(`[dbStore.verifyPassword] Checking password for user ${user.email}. Input length: ${cleanInput.length}`);

    if (cleanStored.startsWith('scrypt$')) {
      const [, salt, expectedHex] = cleanStored.split('$');
      if (!salt || !expectedHex) return false;
      const actual = scryptSync(cleanInput, salt, 64);
      const expected = Buffer.from(expectedHex, 'hex');
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    }

    // One-time migration for legacy local test data that stored plaintext.
    if (cleanInput === cleanStored) {
      this.userPasswords.set(user.id, this.hashPassword(cleanInput));
      this.saveToDisk();
      return true;
    }

    return false;
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt'>, password: string): User {
    const duplicate = Array.from(this.users.values()).some(
      user => user.email.toLowerCase().trim() === userData.email.toLowerCase().trim()
    );
    if (duplicate) throw new Error('An account with this email address already exists.');
    const id = `usr-${Math.random().toString(36).substring(2, 9)}`;
    const newUser: User = {
      ...userData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, newUser);
    this.userPasswords.set(id, this.hashPassword(password));
    this.saveToDisk();
    return newUser;
  }

  public updateUser(userId: string, schoolId: string | null, updates: Partial<User>): User | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;
    // Security check: ensure non-superadmin users only update users in their own school
    if (schoolId !== null && user.schoolId !== schoolId) {
      throw new Error('Access denied: Cannot modify user belonging to another school');
    }
    const updated = { ...user, ...updates };
    this.users.set(userId, updated);
    this.saveToDisk();
    return updated;
  }

  public updateUserCredentials(
    userId: string,
    schoolId: string | null,
    updates: Partial<User>,
    password?: string
  ): User {
    const current = this.users.get(userId);
    if (!current) throw new Error('User not found.');
    if (schoolId !== null && current.schoolId !== schoolId) {
      throw new Error('Access denied: Cannot modify user belonging to another school');
    }
    const nextEmail = String(updates.email || current.email).trim().toLowerCase();
    const duplicate = Array.from(this.users.values()).some(user =>
      user.id !== userId && user.email.trim().toLowerCase() === nextEmail
    );
    if (duplicate) throw new Error('An account with this email address already exists.');
    const updated: User = {
      ...current,
      ...updates,
      id: current.id,
      schoolId: current.schoolId,
      email: nextEmail,
    };
    this.users.set(userId, updated);
    if (password) this.userPasswords.set(userId, this.hashPassword(password));
    this.saveToDisk();
    return updated;
  }

  public replaceHod(schoolId: string, outgoingHodUserId: string, replacementHodUserId: string) {
    if (outgoingHodUserId === replacementHodUserId) throw new Error('Choose a different replacement HOD.');
    const outgoing = this.users.get(outgoingHodUserId);
    const replacement = this.users.get(replacementHodUserId);
    if (!outgoing || outgoing.schoolId !== schoolId) throw new Error('Outgoing HOD was not found.');
    if (!replacement || replacement.schoolId !== schoolId) throw new Error('Replacement HOD was not found.');
    const replacementRoles = replacement.roles?.length ? replacement.roles : [replacement.role];
    if (!replacementRoles.includes('HOD')) throw new Error('The replacement user must have the HOD role.');

    let teachersTransferred = 0;
    for (const [id, user] of this.users.entries()) {
      if (user.schoolId === schoolId && user.hodUserId === outgoingHodUserId) {
        this.users.set(id, { ...user, hodUserId: replacementHodUserId });
        teachersTransferred += 1;
      }
    }
    for (const [id, department] of this.departments.entries()) {
      if (department.schoolId === schoolId && department.hodUserId === outgoingHodUserId) {
        this.departments.set(id, { ...department, hodUserId: replacementHodUserId });
      }
    }
    for (const [id, workspace] of this.assessmentWorkspaces.entries()) {
      if (workspace.schoolId === schoolId && workspace.hodUserId === outgoingHodUserId) {
        this.assessmentWorkspaces.set(id, { ...workspace, hodUserId: replacementHodUserId });
      }
    }
    for (const [id, assignment] of this.hodGradeAssignments.entries()) {
      if (assignment.schoolId === schoolId && assignment.hodUserId === outgoingHodUserId) {
        this.hodGradeAssignments.delete(id);
        const replacementId = `hga-${schoolId}-${replacementHodUserId}-${assignment.gradeId}`;
        this.hodGradeAssignments.set(replacementId, { ...assignment, id: replacementId, hodUserId: replacementHodUserId });
      }
    }
    for (const [id, assignment] of this.hodPhaseAssignments.entries()) {
      if (assignment.schoolId === schoolId && assignment.hodUserId === outgoingHodUserId) {
        this.hodPhaseAssignments.delete(id);
        const replacementId = `hpa-${schoolId}-${replacementHodUserId}-${assignment.phaseId}`;
        this.hodPhaseAssignments.set(replacementId, { ...assignment, id: replacementId, hodUserId: replacementHodUserId });
      }
    }
    for (const [id, assignment] of this.academicAssignments.entries()) {
      if (assignment.schoolId === schoolId && assignment.role === 'HOD' && assignment.userId === outgoingHodUserId) {
        this.academicAssignments.set(id, {
          ...assignment,
          userId: replacementHodUserId,
          userName: replacement.fullName,
        });
      }
    }
    this.saveToDisk();
    return { outgoing, replacement, teachersTransferred };
  }

  // --- ACADEMIC PHASES (FOUNDATION, INTERMEDIATE, SENIOR) ---
  public getPhases(schoolId: string): AcademicPhase[] {
    const schoolPhases = Array.from(this.phases.values()).filter(p => p.schoolId === schoolId);
    if (schoolPhases.length === 0) {
      this.initializePrimarySchoolAcademicStructure(schoolId);
      return Array.from(this.phases.values()).filter(p => p.schoolId === schoolId);
    }
    return schoolPhases;
  }

  // --- DEPARTMENTS (ISOLATED BY SCHOOL) ---
  public getDepartments(schoolId: string): Department[] {
    return Array.from(this.departments.values()).filter(d => d.schoolId === schoolId);
  }

  public createDepartment(deptData: Omit<Department, 'id'>): Department {
    const id = `dept-${deptData.schoolId}-${Math.random().toString(36).substring(2, 7)}`;
    const dept: Department = { ...deptData, id };
    this.departments.set(id, dept);
    this.saveToDisk();
    return dept;
  }

  // --- SUBJECTS (CURRICULUM MAPPING READY) ---
  public getSubjects(schoolId: string, phaseId?: string, includeArchived = false): Subject[] {
    return Array.from(this.subjects.values()).filter(s => {
      if (s.schoolId !== schoolId) return false;
      if (phaseId && s.phaseId !== phaseId) return false;
      if (!includeArchived && s.isArchived) return false;
      return true;
    });
  }

  public createSubject(subjectData: Omit<Subject, 'id'>): Subject {
    const id = `subj-${subjectData.schoolId}-${Math.random().toString(36).substring(2, 7)}`;
    const subject: Subject = {
      ...subjectData,
      id,
      isCustom: subjectData.isCustom ?? true,
      isArchived: false,
    };
    this.subjects.set(id, subject);

    // Auto-map custom subject to all grades in its assigned phase
    const grades = this.getGrades(subjectData.schoolId, true).filter(g => g.phaseId === subjectData.phaseId);
    for (const g of grades) {
      const cmId = `cm-${subjectData.schoolId}-${subject.code.toLowerCase()}-${g.code.toLowerCase()}`;
      if (!this.curriculumMaps.has(cmId)) {
        this.curriculumMaps.set(cmId, {
          id: cmId,
          schoolId: subjectData.schoolId,
          phaseId: subjectData.phaseId,
          gradeId: g.id,
          subjectId: id,
        });
      }
    }

    this.saveToDisk();
    return subject;
  }

  public updateSubject(schoolId: string, subjectId: string, updates: Partial<Subject>): Subject {
    const existing = this.subjects.get(subjectId);
    if (!existing || existing.schoolId !== schoolId) {
      throw new Error('Subject not found for this school');
    }
    const updated = { ...existing, ...updates };
    this.subjects.set(subjectId, updated);
    this.saveToDisk();
    return updated;
  }

  public archiveSubject(schoolId: string, subjectId: string): Subject {
    return this.updateSubject(schoolId, subjectId, { isArchived: true });
  }

  public restoreSubject(schoolId: string, subjectId: string): Subject {
    return this.updateSubject(schoolId, subjectId, { isArchived: false });
  }

  public deleteSubject(schoolId: string, subjectId: string): boolean {
    const existing = this.subjects.get(subjectId);
    if (!existing || existing.schoolId !== schoolId) return false;

    // Check if historical teaching assignments or assessments exist
    const assignments = Array.from(this.teachingAssignments.values()).filter(ta => ta.schoolId === schoolId && ta.subjectId === subjectId);
    const assessments = Array.from(this.assessmentWorkspaces.values()).filter(aw => aw.schoolId === schoolId && aw.subjectId === subjectId);

    if (assignments.length > 0 || assessments.length > 0) {
      // Rule: Archive instead of permanent deletion if historical data exists
      this.archiveSubject(schoolId, subjectId);
      return true;
    }

    // Delete curriculum maps
    for (const [cmId, cm] of this.curriculumMaps.entries()) {
      if (cm.schoolId === schoolId && cm.subjectId === subjectId) {
        this.curriculumMaps.delete(cmId);
      }
    }

    this.subjects.delete(subjectId);
    this.saveToDisk();
    return true;
  }

  // --- GRADES & CLASSES (FOUNDATION, INTERMEDIATE, SENIOR) ---
  public getGrades(schoolId: string, includeArchived = false): Grade[] {
    const list = Array.from(this.grades.values()).filter(g => {
      if (g.schoolId !== schoolId) return false;
      if (!includeArchived && g.isArchived) return false;
      return true;
    });
    return list.sort((a, b) => a.order - b.order);
  }

  public createGrade(gradeData: { schoolId: string; phaseId: string; name: string; code?: string }): Grade {
    const existingGrades = this.getGrades(gradeData.schoolId, true);
    const order = existingGrades.length;
    const code = gradeData.code || `GR-${gradeData.name.replace(/[^a-zA-Z0-9]/g, '')}`;
    const id = `grd-${gradeData.schoolId}-${code.toLowerCase()}-${Math.random().toString(36).substring(2, 5)}`;

    const grade: Grade = {
      id,
      schoolId: gradeData.schoolId,
      phaseId: gradeData.phaseId,
      name: gradeData.name,
      code,
      order,
      isArchived: false,
    };
    this.grades.set(id, grade);

    // Automatically create section A
    const classId = `cls-${gradeData.schoolId}-${code.toLowerCase()}-a`;
    this.classes.set(classId, {
      id: classId,
      schoolId: gradeData.schoolId,
      gradeId: id,
      name: `${gradeData.name}A`,
    });

    // Auto-map existing subjects in this phase to the new grade
    const phaseSubjects = this.getSubjects(gradeData.schoolId, gradeData.phaseId);
    for (const sub of phaseSubjects) {
      const cmId = `cm-${gradeData.schoolId}-${sub.code.toLowerCase()}-${code.toLowerCase()}`;
      this.curriculumMaps.set(cmId, {
        id: cmId,
        schoolId: gradeData.schoolId,
        phaseId: gradeData.phaseId,
        gradeId: id,
        subjectId: sub.id,
      });
    }

    this.saveToDisk();
    return grade;
  }

  public updateGrade(schoolId: string, gradeId: string, updates: Partial<Grade>): Grade {
    const existing = this.grades.get(gradeId);
    if (!existing || existing.schoolId !== schoolId) {
      throw new Error('Grade not found for this school');
    }
    const updated = { ...existing, ...updates };
    this.grades.set(gradeId, updated);
    this.saveToDisk();
    return updated;
  }

  public archiveGrade(schoolId: string, gradeId: string): Grade {
    return this.updateGrade(schoolId, gradeId, { isArchived: true });
  }

  public restoreGrade(schoolId: string, gradeId: string): Grade {
    return this.updateGrade(schoolId, gradeId, { isArchived: false });
  }

  public getClasses(schoolId: string): SchoolClass[] {
    return Array.from(this.classes.values()).filter(c => c.schoolId === schoolId);
  }

  public createClass(classData: Omit<SchoolClass, 'id'>): SchoolClass {
    const id = `cls-${classData.schoolId}-${Math.random().toString(36).substring(2, 7)}`;
    const cls: SchoolClass = { ...classData, id };
    this.classes.set(id, cls);
    this.saveToDisk();
    return cls;
  }

  // --- CURRICULUM MAPPING ---
  public getCurriculumMaps(schoolId: string): CurriculumMap[] {
    return Array.from(this.curriculumMaps.values()).filter(cm => cm.schoolId === schoolId);
  }

  public toggleGradeForSubject(schoolId: string, phaseId: string, subjectId: string, gradeId: string): boolean {
    const maps = this.getCurriculumMaps(schoolId);
    const existing = maps.find(m => m.subjectId === subjectId && m.gradeId === gradeId);

    let res = false;
    if (existing) {
      this.curriculumMaps.delete(existing.id);
      res = false; // unmapped
    } else {
      const id = `cm-${schoolId}-${Math.random().toString(36).substring(2, 8)}`;
      this.curriculumMaps.set(id, { id, schoolId, phaseId, gradeId, subjectId });
      res = true; // mapped
    }
    this.saveToDisk();
    return res;
  }

  // --- TEACHING ASSIGNMENTS ---
  public getTeachingAssignments(schoolId: string, teacherUserId?: string): TeachingAssignment[] {
    const usersMap = this.users;
    const phasesMap = this.phases;
    const gradesMap = this.grades;
    const classesMap = this.classes;
    const subjectsMap = this.subjects;

    const list = Array.from(this.teachingAssignments.values()).filter(ta => {
      if (ta.schoolId !== schoolId) return false;
      if (teacherUserId && ta.teacherUserId !== teacherUserId) return false;
      return true;
    });

    return list.map(ta => ({
      ...ta,
      teacherName: usersMap.get(ta.teacherUserId)?.fullName || 'Assigned Teacher',
      phaseName: phasesMap.get(ta.phaseId)?.name || 'Phase',
      gradeName: gradesMap.get(ta.gradeId)?.name || 'Grade',
      className: classesMap.get(ta.classId)?.name || 'Class Section',
      subjectName: subjectsMap.get(ta.subjectId)?.name || 'Subject',
    }));
  }

  public createTeachingAssignment(
    schoolId: string,
    payload: Omit<TeachingAssignment, 'id' | 'schoolId' | 'teacherName' | 'phaseName' | 'gradeName' | 'className' | 'subjectName'>
  ): TeachingAssignment {
    const id = `ta-${schoolId}-${Math.random().toString(36).substring(2, 8)}`;
    const assignment: TeachingAssignment = {
      ...payload,
      id,
      schoolId,
    };
    this.teachingAssignments.set(id, assignment);
    this.saveToDisk();
    return assignment;
  }

  public deleteTeachingAssignment(schoolId: string, assignmentId: string): boolean {
    const existing = this.teachingAssignments.get(assignmentId);
    if (!existing || existing.schoolId !== schoolId) return false;
    this.teachingAssignments.delete(assignmentId);
    this.saveToDisk();
    return true;
  }

  // --- HOD GRADE ASSIGNMENTS & ACADEMIC ASSIGNMENTS ---
  public getHodGradeAssignments(schoolId: string, hodUserId?: string): HodGradeAssignment[] {
    return Array.from(this.hodGradeAssignments.values()).filter(hga => {
      if (hga.schoolId !== schoolId) return false;
      if (hodUserId && hga.hodUserId !== hodUserId) return false;
      return true;
    });
  }

  public setHodGradeAssignments(schoolId: string, hodUserId: string, gradeIds: string[]): HodGradeAssignment[] {
    // Clear old grade assignments for this HOD
    for (const [id, hga] of this.hodGradeAssignments.entries()) {
      if (hga.schoolId === schoolId && hga.hodUserId === hodUserId) {
        this.hodGradeAssignments.delete(id);
      }
    }

    const created: HodGradeAssignment[] = [];
    const hodUser = this.users.get(hodUserId);

    for (const gradeId of gradeIds) {
      if (!gradeId) continue;
      const id = `hga-${schoolId}-${hodUserId}-${gradeId}`;
      const obj: HodGradeAssignment = { id, schoolId, hodUserId, gradeId };
      this.hodGradeAssignments.set(id, obj);
      created.push(obj);

      // Also mirror in academicAssignments map for flexible unified queries
      const aaId = `aa-${schoolId}-${hodUserId}-${gradeId}`;
      const gr = this.grades.get(gradeId);
      this.academicAssignments.set(aaId, {
        id: aaId,
        schoolId,
        userId: hodUserId,
        userName: hodUser?.fullName || 'Departmental Head',
        role: 'HOD',
        gradeId,
        gradeName: gr?.name || 'Grade',
        subjectId: 'ALL',
        subjectName: 'All Subjects',
        academicYear: '2026',
        status: 'Active',
        createdAt: new Date().toISOString(),
      });
    }
    this.saveToDisk();
    return created;
  }

  public getAcademicAssignments(
    schoolId: string,
    userId?: string,
    role?: string,
    gradeId?: string
  ): AcademicAssignment[] {
    const gradesMap = this.grades;
    const subjectsMap = this.subjects;
    const usersMap = this.users;

    return Array.from(this.academicAssignments.values())
      .filter(aa => {
        if (aa.schoolId !== schoolId) return false;
        if (userId && aa.userId !== userId) return false;
        if (role && aa.role !== role) return false;
        if (gradeId && aa.gradeId !== gradeId) return false;
        return true;
      })
      .map(aa => ({
        ...aa,
        userName: aa.userName || usersMap.get(aa.userId)?.fullName || 'Staff Member',
        gradeName: aa.gradeName || gradesMap.get(aa.gradeId)?.name || 'Grade',
        subjectName: aa.subjectName || (aa.subjectId === 'ALL' ? 'All Subjects' : (aa.subjectId ? subjectsMap.get(aa.subjectId)?.name : undefined)),
      }));
  }

  public createAcademicAssignment(
    schoolId: string,
    assignment: Omit<AcademicAssignment, 'id' | 'schoolId' | 'createdAt'>
  ): AcademicAssignment {
    const id = `aa-${schoolId}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const gr = this.grades.get(assignment.gradeId);
    const sub = assignment.subjectId ? this.subjects.get(assignment.subjectId) : undefined;
    const usr = this.users.get(assignment.userId);

    const newObj: AcademicAssignment = {
      ...assignment,
      id,
      schoolId,
      userName: assignment.userName || usr?.fullName,
      gradeName: assignment.gradeName || gr?.name,
      subjectName: assignment.subjectName || (assignment.subjectId === 'ALL' ? 'All Subjects' : sub?.name),
      createdAt: now,
    };
    this.academicAssignments.set(id, newObj);

    // If role is HOD, also register in hodGradeAssignments for backward compatibility
    if (assignment.role === 'HOD' && assignment.gradeId) {
      const hgaId = `hga-${schoolId}-${assignment.userId}-${assignment.gradeId}`;
      this.hodGradeAssignments.set(hgaId, {
        id: hgaId,
        schoolId,
        hodUserId: assignment.userId,
        gradeId: assignment.gradeId,
      });
    }

    this.saveToDisk();
    return newObj;
  }

  public deleteAcademicAssignment(schoolId: string, id: string): boolean {
    const existing = this.academicAssignments.get(id);
    if (!existing || existing.schoolId !== schoolId) return false;
    this.academicAssignments.delete(id);
    this.saveToDisk();
    return true;
  }

  // --- HOD PHASE ASSIGNMENTS ---
  public getHodPhaseAssignments(schoolId: string, hodUserId?: string): HodPhaseAssignment[] {
    return Array.from(this.hodPhaseAssignments.values()).filter(hpa => {
      if (hpa.schoolId !== schoolId) return false;
      if (hodUserId && hpa.hodUserId !== hodUserId) return false;
      return true;
    });
  }

  public setHodPhaseAssignments(schoolId: string, hodUserId: string, phaseIds: string[]): HodPhaseAssignment[] {
    // Clear old phase assignments for this HOD
    for (const [id, hpa] of this.hodPhaseAssignments.entries()) {
      if (hpa.schoolId === schoolId && hpa.hodUserId === hodUserId) {
        this.hodPhaseAssignments.delete(id);
      }
    }

    const created: HodPhaseAssignment[] = [];
    for (const phaseId of phaseIds) {
      if (!phaseId) continue;
      const id = `hpa-${schoolId}-${hodUserId}-${phaseId}`;
      const obj: HodPhaseAssignment = { id, schoolId, hodUserId, phaseId };
      this.hodPhaseAssignments.set(id, obj);
      created.push(obj);
    }
    this.saveToDisk();
    return created;
  }

  // --- ASSESSMENT WORKSPACES & MODERATION ---
  public getAssessmentWorkspaces(
    schoolId: string,
    filter?: { phaseId?: string; gradeId?: string; subjectId?: string; teacherUserId?: string }
  ): AssessmentWorkspace[] {
    const phasesMap = this.phases;
    const gradesMap = this.grades;
    const subjectsMap = this.subjects;
    const usersMap = this.users;

    return Array.from(this.assessmentWorkspaces.values())
      .filter(aw => {
        if (aw.schoolId !== schoolId) return false;
        if (filter?.phaseId && aw.phaseId !== filter.phaseId) return false;
        if (filter?.gradeId && aw.gradeId !== filter.gradeId) return false;
        if (filter?.subjectId && aw.subjectId !== filter.subjectId) return false;
        if (filter?.teacherUserId && aw.teacherUserId !== filter.teacherUserId) return false;
        return true;
      })
      .map(aw => ({
        ...aw,
        phaseName: phasesMap.get(aw.phaseId)?.name,
        gradeName: gradesMap.get(aw.gradeId)?.name,
        subjectName: subjectsMap.get(aw.subjectId)?.name,
        teacherName: usersMap.get(aw.teacherUserId)?.fullName,
      }));
  }

  public createAssessmentWorkspace(
    schoolId: string,
    payload: Partial<AssessmentWorkspace> & {
      phaseId: string;
      gradeId: string;
      subjectId: string;
      term: string;
      title: string;
      teacherUserId: string;
    }
  ): AssessmentWorkspace {
    const id = `aw-${schoolId}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const workspace: AssessmentWorkspace = {
      academicYear: '2026',
      assessmentType: 'Formal Test',
      totalMarks: 50,
      duration: '60 Mins',
      language: 'English',
      status: 'Draft',
      updatedAt: now,
      ...payload,
      id,
      schoolId,
      createdAt: now,
    };
    this.assessmentWorkspaces.set(id, workspace);
    this.saveToDisk();
    return workspace;
  }

  public updateAssessmentWorkspaceStatus(
    schoolId: string,
    workspaceId: string,
    status: AssessmentWorkspace['status'],
    hodUserId?: string
  ): AssessmentWorkspace {
    const existing = this.assessmentWorkspaces.get(workspaceId);
    if (!existing || existing.schoolId !== schoolId) {
      throw new Error('Assessment workspace not found for this school');
    }

    let resolvedHodId = hodUserId || existing.hodUserId;

    // Automatic Workflow Routing: When submitted, determine HOD for this Grade
    if (status === 'Submitted' && !resolvedHodId) {
      // Check AcademicAssignments / HOD Grade Assignments for this Grade
      const gradeAssignment = Array.from(this.academicAssignments.values()).find(
        aa => aa.schoolId === schoolId && aa.gradeId === existing.gradeId && aa.role === 'HOD'
      );
      if (gradeAssignment) {
        resolvedHodId = gradeAssignment.userId;
      } else {
        const hga = Array.from(this.hodGradeAssignments.values()).find(
          h => h.schoolId === schoolId && h.gradeId === existing.gradeId
        );
        if (hga) {
          resolvedHodId = hga.hodUserId;
        } else {
          const defaultHod = Array.from(this.users.values()).find(
            u => u.schoolId === schoolId && (u.role === 'HOD' || u.role === 'SCHOOL_ADMIN' || u.role === 'PRINCIPAL')
          );
          if (defaultHod) resolvedHodId = defaultHod.id;
        }
      }
    }

    const updated: AssessmentWorkspace = {
      ...existing,
      status,
      hodUserId: resolvedHodId,
    };
    this.assessmentWorkspaces.set(workspaceId, updated);
    this.saveToDisk();
    return updated;
  }

  public updateAssessmentWorkspace(
    schoolId: string,
    workspaceId: string,
    updates: Partial<AssessmentWorkspace>
  ): AssessmentWorkspace {
    const existing = this.assessmentWorkspaces.get(workspaceId);
    if (!existing || existing.schoolId !== schoolId) {
      throw new Error('Assessment workspace not found for this school');
    }
    const updated: AssessmentWorkspace = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.assessmentWorkspaces.set(workspaceId, updated);
    this.saveToDisk();
    return updated;
  }

  public deleteAssessmentWorkspace(schoolId: string, workspaceId: string, actorUser?: User): boolean {
    const existing = this.assessmentWorkspaces.get(workspaceId);
    if (!existing || existing.schoolId !== schoolId) return false;
    this.assessmentWorkspaces.delete(workspaceId);
    if (actorUser) {
      this.addAuditLog(
        schoolId,
        actorUser,
        'ASSESSMENT_DELETED',
        `Assessment "${existing.title}" was permanently deleted by ${actorUser.fullName} (${actorUser.role}).`
      );
    }
    this.saveToDisk();
    return true;
  }

  // --- STUDENT ROSTERS & MARKS ---
  public getStudents(schoolId: string, classId?: string): StudentRecord[] {
    return Array.from(this.students.values())
      .filter(student => student.schoolId === schoolId && (!classId || student.classId === classId))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  public getStudentById(studentId: string): StudentRecord | undefined {
    return this.students.get(studentId);
  }

  public createStudent(
    schoolId: string,
    payload: Omit<StudentRecord, 'id' | 'schoolId' | 'createdAt'>
  ): StudentRecord {
    const duplicate = this.getStudents(schoolId).find(student =>
      student.admissionNumber.toLowerCase() === payload.admissionNumber.toLowerCase()
    );
    if (duplicate) throw new Error('A student with this admission number already exists.');
    const student: StudentRecord = {
      ...payload,
      id: `stu-${Math.random().toString(36).substring(2, 10)}`,
      schoolId,
      createdAt: new Date().toISOString(),
    };
    this.students.set(student.id, student);
    this.saveToDisk();
    return student;
  }

  public updateStudent(schoolId: string, studentId: string, updates: Partial<StudentRecord>): StudentRecord {
    const existing = this.students.get(studentId);
    if (!existing || existing.schoolId !== schoolId) throw new Error('Student not found.');
    const updated = { ...existing, ...updates, id: existing.id, schoolId: existing.schoolId };
    this.students.set(studentId, updated);
    this.saveToDisk();
    return updated;
  }

  public deleteStudent(schoolId: string, studentId: string): boolean {
    const existing = this.students.get(studentId);
    if (!existing || existing.schoolId !== schoolId) return false;
    this.students.delete(studentId);
    for (const [markId, mark] of this.studentMarks.entries()) {
      if (mark.studentId === studentId) this.studentMarks.delete(markId);
    }
    this.saveToDisk();
    return true;
  }

  public getStudentMarks(schoolId: string, filter: { studentId?: string; teachingAssignmentId?: string } = {}): StudentMark[] {
    return Array.from(this.studentMarks.values())
      .filter(mark => mark.schoolId === schoolId)
      .filter(mark => !filter.studentId || mark.studentId === filter.studentId)
      .filter(mark => !filter.teachingAssignmentId || mark.teachingAssignmentId === filter.teachingAssignmentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public saveStudentMarks(
    schoolId: string,
    rows: Array<Omit<StudentMark, 'id' | 'schoolId' | 'createdAt' | 'percentage'>>
  ): StudentMark[] {
    const saved = rows.map(row => {
      const mark: StudentMark = {
        ...row,
        id: `mark-${Math.random().toString(36).substring(2, 10)}`,
        schoolId,
        percentage: row.totalMarks > 0 ? Math.round((row.score / row.totalMarks) * 10000) / 100 : 0,
        createdAt: new Date().toISOString(),
      };
      this.studentMarks.set(mark.id, mark);
      return mark;
    });
    this.saveToDisk();
    return saved;
  }

  // --- KNOWLEDGE HUB RESOURCES ---
  public getKnowledgeResources(schoolId: string): KnowledgeResource[] {
    return Array.from(this.knowledgeResources.values()).filter(r => r.schoolId === schoolId);
  }

  public createKnowledgeResource(schoolId: string, payload: Omit<KnowledgeResource, 'id' | 'schoolId' | 'createdAt'>, actorUser?: User, suppliedId?: string): KnowledgeResource {
    const id = suppliedId || `res-${Math.random().toString(36).substring(2, 8)}`;
    const resource: KnowledgeResource = {
      ...payload,
      id,
      schoolId,
      createdAt: new Date().toISOString(),
    };
    this.knowledgeResources.set(id, resource);
    if (actorUser) {
      this.addAuditLog(
        schoolId,
        actorUser,
        'KNOWLEDGE_RESOURCE_UPLOADED',
        `Knowledge Hub Resource "${resource.title}" uploaded by ${actorUser.fullName}.`
      );
    }
    this.saveToDisk();
    return resource;
  }

  public deleteKnowledgeResource(schoolId: string, resourceId: string, actorUser?: User): boolean {
    const existing = this.knowledgeResources.get(resourceId);
    if (!existing || existing.schoolId !== schoolId) return false;
    this.knowledgeResources.delete(resourceId);
    if (actorUser) {
      this.addAuditLog(
        schoolId,
        actorUser,
        'KNOWLEDGE_RESOURCE_DELETED',
        `Knowledge Hub Resource "${existing.title}" deleted by ${actorUser.fullName}.`
      );
    }
    this.saveToDisk();
    return true;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(schoolId: string | null): AuditLog[] {
    if (schoolId === null) {
      return this.auditLogs;
    }
    return this.auditLogs.filter(log => log.schoolId === schoolId || log.schoolId === null);
  }

  public addAuditLog(schoolId: string | null, actor: { id: string; fullName: string; role: string }, action: string, details: string) {
    const log: AuditLog = {
      id: `log-${Math.random().toString(36).substring(2, 10)}`,
      schoolId,
      actorUserId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.saveToDisk();
    return log;
  }

  // --- ENGAGEMENT TRACKING, TELEMETRY & ACTIONS ---

  public logEngagementSession(sessionData: Partial<UserEngagementSession>): UserEngagementSession {
    const id = sessionData.id || `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const existing = this.engagementSessions.get(id);

    const user = sessionData.userId ? this.users.get(sessionData.userId) : undefined;
    const school = (sessionData.schoolId || user?.schoolId) ? this.schools.get(sessionData.schoolId || user?.schoolId || '') : undefined;

    const session: UserEngagementSession = {
      id,
      userId: sessionData.userId || existing?.userId || 'unknown',
      userName: sessionData.userName || existing?.userName || user?.fullName || 'Staff Member',
      userEmail: sessionData.userEmail || existing?.userEmail || user?.email || '',
      userRole: sessionData.userRole || existing?.userRole || user?.role || 'TEACHER',
      schoolId: sessionData.schoolId !== undefined ? sessionData.schoolId : (existing?.schoolId || user?.schoolId || null),
      schoolName: school?.name || existing?.schoolName || 'School Tenant',
      loginTime: sessionData.loginTime || existing?.loginTime || now,
      lastActiveTime: sessionData.lastActiveTime || now,
      durationSeconds: sessionData.durationSeconds !== undefined ? sessionData.durationSeconds : (existing?.durationSeconds || 0),
      interactionCount: sessionData.interactionCount !== undefined ? sessionData.interactionCount : (existing?.interactionCount || 0),
      isBounced: sessionData.isBounced !== undefined ? sessionData.isBounced : (existing?.isBounced ?? false),
      bounceReason: sessionData.bounceReason || existing?.bounceReason,
      exitPage: sessionData.exitPage || existing?.exitPage || 'Dashboard',
      device: sessionData.device || existing?.device || 'Desktop / Web',
    };

    if (session.loginTime && session.lastActiveTime) {
      const diffMs = new Date(session.lastActiveTime).getTime() - new Date(session.loginTime).getTime();
      if (diffMs > 0 && sessionData.durationSeconds === undefined) {
        session.durationSeconds = Math.max(session.durationSeconds, Math.round(diffMs / 1000));
      }
    }

    if (session.interactionCount <= 2 && session.durationSeconds < 90) {
      session.isBounced = true;
      if (!session.bounceReason) {
        if (session.interactionCount === 0) {
          session.bounceReason = `Logged in and exited immediately without interacting (${session.durationSeconds}s duration)`;
        } else {
          session.bounceReason = `Exited from ${session.exitPage} with minimal interaction (${session.interactionCount} action, ${session.durationSeconds}s duration)`;
        }
      }
    } else if (session.interactionCount > 2) {
      session.isBounced = false;
      session.bounceReason = undefined;
    }

    this.engagementSessions.set(id, session);
    this.saveToDisk();
    return session;
  }

  public updateEngagementSession(sessionId: string, updates: Partial<UserEngagementSession>): UserEngagementSession | null {
    const existing = this.engagementSessions.get(sessionId);
    if (!existing) return null;
    return this.logEngagementSession({ ...existing, ...updates, id: sessionId });
  }

  public logUserActionEvent(eventData: Omit<UserActionEvent, 'id' | 'timestamp'> & { timestamp?: string }): UserActionEvent {
    const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = eventData.timestamp || new Date().toISOString();

    const user = this.users.get(eventData.userId);

    const event: UserActionEvent = {
      ...eventData,
      id,
      timestamp,
      userName: eventData.userName || user?.fullName || 'Staff Member',
      userRole: eventData.userRole || user?.role || 'TEACHER',
      schoolId: eventData.schoolId !== undefined ? eventData.schoolId : (user?.schoolId || null),
    };

    this.userActions.set(id, event);

    if (event.sessionId && this.engagementSessions.has(event.sessionId)) {
      const session = this.engagementSessions.get(event.sessionId)!;
      session.interactionCount += 1;
      session.lastActiveTime = timestamp;
      session.exitPage = event.featureName;
      const diffMs = new Date(timestamp).getTime() - new Date(session.loginTime).getTime();
      if (diffMs > 0) {
        session.durationSeconds = Math.max(session.durationSeconds, Math.round(diffMs / 1000));
      }
      if (session.interactionCount > 2) {
        session.isBounced = false;
        session.bounceReason = undefined;
      }
      this.engagementSessions.set(session.id, session);
    }

    this.saveToDisk();
    return event;
  }

  public getEngagementSummary(
    schoolId: string | null,
    timeframe: string = '30d',
    roleFilter: string = 'ALL'
  ): EngagementAnalyticsSummary {
    const now = Date.now();
    let cutoffMs = now - 30 * 24 * 60 * 60 * 1000;
    if (timeframe === 'today' || timeframe === '24h') {
      cutoffMs = now - 24 * 60 * 60 * 1000;
    } else if (timeframe === '7d') {
      cutoffMs = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeframe === 'all') {
      cutoffMs = 0;
    }

    const allSessions = Array.from(this.engagementSessions.values());
    const filteredSessions = allSessions.filter(sess => {
      if (schoolId !== null && sess.schoolId !== schoolId) return false;
      if (roleFilter !== 'ALL' && sess.userRole !== roleFilter) return false;
      const sessTime = new Date(sess.loginTime).getTime();
      return sessTime >= cutoffMs;
    });

    const allActions = Array.from(this.userActions.values());
    const filteredActions = allActions.filter(act => {
      if (schoolId !== null && act.schoolId !== schoolId) return false;
      if (roleFilter !== 'ALL' && act.userRole !== roleFilter) return false;
      const actTime = new Date(act.timestamp).getTime();
      return actTime >= cutoffMs;
    });

    const totalSessions = filteredSessions.length;
    const bouncedSessions = filteredSessions.filter(s => s.isBounced);
    const totalBounceSessions = bouncedSessions.length;
    const bounceRatePercentage = totalSessions > 0 ? Math.round((totalBounceSessions / totalSessions) * 100) : 0;
    const avgBounceDurationSeconds =
      totalBounceSessions > 0
        ? Math.round(bouncedSessions.reduce((acc, s) => acc + s.durationSeconds, 0) / totalBounceSessions)
        : 0;

    const roleBounceBreakdown: Record<string, { total: number; bounced: number; rate: number }> = {};
    for (const s of filteredSessions) {
      if (!roleBounceBreakdown[s.userRole]) {
        roleBounceBreakdown[s.userRole] = { total: 0, bounced: 0, rate: 0 };
      }
      roleBounceBreakdown[s.userRole].total += 1;
      if (s.isBounced) roleBounceBreakdown[s.userRole].bounced += 1;
    }
    for (const r in roleBounceBreakdown) {
      const item = roleBounceBreakdown[r];
      item.rate = item.total > 0 ? Math.round((item.bounced / item.total) * 100) : 0;
    }

    const uniqueUsers = new Set<string>();
    filteredSessions.forEach(s => uniqueUsers.add(s.userId));
    filteredActions.forEach(a => uniqueUsers.add(a.userId));

    const FEATURE_DEFINITIONS: Array<{
      id: string;
      name: string;
      category: string;
      leaveBeReason: string;
      refineReason: string;
      avoidedReason: string;
    }> = [
      {
        id: 'assessments_workspace',
        name: 'Assessment Workspace & Drafting',
        category: 'assessments',
        leaveBeReason: 'High adoption and mission-critical teacher workflow. Keep UI structure stable to protect teacher productivity.',
        refineReason: 'Frequent use; streamline attachment previews and auto-save indicators.',
        avoidedReason: 'Teachers have not initiated assessments in this period; ensure grades and subjects are assigned.',
      },
      {
        id: 'students_marks',
        name: 'Class Rosters & Marks Capture',
        category: 'students_marks',
        leaveBeReason: 'Consistently high volume and high staff confidence. Maintain spreadsheet format compatibility.',
        refineReason: 'Used heavily; simplify OCR mismatch verification and provide faster unassigned student onboarding.',
        avoidedReason: 'No marks captured yet; verify if current term assessment window is active.',
      },
      {
        id: 'dashboard_quick_actions',
        name: 'Dashboard Quick Actions & Shortcuts',
        category: 'navigation',
        leaveBeReason: 'High frequency click-through hub for teachers and leadership. Leave prominent and compact.',
        refineReason: 'Add dynamic badge counts to quick action cards.',
        avoidedReason: 'Users navigating primarily via sidebar; highlight quick actions on login.',
      },
      {
        id: 'moderation_review',
        name: 'HOD / DP Moderation Workflow',
        category: 'assessments',
        leaveBeReason: 'Standardized approval pipeline functioning with high completion. Maintain formal audit trail.',
        refineReason: 'Moderators frequently request revisions; refine with quick-comment templates and inline criteria checklists.',
        avoidedReason: 'Moderation pending or bypassed; remind Department Heads of submitted drafts.',
      },
      {
        id: 'academic_structure',
        name: 'Academic Structure & Class Sections',
        category: 'academic',
        leaveBeReason: 'Solid structural foundation with active grade and class management. Keep existing hierarchical view.',
        refineReason: 'Refine bulk section generation for larger primary/secondary schools.',
        avoidedReason: 'Academic structure configured during setup and rarely revisited; expected behavior outside term transitions.',
      },
      {
        id: 'user_management',
        name: 'Staff Accounts & HOD Reporting Lines',
        category: 'admin',
        leaveBeReason: 'Clear multi-role and reporting line controls. Safe and reliable administration.',
        refineReason: 'Refine batch password reset and staff onboarding invitation links.',
        avoidedReason: 'Admin-only module; usage is naturally intermittent.',
      },
      {
        id: 'knowledge_hub_resources',
        name: 'Knowledge Hub Teaching Resources',
        category: 'knowledge_hub',
        leaveBeReason: 'Active sharing of lesson plans and assessments. Maintain 15 MB file upload limit and fast downloads.',
        refineReason: 'Refine search tags and grade-specific filtering to boost resource discovery.',
        avoidedReason: 'Underutilized repository; prompt teachers to share top exemplars after approved tests.',
      },
      {
        id: 'knowledge_hub_caps',
        name: 'Knowledge Hub CAPS Policy Documents',
        category: 'knowledge_hub',
        leaveBeReason: 'Reference archive available on demand.',
        refineReason: 'Organize national CAPS files by phase with direct preview.',
        avoidedReason: 'Staff rarely download CAPS policies; consider pre-indexing curriculum guidelines inside assessment drafts.',
      },
      {
        id: 'assessment_archive',
        name: 'Historical Assessment Archive',
        category: 'assessments',
        leaveBeReason: 'Retains past papers and memoranda securely.',
        refineReason: 'Add multi-year comparative search and term-by-term export.',
        avoidedReason: 'Historical archive rarely consulted during regular teaching weeks; anticipated annual usage pattern.',
      },
      {
        id: 'manual_student_roster_entry',
        name: 'Manual Single Student Roster Entry',
        category: 'students_marks',
        leaveBeReason: 'Maintained for single late-admissions.',
        refineReason: 'Add keyboard-first rapid data entry (Enter to submit and jump to next row).',
        avoidedReason: 'Staff strongly avoid typing learners manually, favoring Excel/CSV imports; retain bulk import as default.',
      },
      {
        id: 'curriculum_map',
        name: 'Curriculum Mapping Matrix',
        category: 'academic',
        leaveBeReason: 'Underlying grid connects phases, grades, and subjects.',
        refineReason: 'Provide automated phase-based defaults to eliminate manual grid clicking.',
        avoidedReason: 'Matrix is perceived as tedious; automate phase defaults upon school initialization.',
      },
      {
        id: 'branding_settings',
        name: 'School Branding & Theme Colors',
        category: 'settings',
        leaveBeReason: 'Customized school colors and badge appear throughout the platform.',
        refineReason: 'Provide instant live color contrast checker for accessibility.',
        avoidedReason: 'Configured once during registration; rarely edited subsequently.',
      },
      {
        id: 'audit_trail',
        name: 'School Security Audit Trail',
        category: 'admin',
        leaveBeReason: 'Comprehensive audit coverage for all operational events.',
        refineReason: 'Add CSV audit export and anomaly detection filters.',
        avoidedReason: 'Consulted mainly during administrative investigations.',
      },
      {
        id: 'school_settings',
        name: 'School Settings & Academic Calendar',
        category: 'settings',
        leaveBeReason: 'Calendar and term structure is well-configured.',
        refineReason: 'Refine term rollover wizard for upcoming academic years.',
        avoidedReason: 'Set-and-forget operational settings.',
      },
    ];

    const featureMetrics: FeatureEngagementMetric[] = FEATURE_DEFINITIONS.map(def => {
      const actionsForFeature = filteredActions.filter(a => a.featureId === def.id || a.featureName.toLowerCase().includes(def.name.toLowerCase().slice(0, 8)));
      const totalInteractions = actionsForFeature.length;
      const featureUsers = new Set(actionsForFeature.map(a => a.userId));
      const uniqueUsersCount = featureUsers.size;
      const avgPerUser = uniqueUsersCount > 0 ? Number((totalInteractions / uniqueUsersCount).toFixed(1)) : 0;
      const lastAction = actionsForFeature.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      const lastUsedAt = lastAction ? lastAction.timestamp : 'Not used in this period';

      let usageTier: 'high' | 'moderate' | 'low' | 'avoided' = 'avoided';
      let statusRecommendation: 'leave_be' | 'refine' | 'simplify_or_promote' = 'simplify_or_promote';
      let recommendationReason = def.avoidedReason;

      if (totalInteractions >= 12) {
        usageTier = 'high';
        statusRecommendation = 'leave_be';
        recommendationReason = def.leaveBeReason;
      } else if (totalInteractions >= 4) {
        usageTier = 'moderate';
        statusRecommendation = 'refine';
        recommendationReason = def.refineReason;
      } else if (totalInteractions >= 1) {
        usageTier = 'low';
        statusRecommendation = 'simplify_or_promote';
        recommendationReason = def.avoidedReason;
      } else {
        usageTier = 'avoided';
        statusRecommendation = 'simplify_or_promote';
        recommendationReason = def.avoidedReason;
      }

      return {
        featureId: def.id,
        featureName: def.name,
        category: def.category,
        totalInteractions,
        uniqueUsersCount,
        avgPerUser,
        lastUsedAt,
        usageTier,
        statusRecommendation,
        recommendationReason,
      };
    });

    const mostUsedFeatures = [...featureMetrics]
      .sort((a, b) => b.totalInteractions - a.totalInteractions)
      .slice(0, 6);

    const avoidedFeatures = [...featureMetrics]
      .filter(f => f.usageTier === 'avoided' || f.usageTier === 'low')
      .sort((a, b) => a.totalInteractions - b.totalInteractions);

    const featuresToLeaveBe = featureMetrics.filter(f => f.statusRecommendation === 'leave_be');
    const featuresToRefine = featureMetrics.filter(f => f.statusRecommendation === 'refine');

    const recentSessions = [...filteredSessions]
      .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime())
      .slice(0, 15);

    const recentActions = [...filteredActions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return {
      schoolId,
      timeframe,
      totalInteractions: filteredActions.length,
      totalActiveUsers: uniqueUsers.size,
      totalSessions,
      mostUsedFeatures,
      avoidedFeatures,
      featuresToLeaveBe,
      featuresToRefine,
      bounceStats: {
        totalSessions,
        totalBounceSessions,
        bounceRatePercentage,
        avgBounceDurationSeconds,
        bouncedSessions: bouncedSessions.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()).slice(0, 12),
        roleBounceBreakdown,
      },
      recentSessions,
      recentActions,
    };
  }

  public simulateEngagementScenario(schoolId: string | null, scenario: string): EngagementAnalyticsSummary {
    const targetSchoolId = schoolId || 'SCH-1001';
    const schoolUsers = this.getUsers(targetSchoolId).filter(u => u.status === 'Active');
    const teachers = schoolUsers.filter(u => (u.roles || [u.role]).includes('TEACHER'));
    const hods = schoolUsers.filter(u => (u.roles || [u.role]).includes('HOD'));
    const principal = schoolUsers.find(u => (u.roles || [u.role]).includes('PRINCIPAL'));

    const teacher = teachers[0] || schoolUsers[0];
    const hod = hods[0] || schoolUsers[1] || teacher;

    const now = new Date();

    if (scenario === 'user_bounce_immediate') {
      const targetUser = teachers[1] || teacher;
      const sessId = `sess-sim-bounce-${Date.now()}`;
      const loginTime = new Date(now.getTime() - 40 * 1000).toISOString();
      const lastActiveTime = new Date(now.getTime() - 15 * 1000).toISOString();

      this.logEngagementSession({
        id: sessId,
        userId: targetUser.id,
        userName: targetUser.fullName,
        userEmail: targetUser.email,
        userRole: targetUser.role,
        schoolId: targetSchoolId,
        loginTime,
        lastActiveTime,
        durationSeconds: 25,
        interactionCount: 1,
        isBounced: true,
        exitPage: 'Dashboard',
        bounceReason: 'Logged in, viewed Dashboard for 25s, and exited without engaging in any academic workflow.',
        device: 'Chrome / macOS',
      });

      this.logUserActionEvent({
        sessionId: sessId,
        userId: targetUser.id,
        userName: targetUser.fullName,
        userRole: targetUser.role,
        schoolId: targetSchoolId,
        featureId: 'dashboard_quick_actions',
        featureName: 'Dashboard Overview',
        category: 'navigation',
        actionType: 'view',
        details: 'User viewed Dashboard, lingered for 25s, and closed browser without opening any workspace.',
        timestamp: lastActiveTime,
      });
    } else if (scenario === 'teacher_assessment_upload') {
      const sessId = `sess-sim-teacher-${Date.now()}`;
      const loginTime = new Date(now.getTime() - 12 * 60 * 1000).toISOString();

      this.logEngagementSession({
        id: sessId,
        userId: teacher.id,
        userName: teacher.fullName,
        userEmail: teacher.email,
        userRole: teacher.role,
        schoolId: targetSchoolId,
        loginTime,
        lastActiveTime: now.toISOString(),
        durationSeconds: 720,
        interactionCount: 5,
        isBounced: false,
        exitPage: 'Assessment Workspace',
        device: 'Chrome / Windows 11',
      });

      this.logUserActionEvent({
        sessionId: sessId,
        userId: teacher.id,
        userName: teacher.fullName,
        userRole: teacher.role,
        schoolId: targetSchoolId,
        featureId: 'assessments_workspace',
        featureName: 'Assessment Workspace',
        category: 'assessments',
        actionType: 'create',
        details: 'Created Grade 5 Mathematics Term 3 Test Workspace',
      });

      this.logUserActionEvent({
        sessionId: sessId,
        userId: teacher.id,
        userName: teacher.fullName,
        userRole: teacher.role,
        schoolId: targetSchoolId,
        featureId: 'assessments_workspace',
        featureName: 'Assessment Workspace',
        category: 'assessments',
        actionType: 'upload',
        details: 'Uploaded Grade 5 Mathematics Question Paper PDF (1.4 MB)',
      });

      this.logUserActionEvent({
        sessionId: sessId,
        userId: teacher.id,
        userName: teacher.fullName,
        userRole: teacher.role,
        schoolId: targetSchoolId,
        featureId: 'assessments_workspace',
        featureName: 'Assessment Workspace',
        category: 'assessments',
        actionType: 'upload',
        details: 'Uploaded Memorandum & Marking Guidelines PDF',
      });
    } else if (scenario === 'hod_moderation_approval') {
      const sessId = `sess-sim-hod-${Date.now()}`;
      const loginTime = new Date(now.getTime() - 8 * 60 * 1000).toISOString();

      this.logEngagementSession({
        id: sessId,
        userId: hod.id,
        userName: hod.fullName,
        userEmail: hod.email,
        userRole: hod.role,
        schoolId: targetSchoolId,
        loginTime,
        lastActiveTime: now.toISOString(),
        durationSeconds: 480,
        interactionCount: 4,
        isBounced: false,
        exitPage: 'Moderation Review',
        device: 'Edge / Windows',
      });

      this.logUserActionEvent({
        sessionId: sessId,
        userId: hod.id,
        userName: hod.fullName,
        userRole: hod.role,
        schoolId: targetSchoolId,
        featureId: 'moderation_review',
        featureName: 'Assessment Moderation Review',
        category: 'assessments',
        actionType: 'update',
        details: 'Reviewed and Approved Grade 4 English Home Language Paper with moderation comments',
      });
    } else if (scenario === 'marks_import_workflow') {
      const sessId = `sess-sim-marks-${Date.now()}`;
      const loginTime = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

      this.logEngagementSession({
        id: sessId,
        userId: teacher.id,
        userName: teacher.fullName,
        userEmail: teacher.email,
        userRole: teacher.role,
        schoolId: targetSchoolId,
        loginTime,
        lastActiveTime: now.toISOString(),
        durationSeconds: 900,
        interactionCount: 6,
        isBounced: false,
        exitPage: 'Students & Marks',
        device: 'Safari / macOS',
      });

      this.logUserActionEvent({
        sessionId: sessId,
        userId: teacher.id,
        userName: teacher.fullName,
        userRole: teacher.role,
        schoolId: targetSchoolId,
        featureId: 'students_marks',
        featureName: 'Students & Marks Capture',
        category: 'students_marks',
        actionType: 'upload',
        details: 'Uploaded Class Marks Spreadsheet (Excel .xlsx, 32 students matched)',
      });

      this.logUserActionEvent({
        sessionId: sessId,
        userId: teacher.id,
        userName: teacher.fullName,
        userRole: teacher.role,
        schoolId: targetSchoolId,
        featureId: 'students_marks',
        featureName: 'Students & Marks Capture',
        category: 'students_marks',
        actionType: 'create',
        details: 'Confirmed and saved 32 validated student marks to permanent register',
      });
    }

    this.saveToDisk();
    return this.getEngagementSummary(schoolId);
  }

  public resetEngagementData(schoolId: string | null): void {
    if (schoolId === null) {
      this.engagementSessions.clear();
      this.userActions.clear();
    } else {
      for (const [id, sess] of this.engagementSessions.entries()) {
        if (sess.schoolId === schoolId) this.engagementSessions.delete(id);
      }
      for (const [id, act] of this.userActions.entries()) {
        if (act.schoolId === schoolId) this.userActions.delete(id);
      }
    }
    this.seedEngagementData();
    this.saveToDisk();
  }

  public seedEngagementData(): void {
    const schoolId = 'SCH-1001';
    const users = this.getUsers(schoolId);
    if (users.length === 0) return;

    const teacher1 = users.find(u => u.email === 'teacher@test.com') || users[2] || users[0];
    const teacher2 = users.find(u => u.id !== teacher1.id && (u.roles || [u.role]).includes('TEACHER')) || users[1];
    const hod = users.find(u => (u.roles || [u.role]).includes('HOD')) || users[1];
    const admin = users.find(u => (u.roles || [u.role]).includes('SCHOOL_ADMIN')) || users[0];

    const baseTime = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const hour = 60 * 60 * 1000;

    // 1. Engaged Teacher Sessions
    const s1 = `sess-seed-1`;
    this.engagementSessions.set(s1, {
      id: s1,
      userId: teacher1.id,
      userName: teacher1.fullName,
      userEmail: teacher1.email,
      userRole: teacher1.role,
      schoolId,
      schoolName: 'St. Augustine College',
      loginTime: new Date(baseTime - 1 * day - 4 * hour).toISOString(),
      lastActiveTime: new Date(baseTime - 1 * day - 3 * hour).toISOString(),
      durationSeconds: 3600,
      interactionCount: 14,
      isBounced: false,
      exitPage: 'Assessment Workspace',
      device: 'Chrome / Windows',
    });

    const s2 = `sess-seed-2`;
    this.engagementSessions.set(s2, {
      id: s2,
      userId: teacher2.id,
      userName: teacher2.fullName,
      userEmail: teacher2.email,
      userRole: teacher2.role,
      schoolId,
      schoolName: 'St. Augustine College',
      loginTime: new Date(baseTime - 2 * day).toISOString(),
      lastActiveTime: new Date(baseTime - 2 * day + 45 * 60 * 1000).toISOString(),
      durationSeconds: 2700,
      interactionCount: 11,
      isBounced: false,
      exitPage: 'Students & Marks',
      device: 'Safari / macOS',
    });

    // 2. Engaged HOD Session
    const s3 = `sess-seed-3`;
    this.engagementSessions.set(s3, {
      id: s3,
      userId: hod.id,
      userName: hod.fullName,
      userEmail: hod.email,
      userRole: hod.role,
      schoolId,
      schoolName: 'St. Augustine College',
      loginTime: new Date(baseTime - 3 * day).toISOString(),
      lastActiveTime: new Date(baseTime - 3 * day + 30 * 60 * 1000).toISOString(),
      durationSeconds: 1800,
      interactionCount: 8,
      isBounced: false,
      exitPage: 'Moderation Review',
      device: 'Edge / Windows',
    });

    // 3. Engaged Admin Session
    const s4 = `sess-seed-4`;
    this.engagementSessions.set(s4, {
      id: s4,
      userId: admin.id,
      userName: admin.fullName,
      userEmail: admin.email,
      userRole: admin.role,
      schoolId,
      schoolName: 'St. Augustine College',
      loginTime: new Date(baseTime - 4 * day).toISOString(),
      lastActiveTime: new Date(baseTime - 4 * day + 25 * 60 * 1000).toISOString(),
      durationSeconds: 1500,
      interactionCount: 9,
      isBounced: false,
      exitPage: 'Academic Structure',
      device: 'Chrome / macOS',
    });

    // 4. LOW ENGAGEMENT / BOUNCE SESSIONS (The exact problem user described)
    const b1 = `sess-seed-b1`;
    this.engagementSessions.set(b1, {
      id: b1,
      userId: teacher2.id,
      userName: teacher2.fullName,
      userEmail: teacher2.email,
      userRole: teacher2.role,
      schoolId,
      schoolName: 'St. Augustine College',
      loginTime: new Date(baseTime - 6 * hour).toISOString(),
      lastActiveTime: new Date(baseTime - 6 * hour + 28 * 1000).toISOString(),
      durationSeconds: 28,
      interactionCount: 0,
      isBounced: true,
      exitPage: 'Dashboard',
      bounceReason: 'Logged in and left immediately without interacting (28s on Dashboard).',
      device: 'Chrome / Android Mobile',
    });

    const b2 = `sess-seed-b2`;
    this.engagementSessions.set(b2, {
      id: b2,
      userId: teacher1.id,
      userName: teacher1.fullName,
      userEmail: teacher1.email,
      userRole: teacher1.role,
      schoolId,
      schoolName: 'St. Augustine College',
      loginTime: new Date(baseTime - 18 * hour).toISOString(),
      lastActiveTime: new Date(baseTime - 18 * hour + 45 * 1000).toISOString(),
      durationSeconds: 45,
      interactionCount: 1,
      isBounced: true,
      exitPage: 'Knowledge Hub',
      bounceReason: 'Exited Knowledge Hub after 45s with only 1 click (did not upload or download).',
      device: 'Chrome / Windows',
    });

    const b3 = `sess-seed-b3`;
    this.engagementSessions.set(b3, {
      id: b3,
      userId: hod.id,
      userName: hod.fullName,
      userEmail: hod.email,
      userRole: hod.role,
      schoolId,
      schoolName: 'St. Augustine College',
      loginTime: new Date(baseTime - 2 * day + 6 * hour).toISOString(),
      lastActiveTime: new Date(baseTime - 2 * day + 6 * hour + 35 * 1000).toISOString(),
      durationSeconds: 35,
      interactionCount: 1,
      isBounced: true,
      exitPage: 'Dashboard Quick Actions',
      bounceReason: 'Quick login check (35s duration, 1 interaction on Quick Actions).',
      device: 'Safari / iPhone',
    });

    const b4 = `sess-seed-b4`;
    this.engagementSessions.set(b4, {
      id: b4,
      userId: teacher2.id,
      userName: teacher2.fullName,
      userEmail: teacher2.email,
      userRole: teacher2.role,
      schoolId,
      schoolName: 'St. Augustine College',
      loginTime: new Date(baseTime - 5 * day).toISOString(),
      lastActiveTime: new Date(baseTime - 5 * day + 19 * 1000).toISOString(),
      durationSeconds: 19,
      interactionCount: 0,
      isBounced: true,
      exitPage: 'Dashboard',
      bounceReason: 'Immediate exit after login (19s duration, 0 interactions).',
      device: 'Firefox / Linux',
    });

    // 5. Seed diverse action events
    const featuresList = [
      { id: 'assessments_workspace', name: 'Assessment Workspace & Drafting', count: 26, category: 'assessments' },
      { id: 'students_marks', name: 'Class Rosters & Marks Capture', count: 21, category: 'students_marks' },
      { id: 'dashboard_quick_actions', name: 'Dashboard Quick Actions & Shortcuts', count: 16, category: 'navigation' },
      { id: 'moderation_review', name: 'HOD / DP Moderation Workflow', count: 12, category: 'assessments' },
      { id: 'academic_structure', name: 'Academic Structure & Class Sections', count: 9, category: 'academic' },
      { id: 'user_management', name: 'Staff Accounts & HOD Reporting Lines', count: 7, category: 'admin' },
      { id: 'audit_trail', name: 'School Security Audit Trail', count: 5, category: 'admin' },
      { id: 'knowledge_hub_resources', name: 'Knowledge Hub Teaching Resources', count: 4, category: 'knowledge_hub' },
      // Avoided / neglected features:
      { id: 'assessment_archive', name: 'Historical Assessment Archive', count: 2, category: 'assessments' },
      { id: 'curriculum_map', name: 'Curriculum Mapping Matrix', count: 2, category: 'academic' },
      { id: 'manual_student_roster_entry', name: 'Manual Single Student Roster Entry', count: 1, category: 'students_marks' },
      { id: 'branding_settings', name: 'School Branding & Theme Colors', count: 1, category: 'settings' },
      { id: 'knowledge_hub_caps', name: 'Knowledge Hub CAPS Policy Documents', count: 0, category: 'knowledge_hub' },
      { id: 'school_settings', name: 'School Settings & Academic Calendar', count: 1, category: 'settings' },
    ];

    let actIdx = 1;
    for (const item of featuresList) {
      for (let i = 0; i < item.count; i++) {
        const actId = `act-seed-${actIdx++}`;
        const user = i % 2 === 0 ? teacher1 : (i % 3 === 0 ? hod : teacher2);
        const actionTime = new Date(baseTime - (i + 1) * 6 * hour).toISOString();
        this.userActions.set(actId, {
          id: actId,
          sessionId: s1,
          userId: user.id,
          userName: user.fullName,
          userRole: user.role,
          schoolId,
          featureId: item.id,
          featureName: item.name,
          category: item.category as any,
          actionType: i % 4 === 0 ? 'create' : (i % 3 === 0 ? 'upload' : (i % 2 === 0 ? 'update' : 'view')),
          details: `Interacted with ${item.name}`,
          timestamp: actionTime,
        });
      }
    }
  }
}

export const db = new DatabaseStore();

