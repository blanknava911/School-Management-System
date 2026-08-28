import React, { useEffect, useState } from 'react';
import { BookOpen, ClipboardCheck, GraduationCap, Upload, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';

export const SchoolDashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { activeSchool, currentUser } = useAuth();
  const [stats, setStats] = useState({ staff: 0, assignments: 0, resources: 0 });
  useEffect(() => {
    if (!activeSchool) return;
    Promise.all([
      ApiService.getUsers(activeSchool.id).catch(() => []),
      ApiService.getTeachingAssignments(activeSchool.id, currentUser?.role === 'TEACHER' ? currentUser.id : undefined).catch(() => []),
      ApiService.getKnowledgeResources(activeSchool.id).catch(() => []),
    ]).then(([users, assignments, resources]) => setStats({ staff: users.length, assignments: assignments.length, resources: resources.length }));
  }, [activeSchool, currentUser]);
  if (!activeSchool || !currentUser) return null;
  const cards = [
    { label: currentUser.role === 'TEACHER' ? 'My classes and subjects' : 'Teaching assignments', value: stats.assignments, icon: GraduationCap, tab: 'students' },
    { label: 'Knowledge resources', value: stats.resources, icon: BookOpen, tab: 'knowledge' },
    { label: 'Active staff accounts', value: stats.staff, icon: Users, tab: 'users' },
  ];
  return <div className="mx-auto max-w-6xl space-y-6">
    <section className="rounded-3xl p-7 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${activeSchool.primaryColor || '#1e3a8a'}, ${activeSchool.secondaryColor || '#0d9488'})` }}><p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{activeSchool.name}</p><h1 className="mt-2 text-3xl font-black">Welcome back, {currentUser.fullName.split(' ')[0]}</h1><p className="mt-2 max-w-2xl text-sm opacity-85">Open the class, assessment, or resource you need. Your access follows your assigned school role.</p></section>
    <section className="grid gap-4 md:grid-cols-3">{cards.map(card => <button key={card.label} onClick={() => setActiveTab(card.tab)} className="rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><card.icon className="h-5 w-5 text-[var(--school-primary)]" /><div className="mt-4 text-3xl font-black text-slate-900">{card.value}</div><div className="text-xs font-bold text-slate-500">{card.label}</div></button>)}</section>
    <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="font-black text-slate-900">Quick actions</h2><p className="mt-1 text-xs text-slate-500">The most common daily tasks, kept in one place.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><button onClick={() => setActiveTab('students')} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-left text-sm font-bold text-slate-800"><Upload className="h-5 w-5 text-emerald-600" />Upload or enter marks</button><button onClick={() => setActiveTab('assessments')} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-left text-sm font-bold text-slate-800"><ClipboardCheck className="h-5 w-5 text-indigo-600" />Open assessments</button><button onClick={() => setActiveTab('knowledge')} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-left text-sm font-bold text-slate-800"><BookOpen className="h-5 w-5 text-violet-600" />Browse Knowledge Hub</button></div></section>
  </div>;
};
