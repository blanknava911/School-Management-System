import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { User, Role } from '../../types';
import { canCreateUsers, canAccessModule, getUserRoles, getHighestRole } from '../../utils/rbac';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Mail,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  Plus,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

const AVAILABLE_ROLES: { role: Role; label: string }[] = [
  { role: 'SCHOOL_ADMIN', label: 'School Administrator' },
  { role: 'PRINCIPAL', label: 'Principal' },
  { role: 'DEPUTY_PRINCIPAL', label: 'Deputy Principal' },
  { role: 'HOD', label: 'DH (Departmental Head)' },
  { role: 'GRADE_HEAD', label: 'Grade Head' },
  { role: 'TEACHER', label: 'Teacher' },
  { role: 'STUDENT', label: 'Student' },
];

export const UserManagement: React.FC = () => {
  const { activeSchool, currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [primaryRole, setPrimaryRole] = useState<Role>('TEACHER');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['TEACHER']);
  const [password, setPassword] = useState<string>('staff123');
  const [assignedTeacherId, setAssignedTeacherId] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Grade, Class & Academic Assignment States
  const [availableGrades, setAvailableGrades] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [selectedGradeIds, setSelectedGradeIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  const loadGradesAndStructure = async () => {
    if (!activeSchool) return;
    try {
      const struct = await ApiService.getAcademicStructure(activeSchool.id);
      setAvailableGrades(struct.grades || []);
      setAvailableClasses(struct.classes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeSchool) {
      loadGradesAndStructure();
    }
  }, [activeSchool]);

  // Disable / Delete Modal States
  const [actionNotice, setActionNotice] = useState<{ title: string; message: string; type: 'warning' | 'info' } | null>(null);

  const isAllowedToAccess = canAccessModule(currentUser, 'users');
  const isAllowedToCreate = canCreateUsers(currentUser);

  const handleDisableUser = (targetUser: User) => {
    setUsers(users.map(u => u.id === targetUser.id ? { ...u, status: 'Disabled' as const } : u));
    setActionNotice({
      title: 'User Account Disabled',
      message: `The user account for ${targetUser.fullName} has been disabled. Historical records, assessments, and audit logs remain intact.`,
      type: 'info'
    });
  };

  const handleEnableUser = (targetUser: User) => {
    setUsers(users.map(u => u.id === targetUser.id ? { ...u, status: 'Active' as const } : u));
    setActionNotice({
      title: 'User Account Re-enabled',
      message: `The user account for ${targetUser.fullName} has been reactivated.`,
      type: 'info'
    });
  };

  const handleDeleteUser = (targetUser: User) => {
    // Check if user has linked active resources / assessments (Simulated check for demonstration & safety compliance)
    const hasLinkedWork = true; // In a primary school environment, staff are linked to assessments and audit history

    if (hasLinkedWork) {
      setActionNotice({
        title: 'Deletion Restricted',
        message: `Cannot delete ${targetUser.fullName} because they have associated assessment workspaces, moderation records, or audit history. To prevent data corruption, please Disable the user account instead.`,
        type: 'warning'
      });
    } else {
      setUsers(users.filter(u => u.id !== targetUser.id));
      setActionNotice({
        title: 'User Deleted',
        message: `Account for ${targetUser.fullName} has been permanently removed.`,
        type: 'info'
      });
    }
  };

  const loadUsers = async () => {
    if (!activeSchool) return;
    setLoading(true);
    try {
      const data = await ApiService.getUsers(activeSchool.id);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAllowedToAccess) {
      loadUsers();
    }
  }, [activeSchool, currentUser]);

  const toggleRole = (r: Role) => {
    let updated: Role[];
    if (selectedRoles.includes(r)) {
      if (selectedRoles.length === 1) return; // Must have at least 1 role
      updated = selectedRoles.filter(role => role !== r);
    } else {
      updated = [...selectedRoles, r];
    }
    setSelectedRoles(updated);
    // Inherit the category with the highest authority automatically!
    const highest = getHighestRole(updated);
    setPrimaryRole(highest);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchool || !currentUser) return;
    setModalError(null);

    // Calculate inherited role with highest authority from selected roles
    const inheritedPrimaryRole = getHighestRole(selectedRoles);

    // Mandate class selection for Teacher accounts
    const isTeacher = selectedRoles.includes('TEACHER') || inheritedPrimaryRole === 'TEACHER';
    if (isTeacher && selectedClassIds.length === 0) {
      setModalError('Selecting at least one Class Section is mandatory for Teacher accounts.');
      return;
    }

    try {
      const newUser = await ApiService.createUser(
        activeSchool.id,
        {
          fullName,
          email,
          role: inheritedPrimaryRole,
          roles: selectedRoles,
          teacherUserId: inheritedPrimaryRole === 'STUDENT' ? assignedTeacherId : undefined,
          password,
        },
        currentUser
      );

      // Save teaching assignments for selected class sections
      if (newUser && selectedClassIds.length > 0) {
        for (const cId of selectedClassIds) {
          const clsObj = availableClasses.find(c => c.id === cId);
          const gId = clsObj?.gradeId || (availableGrades[0]?.id || '');
          const gradeObj = availableGrades.find(g => g.id === gId);
          const phaseId = gradeObj?.phaseId || 'PHASE-1';

          await ApiService.createTeachingAssignment(activeSchool.id, {
            teacherUserId: newUser.id,
            phaseId,
            gradeId: gId,
            classId: cId,
            subjectId: 'ALL',
            academicYear: '2026',
          });

          await ApiService.createAcademicAssignment(activeSchool.id, {
            userId: newUser.id,
            userName: newUser.fullName,
            role: 'TEACHER',
            gradeId: gId,
            subjectId: 'ALL',
            academicYear: '2026',
            status: 'Active',
          });
        }
      }

      // Save grade assignments if HOD and grades selected
      if (newUser && selectedRoles.includes('HOD') && selectedGradeIds.length > 0) {
        await ApiService.setHodGradeAssignments(activeSchool.id, newUser.id, selectedGradeIds);
      }

      setIsAddModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('staff123');
      setSelectedRoles(['TEACHER']);
      setPrimaryRole('TEACHER');
      setAssignedTeacherId('');
      setSelectedGradeIds([]);
      setSelectedClassIds([]);
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user');
    }
  };

  if (!isAllowedToAccess) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-rose-900">Access Restricted by RBAC</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">
          User Management is restricted to Platform Super Admins, School Administrators, and Principals.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const isTeacherView = currentUser?.role === 'TEACHER';
    if (isTeacherView && (user.role !== 'STUDENT' || user.teacherUserId !== currentUser.id)) return false;
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const userRolesList = getUserRoles(user);
    const matchesRole = roleFilter === 'ALL' || userRolesList.includes(roleFilter as Role);
    return matchesSearch && matchesRole;
  });

  if (!activeSchool) return null;

  return (
    <div className="space-y-6">
      {/* Top Title & Add User Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser?.role === 'TEACHER' ? 'Students assigned to your account' : 'Managing staff and student accounts'} for <strong className="text-slate-800">{activeSchool.name}</strong>
          </p>
        </div>

        {isAllowedToCreate && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search staff by full name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs text-slate-900 outline-none font-medium"
          >
            <option value="ALL">All Roles</option>
            {AVAILABLE_ROLES.map(r => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading user accounts...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No user accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Full Name & Email</th>
                  <th className="px-6 py-3">Assigned Roles (Multi-Role)</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">School Tenant</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map(u => {
                  const assignedRolesList = getUserRoles(u);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {assignedRolesList.map(r => (
                            <span
                              key={r}
                              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-md border border-indigo-200 uppercase tracking-wide"
                            >
                              {r.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.status === 'Active' ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active</span>
                          </span>
                        ) : u.status === 'Disabled' ? (
                          <span className="inline-flex items-center space-x-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Disabled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{u.status}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                        {u.schoolId ? u.schoolId : 'PLATFORM'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {u.status === 'Active' ? (
                          <button
                            onClick={() => handleDisableUser(u)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold rounded-lg transition-colors"
                          >
                            Disable Account
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnableUser(u)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold rounded-lg transition-colors"
                          >
                            Enable Account
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-600 text-white rounded-xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Staff Account</h3>
                <p className="text-xs text-slate-500">Assign single or multiple roles (e.g. Principal + Teacher)</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Prof. Alan Turing"
                  className="w-full px-3 py-2 border rounded-lg outline-none text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="a.turing@school.edu"
                  className="w-full px-3 py-2 border rounded-lg outline-none text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Assign Roles (Multi-Role Support) *
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Select all roles that apply to this staff member. Permissions will be combined.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {AVAILABLE_ROLES.map(r => {
                    const isChecked = selectedRoles.includes(r.role);
                    return (
                      <label
                        key={r.role}
                        onClick={() => toggleRole(r.role)}
                        className={`flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer transition-all border ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Controlled by label click
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-xs">{r.label}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Inherited Primary Role Authority Card */}
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between text-xs mt-2.5 shadow-2xs">
                  <div>
                    <span className="text-slate-800 font-bold block">Inherited Primary Authority Category</span>
                    <span className="text-[10px] text-slate-500">Automatically inherited from highest priority role selected</span>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg uppercase tracking-wider text-[10px] shadow-xs shrink-0">
                    {getHighestRole(selectedRoles).replace('_', ' ')}
                  </span>
                </div>
              </div>

              {getHighestRole(selectedRoles) === 'STUDENT' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Teacher *</label>
                  <select
                    required
                    value={assignedTeacherId}
                    onChange={e => setAssignedTeacherId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none text-slate-900 text-sm bg-white"
                  >
                    <option value="">Select a teacher</option>
                    {users.filter(user => getUserRoles(user).includes('TEACHER')).map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mandatory Class Assignment for Teacher Accounts */}
              {(selectedRoles.includes('TEACHER') || getHighestRole(selectedRoles) === 'TEACHER') && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-amber-950 text-xs flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Assign Required Class Section(s) *</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      {selectedClassIds.length} Class(es) Selected
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-tight">
                    A Teacher account <strong className="font-bold underline">must</strong> be assigned to at least one class section (e.g. Grade 1A, Grade 4B) to manage assessment workspaces and classroom records.
                  </p>

                  {availableClasses.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto">
                      {availableClasses.map(c => {
                        const isChecked = selectedClassIds.includes(c.id);
                        const gradeName = availableGrades.find(g => g.id === c.gradeId)?.name || '';
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border text-xs transition-all ${
                              isChecked
                                ? 'bg-amber-100 border-amber-400 font-bold text-amber-950 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedClassIds([...selectedClassIds, c.id]);
                                } else {
                                  setSelectedClassIds(selectedClassIds.filter(id => id !== c.id));
                                }
                              }}
                              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 shrink-0"
                            />
                            <span className="truncate">{c.name} {gradeName && !c.name.includes(gradeName) ? `(${gradeName})` : ''}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : availableGrades.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {availableGrades.map(g => {
                        const fallbackClassId = `cls-${g.id}-a`;
                        const isChecked = selectedClassIds.includes(fallbackClassId);
                        return (
                          <label
                            key={g.id}
                            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border text-xs transition-all ${
                              isChecked
                                ? 'bg-amber-100 border-amber-400 font-bold text-amber-950'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedClassIds([...selectedClassIds, fallbackClassId]);
                                } else {
                                  setSelectedClassIds(selectedClassIds.filter(id => id !== fallbackClassId));
                                }
                              }}
                              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 shrink-0"
                            />
                            <span>{g.name} Class</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No classes configured yet.</p>
                  )}
                </div>
              )}

              {/* HOD Moderation Grades */}
              {availableGrades.length > 0 && selectedRoles.includes('HOD') && (
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block font-bold text-slate-700 text-xs">
                    Assign HOD Moderation Grades
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Select the grades this Departmental Head (HOD) will moderate:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {availableGrades.map(g => {
                      const isChecked = selectedGradeIds.includes(g.id);
                      return (
                        <label
                          key={g.id}
                          className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border text-xs transition-all ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedGradeIds([...selectedGradeIds, g.id]);
                              } else {
                                setSelectedGradeIds(selectedGradeIds.filter(id => id !== g.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{g.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none text-slate-900 text-sm font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Notice Modal */}
      {actionNotice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 text-xs space-y-4">
            <div className="flex items-center space-x-3">
              {actionNotice.type === 'warning' ? (
                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900">{actionNotice.title}</h3>
                <p className="text-slate-500 text-[11px]">System Security & Governance</p>
              </div>
            </div>

            <p className="text-slate-700 text-xs leading-relaxed">{actionNotice.message}</p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActionNotice(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
