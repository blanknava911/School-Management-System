import React from 'react';
import { Play, FileText, BookOpen, Clock, FileCode, ArrowRight, Sparkles } from 'lucide-react';

interface RecentItem {
  id: string;
  title: string;
  type: 'Assessment Workspace' | 'Knowledge Resource' | 'Template' | 'Report';
  subtitle: string;
  lastEdited: string;
  tab: string;
  progressPercentage?: number;
}

export const ContinueWorkingWidget: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const recentItems: RecentItem[] = [
    {
      id: 'recent-1',
      title: 'Grade 4 Mathematics Term 3 Assessment',
      type: 'Assessment Workspace',
      subtitle: 'Draft • Section A & B Questions completed',
      lastEdited: '15 minutes ago',
      tab: 'assessments',
      progressPercentage: 75,
    },
    {
      id: 'recent-2',
      title: 'CAPS Intermediate Phase Assessment Taxonomy Guide',
      type: 'Knowledge Resource',
      subtitle: 'Knowledge Hub • Policy Document',
      lastEdited: '2 hours ago',
      tab: 'knowledge',
    },
    {
      id: 'recent-3',
      title: 'Grade 7 English FAL Formal Test Template',
      type: 'Template',
      subtitle: 'Assessment Templates • Standard Blueprint',
      lastEdited: 'Yesterday',
      tab: 'templates',
    },
    {
      id: 'recent-4',
      title: 'Term 2 Departmental Academic Moderation Report',
      type: 'Report',
      subtitle: 'Reports • Intermediate Phase Analytics',
      lastEdited: '2 days ago',
      tab: 'reports',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Continue Working</h3>
            <p className="text-[11px] text-slate-500">Resume your recently opened workspaces and draft documents</p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('assessments')}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>View All Workspaces</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recentItems.map(item => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.tab)}
            className="p-4 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 rounded-xl transition-all cursor-pointer flex flex-col justify-between group space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {item.type}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{item.lastEdited}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 mt-2 line-clamp-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.subtitle}</p>
            </div>

            {item.progressPercentage !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>Completion</span>
                  <span>{item.progressPercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.progressPercentage}%` }}></div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
              <span className="flex items-center space-x-1.5">
                <Play className="w-3 h-3 fill-blue-600 text-blue-600" />
                <span>Resume Work</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
