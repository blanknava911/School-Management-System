import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/dbStore.js';
import { GoogleGenAI } from '@google/genai';
import * as XLSX from 'xlsx';
import { createWorker } from 'tesseract.js';
import engData from '@tesseract.js-data/eng';
import { PDFParse } from 'pdf-parse';
import { randomBytes } from 'crypto';
import { User } from './src/types.js';
import {
  downloadSchoolFile,
  getFirebaseServices,
  loadPlatformState,
  savePlatformState,
  uploadSchoolFile,
} from './src/server/firebaseAdmin.js';

const __dirname = process.cwd();

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function startServer() {
  const firebase = getFirebaseServices();
  if (firebase) await db.configureRemotePersistence(loadPlatformState, savePlatformState);
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  const sessions = new Map<string, { userId: string; expiresAt: number }>();
  const loginAttempts = new Map<string, { attempts: number; resetAt: number }>();
  const sessionDurationMs = 8 * 60 * 60 * 1000;
  const getUserById = (userId: string) => db.getUsers(null).find(user => user.id === userId);
  const getActor = (req: express.Request) => (req as express.Request & { authUser?: User }).authUser!;
  const issueSession = (user: User) => {
    const token = randomBytes(32).toString('base64url');
    sessions.set(token, { userId: user.id, expiresAt: Date.now() + sessionDurationMs });
    return token;
  };
  const revokeUserSessions = async (user: User) => {
    for (const [token, session] of sessions) if (session.userId === user.id) sessions.delete(token);
    if (firebase && user.firebaseUid) await firebase.auth.revokeRefreshTokens(user.firebaseUid).catch(() => undefined);
  };
  const requireRoles = (...roles: User['role'][]) => (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const actor = getActor(req);
    if (!actor || !roles.includes(actor.role)) return res.status(403).json({ error: 'Access denied.' });
    next();
  };

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const rateKey = `${req.ip}:${String(email || '').trim().toLowerCase()}`;
    const now = Date.now();
    const attempt = loginAttempts.get(rateKey);
    if (attempt && attempt.resetAt > now && attempt.attempts >= 5) {
      return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
    }
    console.log(`[Server /api/auth/login] Auth attempt received for email: "${email}"`);

    if (!email || !password) {
      console.warn('[Server /api/auth/login] Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = db.getUserByEmail(email);
    if (!result) {
      loginAttempts.set(rateKey, { attempts: (attempt?.resetAt || 0) > now ? attempt!.attempts + 1 : 1, resetAt: now + 15 * 60 * 1000 });
      console.warn(`[Server /api/auth/login] User lookup failed for email: "${email}"`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { user, passwordHash } = result;
    const isPasswordValid = db.verifyPassword(user, password, passwordHash);

    if (!isPasswordValid) {
      loginAttempts.set(rateKey, { attempts: (attempt?.resetAt || 0) > now ? attempt!.attempts + 1 : 1, resetAt: now + 15 * 60 * 1000 });
      console.warn(`[Server /api/auth/login] Password verification failed for user: ${user.email}`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'This account is disabled. Please contact your school administrator.' });
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
    loginAttempts.delete(rateKey);

    console.log(`[Server /api/auth/login] LOGIN SUCCESSFUL: ${user.fullName} (${user.role}) @ ${school ? school.name : 'Platform Super Admin'}`);

    res.json({
      user,
      school,
      token: issueSession(user)
    });
  });

  app.post('/api/auth/firebase-session', async (req, res) => {
    if (!firebase) return res.status(503).json({ error: 'Firebase authentication is not configured.' });
    const idToken = String(req.body.idToken || '');
    if (!idToken) return res.status(400).json({ error: 'Firebase ID token is required.' });
    try {
      const decoded = await firebase.auth.verifyIdToken(idToken, true);
      const result = decoded.email ? db.getUserByEmail(decoded.email) : null;
      if (!result || result.user.status !== 'Active') return res.status(403).json({ error: 'This account is not active on the platform.' });
      const user = db.updateUser(result.user.id, result.user.schoolId, { firebaseUid: decoded.uid }) || result.user;
      const school = user.schoolId ? db.getSchoolById(user.schoolId) : null;
      if (school && (school.status as string) === 'Disabled' && user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'This school account is disabled.' });
      db.addAuditLog(user.schoolId, user, 'USER_LOGIN', `${user.fullName} logged in with Firebase Authentication.`);
      res.json({ user, school, token: idToken });
    } catch {
      res.status(401).json({ error: 'The Firebase session is invalid or has been revoked.' });
    }
  });

  app.use('/api', async (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    const session = token ? sessions.get(token) : undefined;
    let actor = session && session.expiresAt > Date.now() ? getUserById(session.userId) : undefined;
    if (!actor && firebase && token) {
      try {
        const decoded = await firebase.auth.verifyIdToken(token, true);
        actor = db.getUsers(null).find(user => user.firebaseUid === decoded.uid || (!!decoded.email && user.email.toLowerCase() === decoded.email.toLowerCase()));
      } catch { /* handled below */ }
    }
    if (!actor || actor.status !== 'Active') {
      if (token) sessions.delete(token);
      return res.status(401).json({ error: 'Authentication required or session revoked.' });
    }
    const actorSchool = actor.schoolId ? db.getSchoolById(actor.schoolId) : null;
    if (actorSchool && (actorSchool.status as string) === 'Disabled' && actor.role !== 'SUPER_ADMIN') {
      sessions.delete(token);
      return res.status(403).json({ error: 'This school account is disabled.' });
    }
    (req as express.Request & { authUser?: User }).authUser = actor;
    next();
  });

  app.use('/api/schools/:schoolId', (req, res, next) => {
    const actor = getActor(req);
    const schoolId = req.params.schoolId;
    if (actor.role !== 'SUPER_ADMIN' && actor.schoolId !== schoolId) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    next();
  });

  app.use('/api/schools/:schoolId', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const academicManagementPath = /\/(departments|subjects|grades|curriculum-map|teaching-assignments|hod-grade-assignments|academic-assignments|hod-phase-assignments)(\/|\?|$)/;
    if (!academicManagementPath.test(req.originalUrl)) return next();
    const actor = getActor(req);
    const allowed = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'HOD'];
    if (!allowed.includes(actor.role)) return res.status(403).json({ error: 'Access denied.' });
    next();
  });

  const marksImportRoot = path.join(process.cwd(), 'data', 'mark-imports');
  const uploadedFilesRoot = path.join(process.cwd(), 'data', 'uploaded-files');
  const decodeUpload = (fileName: unknown, dataBase64: unknown) => {
    if (!fileName || !dataBase64) throw new Error('Choose a file to upload.');
    const data = Buffer.from(String(dataBase64), 'base64');
    if (!data.length) throw new Error('The selected file is empty.');
    if (data.length > 15 * 1024 * 1024) throw new Error('The file must be 15 MB or smaller.');
    return data;
  };
  const saveUploadedFile = async (schoolId: string, category: 'knowledge' | 'assessments', objectId: string, fileName: string, mimeType: string, data: Buffer) => {
    const remotePath = await uploadSchoolFile(schoolId, category, objectId, fileName, mimeType, data);
    if (remotePath) return remotePath;
    const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
    const relativePath = path.join(schoolId, category, objectId, safeName);
    const absolutePath = path.join(uploadedFilesRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, data);
    return relativePath.replace(/\\/g, '/');
  };
  const sendUploadedFile = async (res: express.Response, objectPath: string, downloadName: string, mimeType?: string) => {
    const remote = await downloadSchoolFile(objectPath);
    if (remote) {
      res.type(remote.contentType).attachment(downloadName).send(remote.data);
      return;
    }
    const absolutePath = path.resolve(uploadedFilesRoot, objectPath);
    if (!absolutePath.startsWith(path.resolve(uploadedFilesRoot)) || !fs.existsSync(absolutePath)) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }
    if (mimeType) res.type(mimeType);
    res.download(absolutePath, downloadName);
  };
  const leadershipRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'HOD'];
  const canAccessWorkspace = (actor: User, workspace: { schoolId: string; teacherUserId: string }) =>
    actor.role === 'SUPER_ADMIN' ||
    (actor.schoolId === workspace.schoolId && (leadershipRoles.includes(actor.role) || workspace.teacherUserId === actor.id));
  const canManageAssignment = (actorUserId: string, schoolId: string, assignmentId: string) => {
    const actor = getUserById(actorUserId);
    const assignment = db.getTeachingAssignments(schoolId).find(item => item.id === assignmentId);
    if (!actor || !assignment) return false;
    if (actor.role === 'SUPER_ADMIN') return true;
    if (actor.schoolId !== schoolId) return false;
    return leadershipRoles.includes(actor.role) || assignment.teacherUserId === actor.id;
  };
  const normaliseName = (value: unknown) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const extractRowValue = (row: Record<string, unknown>, candidates: string[]) => {
    const key = Object.keys(row).find(item => candidates.includes(normaliseName(item)));
    return key ? row[key] : undefined;
  };
  const extractSpreadsheetRows = (buffer: Buffer) => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }).map(row => ({
      admissionNumber: String(extractRowValue(row, ['admissionnumber', 'studentnumber', 'learnernumber', 'id']) || ''),
      name: String(extractRowValue(row, ['name', 'student', 'studentname', 'learner', 'learnername', 'fullname']) || ''),
      score: Number(extractRowValue(row, ['score', 'mark', 'marks', 'result', 'points'])),
    })).filter(row => row.name || row.admissionNumber);
  };
  const extractRowsFromText = (text: string) => text.split(/\r?\n/).map(line => line.trim()).map(line => {
    const markMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*\d+)?\s*$/);
    if (!markMatch) return null;
    const prefix = line.slice(0, markMatch.index).replace(/[|,:;]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!prefix || /^(student|learner)?\s*name$/i.test(prefix) || /^(total|average)$/i.test(prefix)) return null;
    const admissionMatch = prefix.match(/\b[A-Z0-9-]{4,}\b/i);
    return { admissionNumber: admissionMatch?.[0] || '', name: prefix, score: Number(markMatch[1]) };
  }).filter((row): row is { admissionNumber: string; name: string; score: number } => Boolean(row));

  const recogniseImage = async (image: Buffer) => {
    const worker = await createWorker('eng', 1, { langPath: engData.langPath, gzip: engData.gzip });
    try {
      return (await worker.recognize(image)).data.text;
    } finally {
      await worker.terminate();
    }
  };

  const extractDocumentRows = async (buffer: Buffer, extension: string) => {
    if (['.xlsx', '.xls', '.csv'].includes(extension)) {
      return { rows: extractSpreadsheetRows(buffer), method: 'spreadsheet' };
    }
    if (extension === '.pdf') {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const textResult = await parser.getText({ cellSeparator: ' ', pageJoiner: '\n' });
        let rows = extractRowsFromText(textResult.text);
        if (rows.length > 0) return { rows, method: 'pdf-text' };
        const screenshots = await parser.getScreenshot({ desiredWidth: 1600, imageBuffer: true });
        const worker = await createWorker('eng', 1, { langPath: engData.langPath, gzip: engData.gzip });
        try {
          const pageTexts: string[] = [];
          for (const page of screenshots.pages) pageTexts.push((await worker.recognize(Buffer.from(page.data))).data.text);
          rows = extractRowsFromText(pageTexts.join('\n'));
          return { rows, method: 'local-pdf-ocr' };
        } finally {
          await worker.terminate();
        }
      } finally {
        await parser.destroy();
      }
    }
    return { rows: extractRowsFromText(await recogniseImage(buffer)), method: 'local-image-ocr' };
  };

  // School Registration Wizard Endpoint
  app.post('/api/schools/register', requireRoles('SUPER_ADMIN'), (req, res) => {
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
      db.initializePrimarySchoolAcademicStructure(newSchool.id);

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
        token: null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to register school' });
    }
  });

  // Get Schools List (Super Admin or Public Selection)
  app.get('/api/schools', requireRoles('SUPER_ADMIN'), (req, res) => {
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
  app.put('/api/schools/:schoolId', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'), (req, res) => {
    const { updates, auditEntries } = req.body;
    const actorUser = getActor(req);
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
  app.post('/api/schools/:schoolId/first-time-setup', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
    const { schoolId } = req.params;
    const { departments, subjects, grades, staffList } = req.body;
    const actorUser = getActor(req);

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
      const existingHod = db.getUsers(schoolId).find(user => (user.roles || [user.role]).includes('HOD'));
      const includesTeacher = staffList.some(staff => (staff.roles || [staff.role || 'TEACHER']).includes('TEACHER'));
      const includesHod = staffList.some(staff => (staff.roles || [staff.role]).includes('HOD'));
      if (includesTeacher && !existingHod && !includesHod) {
        return res.status(400).json({ error: 'Add a Departmental Head before adding teachers.' });
      }
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
      const defaultHod = db.getUsers(schoolId).find(user => user.status === 'Active' && (user.roles || [user.role]).includes('HOD'));
      if (defaultHod) {
        for (const teacher of db.getUsers(schoolId).filter(user => (user.roles || [user.role]).includes('TEACHER') && !user.hodUserId)) {
          db.updateUser(teacher.id, schoolId, { hodUserId: defaultHod.id });
        }
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
  app.get('/api/schools/:schoolId/users', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'HOD'), (req, res) => {
    const { schoolId } = req.params;
    const users = db.getUsers(schoolId === 'ALL' ? null : schoolId);
    res.json(users);
  });

  // Create User in a School
  app.post('/api/schools/:schoolId/users', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'), (req, res) => {
    const { schoolId } = req.params;
    const { fullName, email, role, roles, password, hodUserId } = req.body;
    const actorUser = getActor(req);

    if (!fullName || !email || !password || (!role && (!roles || roles.length === 0))) {
      return res.status(400).json({ error: 'Full name, email, password, and role are required' });
    }
    if (String(password).length < 12) {
      return res.status(400).json({ error: 'Passwords must contain at least 12 characters.' });
    }
    if (db.getUserByEmail(email)) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const roleRanks: Record<string, number> = {
      SUPER_ADMIN: 1,
      SCHOOL_ADMIN: 2,
      PRINCIPAL: 3,
      DEPUTY_PRINCIPAL: 4,
      HOD: 5,
      TEACHER: 6,
    };

    const userRoles: string[] = Array.isArray(roles) && roles.length > 0 ? roles : (role ? [role] : ['TEACHER']);
    const validRoles = Object.keys(roleRanks);
    if (userRoles.some(item => !validRoles.includes(item))) return res.status(400).json({ error: 'Invalid role selection.' });
    if (userRoles.includes('SUPER_ADMIN') && actorUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only a Platform Super Admin can assign that role.' });
    }
    if (userRoles.includes('SCHOOL_ADMIN') && !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(actorUser.role)) {
      return res.status(403).json({ error: 'Only a School Administrator can assign that role.' });
    }
    const sortedRoles = [...userRoles].sort((a, b) => (roleRanks[a] || 99) - (roleRanks[b] || 99));
    const highestAuthorityRole = sortedRoles[0] as any;
    if (userRoles.includes('TEACHER')) {
      const hod = db.getUsers(schoolId).find(user => user.id === hodUserId && getUserById(user.id)?.status === 'Active' && (user.role === 'HOD' || user.roles?.includes('HOD')));
      if (!hod) return res.status(400).json({ error: 'Every teacher must be assigned to an active Departmental Head.' });
    }

    const newUser = db.createUser(
      {
        schoolId,
        fullName,
        email,
        role: highestAuthorityRole,
        roles: userRoles as any,
        hodUserId: userRoles.includes('TEACHER') ? hodUserId : undefined,
        createdByUserId: actorUser.id,
        status: 'Active',
      },
      password
    );

    db.addAuditLog(
      schoolId,
      actorUser || { id: 'sys', fullName: 'School Administrator', role: 'SCHOOL_ADMIN' },
      'USER_CREATED',
      `New user ${fullName} (${highestAuthorityRole}) added to school ${schoolId}. Roles: ${userRoles.join(', ')}.`
    );

    res.status(201).json(newUser);
  });

  app.put('/api/schools/:schoolId/users/:userId', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'), async (req, res) => {
    const actor = getActor(req);
    const target = db.getUsers(req.params.schoolId).find(user => user.id === req.params.userId);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    const { fullName, email, password, roles, role, hodUserId, status, tutorialCompletedAt } = req.body;
    if (password && String(password).length < 12) return res.status(400).json({ error: 'Passwords must contain at least 12 characters.' });
    const selectedRoles = Array.isArray(roles) && roles.length ? roles : (role ? [role] : target.roles || [target.role]);
    if (selectedRoles.includes('SUPER_ADMIN') && actor.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Only a Platform Super Admin can assign that role.' });
    if (selectedRoles.includes('TEACHER')) {
      const hod = db.getUsers(req.params.schoolId).find(user => user.id === hodUserId && user.status === 'Active' && (user.role === 'HOD' || user.roles?.includes('HOD')));
      if (!hod) return res.status(400).json({ error: 'Every teacher must be assigned to an active Departmental Head.' });
    }
    try {
      const roleRanks: Record<string, number> = { SUPER_ADMIN: 1, SCHOOL_ADMIN: 2, PRINCIPAL: 3, DEPUTY_PRINCIPAL: 4, HOD: 5, TEACHER: 6 };
      const highestRole = [...selectedRoles].sort((a, b) => (roleRanks[a] || 99) - (roleRanks[b] || 99))[0];
      const updated = db.updateUserCredentials(target.id, target.schoolId, {
        fullName: fullName ?? target.fullName,
        email: email ?? target.email,
        roles: selectedRoles,
        role: highestRole,
        hodUserId: selectedRoles.includes('TEACHER') ? hodUserId : undefined,
        status: status ?? target.status,
        tutorialCompletedAt: tutorialCompletedAt ?? target.tutorialCompletedAt,
      }, password);
      if (!updated) return res.status(404).json({ error: 'User not found.' });
      if (password || status === 'Disabled') await revokeUserSessions(updated);
      db.addAuditLog(req.params.schoolId, actor, 'USER_UPDATED', `${target.fullName}'s account details were updated by ${actor.fullName}.`);
      res.json(updated);
    } catch (error: any) {
      res.status(409).json({ error: error.message || 'Could not update this account.' });
    }
  });

  app.post('/api/schools/:schoolId/hod-replacement', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'), (req, res) => {
    const { outgoingHodUserId, replacementHodUserId } = req.body;
    const users = db.getUsers(req.params.schoolId);
    const isHod = (id: string) => users.some(user => user.id === id && (user.role === 'HOD' || user.roles?.includes('HOD')));
    if (!outgoingHodUserId || !replacementHodUserId || outgoingHodUserId === replacementHodUserId || !isHod(outgoingHodUserId) || !isHod(replacementHodUserId)) {
      return res.status(400).json({ error: 'Choose two different valid Departmental Heads.' });
    }
    const result = db.replaceHod(req.params.schoolId, outgoingHodUserId, replacementHodUserId);
    db.addAuditLog(req.params.schoolId, getActor(req), 'HOD_REPLACED', `${result.teachersTransferred} teacher assignments transferred to the replacement Departmental Head.`);
    res.json(result);
  });

  app.patch(
    '/api/schools/:schoolId/users/:userId/status',
    requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'),
    (req, res) => {
      const actor = getActor(req);
      const { status } = req.body;
      if (!['Active', 'Disabled'].includes(status)) {
        return res.status(400).json({ error: 'Status must be Active or Disabled.' });
      }
      const target = db.getUsers(req.params.schoolId).find(user => user.id === req.params.userId);
      if (!target) return res.status(404).json({ error: 'User not found.' });
      if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied.' });
      }
      if (target.id === actor.id && status === 'Disabled') {
        return res.status(409).json({ error: 'You cannot disable your own active session.' });
      }
      const updated = db.updateUser(target.id, target.schoolId, { status });
      db.addAuditLog(req.params.schoolId, actor, status === 'Disabled' ? 'USER_DISABLED' : 'USER_ENABLED', `${target.fullName} was ${status.toLowerCase()} by ${actor.fullName}.`);
      res.json(updated);
    }
  );

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

  app.post('/api/schools/:schoolId/grades', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'), (req, res) => {
    const { phaseId, name, code } = req.body;
    if (!phaseId || !name) {
      return res.status(400).json({ error: 'Phase ID and Grade Name are required' });
    }
    const grade = db.createGrade({ schoolId: req.params.schoolId, phaseId, name, code });
    res.status(201).json(grade);
  });

  app.post('/api/schools/:schoolId/grades/:gradeId/classes', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'), (req, res) => {
    try {
      const { schoolId, gradeId } = req.params;
      const actor = getActor(req);
      const grade = db.getGrades(schoolId, true).find(item => item.id === gradeId);
      if (!grade) return res.status(404).json({ error: 'Grade not found.' });
      if (grade.isArchived) return res.status(409).json({ error: 'Restore this grade before adding class sections.' });

      const rawName = String(req.body.name || '').trim();
      if (!rawName) return res.status(400).json({ error: 'Class section name is required.' });
      const className = /^[A-Za-z]$/.test(rawName) ? `${grade.name}${rawName.toUpperCase()}` : rawName;
      const duplicate = db.getClasses(schoolId).some(
        item => item.gradeId === gradeId && item.name.toLowerCase() === className.toLowerCase()
      );
      if (duplicate) return res.status(409).json({ error: `${className} already exists for ${grade.name}.` });

      const schoolClass = db.createClass({ schoolId, gradeId, name: className });
      db.addAuditLog(
        schoolId,
        actor,
        'CLASS_SECTION_CREATED',
        `${actor.fullName} added class section ${className} to ${grade.name}.`
      );
      res.status(201).json({ class: schoolClass, classes: db.getClasses(schoolId) });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create class section.' });
    }
  });

  app.put('/api/schools/:schoolId/grades/:gradeId', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'), (req, res) => {
    try {
      const grade = db.updateGrade(req.params.schoolId, req.params.gradeId, req.body);
      res.json(grade);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/schools/:schoolId/grades/:gradeId/archive', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'), (req, res) => {
    try {
      const grade = db.archiveGrade(req.params.schoolId, req.params.gradeId);
      res.json(grade);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/schools/:schoolId/grades/:gradeId/restore', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'), (req, res) => {
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

  // Student records are roster data, not login accounts.
  app.get('/api/schools/:schoolId/students', (req, res) => {
    const assignmentId = String(req.query.assignmentId || '');
    const actorUserId = getActor(req).id;
    if (!assignmentId || !canManageAssignment(actorUserId, req.params.schoolId, assignmentId)) {
      return res.status(403).json({ error: 'You do not have access to this class roster.' });
    }
    const assignment = db.getTeachingAssignments(req.params.schoolId).find(item => item.id === assignmentId)!;
    res.json(db.getStudents(req.params.schoolId, assignment.classId));
  });

  app.post('/api/schools/:schoolId/students', (req, res) => {
    const { assignmentId, admissionNumber, fullName, guardianName, guardianContact } = req.body;
    const actorUserId = getActor(req).id;
    if (!canManageAssignment(actorUserId, req.params.schoolId, String(assignmentId || ''))) {
      return res.status(403).json({ error: 'You cannot add students to this class.' });
    }
    if (!admissionNumber || !fullName) return res.status(400).json({ error: 'Admission number and full name are required.' });
    const assignment = db.getTeachingAssignments(req.params.schoolId).find(item => item.id === assignmentId)!;
    try {
      const student = db.createStudent(req.params.schoolId, {
        admissionNumber: String(admissionNumber).trim(),
        fullName: String(fullName).trim(),
        gradeId: assignment.gradeId,
        classId: assignment.classId,
        guardianName,
        guardianContact,
        status: 'Active',
      });
      res.status(201).json(student);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/schools/:schoolId/students/:studentId', (req, res) => {
    const { actorUserId: _ignoredActorUserId, assignmentId, ...updates } = req.body;
    const actorUserId = getActor(req).id;
    if (!canManageAssignment(actorUserId, req.params.schoolId, String(assignmentId || ''))) {
      return res.status(403).json({ error: 'You cannot edit this class roster.' });
    }
    try {
      res.json(db.updateStudent(req.params.schoolId, req.params.studentId, updates));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/schools/:schoolId/students/:studentId', (req, res) => {
    const actorUserId = getActor(req).id;
    const assignmentId = String(req.query.assignmentId || '');
    if (!canManageAssignment(actorUserId, req.params.schoolId, assignmentId)) {
      return res.status(403).json({ error: 'You cannot remove students from this class.' });
    }
    const assignment = db.getTeachingAssignments(req.params.schoolId).find(item => item.id === assignmentId)!;
    const student = db.getStudents(req.params.schoolId, assignment.classId).find(item => item.id === req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student was not found in this class.' });
    const success = db.deleteStudent(req.params.schoolId, req.params.studentId);
    db.addAuditLog(req.params.schoolId, getActor(req), 'STUDENT_REMOVED', `${student.fullName} was removed from ${assignment.className || 'the class'} and linked marks were removed.`);
    res.json({ success });
  });

  app.get('/api/schools/:schoolId/student-marks', (req, res) => {
    const assignmentId = String(req.query.assignmentId || '');
    const actorUserId = getActor(req).id;
    if (!canManageAssignment(actorUserId, req.params.schoolId, assignmentId)) {
      return res.status(403).json({ error: 'You cannot view marks for this assignment.' });
    }
    res.json(db.getStudentMarks(req.params.schoolId, { teachingAssignmentId: assignmentId }));
  });

  app.post('/api/schools/:schoolId/marks-import/analyse', async (req, res) => {
    const { assignmentId, fileName, mimeType, dataBase64 } = req.body;
    const actorUserId = getActor(req).id;
    const schoolId = req.params.schoolId;
    if (!canManageAssignment(actorUserId, schoolId, String(assignmentId || ''))) {
      return res.status(403).json({ error: 'You cannot import marks for this assignment.' });
    }
    if (!fileName || !dataBase64) return res.status(400).json({ error: 'Choose a PDF, image, CSV, or Excel file.' });
    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.length > 15 * 1024 * 1024) return res.status(413).json({ error: 'The file must be 15 MB or smaller.' });

    const assignment = db.getTeachingAssignments(schoolId).find(item => item.id === assignmentId)!;
    const roster = db.getStudents(schoolId, assignment.classId);
    const extension = path.extname(String(fileName)).toLowerCase();
    let extracted: Array<{ admissionNumber?: string; name?: string; score?: number }> = [];
    let extractionMethod = 'manual-review';
    try {
      const extraction = await extractDocumentRows(buffer, extension);
      extracted = extraction.rows;
      extractionMethod = extraction.method;
    } catch (err: any) {
      console.error('[marks-import] Local extraction failed:', err);
      extractionMethod = 'manual-review';
    }

    const importId = `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const schoolDir = path.join(marksImportRoot, schoolId);
    fs.mkdirSync(schoolDir, { recursive: true });
    const safeExtension = extension.replace(/[^.a-z0-9]/gi, '').slice(0, 10);
    const storedName = `${importId}${safeExtension}`;
    fs.writeFileSync(path.join(schoolDir, storedName), buffer);
    const objectPath = await uploadSchoolFile(schoolId, 'marks-imports', importId, String(fileName), String(mimeType || ''), buffer);
    const manifest = { importId, schoolId, assignmentId, actorUserId, fileName: path.basename(fileName), mimeType, storedName, size: buffer.length, objectPath };
    fs.writeFileSync(path.join(schoolDir, `${importId}.json`), JSON.stringify(manifest, null, 2), 'utf8');

    const reviewRows = roster.map(student => {
      const match = extracted.find(row =>
        (row.admissionNumber && normaliseName(row.admissionNumber) === normaliseName(student.admissionNumber)) ||
        (row.name && (normaliseName(row.name).includes(normaliseName(student.fullName)) || normaliseName(student.fullName).includes(normaliseName(row.name))))
      );
      const score = match && Number.isFinite(Number(match.score)) ? Number(match.score) : null;
      return {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        studentName: student.fullName,
        extractedName: match?.name,
        score,
        confidence: match ? (score === null ? 0.55 : extractionMethod === 'spreadsheet' ? 0.98 : 0.78) : 0,
        status: match && score !== null ? 'matched' : 'manual-review',
      };
    });
    const unmatchedRows = extracted.filter(row => !roster.some(student =>
      normaliseName(row.admissionNumber) === normaliseName(student.admissionNumber) ||
      normaliseName(row.name).includes(normaliseName(student.fullName)) || normaliseName(student.fullName).includes(normaliseName(row.name))
    ));
    res.json({ importId, extractionMethod, rows: reviewRows, unmatchedRows, fileName: manifest.fileName });
  });

  app.post('/api/schools/:schoolId/marks-import/confirm', (req, res) => {
    const { assignmentId, importId, assessmentTitle, term, totalMarks, rows } = req.body;
    const actorUserId = getActor(req).id;
    const schoolId = req.params.schoolId;
    if (!canManageAssignment(actorUserId, schoolId, String(assignmentId || ''))) {
      return res.status(403).json({ error: 'You cannot save marks for this assignment.' });
    }
    const manifestPath = path.join(marksImportRoot, schoolId, `${importId}.json`);
    if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: 'Import source file was not found.' });
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.assignmentId !== assignmentId) return res.status(400).json({ error: 'Import does not match this assignment.' });
    const numericTotal = Number(totalMarks);
    if (!assessmentTitle || !term || !Number.isFinite(numericTotal) || numericTotal <= 0) {
      return res.status(400).json({ error: 'Assessment title, term, and total marks are required.' });
    }
    const assignment = db.getTeachingAssignments(schoolId).find(item => item.id === assignmentId)!;
    const rosterStudentIds = new Set(db.getStudents(schoolId, assignment.classId).map(student => student.id));
    const validRows = (Array.isArray(rows) ? rows : []).filter(row =>
      rosterStudentIds.has(row.studentId) && Number.isFinite(Number(row.score)) && Number(row.score) >= 0 && Number(row.score) <= numericTotal
    );
    if (validRows.length === 0) return res.status(400).json({ error: 'Enter at least one valid student mark.' });

    const actor = getActor(req);
    const resource = db.createKnowledgeResource(schoolId, {
      title: `${assessmentTitle} – source marks sheet`,
      description: `Original ${manifest.fileName} used to capture ${validRows.length} marks for ${assignment.subjectName}, ${assignment.className}.`,
      resourceType: 'Assessment Evidence',
      folder: 'Assessment Evidence / Marks Imports',
      tags: ['marks-import', assignment.subjectName || 'subject', assignment.className || 'class'],
      fileType: path.extname(manifest.fileName).replace('.', '').toUpperCase() || 'FILE',
      fileSize: `${(manifest.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedByUserId: actor.id,
      uploadedByName: actor.fullName,
      departmentSharing: false,
      wholeSchoolSharing: true,
      fileUrl: `/api/schools/${schoolId}/marks-import/${importId}/file`,
      storageObjectPath: manifest.objectPath || undefined,
      mimeType: manifest.mimeType || 'application/octet-stream',
      sourceType: 'marks-import',
      linkedTeachingAssignmentId: assignmentId,
      linkedStudentIds: validRows.map(row => row.studentId),
    }, actor);
    const marks = db.saveStudentMarks(schoolId, validRows.map(row => ({
      studentId: row.studentId,
      teachingAssignmentId: assignmentId,
      assessmentTitle,
      term,
      score: Number(row.score),
      totalMarks: numericTotal,
      sourceResourceId: resource.id,
      capturedByUserId: actor.id,
      capturedByName: actor.fullName,
    })));
    db.addAuditLog(schoolId, actor, 'STUDENT_MARKS_IMPORTED', `${marks.length} marks imported for ${assignment.subjectName}, ${assignment.className}. Evidence: ${resource.title}.`);
    res.status(201).json({ marks, resource });
  });

  app.get('/api/schools/:schoolId/marks-import/:importId/file', async (req, res) => {
    const actorUserId = getActor(req).id;
    const manifestPath = path.join(marksImportRoot, req.params.schoolId, `${req.params.importId}.json`);
    if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: 'File not found.' });
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!canManageAssignment(actorUserId, req.params.schoolId, manifest.assignmentId)) {
      return res.status(403).json({ error: 'You cannot access this evidence file.' });
    }
    if (manifest.objectPath) {
      const remote = await downloadSchoolFile(manifest.objectPath);
      if (remote) return res.type(remote.contentType).attachment(manifest.fileName).send(remote.data);
    }
    res.download(path.join(marksImportRoot, req.params.schoolId, manifest.storedName), manifest.fileName);
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
    const actor = getActor(req);
    const list = db.getAssessmentWorkspaces(req.params.schoolId, {
      phaseId: phaseId as string,
      gradeId: gradeId as string,
      subjectId: subjectId as string,
      teacherUserId: actor.role === 'TEACHER' ? actor.id : teacherUserId as string,
    }).filter(workspace => canAccessWorkspace(actor, workspace));
    res.json(list);
  });

  app.post('/api/schools/:schoolId/assessment-workspaces', (req, res) => {
    const { phaseId, gradeId, subjectId, term, title, teacherUserId } = req.body;
    if (!phaseId || !gradeId || !subjectId || !term || !title || !teacherUserId) {
      return res.status(400).json({ error: 'Missing required assessment workspace fields' });
    }
    const actor = getActor(req);
    const schoolId = req.params.schoolId;
    const owner = db.getUsers(schoolId).find(user => user.id === teacherUserId && user.status === 'Active');
    if (!owner) {
      return res.status(400).json({ error: 'Choose an active staff member from this school for the assessment workspace.' });
    }
    if (actor.role === 'TEACHER' && teacherUserId !== actor.id) {
      return res.status(403).json({ error: 'Teachers can only create their own assessment workspaces.' });
    }
    const actorRoles = actor.roles?.length ? actor.roles : [actor.role];
    const ownerRoles = owner.roles?.length ? owner.roles : [owner.role];
    const isLeadershipCreator = actorRoles.some(role => leadershipRoles.includes(role));
    const validTeachingAssignment = db.getTeachingAssignments(schoolId, teacherUserId).some(assignment =>
      assignment.phaseId === phaseId && assignment.gradeId === gradeId && (assignment.subjectId === subjectId || assignment.subjectId === 'ALL')
    );
    const validAcademicAssignment = db.getAcademicAssignments(schoolId, teacherUserId, undefined, gradeId).some(assignment =>
      assignment.status === 'Active' && (assignment.subjectId === subjectId || assignment.subjectId === 'ALL')
    );
    const validAssignment = isLeadershipCreator || ownerRoles.some(role => leadershipRoles.includes(role)) || validTeachingAssignment || validAcademicAssignment;
    if (!validAssignment) {
      return res.status(400).json({ error: 'This staff member is not assigned to the selected grade and subject.' });
    }
    const workspace = db.createAssessmentWorkspace(schoolId, {
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

  app.post('/api/schools/:schoolId/assessment-workspaces/:workspaceId/files', async (req, res) => {
    const actor = getActor(req);
    const workspace = db.getAssessmentWorkspaces(req.params.schoolId).find(item => item.id === req.params.workspaceId);
    if (!workspace) return res.status(404).json({ error: 'Assessment workspace not found.' });
    if (!canAccessWorkspace(actor, workspace) || (actor.role === 'TEACHER' && (workspace.teacherUserId !== actor.id || workspace.status !== 'Draft'))) {
      return res.status(403).json({ error: 'You cannot upload files to this workspace.' });
    }
    const { target, fileName, mimeType, dataBase64 } = req.body;
    if (!['paper', 'memo'].includes(target)) return res.status(400).json({ error: 'File target must be paper or memo.' });
    try {
      const data = decodeUpload(fileName, dataBase64);
      const objectPath = await saveUploadedFile(req.params.schoolId, 'assessments', workspace.id, String(fileName), String(mimeType || ''), data);
      const fileInfo = {
        fileName: path.basename(String(fileName)),
        fileType: path.extname(String(fileName)).slice(1).toLowerCase() || 'file',
        mimeType: String(mimeType || 'application/octet-stream'),
        uploadDate: new Date().toISOString(),
        objectPath,
        fileUrl: `/api/schools/${req.params.schoolId}/assessment-workspaces/${workspace.id}/files/${target}`,
      };
      const updated = db.updateAssessmentWorkspace(req.params.schoolId, workspace.id, target === 'paper' ? { paperFile: fileInfo } : { memoFile: fileInfo });
      res.status(201).json(updated);
    } catch (error: any) {
      res.status(error.message?.includes('15 MB') ? 413 : 400).json({ error: error.message || 'File upload failed.' });
    }
  });

  app.get('/api/schools/:schoolId/assessment-workspaces/:workspaceId/files/:target', async (req, res) => {
    const workspace = db.getAssessmentWorkspaces(req.params.schoolId).find(item => item.id === req.params.workspaceId);
    if (!workspace || !canAccessWorkspace(getActor(req), workspace)) return res.status(404).json({ error: 'File not found.' });
    const info = req.params.target === 'paper' ? workspace.paperFile : workspace.memoFile;
    if (!info?.objectPath) return res.status(404).json({ error: 'File not found.' });
    await sendUploadedFile(res, info.objectPath, info.fileName, info.mimeType);
  });

  app.patch('/api/schools/:schoolId/assessment-workspaces/:workspaceId/status', (req, res) => {
    const { status, hodUserId, notes } = req.body;
    const actorUser = getActor(req);
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    try {
      const existing = db.getAssessmentWorkspaces(req.params.schoolId).find(item => item.id === req.params.workspaceId);
      if (!existing) return res.status(404).json({ error: 'Assessment workspace not found.' });
      if (!canAccessWorkspace(actorUser, existing)) return res.status(403).json({ error: 'Access denied.' });
      if (existing.status === 'Archived') return res.status(409).json({ error: 'Archived assessments are read-only.' });

      const reviewRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'HOD'];
      const approvalRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'HOD'];
      const archiveRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];
      const reviewableStatuses = ['Submitted', 'DP Review'];
      const returnNotes = String(notes || '').trim();
      const allowed =
        (existing.status === 'Draft' && status === 'Submitted' && existing.teacherUserId === actorUser.id) ||
        (reviewableStatuses.includes(existing.status) && status === 'Draft' && reviewRoles.includes(actorUser.role)) ||
        (reviewableStatuses.includes(existing.status) && status === 'Approved' && approvalRoles.includes(actorUser.role)) ||
        (existing.status === 'Approved' && status === 'Draft' && archiveRoles.includes(actorUser.role)) ||
        (existing.status === 'Approved' && status === 'Archived' && archiveRoles.includes(actorUser.role));
      if (!allowed) return res.status(409).json({ error: `Invalid assessment transition from ${existing.status} to ${status}.` });
      if (status === 'Draft' && !returnNotes) {
        return res.status(400).json({ error: 'Write the required fixes before returning this paper to the teacher.' });
      }

      const now = new Date().toISOString();
      let updated = db.updateAssessmentWorkspaceStatus(req.params.schoolId, req.params.workspaceId, status, hodUserId);
      const historyAction = status === 'Draft'
        ? 'Rejected and returned'
        : status === 'Submitted'
        ? 'Submitted for DH moderation'
        : status === 'Approved'
        ? 'Approved'
        : 'Archived';
      updated = db.updateAssessmentWorkspace(req.params.schoolId, req.params.workspaceId, {
        submissionDate: status === 'Submitted' ? now : updated.submissionDate,
        approvalDate: status === 'Approved' ? now : status === 'Draft' ? undefined : updated.approvalDate,
        archiveDate: status === 'Archived' ? now : status === 'Draft' ? undefined : updated.archiveDate,
        moderationNotes: status === 'Draft'
          ? [
              ...(existing.moderationNotes || []),
              {
                id: `mod-${Date.now()}`,
                authorId: actorUser.id,
                authorName: actorUser.fullName,
                authorRole: actorUser.role,
                text: returnNotes,
                timestamp: now,
              },
            ]
          : updated.moderationNotes,
        approvalHistory: [
          ...(existing.approvalHistory || []),
          {
            id: `hist-${Date.now()}`,
            action: historyAction,
            actorName: actorUser.fullName,
            actorRole: actorUser.role,
            timestamp: now,
            notes: returnNotes || undefined,
          },
        ],
      });
      if (actorUser) {
        const teacher = getUserById(updated.teacherUserId);
        const action = status === 'Draft'
          ? 'ASSESSMENT_REJECTED'
          : status === 'Submitted'
          ? 'ASSESSMENT_SUBMITTED'
          : status === 'Approved'
          ? 'ASSESSMENT_APPROVED'
          : 'ASSESSMENT_ARCHIVED';
        const details = status === 'Draft'
          ? `Assessment "${updated.title}" was rejected and returned to ${teacher?.fullName || 'the teacher'} by ${actorUser.fullName} (${actorUser.role}). Required fixes: ${returnNotes}`
          : status === 'Submitted'
          ? `Assessment "${updated.title}" was submitted for DH moderation by ${actorUser.fullName} (${actorUser.role}).`
          : status === 'Approved'
          ? `Assessment "${updated.title}" was approved by ${actorUser.fullName} (${actorUser.role}).`
          : `Assessment "${updated.title}" was archived by ${actorUser.fullName} (${actorUser.role}).`;
        db.addAuditLog(
          req.params.schoolId,
          actorUser,
          action,
          details
        );
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/schools/:schoolId/assessment-workspaces/:workspaceId', (req, res) => {
    try {
      const actor = getActor(req);
      const existing = db.getAssessmentWorkspaces(req.params.schoolId).find(item => item.id === req.params.workspaceId);
      if (!existing) return res.status(404).json({ error: 'Assessment workspace not found.' });
      if (!canAccessWorkspace(actor, existing)) return res.status(403).json({ error: 'Access denied.' });
      if (existing.status === 'Archived') return res.status(409).json({ error: 'Archived assessments are read-only.' });
      if (actor.role === 'TEACHER' && (existing.teacherUserId !== actor.id || existing.status !== 'Draft')) {
        return res.status(403).json({ error: 'Teachers can only edit their own drafts.' });
      }
      const requestedUpdates = { ...(req.body.updates || req.body) };
      delete requestedUpdates.status;
      delete requestedUpdates.schoolId;
      delete requestedUpdates.teacherUserId;
      const updated = db.updateAssessmentWorkspace(req.params.schoolId, req.params.workspaceId, requestedUpdates);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/schools/:schoolId/assessment-workspaces/:workspaceId', (req, res) => {
    const actorUser = getActor(req);
    const existing = db.getAssessmentWorkspaces(req.params.schoolId).find(item => item.id === req.params.workspaceId);
    if (!existing) return res.status(404).json({ error: 'Assessment workspace not found.' });
    if (!canAccessWorkspace(actorUser, existing)) return res.status(403).json({ error: 'Access denied.' });
    if (['Approved', 'Archived'].includes(existing.status)) {
      return res.status(409).json({ error: 'Approved and archived assessments cannot be deleted.' });
    }
    if (actorUser.role === 'TEACHER' && (existing.teacherUserId !== actorUser.id || existing.status !== 'Draft')) {
      return res.status(403).json({ error: 'Teachers can only delete their own drafts.' });
    }
    const success = db.deleteAssessmentWorkspace(req.params.schoolId, req.params.workspaceId, actorUser);
    res.json({ success });
  });

  // Toggle Disable/Enable School (Super Admin only)
  app.post('/api/schools/:schoolId/disable', requireRoles('SUPER_ADMIN'), (req, res) => {
    const { status } = req.body;
    const actorUser = getActor(req);
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

  app.post('/api/schools/:schoolId/knowledge-resources', async (req, res) => {
    try {
      const { actorUser: _ignoredActorUser, dataBase64, fileName, mimeType, ...payload } = req.body;
      const actorUser = getActor(req);
      const data = decodeUpload(fileName, dataBase64);
      const resourceId = `resource-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const storageObjectPath = await saveUploadedFile(req.params.schoolId, 'knowledge', resourceId, String(fileName), String(mimeType || ''), data);
      const resource = db.createKnowledgeResource(req.params.schoolId, {
        ...payload,
        fileType: path.extname(String(fileName)).slice(1).toUpperCase() || 'FILE',
        fileSize: `${(data.length / 1024 / 1024).toFixed(2)} MB`,
        uploadedByUserId: actorUser.id,
        uploadedByName: actorUser.fullName,
        mimeType: String(mimeType || 'application/octet-stream'),
        storageObjectPath,
        fileUrl: `/api/schools/${req.params.schoolId}/knowledge-resources/${resourceId}/file`,
      }, actorUser, resourceId);
      res.status(201).json(resource);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create knowledge resource' });
    }
  });

  app.get('/api/schools/:schoolId/knowledge-resources/:resourceId/file', async (req, res) => {
    const resource = db.getKnowledgeResources(req.params.schoolId).find(item => item.id === req.params.resourceId);
    if (!resource?.storageObjectPath) return res.status(404).json({ error: 'File not found.' });
    await sendUploadedFile(res, resource.storageObjectPath, resource.title, resource.mimeType);
  });

  app.get('/api/platform/school-admins', requireRoles('SUPER_ADMIN'), (_req, res) => {
    const schools = new Map(db.getSchools().map(school => [school.id, school.name]));
    res.json(db.getUsers(null).filter(user => user.role === 'SCHOOL_ADMIN').map(user => ({ ...user, schoolName: schools.get(user.schoolId || '') || 'Unknown school' })));
  });

  app.put('/api/platform/school-admins/:userId', requireRoles('SUPER_ADMIN'), async (req, res) => {
    const target = db.getUsers(null).find(user => user.id === req.params.userId && user.role === 'SCHOOL_ADMIN');
    if (!target) return res.status(404).json({ error: 'School administrator not found.' });
    const { fullName, email, password, status } = req.body;
    if (password && String(password).length < 12) return res.status(400).json({ error: 'Passwords must contain at least 12 characters.' });
    try {
      const updated = db.updateUserCredentials(target.id, target.schoolId, { fullName: fullName ?? target.fullName, email: email ?? target.email, status: status ?? target.status }, password);
      if (!updated) return res.status(404).json({ error: 'School administrator not found.' });
      if (password || status === 'Disabled') await revokeUserSessions(updated);
      db.addAuditLog(target.schoolId, getActor(req), 'SCHOOL_ADMIN_UPDATED', `${target.fullName}'s school administrator credentials were updated.`);
      res.json({ ...updated, schoolName: db.getSchoolById(updated.schoolId || '')?.name || 'Unknown school' });
    } catch (error: any) {
      res.status(409).json({ error: error.message || 'Could not update school administrator.' });
    }
  });

  app.delete('/api/schools/:schoolId/knowledge-resources/:resourceId', (req, res) => {
    const actorUser = getActor(req);
    const resource = db.getKnowledgeResources(req.params.schoolId).find(item => item.id === req.params.resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });
    const leadership = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'HOD'];
    if (resource.uploadedByUserId !== actorUser.id && !leadership.includes(actorUser.role)) {
      return res.status(403).json({ error: 'You cannot delete this resource.' });
    }
    const success = db.deleteKnowledgeResource(req.params.schoolId, req.params.resourceId, actorUser);
    res.json({ success });
  });

  // Audit Logs (Isolated per school or global for Super Admin)
  app.get('/api/audit-logs', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'HOD'), (req, res) => {
    const actor = getActor(req);
    const requestedSchoolId = req.query.schoolId as string;
    const schoolId = actor.role === 'SUPER_ADMIN' ? requestedSchoolId : actor.schoolId!;
    const logs = db.getAuditLogs(schoolId === 'PLATFORM' ? null : schoolId);
    res.json(logs);
  });

  // Platform Super Admin: Switch School Tenant Context Inspection
  app.post('/api/platform/switch-school', requireRoles('SUPER_ADMIN'), (req, res) => {
    const { targetSchoolId } = req.body;
    const actorUser = getActor(req);
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
