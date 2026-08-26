import { User, Role } from '../types';

export type ModuleName =
  | 'school_profile'
  | 'users'
  | 'departments'
  | 'grades'
  | 'subjects'
  | 'teaching_assignments'
  | 'assessment_workspace'
  | 'knowledge_hub'
  | 'templates'
  | 'audit_trail'
  | 'reports'
  | 'school_settings'
  | 'platform_settings';

export interface RoleInfo {
  role: Role;
  title: string;
  purpose: string;
  rank: number;
}

export const ROLE_HIERARCHY: RoleInfo[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Platform Super Admin',
    purpose: 'Manages the entire platform, all schools, tenant isolation, and platform configuration.',
    rank: 1,
  },
  {
    role: 'SCHOOL_ADMIN',
    title: 'School Administrator',
    purpose: 'Manages school configuration, accounts, branding, settings, structure, and templates.',
    rank: 2,
  },
  {
    role: 'PRINCIPAL',
    title: 'Principal',
    purpose: 'Academic and operational leader of the school with full oversight of academic operations.',
    rank: 3,
  },
  {
    role: 'DEPUTY_PRINCIPAL',
    title: 'Deputy Principal',
    purpose: 'Supports the Principal in academic management and review of assessments across all departments.',
    rank: 4,
  },
  {
    role: 'HOD',
    title: 'DH (Departmental Head)',
    purpose: 'Manages department/grade assessments and moderates academic deliverables.',
    rank: 5,
  },
  {
    role: 'GRADE_HEAD',
    title: 'Grade Head',
    purpose: 'Initial assessment review, comments, and change requests for assigned grade levels.',
    rank: 6,
  },
  {
    role: 'TEACHER',
    title: 'Teacher',
    purpose: 'Creates assessment workspaces, uploads question papers & memorandums, and manages resources.',
    rank: 7,
  },
];

/**
  Retrieves all active roles for a user. Supports multi-role setups (e.g. Principal + Teacher).
 */
export function getUserRoles(user: User | null): Role[] {
  if (!user) return [];
  if (user.roles && user.roles.length > 0) {
    return Array.from(new Set(user.roles));
  }
  return user.role ? [user.role] : [];
}

/**
  Returns the highest authority role from an array of roles.
 */
export function getHighestRole(roles: Role[]): Role {
  if (!roles || roles.length === 0) return 'TEACHER';
  const roleRanks: Record<Role, number> = {
    SUPER_ADMIN: 1,
    SCHOOL_ADMIN: 2,
    PRINCIPAL: 3,
    DEPUTY_PRINCIPAL: 4,
    HOD: 5,
    GRADE_HEAD: 6,
    TEACHER: 7,
  };
  return [...roles].sort((a, b) => (roleRanks[a] || 99) - (roleRanks[b] || 99))[0];
}

/**
  Checks if a user holds any of the target roles.
 */
export function hasRole(user: User | null, targetRole: Role | Role[]): boolean {
  const userRoles = getUserRoles(user);
  if (userRoles.length === 0) return false;

  const targets = Array.isArray(targetRole) ? targetRole : [targetRole];
  return targets.some(tr => userRoles.includes(tr));
}

/**
  Checks if a user can access a specific platform/school module.
  When a user has multiple roles, permissions are combined additively.
 */
export function canAccessModule(user: User | null, module: ModuleName): boolean {
  if (!user) return false;
  const roles = getUserRoles(user);

  return roles.some(role => {
    switch (module) {
      case 'platform_settings':
        return role === 'SUPER_ADMIN';

      case 'school_settings':
        return role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN';

      case 'users':
        return role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN' || role === 'PRINCIPAL';

      case 'school_profile':
        return (
          role === 'SUPER_ADMIN' ||
          role === 'SCHOOL_ADMIN' ||
          role === 'PRINCIPAL' ||
          role === 'DEPUTY_PRINCIPAL' ||
          role === 'HOD'
        );

      case 'audit_trail':
        return (
          role === 'SUPER_ADMIN' ||
          role === 'SCHOOL_ADMIN' ||
          role === 'PRINCIPAL' ||
          role === 'DEPUTY_PRINCIPAL'
        );

      case 'templates':
        return (
          role === 'SUPER_ADMIN' ||
          role === 'SCHOOL_ADMIN' ||
          role === 'PRINCIPAL' ||
          role === 'DEPUTY_PRINCIPAL' ||
          role === 'HOD'
        );

      case 'departments':
      case 'grades':
      case 'subjects':
      case 'teaching_assignments':
      case 'assessment_workspace':
      case 'knowledge_hub':
      case 'reports':
        return true; // Accessible across all staff roles, with internal scoped actions

      default:
        return false;
    }
  });
}

// Action Permission Helpers
export function canCreateUsers(user: User | null): boolean {
  return hasRole(user, ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']);
}

export function canEditUsers(user: User | null): boolean {
  return hasRole(user, ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']);
}

export function canArchiveUsers(user: User | null): boolean {
  return hasRole(user, ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']);
}

export function canAssignRoles(user: User | null): boolean {
  return hasRole(user, ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']);
}

export function canEditSchoolBranding(user: User | null): boolean {
  return hasRole(user, ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']);
}

export function canManageSchoolSettings(user: User | null): boolean {
  return hasRole(user, ['SUPER_ADMIN', 'SCHOOL_ADMIN']);
}

export function canCreateAssessmentWorkspace(user: User | null): boolean {
  return hasRole(user, ['TEACHER', 'GRADE_HEAD', 'HOD', 'DEPUTY_PRINCIPAL', 'PRINCIPAL', 'SUPER_ADMIN']);
}

export function canReviewAssessment(user: User | null): boolean {
  return hasRole(user, ['GRADE_HEAD', 'HOD', 'DEPUTY_PRINCIPAL', 'PRINCIPAL', 'SUPER_ADMIN']);
}

export function canRequestRevisions(user: User | null): boolean {
  return hasRole(user, ['GRADE_HEAD', 'HOD', 'DEPUTY_PRINCIPAL', 'PRINCIPAL', 'SUPER_ADMIN']);
}

export function canApproveAssessment(user: User | null): boolean {
  return hasRole(user, ['HOD', 'DEPUTY_PRINCIPAL', 'PRINCIPAL', 'SUPER_ADMIN']);
}

export function canManageTemplates(user: User | null): boolean {
  return hasRole(user, ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL']);
}

export function canViewAuditTrail(user: User | null): boolean {
  return hasRole(user, ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'DEPUTY_PRINCIPAL']);
}

export function canManagePlatform(user: User | null): boolean {
  return hasRole(user, ['SUPER_ADMIN']);
}
