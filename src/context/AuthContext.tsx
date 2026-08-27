import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, School } from '../types.js';
import { ApiService } from '../services/api.js';

interface AuthContextType {
  currentUser: User | null;
  currentSchool: School | null;
  superAdminInspectingSchool: School | null;
  activeSchool: School | null; // Currently viewed school (either tenant school or inspected school)
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  registerSchool: (payload: {
    schoolInfo: Partial<School>;
    adminInfo: { fullName: string; email: string; password: string };
  }) => Promise<School>;
  switchSchoolInspection: (targetSchoolId: string) => Promise<void>;
  clearInspectionMode: () => void;
  updateSchoolBranding: (
    updates: Partial<School>,
    auditEntries?: Array<{ action: string; details: string }>
  ) => Promise<void>;
  completeFirstTimeSetup: (setupData: any) => Promise<void>;
  refreshSchoolData: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [superAdminInspectingSchool, setSuperAdminInspectingSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active school is whichever context is active
  const activeSchool = superAdminInspectingSchool || currentSchool;

  const login = async (email: string, password: string) => {
    console.log('[AuthContext.login] Starting login check for email:', email);
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiService.login(email, password);
      console.log('[AuthContext.login] Auth check successful. User:', res.user.fullName, 'Role:', res.user.role, 'School:', res.school?.name || 'Platform Super Admin');
      setCurrentUser(res.user);
      setCurrentSchool(res.school);
      setSuperAdminInspectingSchool(null);
    } catch (err: any) {
      console.error('[AuthContext.login] Auth check failed:', err?.message || err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    ApiService.clearSession();
    setCurrentUser(null);
    setCurrentSchool(null);
    setSuperAdminInspectingSchool(null);
    setError(null);
  };

  const registerSchool = async (payload: {
    schoolInfo: Partial<School>;
    adminInfo: { fullName: string; email: string; password: string };
  }): Promise<School> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiService.registerSchool(payload);
      setCurrentUser(res.user);
      setCurrentSchool(res.school);
      setSuperAdminInspectingSchool(null);
      return res.school;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const switchSchoolInspection = async (targetSchoolId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Only Platform Super Admin can switch school context');
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiService.switchSchoolInspection(currentUser, targetSchoolId);
      setSuperAdminInspectingSchool(res.targetSchool);
    } catch (err: any) {
      setError(err.message || 'Context switch failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearInspectionMode = () => {
    setSuperAdminInspectingSchool(null);
  };

  const updateSchoolBranding = async (
    updates: Partial<School>,
    auditEntries?: Array<{ action: string; details: string }>
  ) => {
    if (!activeSchool || !currentUser) return;
    setIsLoading(true);
    try {
      const updated = await ApiService.updateSchool(activeSchool.id, updates, currentUser, auditEntries);
      if (superAdminInspectingSchool) {
        setSuperAdminInspectingSchool(updated);
      } else {
        setCurrentSchool(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update branding');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeFirstTimeSetup = async (setupData: any) => {
    if (!activeSchool || !currentUser) return;
    setIsLoading(true);
    try {
      const res = await ApiService.completeFirstTimeSetup(activeSchool.id, {
        ...setupData,
        actorUser: currentUser,
      });
      setCurrentSchool(res.school);
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup wizard');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSchoolData = async () => {
    if (!activeSchool) return;
    try {
      const updated = await ApiService.getSchool(activeSchool.id);
      if (superAdminInspectingSchool) {
        setSuperAdminInspectingSchool(updated);
      } else {
        setCurrentSchool(updated);
      }
    } catch (err) {
      console.error('Refresh school error:', err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentSchool,
        superAdminInspectingSchool,
        activeSchool,
        isLoading,
        error,
        login,
        logout,
        registerSchool,
        switchSchoolInspection,
        clearInspectionMode,
        updateSchoolBranding,
        completeFirstTimeSetup,
        refreshSchoolData,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
