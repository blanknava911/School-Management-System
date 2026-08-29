import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import {
  Sparkles,
  Building2,
  Palette,
  BookOpen,
  Layers,
  GraduationCap,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface FirstTimeSetupWizardProps {
  onComplete: () => void;
}

export const FirstTimeSetupWizard: React.FC<FirstTimeSetupWizardProps> = ({ onComplete }) => {
  const { activeSchool, completeFirstTimeSetup, isLoading, updateSchoolBranding } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Step 1 & 2 Editable School Info & Branding
  const [schoolName, setSchoolName] = useState(activeSchool?.name || '');
  const [motto, setMotto] = useState(activeSchool?.motto || '');
  const [primaryColor, setPrimaryColor] = useState(activeSchool?.primaryColor || '#1e3a8a');
  const [secondaryColor, setSecondaryColor] = useState(activeSchool?.secondaryColor || '#0d9488');

  // Step 3: South African Primary Phases & Default Grades
  const [phases] = useState<Array<{ name: string; description: string; gradeRange: string }>>([
    { name: 'Foundation Phase', description: 'Grade R to Grade 3', gradeRange: 'Grade R, Grade 1, Grade 2, Grade 3' },
    { name: 'Intermediate Phase', description: 'Grade 4 to Grade 6', gradeRange: 'Grade 4, Grade 5, Grade 6' },
    { name: 'Senior Phase', description: 'Grade 7 Primary Component', gradeRange: 'Grade 7' },
  ]);

  // Step 4: Primary School Default Subjects
  const [primarySubjects, setPrimarySubjects] = useState<Array<{ name: string; code: string; phaseName: string }>>([
    // Foundation Phase
    { name: 'Home Language', code: 'HL-FP', phaseName: 'Foundation Phase' },
    { name: 'First Additional Language', code: 'FAL-FP', phaseName: 'Foundation Phase' },
    { name: 'Mathematics', code: 'MATH-FP', phaseName: 'Foundation Phase' },
    { name: 'Life Skills', code: 'LS-FP', phaseName: 'Foundation Phase' },
    // Intermediate Phase
    { name: 'Home Language', code: 'HL-IP', phaseName: 'Intermediate Phase' },
    { name: 'First Additional Language', code: 'FAL-IP', phaseName: 'Intermediate Phase' },
    { name: 'Mathematics', code: 'MATH-IP', phaseName: 'Intermediate Phase' },
    { name: 'Natural Sciences and Technology', code: 'NST-IP', phaseName: 'Intermediate Phase' },
    { name: 'Social Sciences', code: 'SS-IP', phaseName: 'Intermediate Phase' },
    { name: 'Life Skills', code: 'LS-IP', phaseName: 'Intermediate Phase' },
    // Senior Phase
    { name: 'Home Language', code: 'HL-SP', phaseName: 'Senior Phase' },
    { name: 'First Additional Language', code: 'FAL-SP', phaseName: 'Senior Phase' },
    { name: 'Mathematics', code: 'MATH-SP', phaseName: 'Senior Phase' },
    { name: 'Natural Sciences', code: 'NS-SP', phaseName: 'Senior Phase' },
    { name: 'Social Sciences', code: 'SS-SP', phaseName: 'Senior Phase' },
    { name: 'Technology', code: 'TECH-SP', phaseName: 'Senior Phase' },
    { name: 'Economic and Management Sciences', code: 'EMS-SP', phaseName: 'Senior Phase' },
    { name: 'Life Orientation', code: 'LO-SP', phaseName: 'Senior Phase' },
    { name: 'Creative Arts', code: 'CA-SP', phaseName: 'Senior Phase' },
  ]);

  // Step 5: Grades (Grade R - Grade 7)
  const [primaryGrades, setPrimaryGrades] = useState<Array<{ name: string; code: string; phaseName: string }>>([
    { name: 'Grade R', code: 'GR-R', phaseName: 'Foundation Phase' },
    { name: 'Grade 1', code: 'GR-1', phaseName: 'Foundation Phase' },
    { name: 'Grade 2', code: 'GR-2', phaseName: 'Foundation Phase' },
    { name: 'Grade 3', code: 'GR-3', phaseName: 'Foundation Phase' },
    { name: 'Grade 4', code: 'GR-4', phaseName: 'Intermediate Phase' },
    { name: 'Grade 5', code: 'GR-5', phaseName: 'Intermediate Phase' },
    { name: 'Grade 6', code: 'GR-6', phaseName: 'Intermediate Phase' },
    { name: 'Grade 7', code: 'GR-7', phaseName: 'Senior Phase' },
  ]);

  // Step 6: Staff Invitations
  const [staffList, setStaffList] = useState<Array<{ fullName: string; email: string; role: string }>>([
    { fullName: 'Prof. David Lawson', email: 'd.lawson@school.edu', role: 'PRINCIPAL' },
    { fullName: 'Sarah Jenkins', email: 's.jenkins@school.edu', role: 'HOD' },
    { fullName: 'Michael Roberts', email: 'm.roberts@school.edu', role: 'TEACHER' },
  ]);

  // Helper functions to manage staff list
  const addStaff = () => setStaffList([...staffList, { fullName: '', email: '', role: 'TEACHER' }]);
  const removeStaff = (index: number) => setStaffList(staffList.filter((_, i) => i !== index));

  const handleFinishWizard = async () => {
    try {
      // Update School branding if changed
      await updateSchoolBranding({
        name: schoolName,
        motto,
        primaryColor,
        secondaryColor,
      });

      // Submit setup configuration
      await completeFirstTimeSetup({
        phases,
        subjects: primarySubjects,
        grades: primaryGrades,
        staffList,
      });

      onComplete();
    } catch (err) {
      console.error('Setup wizard completion error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 my-8">
        {/* Wizard Header Banner */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">First-Time Setup Wizard</span>
              <h2 className="text-2xl font-black text-slate-900">{activeSchool?.name} Setup</h2>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
            Step {step} of 7
          </span>
        </div>

        {/* Stepper Navigation */}
        <div className="grid grid-cols-7 gap-2 mb-8 text-center text-[10px] font-bold text-slate-400">
          <div className={`p-1.5 rounded-lg border ${step >= 1 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>1. Info</div>
          <div className={`p-1.5 rounded-lg border ${step >= 2 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>2. Branding</div>
          <div className={`p-1.5 rounded-lg border ${step >= 3 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>3. Phases</div>
          <div className={`p-1.5 rounded-lg border ${step >= 4 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>4. Subjects</div>
          <div className={`p-1.5 rounded-lg border ${step >= 5 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>5. Grades</div>
          <div className={`p-1.5 rounded-lg border ${step >= 6 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>6. Staff</div>
          <div className={`p-1.5 rounded-lg border ${step >= 7 ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200'}`}>7. Finish</div>
        </div>

        {/* STEP 1: VERIFY SCHOOL INFORMATION */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Verify School Information</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">School Motto</label>
                <input
                  type="text"
                  value={motto}
                  onChange={e => setMotto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1"
              >
                <span>Next: Verify Branding</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VERIFY BRANDING */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Palette className="w-5 h-5 text-indigo-600" />
              <span>Verify School Branding & Theme Colors</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="px-3 py-2 border rounded-lg font-mono text-xs uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Secondary Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="px-3 py-2 border rounded-lg font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Live Branding Preview */}
            <div className="p-4 rounded-xl border text-white shadow-sm flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
              <div>
                <h4 className="text-lg font-black">{schoolName}</h4>
                <p className="text-xs opacity-80">{motto}</p>
              </div>
              <span className="px-3 py-1 rounded-md text-xs font-bold text-slate-900 shadow-xs" style={{ backgroundColor: secondaryColor }}>
                2026 Academic Theme
              </span>
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Back</button>
              <button onClick={() => setStep(3)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center space-x-1">
                <span>Next: Departments</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ACADEMIC PHASES */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Primary School Academic Phases</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                South African Primary Schools are structured into 3 distinct CAPS phases by default.
              </p>
            </div>

            <div className="space-y-3">
              {phases.map((ph, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{ph.name}</span>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                      {ph.gradeRange}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{ph.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Back</button>
              <button onClick={() => setStep(4)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center space-x-1">
                <span>Next: Primary Subjects</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PRIMARY SUBJECTS */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>Primary School Subjects (CAPS Default)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Default subjects mapped per phase. You can customize code or add custom subjects below.
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {primarySubjects.map((subj, idx) => (
                <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <span className="w-36 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded shrink-0">
                    {subj.phaseName}
                  </span>
                  <input
                    type="text"
                    value={subj.name}
                    onChange={e => {
                      const updated = [...primarySubjects];
                      updated[idx].name = e.target.value;
                      setPrimarySubjects(updated);
                    }}
                    className="flex-1 px-2.5 py-1 border border-slate-300 rounded font-medium bg-white"
                  />
                  <input
                    type="text"
                    value={subj.code}
                    onChange={e => {
                      const updated = [...primarySubjects];
                      updated[idx].code = e.target.value;
                      setPrimarySubjects(updated);
                    }}
                    className="w-24 px-2.5 py-1 border border-slate-300 rounded uppercase font-mono bg-white text-[11px]"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(3)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Back</button>
              <button onClick={() => setStep(5)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center space-x-1">
                <span>Next: Grades & Classes</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: GRADES & CLASSES */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>Primary School Grades (Grade R – Grade 7)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configured South African primary grades and phase assignments.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {primaryGrades.map((grd, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{grd.name}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">{grd.code}</span>
                  </div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                    {grd.phaseName}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(4)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Back</button>
              <button onClick={() => setStep(6)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center space-x-1">
                <span>Next: Invite Staff</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: INVITE STAFF */}
        {step === 6 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Invite Key Staff & Teachers</span>
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {staffList.map((st, idx) => (
                <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={st.fullName}
                    onChange={e => {
                      const updated = [...staffList];
                      updated[idx].fullName = e.target.value;
                      setStaffList(updated);
                    }}
                    className="flex-1 px-3 py-1.5 border rounded text-xs bg-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={st.email}
                    onChange={e => {
                      const updated = [...staffList];
                      updated[idx].email = e.target.value;
                      setStaffList(updated);
                    }}
                    className="flex-1 px-3 py-1.5 border rounded text-xs bg-white"
                  />
                  <select
                    value={st.role}
                    onChange={e => {
                      const updated = [...staffList];
                      updated[idx].role = e.target.value;
                      setStaffList(updated);
                    }}
                    className="w-32 px-2 py-1.5 border rounded text-xs bg-white"
                  >
                    <option value="PRINCIPAL">Principal</option>
                    <option value="DEPUTY_PRINCIPAL">Deputy Principal</option>
                    <option value="HOD">HOD</option>
                    <option value="TEACHER">Teacher</option>
                  </select>
                  <button onClick={() => removeStaff(idx)} className="text-rose-500 hover:text-rose-700 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addStaff} className="text-xs text-indigo-600 font-bold flex items-center space-x-1">
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(5)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Back</button>
              <button onClick={() => setStep(7)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center space-x-1">
                <span>Next: Review & Launch</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: FINISH SETUP */}
        {step === 7 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">Setup Configuration Complete!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                Your school environment <strong className="text-slate-900">{schoolName}</strong> is fully initialized with isolated data layers, custom branding, academic structures, and staff accounts.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Academic Phases:</span>
                <span className="font-bold text-slate-800">{phases.length} Phases</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Subjects:</span>
                <span className="font-bold text-slate-800">{primarySubjects.length} Configured</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Grades:</span>
                <span className="font-bold text-slate-800">{primaryGrades.length} Grades (Gr R–7)</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Staff Members:</span>
                <span className="font-bold text-slate-800">{staffList.length} Accounts Invited</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button onClick={() => setStep(6)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Back</button>
              <button
                onClick={handleFinishWizard}
                disabled={isLoading}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 mx-auto disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Launching Workspace...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Finish Setup & Open School Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
