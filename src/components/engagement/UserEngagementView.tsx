import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import {
  EngagementAnalyticsSummary,
  FeatureEngagementMetric,
  UserEngagementSession,
  UserActionEvent,
} from '../../types';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Layers,
  Filter,
  Download,
  RefreshCw,
  Play,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  MousePointer,
  HelpCircle,
  Search,
  Check,
  Send,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface UserEngagementViewProps {
  isPlatformMode?: boolean;
}

export const UserEngagementView: React.FC<UserEngagementViewProps> = ({ isPlatformMode = false }) => {
  const { currentUser, activeSchool } = useAuth();

  const [summary, setSummary] = useState<EngagementAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [subTab, setSubTab] = useState<'features' | 'bounces' | 'stream' | 'recommendations'>('features');

  // Simulation state
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  // Re-engagement message modal state
  const [targetBouncedSession, setTargetBouncedSession] = useState<UserEngagementSession | null>(null);
  const [reengagementMessage, setReengagementMessage] = useState<string>('');
  const [messageSentSuccess, setMessageSentSuccess] = useState<boolean>(false);

  const schoolIdToQuery = isPlatformMode ? null : (activeSchool?.id || null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getEngagementSummary(schoolIdToQuery, {
        timeframe,
        role: roleFilter,
      });
      setSummary(data);
    } catch (err: any) {
      console.error('[UserEngagementView] Failed to load analytics:', err);
      setError(err.message || 'Unable to load engagement analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [schoolIdToQuery, timeframe, roleFilter]);

  const handleSimulateScenario = async (scenario: string) => {
    setSimulating(true);
    setSimulationNotice(null);
    try {
      const updated = await ApiService.simulateEngagementScenario(schoolIdToQuery, scenario);
      setSummary(updated);
      setSimulationNotice(
        scenario === 'user_bounce_immediate'
          ? 'Simulated low-engagement bounce session logged! Notice the bounce rate and recent exit alert updated.'
          : scenario === 'teacher_assessment_upload'
          ? 'Simulated active teacher workflow logged! Assessment Workspace usage incremented.'
          : scenario === 'hod_moderation_approval'
          ? 'Simulated HOD moderation review logged!'
          : 'Simulated Marks Spreadsheet capture workflow logged!'
      );
      setTimeout(() => setSimulationNotice(null), 5000);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset and re-seed user engagement telemetry for this school?')) return;
    try {
      setLoading(true);
      const res = await ApiService.resetEngagementData(schoolIdToQuery);
      setSummary(res.summary);
      alert('Telemetry re-seeded successfully with baseline data.');
    } catch (err: any) {
      alert(`Failed to reset: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!summary) return;
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAMP_Engagement_Report_${activeSchool?.id || 'Platform'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenReengageModal = (sess: UserEngagementSession) => {
    setTargetBouncedSession(sess);
    setReengagementMessage(
      `Hi ${sess.userName},\n\nWe noticed you recently logged into the School Assessment Management Platform but exited after ${sess.durationSeconds}s. If you need any assistance getting started with your assessment drafts or class marks capture, please let us know or explore our guided walkthrough.`
    );
    setMessageSentSuccess(false);
  };

  const handleSendReengagePrompt = () => {
    setMessageSentSuccess(true);
    setTimeout(() => {
      setTargetBouncedSession(null);
      setMessageSentSuccess(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Confidentiality Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Admin Only Access
              </span>
              <span className="text-xs text-slate-400">&bull; Confidential Platform Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-indigo-400 shrink-0" />
              <span>User Engagement &amp; Action Intelligence</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Track what staff members use the most, what features are avoided, and detect users who log in and leave without interacting — so leadership knows what features to refine, what to leave be, or where to eliminate friction.
            </p>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportReport}
              disabled={!summary}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Report</span>
            </button>
            <button
              onClick={handleResetData}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Telemetry</span>
            </button>
          </div>
        </div>

        {/* Action Simulator Bar (Direct Admin Interactive Tool) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-slate-200">Interactive Scenario Simulator:</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">Test live telemetry and immediate bounce alert triggers:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleSimulateScenario('user_bounce_immediate')}
              disabled={simulating}
              className="px-2.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 text-rose-400" />
              <span>Simulate User Bounce (&lt;30s)</span>
            </button>
            <button
              onClick={() => handleSimulateScenario('teacher_assessment_upload')}
              disabled={simulating}
              className="px-2.5 py-1.5 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 text-indigo-400" />
              <span>Simulate Assessment Upload</span>
            </button>
            <button
              onClick={() => handleSimulateScenario('hod_moderation_approval')}
              disabled={simulating}
              className="px-2.5 py-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>Simulate HOD Approval</span>
            </button>
            <button
              onClick={() => handleSimulateScenario('marks_import_workflow')}
              disabled={simulating}
              className="px-2.5 py-1.5 bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border border-blue-800/60 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 text-blue-400" />
              <span>Simulate Marks Capture</span>
            </button>
          </div>
        </div>

        {simulationNotice && (
          <div className="mt-3 px-3 py-2 bg-emerald-900/60 border border-emerald-700/60 rounded-lg text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{simulationNotice}</span>
          </div>
        )}
      </div>

      {/* Filter and Timeframe Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b sm:border-b-0 border-slate-200 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSubTab('features')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'features'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>What Users Use vs Avoid</span>
          </button>
          <button
            onClick={() => setSubTab('bounces')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'bounces'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low-Engagement Bounces</span>
            {summary && summary.bounceStats.totalBounceSessions > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${subTab === 'bounces' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-700'}`}>
                {summary.bounceStats.totalBounceSessions}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('recommendations')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'recommendations'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Refine vs Leave Be</span>
          </button>
          <button
            onClick={() => setSubTab('stream')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'stream'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live Action Stream</span>
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Staff Roles</option>
            <option value="TEACHER">Teachers Only</option>
            <option value="HOD">Department Heads (HOD)</option>
            <option value="PRINCIPAL">Principals Only</option>
            <option value="SCHOOL_ADMIN">School Admins</option>
          </select>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Window:</span>
          </div>
          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="today">Today (Last 24 Hours)</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Interactions</span>
              <MousePointer className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{summary.totalInteractions}</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Actions across all features</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active Staff Users</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{summary.totalActiveUsers}</span>
              <span className="text-[10px] text-slate-400">teachers &amp; heads</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Unique logged-in accounts</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Sessions</span>
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{summary.totalSessions}</span>
              <span className="text-[10px] text-slate-400">logins</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">User platform visits</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between bg-rose-50/20">
            <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
              <span>Bounce / Abandon Rate</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700">{summary.bounceStats.bounceRatePercentage}%</span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                {summary.bounceStats.totalBounceSessions} sessions
              </span>
            </div>
            <p className="text-[10px] text-rose-600/80 mt-1">Logged in &amp; exited without interaction</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Avg Bounce Duration</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{summary.bounceStats.avgBounceDurationSeconds}s</span>
              <span className="text-[10px] text-amber-600 font-bold">&lt; 90s threshold</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Time spent before abrupt exit</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Analyzing user telemetry and action frequencies...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN VIEW CONTENTS */}
      {summary && !loading && (
        <>
          {/* TAB 1: WHAT USERS USE THE MOST VS WHAT USERS AVOID */}
          {subTab === 'features' && (
            <div className="space-y-6">
              {/* Feature Usage Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. What Users Use the Most */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">What Staff Use the Most (Top Features)</h3>
                        <p className="text-[11px] text-emerald-700 font-medium">Highest interaction counts and repeat daily workflows</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                      High Adoption
                    </span>
                  </div>

                  <div className="p-5 divide-y divide-slate-100 flex-1">
                    {summary.mostUsedFeatures.map((feat, idx) => (
                      <div key={feat.featureId} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold text-[10px] flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-800">{feat.featureName}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-extrabold text-slate-900">{feat.totalInteractions}</span>
                            <span className="text-slate-400 text-[10px]">actions</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(12, (feat.totalInteractions / (summary.mostUsedFeatures[0]?.totalInteractions || 1)) * 100))}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{feat.uniqueUsersCount} unique staff users &bull; {feat.avgPerUser} avg/user</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Leave Be (Stable)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. What Users Avoid / Underutilized */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">What Staff Avoid (Underutilized)</h3>
                        <p className="text-[11px] text-amber-800 font-medium">Near-zero interactions, ignored submenus, or high friction</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                      Friction / Low Usage
                    </span>
                  </div>

                  <div className="p-5 divide-y divide-slate-100 flex-1">
                    {summary.avoidedFeatures.length > 0 ? (
                      summary.avoidedFeatures.slice(0, 6).map((feat) => (
                        <div key={feat.featureId} className="py-3.5 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                              <span className="font-bold text-slate-800">{feat.featureName}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              {feat.totalInteractions} {feat.totalInteractions === 1 ? 'action' : 'actions'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed pl-4 border-l-2 border-amber-300">
                            {feat.recommendationReason}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pl-4">
                            <span>Category: {feat.category}</span>
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Simplify or Promote
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        No avoided features detected in this timeframe.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Feature Hierarchy Matrix Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Feature Utilization &amp; Adoption Matrix</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Full breakdown of feature interactions, usage tier, and engineering recommendation.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    {summary.mostUsedFeatures.length + summary.avoidedFeatures.length} Tracked Features
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                        <th className="py-3 px-4">Feature / Module</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Interactions</th>
                        <th className="py-3 px-3">Staff Users</th>
                        <th className="py-3 px-3">Usage Tier</th>
                        <th className="py-3 px-3">Recommendation</th>
                        <th className="py-3 px-4">Action Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...summary.mostUsedFeatures, ...summary.avoidedFeatures].map(feat => {
                        const isLeaveBe = feat.statusRecommendation === 'leave_be';
                        const isRefine = feat.statusRecommendation === 'refine';
                        return (
                          <tr key={feat.featureId} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              {feat.featureName}
                            </td>
                            <td className="py-3 px-3 text-slate-500 capitalize">{feat.category}</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">{feat.totalInteractions}</td>
                            <td className="py-3 px-3 text-slate-600">{feat.uniqueUsersCount} users</td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  feat.usageTier === 'high'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : feat.usageTier === 'moderate'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {feat.usageTier}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                                  isLeaveBe
                                    ? 'text-emerald-700'
                                    : isRefine
                                    ? 'text-blue-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {isLeaveBe ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Leave Be
                                  </>
                                ) : isRefine ? (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" /> Refine
                                  </>
                                ) : (
                                  <>
                                    <ArrowRight className="w-3.5 h-3.5" /> Simplify / Promote
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed max-w-sm">
                              {feat.recommendationReason}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOW-ENGAGEMENT BOUNCES (USERS WHO LOG IN AND LEAVE ABRUPTLY) */}
          {subTab === 'bounces' && (
            <div className="space-y-6">
              {/* Educational Alert Banner */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-rose-900">
                    Low-Engagement Session Tracker (Bounce &amp; Abandonment Diagnostic)
                  </h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    When a staff member logs into the platform and leaves after less than 90 seconds with minimal (0–1) interactions, it signals potential UX confusion, unclear next steps, or lack of assigned academic responsibilities. Below is the list of identified low-engagement sessions so school leadership can intervene proactively.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-rose-900">
                    <div>
                      Overall Bounce Rate:{' '}
                      <span className="font-extrabold underline">{summary.bounceStats.bounceRatePercentage}%</span>
                    </div>
                    <div>
                      Average Time Before Leaving:{' '}
                      <span className="font-extrabold underline">{summary.bounceStats.avgBounceDurationSeconds} seconds</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role-by-Role Bounce Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(summary.bounceStats.roleBounceBreakdown).map(([role, rawStats]) => {
                  const stats = rawStats as { total: number; bounced: number; rate: number };
                  return (
                    <div key={role} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        {role.replace('_', ' ')}
                      </span>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-xl font-black text-slate-900">{stats.rate}%</span>
                        <span className="text-xs font-semibold text-slate-500 font-mono">
                          {stats.bounced}/{stats.total}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full ${stats.rate > 25 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${stats.rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Logged Bounce Sessions List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Recent Low-Engagement Sessions ({summary.bounceStats.bouncedSessions.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Staff members who logged in and exited without meaningful interaction
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono font-medium">Real-Time Detection</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {summary.bounceStats.bouncedSessions.length > 0 ? (
                    summary.bounceStats.bouncedSessions.map(sess => (
                      <div key={sess.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 text-sm">
                            {sess.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{sess.userName}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                                {sess.userRole.replace('_', ' ')}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">({sess.userEmail})</span>
                            </div>
                            <p className="text-xs text-rose-700 font-medium mt-1 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                              <span>{sess.bounceReason || 'Logged in and left immediately without interacting'}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                              <span>Logged in: {new Date(sess.loginTime).toLocaleDateString()} at {new Date(sess.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>&bull;</span>
                              <span>Duration: <strong className="text-slate-700 font-mono">{sess.durationSeconds}s</strong></span>
                              <span>&bull;</span>
                              <span>Exit Page: <strong className="text-slate-700">{sess.exitPage || 'Dashboard'}</strong></span>
                              <span>&bull;</span>
                              <span>Interactions: <strong className="text-slate-700 font-mono">{sess.interactionCount}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handleOpenReengageModal(sess)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Follow-up / Re-engage</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No low-engagement bounces recorded!</p>
                      <p className="text-slate-400 mt-1">All logged-in staff members engaged actively in academic workflows.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXECUTIVE DECISION ROADMAP (REFINE VS LEAVE BE) */}
          {subTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Leave Be (Green) */}
                <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-6 border-t-4 border-t-emerald-500">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-extrabold text-base text-slate-900">Features to Leave Be</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    High adoption &amp; steady habits. Do not disrupt existing layouts or workflows.
                  </p>

                  <div className="space-y-3">
                    {summary.featuresToLeaveBe.map(feat => (
                      <div key={feat.featureId} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1">
                          <span>{feat.featureName}</span>
                          <span className="font-mono text-emerald-700 font-extrabold">{feat.totalInteractions} acts</span>
                        </div>
                        <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                          {feat.recommendationReason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Features to Refine (Blue/Yellow) */}
                <div className="bg-white rounded-2xl border border-blue-200 shadow-xs p-6 border-t-4 border-t-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h3 className="font-extrabold text-base text-slate-900">Features to Refine</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Moderate intent with user hesitation. Add guided steppers, tooltips, or shortcuts.
                  </p>

                  <div className="space-y-3">
                    {summary.featuresToRefine.map(feat => (
                      <div key={feat.featureId} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-950 mb-1">
                          <span>{feat.featureName}</span>
                          <span className="font-mono text-blue-700 font-extrabold">{feat.totalInteractions} acts</span>
                        </div>
                        <p className="text-[11px] text-blue-800/80 leading-relaxed">
                          {feat.recommendationReason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Underutilized / Simplify (Amber) */}
                <div className="bg-white rounded-2xl border border-amber-200 shadow-xs p-6 border-t-4 border-t-amber-500">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight className="w-5 h-5 text-amber-600" />
                    <h3 className="font-extrabold text-base text-slate-900">Features Avoided</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Staff avoid or ignore these tools. Promote with direct shortcuts or automate.
                  </p>

                  <div className="space-y-3">
                    {summary.avoidedFeatures.slice(0, 5).map(feat => (
                      <div key={feat.featureId} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-950 mb-1">
                          <span>{feat.featureName}</span>
                          <span className="font-mono text-amber-700 font-extrabold">{feat.totalInteractions} acts</span>
                        </div>
                        <p className="text-[11px] text-amber-800/80 leading-relaxed">
                          {feat.recommendationReason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE ACTION STREAM */}
          {subTab === 'stream' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Chronological Telemetry Stream ({summary.recentActions.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time feed of staff actions, file uploads, marks captures, and navigation
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">Live Ingestion</span>
              </div>

              <div className="divide-y divide-slate-100">
                {summary.recentActions.length > 0 ? (
                  summary.recentActions.map(act => (
                    <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          <MousePointer className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{act.userName}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                              {act.userRole}
                            </span>
                            <span className="text-xs text-slate-500">&bull;</span>
                            <span className="font-semibold text-xs text-indigo-700">{act.featureName}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{act.details}</p>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                            Action Type: <strong className="uppercase">{act.actionType}</strong> &bull; Category: {act.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No action events recorded in this timeframe.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* RE-ENGAGEMENT MODAL */}
      {targetBouncedSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <span>Re-engage Staff Member</span>
              </h3>
              <button
                onClick={() => setTargetBouncedSession(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                <div><strong>Recipient:</strong> {targetBouncedSession.userName} ({targetBouncedSession.userEmail})</div>
                <div><strong>Session:</strong> Logged in for {targetBouncedSession.durationSeconds}s on {targetBouncedSession.exitPage}</div>
                <div><strong>Exit Reason:</strong> {targetBouncedSession.bounceReason}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Support / Guided Onboarding Message:
                </label>
                <textarea
                  value={reengagementMessage}
                  onChange={e => setReengagementMessage(e.target.value)}
                  rows={5}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {messageSentSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Support prompt dispatched to {targetBouncedSession.userName} successfully!</span>
                </div>
              ) : (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setTargetBouncedSession(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendReengagePrompt}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send In-App Assistance</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
