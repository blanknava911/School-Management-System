import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/dbStore.js';
import { GoogleGenAI } from '@google/genai';

const __dirname = process.cwd();

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`[Server /api/auth/login] Auth attempt received for email: "${email}"`);

    if (!email || !password) {
      console.warn('[Server /api/auth/login] Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = db.getUserByEmail(email);
    if (!result) {
      console.warn(`[Server /api/auth/login] User lookup failed for email: "${email}"`);
      return res.status(401).json({ error: 'Invalid credentials. User email not found.' });
    }

    const { user, passwordHash } = result;
    const isPasswordValid = db.verifyPassword(user, password, passwordHash);

    if (!isPasswordValid) {
      console.warn(`[Server /api/auth/login] Password verification failed for user: ${user.email}`);
      return res.status(401).json({ error: 'Invalid credentials. Password verification failed.' });
    }

    const school = user.schoolId ? db.getSchoolById(user.schoolId) : null;

    if (school && (school.status as string) === 'Disabled' && user.role !== 'SUPER_ADMIN') {
      console.warn(`[Server /api/auth/login] Login blocked for user ${user.email}: School ${school.name} is disabled.`);
      return res.status(403).json({ error: 'This school account has been disabled by the Platform Super Administrator. Please contact support for reactivation.' });
    }

    db.addAuditLog(
      user.schoolId,
      user,
      'USER_LOGIN',
      `User ${user.fullName} (${user.role}) logged in successfully.`
    );

    console.log(`[Server /api/auth/login] LOGIN SUCCESSFUL: ${user.fullName} (${user.role}) @ ${school ? school.name : 'Platform Super Admin'}`);

    res.json({
      user,
      school,
      token: `mock-jwt-token-${user.id}-${Date.now()}`
    });
  });

  // School Registration Wizard Endpoint
  app.post('/api/schools/register', (req, res) => {
    try {
      const { schoolInfo, adminInfo } = req.body;

      if (!schoolInfo?.name || !adminInfo?.email || !adminInfo?.password) {
        return res.status(400).json({ error: 'Missing required school or administrator fields' });
      }

      // Check if admin email already exists
      const existingUser = db.getUserByEmail(adminInfo.email);
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }

      // Create School
      const newSchool = db.createSchool({
        name: schoolInfo.name,
        logo: schoolInfo.logo || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=200',
        motto: schoolInfo.motto || 'Striving for Academic Excellence and Knowledge',
        type: schoolInfo.type || 'Private',
        country: schoolInfo.country || 'South Africa',
        province: schoolInfo.province || 'Gauteng',
        address: schoolInfo.address || '123 Education Way',
        phone: schoolInfo.phone || '+27 11 000 0000',
        email: schoolInfo.email || 'info@school.edu',
        website: schoolInfo.website || 'https://school.edu',
        primaryColor: schoolInfo.primaryColor || '#1e3a8a',
        secondaryColor: schoolInfo.secondaryColor || '#0d9488',
        academicYear: schoolInfo.academicYear || '2026',
        terms: schoolInfo.terms || '4 Terms',
        language: schoolInfo.language || 'English',
        status: 'Active',
        isFirstLogin: false, // Set to false so admin logs directly into dashboard with profile completion banner
      });

      // Create First School Administrator
      const newAdmin = db.createUser(
        {
          schoolId: newSchool.id,
          fullName: adminInfo.fullName,
          email: adminInfo.email,
          role: 'SCHOOL_ADMIN',
          status: 'Active',
        },
        adminInfo.password
      );

      // Audit logs
      db.addAuditLog(
        newSchool.id,
        newAdmin,
        'SCHOOL_REGISTERED',
        `New school "${newSchool.name}" registered with unique ID ${newSchool.id}. Admin: ${newAdmin.fullName}.`
      );

      res.status(201).json({
        message: 'School and Administrator created successfully',
        school: newSchool,
        user: newAdmin,
        token: `mock-jwt-token-${newAdmin.id}-${Date.now()}`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to register school' });
    }
  });

  // Get Schools List (Super Admin or Public Selection)
  app.get('/api/schools', (req, res) => {
    const schools = db.getSchools();
    res.json(schools);
  });

  // Get School by ID
  app.get('/api/schools/:schoolId', (req, res) => {
    const school = db.getSchoolById(req.params.schoolId);
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json(school);
  });

  // Update School Profile & Branding
  app.put('/api/schools/:schoolId', (req, res) => {
    const { actorUser, updates, auditEntries } = req.body;
    const oldSchool = db.getSchoolById(req.params.schoolId);
    if (!oldSchool) return res.status(404).json({ error: 'School not found' });

    const school = db.updateSchool(req.params.schoolId, updates);
    if (!school) return res.status(404).json({ error: 'School not found' });

    if (actorUser) {
      if (Array.isArray(auditEntries) && auditEntries.length > 0) {
        for (const entry of auditEntries) {
          db.addAuditLog(
            school.id,
            actorUser,
            entry.action || 'SCHOOL_PROFILE_UPDATED',
            entry.details || `Updated profile for ${school.name}`
          );
        }
      } else {
        db.addAuditLog(
          school.id,
          actorUser,
          'SCHOOL_PROFILE_UPDATED',
          `School profile and branding updated for ${school.name}.`
        );
      }
    }

    res.json(school);
  });

  // Complete First-Time Setup Wizard
  app.post('/api/schools/:schoolId/first-time-setup', (req, res) => {
    const { schoolId } = req.params;
    const { actorUser, departments, subjects, grades, staffList } = req.body;

    const school = db.getSchoolById(schoolId);
    if (!school) return res.status(404).json({ error: 'School not found' });

    // Add departments
    if (Array.isArray(departments)) {
      for (const d of departments) {
        db.createDepartment({ schoolId, name: d.name, code: d.code });
      }
    }

    // Add subjects
    if (Array.isArray(subjects)) {
      const existingDepts = db.getDepartments(schoolId);
      const defaultDeptId = existingDepts[0]?.id || 'dept-default';
      for (const s of subjects) {
        db.createSubject({
          schoolId,
          phaseId: s.phaseId || 'ph-foundation',
          departmentId: s.departmentId || defaultDeptId,
          name: s.name,
          code: s.code || `SUB-${s.name.substring(0, 3).toUpperCase()}`,
        });
      }
    }

    // Add grades & classes
    if (Array.isArray(grades)) {
      for (const g of grades) {
        const newGrade = db.createGrade({
          schoolId,
          phaseId: g.phaseId || 'ph-foundation',
          name: g.name,
          code: g.code || `GRD-${g.name.substring(0, 4).toUpperCase()}`,
        });
        if (Array.isArray(g.classes)) {
          for (const cName of g.classes) {
            db.createClass({ schoolId, gradeId: newGrade.id, name: cName });
          }
        }
      }
    }

    // Add staff
    if (Array.isArray(staffList)) {
      for (const st of staffList) {
        db.createUser(
          {
            schoolId,
            fullName: st.fullName,
            email: st.email,
            role: st.role || 'TEACHER',
            status: 'Active',
          },
          st.password || 'password123'
        );
      }
    }

    // Update isFirstLogin = false
    const updatedSchool = db.updateSchool(schoolId, { isFirstLogin: false });

    db.addAuditLog(
      schoolId,
      actorUser || { id: 'setup-user', fullName: 'School Admin', role: 'SCHOOL_ADMIN' },
      'FIRST_TIME_SETUP_COMPLETED',
      `First-time setup wizard completed for ${school.name}. Departments, subjects, grades and staff initialized.`
    );

    res.json({ message: 'First-time setup completed successfully', school: updatedSchool });
  });

  // Get Users for a School (STRICT TENANT ISOLATION)
  app.get('/api/schools/:schoolId/users', (req, res) => {
    const { schoolId } = req.params;
    const users = db.getUsers(schoolId === 'ALL' ? null : schoolId);
    res.json(users);
  });

  // Create User in a School
  app.post('/api/schools/:schoolId/users', (req, res) => {
    const { schoolId } = req.params;
    const { actorUser, fullName, email, role, roles, password, teacherUserId } = req.body;

    if (!fullName || !email || (!role && (!roles || roles.length === 0))) {
      return res.status(400).json({ error: 'Full name, email, and role are required' });
    }

    const roleRanks: Record<string, number> = {
      SUPER_ADMIN: 1,
      SCHOOL_ADMIN: 2,
      PRINCIPAL: 3,
      DEPUTY_PRINCIPAL: 4,
      HOD: 5,
      GRADE_HEAD: 6,
      TEACHER: 7,
      STUDENT: 8,
    };

    const userRoles: string[] = Array.isArray(roles) && roles.length > 0 ? roles : (role ? [role] : ['TEACHER']);
    const sortedRoles = [...userRoles].sort((a, b) => (roleRanks[a] || 99) - (roleRanks[b] || 99));
    const highestAuthorityRole = sortedRoles[0] as any;

    const newUser = db.createUser(
      {
        schoolId,
        fullName,
        email,
        role: highestAuthorityRole,
        roles: userRoles as any,
        teacherUserId: highestAuthorityRole === 'STUDENT' ? teacherUserId : undefined,
        status: 'Active',
      },
      password || 'staff123'
    );

    db.addAuditLog(
      schoolId,
      actorUser || { id: 'sys', fullName: 'School Administrator', role: 'SCHOOL_ADMIN' },
      'USER_CREATED',
      `New user ${fullName} (${highestAuthorityRole}) added to school ${schoolId}. Roles: ${userRoles.join(', ')}.`
    );

    res.status(201).json(newUser);
  });

  // Get Full Academic Structure (Phases, Grades, Subjects, Classes, Curriculum Mappings)
  app.get('/api/schools/:schoolId/academic-structure', (req, res) => {
    const schoolId = req.params.schoolId;
    const includeArchived = req.query.includeArchived === 'true';

    const phases = db.getPhases(schoolId);
    const grades = db.getGrades(schoolId, includeArchived);
    const subjects = db.getSubjects(schoolId, undefined, includeArchived);
    const classes = db.getClasses(schoolId);
    const curriculumMaps = db.getCurriculumMaps(schoolId);

    res.json({
      phases,
      grades,
      subjects,
      classes,
      curriculumMaps,
    });
  });

  // Get Departments
  app.get('/api/schools/:schoolId/departments', (req, res) => {
    res.json(db.getDepartments(req.params.schoolId));
  });

  app.post('/api/schools/:schoolId/departments', (req, res) => {
    const { name, code } = req.body;
    const dept = db.createDepartment({ schoolId: req.params.schoolId, name, code });
    res.status(201).json(dept);
  });

  // Get Subjects
  app.get('/api/schools/:schoolId/subjects', (req, res) => {
    const phaseId = req.query.phaseId as string;
    const includeArchived = req.query.includeArchived === 'true';
    res.json(db.getSubjects(req.params.schoolId, phaseId, includeArchived));
  });

  app.post('/api/schools/:schoolId/subjects', (req, res) => {
    const { phaseId, departmentId, name, code, isCustom } = req.body;
    if (!phaseId || !name || !code) {
      return res.status(400).json({ error: 'Phase ID, Subject Name, and Subject Code are required' });
    }
    const subject = db.createSubject({
      schoolId: req.params.schoolId,
      phaseId,
      departmentId,
      name,
      code,
      isCustom: isCustom ?? true,
    });
    res.status(201).json(subject);
  });

  app.put('/api/schools/:schoolId/subjects/:subjectId', (req, res) => {
    try {
      const subject = db.updateSubject(req.params.schoolId, req.params.subjectId, req.body);
      res.json(subject);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/schools/:schoolId/subjects/:subjectId', (req, res) => {
    const success = db.deleteSubject(req.params.schoolId, req.params.subjectId);
    res.json({ success });
  });

  app.post('/api/schools/:schoolId/subjects/:subjectId/archive', (req, res) => {
    try {
      const subject = db.archiveSubject(req.params.schoolId, req.params.subjectId);
      res.json(subject);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/schools/:schoolId/subjects/:subjectId/restore', (req, res) => {
    try {
      const subject = db.restoreSubject(req.params.schoolId, req.params.subjectId);
      res.json(subject);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get Grades & Classes
  app.get('/api/schools/:schoolId/grades', (req, res) => {
    const includeArchived = req.query.includeArchived === 'true';
    const grades = db.getGrades(req.params.schoolId, includeArchived);
    const classes = db.getClasses(req.params.schoolId);
    res.json({ grades, classes });
  });

  app.post('/api/schools/:schoolId/grades', (req, res) => {
    const { phaseId, name, code } = req.body;
    if (!phaseId || !name) {
      return res.status(400).json({ error: 'Phase ID and Grade Name are required' });
    }
    const grade = db.createGrade({ schoolId: req.params.schoolId, phaseId, name, code });
    res.status(201).json(grade);
  });

  app.put('/api/schools/:schoolId/grades/:gradeId', (req, res) => {
    try {
      const grade = db.updateGrade(req.params.schoolId, req.params.gradeId, req.body);
      res.json(grade);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/schools/:schoolId/grades/:gradeId/archive', (req, res) => {
    try {
      const grade = db.archiveGrade(req.params.schoolId, req.params.gradeId);
      res.json(grade);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/schools/:schoolId/grades/:gradeId/restore', (req, res) => {
    try {
      const grade = db.restoreGrade(req.params.schoolId, req.params.gradeId);
      res.json(grade);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Curriculum Mapping Toggle Endpoint
  app.post('/api/schools/:schoolId/curriculum-map/toggle', (req, res) => {
    const { phaseId, subjectId, gradeId } = req.body;
    if (!phaseId || !subjectId || !gradeId) {
      return res.status(400).json({ error: 'phaseId, subjectId, and gradeId are required' });
    }
    const isMapped = db.toggleGradeForSubject(req.params.schoolId, phaseId, subjectId, gradeId);
    res.json({ isMapped, curriculumMaps: db.getCurriculumMaps(req.params.schoolId) });
  });

  // Teaching Assignments
  app.get('/api/schools/:schoolId/teaching-assignments', (req, res) => {
    const teacherUserId = req.query.teacherUserId as string;
    const assignments = db.getTeachingAssignments(req.params.schoolId, teacherUserId);
    res.json(assignments);
  });

  app.post('/api/schools/:schoolId/teaching-assignments', (req, res) => {
    const { teacherUserId, phaseId, gradeId, classId, subjectId, academicYear } = req.body;
    if (!teacherUserId || !phaseId || !gradeId || !classId || !subjectId) {
      return res.status(400).json({ error: 'Teacher, Phase, Grade, Class Section, and Subject are required' });
    }
    const assignment = db.createTeachingAssignment(req.params.schoolId, {
      teacherUserId,
      phaseId,
      gradeId,
      classId,
      subjectId,
      academicYear: academicYear || '2026',
    });
    res.status(201).json(assignment);
  });

  app.delete('/api/schools/:schoolId/teaching-assignments/:assignmentId', (req, res) => {
    const success = db.deleteTeachingAssignment(req.params.schoolId, req.params.assignmentId);
    res.json({ success });
  });

  // HOD Grade Assignments
  app.get('/api/schools/:schoolId/hod-grade-assignments', (req, res) => {
    const hodUserId = req.query.hodUserId as string;
    res.json(db.getHodGradeAssignments(req.params.schoolId, hodUserId));
  });

  app.post('/api/schools/:schoolId/hod-grade-assignments', (req, res) => {
    const { hodUserId, gradeIds } = req.body;
    if (!hodUserId || !Array.isArray(gradeIds)) {
      return res.status(400).json({ error: 'hodUserId and gradeIds array are required' });
    }
    const assignments = db.setHodGradeAssignments(req.params.schoolId, hodUserId, gradeIds);
    res.json(assignments);
  });

  // Flexible Academic Assignments
  app.get('/api/schools/:schoolId/academic-assignments', (req, res) => {
    const { userId, role, gradeId } = req.query;
    const list = db.getAcademicAssignments(
      req.params.schoolId,
      userId as string,
      role as string,
      gradeId as string
    );
    res.json(list);
  });

  app.post('/api/schools/:schoolId/academic-assignments', (req, res) => {
    const { userId, role, gradeId, subjectId, academicYear, status, userName, gradeName, subjectName } = req.body;
    if (!userId || !role || !gradeId) {
      return res.status(400).json({ error: 'userId, role, and gradeId are required' });
    }
    const assignment = db.createAcademicAssignment(req.params.schoolId, {
      userId,
      role,
      gradeId,
      subjectId: subjectId || 'ALL',
      academicYear: academicYear || '2026',
      status: status || 'Active',
      userName,
      gradeName,
      subjectName,
    });
    res.status(201).json(assignment);
  });

  app.delete('/api/schools/:schoolId/academic-assignments/:id', (req, res) => {
    const success = db.deleteAcademicAssignment(req.params.schoolId, req.params.id);
    res.json({ success });
  });

  // HOD Phase Assignments
  app.get('/api/schools/:schoolId/hod-phase-assignments', (req, res) => {
    const hodUserId = req.query.hodUserId as string;
    res.json(db.getHodPhaseAssignments(req.params.schoolId, hodUserId));
  });

  app.post('/api/schools/:schoolId/hod-phase-assignments', (req, res) => {
    const { hodUserId, phaseIds } = req.body;
    if (!hodUserId || !Array.isArray(phaseIds)) {
      return res.status(400).json({ error: 'hodUserId and phaseIds array are required' });
    }
    const assignments = db.setHodPhaseAssignments(req.params.schoolId, hodUserId, phaseIds);
    res.json(assignments);
  });

  // Assessment Workspaces
  app.get('/api/schools/:schoolId/assessment-workspaces', (req, res) => {
    const { phaseId, gradeId, subjectId, teacherUserId } = req.query;
    const list = db.getAssessmentWorkspaces(req.params.schoolId, {
      phaseId: phaseId as string,
      gradeId: gradeId as string,
      subjectId: subjectId as string,
      teacherUserId: teacherUserId as string,
    });
    res.json(list);
  });

  app.post('/api/schools/:schoolId/assessment-workspaces', (req, res) => {
    const { phaseId, gradeId, subjectId, term, title, teacherUserId } = req.body;
    if (!phaseId || !gradeId || !subjectId || !term || !title || !teacherUserId) {
      return res.status(400).json({ error: 'Missing required assessment workspace fields' });
    }
    const workspace = db.createAssessmentWorkspace(req.params.schoolId, {
      phaseId,
      gradeId,
      subjectId,
      term,
      title,
      status: 'Draft',
      teacherUserId,
    });
    res.status(201).json(workspace);
  });

  app.patch('/api/schools/:schoolId/assessment-workspaces/:workspaceId/status', (req, res) => {
    const { status, hodUserId, actorUser } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    try {
      const updated = db.updateAssessmentWorkspaceStatus(req.params.schoolId, req.params.workspaceId, status, hodUserId);
      if (actorUser) {
        db.addAuditLog(
          req.params.schoolId,
          actorUser,
          `ASSESSMENT_${status.toUpperCase().replace(/\s+/g, '_')}`,
          `Assessment "${updated.title}" status changed to ${status} by ${actorUser.fullName} (${actorUser.role}).`
        );
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/schools/:schoolId/assessment-workspaces/:workspaceId', (req, res) => {
    try {
      const updated = db.updateAssessmentWorkspace(req.params.schoolId, req.params.workspaceId, req.body.updates || req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/schools/:schoolId/assessment-workspaces/:workspaceId', (req, res) => {
    const actorUser = req.body?.actorUser;
    const success = db.deleteAssessmentWorkspace(req.params.schoolId, req.params.workspaceId, actorUser);
    res.json({ success });
  });

  // Toggle Disable/Enable School (Super Admin only)
  app.post('/api/schools/:schoolId/disable', (req, res) => {
    const { status, actorUser } = req.body;
    if (!status || (status !== 'Active' && status !== 'Disabled')) {
      return res.status(400).json({ error: 'Valid status ("Active" or "Disabled") is required' });
    }
    try {
      const school = db.toggleSchoolStatus(req.params.schoolId, status, actorUser);
      res.json(school);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Knowledge Hub Resources
  app.get('/api/schools/:schoolId/knowledge-resources', (req, res) => {
    res.json(db.getKnowledgeResources(req.params.schoolId));
  });

  app.post('/api/schools/:schoolId/knowledge-resources', (req, res) => {
    try {
      const { actorUser, ...payload } = req.body;
      const resource = db.createKnowledgeResource(req.params.schoolId, payload, actorUser);
      res.status(201).json(resource);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create knowledge resource' });
    }
  });

  app.delete('/api/schools/:schoolId/knowledge-resources/:resourceId', (req, res) => {
    const actorUser = req.body?.actorUser;
    const success = db.deleteKnowledgeResource(req.params.schoolId, req.params.resourceId, actorUser);
    res.json({ success });
  });

  // Audit Logs (Isolated per school or global for Super Admin)
  app.get('/api/audit-logs', (req, res) => {
    const schoolId = req.query.schoolId as string;
    const logs = db.getAuditLogs(schoolId === 'PLATFORM' ? null : schoolId);
    res.json(logs);
  });

  // Platform Super Admin: Switch School Tenant Context Inspection
  app.post('/api/platform/switch-school', (req, res) => {
    const { actorUser, targetSchoolId } = req.body;
    const targetSchool = db.getSchoolById(targetSchoolId);

    if (!targetSchool) {
      return res.status(404).json({ error: 'Target school not found' });
    }

    db.addAuditLog(
      targetSchoolId,
      actorUser,
      'SUPER_ADMIN_SWITCH_CONTEXT',
      `Platform Super Admin ${actorUser.fullName} switched context to inspect ${targetSchool.name} (${targetSchool.id}).`
    );

    res.json({ message: 'Context switched successfully', targetSchool });
  });

  // Gemini AI Assistant Endpoint for School Curriculum/Setup Suggestions
  app.post('/api/ai/suggest-curriculum', async (req, res) => {
    const { schoolType, country } = req.body;
    if (!ai) {
      // Fallback response if API key is not set
      return res.json({
        departments: [
          { name: 'Mathematics & STEM', code: 'STEM' },
          { name: 'Humanities & Social Sciences', code: 'HUM' },
          { name: 'Languages & Literature', code: 'LANG' },
          { name: 'Creative Arts & Performance', code: 'ARTS' },
        ],
        subjects: [
          { name: 'Algebra & Calculus', code: 'MATH-101' },
          { name: 'Physics & Chemistry', code: 'SCI-201' },
          { name: 'English Literature', code: 'ENG-101' },
          { name: 'World History', code: 'HIST-101' },
        ],
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a structured list of 4 recommended departments and 6 foundational subjects for a ${schoolType || 'High School'} located in ${country || 'International'}.
Return JSON strictly in this format:
{
  "departments": [{"name": "Department Name", "code": "DEPT"}],
  "subjects": [{"name": "Subject Name", "code": "SUBJ-101"}]
}`,
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (err) {
      console.error('Gemini curriculum suggestion error:', err);
      res.json({
        departments: [
          { name: 'Mathematics', code: 'MATH' },
          { name: 'Natural Sciences', code: 'SCI' },
          { name: 'Languages', code: 'LANG' },
        ],
        subjects: [
          { name: 'General Mathematics', code: 'MATH-10' },
          { name: 'Physical Science', code: 'SCI-10' },
          { name: 'English Language', code: 'ENG-10' },
        ],
      });
    }
  });

  // --- VITE MIDDLEWARE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`School Assessment Management Platform running on http://localhost:${PORT}`);
  });
}

startServer();
