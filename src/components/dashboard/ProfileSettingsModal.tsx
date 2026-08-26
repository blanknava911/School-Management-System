import React, { useState } from 'react';
import {
  User as UserIcon,
  Settings,
  Lock,
  HelpCircle,
  LogOut,
  X,
  CheckCircle2,
  Shield,
  Building2,
  Mail,
  Phone,
  Save,
  Key,
  ExternalLink,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'settings' | 'password' | 'help';
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const { currentUser, activeSchool, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'password' | 'help'>(initialTab);

  // Form states
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('+27 82 555 0192');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('Profile details updated successfully!');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    if (!currentPassword) {
      setSaveError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setSaveError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSaveError('New passwords do not match.');
      return;
    }

    setSaveSuccess('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    if (!supportSubject || !supportMessage) {
      setSaveError('Please fill in both subject and message.');
      return;
    }
    setSaveSuccess('Support ticket submitted successfully. Our team will contact you shortly.');
    setSupportSubject('');
    setSupportMessage('');
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[560px]">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-slate-900 text-white p-5 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full bg-blue-600 font-bold text-white flex items-center justify-center text-sm shadow-inner">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-white truncate">{currentUser.fullName}</div>
                <div className="text-[10px] text-blue-400 font-mono uppercase font-bold tracking-wider">
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
            </div>

            <nav className="space-y-1 text-xs">
              <button
                onClick={() => { setActiveTab('profile'); setSaveSuccess(''); setSaveError(''); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setSaveSuccess(''); setSaveError(''); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </button>

              <button
                onClick={() => { setActiveTab('password'); setSaveSuccess(''); setSaveError(''); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeTab === 'password' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => { setActiveTab('help'); setSaveSuccess(''); setSaveError(''); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeTab === 'help' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help & Support</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm capitalize">
              {activeTab === 'profile' && 'My Profile Information'}
              {activeTab === 'settings' && 'Account & Notification Settings'}
              {activeTab === 'password' && 'Security & Password Update'}
              {activeTab === 'help' && 'Help & Technical Support'}
            </h3>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {saveSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center space-x-2">
                <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assigned School Context</label>
                    <input
                      type="text"
                      value={activeSchool?.name || 'Platform Administrator'}
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2 text-xs">
                  <label className="block font-bold text-slate-700 mb-1">Assigned System Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {(currentUser.roles || [currentUser.role]).map((r) => (
                      <span key={r} className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-lg text-[11px] border border-blue-200">
                        {r.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800">Notification Preferences</h4>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-slate-700 font-medium">Email notifications when assessments are returned</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-slate-700 font-medium">In-app alert badges for workflow status updates</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-slate-700 font-medium">Knowledge Hub resource upload notifications</span>
                  </label>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800">Workspace Display</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-700">Language Preference</div>
                      <div className="text-[11px] text-slate-500">System UI & Curriculum terminology</div>
                    </div>
                    <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium">
                      <option>English (South Africa)</option>
                      <option>Afrikaans</option>
                      <option>isiZulu</option>
                      <option>isiXhosa</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PASSWORD */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: HELP */}
            {activeTab === 'help' && (
              <div className="space-y-5 text-xs">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start space-x-3">
                  <LifeBuoy className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-900">Need Immediate Assistance?</h4>
                    <p className="text-blue-700 mt-0.5 leading-relaxed">
                      SAMP Core support team is available Monday to Friday, 08:00–17:00 SAST.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendSupport} className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Support Subject</label>
                    <input
                      type="text"
                      value={supportSubject}
                      onChange={e => setSupportSubject(e.target.value)}
                      placeholder="e.g., Question regarding CAPS Assessment Moderation Workflow"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Describe your inquiry</label>
                    <textarea
                      value={supportMessage}
                      onChange={e => setSupportMessage(e.target.value)}
                      rows={3}
                      placeholder="Provide details about what you need assistance with..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Submit Support Ticket
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
