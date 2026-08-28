import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { KnowledgeResource } from '../../types';
import { getUserRoles } from '../../utils/rbac';
import {
  BookOpen,
  Download,
  Folder,
  Tag,
  Search,
  Upload,
  Eye,
  Share2,
  Users,
  CheckCircle2,
  X,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export const KnowledgeHubView: React.FC = () => {
  const { activeSchool, currentUser } = useAuth();

  // Resource list & loading
  const [resources, setResources] = useState<KnowledgeResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Modals & Notifications
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [previewResource, setPreviewResource] = useState<KnowledgeResource | null>(null);
  const [deleteConfirmResource, setDeleteConfirmResource] = useState<KnowledgeResource | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newType, setNewType] = useState<KnowledgeResource['resourceType']>('Lesson Plan');
  const [newFolder, setNewFolder] = useState<string>('Mathematics');
  const [newTags, setNewTags] = useState<string>('CAPS, Grade 4, Term 1');
  const [deptSharing, setDeptSharing] = useState<boolean>(true);
  const [schoolSharing, setSchoolSharing] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const userRoles = getUserRoles(currentUser);
  const isPrincipalOrAdmin = userRoles.some(
    r => r === 'SUPER_ADMIN' || r === 'SCHOOL_ADMIN' || r === 'PRINCIPAL'
  );

  const loadResources = async () => {
    if (!activeSchool) return;
    try {
      setLoading(true);
      const fetched = await ApiService.getKnowledgeResources(activeSchool.id);
      setResources(fetched || []);
    } catch (err) {
      console.error('Failed to load knowledge resources:', err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [activeSchool]);

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !activeSchool || !selectedFile) {
      setUploadError('Choose the PDF, Office document, spreadsheet, or image you want to upload.');
      return;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setUploadError('Files must be 15 MB or smaller.');
      return;
    }

    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      schoolId: activeSchool.id,
      title: newTitle,
      description: newDescription || 'Uploaded teaching resource document.',
      resourceType: newType,
      folder: newFolder,
      tags: tagsArray.length > 0 ? tagsArray : ['Resource'],
      file: selectedFile,
      uploadedByUserId: currentUser?.id || 'usr-me',
      uploadedByName: currentUser?.fullName || 'Teacher',
      departmentSharing: deptSharing,
      wholeSchoolSharing: schoolSharing,
    };

    try {
      setUploading(true);
      setUploadError('');
      const created = await ApiService.createKnowledgeResource(activeSchool.id, payload, currentUser || undefined);
      setResources(prev => [created, ...prev]);
      setIsUploadModalOpen(false);
      setSuccessMsg(`Resource "${newTitle}" uploaded successfully to Knowledge Hub!`);
      setNewTitle('');
      setNewDescription('');
      setSelectedFile(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setUploadError(err.message || 'The resource could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  const canDeleteResource = (r: KnowledgeResource): boolean => {
    if (!currentUser) return false;
    if (isPrincipalOrAdmin) return true; // Principal and School Administrator may delete any resource
    if (userRoles.includes('TEACHER') && r.uploadedByUserId === currentUser.id) {
      return true; // Teachers: may delete own uploads only
    }
    return false;
  };

  const handleDeleteResource = async () => {
    if (!deleteConfirmResource || !activeSchool || !currentUser) return;
    try {
      await ApiService.deleteKnowledgeResource(activeSchool.id, deleteConfirmResource.id, currentUser);
      setResources(prev => prev.filter(r => r.id !== deleteConfirmResource.id));
      setSuccessMsg(`Resource "${deleteConfirmResource.title}" deleted successfully.`);
      setDeleteConfirmResource(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to delete knowledge resource');
    }
  };

  const foldersList = ['Mathematics', 'Sciences', 'Languages', 'Social Sciences', 'Policies', 'General'];
  const resourceTypesList = [
    'CAPS Document',
    'Annual Teaching Plan',
    'Lesson Plan',
    'Worksheet',
    'PowerPoint Presentation',
    'Department Policy',
    'School Policy',
    'Meeting Minutes',
    'Training Material',
    'Reference Document',
    'General Teaching Resource',
  ];

  const filteredResources = resources.filter(res => {
    const matchesKeyword =
      !searchKeyword ||
      res.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      res.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      res.tags.some(t => t.toLowerCase().includes(searchKeyword.toLowerCase()));

    const matchesFolder = selectedFolder === 'ALL' || res.folder === selectedFolder;
    const matchesType = selectedType === 'ALL' || res.resourceType === selectedType;

    return matchesKeyword && matchesFolder && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Knowledge Hub</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central teaching document repository and CAPS resources for <strong className="text-slate-800">{activeSchool?.name}</strong>.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Resource</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search, Folders & Category Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Keyword Search */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="Search resources, titles, tags..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Folder Selector */}
          <div>
            <select
              value={selectedFolder}
              onChange={e => setSelectedFolder(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs outline-none font-medium"
            >
              <option value="ALL">All Subject Folders</option>
              {foldersList.map(f => (
                <option key={f} value={f}>Folder: {f}</option>
              ))}
            </select>
          </div>

          {/* Resource Type Selector */}
          <div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs outline-none font-medium"
            >
              <option value="ALL">All Resource Types</option>
              {resourceTypesList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border">
            Loading Knowledge Hub resources...
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border">
            No knowledge resources found for {activeSchool?.name}. Click "Upload Resource" to add one.
          </div>
        ) : (
          filteredResources.map(res => {
            const deletable = canDeleteResource(res);

            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase flex items-center space-x-1">
                      <Folder className="w-3 h-3 text-indigo-500" />
                      <span>{res.folder}</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono font-bold rounded">
                      {res.fileType?.toUpperCase() || 'PDF'} &bull; {res.fileSize || '1.0 MB'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{res.title}</h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{res.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {res.tags?.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md flex items-center space-x-1">
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        <span>{t}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium">
                    {res.wholeSchoolSharing ? (
                      <span className="text-emerald-600 font-bold flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>Whole School</span>
                      </span>
                    ) : (
                      <span className="text-indigo-600 font-bold flex items-center space-x-1">
                        <Share2 className="w-3 h-3" />
                        <span>Department</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewResource(res)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    {deletable && (
                      <button
                        onClick={() => setDeleteConfirmResource(res)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-600 text-white rounded-xl">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upload Knowledge Resource</h3>
                <p className="text-xs text-slate-500">Add documents to the shared school repository</p>
              </div>
            </div>

            <form onSubmit={handleUploadResource} className="space-y-4 text-xs">
              {uploadError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-semibold text-rose-700">{uploadError}</div>}
              <label className="block rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4 text-center font-bold text-indigo-800 cursor-pointer">
                <Upload className="mx-auto mb-2 h-5 w-5" />
                {selectedFile ? `${selectedFile.name} · ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Choose a document, spreadsheet, PDF, or image *'}
                <input type="file" required className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.ppt,.pptx" onChange={event => setSelectedFile(event.target.files?.[0] || null)} />
              </label>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. CAPS Mathematics Grade 4 Annual Pacing Guide"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Brief description of the document contents..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Folder / Subject *</label>
                  <select
                    value={newFolder}
                    onChange={e => setNewFolder(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 bg-white"
                  >
                    {foldersList.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Resource Type *</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 bg-white"
                  >
                    {resourceTypesList.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="CAPS, Grade 4, Term 1, Assessment"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmResource && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Confirm Resource Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete the resource{' '}
              <strong className="text-slate-900 font-bold">"{deleteConfirmResource.title}"</strong>?
              This action cannot be undone and will be recorded in the audit trail.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmResource(null)}
                className="px-4 py-2 border rounded-lg font-semibold text-slate-700 hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResource}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200 space-y-4">
            <button
              onClick={() => setPreviewResource(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                {previewResource.folder}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{previewResource.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{previewResource.description}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div><strong>Uploaded By:</strong> {previewResource.uploadedByName}</div>
              <div><strong>Resource Type:</strong> {previewResource.resourceType}</div>
              <div><strong>File Type:</strong> {previewResource.fileType?.toUpperCase()}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {previewResource.fileUrl && (
                <button
                  onClick={() => ApiService.downloadFile(previewResource.fileUrl!, previewResource.title).catch(err => setUploadError(err.message))}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
                >
                  <Download className="h-4 w-4" />
                  Download evidence
                </button>
              )}
              <button
                onClick={() => setPreviewResource(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
