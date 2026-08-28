import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  Share2,
  Megaphone,
  X,
  Check,
  ExternalLink,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  schoolId?: string;
  type: 'RETURNED' | 'COMMENT' | 'WORKFLOW' | 'RESOURCE' | 'ANNOUNCEMENT' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  isUnread: boolean;
  targetTab?: string;
  metadata?: {
    subject?: string;
    grade?: string;
    author?: string;
  };
}

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'ASSESSMENTS' | 'ANNOUNCEMENTS'>('ALL');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'UNREAD') return n.isUnread;
    if (activeFilter === 'ASSESSMENTS') return n.type === 'RETURNED' || n.type === 'WORKFLOW' || n.type === 'COMMENT';
    if (activeFilter === 'ANNOUNCEMENTS') return n.type === 'ANNOUNCEMENT' || n.type === 'SYSTEM';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'RETURNED':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'COMMENT':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'WORKFLOW':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'RESOURCE':
        return <Share2 className="w-4 h-4 text-purple-600" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const unreadCount = notifications.filter(n => n.isUnread).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-end p-4 pt-16">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Notifications Center</h3>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b border-slate-100 flex items-center space-x-1 text-xs bg-white">
          {(['ALL', 'UNREAD', 'ASSESSMENTS', 'ANNOUNCEMENTS'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer ${
                activeFilter === filter
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (notification.isUnread) onMarkAsRead(notification.id);
                  if (notification.targetTab) {
                    setActiveTab(notification.targetTab);
                    onClose();
                  }
                }}
                className={`p-3 rounded-xl transition-all cursor-pointer flex items-start space-x-3 ${
                  notification.isUnread ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50'
                }`}
              >
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{notification.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{notification.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notification.message}</p>
                  {notification.metadata && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {notification.metadata.subject && (
                        <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {notification.metadata.subject}
                        </span>
                      )}
                      {notification.metadata.grade && (
                        <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {notification.metadata.grade}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {notification.isUnread && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1.5 animate-pulse"></span>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No notifications in this category</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
          All notifications are synced in real-time with school workflows.
        </div>
      </div>
    </div>
  );
};
