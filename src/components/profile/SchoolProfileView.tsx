import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building,
  Edit3,
  Save,
  X,
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Palette,
  ShieldCheck,
  FileText,
  Calendar,
  Award,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { SchoolType } from '../../types';

export const SchoolProfileView: React.FC = () => {
  const { currentUser, activeSchool, updateSchoolBranding, isLoading } = useAuth();

  // Permission Check: Editable by School Administrator or Principal or Super Admin
  const userRoles = currentUser?.roles && currentUser.roles.length > 0 ? currentUser.roles : [currentUser?.role];
  const canEditProfile = userRoles.some(
    r => r === 'SCHOOL_ADMIN' || r === 'PRINCIPAL' || r === 'SUPER_ADMIN'
  );

  const [isEditMode, setIsEditMode] = useState(false);

  // Editable Form States
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [type, setType] = useState<SchoolType>('Public');
  const [emisNumber, setEmisNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1e3a8a');
  const [secondaryColor, setSecondaryColor] = useState('#0d9488');
  const [logo, setLogo] = useState('');
  const [badge, setBadge] = useState('');

  // Status & Validation Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state with activeSchool when activeSchool changes or when entering edit mode
  useEffect(() => {
    if (activeSchool) {
      setName(activeSchool.name || '');
      setMotto(activeSchool.motto || '');
      setType(activeSchool.type || 'Public');
      setEmisNumber(activeSchool.emisNumber || '');
      setRegistrationNumber(activeSchool.registrationNumber || '');
      setPhone(activeSchool.phone || '');
      setEmail(activeSchool.email || '');
      setWebsite(activeSchool.website || '');
      setAddress(activeSchool.address || '');
      setPostalAddress(activeSchool.postalAddress || '');
      setProvince(activeSchool.province || '');
      setCountry(activeSchool.country || '');
      setAcademicYear(activeSchool.academicYear || '2026');
      setPrimaryColor(activeSchool.primaryColor || '#1e3a8a');
      setSecondaryColor(activeSchool.secondaryColor || '#0d9488');
      setLogo(activeSchool.logo || '');
      setBadge(activeSchool.badge || '');
    }
  }, [activeSchool, isEditMode]);

  if (!activeSchool) return null;

  // Reset / Cancel changes
  const handleCancel = () => {
    setIsEditMode(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (activeSchool) {
      setName(activeSchool.name || '');
      setMotto(activeSchool.motto || '');
      setType(activeSchool.type || 'Public');
      setEmisNumber(activeSchool.emisNumber || '');
      setRegistrationNumber(activeSchool.registrationNumber || '');
      setPhone(activeSchool.phone || '');
      setEmail(activeSchool.email || '');
      setWebsite(activeSchool.website || '');
      setAddress(activeSchool.address || '');
      setPostalAddress(activeSchool.postalAddress || '');
      setProvince(activeSchool.province || '');
      setCountry(activeSchool.country || '');
      setAcademicYear(activeSchool.academicYear || '2026');
      setPrimaryColor(activeSchool.primaryColor || '#1e3a8a');
      setSecondaryColor(activeSchool.secondaryColor || '#0d9488');
      setLogo(activeSchool.logo || '');
      setBadge(activeSchool.badge || '');
    }
  };

  // Image Upload File Handler for PNG, JPG, JPEG
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'badge') => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Invalid image format. Please select a PNG, JPG, or JPEG file.');
      return;
    }

    // Limit size to 4MB for responsive performance
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (target === 'logo') {
          setLogo(reader.result);
        } else {
          setBadge(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Save changes and generate audit trail logs
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    // Validation
    if (!name.trim()) {
      setErrorMsg('School Name is required.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('School Email Address is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Telephone Number is required.');
      return;
    }

    // Prepare Detailed Audit Entries for every changed field
    const auditEntries: Array<{ action: string; details: string }> = [];

    if (name.trim() !== activeSchool.name) {
      auditEntries.push({
        action: 'School Name Updated',
        details: `School Name changed from "${activeSchool.name}" to "${name.trim()}".`,
      });
    }

    if (motto.trim() !== (activeSchool.motto || '')) {
      auditEntries.push({
        action: 'School Motto Changed',
        details: `School Motto changed from "${activeSchool.motto || 'None'}" to "${motto.trim() || 'None'}".`,
      });
    }

    if (type !== activeSchool.type) {
      auditEntries.push({
        action: 'School Type Changed',
        details: `School Type changed from "${activeSchool.type}" to "${type}".`,
      });
    }

    if (emisNumber.trim() !== (activeSchool.emisNumber || '')) {
      auditEntries.push({
        action: 'EMIS Number Updated',
        details: `EMIS Number changed from "${activeSchool.emisNumber || 'None'}" to "${emisNumber.trim() || 'None'}".`,
      });
    }

    if (registrationNumber.trim() !== (activeSchool.registrationNumber || '')) {
      auditEntries.push({
        action: 'Registration Number Updated',
        details: `Registration Number changed from "${activeSchool.registrationNumber || 'None'}" to "${registrationNumber.trim() || 'None'}".`,
      });
    }

    if (phone.trim() !== (activeSchool.phone || '')) {
      auditEntries.push({
        action: 'Telephone Number Updated',
        details: `Telephone Number changed from "${activeSchool.phone || 'None'}" to "${phone.trim() || 'None'}".`,
      });
    }

    if (email.trim() !== (activeSchool.email || '')) {
      auditEntries.push({
        action: 'Email Address Updated',
        details: `Email Address changed from "${activeSchool.email || 'None'}" to "${email.trim() || 'None'}".`,
      });
    }

    if (website.trim() !== (activeSchool.website || '')) {
      auditEntries.push({
        action: 'Website Updated',
        details: `Website URL changed from "${activeSchool.website || 'None'}" to "${website.trim() || 'None'}".`,
      });
    }

    if (address.trim() !== (activeSchool.address || '')) {
      auditEntries.push({
        action: 'Physical Address Updated',
        details: `Physical Address changed from "${activeSchool.address || 'None'}" to "${address.trim() || 'None'}".`,
      });
    }

    if (postalAddress.trim() !== (activeSchool.postalAddress || '')) {
      auditEntries.push({
        action: 'Postal Address Updated',
        details: `Postal Address changed from "${activeSchool.postalAddress || 'None'}" to "${postalAddress.trim() || 'None'}".`,
      });
    }

    if (province.trim() !== (activeSchool.province || '')) {
      auditEntries.push({
        action: 'Province Updated',
        details: `Province changed from "${activeSchool.province || 'None'}" to "${province.trim() || 'None'}".`,
      });
    }

    if (country.trim() !== (activeSchool.country || '')) {
      auditEntries.push({
        action: 'Country Updated',
        details: `Country changed from "${activeSchool.country || 'None'}" to "${country.trim() || 'None'}".`,
      });
    }

    if (academicYear.trim() !== (activeSchool.academicYear || '')) {
      auditEntries.push({
        action: 'Academic Year Updated',
        details: `Academic Year changed from "${activeSchool.academicYear || 'None'}" to "${academicYear.trim() || 'None'}".`,
      });
    }

    if (primaryColor.toLowerCase() !== (activeSchool.primaryColor || '').toLowerCase()) {
      auditEntries.push({
        action: 'Primary Colour Updated',
        details: `Primary Colour changed from "${activeSchool.primaryColor || '#1e3a8a'}" to "${primaryColor}".`,
      });
    }

    if (secondaryColor.toLowerCase() !== (activeSchool.secondaryColor || '').toLowerCase()) {
      auditEntries.push({
        action: 'Secondary Colour Updated',
        details: `Secondary Colour changed from "${activeSchool.secondaryColor || '#0d9488'}" to "${secondaryColor}".`,
      });
    }

    if (logo !== (activeSchool.logo || '')) {
      auditEntries.push({
        action: 'School Logo Changed',
        details: `School Logo updated. Previous: "${activeSchool.logo ? 'Image present' : 'None'}" → New: "${logo ? 'New image loaded' : 'None'}"`,
      });
    }

    if (badge !== (activeSchool.badge || '')) {
      auditEntries.push({
        action: 'School Badge Updated',
        details: `School Badge / Profile Picture updated. Previous: "${activeSchool.badge ? 'Image present' : 'None'}" → New: "${badge ? 'New image loaded' : 'None'}"`,
      });
    }

    // Default entry if no specific field changed but save clicked
    if (auditEntries.length === 0) {
      auditEntries.push({
        action: 'School Profile Re-saved',
        details: `School profile saved with no field value changes for ${name.trim()}.`,
      });
    }

    try {
      await updateSchoolBranding(
        {
          name: name.trim(),
          motto: motto.trim(),
          type,
          emisNumber: emisNumber.trim(),
          registrationNumber: registrationNumber.trim(),
          phone: phone.trim(),
          email: email.trim(),
          website: website.trim(),
          address: address.trim(),
          postalAddress: postalAddress.trim(),
          province: province.trim(),
          country: country.trim(),
          academicYear: academicYear.trim(),
          primaryColor,
          secondaryColor,
          logo,
          badge,
        },
        auditEntries
      );

      setSuccessMsg('School Profile updated successfully.');
      setIsEditMode(false);
    } catch (err: any) {
      console.error('Failed to update school profile:', err);
      setErrorMsg(err?.message || 'Failed to update School Profile. Please try again.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">School Profile</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-600 rounded border border-slate-200">
                {activeSchool.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditMode
                ? 'Modify institutional records, branding assets, contact info, and registration numbers.'
                : 'Official institutional specifications, contact information, and branding identities.'}
            </p>
          </div>
        </div>

        {/* Action Controls Top-Right */}
        <div>
          {!isEditMode ? (
            canEditProfile && (
              <button
                type="button"
                id="btn-edit-school-profile"
                onClick={() => {
                  setSuccessMsg(null);
                  setErrorMsg(null);
                  setIsEditMode(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                id="btn-cancel-school-profile"
                onClick={handleCancel}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border border-slate-300"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                id="btn-save-school-profile"
                onClick={handleSaveChanges}
                disabled={isLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-900 p-1 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Form / Profile View */}
      <form onSubmit={handleSaveChanges} className="space-y-6">
        {/* Banner & Logo Branding Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div
            className="h-28 sm:h-36 w-full relative p-6 flex items-end justify-between transition-colors"
            style={{
              background: `linear-gradient(135deg, ${isEditMode ? primaryColor : activeSchool.primaryColor || '#1e3a8a'} 0%, ${isEditMode ? secondaryColor : activeSchool.secondaryColor || '#0d9488'} 100%)`,
            }}
          >
            <div className="text-white space-y-1 z-10 max-w-xl">
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider text-white">
                {isEditMode ? type : activeSchool.type} School
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white drop-shadow-xs">
                {isEditMode ? name || 'School Name' : activeSchool.name}
              </h1>
              <p className="text-xs text-white/90 italic truncate">
                &ldquo;{isEditMode ? motto || 'School Motto' : activeSchool.motto}&rdquo;
              </p>
            </div>

            <div className="hidden sm:flex items-center space-x-2 z-10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-white text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Academic Year {isEditMode ? academicYear : activeSchool.academicYear}</span>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* School Logo */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span>School Logo</span>
                </label>
                <span className="text-[10px] font-medium text-slate-400">PNG, JPG, JPEG</span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {(isEditMode ? logo : activeSchool.logo) ? (
                    <img
                      src={isEditMode ? logo : activeSchool.logo}
                      alt="School Logo Preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Building className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  {isEditMode ? (
                    <>
                      <div>
                        <label className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg cursor-pointer transition-colors border border-indigo-200">
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          <span>Upload New Logo</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={e => handleImageFileUpload(e, 'logo')}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={logo}
                        onChange={e => setLogo(e.target.value)}
                        placeholder="Or enter Image URL (https://...)"
                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg text-slate-900 bg-white font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                    </>
                  ) : (
                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">Primary Official Logo</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Displayed on report cards, navigation bars, and formal document headers.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* School Badge / Profile Picture */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>School Badge / Crest</span>
                </label>
                <span className="text-[10px] font-medium text-slate-400">PNG, JPG, JPEG</span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {(isEditMode ? badge : activeSchool.badge) ? (
                    <img
                      src={isEditMode ? badge : activeSchool.badge}
                      alt="School Badge Preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Award className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  {isEditMode ? (
                    <>
                      <div>
                        <label className="inline-flex items-center px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg cursor-pointer transition-colors border border-amber-200">
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          <span>Upload New Badge</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={e => handleImageFileUpload(e, 'badge')}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={badge}
                        onChange={e => setBadge(e.target.value)}
                        placeholder="Or enter Image URL (https://...)"
                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg text-slate-900 bg-white font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                    </>
                  ) : (
                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">Official Crest / Badge</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Embedded in diplomas, academic certificates, and emblem watermark backgrounds.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: General & Registration Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>General Institutional & Registration Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* School Name */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                School Name <span className="text-rose-500">*</span>
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              ) : (
                <p className="py-2 text-sm font-extrabold text-slate-900">{activeSchool.name}</p>
              )}
            </div>

            {/* School Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">School Type</label>
              {isEditMode ? (
                <select
                  value={type}
                  onChange={e => setType(e.target.value as SchoolType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Public">Public / Government School</option>
                  <option value="Private">Private School</option>
                  <option value="Academy">Specialized Academy</option>
                  <option value="International">International School</option>
                  <option value="Charter">Charter School</option>
                </select>
              ) : (
                <p className="py-2 text-xs font-semibold text-slate-800">{activeSchool.type} School</p>
              )}
            </div>

            {/* School Motto */}
            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">School Motto</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={motto}
                  onChange={e => setMotto(e.target.value)}
                  placeholder="e.g. Excellence Through Innovation"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="py-2 text-xs italic text-slate-700">
                  {activeSchool.motto || 'No motto specified'}
                </p>
              )}
            </div>

            {/* EMIS Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">EMIS Number</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={emisNumber}
                  onChange={e => setEmisNumber(e.target.value)}
                  placeholder="e.g. 700100452"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="py-2 text-xs font-mono font-bold text-slate-800">
                  {activeSchool.emisNumber || 'Not registered'}
                </p>
              )}
            </div>

            {/* School Registration Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">School Registration Number</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. REG-2026/APEX894"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="py-2 text-xs font-mono font-bold text-slate-800">
                  {activeSchool.registrationNumber || 'Not registered'}
                </p>
              )}
            </div>

            {/* Academic Year */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="py-2 text-xs font-semibold text-slate-800">{activeSchool.academicYear}</p>
              )}
            </div>

            {/* Province */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Province / State</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  placeholder="e.g. Gauteng"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="py-2 text-xs font-medium text-slate-800">{activeSchool.province || 'N/A'}</p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Country</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="e.g. South Africa"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="py-2 text-xs font-medium text-slate-800">{activeSchool.country || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Address Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Contact & Physical Address Specifications</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Telephone Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Telephone Number <span className="text-rose-500">*</span>
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +27 11 794 0912"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="py-2 flex items-center space-x-2 text-slate-800 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeSchool.phone || 'N/A'}</span>
                </div>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              {isEditMode ? (
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. info@school.edu.za"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="py-2 flex items-center space-x-2 text-slate-800 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${activeSchool.email}`} className="hover:underline text-indigo-600">
                    {activeSchool.email || 'N/A'}
                  </a>
                </div>
              )}
            </div>

            {/* Website */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Website URL</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="e.g. https://apexprimary.edu.za"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="py-2 flex items-center space-x-2 text-slate-800 font-medium">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {activeSchool.website ? (
                    <a
                      href={activeSchool.website.startsWith('http') ? activeSchool.website : `https://${activeSchool.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-indigo-600 font-mono text-[11px]"
                    >
                      {activeSchool.website}
                    </a>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>
              )}
            </div>

            {/* Physical Address */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
              {isEditMode ? (
                <textarea
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 100 Education Way, Johannesburg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              ) : (
                <div className="py-2 flex items-start space-x-2 text-slate-800 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{activeSchool.address || 'N/A'}</span>
                </div>
              )}
            </div>

            {/* Postal Address */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Postal Address</label>
              {isEditMode ? (
                <textarea
                  rows={2}
                  value={postalAddress}
                  onChange={e => setPostalAddress(e.target.value)}
                  placeholder="e.g. P.O. Box 7812, Randburg, Johannesburg, 2125"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              ) : (
                <div className="py-2 flex items-start space-x-2 text-slate-800 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{activeSchool.postalAddress || 'Same as Physical Address'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Brand Theme Palette */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Palette className="w-4 h-4 text-purple-600" />
            <span>Brand Colors & Visual Identity Swatches</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Primary Colour */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-800">Primary Branding Colour</label>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl border border-slate-300 shadow-inner shrink-0"
                  style={{ backgroundColor: isEditMode ? primaryColor : activeSchool.primaryColor || '#1e3a8a' }}
                ></div>
                <div className="flex-1">
                  {isEditMode ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer bg-white"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono uppercase text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="font-mono font-bold text-slate-900 uppercase">
                        {activeSchool.primaryColor || '#1e3a8a'}
                      </p>
                      <p className="text-[10px] text-slate-500">Header badges, buttons, active focus states</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary Colour */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-800">Secondary Accent Colour</label>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl border border-slate-300 shadow-inner shrink-0"
                  style={{ backgroundColor: isEditMode ? secondaryColor : activeSchool.secondaryColor || '#0d9488' }}
                ></div>
                <div className="flex-1">
                  {isEditMode ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer bg-white"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono uppercase text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="font-mono font-bold text-slate-900 uppercase">
                        {activeSchool.secondaryColor || '#0d9488'}
                      </p>
                      <p className="text-[10px] text-slate-500">Secondary indicators, accents, and banners</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save & Cancel Bar in Edit Mode */}
        {isEditMode && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between sticky bottom-4 z-20">
            <p className="text-xs text-slate-500 hidden sm:block">
              Ensure all official credentials and image uploads are correct before saving.
            </p>
            <div className="flex items-center space-x-3 ml-auto">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border border-slate-300"
              >
                <X className="w-4 h-4" />
                <span>Discard Changes</span>
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Updates</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
