import React, { useEffect, useState } from 'react';
import { Pencil, Search, ShieldCheck, X } from 'lucide-react';
import { ApiService } from '../../services/api';
import { PlatformSchoolAdmin } from '../../types';

export const PlatformSchoolAdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<PlatformSchoolAdmin[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PlatformSchoolAdmin | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const load = async () => setAdmins(await ApiService.getPlatformSchoolAdmins());
  useEffect(() => { load().catch(err => setError(err.message)); }, []);
  const filtered = admins.filter(admin => `${admin.fullName} ${admin.email} ${admin.schoolName}`.toLowerCase().includes(search.toLowerCase()));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      const updated = await ApiService.updatePlatformSchoolAdmin(editing.id, { fullName: editing.fullName, email: editing.email, status: editing.status, password: password || undefined });
      setAdmins(current => current.map(admin => admin.id === updated.id ? updated : admin));
      setEditing(null); setPassword(''); setError('');
    } catch (err: any) { setError(err.message); }
  };
  return <div className="space-y-5">
    <section className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-100 p-3 text-indigo-700"><ShieldCheck className="h-6 w-6" /></div><div><h1 className="text-xl font-black text-slate-900">School administrator accounts</h1><p className="text-xs text-slate-500">Platform access is limited to each school's administrator account and school name.</p></div></div></section>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
    <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school, administrator, or email" className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm" /></div>
    <div className="overflow-hidden rounded-2xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">School</th><th className="px-5 py-3">Administrator</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Status</th><th /></tr></thead><tbody className="divide-y">{filtered.map(admin => <tr key={admin.id}><td className="px-5 py-4 font-bold text-slate-900">{admin.schoolName}</td><td className="px-5 py-4">{admin.fullName}</td><td className="px-5 py-4 font-mono text-xs">{admin.email}</td><td className="px-5 py-4">{admin.status}</td><td className="px-5 py-4 text-right"><button onClick={() => { setEditing({ ...admin }); setPassword(''); }} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700"><Pencil className="h-3.5 w-3.5" />Edit</button></td></tr>)}</tbody></table></div>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"><form onSubmit={save} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between"><div><h3 className="font-black text-slate-900">Edit school administrator</h3><p className="text-xs text-slate-500">{editing.schoolName}</p></div><button type="button" onClick={() => setEditing(null)}><X className="h-5 w-5" /></button></div><label className="block text-xs font-bold">Full name<input required value={editing.fullName} onChange={e => setEditing({ ...editing, fullName: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label><label className="block text-xs font-bold">Email<input required type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label><label className="block text-xs font-bold">New password (optional)<input type="password" minLength={12} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label><label className="block text-xs font-bold">Status<select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as PlatformSchoolAdmin['status'] })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"><option>Active</option><option>Disabled</option></select></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border px-4 py-2 text-xs font-bold">Cancel</button><button className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white">Save</button></div></form></div>}
  </div>;
};
