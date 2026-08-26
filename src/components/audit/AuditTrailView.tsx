import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { AuditLog } from '../../types';
import { History, Search, ShieldCheck, User, Clock, Filter } from 'lucide-react';

interface AuditTrailViewProps {
  isPlatformMode?: boolean;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ isPlatformMode = false }) => {
  const { activeSchool } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getAuditLogs(isPlatformMode ? 'PLATFORM' : activeSchool?.id || 'PLATFORM');
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activeSchool, isPlatformMode]);

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.actorName.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>{isPlatformMode ? 'Platform Audit Trail' : 'School Audit Trail'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isPlatformMode
              ? 'Real-time security events across all multi-tenant schools and platform actions.'
              : `Security audit logs strictly for ${activeSchool?.name} (${activeSchool?.id})`}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter audit logs by actor, action type, or details..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading security logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No audit events match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Actor</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">Tenant ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3 font-mono text-[11px] text-slate-500">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-bold text-slate-900">{l.actorName}</div>
                      <div className="text-[10px] text-indigo-600 font-bold uppercase">{l.actorRole}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold text-[10px] text-slate-800 rounded border border-slate-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-700 font-medium max-w-xs sm:max-w-md truncate">
                      {l.details}
                    </td>
                    <td className="px-6 py-3 font-mono text-[11px] text-slate-500">
                      {l.schoolId || 'PLATFORM'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
