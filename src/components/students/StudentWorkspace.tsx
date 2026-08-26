import React, { useEffect, useMemo, useState } from 'react';
import { FileText, GraduationCap, UploadCloud } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface StudentFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  downloadUrl: string;
}

export const StudentWorkspace: React.FC = () => {
  const { currentUser, activeSchool } = useAuth();
  const [files, setFiles] = useState<StudentFile[]>([]);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/students/${currentUser.id}/uploads?actorUserId=${encodeURIComponent(currentUser.id)}`)
      .then(async response => {
        if (!response.ok) throw new Error((await response.json()).error || 'Could not load uploads.');
        return response.json();
      })
      .then(setFiles)
      .catch(error => setMessage(error.message));
  }, [currentUser]);

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 10 * 1024 * 1024) {
      setMessage('Files must be 10 MB or smaller.');
      return;
    }

    setIsUploading(true);
    setMessage('Uploading...');
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(new Error('Could not read the selected file.'));
        reader.readAsDataURL(file);
      });
      const response = await fetch(`/api/students/${currentUser.id}/uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorUserId: currentUser.id, name: file.name, mimeType: file.type, dataBase64 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      setFiles(current => [result, ...current]);
      setMessage(`${file.name} uploaded successfully.`);
    } catch (error: any) {
      setMessage(error.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 to-sky-600 p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 text-indigo-100">
          <GraduationCap className="h-5 w-5" />
          <span className="text-sm font-bold">{activeSchool?.name}</span>
        </div>
        <h1 className="mt-5 text-3xl font-black">Welcome, {currentUser?.fullName}</h1>
        <p className="mt-2 max-w-2xl text-indigo-100">This is your private student workspace. Only your own uploads are shown here.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Upload schoolwork</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a document from your device. Maximum size: 10 MB.</p>
          <label className="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 px-5 py-10 text-center hover:border-indigo-400">
            <UploadCloud className="h-9 w-9 text-indigo-600" />
            <span className="mt-3 font-bold text-indigo-950">{isUploading ? 'Uploading...' : 'Choose a file'}</span>
            <span className="mt-1 text-xs text-indigo-500">PDF, Word, image, or other school document</span>
            <input type="file" className="sr-only" onChange={handleUpload} disabled={isUploading} />
          </label>
          {message && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</div>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">My uploads</h2>
              <p className="mt-1 text-sm text-slate-500">{files.length} file(s) · {(totalSize / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {files.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 py-12 text-center text-sm text-slate-500">No files uploaded yet.</div>
            ) : files.map(file => (
              <a key={file.id} href={`${file.downloadUrl}?actorUserId=${encodeURIComponent(currentUser?.id || '')}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-indigo-300">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><FileText className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-slate-800">{file.name}</div>
                  <div className="text-xs text-slate-500">{new Date(file.uploadedAt).toLocaleString()} · {(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
