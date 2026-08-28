import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Shield,
  Eye,
  LogOut,
  ChevronRight,
  Sparkles,
  Search,
  Bell,
  User as UserIcon,
  Settings,
  Lock,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { GlobalSearchModal } from '../dashboard/GlobalSearchModal';
import { NotificationCenterModal, NotificationItem } from '../dashboard/NotificationCenterModal';
import { ProfileSettingsModal } from '../dashboard/ProfileSettingsModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, activeSchool, superAdminInspectingSchool, clearInspectionMode, logout } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'settings' | 'password' | 'help'>('profile');
  const [isProfileMenuDropdownOpen, setIsProfileMenuDropdownOpen] = useState(false);

  // Initial mock notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      schoolId: activeSchool?.id,
      type: 'RETURNED',
      title: 'Assessment Returned for Revision',
      message: 'Grade 4 Mathematics Term 3 Test returned by HOD Mr. Sipho Nkosi. Formatting & Memo adjustments required.',
      timestamp: '10m ago',
      isUnread: true,
      targetTab: 'assessments',
      metadata: { subject: 'Mathematics', grade: 'Grade 4' },
    },
    {
      id: 'notif-2',
      schoolId: activeSchool?.id,
      type: 'WORKFLOW',
      title: 'Assessment Approved',
      message: 'Grade 7 English FAL Literature Test signed off and approved by Principal Dr. M. Arthur.',
      timestamp: '1h ago',
      isUnread: true,
      targetTab: 'assessments',
      metadata: { subject: 'English FAL', grade: 'Grade 7' },
    },
    {
      id: 'notif-3',
      schoolId: activeSchool?.id,
      type: 'RESOURCE',
      title: 'New Knowledge Resource Uploaded',
      message: 'Mrs. Sarah Smith uploaded "CAPS Natural Sciences Grade 5 Project Exemplar".',
      timestamp: '3h ago',
      isUnread: false,
      targetTab: 'knowledge',
      metadata: { subject: 'Natural Sciences' },
    },
    {
      id: 'notif-4',
      schoolId: activeSchool?.id,
      type: 'ANNOUNCEMENT',
      title: 'Term 3 Moderation Deadline',
      message: 'Reminder: All Departmental Moderation submissions must be completed before Friday 17:00 SAST.',
      timestamp: '1d ago',
      isUnread: false,
    },
  ]);

  const visibleNotifications = currentUser?.role === 'SUPER_ADMIN' && !superAdminInspectingSchool
    ? notifications
    : notifications.filter(notification => notification.schoolId === activeSchool?.id);
  const unreadCount = visibleNotifications.filter(n => n.isUnread).length;

  const primaryColor = activeSchool?.primaryColor || '#1e3a8a';

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isUnread: false } : n)));
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Super Admin Tenant Context Inspection Banner */}
      {superAdminInspectingSchool && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-inner">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-slate-950 animate-pulse" />
            <span>
              <strong>SUPER ADMIN TENANT INSPECTION MODE:</strong> Currently inspecting isolated data for{' '}
              <span className="underline decoration-slate-900 font-bold">{superAdminInspectingSchool.name}</span> ({superAdminInspectingSchool.id})
            </span>
          </div>
          <button
            onClick={clearInspectionMode}
            className="bg-slate-950 text-white hover:bg-slate-800 text-xs px-3 py-1 rounded-md font-medium transition-colors shadow-xs cursor-pointer"
          >
            Exit Inspection & Return to Platform
          </button>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: School Identity & Breadcrumb */}
        <div className="flex items-center space-x-3">
          {activeSchool ? (
            <div className="flex items-center space-x-3">
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold text-base shadow-xs overflow-hidden shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {activeSchool.logo ? (
                  <img src={activeSchool.logo} alt={activeSchool.name} className="w-full h-full object-contain p-0.5 bg-white" />
                ) : activeSchool.badge ? (
                  <img src={activeSchool.badge} alt={activeSchool.name} className="w-full h-full object-contain p-0.5 bg-white" />
                ) : (
                  activeSchool.name.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-xs italic hidden sm:inline">Platform /</span>
                  <h1 className="text-sm font-bold text-slate-900 leading-none">{activeSchool.name}</h1>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                    {activeSchool.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md mt-0.5 italic">
                  {activeSchool.motto || 'School Assessment Platform'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm shadow-xs">
                S
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-sm font-bold text-slate-900">SAMP Core</h1>
                  <span className="text-blue-600 text-[10px] uppercase font-bold tracking-wider">v1.0 Platform</span>
                </div>
                <p className="text-[11px] text-slate-500 italic">Multi-Tenant School Assessment Infrastructure</p>
              </div>
            </div>
          )}
        </div>

        {/* Center/Right: Global Search Bar, Notifications & User Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Global Search Quick Trigger */}
          {currentUser && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl px-3 py-1.5 text-slate-500 text-xs font-medium transition-all cursor-pointer shadow-2xs"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Search assessments, subjects...</span>
              <kbd className="hidden lg:inline-block bg-white text-slate-400 border border-slate-200 rounded px-1.5 py-0.2 font-mono text-[9px]">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Academic Context Badge */}
          {activeSchool && (
            <div className="hidden lg:flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <span className="font-semibold text-slate-700">Year: {activeSchool.academicYear}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 italic">{activeSchool.terms}</span>
            </div>
          )}

          {/* Notification Center Trigger */}
          {currentUser && (
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Notifications Center"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile & Menu */}
          {currentUser && (
            <div className="relative border-l border-slate-200 pl-3 sm:pl-4">
              <button
                onClick={() => setIsProfileMenuDropdownOpen(!isProfileMenuDropdownOpen)}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.fullName}</div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white border-2 border-white shadow-xs flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.fullName.charAt(0)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-40 text-xs animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setIsProfileMenuDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                    <div className="font-bold text-slate-900">{currentUser.fullName}</div>
                    <div className="text-[10px] text-blue-600 font-bold uppercase">{currentUser.role.replace('_', ' ')}</div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileMenuDropdownOpen(false);
                      setProfileModalTab('profile');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-2 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuDropdownOpen(false);
                      setProfileModalTab('settings');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuDropdownOpen(false);
                      setProfileModalTab('password');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Change Password</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuDropdownOpen(false);
                      setProfileModalTab('help');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 font-semibold flex items-center space-x-2 cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    <span>Help & Support</span>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => {
                      setIsProfileMenuDropdownOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 font-bold flex items-center space-x-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        setActiveTab={setActiveTab}
      />

      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        setActiveTab={setActiveTab}
        notifications={visibleNotifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onMarkAsRead={handleMarkNotificationRead}
      />

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileModalTab}
      />
    </header>
  );
};
