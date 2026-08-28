import React, { useState } from 'react';
import { BookOpen, CheckCircle2, GraduationCap, ShieldCheck, X } from 'lucide-react';

const steps = [
  { title: 'Your access is automatic', text: 'Use the one login screen. The platform opens only the school, people, and tools allowed by your account.', icon: ShieldCheck },
  { title: 'Work by teacher, subject, and class', text: 'Open Students & Marks to choose an assigned class, manage its roster, and upload Excel, PDF, or photographed marks sheets.', icon: GraduationCap },
  { title: 'Keep the evidence', text: 'Uploaded marks sheets are reviewed before saving and kept in the Knowledge Hub as the source record.', icon: BookOpen },
  { title: 'Ready to work', text: 'Use the compact dashboard for your classes, assessments, and shared resources.', icon: CheckCircle2 },
];

export const EssentialsTutorial: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl"><div className="flex justify-between"><span className="text-xs font-black uppercase tracking-widest text-indigo-600">Essentials · {index + 1}/{steps.length}</span><button onClick={onDone} aria-label="Skip tutorial"><X className="h-5 w-5" /></button></div><step.icon className="mt-8 h-12 w-12 text-[var(--school-primary)]" /><h2 className="mt-5 text-2xl font-black text-slate-900">{step.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p><div className="mt-8 flex items-center justify-between"><button onClick={onDone} className="text-xs font-bold text-slate-500">Skip tutorial</button><div className="flex gap-2">{index > 0 && <button onClick={() => setIndex(index - 1)} className="rounded-xl border px-4 py-2 text-xs font-bold">Back</button>}<button onClick={() => index === steps.length - 1 ? onDone() : setIndex(index + 1)} className="rounded-xl bg-[var(--school-primary)] px-5 py-2 text-xs font-black text-white">{index === steps.length - 1 ? 'Finish' : 'Next'}</button></div></div></div></div>;
};
