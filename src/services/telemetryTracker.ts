import { User } from '../types';
import { ApiService } from './api';

class TelemetryTracker {
  private sessionId: string | null = null;
  private sessionStartTime: number = Date.now();
  private lastActiveTime: number = Date.now();
  private interactionCount: number = 0;
  private currentTab: string = 'dashboard';
  private heartbeatInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedId = window.sessionStorage.getItem('samp_telemetry_session_id');
      const storedStart = window.sessionStorage.getItem('samp_telemetry_session_start');
      const storedCount = window.sessionStorage.getItem('samp_telemetry_interaction_count');

      if (storedId && storedStart) {
        this.sessionId = storedId;
        this.sessionStartTime = parseInt(storedStart, 10);
        this.interactionCount = storedCount ? parseInt(storedCount, 10) : 0;
      }

      window.addEventListener('beforeunload', () => {
        this.flushSessionOnExit();
      });
    }
  }

  public initSession(user: User, schoolId: string | null) {
    if (typeof window === 'undefined') return;

    if (!this.sessionId) {
      this.sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      this.sessionStartTime = Date.now();
      this.lastActiveTime = Date.now();
      this.interactionCount = 0;

      window.sessionStorage.setItem('samp_telemetry_session_id', this.sessionId);
      window.sessionStorage.setItem('samp_telemetry_session_start', this.sessionStartTime.toString());
      window.sessionStorage.setItem('samp_telemetry_interaction_count', '0');

      // Register initial session with backend
      ApiService.logTelemetrySession({
        id: this.sessionId,
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        userRole: user.role,
        schoolId: schoolId || user.schoolId || null,
        loginTime: new Date(this.sessionStartTime).toISOString(),
        lastActiveTime: new Date(this.lastActiveTime).toISOString(),
        durationSeconds: 0,
        interactionCount: 0,
        isBounced: true, // Initially flagged until meaningful interaction happens
        exitPage: 'Dashboard',
        bounceReason: 'Session initiated; awaiting user interaction',
      }).catch(err => console.debug('[telemetry] initSession failed:', err));
    }

    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat(user, schoolId);
      }, 30000); // 30s heartbeat
    }
  }

  public trackAction(
    featureId: string,
    featureName: string,
    category: any,
    actionType: any,
    details: string,
    user: User | null,
    schoolId: string | null
  ) {
    if (!user) return;

    this.interactionCount += 1;
    this.lastActiveTime = Date.now();

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('samp_telemetry_interaction_count', this.interactionCount.toString());
    }

    if (!this.sessionId) {
      this.initSession(user, schoolId);
    }

    // Fire-and-forget action event
    ApiService.logTelemetryEvent({
      sessionId: this.sessionId || undefined,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      schoolId: schoolId || user.schoolId || null,
      featureId,
      featureName,
      category,
      actionType,
      details,
      timestamp: new Date().toISOString(),
    }).catch(err => console.debug('[telemetry] trackAction failed:', err));
  }

  public trackPageView(tab: string, user: User | null, schoolId: string | null) {
    if (!user) return;
    this.currentTab = tab;

    const TAB_FEATURE_MAP: Record<string, { id: string; name: string; category: any }> = {
      dashboard: { id: 'dashboard_quick_actions', name: 'Dashboard Overview', category: 'navigation' },
      assessments: { id: 'assessments_workspace', name: 'Assessment Workspace & Drafting', category: 'assessments' },
      students: { id: 'students_marks', name: 'Class Rosters & Marks Capture', category: 'students_marks' },
      knowledge: { id: 'knowledge_hub_resources', name: 'Knowledge Hub Teaching Resources', category: 'knowledge_hub' },
      archive: { id: 'assessment_archive', name: 'Historical Assessment Archive', category: 'assessments' },
      users: { id: 'user_management', name: 'Staff Accounts & HOD Reporting Lines', category: 'admin' },
      profile: { id: 'school_profile', name: 'School Profile', category: 'settings' },
      branding: { id: 'branding_settings', name: 'School Branding & Theme Colors', category: 'settings' },
      roles: { id: 'roles_permissions', name: 'Roles & Permissions Matrix', category: 'admin' },
      settings: { id: 'school_settings', name: 'School Settings & Academic Calendar', category: 'settings' },
      academic: { id: 'academic_structure', name: 'Academic Structure & Class Sections', category: 'academic' },
      audit: { id: 'audit_trail', name: 'School Security Audit Trail', category: 'admin' },
      engagement: { id: 'engagement_analytics', name: 'User Engagement & Action Tracker', category: 'admin' },
      'superadmin-dashboard': { id: 'superadmin_overview', name: 'Platform Super Admin Overview', category: 'admin' },
      'superadmin-schools': { id: 'superadmin_schools', name: 'Registered Schools Directory', category: 'admin' },
      'superadmin-audit': { id: 'superadmin_audit', name: 'Platform Global Audit Logs', category: 'admin' },
      'superadmin-users': { id: 'superadmin_users', name: 'School Administrators Directory', category: 'admin' },
      'superadmin-engagement': { id: 'superadmin_engagement', name: 'Platform Engagement Analytics', category: 'admin' },
    };

    const target = TAB_FEATURE_MAP[tab] || { id: tab, name: `View ${tab}`, category: 'navigation' };
    this.trackAction(target.id, target.name, target.category, 'view', `Navigated to ${target.name}`, user, schoolId);
  }

  private sendHeartbeat(user: User, schoolId: string | null) {
    if (!this.sessionId) return;
    const durationSeconds = Math.round((Date.now() - this.sessionStartTime) / 1000);

    const isBounced = this.interactionCount <= 2 && durationSeconds < 90;
    let bounceReason = undefined;
    if (isBounced) {
      bounceReason = this.interactionCount === 0
        ? `Logged in and stayed idle on ${this.currentTab} (${durationSeconds}s duration)`
        : `Minimal interactions (${this.interactionCount}) before remaining idle on ${this.currentTab}`;
    }

    ApiService.logTelemetrySession({
      id: this.sessionId,
      userId: user.id,
      schoolId: schoolId || user.schoolId || null,
      lastActiveTime: new Date(this.lastActiveTime).toISOString(),
      durationSeconds,
      interactionCount: this.interactionCount,
      isBounced,
      exitPage: this.currentTab,
      bounceReason,
    }).catch(() => {});
  }

  private flushSessionOnExit() {
    if (!this.sessionId) return;
    const durationSeconds = Math.round((Date.now() - this.sessionStartTime) / 1000);
    const isBounced = this.interactionCount <= 2 && durationSeconds < 90;

    const payload = JSON.stringify({
      id: this.sessionId,
      durationSeconds,
      interactionCount: this.interactionCount,
      isBounced,
      exitPage: this.currentTab,
      lastActiveTime: new Date(this.lastActiveTime).toISOString(),
      bounceReason: isBounced ? `User exited from ${this.currentTab} after ${durationSeconds}s with ${this.interactionCount} interactions` : undefined,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry/session', new Blob([payload], { type: 'application/json' }));
    }
  }

  public endSession() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.flushSessionOnExit();
    this.sessionId = null;
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('samp_telemetry_session_id');
      window.sessionStorage.removeItem('samp_telemetry_session_start');
      window.sessionStorage.removeItem('samp_telemetry_interaction_count');
    }
  }
}

export const telemetry = new TelemetryTracker();
