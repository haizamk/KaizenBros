'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Shield, 
  Activity, 
  FileText, 
  Settings, 
  Database, 
  Stethoscope, 
  CheckCircle2, 
  Search, 
  Lock, 
  Server,
  Layers,
  Key,
  HardDrive,
  Edit3,
  Eye,
  FileCheck,
  X,
  Filter,
  Save,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Paperclip,
  Download,
  Building2,
  Phone,
  Calendar,
  Trash2,
  Plus,
  AlertTriangle,
  Heart,
  UserCheck,
  UserX
} from 'lucide-react';
import { User, AuditLog, DialysisChair, DialysisMachine, Patient, Nurse, NewRegistration } from '@/types';
import { 
  INITIAL_CHAIRS, 
  INITIAL_MACHINES, 
  INITIAL_PATIENTS, 
  INITIAL_NURSES, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_REGISTRATIONS, 
  VERIFIED_CENTRE_INFO 
} from '@/lib/mock-data';

interface AdminPortalProps {
  auditLogs?: AuditLog[];
  registrations?: NewRegistration[];
  onUpdateRegistration?: (updatedReg: NewRegistration) => void;
  onAuditLog?: (action: string, details: string) => void;
}

export function AdminPortal({ 
  auditLogs = INITIAL_AUDIT_LOGS,
  registrations: propRegistrations,
  onUpdateRegistration,
  onAuditLog
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'pendaftaran' | 'pesakit' | 'pengguna' | 'jururawat' | 'ringkasan' | 'stesen' | 'audit' | 'tetapan'>('pendaftaran');
  const [searchLog, setSearchLog] = useState('');
  const [searchReg, setSearchReg] = useState('');
  const [searchPatient, setSearchPatient] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchNurse, setSearchNurse] = useState('');
  const [filterRegStatus, setFilterRegStatus] = useState<string>('SEMUA');
  const [filterPatientStatus, setFilterPatientStatus] = useState<string>('SEMUA');

  // --- STATE FOR REGISTRATIONS ---
  const [regList, setRegList] = useState<NewRegistration[]>([]);
  const [editingReg, setEditingReg] = useState<NewRegistration | null>(null);
  const [previewDocReg, setPreviewDocReg] = useState<NewRegistration | null>(null);

  // --- STATE FOR PATIENTS (CRUD) ---
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [deletePatientReason, setDeletePatientReason] = useState<string>('Pindah ke Pusat Dialisis Lain');
  const [deletePatientNotes, setDeletePatientNotes] = useState<string>('');

  // --- STATE FOR USERS / PENTADBIR (CRUD) ---
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // --- STATE FOR NURSES (CRUD) ---
  const [nursesList, setNursesList] = useState<Nurse[]>([]);
  const [isAddNurseOpen, setIsAddNurseOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [deletingNurse, setDeletingNurse] = useState<Nurse | null>(null);

  // Load from localStorage / mock on mount
  useEffect(() => {
    // Registrations
    try {
      const storedRegs = localStorage.getItem('kaizenbros_registrations');
      if (storedRegs) {
        const parsed: NewRegistration[] = JSON.parse(storedRegs);
        const existingIds = new Set(parsed.map(r => r.id));
        const combined = [...parsed];
        INITIAL_REGISTRATIONS.forEach(init => {
          if (!existingIds.has(init.id)) combined.push(init);
        });
        setRegList(combined);
      } else if (propRegistrations && propRegistrations.length > 0) {
        setRegList(propRegistrations);
      } else {
        setRegList(INITIAL_REGISTRATIONS);
      }
    } catch {
      setRegList(INITIAL_REGISTRATIONS);
    }

    // Patients
    try {
      const storedPatients = localStorage.getItem('kaizenbros_patients');
      if (storedPatients) {
        setPatientsList(JSON.parse(storedPatients));
      } else {
        setPatientsList(INITIAL_PATIENTS);
      }
    } catch {
      setPatientsList(INITIAL_PATIENTS);
    }

    // Users
    try {
      const storedUsers = localStorage.getItem('kaizenbros_users');
      if (storedUsers) {
        setUsersList(JSON.parse(storedUsers));
      } else {
        setUsersList([
          {
            id: 1,
            name: 'Dr. Azman bin Khairuddin',
            email: 'dr.azman@kaizenbrosdialysis.com.my',
            role: 'NEPHROLOGIST',
            phone: '019-3389922',
            ic_number: '740518-10-5891',
            is_active: true,
            last_login_at: '2026-09-29 08:30:00',
            created_at: '2021-01-15'
          },
          {
            id: 2,
            name: 'Sister Siti Fatimah binti Rahman',
            email: 'siti.fatimah@kaizenbrosdialysis.com.my',
            role: 'HEAD_NURSE',
            phone: '012-3456789',
            ic_number: '820412-10-5322',
            is_active: true,
            last_login_at: '2026-09-29 06:00:00',
            created_at: '2021-02-01'
          },
          {
            id: 3,
            name: 'Staff Nurse Faridah binti Kassim',
            email: 'faridah@kaizenbrosdialysis.com.my',
            role: 'STAFF_NURSE',
            phone: '013-8899123',
            ic_number: '900822-10-5014',
            is_active: true,
            last_login_at: '2026-09-29 13:45:00',
            created_at: '2022-03-10'
          },
          {
            id: 4,
            name: 'Admin En. Roslan bin Jaafar',
            email: 'admin.roslan@kaizenbrosdialysis.com.my',
            role: 'ADMIN',
            phone: '019-2233445',
            ic_number: '800615-10-5123',
            is_active: true,
            last_login_at: '2026-09-29 08:15:00',
            created_at: '2021-05-20'
          }
        ]);
      }
    } catch {
      setUsersList([]);
    }

    // Nurses
    try {
      const storedNurses = localStorage.getItem('kaizenbros_nurses');
      if (storedNurses) {
        setNursesList(JSON.parse(storedNurses));
      } else {
        setNursesList(INITIAL_NURSES);
      }
    } catch {
      setNursesList(INITIAL_NURSES);
    }
  }, [propRegistrations]);

  // Helper to log actions
  const triggerLog = (action: string, details: string) => {
    if (onAuditLog) {
      onAuditLog(action, details);
    }
  };

  // --- REGISTRATION ACTIONS ---
  const handleSaveEditedRegistration = (updated: NewRegistration) => {
    const newList = regList.map(r => r.id === updated.id ? { ...updated, updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19) } : r);
    setRegList(newList);
    try {
      localStorage.setItem('kaizenbros_registrations', JSON.stringify(newList));
    } catch {}
    if (onUpdateRegistration) onUpdateRegistration(updated);
    triggerLog('KEMASKINI_PENDAFTARAN', `Admin mengemaskini status permohonan pendaftaran ${updated.full_name} (${updated.id}) ke ${updated.status}`);
    setEditingReg(null);
  };

  // --- PATIENT CRUD ACTIONS ---
  const handleAddPatient = (newPatient: Omit<Patient, 'id'>) => {
    const newId = patientsList.length > 0 ? Math.max(...patientsList.map(p => p.id)) + 1 : 1;
    const patientObj: Patient = { ...newPatient, id: newId, is_active: true, created_at: new Date().toISOString().slice(0, 10) };
    const updated = [patientObj, ...patientsList];
    setPatientsList(updated);
    try {
      localStorage.setItem('kaizenbros_patients', JSON.stringify(updated));
    } catch {}
    triggerLog('TAMBAH_PESAKIT', `Admin mendaftar pesakit baru: ${patientObj.name} (${patientObj.patient_id_code})`);
    setIsAddPatientOpen(false);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    const updated = patientsList.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    setPatientsList(updated);
    try {
      localStorage.setItem('kaizenbros_patients', JSON.stringify(updated));
    } catch {}
    triggerLog('KEMASKINI_PESAKIT', `Admin mengemaskini rekod pesakit: ${updatedPatient.name} (${updatedPatient.patient_id_code})`);
    setEditingPatient(null);
  };

  const handleConfirmDeletePatient = () => {
    if (!deletingPatient) return;
    // Mark as inactive / removed with reason
    const updated = patientsList.map(p => p.id === deletingPatient.id ? { 
      ...p, 
      is_active: false,
      allergies: p.allergies ? `${p.allergies} | [Dikeluarkan: ${deletePatientReason} - ${deletePatientNotes}]` : `[Dikeluarkan: ${deletePatientReason} - ${deletePatientNotes}]`
    } : p);
    setPatientsList(updated);
    try {
      localStorage.setItem('kaizenbros_patients', JSON.stringify(updated));
    } catch {}
    triggerLog('PADAM_PESAKIT', `Admin mengeluarkan pesakit: ${deletingPatient.name} (${deletingPatient.patient_id_code}) - Alasan: ${deletePatientReason}. Nota: ${deletePatientNotes}`);
    setDeletingPatient(null);
    setDeletePatientNotes('');
  };

  // --- USER / ADMIN CRUD ACTIONS ---
  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    const newId = usersList.length > 0 ? Math.max(...usersList.map(u => u.id)) + 1 : 1;
    const userObj: User = { ...newUser, id: newId, created_at: new Date().toISOString().slice(0, 10) };
    const updated = [userObj, ...usersList];
    setUsersList(updated);
    try {
      localStorage.setItem('kaizenbros_users', JSON.stringify(updated));
    } catch {}
    triggerLog('TAMBAH_PENGGUNA', `Admin menambah pengguna sistem: ${userObj.name} (Peranan: ${userObj.role})`);
    setIsAddUserOpen(false);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updated = usersList.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsersList(updated);
    try {
      localStorage.setItem('kaizenbros_users', JSON.stringify(updated));
    } catch {}
    triggerLog('KEMASKINI_PENGGUNA', `Admin mengemaskini maklumat pengguna: ${updatedUser.name} (${updatedUser.role})`);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: number) => {
    const user = usersList.find(u => u.id === userId);
    const updated = usersList.filter(u => u.id !== userId);
    setUsersList(updated);
    try {
      localStorage.setItem('kaizenbros_users', JSON.stringify(updated));
    } catch {}
    if (user) {
      triggerLog('PADAM_PENGGUNA', `Admin memadam akses pengguna: ${user.name} (${user.email})`);
    }
    setDeletingUser(null);
  };

  // --- NURSE CRUD ACTIONS ---
  const handleAddNurse = (newNurse: Omit<Nurse, 'id'>) => {
    const newId = nursesList.length > 0 ? Math.max(...nursesList.map(n => n.id)) + 1 : 1;
    const nurseObj: Nurse = { ...newNurse, id: newId };
    const updated = [nurseObj, ...nursesList];
    setNursesList(updated);
    try {
      localStorage.setItem('kaizenbros_nurses', JSON.stringify(updated));
    } catch {}
    triggerLog('TAMBAH_JURURAWAT', `Admin mendaftar jururawat baru: ${nurseObj.name} (${nurseObj.staff_id_code})`);
    setIsAddNurseOpen(false);
  };

  const handleUpdateNurse = (updatedNurse: Nurse) => {
    const updated = nursesList.map(n => n.id === updatedNurse.id ? updatedNurse : n);
    setNursesList(updated);
    try {
      localStorage.setItem('kaizenbros_nurses', JSON.stringify(updated));
    } catch {}
    triggerLog('KEMASKINI_JURURAWAT', `Admin mengemaskini rekod jururawat: ${updatedNurse.name} (${updatedNurse.staff_id_code})`);
    setEditingNurse(null);
  };

  const handleDeleteNurse = (nurseId: number) => {
    const nurse = nursesList.find(n => n.id === nurseId);
    const updated = nursesList.filter(n => n.id !== nurseId);
    setNursesList(updated);
    try {
      localStorage.setItem('kaizenbros_nurses', JSON.stringify(updated));
    } catch {}
    if (nurse) {
      triggerLog('PADAM_JURURAWAT', `Admin memadam rekod jururawat: ${nurse.name} (${nurse.staff_id_code})`);
    }
    setDeletingNurse(null);
  };

  // Filtered queries
  const pendingCount = regList.filter(r => r.status === 'BARU').length;

  const filteredRegistrations = regList.filter(reg => {
    const matches = 
      reg.id.toLowerCase().includes(searchReg.toLowerCase()) ||
      reg.full_name.toLowerCase().includes(searchReg.toLowerCase()) ||
      reg.ic_number.includes(searchReg) ||
      reg.phone_number.includes(searchReg) ||
      reg.patient_category.toLowerCase().includes(searchReg.toLowerCase());
    if (filterRegStatus === 'SEMUA') return matches;
    return matches && reg.status === filterRegStatus;
  });

  const filteredPatients = patientsList.filter(p => {
    const matches = 
      p.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
      p.patient_id_code.toLowerCase().includes(searchPatient.toLowerCase()) ||
      p.ic_number.includes(searchPatient) ||
      p.phone.includes(searchPatient);
    if (filterPatientStatus === 'AKTIF') return matches && p.is_active;
    if (filterPatientStatus === 'DIKELUARKAN') return matches && !p.is_active;
    return matches;
  });

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.role.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.phone.includes(searchUser)
  );

  const filteredNurses = nursesList.filter(n => 
    n.name.toLowerCase().includes(searchNurse.toLowerCase()) ||
    n.staff_id_code.toLowerCase().includes(searchNurse.toLowerCase()) ||
    n.nursing_board_no.toLowerCase().includes(searchNurse.toLowerCase()) ||
    n.phone.includes(searchNurse)
  );

  const filteredLogs = auditLogs.filter(log => 
    log.user_name.toLowerCase().includes(searchLog.toLowerCase()) ||
    log.action.toLowerCase().includes(searchLog.toLowerCase()) ||
    log.details.toLowerCase().includes(searchLog.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                PORTAL PENTADBIRAN SISTEM & KAWALAN KLINIKAL
              </span>
              <span className="bg-indigo-950 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-800">
                Akses Pentadbir Aras Tinggi
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              PENTADBIR PUSAT DIALISIS KAIZENBROS
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Pengurusan Lengkap Pesakit, Pentadbir, Jururawat, Mesin Fresenius & Kemasukan Pendaftaran Baru
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
              <div className="text-xs">
                <span className="text-slate-400 block font-semibold">Pangkalan Data:</span>
                <span className="font-bold text-emerald-400">Firebase Firestore (NoSQL)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-14 z-30 px-4 sm:px-8 backdrop-blur">
        <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto py-2">
          {[
            { id: 'pendaftaran', label: 'Kemasukan & Pendaftaran Baru', icon: UserPlus, badge: pendingCount },
            { id: 'pesakit', label: 'Pengurusan Pesakit', icon: Users, badge: patientsList.filter(p => p.is_active).length },
            { id: 'pengguna', label: 'Pentadbir & Pengguna (RBAC)', icon: Shield, badge: usersList.length },
            { id: 'jururawat', label: 'Jururawat Klinikal', icon: Stethoscope, badge: nursesList.length },
            { id: 'ringkasan', label: 'Ringkasan Sistem', icon: Activity },
            { id: 'stesen', label: 'Stesen Mesin Fresenius', icon: Layers },
            { id: 'audit', label: 'Log Audit (Audit Trail)', icon: FileText },
            { id: 'tetapan', label: 'Tetapan Pusat', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer relative ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1 ${
                    tab.id === 'pendaftaran' && pendingCount > 0
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-8 space-y-6">
        
        {/* ========================================================================= */}
        {/* TAB 1: KEMASUKAN & PENDAFTARAN BARU */}
        {/* ========================================================================= */}
        {activeTab === 'pendaftaran' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-950 text-emerald-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-800">
                    Pengurusan Pendaftaran
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Total: {regList.length} Rekod</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">
                  Permohonan Kemasukan Pesakit Baru
                </h2>
                <p className="text-xs text-slate-400">
                  Urus pendaftaran dari borang laman web. Tetapkan penaja (PERKESO/Zakat/JPA), pilihan syif, stesen dan semak dokumen surat rujukan.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Nama / No. IC / Ref..."
                    value={searchReg}
                    onChange={(e) => setSearchReg(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={filterRegStatus}
                  onChange={(e) => setFilterRegStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SEMUA">Semua Status</option>
                  <option value="BARU">Baru (Belum Disemak)</option>
                  <option value="DISEMAK">Sedang Disemak</option>
                  <option value="DILULUSKAN">Diluluskan</option>
                  <option value="DITOLAK">Ditolak</option>
                </select>
              </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-bold block">Jumlah Pendaftaran</span>
                <span className="text-2xl font-black text-white">{regList.length}</span>
              </div>
              <div className="bg-slate-900 border border-amber-500/40 p-4 rounded-2xl bg-amber-950/10">
                <span className="text-xs text-amber-400 uppercase font-bold block">Permohonan Baru</span>
                <span className="text-2xl font-black text-amber-300">{pendingCount}</span>
              </div>
              <div className="bg-slate-900 border border-emerald-500/40 p-4 rounded-2xl bg-emerald-950/10">
                <span className="text-xs text-emerald-400 uppercase font-bold block font-sans">Diluluskan</span>
                <span className="text-2xl font-black text-emerald-300">{regList.filter(r => r.status === 'DILULUSKAN').length}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-cyan-400 uppercase font-bold block">Dokumen Berlampiran</span>
                <span className="text-2xl font-black text-cyan-300">{regList.filter(r => r.document).length}</span>
              </div>
            </div>

            {/* Registrations List Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {filteredRegistrations.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <UserPlus className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="font-bold text-white text-base">Tiada Rekod Pendaftaran Ditemui</p>
                  <p className="text-xs">Tiada pendaftaran pesakit baru yang sepadan dengan carian anda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 font-mono">
                      <tr>
                        <th className="px-4 py-3.5">Ref & Tarikh</th>
                        <th className="px-4 py-3.5">Maklumat Pesakit</th>
                        <th className="px-4 py-3.5">Kategori</th>
                        <th className="px-4 py-3.5">Dokumen Rujukan</th>
                        <th className="px-4 py-3.5">Penaja (Tugas Admin)</th>
                        <th className="px-4 py-3.5">Hari & Syif (Tugas Admin)</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-850/60 transition-colors">
                          <td className="px-4 py-4 font-mono">
                            <span className="text-emerald-400 font-bold block">{reg.id}</span>
                            <span className="text-[10px] text-slate-400">{reg.created_at}</span>
                          </td>

                          <td className="px-4 py-4">
                            <strong className="text-white text-sm block font-bold">{reg.full_name}</strong>
                            <div className="text-[11px] text-slate-400 space-x-2">
                              <span>IC: <strong className="text-slate-300">{reg.ic_number}</strong></span>
                              <span>•</span>
                              <span>HP: <strong className="text-slate-300">{reg.phone_number}</strong></span>
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate max-w-xs">{reg.address}</span>
                          </td>

                          <td className="px-4 py-4">
                            <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded text-[11px] font-bold inline-block">
                              {reg.patient_category}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            {reg.document ? (
                              <button
                                onClick={() => setPreviewDocReg(reg)}
                                className="inline-flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-[11px]"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="truncate max-w-[110px]">{reg.document.name}</span>
                              </button>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Tiada dokumen</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {reg.sponsor_type ? (
                              <span className="text-indigo-300 font-semibold bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded text-[11px]">
                                {reg.sponsor_type}
                              </span>
                            ) : (
                              <span className="text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                Belum Ditetapkan
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {reg.preferred_days || reg.preferred_shift ? (
                              <div className="space-y-0.5 text-[11px]">
                                <span className="text-slate-200 block font-semibold">{reg.preferred_days || '-'}</span>
                                <span className="text-cyan-400 block">{reg.preferred_shift || '-'}</span>
                                {reg.assigned_chair && (
                                  <span className="text-[10px] bg-slate-800 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                    Stesen: {reg.assigned_chair}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                Belum Ditetapkan
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                              reg.status === 'BARU' ? 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse' :
                              reg.status === 'DISEMAK' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' :
                              reg.status === 'DILULUSKAN' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                              'bg-rose-950 text-rose-300 border-rose-700'
                            }`}>
                              {reg.status}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => setEditingReg(reg)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1.5 shadow"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Urus / Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PENGURUSAN PESAKIT (TAMBAH, EDIT, BUANG DENGAN ALASAN) */}
        {/* ========================================================================= */}
        {activeTab === 'pesakit' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-950 text-indigo-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-800">
                    Modul Pesakit Klinikal
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {patientsList.filter(p => p.is_active).length} Aktif / {patientsList.length} Jumlah
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">
                  Pengurusan Rekod Pesakit Dialisis
                </h2>
                <p className="text-xs text-slate-400">
                  Tambah pesakit baru secara manual, kemaskini maklumat klinikal, atau buang / keluarkan pesakit dengan alasan klinikal berintegriti.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Nama / ID / MyKad..."
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={filterPatientStatus}
                  onChange={(e) => setFilterPatientStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SEMUA">Semua Status</option>
                  <option value="AKTIF">Pesakit Aktif Sahaja</option>
                  <option value="DIKELUARKAN">Dikeluarkan / Tamat</option>
                </select>

                <button
                  onClick={() => setIsAddPatientOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pesakit Baru</span>
                </button>
              </div>
            </div>

            {/* Patients Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 font-mono">
                    <tr>
                      <th className="px-4 py-3.5">ID & Nama Pesakit</th>
                      <th className="px-4 py-3.5">No. MyKad & HP</th>
                      <th className="px-4 py-3.5">Akses Vaskular</th>
                      <th className="px-4 py-3.5">Penaja</th>
                      <th className="px-4 py-3.5">Jadual & Stesen</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredPatients.map((p) => (
                      <tr key={p.id} className={`hover:bg-slate-850/50 transition-colors ${!p.is_active ? 'opacity-60 bg-slate-950/40' : ''}`}>
                        <td className="px-4 py-3.5">
                          <span className="text-emerald-400 font-mono font-bold block">{p.patient_id_code}</span>
                          <strong className="text-white text-sm block">{p.name}</strong>
                          <span className="text-[10px] text-slate-400">{p.age} thn ({p.gender}) • Darah: {p.blood_group}</span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-300 font-mono">
                          <p className="text-slate-200 font-semibold">{p.ic_number}</p>
                          <p className="text-slate-400 text-[11px]">{p.phone}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-cyan-300 block">{p.vascular_access}</span>
                          <span className="text-[10px] text-slate-400">{p.access_location}</span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-semibold border border-indigo-800 text-[11px] inline-block">
                            {p.sponsor.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="text-slate-200 font-semibold">{p.schedule_pattern.replace(/_/g, ' ')}</p>
                          <p className="text-cyan-400 text-[11px]">{p.preferred_shift} • <strong className="text-emerald-400 font-mono">{p.assigned_chair}</strong></p>
                        </td>

                        <td className="px-4 py-3.5">
                          {p.is_active ? (
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              Aktif
                            </span>
                          ) : (
                            <span className="bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              Dikeluarkan
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setEditingPatient(p)}
                            className="p-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center"
                            title="Edit Maklumat Pesakit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {p.is_active && (
                            <button
                              onClick={() => {
                                setDeletingPatient(p);
                                setDeletePatientReason('Pindah ke Pusat Dialisis Lain');
                                setDeletePatientNotes('');
                              }}
                              className="p-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center"
                              title="Keluarkan / Buang Pesakit Dengan Alasan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PENGURUSAN PENGGUNA & PENTADBIR (TAMBAH, EDIT, PADAM) */}
        {/* ========================================================================= */}
        {activeTab === 'pengguna' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-purple-950 text-purple-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-purple-800">
                    Kawalan Hak Akses RBAC
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{usersList.length} Akaun</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">
                  Pengurusan Pentadbir & Pengguna Sistem
                </h2>
                <p className="text-xs text-slate-400">
                  Tambah pentadbir baru, ubah peranan (Admin/Doktor/Jururawat), kemaskini maklumat atau padam akaun.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Nama / Email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pentadbir / Pengguna</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800 font-mono">
                  <tr>
                    <th className="px-5 py-3.5">Nama & Emel</th>
                    <th className="px-5 py-3.5">Peranan (Role)</th>
                    <th className="px-5 py-3.5">No. Telefon & MyKad</th>
                    <th className="px-5 py-3.5">Log Masuk Terakhir</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-5 py-4">
                        <strong className="text-white block font-bold text-sm">{u.name}</strong>
                        <span className="text-xs text-slate-400 font-mono">{u.email}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
                          u.role === 'ADMIN' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                          u.role === 'NEPHROLOGIST' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                          u.role === 'HEAD_NURSE' || u.role === 'STAFF_NURSE' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                          'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs">
                        <p className="text-slate-200">{u.phone}</p>
                        <p className="text-slate-500 text-[10px]">{u.ic_number}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 font-mono">{u.last_login_at || 'Baru'}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                          Aktif
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Edit Pengguna"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center"
                          title="Padam Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PENGURUSAN JURURAWAT (TAMBAH, EDIT, PADAM) */}
        {/* ========================================================================= */}
        {activeTab === 'jururawat' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-cyan-950 text-cyan-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-cyan-800">
                    Kakitangan Klinikal
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{nursesList.length} Jururawat</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">
                  Pengurusan Jururawat Hemodialisis
                </h2>
                <p className="text-xs text-slate-400">
                  Daftar jururawat berlesen LJM baru, kemaskini penugasan bay stesen atau padam staf.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Jururawat / LJM..."
                    value={searchNurse}
                    onChange={(e) => setSearchNurse(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={() => setIsAddNurseOpen(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftar Jururawat Baru</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNurses.map((n) => (
                <div key={n.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative group">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {n.staff_id_code}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingNurse(n)}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                        title="Edit Jururawat"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingNurse(n)}
                        className="p-1 text-rose-400 hover:text-white hover:bg-rose-950 rounded"
                        title="Padam Jururawat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{n.name}</h4>
                    <p className="text-xs text-slate-400">{n.title}</p>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300 pt-2 border-t border-slate-800">
                    <p><strong>LJM No:</strong> <span className="font-mono text-slate-200">{n.nursing_board_no}</span></p>
                    <p><strong>Telefon:</strong> <span className="font-mono text-slate-200">{n.phone}</span></p>
                    <p><strong>Bay Bertugas:</strong> <span className="text-cyan-300 font-bold">{n.assigned_bay || 'BAY_A'}</span></p>
                    <p><strong>Syif Hari Ini:</strong> <span className="text-amber-400 font-semibold">{n.shift_today}</span></p>
                  </div>

                  <div className="pt-2 flex justify-between items-center border-t border-slate-800 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      n.is_on_duty ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {n.is_on_duty ? 'Sedang Bertugas' : 'Off Duty'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: RINGKASAN */}
        {/* ========================================================================= */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-semibold text-slate-400 uppercase">Jumlah Akaun Pengguna</span>
                <div className="text-3xl font-black text-white mt-1">{usersList.length}</div>
                <span className="text-xs text-indigo-400">Pentadbir, Doktor & Jururawat</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-semibold text-slate-400 uppercase">Pesakit Aktif</span>
                <div className="text-3xl font-black text-emerald-400 mt-1">{patientsList.filter(p => p.is_active).length}</div>
                <span className="text-xs text-slate-400">Berdaftar di KaizenBros Semenyih</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-semibold text-slate-400 uppercase">Stesen Mesin Fresenius</span>
                <div className="text-3xl font-black text-cyan-400 mt-1">12 / 12</div>
                <span className="text-xs text-slate-400">4008S & 5008S CorDiax Online HDF</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-semibold text-slate-400 uppercase">Permohonan Baru</span>
                <div className="text-3xl font-black text-amber-400 mt-1">{pendingCount}</div>
                <span className="text-xs text-amber-300 font-semibold">Menunggu Penetapan Penaja & Syif</span>
              </div>
            </div>

            {/* Quick Audit Log Overview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-lg font-black text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-400" />
                Aktiviti Log Audit Terkini
              </h3>
              <div className="divide-y divide-slate-800 text-sm">
                {auditLogs.slice(0, 4).map(l => (
                  <div key={l.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white mr-2">{l.user_name} ({l.user_role})</span>
                      <span className="text-xs text-indigo-300 font-mono bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                        {l.action}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">{l.details}</p>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{l.created_at}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: STESEN & MESIN FRESENIUS */}
        {/* ========================================================================= */}
        {activeTab === 'stesen' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">12 Stesen & Mesin Hemodialisis Fresenius</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {INITIAL_MACHINES.map((m) => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-black text-cyan-400">{m.chair_number}</span>
                    <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                      {m.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base">{m.brand_model}</h4>
                  <p className="text-xs font-mono text-slate-400">S/N: {m.serial_number}</p>
                  <div className="pt-2 border-t border-slate-800 text-xs flex justify-between text-slate-400">
                    <span>Servis Terakhir: {m.last_service_date}</span>
                    <span className="text-cyan-400 font-semibold">{m.online_hdf_capable ? 'Online HDF Ready' : 'Standard HD'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: LOG AUDIT */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-2xl font-black text-white">Log Audit Keselamatan & Klinikal</h2>
                <p className="text-xs text-slate-400">Merakam setiap tindakan pendaftaran, ubah, padam, cap masa dan pengguna</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari log audit..."
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Tarikh / Masa</th>
                      <th className="px-4 py-3">Pengguna</th>
                      <th className="px-4 py-3">Tindakan</th>
                      <th className="px-4 py-3">Butiran Tindakan</th>
                      <th className="px-4 py-3">Alamat IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/50">
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{log.created_at}</td>
                        <td className="px-4 py-3 text-white font-bold">{log.user_name} ({log.user_role})</td>
                        <td className="px-4 py-3">
                          <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 font-semibold">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-200">{log.details}</td>
                        <td className="px-4 py-3 text-slate-500">{log.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: TETAPAN PUSAT */}
        {/* ========================================================================= */}
        {activeTab === 'tetapan' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl text-sm">
            <h2 className="text-2xl font-black text-white">Profil Berdaftar Pusat Dialisis</h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 block">Nama Pusat:</span>
                <strong className="text-white text-base">{VERIFIED_CENTRE_INFO.name}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">No. Pendaftaran KKM:</span>
                <strong className="text-emerald-400">{VERIFIED_CENTRE_INFO.kkm_license}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Alamat Penuh:</span>
                <p className="text-slate-300">{VERIFIED_CENTRE_INFO.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-xs text-slate-400 block">Telefon Utama:</span>
                  <p className="font-mono text-white">{VERIFIED_CENTRE_INFO.phone_main}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Talian Kecemasan 24 Jam:</span>
                  <p className="font-mono text-rose-400 font-bold">{VERIFIED_CENTRE_INFO.hotline_24h}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* ALL MODALS (PATIENT, REGISTRATION, USER, NURSE, DELETE REASON) */}
      {/* ========================================================================= */}

      {/* 1. MODAL EDIT PENDAFTARAN PESAKIT BARU */}
      {editingReg && (
        <EditRegistrationModal
          registration={editingReg}
          onClose={() => setEditingReg(null)}
          onSave={handleSaveEditedRegistration}
        />
      )}

      {/* 2. MODAL PREVIEW DOKUMEN */}
      {previewDocReg && previewDocReg.document && (
        <DocumentPreviewModal
          registration={previewDocReg}
          onClose={() => setPreviewDocReg(null)}
        />
      )}

      {/* 3. MODAL TAMBAH PESAKIT */}
      {isAddPatientOpen && (
        <PatientFormModal
          title="Tambah Pesakit Dialisis Baru"
          onClose={() => setIsAddPatientOpen(false)}
          onSave={(data) => handleAddPatient(data)}
        />
      )}

      {/* 4. MODAL EDIT PESAKIT */}
      {editingPatient && (
        <PatientFormModal
          title={`Kemaskini Pesakit: ${editingPatient.name}`}
          initialData={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={(data) => handleUpdatePatient({ ...editingPatient, ...data })}
        />
      )}

      {/* 5. MODAL BUANG / KELUARKAN PESAKIT DENGAN ALASAN */}
      {deletingPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex items-center space-x-3 text-rose-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 text-rose-500" />
              <div>
                <h3 className="text-lg font-black text-white">Keluarkan Pesakit Dari Sistem</h3>
                <p className="text-xs text-slate-400">Pengeluaran pesakit memerlukan rekod sebab/alasan rasmi.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <p><strong>Nama Pesakit:</strong> <span className="text-white font-bold">{deletingPatient.name}</span></p>
              <p><strong>No. ID / MyKad:</strong> <span className="font-mono text-emerald-400">{deletingPatient.patient_id_code}</span> ({deletingPatient.ic_number})</p>
              <p><strong>Stesen & Syif:</strong> {deletingPatient.assigned_chair} ({deletingPatient.preferred_shift})</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-white mb-1">
                  Pilih Alasan Pengeluaran <span className="text-rose-400">*</span>
                </label>
                <select
                  value={deletePatientReason}
                  onChange={(e) => setDeletePatientReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                >
                  <option value="Pindah ke Pusat Dialisis Lain">Pindah ke Pusat Dialisis Lain</option>
                  <option value="Pemindahan Buah Pinggang Berjaya (Kidney Transplant)">Pemindahan Buah Pinggang Berjaya (Kidney Transplant)</option>
                  <option value="Meninggal Dunia (Demised)">Meninggal Dunia (Demised)</option>
                  <option value="Tamat Tempoh Rawatan Transit / Holiday">Tamat Tempoh Rawatan Transit / Holiday</option>
                  <option value="Tukar ke Modality CAPD / Peritoneal Dialysis">Tukar ke Modality CAPD / Peritoneal Dialysis</option>
                  <option value="Permintaan Pesakit / Waris Keluarga">Permintaan Pesakit / Waris Keluarga</option>
                  <option value="Masalah Kewangan / Penaja Dibatalkan">Masalah Kewangan / Penaja Dibatalkan</option>
                  <option value="Lain-lain Alasan Klinikal">Lain-lain Alasan Klinikal</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-white mb-1">
                  Catatan Tambahan & Pengesahan Doktor / Pegawai (Pilihan)
                </label>
                <textarea
                  rows={3}
                  value={deletePatientNotes}
                  onChange={(e) => setDeletePatientNotes(e.target.value)}
                  placeholder="Contoh: Berpindah ke Hospital Melaka atas urusan pertukaran kerja. Surat pelepasan diserahkan."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingPatient(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePatient}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sahkan Pengeluaran Pesakit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL TAMBAH / EDIT PENGGUNA */}
      {(isAddUserOpen || editingUser) && (
        <UserFormModal
          title={editingUser ? `Kemaskini Pengguna: ${editingUser.name}` : 'Tambah Pentadbir / Pengguna Baru'}
          initialData={editingUser || undefined}
          onClose={() => {
            setIsAddUserOpen(false);
            setEditingUser(null);
          }}
          onSave={(data) => {
            if (editingUser) {
              handleUpdateUser({ ...editingUser, ...data });
            } else {
              handleAddUser(data);
            }
          }}
        />
      )}

      {/* 7. MODAL CONFIRM DELETE PENGGUNA */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-3xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center text-rose-400">
              <Trash2 className="w-5 h-5 mr-2" />
              Padam Pengguna Sistem
            </h3>
            <p className="text-xs text-slate-300">
              Adakah anda pasti ingin memadam akses bagi pengguna <strong className="text-white">{deletingUser.name}</strong> ({deletingUser.email})?
            </p>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteUser(deletingUser.id)}
                className="px-5 py-2 bg-rose-600 text-white font-black text-xs rounded-xl"
              >
                Padam Pengguna
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL TAMBAH / EDIT JURURAWAT */}
      {(isAddNurseOpen || editingNurse) && (
        <NurseFormModal
          title={editingNurse ? `Kemaskini Jururawat: ${editingNurse.name}` : 'Daftar Jururawat Baru'}
          initialData={editingNurse || undefined}
          onClose={() => {
            setIsAddNurseOpen(false);
            setEditingNurse(null);
          }}
          onSave={(data) => {
            if (editingNurse) {
              handleUpdateNurse({ ...editingNurse, ...data });
            } else {
              handleAddNurse(data);
            }
          }}
        />
      )}

      {/* 9. MODAL CONFIRM DELETE JURURAWAT */}
      {deletingNurse && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-3xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center text-rose-400">
              <Trash2 className="w-5 h-5 mr-2" />
              Padam Rekod Jururawat
            </h3>
            <p className="text-xs text-slate-300">
              Adakah anda pasti ingin memadam jururawat <strong className="text-white">{deletingNurse.name}</strong> (Staff ID: {deletingNurse.staff_id_code})?
            </p>
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeletingNurse(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteNurse(deletingNurse.id)}
                className="px-5 py-2 bg-rose-600 text-white font-black text-xs rounded-xl"
              >
                Padam Jururawat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

{/* ========================================================================= */}
{/* COMPONENT: PATIENT FORM MODAL (ADD / EDIT) */}
{/* ========================================================================= */}
interface PatientFormModalProps {
  title: string;
  initialData?: Patient;
  onClose: () => void;
  onSave: (data: any) => void;
}

function PatientFormModal({ title, initialData, onClose, onSave }: PatientFormModalProps) {
  const [formData, setFormData] = useState({
    patient_id_code: initialData?.patient_id_code || `P00${Math.floor(100 + Math.random() * 900)}`,
    name: initialData?.name || '',
    ic_number: initialData?.ic_number || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    age: initialData?.age || 50,
    gender: initialData?.gender || 'LELAKI',
    blood_group: initialData?.blood_group || 'O+',
    address: initialData?.address || '',
    next_of_kin_name: initialData?.next_of_kin_name || '',
    next_of_kin_phone: initialData?.next_of_kin_phone || '',
    next_of_kin_relation: initialData?.next_of_kin_relation || 'Pasangan',
    dry_weight_kg: initialData?.dry_weight_kg || 60,
    vascular_access: initialData?.vascular_access || 'AVF',
    access_location: initialData?.access_location || 'Lengan Kiri (Left Radiocephalic)',
    sponsor: initialData?.sponsor || 'PERKESO_SOCSO',
    schedule_pattern: initialData?.schedule_pattern || 'ISNIN_RABU_JUMAAT',
    preferred_shift: initialData?.preferred_shift || 'PAGI',
    assigned_chair: initialData?.assigned_chair || 'B-01',
    comorbidities: initialData?.comorbidities || ['Hipertensi', 'Diabetes Type 2'],
    hepatitis_status: initialData?.hepatitis_status || { hbs_ag: 'NEGATIF', anti_hcv: 'NEGATIF', hiv: 'NEGATIF' }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-white">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs text-slate-300">
          {/* 1. Demografi & ID */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-1">1. Maklumat Peribadi & Demografi</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1">ID Pesakit *</label>
                <input
                  type="text"
                  required
                  value={formData.patient_id_code}
                  onChange={(e) => setFormData({ ...formData, patient_id_code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Nama Penuh *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">No. MyKad *</label>
                <input
                  type="text"
                  required
                  value={formData.ic_number}
                  onChange={(e) => setFormData({ ...formData, ic_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">No. Telefon *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Jantina & Umur</label>
                <div className="flex space-x-2">
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white"
                  >
                    <option value="LELAKI">Lelaki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Alamat Kediaman *</label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* 2. Klinikal & Akses Vaskular */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-1">2. Parameter Klinikal & Akses Dialisis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1">Berat Kering Target (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.dry_weight_kg}
                  onChange={(e) => setFormData({ ...formData, dry_weight_kg: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Jenis Akses Vaskular *</label>
                <select
                  value={formData.vascular_access}
                  onChange={(e) => setFormData({ ...formData, vascular_access: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="AVF">AV Fistula (AVF)</option>
                  <option value="AVG">AV Graft (AVG)</option>
                  <option value="PERMACATH">Permacath / CVC Tunneled</option>
                  <option value="CVC_TEMPORARY">CVC Sementara</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Lokasi Akses</label>
                <input
                  type="text"
                  value={formData.access_location}
                  onChange={(e) => setFormData({ ...formData, access_location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Penaja, Jadual & Stesen */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-1">3. Penaja, Jadual Syif & Tugasan Stesen</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1">Jenis Penaja *</label>
                <select
                  value={formData.sponsor}
                  onChange={(e) => setFormData({ ...formData, sponsor: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="PERKESO_SOCSO">PERKESO / SOCSO</option>
                  <option value="JPA_KWAP">JPA / KWAP</option>
                  <option value="ZAKAT_SELANGOR">Lembaga Zakat Selangor (LZS)</option>
                  <option value="BAITULMAL_MAIWP">Baitulmal MAIWP</option>
                  <option value="NKF">Yayasan Buah Pinggang (NKF)</option>
                  <option value="INSURANS_SWASTA">Insurans Swasta</option>
                  <option value="PERSENDIRIAN">Persendirian (Self-Pay)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Pola Jadual Hari *</label>
                <select
                  value={formData.schedule_pattern}
                  onChange={(e) => setFormData({ ...formData, schedule_pattern: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="ISNIN_RABU_JUMAAT">Isnin, Rabu, Jumaat</option>
                  <option value="SELASA_KHAMIS_SABTU">Selasa, Khamis, Sabtu</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Syif & Stesen Kerusi *</label>
                <div className="flex space-x-2">
                  <select
                    value={formData.preferred_shift}
                    onChange={(e) => setFormData({ ...formData, preferred_shift: e.target.value as any })}
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white"
                  >
                    <option value="PAGI">Pagi (7am)</option>
                    <option value="TENGAHARI">Tengahari (11am)</option>
                    <option value="PETANG">Petang (2pm)</option>
                  </select>
                  <select
                    value={formData.assigned_chair}
                    onChange={(e) => setFormData({ ...formData, assigned_chair: e.target.value })}
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white font-mono"
                  >
                    {INITIAL_CHAIRS.map(c => (
                      <option key={c.id} value={c.chair_number}>{c.chair_number}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl">
              Batal
            </button>
            <button type="submit" className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl">
              Simpan Rekod Pesakit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* COMPONENT: USER FORM MODAL (ADD / EDIT) */}
{/* ========================================================================= */}
interface UserFormModalProps {
  title: string;
  initialData?: User;
  onClose: () => void;
  onSave: (data: any) => void;
}

function UserFormModal({ title, initialData, onClose, onSave }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: initialData?.role || 'STAFF_NURSE',
    phone: initialData?.phone || '',
    ic_number: initialData?.ic_number || '',
    is_active: initialData?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Nama Penuh *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-300">Emel Log Masuk *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Peranan (Role) *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="ADMIN">ADMIN (Pentadbir Utama)</option>
                <option value="NEPHROLOGIST">NEPHROLOGIST (Pakar)</option>
                <option value="HEAD_NURSE">HEAD_NURSE (Sister)</option>
                <option value="STAFF_NURSE">STAFF_NURSE (Jururawat)</option>
                <option value="PATIENT">PATIENT (Pesakit)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-300">No. Telefon *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-300">No. Kad Pengenalan (MyKad) *</label>
            <input
              type="text"
              required
              value={formData.ic_number}
              onChange={(e) => setFormData({ ...formData, ic_number: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl">
              Batal
            </button>
            <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl">
              Simpan Pengguna
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* COMPONENT: NURSE FORM MODAL (ADD / EDIT) */}
{/* ========================================================================= */}
interface NurseFormModalProps {
  title: string;
  initialData?: Nurse;
  onClose: () => void;
  onSave: (data: any) => void;
}

function NurseFormModal({ title, initialData, onClose, onSave }: NurseFormModalProps) {
  const [formData, setFormData] = useState({
    user_id: initialData?.user_id || 100 + Math.floor(Math.random() * 900),
    staff_id_code: initialData?.staff_id_code || `SN-0${Math.floor(4 + Math.random() * 10)}`,
    name: initialData?.name || '',
    title: initialData?.title || 'Jururawat Hemodialisis Terlatih',
    nursing_board_no: initialData?.nursing_board_no || 'LJM-55210',
    phone: initialData?.phone || '',
    assigned_bay: initialData?.assigned_bay || 'BAY_A',
    shift_today: initialData?.shift_today || 'PAGI',
    is_on_duty: initialData?.is_on_duty ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Staff ID Code *</label>
              <input
                type="text"
                required
                value={formData.staff_id_code}
                onChange={(e) => setFormData({ ...formData, staff_id_code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-300">No. Pendaftaran LJM *</label>
              <input
                type="text"
                required
                value={formData.nursing_board_no}
                onChange={(e) => setFormData({ ...formData, nursing_board_no: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-300">Nama Penuh Jururawat *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Jawatan Klinikal</label>
              <select
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="Ketua Jururawat Klinikal (Sister)">Ketua Jururawat (Sister)</option>
                <option value="Jururawat Hemodialisis Kanan">Jururawat Hemodialisis Kanan</option>
                <option value="Jururawat Hemodialisis Terlatih">Jururawat Hemodialisis Terlatih</option>
                <option value="Jururawat Pelatih / Trainee">Jururawat Pelatih</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-300">No. Telefon *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Tugasan Bay</label>
              <select
                value={formData.assigned_bay}
                onChange={(e) => setFormData({ ...formData, assigned_bay: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white"
              >
                <option value="BAY_A">BAY A</option>
                <option value="BAY_B">BAY B</option>
                <option value="ISOLATION">ISOLASI</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Syif Hari Ini</label>
              <select
                value={formData.shift_today}
                onChange={(e) => setFormData({ ...formData, shift_today: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white"
              >
                <option value="PAGI">PAGI</option>
                <option value="TENGAHARI">TENGAHARI</option>
                <option value="PETANG">PETANG</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Status Tugas</label>
              <select
                value={formData.is_on_duty ? 'ON' : 'OFF'}
                onChange={(e) => setFormData({ ...formData, is_on_duty: e.target.value === 'ON' })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white"
              >
                <option value="ON">Sedang Bertugas</option>
                <option value="OFF">Off Duty</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl">
              Batal
            </button>
            <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl">
              Simpan Jururawat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* COMPONENT: EDIT REGISTRATION MODAL */}
{/* ========================================================================= */}
interface EditRegistrationModalProps {
  registration: NewRegistration;
  onClose: () => void;
  onSave: (updated: NewRegistration) => void;
}

function EditRegistrationModal({ registration, onClose, onSave }: EditRegistrationModalProps) {
  const [formData, setFormData] = useState<NewRegistration>({ ...registration });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-emerald-400 font-mono font-bold">{formData.id}</span>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-bold">
                Kemaskini Pendaftaran Pesakit
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-0.5">{formData.full_name}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs text-slate-300">
          <div className="bg-slate-950 border-2 border-indigo-500/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <h4 className="font-extrabold text-sm text-indigo-300 uppercase tracking-wide">
                1. Tetapan Admin & Kelulusan Kemasukan
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-white mb-1">
                  Status Kelulusan <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-slate-900 border border-indigo-500/80 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-400"
                >
                  <option value="BARU">BARU (Belum Disemak)</option>
                  <option value="DISEMAK">DISEMAK (Sedang Diproses)</option>
                  <option value="DILULUSKAN">DILULUSKAN (Sedia Masuk Rawatan)</option>
                  <option value="DITOLAK">DITOLAK (Tidak Memenuhi Syarat)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-white mb-1">
                  Jenis Penaja / Pembiaya Rawatan <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.sponsor_type || ''}
                  onChange={(e) => setFormData({ ...formData, sponsor_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="">-- Pilih Penaja --</option>
                  <option value="PERKESO / SOCSO">PERKESO / SOCSO (Panel Berdaftar)</option>
                  <option value="JPA / KWAP">JPA / KWAP (Pesara Kerajaan)</option>
                  <option value="Lembaga Zakat Selangor (LZS)">Lembaga Zakat Selangor (LZS)</option>
                  <option value="Baitulmal MAIWP">Baitulmal MAIWP</option>
                  <option value="Yayasan Buah Pinggang (NKF)">Yayasan Buah Pinggang Kebangsaan (NKF)</option>
                  <option value="Insurans / Takaful Swasta">Insurans / Takaful Swasta</option>
                  <option value="Bayaran Sendiri (Persendirian)">Bayaran Sendiri (Persendirian)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-white mb-1">
                  Pilihan Hari Rawatan
                </label>
                <select
                  value={formData.preferred_days || ''}
                  onChange={(e) => setFormData({ ...formData, preferred_days: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="">-- Pilih Hari --</option>
                  <option value="Isnin, Rabu, Jumaat">Isnin, Rabu, Jumaat</option>
                  <option value="Selasa, Khamis, Sabtu">Selasa, Khamis, Sabtu</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-white mb-1">
                  Pilihan Syif Masa
                </label>
                <select
                  value={formData.preferred_shift || ''}
                  onChange={(e) => setFormData({ ...formData, preferred_shift: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="">-- Pilih Syif --</option>
                  <option value="Syif Pagi (7:00 AM)">Syif Pagi (7:00 AM - 11:00 AM)</option>
                  <option value="Syif Tengah Hari (11:00 AM)">Syif Tengah Hari (11:00 AM - 3:00 PM)</option>
                  <option value="Syif Petang (2:00 PM)">Syif Petang (2:00 PM - 6:00 PM)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-white mb-1">
                  Tugasan Stesen / Kerusi Dialisis
                </label>
                <select
                  value={formData.assigned_chair || ''}
                  onChange={(e) => setFormData({ ...formData, assigned_chair: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="">-- Pilih Stesen --</option>
                  {INITIAL_CHAIRS.map(c => (
                    <option key={c.id} value={c.chair_number}>
                      Stesen {c.chair_number} ({c.bay === 'ISOLATION' ? 'Isolasi Hepatitis' : c.bay})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-white mb-1">
                  Catatan Pentadbir / Nurse Admin
                </label>
                <input
                  type="text"
                  value={formData.admin_notes || ''}
                  onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                  placeholder="Contoh: Dokumen lengkap. Temujanji pertama disahkan."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all shadow-lg flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* COMPONENT: DOCUMENT PREVIEW MODAL */}
{/* ========================================================================= */}
interface DocumentPreviewModalProps {
  registration: NewRegistration;
  onClose: () => void;
}

function DocumentPreviewModal({ registration, onClose }: DocumentPreviewModalProps) {
  const doc = registration.document;
  if (!doc) return null;

  const isPdf = doc.type.includes('pdf');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs text-emerald-400 font-mono font-bold">Ref: {registration.id}</span>
            <h3 className="text-lg font-black text-white">Dokumen Lampiran: {registration.full_name}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center min-h-[300px] flex flex-col items-center justify-center space-y-4">
          {doc.data_url && !isPdf ? (
            <img 
              src={doc.data_url} 
              alt={doc.name} 
              className="max-h-[400px] max-w-full rounded-xl object-contain shadow-lg border border-slate-800"
            />
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-800">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-white text-base">{doc.name}</p>
                <p className="text-xs text-slate-400 mt-1">Jenis: {doc.type} • Saiz: {doc.size}</p>
              </div>
            </div>
          )}

          {doc.data_url && (
            <a
              href={doc.data_url}
              download={doc.name}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Muat Turun Fail Dokumen</span>
            </a>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer">
            Tutup Pratonton
          </button>
        </div>
      </div>
    </div>
  );
}
