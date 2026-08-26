import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronRight, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: 'DEADLINE' | 'EVENT' | 'MODERATION' | 'MEETING';
  location?: string;
  badgeColor: string;
}

export const SchoolCalendarWidget: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const [filter, setFilter] = useState<'ALL' | 'DEADLINE' | 'MODERATION' | 'MEETING'>('ALL');

  const events: CalendarEvent[] = [
    {
      id: 'cal-1',
      title: 'Grade 4 Natural Sciences Term 3 Assessment Submission',
      date: '2026-07-30',
      time: '14:00 SAST',
      category: 'DEADLINE',
      location: 'Assessment Workspace',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'cal-2',
      title: 'Departmental HOD Moderation Meeting - Intermediate Phase',
      date: '2026-08-01',
      time: '09:00 SAST',
      category: 'MODERATION',
      location: 'Staffroom / Online',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'cal-3',
      title: 'CAPS Curriculum Alignment Staff Workshop',
      date: '2026-08-04',
      time: '11:30 SAST',
      category: 'MEETING',
      location: 'Main Auditorium',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'cal-4',
      title: 'Principal Final Assessment Review Sign-Off',
      date: '2026-08-07',
      time: '16:00 SAST',
      category: 'DEADLINE',
      location: 'Principal Office',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  ];

  const filteredEvents = events.filter(e => (filter === 'ALL' ? true : e.category === filter));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">School Academic Calendar</h3>
            <p className="text-[11px] text-slate-500">Upcoming assessment deadlines, moderation & meetings</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="hidden sm:flex items-center space-x-1 text-[11px]">
          {(['ALL', 'DEADLINE', 'MODERATION', 'MEETING'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filter === f ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'ALL' ? 'All Events' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {filteredEvents.map(evt => (
          <div
            key={evt.id}
            className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
            onClick={() => setActiveTab('assessments')}
          >
            <div className="flex items-start space-x-3">
              <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-center shrink-0 shadow-2xs">
                <span className="block text-[10px] font-bold text-blue-600 uppercase">
                  {new Date(evt.date).toLocaleString('default', { month: 'short' })}
                </span>
                <span className="block text-base font-extrabold text-slate-900 leading-tight">
                  {new Date(evt.date).getDate()}
                </span>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${evt.badgeColor}`}>
                    {evt.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{evt.time}</span>
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 mt-1">{evt.title}</h4>
                {evt.location && (
                  <p className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{evt.location}</span>
                  </p>
                )}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
