import React, { useState, useMemo } from 'react';
import {
  Search,
  FileText,
  BookOpen,
  Users,
  GraduationCap,
  Layers,
  FileCode,
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, setActiveTab }) => {
  const { activeSchool, currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'ASSESSMENTS' | 'KNOWLEDGE' | 'TEACHERS' | 'SUBJECTS' | 'TEMPLATES'>('ALL');

  // Sample searchable index scoped to active school permission context
  const mockSearchData = useMemo(() => {
    return [
      {
        id: 'search-1',
        title: 'Grade 4 Mathematics Term 3 Test',
        category: 'ASSESSMENTS',
        subtitle: 'Mathematics • Grade 4 • Term 3 • Draft',
        tab: 'assessments',
        badge: 'Draft',
        badgeColor: 'bg-amber-100 text-amber-800',
      },
      {
        id: 'search-2',
        title: 'Grade 7 English FAL Literature Assessment',
        category: 'ASSESSMENTS',
        subtitle: 'English FAL • Grade 7 • Term 2 • Approved',
        tab: 'assessments',
        badge: 'Approved',
        badgeColor: 'bg-emerald-100 text-emerald-800',
      },
      {
        id: 'search-3',
        title: 'Natural Sciences & Tech Project Guide',
        category: 'ASSESSMENTS',
        subtitle: 'NST • Grade 5 • Term 3 • Submitted for Moderation',
        tab: 'assessments',
        badge: 'In Moderation',
        badgeColor: 'bg-blue-100 text-blue-800',
      },
      {
        id: 'search-4',
        title: 'CAPS Mathematics Curriculum Guidelines 2026',
        category: 'KNOWLEDGE',
        subtitle: 'Knowledge Hub • CAPS Official Policy Document',
        tab: 'knowledge',
        badge: 'PDF Guide',
        badgeColor: 'bg-slate-100 text-slate-700',
      },
      {
        id: 'search-5',
        title: 'Grade 6 Social Sciences Geography Exemplar Paper',
        category: 'KNOWLEDGE',
        subtitle: 'Knowledge Hub • Shared Department Resource',
        tab: 'knowledge',
        badge: 'Exemplar',
        badgeColor: 'bg-purple-100 text-purple-800',
      },
      {
        id: 'search-6',
        title: 'Mr. Sipho Nkosi (HOD Natural Sciences)',
        category: 'TEACHERS',
        subtitle: 'Senior Teacher • Senior Phase • s.nkosi@apexprimary.edu.za',
        tab: 'users',
        badge: 'HOD',
        badgeColor: 'bg-indigo-100 text-indigo-800',
      },
      {
        id: 'search-7',
        title: 'Mrs. Sarah Smith (Grade 4 Educator)',
        category: 'TEACHERS',
        subtitle: 'Intermediate Phase • m.smith@apexprimary.edu.za',
        tab: 'users',
        badge: 'Teacher',
        badgeColor: 'bg-slate-100 text-slate-700',
      },
      {
        id: 'search-8',
        title: 'Mathematics (Intermediate & Senior Phase)',
        category: 'SUBJECTS',
        subtitle: 'Academic Structure • Code: MATH-IP',
        tab: 'academic',
        badge: 'Subject',
        badgeColor: 'bg-blue-100 text-blue-800',
      },
      {
        id: 'search-9',
        title: 'Life Skills & Physical Education (Foundation Phase)',
        category: 'SUBJECTS',
        subtitle: 'Academic Structure • Code: LS-FP',
        tab: 'academic',
        badge: 'Subject',
        badgeColor: 'bg-blue-100 text-blue-800',
      },
      {
        id: 'search-10',
        title: 'Standard Bloom\'s Taxonomy Assessment Template',
        category: 'TEMPLATES',
        subtitle: 'Assessment Templates • Grade 4–7 Standard Layout',
        tab: 'templates',
        badge: 'Template',
        badgeColor: 'bg-emerald-100 text-emerald-800',
      },
    ];
  }, []);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return mockSearchData.slice(0, 5); // Return recent / top items
    const q = query.toLowerCase();
    return mockSearchData.filter(item => {
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchQuery =
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [query, selectedCategory, mockSearchData]);

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ASSESSMENTS':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'KNOWLEDGE':
        return <BookOpen className="w-4 h-4 text-purple-600" />;
      case 'TEACHERS':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'SUBJECTS':
        return <Layers className="w-4 h-4 text-amber-600" />;
      case 'TEMPLATES':
        return <FileCode className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assessments, resources, teachers, subjects, templates..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-100 flex items-center space-x-1 overflow-x-auto text-xs bg-white">
          {(['ALL', 'ASSESSMENTS', 'KNOWLEDGE', 'TEACHERS', 'SUBJECTS', 'TEMPLATES'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Results' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-1 divide-y divide-slate-100">
          {filteredResults.length > 0 ? (
            filteredResults.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveTab(item.tab);
                  onClose();
                }}
                className="p-3 hover:bg-blue-50/70 rounded-xl transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-slate-100 group-hover:bg-blue-100 rounded-lg shrink-0 transition-colors">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No matching items found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching for keywords like "Math", "Grade 4", or "Exemplar"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between font-medium">
          <span>Search permissions scoped to <strong className="text-slate-700">{activeSchool?.name || 'School Context'}</strong></span>
          <span className="text-blue-600 font-bold">Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
