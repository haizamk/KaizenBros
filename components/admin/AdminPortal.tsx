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
  Edit2,
  Edit3, 
  Upload,
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
  UserX, 
  RotateCcw,
  Wrench,
  AlertOctagon,
  Cpu,
  MapPin,
  Mail,
  Check,
  Send,
  CalendarDays,
  Pill
} from 'lucide-react';
import { WhatsAppReminderModal } from '@/components/shared/WhatsAppReminderModal';
import { TreatmentScheduleManager } from '@/components/schedule/TreatmentScheduleManager';
import { NewPatientRegistration } from '@/components/public/NewPatientRegistration';
import { parseMalaysianIC, getAgeDisplayFromIC } from '@/lib/ic-utils';
import { calculateNextDialysis } from '@/lib/malaysia-time';
import { User, AuditLog, DialysisChair, DialysisMachine, Patient, Nurse, NewRegistration, CentreProfile, ShiftSlot, DialysisSession, PatientMedication, SponsorType, PatientRegistrationDoc, MedicalRecord } from '@/types';
import { 
  INITIAL_CHAIRS, 
  INITIAL_MACHINES, 
  INITIAL_PATIENTS, 
  INITIAL_NURSES, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_REGISTRATIONS, 
  INITIAL_TODAY_SESSIONS,
  INITIAL_PATIENT_MEDICATIONS,
  VERIFIED_CENTRE_INFO 
} from '@/lib/mock-data';

interface AdminPortalProps {
  auditLogs?: AuditLog[];
  registrations?: NewRegistration[];
  patients?: Patient[];
  sessions?: DialysisSession[];
  medications?: PatientMedication[];
  medicalRecords?: MedicalRecord[];
  onUpdateMedicalRecords?: (records: MedicalRecord[]) => void;
  onAddMedication?: (med: Omit<PatientMedication, 'id'>) => void;
  onUpdateMedication?: (med: PatientMedication) => void;
  onDeleteMedication?: (medId: number) => void;
  onUpdateSession?: (session: DialysisSession) => void;
  onAddSession?: (session: Omit<DialysisSession, 'id'>) => void;
  onDeleteSession?: (sessionId: number) => void;
  onUpdateRegistration?: (updatedReg: NewRegistration) => void;
  onDeleteRegistration?: (regId: string) => void;
  onAddPatient?: (patient: Patient) => void;
  onUpdatePatient?: (patient: Patient) => void;
  onDeletePatient?: (patientId: number) => void;
  onAuditLog?: (action: string, details: string) => void;
  onStaffLogout?: () => void;
  onResetPatients?: () => void;
  onResetDialysisData?: () => void;
  onResetBloodData?: () => void;
}

const DEFAULT_USERS: User[] = [
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
];

export function AdminPortal({ 
  auditLogs = INITIAL_AUDIT_LOGS,
  registrations: propRegistrations,
  patients: propPatients,
  sessions: propSessions,
  medications: propMedications,
  medicalRecords = [],
  onUpdateMedicalRecords,
  onAddMedication: propOnAddMedication,
  onUpdateMedication: propOnUpdateMedication,
  onDeleteMedication: propOnDeleteMedication,
  onUpdateSession,
  onAddSession,
  onDeleteSession,
  onUpdateRegistration,
  onDeleteRegistration,
  onAddPatient: propOnAddPatient,
  onUpdatePatient: propOnUpdatePatient,
  onDeletePatient: propOnDeletePatient,
  onAuditLog,
  onStaffLogout,
  onResetPatients,
  onResetDialysisData,
  onResetBloodData
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'jadual' | 'pesakit' | 'pendaftaran' | 'pengguna' | 'jururawat' | 'ringkasan' | 'stesen' | 'audit' | 'tetapan' | 'darah'>('jadual');
  const [fullResetOptPatients, setFullResetOptPatients] = useState(true);
  const [fullResetOptDialysis, setFullResetOptDialysis] = useState(true);
  const [fullResetOptBlood, setFullResetOptBlood] = useState(true);
  const [searchLog, setSearchLog] = useState('');
  const [searchReg, setSearchReg] = useState('');
  const [searchPatient, setSearchPatient] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchNurse, setSearchNurse] = useState('');
  const [filterRegStatus, setFilterRegStatus] = useState<string>('SEMUA');
  const [filterPatientStatus, setFilterPatientStatus] = useState<string>('SEMUA');

  // --- STATE FOR FULL RESET MODAL ---
  const [isFullResetConfirmOpen, setIsFullResetConfirmOpen] = useState(false);

  // --- STATE FOR BLOOD RECORDS & AI ANALYSIS (ADMIN PORTAL) ---
  const [selectedPatientForBloodTab, setSelectedPatientForBloodTab] = useState<Patient | null>(null);
  const [bloodTabSearchTerm, setBloodTabSearchTerm] = useState('');
  const [showAddMedicalRecordForm, setShowAddMedicalRecordForm] = useState(false);
  const [editingMedicalRecord, setEditingMedicalRecord] = useState<MedicalRecord | null>(null);
  
  const [mrExamDate, setMrExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mrExamType, setMrExamType] = useState<string>('Pemeriksaan Berkala 3 Bulan');
  const [mrExamStatus, setMrExamStatus] = useState<string>('LENGKAP');
  const [mrClinicalNotes, setMrClinicalNotes] = useState<string>('');
  const [mrDoctorComments, setMrDoctorComments] = useState<string>('');
  const [mrAiAnalysisNotes, setMrAiAnalysisNotes] = useState<string>('');
  const [mrUploadedDoc, setMrUploadedDoc] = useState<any | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);

  // Blood parameters
  const [hb, setHb] = useState<string>('');
  const [wbc, setWbc] = useState<string>('');
  const [platelet, setPlatelet] = useState<string>('');
  const [urea, setUrea] = useState<string>('');
  const [creatinine, setCreatinine] = useState<string>('');
  const [egfr, setEgfr] = useState<string>('');
  const [calcium, setCalcium] = useState<string>('');
  const [phosphate, setPhosphate] = useState<string>('');
  const [potassium, setPotassium] = useState<string>('');
  const [sodium, setSodium] = useState<string>('');
  const [glucose, setGlucose] = useState<string>('');
  const [hba1c, setHba1c] = useState<string>('');
  const [cholesterol, setCholesterol] = useState<string>('');
  const [ldl, setLdl] = useState<string>('');
  const [hdl, setHdl] = useState<string>('');
  const [triglycerides, setTriglycerides] = useState<string>('');

  const resetMrForm = () => {
    setMrExamDate(new Date().toISOString().split('T')[0]);
    setMrExamType('Pemeriksaan Berkala 3 Bulan');
    setMrExamStatus('LENGKAP');
    setMrClinicalNotes('');
    setMrDoctorComments('');
    setMrAiAnalysisNotes('');
    setMrUploadedDoc(null);
    setHb(''); setWbc(''); setPlatelet('');
    setUrea(''); setCreatinine(''); setEgfr('');
    setCalcium(''); setPhosphate(''); setPotassium(''); setSodium('');
    setGlucose(''); setHba1c('');
    setCholesterol(''); setLdl(''); setHdl(''); setTriglycerides('');
    setEditingMedicalRecord(null);
  };

  const startEditMr = (record: MedicalRecord) => {
    setEditingMedicalRecord(record);
    setMrExamDate(record.examination_date);
    setMrExamType(record.examination_type);
    setMrExamStatus(record.status);
    setMrClinicalNotes(record.clinical_notes || '');
    setMrDoctorComments(record.doctor_comments || '');
    setMrAiAnalysisNotes(record.ai_analysis_notes || '');
    setMrUploadedDoc(record.report_document || null);

    const br = record.blood_results;
    if (br) {
      if (br.hematology) {
        setHb(br.hematology.hemoglobin !== undefined ? String(br.hematology.hemoglobin) : '');
        setWbc(br.hematology.wbc !== undefined ? String(br.hematology.wbc) : '');
        setPlatelet(br.hematology.platelet !== undefined ? String(br.hematology.platelet) : '');
      }
      if (br.renal) {
        setUrea(br.renal.urea !== undefined ? String(br.renal.urea) : '');
        setCreatinine(br.renal.creatinine !== undefined ? String(br.renal.creatinine) : '');
        setEgfr(br.renal.egfr !== undefined ? String(br.renal.egfr) : '');
        setCalcium(br.renal.calcium !== undefined ? String(br.renal.calcium) : '');
        setPhosphate(br.renal.phosphate !== undefined ? String(br.renal.phosphate) : '');
        setPotassium(br.renal.potassium !== undefined ? String(br.renal.potassium) : '');
        setSodium(br.renal.sodium !== undefined ? String(br.renal.sodium) : '');
      }
      if (br.diabetes) {
        setGlucose(br.diabetes.glucose !== undefined ? String(br.diabetes.glucose) : '');
        setHba1c(br.diabetes.hba1c !== undefined ? String(br.diabetes.hba1c) : '');
      }
      if (br.lipid) {
        setCholesterol(br.lipid.cholesterol !== undefined ? String(br.lipid.cholesterol) : '');
        setLdl(br.lipid.ldl !== undefined ? String(br.lipid.ldl) : '');
        setHdl(br.lipid.hdl !== undefined ? String(br.lipid.hdl) : '');
        setTriglycerides(br.lipid.triglycerides !== undefined ? String(br.lipid.triglycerides) : '');
      }
    }
    setShowAddMedicalRecordForm(true);
  };

  const handleAdminAiAnalysis = async (fileDataUrl: string, customFileName?: string) => {
    setIsAiAnalyzing(true);
    const resolvedFileName = customFileName || mrUploadedDoc?.name || 'Laporan_Darah.pdf';

    // Clear previous form fields before populating new values
    setHb(''); setWbc(''); setPlatelet('');
    setUrea(''); setCreatinine(''); setEgfr(''); setCalcium(''); setPhosphate(''); setPotassium(''); setSodium('');
    setGlucose(''); setHba1c('');
    setCholesterol(''); setLdl(''); setHdl(''); setTriglycerides('');
    setMrAiAnalysisNotes('');

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileDataUrl,
          fileName: resolvedFileName,
          patientName: selectedPatientForBloodTab?.name,
          patientAge: selectedPatientForBloodTab?.age,
          patientGender: selectedPatientForBloodTab?.gender,
        }),
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      const er = data.extracted_results;
      if (er) {
        if (er.hematology) {
          setHb(er.hematology.hemoglobin || '');
          setWbc(er.hematology.wbc || '');
          setPlatelet(er.hematology.platelet || '');
        }
        if (er.renal) {
          setUrea(er.renal.urea || '');
          setCreatinine(er.renal.creatinine || '');
          setEgfr(er.renal.egfr || '');
          setCalcium(er.renal.calcium || '');
          setPhosphate(er.renal.phosphate || '');
          setPotassium(er.renal.potassium || '');
          setSodium(er.renal.sodium || '');
        }
        if (er.diabetes) {
          setGlucose(er.diabetes.glucose || '');
          setHba1c(er.diabetes.hba1c || '');
        }
        if (er.lipid) {
          setCholesterol(er.lipid.cholesterol || '');
          setLdl(er.lipid.ldl || '');
          setHdl(er.lipid.hdl || '');
          setTriglycerides(er.lipid.triglycerides || '');
        }
      }
      if (data.test_date && typeof data.test_date === 'string' && data.test_date.includes('-')) {
        setMrExamDate(data.test_date);
      }
      if (data.ai_analysis) {
        setMrAiAnalysisNotes(data.ai_analysis);
      }
      const count = data.extracted_count || 0;
      if (count > 0) {
        triggerLog('AI_EXTRACTION', `AI berjaya mengekstrak ${count} parameter darah daripada fail ${resolvedFileName}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengekstrak fail: ' + err.message);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleAdminSaveMr = () => {
    if (!selectedPatientForBloodTab) {
      alert('Sila pilih pesakit terlebih dahulu.');
      return;
    }
    const newRecord: MedicalRecord = {
      id: editingMedicalRecord ? editingMedicalRecord.id : 'MR-' + Math.floor(100 + Math.random() * 900),
      patient_id: selectedPatientForBloodTab.id,
      patient_id_code: selectedPatientForBloodTab.patient_id_code,
      patient_name: selectedPatientForBloodTab.name,
      examination_date: mrExamDate,
      examination_type: mrExamType,
      status: mrExamStatus as any,
      clinical_notes: mrClinicalNotes,
      doctor_comments: mrDoctorComments || undefined,
      ai_analysis_notes: mrAiAnalysisNotes || undefined,
      report_document: mrUploadedDoc || undefined,
      blood_results: {
        hematology: {
          hemoglobin: hb ? (isNaN(Number(hb)) ? hb : Number(hb)) : undefined,
          wbc: wbc ? (isNaN(Number(wbc)) ? wbc : Number(wbc)) : undefined,
          platelet: platelet ? (isNaN(Number(platelet)) ? platelet : Number(platelet)) : undefined,
        },
        renal: {
          urea: urea ? (isNaN(Number(urea)) ? urea : Number(urea)) : undefined,
          creatinine: creatinine ? (isNaN(Number(creatinine)) ? creatinine : Number(creatinine)) : undefined,
          egfr: egfr ? (isNaN(Number(egfr)) ? egfr : Number(egfr)) : undefined,
          calcium: calcium ? (isNaN(Number(calcium)) ? calcium : Number(calcium)) : undefined,
          phosphate: phosphate ? (isNaN(Number(phosphate)) ? phosphate : Number(phosphate)) : undefined,
          potassium: potassium ? (isNaN(Number(potassium)) ? potassium : Number(potassium)) : undefined,
          sodium: sodium ? (isNaN(Number(sodium)) ? sodium : Number(sodium)) : undefined,
        },
        diabetes: {
          glucose: glucose ? (isNaN(Number(glucose)) ? glucose : Number(glucose)) : undefined,
          hba1c: hba1c ? (isNaN(Number(hba1c)) ? hba1c : Number(hba1c)) : undefined,
        },
        lipid: {
          cholesterol: cholesterol ? (isNaN(Number(cholesterol)) ? cholesterol : Number(cholesterol)) : undefined,
          ldl: ldl ? (isNaN(Number(ldl)) ? ldl : Number(ldl)) : undefined,
          hdl: hdl ? (isNaN(Number(hdl)) ? hdl : Number(hdl)) : undefined,
          triglycerides: triglycerides ? (isNaN(Number(triglycerides)) ? triglycerides : Number(triglycerides)) : undefined,
        }
      },
      created_at: editingMedicalRecord ? editingMedicalRecord.created_at : new Date().toISOString(),
      updated_at: editingMedicalRecord ? new Date().toISOString() : undefined,
      created_by: 'Pentadbir Sistem (Admin)'
    };

    let nextRecords: MedicalRecord[];
    if (editingMedicalRecord) {
      nextRecords = medicalRecords.map(r => r.id === editingMedicalRecord.id ? newRecord : r);
    } else {
      nextRecords = [newRecord, ...medicalRecords];
    }

    if (onUpdateMedicalRecords) {
      onUpdateMedicalRecords(nextRecords);
    }

    setShowAddMedicalRecordForm(false);
    resetMrForm();
    triggerLog('KEMASKINI_REKOD_DARAH', `Admin menyimpan rekod ujian darah untuk pesakit ${selectedPatientForBloodTab.name} (${newRecord.id})`);
  };

  // --- STATE FOR MEDICATIONS (DOKTOR / PENTADBIR SAHAJA) ---
  const [medsList, setMedsList] = useState<PatientMedication[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kaizenbros_patient_medications');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return propMedications && propMedications.length > 0 ? propMedications : INITIAL_PATIENT_MEDICATIONS;
  });
  const [medsPatient, setMedsPatient] = useState<Patient | null>(null);

  const handleAddMedicationForPatient = (newMed: Omit<PatientMedication, 'id'>) => {
    const newId = medsList.length > 0 ? Math.max(...medsList.map(m => m.id)) + 1 : 1;
    const medObj: PatientMedication = { ...newMed, id: newId };
    const next = [medObj, ...medsList];
    setMedsList(next);
    try {
      localStorage.setItem('kaizenbros_patient_medications', JSON.stringify(next));
    } catch {}
    if (propOnAddMedication) propOnAddMedication(newMed);
    triggerLog('TAMBAH_UBAT_PESAKIT', `Doktor/Pentadbir menambah preskripsi: ${medObj.medication_name} (${medObj.dosage}) untuk pesakit #${medsPatient?.patient_id_code} (${medsPatient?.name}).`);
  };

  const handleUpdateMedicationForPatient = (updated: PatientMedication) => {
    const next = medsList.map(m => m.id === updated.id ? updated : m);
    setMedsList(next);
    try {
      localStorage.setItem('kaizenbros_patient_medications', JSON.stringify(next));
    } catch {}
    if (propOnUpdateMedication) propOnUpdateMedication(updated);
    triggerLog('KEMASKINI_UBAT_PESAKIT', `Doktor/Pentadbir mengemaskini preskripsi: ${updated.medication_name} (${updated.dosage}).`);
  };

  const handleDeleteMedicationForPatient = (medId: number) => {
    const med = medsList.find(m => m.id === medId);
    const next = medsList.filter(m => m.id !== medId);
    setMedsList(next);
    try {
      localStorage.setItem('kaizenbros_patient_medications', JSON.stringify(next));
    } catch {}
    if (propOnDeleteMedication) propOnDeleteMedication(medId);
    if (med) {
      triggerLog('PADAM_UBAT_PESAKIT', `Doktor/Pentadbir memadam preskripsi: ${med.medication_name} (${med.dosage}).`);
    }
  };

  // --- STATE FOR SESSIONS (TREATMENT SCHEDULE) ---
  const [sessionsList, setSessionsList] = useState<DialysisSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kaizenbros_sessions');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return propSessions && propSessions.length > 0 ? propSessions : INITIAL_TODAY_SESSIONS;
  });

  const handleUpdateSession = (updated: DialysisSession) => {
    const next = sessionsList.map(s => s.id === updated.id ? updated : s);
    setSessionsList(next);
    try {
      localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
    } catch {}
    if (onUpdateSession) onUpdateSession(updated);
  };

  const handleAddSession = (newSess: Omit<DialysisSession, 'id'>) => {
    const newId = sessionsList.length > 0 ? Math.max(...sessionsList.map(s => s.id)) + 1 : 1;
    const sessionObj: DialysisSession = { ...newSess, id: newId };
    const next = [sessionObj, ...sessionsList];
    setSessionsList(next);
    try {
      localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
    } catch {}
    if (onAddSession) onAddSession(newSess);
  };

  const handleDeleteSession = (sessionId: number) => {
    const next = sessionsList.filter(s => s.id !== sessionId);
    setSessionsList(next);
    try {
      localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
    } catch {}
    if (onDeleteSession) onDeleteSession(sessionId);
  };

  // --- STATE FOR REGISTRATIONS ---
  // BUG FIX: Do NOT re-add INITIAL_REGISTRATIONS on refresh if the user has deleted them!
  const [regList, setRegList] = useState<NewRegistration[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedRegs = localStorage.getItem('kaizenbros_registrations');
        if (storedRegs !== null) {
          return JSON.parse(storedRegs);
        }
      } catch {
        // ignore
      }
    }
    return propRegistrations && propRegistrations.length > 0 ? propRegistrations : INITIAL_REGISTRATIONS;
  });
  const [editingReg, setEditingReg] = useState<NewRegistration | null>(null);
  const [isBorangRegistrationOpen, setIsBorangRegistrationOpen] = useState(false);
  const [deletingReg, setDeletingReg] = useState<NewRegistration | null>(null);
  const [deletingDocReg, setDeletingDocReg] = useState<NewRegistration | null>(null);
  const [previewDocReg, setPreviewDocReg] = useState<NewRegistration | null>(null);
  const [editingDocReg, setEditingDocReg] = useState<NewRegistration | null>(null);

  // --- STATE FOR PATIENTS (CRUD) ---
  const [patientsList, setPatientsList] = useState<Patient[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedPatients = localStorage.getItem('kaizenbros_patients');
        if (storedPatients !== null) {
          const parsed = JSON.parse(storedPatients);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return propPatients && propPatients.length > 0 ? propPatients : INITIAL_PATIENTS;
  });
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [deletePatientReason, setDeletePatientReason] = useState<string>('Pindah ke Pusat Dialisis Lain');
  const [deletePatientNotes, setDeletePatientNotes] = useState<string>('');

  // --- STATE FOR USERS / PENTADBIR (CRUD) ---
  const [usersList, setUsersList] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUsers = localStorage.getItem('kaizenbros_users');
        if (storedUsers) return JSON.parse(storedUsers);
      } catch {
        // ignore
      }
    }
    return DEFAULT_USERS;
  });
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // --- STATE FOR NURSES (CRUD) ---
  const [nursesList, setNursesList] = useState<Nurse[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedNurses = localStorage.getItem('kaizenbros_nurses');
        if (storedNurses) return JSON.parse(storedNurses);
      } catch {
        // ignore
      }
    }
    return INITIAL_NURSES;
  });
  const [isAddNurseOpen, setIsAddNurseOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [deletingNurse, setDeletingNurse] = useState<Nurse | null>(null);

  // --- STATE FOR 12 STESEN & MESIN FRESENIUS (CRUD / STATUS / BREAKDOWN) ---
  const [machinesList, setMachinesList] = useState<DialysisMachine[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedMachines = localStorage.getItem('kaizenbros_machines');
        if (storedMachines) return JSON.parse(storedMachines);
      } catch {
        // ignore
      }
    }
    return INITIAL_MACHINES;
  });
  const [editingMachine, setEditingMachine] = useState<DialysisMachine | null>(null);
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [filterMachineStatus, setFilterMachineStatus] = useState<string>('SEMUA');

  // --- STATE FOR PROFIL BERDAFTAR PUSAT DIALISIS ---
  const [centreProfile, setCentreProfile] = useState<CentreProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedProfile = localStorage.getItem('kaizenbros_centre_profile');
        if (storedProfile && storedProfile.includes('27 & 29G') && storedProfile.includes('Bandar Rinching')) {
          return JSON.parse(storedProfile);
        }
      } catch {
        // ignore
      }
    }
    return VERIFIED_CENTRE_INFO;
  });
  const [isEditCentreProfileOpen, setIsEditCentreProfileOpen] = useState(false);
  const [selectedShiftForTetapan, setSelectedShiftForTetapan] = useState<ShiftSlot>('PAGI');
  const [isAssignNurseShiftOpen, setIsAssignNurseShiftOpen] = useState(false);

  // --- STATE FOR WHATSAPP & FONNTE API GATEWAY ---
  const [whatsAppPatient, setWhatsAppPatient] = useState<Patient | null>(null);
  const [fonnteToken, setFonnteToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kaizenbros_fonnte_token') || '';
    }
    return '';
  });
  const [testPhone, setTestPhone] = useState<string>('0193389922');
  const [isTestingFonnte, setIsTestingFonnte] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveFonnteToken = () => {
    try {
      localStorage.setItem('kaizenbros_fonnte_token', fonnteToken.trim());
      triggerLog('KEMASKINI_FONNTE_TOKEN', 'Admin mengemaskini konfigurasi API Token Fonnte WhatsApp Gateway.');
      alert('✓ Token Fonnte WhatsApp berjaya disimpan dalam sistem.');
    } catch {}
  };

  const handleTestFonnteApi = async () => {
    if (!fonnteToken.trim()) {
      alert('Sila masukkan Fonnte API Token terlebih dahulu.');
      return;
    }
    setIsTestingFonnte(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: testPhone,
          message: `🏥 [UJIAN KAIZENBROS] Sambungan Fonnte WhatsApp API Gateway Berjaya! Tarikh & Masa: ${new Date().toLocaleString('ms-MY')}`,
          token: fonnteToken.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `✓ Mesej WhatsApp ujian berjaya dihantar ke nombor ${testPhone} melalui Fonnte API.`
        });
        triggerLog('UJIAN_FONNTE_WHATSAPP', `Ujian penghantaran WhatsApp Fonnte berjaya dihantar ke ${testPhone}.`);
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Gagal menghantar mesej ujian. Sila pastikan Token Fonnte sah dan peranti dihubungkan.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Ralat sambungan ke Fonnte API.'
      });
    } finally {
      setIsTestingFonnte(false);
    }
  };

  // Helper to log actions
  const triggerLog = (action: string, details: string) => {
    if (onAuditLog) {
      onAuditLog(action, details);
    }
  };

  // --- REGISTRATION ACTIONS ---
  const handleAdminNewRegistrationSubmitted = (newReg: NewRegistration) => {
    const newList = [newReg, ...regList.filter(r => r.id !== newReg.id)];
    setRegList(newList);
    try {
      localStorage.setItem('kaizenbros_registrations', JSON.stringify(newList));
    } catch {}
    if (onUpdateRegistration) onUpdateRegistration(newReg);

    triggerLog('PENDAFTARAN_PESAKIT_ADMIN', `Admin mendaftar pesakit baru melalui Borang Pendaftaran Kemasukan Dialisis: ${newReg.full_name} (${newReg.id})`);

    if (newReg.status === 'DILULUSKAN') {
      handleSaveEditedRegistration(newReg);
    } else {
      alert(`✓ Borang pendaftaran ${newReg.full_name} (${newReg.id}) berjaya disimpan.`);
    }

    setIsBorangRegistrationOpen(false);
  };

  const handleSaveEditedRegistration = (updated: NewRegistration) => {
    const newList = regList.map(r => r.id === updated.id ? { ...updated, updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19) } : r);
    setRegList(newList);
    try {
      localStorage.setItem('kaizenbros_registrations', JSON.stringify(newList));
    } catch {}
    if (onUpdateRegistration) onUpdateRegistration(updated);
    triggerLog('KEMASKINI_PENDAFTARAN', `Admin mengemaskini status permohonan pendaftaran ${updated.full_name} (${updated.id}) ke ${updated.status}`);

    // SYNC: Jika status DILULUSKAN, automatik masukkan pesakit ke dalam Direktori Pesakit & Portal Pesakit
    if (updated.status === 'DILULUSKAN') {
      const cleanIc = updated.ic_number.replace(/\D/g, '');
      const alreadyExists = patientsList.some(p => p.ic_number.replace(/\D/g, '') === cleanIc);

      if (!alreadyExists) {
        const icParsed = parseMalaysianIC(updated.ic_number);
        const newId = patientsList.length > 0 ? Math.max(...patientsList.map(p => p.id)) + 1 : 1;
        const newCode = `P${newId.toString().padStart(4, '0')}`;

        // Map sponsor
        let sponsorType: SponsorType = 'PERKESO_SOCSO';
        const sp = (updated.sponsor_type || '').toUpperCase();
        if (sp.includes('JPA') || sp.includes('KWAP')) sponsorType = 'JPA_KWAP';
        else if (sp.includes('ZAKAT') || sp.includes('LZS')) sponsorType = 'ZAKAT_SELANGOR';
        else if (sp.includes('BAITULMAL') || sp.includes('MAIWP')) sponsorType = 'BAITULMAL_MAIWP';
        else if (sp.includes('NKF')) sponsorType = 'NKF';
        else if (sp.includes('INSURANS')) sponsorType = 'INSURANS_SWASTA';
        else if (sp.includes('SENDIRI') || sp.includes('PERSENDIRIAN')) sponsorType = 'PERSENDIRIAN';

        // Map shift
        let prefShift: ShiftSlot = 'SYIF_1';
        if (updated.preferred_shift?.includes('2') || updated.preferred_shift?.includes('10.30') || updated.preferred_shift?.includes('10:30')) prefShift = 'SYIF_2';
        else if (updated.preferred_shift?.includes('3') || updated.preferred_shift?.includes('3:00') || updated.preferred_shift?.includes('3.00')) prefShift = 'SYIF_3';

        const newPatientObj: Patient = {
          id: newId,
          user_id: 200 + newId,
          patient_id_code: newCode,
          name: updated.full_name,
          ic_number: updated.ic_number,
          gender: icParsed.gender || 'LELAKI',
          age: icParsed.ageYears || updated.age || 50,
          phone: updated.phone_number,
          emergency_contact: updated.phone_number,
          address: updated.address,
          blood_group: 'O+',
          vascular_access: 'AVF',
          access_location: 'Lengan Kiri',
          dry_weight_kg: 65.0,
          latest_weight_kg: 67.0,
          latest_bp: '130/80',
          sponsor: sponsorType,
          sponsor_ref_no: updated.id,
          schedule_pattern: updated.preferred_days?.includes('Selasa') ? 'SELASA_KHAMIS_SABTU' : 'ISNIN_RABU_JUMAAT',
          preferred_shift: prefShift,
          assigned_chair: 'B-01',
          is_active: true,
          registered_date: new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString().slice(0, 10)
        };

        const updatedPatients = [newPatientObj, ...patientsList];
        setPatientsList(updatedPatients);
        try {
          localStorage.setItem('kaizenbros_patients', JSON.stringify(updatedPatients));
        } catch {}

        if (propOnAddPatient) {
          propOnAddPatient(newPatientObj);
        }

        triggerLog('KELULUSAN_PESAKIT_BARU', `Permohonan pendaftaran ${updated.full_name} (${updated.id}) telah DILULUSKAN dan didaftarkan sebagai pesakit aktif (${newCode}) dengan akses ke Portal Pesakit.`);
      }
    }

    setEditingReg(null);
  };

  const handleDeleteRegistration = (regId: string) => {
    const target = regList.find(r => r.id === regId);
    const newList = regList.filter(r => r.id !== regId);
    setRegList(newList);
    try {
      localStorage.setItem('kaizenbros_registrations', JSON.stringify(newList));
    } catch {}
    if (onDeleteRegistration) {
      onDeleteRegistration(regId);
    }
    if (target) {
      triggerLog('PADAM_PERMOHONAN_PENDAFTARAN', `Admin memadam permohonan pendaftaran pesakit baru: ${target.full_name} (${target.id})`);
    }
    setDeletingReg(null);
    setEditingReg(null);
  };

  const executeDeleteRegistrationDocument = (regId: string) => {
    const target = regList.find(r => r.id === regId);
    if (!target || !target.document) return;
    const docName = target.document.name;
    const updated: NewRegistration = {
      ...target,
      document: undefined
    };
    const newList = regList.map(r => r.id === regId ? updated : r);
    setRegList(newList);
    try {
      localStorage.setItem('kaizenbros_registrations', JSON.stringify(newList));
    } catch {}
    if (onUpdateRegistration) onUpdateRegistration(updated);
    triggerLog('PADAM_DOKUMEN_PENDAFTARAN', `Admin memadam dokumen lampiran (${docName}) bagi ${target.full_name} (${target.id})`);
  };

  const handleDeleteRegistrationDocument = (regId: string) => {
    const target = regList.find(r => r.id === regId);
    if (!target) return;
    setDeletingDocReg(target);
  };

  const handleUpdateRegistrationDocument = (regId: string, doc: PatientRegistrationDoc | undefined) => {
    const target = regList.find(r => r.id === regId);
    if (!target) return;
    const updated: NewRegistration = {
      ...target,
      document: doc
    };
    const newList = regList.map(r => r.id === regId ? updated : r);
    setRegList(newList);
    try {
      localStorage.setItem('kaizenbros_registrations', JSON.stringify(newList));
    } catch {}
    if (onUpdateRegistration) onUpdateRegistration(updated);
    if (doc) {
      triggerLog('KEMASKINI_DOKUMEN_PENDAFTARAN', `Admin mengemaskini dokumen lampiran (${doc.name}) bagi ${target.full_name} (${target.id})`);
    } else {
      triggerLog('PADAM_DOKUMEN_PENDAFTARAN', `Admin membuang dokumen lampiran bagi ${target.full_name} (${target.id})`);
    }
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
    if (propOnAddPatient) {
      propOnAddPatient(patientObj);
    }
    triggerLog('TAMBAH_PESAKIT', `Admin mendaftar pesakit baru: ${patientObj.name} (${patientObj.patient_id_code})`);
    setIsAddPatientOpen(false);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    const updated = patientsList.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    setPatientsList(updated);
    try {
      localStorage.setItem('kaizenbros_patients', JSON.stringify(updated));
    } catch {}
    if (propOnUpdatePatient) {
      propOnUpdatePatient(updatedPatient);
    }
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
    if (propOnDeletePatient) {
      propOnDeletePatient(deletingPatient.id);
    }
    triggerLog('PADAM_PESAKIT', `Admin mengeluarkan pesakit: ${deletingPatient.name} (${deletingPatient.patient_id_code}) - Alasan: ${deletePatientReason}. Nota: ${deletePatientNotes}`);
    setDeletingPatient(null);
    setDeletePatientNotes('');
  };

  const handleResetAllPatients = () => {
    if (confirm('Adakah anda pasti ingin mengosongkan semua data pesakit untuk memulakan pengujian kemasukan pesakit pertama dari awal?')) {
      setPatientsList([]);
      try {
        localStorage.setItem('kaizenbros_patients', JSON.stringify([]));
        localStorage.setItem('kaizenbros_queue', JSON.stringify([]));
        localStorage.setItem('kaizenbros_sessions', JSON.stringify([]));
      } catch {}
      triggerLog('RESET_DATA_PESAKIT', 'Admin telah mengosongkan semua rekod pesakit, sesi dan giliran untuk pengujian dari awal.');
    }
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

  // --- MACHINE ACTIONS (CRUD & STATUS BREAKDOWN / OPERASI) ---
  const handleUpdateMachine = (updatedMachine: DialysisMachine) => {
    const updated = machinesList.map(m => m.id === updatedMachine.id ? updatedMachine : m);
    setMachinesList(updated);
    try {
      localStorage.setItem('kaizenbros_machines', JSON.stringify(updated));
    } catch {}
    triggerLog('KEMASKINI_MESIN', `Admin mengemaskini maklumat mesin stesen ${updatedMachine.chair_number}: Model ${updatedMachine.brand_model}, No Mesin ${updatedMachine.serial_number}, Status: ${updatedMachine.status}`);
    setEditingMachine(null);
  };

  const handleAddMachine = (newMachine: Omit<DialysisMachine, 'id'>) => {
    const newId = machinesList.length > 0 ? Math.max(...machinesList.map(m => m.id)) + 1 : 1;
    const machineObj: DialysisMachine = { ...newMachine, id: newId };
    const updated = [...machinesList, machineObj];
    setMachinesList(updated);
    try {
      localStorage.setItem('kaizenbros_machines', JSON.stringify(updated));
    } catch {}
    triggerLog('TAMBAH_MESIN', `Admin menambah stesen mesin baru: ${machineObj.chair_number} (${machineObj.brand_model} - ${machineObj.serial_number})`);
    setIsAddMachineOpen(false);
  };

  const handleToggleMachineStatus = (machineId: number, newStatus: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE') => {
    const target = machinesList.find(m => m.id === machineId);
    if (!target) return;
    const updatedMachine: DialysisMachine = { ...target, status: newStatus };
    const updated = machinesList.map(m => m.id === machineId ? updatedMachine : m);
    setMachinesList(updated);
    try {
      localStorage.setItem('kaizenbros_machines', JSON.stringify(updated));
    } catch {}
    const statusLabel = newStatus === 'OPERATIONAL' ? 'OPERASI NORMAL' : newStatus === 'BREAKDOWN' ? 'BREAKDOWN / ROSAK' : 'PENYELENGGARAAN';
    triggerLog('STATUS_MESIN', `Status stesen ${target.chair_number} (No Mesin ${target.serial_number}) ditukar kepada: ${statusLabel}`);
  };

  const handleDeleteMachine = (machineId: number) => {
    const target = machinesList.find(m => m.id === machineId);
    if (!target) return;
    if (confirm(`Adakah anda pasti ingin memadam rekod stesen / mesin ${target.chair_number} (${target.serial_number})?`)) {
      const updated = machinesList.filter(m => m.id !== machineId);
      setMachinesList(updated);
      try {
        localStorage.setItem('kaizenbros_machines', JSON.stringify(updated));
      } catch {}
      triggerLog('PADAM_MESIN', `Admin memadam rekod stesen mesin ${target.chair_number} (${target.serial_number})`);
    }
  };

  // --- NURSE SHIFT ACTIONS (TETAPAN SYIF JURURAWAT) ---
  const handleAssignNurseToShift = (nurseId: number, shift: ShiftSlot, bay: string, onDuty: boolean = true) => {
    const updated = nursesList.map(n => n.id === nurseId ? {
      ...n,
      shift_today: shift,
      assigned_bay: bay,
      is_on_duty: onDuty
    } : n);
    setNursesList(updated);
    try {
      localStorage.setItem('kaizenbros_nurses', JSON.stringify(updated));
    } catch {}
    const nurse = nursesList.find(n => n.id === nurseId);
    if (nurse) {
      triggerLog('TETAPAN_SYIF_JURURAWAT', `Admin menetapkan ${nurse.name} bertugas bagi Syif ${shift} di ${bay}.`);
    }
  };

  const handleToggleNurseDuty = (nurseId: number) => {
    const updated = nursesList.map(n => n.id === nurseId ? { ...n, is_on_duty: !n.is_on_duty } : n);
    setNursesList(updated);
    try {
      localStorage.setItem('kaizenbros_nurses', JSON.stringify(updated));
    } catch {}
    const nurse = nursesList.find(n => n.id === nurseId);
    if (nurse) {
      triggerLog('STATUS_TUGAS_JURURAWAT', `Status bertugas ${nurse.name} ditukar kepada: ${!nurse.is_on_duty ? 'Sedang Bertugas (On Duty)' : 'Off Duty'}`);
    }
  };

  // --- CENTRE PROFILE ACTIONS ---
  const handleSaveCentreProfile = (updatedProfile: CentreProfile) => {
    setCentreProfile(updatedProfile);
    try {
      localStorage.setItem('kaizenbros_centre_profile', JSON.stringify(updatedProfile));
    } catch {}
    triggerLog('KEMASKINI_PROFIL_PUSAT', `Admin mengemaskini profil berdaftar pusat: ${updatedProfile.name}, Lesen KKM: ${updatedProfile.kkm_license}`);
    setIsEditCentreProfileOpen(false);
  };

  // Filtered queries
  const pendingCount = regList.filter(r => r.status === 'BARU').length;

  const filteredRegistrations = regList.filter(reg => {
    const sReg = (searchReg || '').toLowerCase();
    const matches = 
      (reg.id || '').toLowerCase().includes(sReg) ||
      (reg.full_name || '').toLowerCase().includes(sReg) ||
      (reg.ic_number || '').includes(searchReg || '') ||
      (reg.phone_number || '').includes(searchReg || '') ||
      (reg.patient_category || '').toLowerCase().includes(sReg);
    if (filterRegStatus === 'SEMUA') return matches;
    return matches && reg.status === filterRegStatus;
  });

  const filteredPatients = patientsList.filter(p => {
    const sPat = (searchPatient || '').toLowerCase();
    const matches = 
      (p.name || '').toLowerCase().includes(sPat) ||
      (p.patient_id_code || '').toLowerCase().includes(sPat) ||
      (p.ic_number || '').includes(searchPatient || '') ||
      (p.phone || '').includes(searchPatient || '');
    if (filterPatientStatus === 'AKTIF') return matches && p.is_active;
    if (filterPatientStatus === 'DIKELUARKAN') return matches && !p.is_active;
    return matches;
  });

  const filteredUsers = usersList.filter(u => {
    const sUser = (searchUser || '').toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(sUser) ||
      (u.email || '').toLowerCase().includes(sUser) ||
      (u.role || '').toLowerCase().includes(sUser) ||
      (u.phone || '').includes(searchUser || '')
    );
  });

  const filteredNurses = nursesList.filter(n => {
    const sNurse = (searchNurse || '').toLowerCase();
    return (
      (n.name || '').toLowerCase().includes(sNurse) ||
      (n.staff_id_code || '').toLowerCase().includes(sNurse) ||
      (n.nursing_board_no || '').toLowerCase().includes(sNurse) ||
      (n.phone || '').includes(searchNurse || '')
    );
  });

  const filteredLogs = auditLogs.filter(log => {
    const sLog = (searchLog || '').toLowerCase();
    return (
      (log.user_name || '').toLowerCase().includes(sLog) ||
      (log.action || '').toLowerCase().includes(sLog) ||
      (log.details || '').toLowerCase().includes(sLog)
    );
  });

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Banner */}
      <div className="bg-[#0E1A30] border-b border-[#1F385C] px-4 py-5 sm:px-8">
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
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                PENTADBIR PUSAT DIALISIS KAIZENBROS
              </h1>

              {onStaffLogout && (
                <button
                  onClick={onStaffLogout}
                  className="sm:hidden px-3 py-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center space-x-1 flex-shrink-0"
                  title="Log Keluar daripada sesi pentadbir"
                >
                  <X className="w-3.5 h-3.5 text-rose-300" />
                  <span>Log Keluar</span>
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Pengurusan Lengkap Pesakit, Pentadbir, Jururawat, Mesin Fresenius & Kemasukan Pendaftaran Baru
            </p>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-14 z-30 px-4 sm:px-8 backdrop-blur">
        <div className="max-w-7xl mx-auto flex space-x-2 overflow-x-auto py-2">
          {[
            { id: 'jadual', label: 'Jadual Rawatan (Treatment Schedule)', icon: Calendar, badge: sessionsList.length },
            { id: 'pesakit', label: 'Pengurusan Pesakit', icon: Users, badge: patientsList.filter(p => p.is_active).length },
            { id: 'darah', label: 'Rekod Ujian Darah & AI', icon: Heart, badge: medicalRecords.length },
            { id: 'pendaftaran', label: 'Kemasukan & Pendaftaran Baru', icon: UserPlus, badge: pendingCount },
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

                <button
                  type="button"
                  onClick={() => setIsBorangRegistrationOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer border border-emerald-400/40"
                >
                  <UserPlus className="w-4 h-4 text-emerald-200" />
                  <span>📋 Borang Pendaftaran Kemasukan Dialisis Baru</span>
                </button>
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
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocReg(reg)}
                                  className="inline-flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-[11px]"
                                  title="Klik untuk Lihat / Pratonton Dokumen"
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                  <span className="truncate max-w-[100px]">{reg.document.name}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditingDocReg(reg)}
                                  className="p-1 bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 rounded-lg transition-colors cursor-pointer"
                                  title="Edit / Ganti Dokumen ini"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRegistrationDocument(reg.id)}
                                  className="p-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 rounded-lg transition-colors cursor-pointer"
                                  title="Padam / Buang Dokumen ini"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingDocReg(reg)}
                                className="inline-flex items-center space-x-1 bg-slate-800/80 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700/80 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                title="Tambah Dokumen Rujukan / Laporan Perubatan"
                              >
                                <Plus className="w-3 h-3 text-emerald-400" />
                                <span>+ Tambah Dokumen</span>
                              </button>
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

                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setEditingReg(reg)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1.5 shadow text-xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Urus / Edit</span>
                              </button>

                              <button
                                onClick={() => setDeletingReg(reg)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                title="Padam Permohonan Pendaftaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
                  onClick={() => setIsBorangRegistrationOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer border border-emerald-400/30"
                >
                  <UserPlus className="w-4 h-4 text-teal-200" />
                  <span>📋 Borang Pendaftaran Kemasukan Dialisis</span>
                </button>

                <button
                  onClick={() => setIsAddPatientOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pesakit Direct</span>
                </button>

                <button
                  onClick={handleResetAllPatients}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Kosongkan semua pesakit untuk mula ujian satu pesakit"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset / Kosongkan Data</span>
                </button>
              </div>
            </div>

            {/* Mobile View: Responsive Patient Cards */}
            <div className="block md:hidden space-y-3">
              {filteredPatients.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-lg">Tiada Rekod Pesakit Berdaftar</h4>
                    <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                      Semua data sampel telah dikosongkan. Sila klik butang di bawah untuk memasukkan pesakit pertama anda bagi menguji aliran check-in First Come First Served.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddPatientOpen(true)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg inline-flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Daftar Pesakit Pertama Sekarang</span>
                  </button>
                </div>
              ) : (
                filteredPatients.map((p) => (
                  <div 
                    key={p.id} 
                    className={`bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 space-y-3 transition-all shadow-lg ${
                      !p.is_active ? 'opacity-60 bg-slate-950/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-emerald-400 font-mono font-bold text-xs">{p.patient_id_code}</span>
                        <h4 className="font-black text-white text-base leading-tight">{p.name}</h4>
                        {(() => {
                          const icData = parseMalaysianIC(p.ic_number);
                          return (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              <strong className="text-emerald-400 font-semibold">{icData.ageDisplay || `${p.age} thn`}</strong> ({p.gender}) • Darah: {p.blood_group} • Penaja: <span className="text-indigo-300 font-semibold">{p.sponsor.replace(/_/g, ' ')}</span>
                            </p>
                          );
                        })()}
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        p.is_active 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}>
                        {p.is_active ? 'Aktif' : 'Dikeluarkan'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">MyKad / Tel</span>
                        <p className="text-slate-200 font-mono font-medium">{p.ic_number}</p>
                        <p className="text-slate-400 font-mono text-[11px]">{p.phone}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Akses & Stesen</span>
                        <p className="text-cyan-300 font-bold">{p.vascular_access}</p>
                        <p className="text-emerald-400 font-mono text-[11px]">Stesen: Fleksibel ({p.preferred_shift})</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => setWhatsAppPatient(p)}
                        className="w-full py-2 px-3 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>📱 Hantar Peringatan Sesi (WhatsApp)</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingPatient(p)}
                          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setMedsPatient(p)}
                          className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow"
                          title="Urus Preskripsi & Ubat-Ubatan Pesakit (Doktor & Admin Sahaja)"
                        >
                          <Pill className="w-3.5 h-3.5" />
                          <span>Ubat</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedPatientForBloodTab(p);
                            setActiveTab('darah');
                          }}
                          className="flex-1 py-2 px-3 bg-rose-700 hover:bg-rose-600 active:bg-rose-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow"
                          title="Urus Rekod Darah & Analisa AI Pesakit"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>Darah</span>
                        </button>

                        {p.is_active && (
                          <button
                            onClick={() => {
                              setDeletingPatient(p);
                              setDeletePatientReason('Pindah ke Pusat Dialisis Lain');
                              setDeletePatientNotes('');
                            }}
                            className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                            title="Keluarkan Pesakit Dengan Alasan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Patients Table */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-slate-500" />
                        <span className="font-bold text-slate-300">Tiada rekod pesakit berdaftar.</span>
                        <p className="text-xs text-slate-400">Sila klik butang &quot;Tambah Pesakit Baru&quot; di atas untuk mendaftar pesakit pertama.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p) => (
                      <tr key={p.id} className={`hover:bg-slate-850/50 transition-colors ${!p.is_active ? 'opacity-60 bg-slate-950/40' : ''}`}>
                        <td className="px-4 py-3.5">
                          <span className="text-emerald-400 font-mono font-bold block">{p.patient_id_code}</span>
                          <strong className="text-white text-sm block">{p.name}</strong>
                          {(() => {
                            const icData = parseMalaysianIC(p.ic_number);
                            return (
                              <span className="text-[10px] text-slate-400">
                                <strong className="text-emerald-400 font-semibold">{icData.ageDisplay || `${p.age} thn`}</strong> ({p.gender}) • Darah: {p.blood_group}
                              </span>
                            );
                          })()}
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
                          <p className="text-cyan-400 text-[11px]">{p.preferred_shift} • <strong className="text-emerald-400 font-mono">Stesen Fleksibel (FCFS)</strong></p>
                          {(() => {
                            const next = calculateNextDialysis(p, new Date());
                            return (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 mt-1">
                                Seterusnya {next.dayName} {next.shortTime}
                              </span>
                            );
                          })()}
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
                            onClick={() => setWhatsAppPatient(p)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1 font-bold text-xs shadow"
                            title="Hantar Peringatan Sesi (WhatsApp Fonnte)"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={() => setMedsPatient(p)}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1 font-bold text-xs shadow"
                            title="Urus Preskripsi & Ubat-Ubatan Pesakit (Doktor & Admin)"
                          >
                            <Pill className="w-3.5 h-3.5" />
                            <span>Ubat</span>
                          </button>

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
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2.5: JADUAL RAWATAN (TREATMENT SCHEDULE VIEW - DAILY & WEEKLY) */}
        {/* ========================================================================= */}
        {activeTab === 'jadual' && (
          <TreatmentScheduleManager
            sessions={sessionsList}
            patients={patientsList}
            nurses={nursesList}
            onUpdateSession={handleUpdateSession}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onAuditLog={triggerLog}
          />
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
                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Nama / Email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pentadbir / Pengguna</span>
                </button>
              </div>
            </div>

            {/* Mobile View: Responsive User Cards */}
            <div className="block md:hidden space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                  Tiada pengguna ditemui.
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div 
                    key={u.id} 
                    className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 space-y-3.5 transition-all shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md ${
                          u.role === 'ADMIN' ? 'bg-rose-600' :
                          u.role === 'NEPHROLOGIST' ? 'bg-indigo-600' :
                          u.role === 'HEAD_NURSE' ? 'bg-cyan-600' :
                          u.role === 'STAFF_NURSE' ? 'bg-teal-600' :
                          'bg-emerald-600'
                        }`}>
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-white text-sm truncate">{u.name}</h4>
                          <p className="text-slate-400 text-xs font-mono truncate">{u.email}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 ${
                        u.role === 'ADMIN' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                        u.role === 'NEPHROLOGIST' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                        u.role === 'HEAD_NURSE' || u.role === 'STAFF_NURSE' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                        'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">No. Telefon</span>
                        <span className="text-slate-200 font-mono font-medium">{u.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">No. MyKad</span>
                        <span className="text-slate-200 font-mono font-medium">{u.ic_number}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Status Akaun</span>
                        <span className={`text-[11px] font-bold ${u.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {u.is_active ? '● Aktif' : '● Digantung / Tidak Aktif'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Log Masuk</span>
                        <span className="text-slate-400 text-[11px] font-mono">{u.last_login_at || 'Baru'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit / Kemaskini Pengguna</span>
                      </button>

                      <button
                        onClick={() => setDeletingUser(u)}
                        className="p-2.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                        title="Padam Pengguna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Table with Horizontal Scroll */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                          Tiada pengguna ditemui.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
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
                            <span className={`text-xs font-bold border px-2 py-0.5 rounded ${
                              u.is_active 
                                ? 'text-emerald-400 bg-emerald-950 border-emerald-800' 
                                : 'text-rose-400 bg-rose-950 border-rose-800'
                            }`}>
                              {u.is_active ? 'Aktif' : 'Nyahaktif'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1.5 shadow"
                              title="Edit Pengguna"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
        {/* TAB 6: STESEN & MESIN FRESENIUS (EDIT STATUS BREAKDOWN/OPERASI, NO MESIN, JENIS) */}
        {/* ========================================================================= */}
        {activeTab === 'stesen' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-cyan-950 text-cyan-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-cyan-800">
                    Kawalan Aset Klinikal
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{machinesList.length} Stesen Mesin</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">
                  12 Stesen & Mesin Hemodialisis Fresenius
                </h2>
                <p className="text-xs text-slate-400">
                  Urus dan pantau status operasi, laporan breakdown (rosak), penyelenggaraan berkala, no siri mesin dan jenis model Fresenius.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterMachineStatus}
                  onChange={(e) => setFilterMachineStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                >
                  <option value="SEMUA">Semua Status Mesin</option>
                  <option value="OPERATIONAL">🟢 Operasi Normal ({machinesList.filter(m => m.status === 'OPERATIONAL' || m.status === 'IN_USE').length})</option>
                  <option value="BREAKDOWN">🔴 Breakdown / Rosak ({machinesList.filter(m => m.status === 'BREAKDOWN').length})</option>
                  <option value="MAINTENANCE">🟡 Penyelenggaraan / Servis ({machinesList.filter(m => m.status === 'MAINTENANCE').length})</option>
                </select>

                <button
                  onClick={() => setIsAddMachineOpen(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Stesen Mesin</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-bold block">Jumlah Stesen Mesin</span>
                <span className="text-2xl font-black text-white">{machinesList.length}</span>
              </div>
              <div className="bg-slate-900 border border-emerald-500/40 p-4 rounded-2xl bg-emerald-950/10">
                <span className="text-xs text-emerald-400 uppercase font-bold block">Beroperasi Normal</span>
                <span className="text-2xl font-black text-emerald-300">
                  {machinesList.filter(m => m.status === 'OPERATIONAL' || m.status === 'IN_USE').length}
                </span>
              </div>
              <div className="bg-slate-900 border border-rose-500/40 p-4 rounded-2xl bg-rose-950/10">
                <span className="text-xs text-rose-400 uppercase font-bold block">Breakdown / Rosak</span>
                <span className="text-2xl font-black text-rose-300">
                  {machinesList.filter(m => m.status === 'BREAKDOWN').length}
                </span>
              </div>
              <div className="bg-slate-900 border border-amber-500/40 p-4 rounded-2xl bg-amber-950/10">
                <span className="text-xs text-amber-400 uppercase font-bold block">Penyelenggaraan / Servis</span>
                <span className="text-2xl font-black text-amber-300">
                  {machinesList.filter(m => m.status === 'MAINTENANCE').length}
                </span>
              </div>
            </div>

            {/* Machines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machinesList
                .filter(m => {
                  if (filterMachineStatus === 'SEMUA') return true;
                  if (filterMachineStatus === 'OPERATIONAL') return m.status === 'OPERATIONAL' || m.status === 'IN_USE';
                  return m.status === filterMachineStatus;
                })
                .map((m) => {
                  const isBreakdown = m.status === 'BREAKDOWN';
                  const isMaintenance = m.status === 'MAINTENANCE';
                  const isOperational = m.status === 'OPERATIONAL' || m.status === 'IN_USE';

                  return (
                    <div 
                      key={m.id} 
                      className={`bg-slate-900 border-2 rounded-2xl p-5 space-y-3.5 transition-all shadow-xl ${
                        isBreakdown
                          ? 'border-rose-600/80 bg-rose-950/20 shadow-rose-950/20'
                          : isMaintenance
                          ? 'border-amber-600/80 bg-amber-950/20'
                          : 'border-slate-800 hover:border-cyan-500/60'
                      }`}
                    >
                      {/* Top Header: Stesen No & Status Badge */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-black text-cyan-400 tracking-tight">{m.chair_number || `Stesen ${m.id}`}</span>
                            <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                              Bay: {m.chair_id <= 6 ? 'BAY_A' : m.chair_id <= 11 ? 'BAY_B' : 'ISOLASI'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: STESEN-{m.id.toString().padStart(2, '0')}</p>
                        </div>

                        {/* Status Badge with Quick Dropdown */}
                        <div className="flex flex-col items-end space-y-1">
                          <select
                            value={m.status}
                            onChange={(e) => handleToggleMachineStatus(m.id, e.target.value as any)}
                            className={`text-xs font-black px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none transition-all ${
                              isBreakdown
                                ? 'bg-rose-950 text-rose-300 border-rose-600 ring-2 ring-rose-500/40'
                                : isMaintenance
                                ? 'bg-amber-950 text-amber-300 border-amber-600'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                            }`}
                          >
                            <option value="OPERATIONAL">🟢 Operasi (Sedia Rawatan)</option>
                            <option value="BREAKDOWN">🔴 Breakdown (Rosak)</option>
                            <option value="MAINTENANCE">🟡 Servis / Penyelenggaraan</option>
                          </select>
                        </div>
                      </div>

                      {/* Machine Model & Serial Number */}
                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Nama & Model Mesin:</span>
                          <strong className="text-white text-sm block font-bold mt-0.5">{m.brand_model}</strong>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">No. Siri / No. Mesin:</span>
                            <span className="font-mono text-cyan-300 font-bold text-xs">{m.serial_number}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            m.online_hdf_capable 
                              ? 'bg-indigo-950 text-indigo-300 border-indigo-700' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {m.online_hdf_capable ? 'Online HDF Ready' : 'Standard HD'}
                          </span>
                        </div>
                      </div>

                      {/* Service Dates */}
                      <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800">
                        <span>Servis Terakhir: <strong className="text-slate-200">{m.last_service_date || '-'}</strong></span>
                        <span>Servis Seterusnya: <strong className="text-amber-400">{m.next_service_date || '-'}</strong></span>
                      </div>

                      {/* Action Buttons: Edit, Quick Breakdown, Quick Operasi */}
                      <div className="pt-2 flex items-center space-x-2">
                        <button
                          onClick={() => setEditingMachine(m)}
                          className="flex-1 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit No & Jenis Mesin</span>
                        </button>

                        {isBreakdown ? (
                          <button
                            onClick={() => handleToggleMachineStatus(m.id, 'OPERATIONAL')}
                            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                            title="Tukar ke Operasi Normal"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Set Operasi</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleMachineStatus(m.id, 'BREAKDOWN')}
                            className="py-2 px-3 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                            title="Laporkan Mesin Breakdown / Rosak"
                          >
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                            <span>Breakdown</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteMachine(m.id)}
                          className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                          title="Padam Mesin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
        {/* TAB 8: TETAPAN PUSAT & JADUAL JURURAWAT IKUT SYIF */}
        {/* ========================================================================= */}
        {activeTab === 'tetapan' && (
          <div className="space-y-8">
            {/* BAHAGIAN 1: PROFIL BERDAFTAR PUSAT DIALISIS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-950 text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-800 uppercase tracking-wider">
                      Profil Berdaftar Pusat Dialisis
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Lesen KKM: {centreProfile.kkm_license}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
                    {centreProfile.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    {centreProfile.slogan}
                  </p>
                </div>

                <button
                  onClick={() => setIsEditCentreProfileOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>✏️ Kemaskini / Edit Pelbagai Maklumat Profil</span>
                </button>
              </div>

              {/* Comprehensive Profile Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                {/* 1. Nama & Jenama */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Nama Berdaftar & Jenama</span>
                  <strong className="text-white text-sm block font-bold">{centreProfile.name}</strong>
                  <p className="text-indigo-400 font-medium">{centreProfile.brand}</p>
                </div>

                {/* 2. Lesen KKM & Tarikh Tubuh */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Pendaftaran & Pelesenan</span>
                  <p><strong>No. Lesen KKM:</strong> <span className="font-mono text-emerald-400 font-bold">{centreProfile.kkm_license}</span></p>
                  <p><strong>Tarikh Ditubuhkan:</strong> <span className="text-slate-300">{centreProfile.established_date}</span></p>
                </div>

                {/* 3. Alamat Premis */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Alamat Premis Pusat</span>
                  <p className="text-slate-200 leading-relaxed">{centreProfile.address}</p>
                  <p className="text-slate-400">{centreProfile.city || 'Semenyih'}, {centreProfile.postcode || '43500'} {centreProfile.state || 'Selangor'}</p>
                </div>

                {/* 4. Talian Perhubungan */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Talian Telefon & Hubungan</span>
                  <p><strong>Telefon Utama:</strong> <span className="font-mono text-white font-bold">{centreProfile.phone_main}</span></p>
                  <p><strong>Hotline 24 Jam:</strong> <span className="font-mono text-rose-400 font-bold">{centreProfile.hotline_24h}</span></p>
                  <p><strong>WhatsApp:</strong> <span className="font-mono text-emerald-400 font-bold">{centreProfile.whatsapp_number}</span></p>
                  <p><strong>Emel Rasmi:</strong> <span className="font-mono text-cyan-400">{centreProfile.email}</span></p>
                </div>

                {/* 5. Pegawai Perubatan & Jururawat */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Pegawai Bertanggungjawab</span>
                  <p><strong>Pakar Nefrologi:</strong> <span className="text-cyan-300 font-bold block">{centreProfile.medical_director || 'Dr. Azman bin Khairuddin'}</span></p>
                  <p><strong>Ketua Jururawat:</strong> <span className="text-amber-300 font-bold block">{centreProfile.head_nurse || 'Sister Siti Fatimah binti Rahman'}</span></p>
                </div>

                {/* 6. Sistem Klinikal & Kapasiti */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Kapasiti & Rawatan Air</span>
                  <p><strong>Kapasiti Stesen Mesin:</strong> <span className="text-white font-bold">{centreProfile.capacity_machines} Stesen Dialisis</span></p>
                  <p><strong>Model Mesin Utama:</strong> <span className="text-slate-300">{centreProfile.machine_model}</span></p>
                  <p><strong>Sistem Rawatan Air:</strong> <span className="text-emerald-400 font-medium text-[11px] block">{centreProfile.water_system}</span></p>
                </div>
              </div>

              {/* Senarai Panel Penaja */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Panel Penaja & Subsidi Rawatan Berdaftar:</span>
                <div className="flex flex-wrap gap-2">
                  {centreProfile.panels.map((panel, idx) => (
                    <span key={idx} className="bg-slate-900 border border-indigo-800/80 text-indigo-300 px-3 py-1 rounded-xl text-xs font-semibold">
                      ✓ {panel}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* BAHAGIAN 2: JADUAL BERTUGAS JURURAWAT MENGIKUT SYIF */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-cyan-950 text-cyan-300 text-xs font-black px-3 py-1 rounded-full border border-cyan-800 uppercase tracking-wider">
                      Tetapan Jadual Syif Klinikal
                    </span>
                    <span className="text-xs text-slate-400 font-mono">2 Syif Rawatan Setiap Hari</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                    Penugasan Jururawat Bertugas Mengikut Syif
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Masukkan dan tetapkan jururawat yang bertugas bagi Syif 1 (5:30 AM - 3:00 PM) atau Syif 2 (12:00 PM - 8:00 PM).
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAddNurseOpen(true)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Daftar Jururawat Baru</span>
                  </button>
                </div>
              </div>

              {/* Syif Selection Tabs - 2 Clinical Shifts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'PAGI', label: 'Syif 1: Pagi (5:30 AM - 3:00 PM)', time: '5:30 AM - 3:00 PM', desc: 'Sesi Rawatan Awal Pagi hingga Awal Petang' },
                  { id: 'PETANG', label: 'Syif 2: Petang (12:00 PM - 8:00 PM)', time: '12:00 PM - 8:00 PM', desc: 'Sesi Rawatan Tengahari hingga Malam' }
                ].map(shift => {
                  const isSelected = selectedShiftForTetapan === shift.id;
                  const countInShift = nursesList.filter(n => n.shift_today === shift.id).length;
                  const onDutyCount = nursesList.filter(n => n.shift_today === shift.id && n.is_on_duty).length;

                  return (
                    <button
                      key={shift.id}
                      onClick={() => setSelectedShiftForTetapan(shift.id as ShiftSlot)}
                      className={`p-5 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-950/40'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <strong className="text-white text-base font-bold">{shift.label}</strong>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {onDutyCount} / {countInShift} Bertugas
                        </span>
                      </div>
                      <p className="text-sm text-indigo-300 font-mono font-bold mt-1.5">{shift.time}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{shift.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Nurses Assigned to Selected Shift */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <span>Senarai Jururawat Bagi Syif {selectedShiftForTetapan === 'PAGI' ? '1 (Pagi: 5:30 AM - 3:00 PM)' : '2 (Petang: 12:00 PM - 8:00 PM)'}:</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {nursesList.filter(n => n.shift_today === selectedShiftForTetapan).length} Jururawat Ditugaskan
                  </span>
                </div>

                {nursesList.filter(n => n.shift_today === selectedShiftForTetapan).length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                    <Stethoscope className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-white font-bold text-sm">Tiada Jururawat Ditugaskan Bagi Syif {selectedShiftForTetapan === 'PAGI' ? '1 (Pagi)' : '2 (Petang)'}</p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Pilih mana-mana jururawat di bawah untuk dimasukkan bertugas ke dalam Syif {selectedShiftForTetapan === 'PAGI' ? '1 (5:30am - 3:00pm)' : '2 (12:00pm - 8:00pm)'}.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nursesList
                      .filter(n => n.shift_today === selectedShiftForTetapan)
                      .map((nurse) => (
                        <div key={nurse.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 relative group">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                                {nurse.staff_id_code}
                              </span>
                              <h5 className="font-bold text-white text-base mt-1.5">{nurse.name}</h5>
                              <p className="text-xs text-slate-400">{nurse.title}</p>
                            </div>

                            <button
                              onClick={() => handleToggleNurseDuty(nurse.id)}
                              className={`text-[10px] font-black px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                                nurse.is_on_duty
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {nurse.is_on_duty ? '🟢 On Duty' : '⚪ Off Duty'}
                            </button>
                          </div>

                          <div className="text-xs space-y-1.5 pt-2 border-t border-slate-800/80 text-slate-300">
                            <p><strong>LJM No:</strong> <span className="font-mono text-slate-200">{nurse.nursing_board_no}</span></p>
                            <p><strong>Telefon:</strong> <span className="font-mono text-slate-200">{nurse.phone}</span></p>
                            
                            {/* Bay Assignment Selector */}
                            <div className="flex items-center space-x-2 pt-1">
                              <span className="font-bold text-white">Bay:</span>
                              <select
                                value={nurse.assigned_bay || 'BAY_A'}
                                onChange={(e) => handleAssignNurseToShift(nurse.id, nurse.shift_today, e.target.value, nurse.is_on_duty)}
                                className="bg-slate-900 border border-slate-700 text-cyan-300 rounded-lg px-2 py-1 text-xs font-bold"
                              >
                                <option value="BAY_A">Bay A (Stesen B01 - B06)</option>
                                <option value="BAY_B">Bay B (Stesen B07 - B11)</option>
                                <option value="ISOLATION">Bilik Isolasi (Stesen B12)</option>
                              </select>
                            </div>

                            {/* Shift Switcher */}
                            <div className="flex items-center space-x-2 pt-1">
                              <span className="font-bold text-white">Tukar Syif:</span>
                              <select
                                value={nurse.shift_today}
                                onChange={(e) => handleAssignNurseToShift(nurse.id, e.target.value as ShiftSlot, nurse.assigned_bay || 'BAY_A', nurse.is_on_duty)}
                                className="bg-slate-900 border border-slate-700 text-amber-300 rounded-lg px-2 py-1 text-xs font-bold"
                              >
                                <option value="PAGI">Syif 1: Pagi (5:30 AM - 3:00 PM)</option>
                                <option value="PETANG">Syif 2: Petang (12:00 PM - 8:00 PM)</option>
                              </select>
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-800">
                            <button
                              onClick={() => setEditingNurse(nurse)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Profil</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Quick Add Other Nurses into this Shift */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">
                    + Masukkan Jururawat Lain ke Syif {selectedShiftForTetapan === 'PAGI' ? '1 (5:30 AM - 3:00 PM)' : '2 (12:00 PM - 8:00 PM)'}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {nursesList
                      .filter(n => n.shift_today !== selectedShiftForTetapan)
                      .map(nurse => (
                        <button
                          key={nurse.id}
                          onClick={() => handleAssignNurseToShift(nurse.id, selectedShiftForTetapan, nurse.assigned_bay || 'BAY_A', true)}
                          className="px-3 py-2 bg-slate-900 hover:bg-indigo-900 border border-slate-700 hover:border-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{nurse.name} ({nurse.staff_id_code}) [Kini: Syif {nurse.shift_today === 'PAGI' ? '1 (Pagi)' : '2 (Petang)'}]</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* BAHAGIAN 3: INTEGRASI WHATSAPP GATEWAY (FONNTE PROVIDER) */}
            <div className="bg-slate-900 border border-emerald-500/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-950 text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-800 uppercase tracking-wider flex items-center">
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Penyedia WhatsApp Gateway (Fonnte API)
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Modul Notifikasi & Peringatan Sesi</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                    Konfigurasi Fonnte WhatsApp API
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sistem ini menggunakan Fonnte sebagai penyedia perkhidmatan WhatsApp Gateway untuk menghantar peringatan sesi rawatan dialisis secara manual kepada pesakit.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href="https://fonnte.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5"
                  >
                    <span>Daftar Akaun Fonnte</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Token Configuration */}
                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h4 className="font-black text-white text-sm flex items-center space-x-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Fonnte API Token / Device Key:</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Masukkan token peranti Fonnte anda yang diperoleh daripada papan pemuka (Dashboard) Fonnte.
                  </p>

                  <div className="space-y-2">
                    <input
                      type="password"
                      placeholder="Masukkan Fonnte Token (contoh: aBc123XyZ...)"
                      value={fonnteToken}
                      onChange={(e) => setFonnteToken(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Status Token: {fonnteToken ? <strong className="text-emerald-400 font-mono">Dikonfigurasi ({fonnteToken.slice(0, 4)}...{fonnteToken.slice(-4)})</strong> : <span className="text-amber-400">Belum Dimasukkan</span>}
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveFonnteToken}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-all flex items-center space-x-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Simpan Token</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Test Connection / Dispatch */}
                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h4 className="font-black text-white text-sm flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Uji Penghantaran WhatsApp:</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Hantar mesej ujian ke nombor telefon pengurus/jururawat untuk mengesahkan sambungan API Fonnte.
                  </p>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Nombor Telefon Ujian (contoh: 0193389922)"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={isTestingFonnte}
                      onClick={handleTestFonnteApi}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isTestingFonnte ? 'Menghantar...' : 'Uji Sekarang'}</span>
                    </button>
                  </div>

                  {testResult && (
                    <div className={`p-3 rounded-xl border text-xs ${testResult.success ? 'bg-emerald-950 border-emerald-700 text-emerald-300' : 'bg-rose-950 border-rose-700 text-rose-300'}`}>
                      {testResult.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BAHAGIAN 4: UTULITI TETAPAN SEMULA DATA KLINIK (ZON BAHAYA) */}
            <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-rose-950 text-rose-300 text-xs font-black px-3 py-1 rounded-full border border-rose-800 uppercase tracking-wider flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                      Zon Bahaya: Pentadbir Sistem Sahaja
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Kawalan Pangkalan Data Pusat</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                    Terapkan Tetapan Semula Data (Full Reset) dengan Pilihan
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pilih modul pangkalan data yang ingin dipadamkan secara kekal dari sistem secara live. Hanya pentadbir yang diberi kebenaran sahaja boleh memadam rekod ini.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block font-mono">Pilihan Konfigurasi Tetapan Semula (Full Reset Options)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Option 1 */}
                  <label className="relative flex p-4 rounded-xl border-2 transition-all cursor-pointer select-none bg-slate-900/40 border-slate-800 hover:border-slate-700">
                    <div className="flex items-start space-x-3 w-full">
                      <input
                        type="checkbox"
                        checked={fullResetOptPatients}
                        onChange={(e) => setFullResetOptPatients(e.target.checked)}
                        className="mt-1 w-4.5 h-4.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="text-xs text-rose-400 font-extrabold uppercase font-mono block">Opsi 1</span>
                        <strong className="text-white text-sm block font-bold">Reset Data Pesakit</strong>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Memadam semua rekod pesakit, permohonan baru, ubat-ubatan, dan giliran check-in di klinik.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 2 */}
                  <label className="relative flex p-4 rounded-xl border-2 transition-all cursor-pointer select-none bg-slate-900/40 border-slate-800 hover:border-slate-700">
                    <div className="flex items-start space-x-3 w-full">
                      <input
                        type="checkbox"
                        checked={fullResetOptDialysis}
                        onChange={(e) => setFullResetOptDialysis(e.target.checked)}
                        className="mt-1 w-4.5 h-4.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="text-xs text-cyan-400 font-extrabold uppercase font-mono block">Opsi 2</span>
                        <strong className="text-white text-sm block font-bold">Reset Data Dialisis</strong>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Memadam semua sesi dialisis harian (aktif mahupun selesai), penugasan kerusi, dan stesen.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 3 */}
                  <label className="relative flex p-4 rounded-xl border-2 transition-all cursor-pointer select-none bg-slate-900/40 border-slate-800 hover:border-slate-700">
                    <div className="flex items-start space-x-3 w-full">
                      <input
                        type="checkbox"
                        checked={fullResetOptBlood}
                        onChange={(e) => setFullResetOptBlood(e.target.checked)}
                        className="mt-1 w-4.5 h-4.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="text-xs text-fuchsia-400 font-extrabold uppercase font-mono block">Opsi 3</span>
                        <strong className="text-white text-sm block font-bold">Reset Data Darah</strong>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Memadam semua rekod darah pesakit, ulasan AI, dan analisis perubatan di klinik secara total.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-xs text-slate-400 max-w-xl">
                    <p className="font-bold text-rose-300">⚠️ Amaran Keselamatan & Kebenaran Pentadbir:</p>
                    <p className="mt-0.5">Tindakan ini adalah muktamad. Hanya pentadbir yang sah dengan akses bertingkat boleh menjalankan tetapan semula data pangkalan data simulasi ini.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!fullResetOptPatients && !fullResetOptDialysis && !fullResetOptBlood) {
                        alert('Sila pilih sekurang-kurangnya satu opsi tetapan semula di atas.');
                        return;
                      }
                      setIsFullResetConfirmOpen(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white font-black text-xs sm:text-sm rounded-xl border border-rose-600 hover:border-rose-400 transition-all cursor-pointer text-center shadow-lg hover:shadow-rose-950/40"
                  >
                    💥 JALANKAN TETAPAN SEMULA PILIHAN (FULL RESET)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ========================================================================= */}
        {/* TAB: REKOD DARAH PESAKIT DAN ANALISA (ADMIN WORKFLOW) */}
        {/* ========================================================================= */}
        {activeTab === 'darah' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-rose-950 text-rose-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-rose-800 uppercase tracking-wider">
                    Modul Perubatan &amp; Makmal
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-bold">Pengekstrakan AI &amp; Keputusan Makmal</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Rekod Darah Pesakit dan Analisa AI
                </h3>
                <p className="text-xs text-slate-400">
                  Urus keputusan ujian makmal berkala, jalankan analisis pintar AI dari fail laporan, dan kemaskini ulasan klinikal.
                </p>
              </div>
              {selectedPatientForBloodTab && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientForBloodTab(null);
                    resetMrForm();
                  }}
                  className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-extrabold text-sm rounded-xl cursor-pointer transition-all flex items-center space-x-1.5 shrink-0"
                >
                  <span>← Kembali ke Senarai Pesakit</span>
                </button>
              )}
            </div>

            {!selectedPatientForBloodTab ? (
              /* SCREEN 1: SELECT PATIENT */
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-3 text-cyan-400">
                    <Search className="w-5 h-5" />
                    <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Cari Pesakit Untuk Urus Rekod Darah</h3>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={bloodTabSearchTerm}
                      onChange={(e) => setBloodTabSearchTerm(e.target.value)}
                      placeholder="Masukkan nama pesakit atau No. ID Pesakit (cth: Tan Ah Kow, P-1001)..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none placeholder-slate-500 min-h-[48px]"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-96 overflow-y-auto pr-1">
                    {patientsList
                      .filter(p => {
                        const term = bloodTabSearchTerm.toLowerCase();
                        return (
                          p.name.toLowerCase().includes(term) ||
                          p.patient_id_code.toLowerCase().includes(term) ||
                          p.ic_number.includes(term)
                        );
                      })
                      .map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientForBloodTab(p);
                            resetMrForm();
                          }}
                          className="p-4 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-600 rounded-2xl transition-all cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-cyan-400">{p.patient_id_code}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {medicalRecords.filter(r => r.patient_id === p.id || String(r.patient_id) === String(p.id) || r.patient_id_code === p.patient_id_code).length} Rekod
                            </span>
                          </div>
                          <h4 className="font-bold text-white group-hover:text-cyan-300 transition-colors">{p.name}</h4>
                          <p className="text-[11px] text-slate-400 font-mono">IC: {p.ic_number}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              /* SCREEN 2: ACTIVE PATIENT BLOOD RECORDS & FORM */
              <div className="space-y-6">
                <div className="bg-[#121c2e] border-2 border-[#1E3B60] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                  <div className="text-left space-y-1">
                    <span className="text-[11px] font-mono font-black text-rose-400 uppercase tracking-widest block">Urusan Keputusan Darah Pesakit</span>
                    <h3 className="text-2xl font-black text-white">{selectedPatientForBloodTab.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 font-mono">
                      ID: <span className="text-cyan-400 font-bold">{selectedPatientForBloodTab.patient_id_code}</span> • IC: <span className="text-slate-400">{selectedPatientForBloodTab.ic_number}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetMrForm();
                      setShowAddMedicalRecordForm(true);
                    }}
                    className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 border border-rose-500"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Rekod Darah Baharu</span>
                  </button>
                </div>

                {showAddMedicalRecordForm && (
                  /* FORM VIEW */
                  <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-5 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-base sm:text-lg font-black text-rose-400 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                        <span>{editingMedicalRecord ? 'Kemas kini Rekod Keputusan' : 'Tambah Rekod Keputusan Makmal Baharu'}</span>
                      </h4>
                      <button 
                        type="button"
                        onClick={() => { setShowAddMedicalRecordForm(false); resetMrForm(); }}
                        className="text-xs text-slate-400 hover:text-white font-bold bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>

                    {/* DOCUMENT UPLOAD & AI ANALYSIS */}
                    <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                      <span className="text-xs font-bold text-cyan-300 block font-mono uppercase">📎 Muat Naik Laporan &amp; Ekstrak AI (Automatik)</span>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                setMrUploadedDoc({
                                  name: file.name,
                                  size: `${(file.size / 1024).toFixed(1)} KB`,
                                  type: file.type,
                                  data_url: dataUrl
                                });
                                handleAdminAiAnalysis(dataUrl, file.name);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
                        />

                        {mrUploadedDoc?.data_url && (
                          <button
                            type="button"
                            onClick={() => handleAdminAiAnalysis(mrUploadedDoc.data_url, mrUploadedDoc.name)}
                            disabled={isAiAnalyzing}
                            className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
                          >
                            <Cpu className="w-4 h-4" />
                            <span>{isAiAnalyzing ? 'Menganalisis AI...' : '🔄 Ulang Analisis & Ekstrak'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Tarikh Pemeriksaan:</label>
                        <input 
                          type="date"
                          value={mrExamDate}
                          onChange={(e) => setMrExamDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Jenis Pemeriksaan:</label>
                        <select 
                          value={mrExamType}
                          onChange={(e) => setMrExamType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                        >
                          <option value="Pemeriksaan Berkala 3 Bulan">Pemeriksaan Berkala 3 Bulan</option>
                          <option value="Pemeriksaan Tahunan">Pemeriksaan Tahunan</option>
                          <option value="Ujian Khas Makmal">Ujian Khas Makmal</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Status:</label>
                        <select 
                          value={mrExamStatus}
                          onChange={(e) => setMrExamStatus(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                        >
                          <option value="LENGKAP">LENGKAP</option>
                          <option value="MENUNGGU">MENUNGGU</option>
                          <option value="ABNORMAL">ABNORMAL / KELUAR JULAT</option>
                        </select>
                      </div>
                    </div>

                    {/* BLOOD PARAMETERS GRID */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase tracking-wider block">Parameter Makmal Sebenar (Bebas Nilai Rekaan)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setHb(''); setWbc(''); setPlatelet('');
                            setUrea(''); setCreatinine(''); setEgfr(''); setCalcium(''); setPhosphate(''); setPotassium(''); setSodium('');
                            setGlucose(''); setHba1c('');
                            setCholesterol(''); setLdl(''); setHdl(''); setTriglycerides('');
                          }}
                          className="text-[11px] text-rose-400 hover:text-rose-300 underline font-bold"
                        >
                          Kosongkan Semua Kotak
                        </button>
                      </div>

                      {/* 1. HEMATOLOGY */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block font-mono">1. Hematologi &amp; Sel Darah</span>
                        <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Hemoglobin (Hb g/dL):</label>
                            <input type="text" value={hb} onChange={(e) => setHb(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">WBC (Sel Darah Putih):</label>
                            <input type="text" value={wbc} onChange={(e) => setWbc(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Platelet:</label>
                            <input type="text" value={platelet} onChange={(e) => setPlatelet(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                        </div>
                      </div>

                      {/* 2. RENAL */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block font-mono pt-1">2. Profil Buah Pinggang &amp; Elektrolit</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Urea (mmol/L):</label>
                            <input type="text" value={urea} onChange={(e) => setUrea(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Creatinine (µmol/L):</label>
                            <input type="text" value={creatinine} onChange={(e) => setCreatinine(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Kalium / Potassium:</label>
                            <input type="text" value={potassium} onChange={(e) => setPotassium(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Fosfat / Phosphate:</label>
                            <input type="text" value={phosphate} onChange={(e) => setPhosphate(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Kalsium / Calcium:</label>
                            <input type="text" value={calcium} onChange={(e) => setCalcium(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Sodium / Natrium:</label>
                            <input type="text" value={sodium} onChange={(e) => setSodium(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">eGFR:</label>
                            <input type="text" value={egfr} onChange={(e) => setEgfr(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                        </div>
                      </div>

                      {/* 3. DIABETES */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block font-mono pt-1">3. Kencing Manis (Diabetes)</span>
                        <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Glucose (mmol/L):</label>
                            <input type="text" value={glucose} onChange={(e) => setGlucose(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">HbA1c (%):</label>
                            <input type="text" value={hba1c} onChange={(e) => setHba1c(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                        </div>
                      </div>

                      {/* 4. LIPID */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block font-mono pt-1">4. Profil Lipid (Kolesterol)</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Cholesterol (mmol/L):</label>
                            <input type="text" value={cholesterol} onChange={(e) => setCholesterol(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">LDL (mmol/L):</label>
                            <input type="text" value={ldl} onChange={(e) => setLdl(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">HDL (mmol/L):</label>
                            <input type="text" value={hdl} onChange={(e) => setHdl(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 block font-semibold">Triglycerides (mmol/L):</label>
                            <input type="text" value={triglycerides} onChange={(e) => setTriglycerides(e.target.value)} placeholder="-" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Rumusan &amp; Analisis AI:</label>
                      <textarea
                        rows={3}
                        value={mrAiAnalysisNotes}
                        onChange={(e) => setMrAiAnalysisNotes(e.target.value)}
                        placeholder="Ulasan klinikal AI automatik akan dipaparkan di sini..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowAddMedicalRecordForm(false); resetMrForm(); }}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleAdminSaveMr}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer"
                      >
                        ✓ Simpan Rekod Darah &amp; Sync Ke Portal Pesakit
                      </button>
                    </div>
                  </div>
                )}

                {/* RECORD HISTORY LIST FOR THIS PATIENT */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <h4 className="font-extrabold text-white text-base">Sejarah Rekod Ujian Darah Pesakit Ini</h4>
                  
                  {medicalRecords.filter(r => r.patient_id === selectedPatientForBloodTab.id || String(r.patient_id) === String(selectedPatientForBloodTab.id) || r.patient_id_code === selectedPatientForBloodTab.patient_id_code).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Tiada rekod darah sedia ada untuk pesakit ini.</p>
                  ) : (
                    <div className="space-y-3">
                      {medicalRecords
                        .filter(r => r.patient_id === selectedPatientForBloodTab.id || String(r.patient_id) === String(selectedPatientForBloodTab.id) || r.patient_id_code === selectedPatientForBloodTab.patient_id_code)
                        .map(rec => (
                          <div key={rec.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-mono font-bold text-rose-400">{rec.id}</span>
                                <span className="text-xs font-bold text-white">{rec.examination_type}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">{rec.status}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">Tarikh: {rec.examination_date} • Oleh: {rec.created_by || 'Admin'}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => startEditMr(rec)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs rounded-xl cursor-pointer shrink-0"
                            >
                              Edit / Lihat Detail
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FULL RESET IN-APP CONFIRMATION MODAL */}
      {isFullResetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E1A30] border-2 border-rose-600 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-7 h-7 text-rose-500 animate-bounce" />
              <div>
                <h3 className="text-lg font-black text-white">Sahkan Tetapan Semula Penuh (Full Reset)</h3>
                <p className="text-xs text-rose-300">Tindakan ini adalah muktamad dan tidak boleh diundur</p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-bold text-white">Modul yang terpilih untuk dipadam secara total:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                {fullResetOptPatients && <li><strong className="text-rose-300">Data Pesakit</strong> (Profil, Pendaftaran Baru &amp; Giliran Check-In)</li>}
                {fullResetOptDialysis && <li><strong className="text-cyan-300">Data Dialisis</strong> (Semua Sesi Rawatan &amp; Penugasan Stesen)</li>}
                {fullResetOptBlood && <li><strong className="text-fuchsia-300">Data Ujian Darah</strong> (Rekod Makmal &amp; Analisis AI)</li>}
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFullResetConfirmOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  let count = 0;
                  if (fullResetOptPatients && onResetPatients) {
                    onResetPatients();
                    count++;
                  }
                  if (fullResetOptDialysis && onResetDialysisData) {
                    onResetDialysisData();
                    count++;
                  }
                  if (fullResetOptBlood && onResetBloodData) {
                    onResetBloodData();
                    count++;
                  }
                  setIsFullResetConfirmOpen(false);
                  alert(`✓ Berjaya menetapkan semula (reset) ${count} modul pangkalan data yang terpilih!`);
                }}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/50 flex items-center space-x-1"
              >
                <span>💥 Sahkan &amp; Padam Data Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ALL MODALS (PATIENT, REGISTRATION, USER, NURSE, DELETE REASON) */}
      {/* ========================================================================= */}

      {/* 0. MODAL BORANG PENDAFTARAN KEMASUKAN DIALISIS BARU (FULL FORM ADMIN) */}
      {isBorangRegistrationOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl my-auto">
            <NewPatientRegistration
              isAdminModal={true}
              onCloseModal={() => setIsBorangRegistrationOpen(false)}
              onNewRegistrationSubmitted={handleAdminNewRegistrationSubmitted}
            />
          </div>
        </div>
      )}

      {/* 1. MODAL EDIT PENDAFTARAN PESAKIT BARU */}
      {editingReg && (
        <EditRegistrationModal
          registration={editingReg}
          onClose={() => setEditingReg(null)}
          onSave={handleSaveEditedRegistration}
          onDelete={(id) => {
            setEditingReg(null);
            const target = regList.find(r => r.id === id);
            if (target) setDeletingReg(target);
          }}
          onDeleteDoc={(id) => {
            executeDeleteRegistrationDocument(id);
          }}
        />
      )}

      {/* 1.5. MODAL CONFIRM DELETE PERMOHONAN PENDAFTARAN */}
      {deletingReg && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400 border-b border-slate-800 pb-3">
              <Trash2 className="w-6 h-6 flex-shrink-0 text-rose-500" />
              <div>
                <h3 className="text-lg font-black text-white">Padam Permohonan Pendaftaran</h3>
                <p className="text-xs text-slate-400">Tindakan ini akan memadam rekod permohonan kemasukan pesakit secara kekal.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <p><strong>Nama Pemohon:</strong> <span className="text-white font-bold">{deletingReg.full_name}</span></p>
              <p><strong>No. Rujukan:</strong> <span className="font-mono text-emerald-400">{deletingReg.id}</span></p>
              <p><strong>No. MyKad:</strong> <span className="font-mono text-slate-200">{deletingReg.ic_number}</span></p>
              <p><strong>Tarikh Mohon:</strong> {deletingReg.created_at}</p>
            </div>

            <p className="text-xs text-rose-300">
              Adakah anda pasti ingin memadam permohonan kemasukan pesakit baru ini?
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingReg(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRegistration(deletingReg.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam Permohonan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1.6. MODAL CONFIRM DELETE DOKUMEN PENDAFTARAN */}
      {deletingDocReg && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/60 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center space-x-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Padam Dokumen Lampiran</h3>
                <p className="text-xs text-slate-400">Tindakan ini akan memadam dokumen permohonan pesakit ini.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <p><strong>Nama Pemohon:</strong> <span className="text-white font-bold">{deletingDocReg.full_name}</span></p>
              <p><strong>No. Rujukan:</strong> <span className="font-mono text-emerald-400">{deletingDocReg.id}</span></p>
              {deletingDocReg.document && (
                <p><strong>Nama Fail Dokumen:</strong> <span className="font-mono text-rose-300 font-semibold">{deletingDocReg.document.name}</span></p>
              )}
            </div>

            <p className="text-xs text-rose-300">
              Adakah anda pasti ingin memadam fail dokumen lampiran ini?
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingDocReg(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = deletingDocReg.id;
                  executeDeleteRegistrationDocument(targetId);
                  setDeletingDocReg(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL PREVIEW DOKUMEN */}
      {previewDocReg && previewDocReg.document && (
        <DocumentPreviewModal
          registration={previewDocReg}
          onClose={() => setPreviewDocReg(null)}
          onEdit={() => {
            const current = previewDocReg;
            setPreviewDocReg(null);
            setEditingDocReg(current);
          }}
          onDelete={() => {
            const current = previewDocReg;
            setPreviewDocReg(null);
            handleDeleteRegistrationDocument(current.id);
          }}
        />
      )}

      {/* 2.1. MODAL URUS DOKUMEN (TAMBAH, EDIT, GANTI, BUANG) */}
      {editingDocReg && (
        <ManageDocumentModal
          registration={editingDocReg}
          onClose={() => setEditingDocReg(null)}
          onSave={(doc) => {
            handleUpdateRegistrationDocument(editingDocReg.id, doc);
            setEditingDocReg(null);
          }}
          onDelete={() => {
            const currentId = editingDocReg.id;
            setEditingDocReg(null);
            handleDeleteRegistrationDocument(currentId);
          }}
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
              <p><strong>Syif Rawatan:</strong> Syif {deletingPatient.preferred_shift} (Stesen Fleksibel FCFS)</p>
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

      {/* 5.5. MODAL PENGURUSAN PREKRIPSI & UBAT-UBATAN PESAKIT (DOKTOR / PENTADBIR SAHAJA) */}
      {medsPatient && (
        <AdminMedicationsModal
          patient={medsPatient}
          medications={medsList.filter(m => m.patient_id === medsPatient.id)}
          onClose={() => setMedsPatient(null)}
          onAdd={handleAddMedicationForPatient}
          onUpdate={handleUpdateMedicationForPatient}
          onDelete={handleDeleteMedicationForPatient}
        />
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

      {/* 10. MODAL TAMBAH / EDIT MESIN FRESENIUS (STATUS BREAKDOWN/OPERASI, NO MESIN, JENIS) */}
      {(isAddMachineOpen || editingMachine) && (
        <MachineFormModal
          title={editingMachine ? `Kemaskini Stesen Mesin: ${editingMachine.chair_number}` : 'Daftar Stesen Mesin Baru'}
          initialData={editingMachine || undefined}
          onClose={() => {
            setIsAddMachineOpen(false);
            setEditingMachine(null);
          }}
          onSave={(data) => {
            if (editingMachine) {
              handleUpdateMachine({ ...editingMachine, ...data });
            } else {
              handleAddMachine(data);
            }
          }}
        />
      )}

      {/* 11. MODAL EDIT PROFIL BERDAFTAR PUSAT DIALISIS */}
      {isEditCentreProfileOpen && (
        <CentreProfileEditModal
          initialProfile={centreProfile}
          onClose={() => setIsEditCentreProfileOpen(false)}
          onSave={handleSaveCentreProfile}
        />
      )}

      {/* 12. MODAL PERINGATAN WHATSAPP SESI DIALISIS (FONNTE) */}
      <WhatsAppReminderModal
        isOpen={!!whatsAppPatient}
        onClose={() => setWhatsAppPatient(null)}
        patient={whatsAppPatient}
        onLogAudit={triggerLog}
        onNavigateToSettings={() => setActiveTab('tetapan')}
      />

    </div>
  );
}

{/* ========================================================================= */}
{/* COMPONENT: ADMIN MEDICATIONS MODAL (DOKTOR / PENTADBIR SAHAJA) */}
{/* ========================================================================= */}
interface AdminMedicationsModalProps {
  patient: Patient;
  medications: PatientMedication[];
  onClose: () => void;
  onAdd: (med: Omit<PatientMedication, 'id'>) => void;
  onUpdate: (med: PatientMedication) => void;
  onDelete: (medId: number) => void;
}

function AdminMedicationsModal({
  patient,
  medications,
  onClose,
  onAdd,
  onUpdate,
  onDelete
}: AdminMedicationsModalProps) {
  const [editingMed, setEditingMed] = useState<PatientMedication | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('');
  const [newRoute, setNewRoute] = useState<'ORAL' | 'IV' | 'SUBCUTANEOUS'>('ORAL');

  const icData = parseMalaysianIC(patient.ic_number);

  const handleApplyPreset = (preset: { name: string; dosage: string; frequency: string; route: 'ORAL' | 'IV' | 'SUBCUTANEOUS' }) => {
    setNewMedName(preset.name);
    setNewDosage(preset.dosage);
    setNewFrequency(preset.frequency);
    setNewRoute(preset.route);
    setShowAddForm(true);
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !newDosage.trim()) return;

    onAdd({
      patient_id: patient.id,
      medication_id: Date.now(),
      medication_name: newMedName.trim(),
      dosage: newDosage.trim(),
      frequency: newFrequency.trim() || '1x sehari',
      route: newRoute,
      is_active: true
    });

    setNewMedName('');
    setNewDosage('');
    setNewFrequency('');
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;
    onUpdate(editingMed);
    setEditingMed(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-800 shadow">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-extrabold text-amber-400 font-mono tracking-wider">
                  Panel Preskripsi Klinikal Doktor / Pentadbir
                </span>
                <span className="text-[10px] bg-amber-900/80 text-amber-200 border border-amber-700 px-2 py-0.5 rounded-full font-bold">
                  🔒 Kawalan Terhad
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-0.5">
                Urus Ubat & Preskripsi: <span className="text-emerald-400">{patient.name}</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Patient Quick Info Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">ID Pesakit:</span>
              <strong className="text-cyan-400 font-mono text-sm">{patient.patient_id_code}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Umur & Jantina:</span>
              <strong className="text-emerald-400 font-bold">{icData.ageDisplay || `${patient.age} Thn`} ({patient.gender === 'LELAKI' ? 'L' : 'P'})</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Berat Kering:</span>
              <strong className="text-white font-mono text-sm">{patient.dry_weight_kg} kg</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Syif Rawatan:</span>
              <strong className="text-amber-300 font-semibold">{patient.preferred_shift}</strong>
            </div>
          </div>

          {/* Clinical Authority Notice */}
          <div className="bg-indigo-950/40 border border-indigo-800/80 rounded-2xl p-4 text-xs text-indigo-200 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-indigo-300">
                Piawaian Farmasi Klinikal & Keselamatan Pesakit:
              </p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Hanya Pegawai Perubatan (Dr. Azman bin Khairuddin - Pakar Nefrologi) atau Pentadbir Klinikal dibenarkan mengemaskini, menambah, atau memadam ubat pesakit. <strong>Portal Pesakit hanya memaparkan ubat dalam mod baca sahaja (Read-Only)</strong> bagi mengelakkan kesilapan pengambilan dos.
              </p>
            </div>
          </div>

          {/* Presets / Quick Prescribe */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              ⚡ Templat Ubat Dialisis Lazim (Klik untuk Isi Pantas):
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Erythropoietin (Recormon / EPO)', dosage: '4,000 IU', frequency: '1x seminggu semasa dialisis', route: 'SUBCUTANEOUS' as const },
                { name: 'Venofer (Iron Sucrose)', dosage: '100 mg IV', frequency: '2 minggu sekali semasa dialisis', route: 'IV' as const },
                { name: 'Calcium Carbonate', dosage: '500 mg', frequency: '3x sehari bersama hidangan utama (Phosphate Binder)', route: 'ORAL' as const },
                { name: 'Amlodipine', dosage: '10 mg', frequency: '1x sehari setiap malam (Tekanan Darah)', route: 'ORAL' as const },
                { name: 'B-Complex & Folic Acid', dosage: '1 tablet', frequency: '1x sehari pagi (Vitamin Buah Pinggang)', route: 'ORAL' as const },
                { name: 'Renvela (Sevelamer Carbonate)', dosage: '800 mg', frequency: '3x sehari bersama hidangan', route: 'ORAL' as const },
                { name: 'Rocaltrol (Calcitriol)', dosage: '0.25 mcg', frequency: '1x sehari waktu malam', route: 'ORAL' as const }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs border border-slate-700 font-medium transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3 text-cyan-400" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Form Toggle */}
          {!showAddForm && !editingMed && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Preskripsi Ubat Baru</span>
            </button>
          )}

          {/* Form Tambah Ubat */}
          {showAddForm && (
            <form onSubmit={handleSubmitNew} className="bg-slate-950 border-2 border-amber-500/70 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Borang Preskripsi Ubat Baru</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Ubat *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Erythropoietin (Recormon)"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 4,000 IU atau 500 mg"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kekerapan & Arahan Pengambilan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1x seminggu semasa dialisis"
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Laluan Pengambilan (Route) *</label>
                  <select
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ORAL">ORAL (Makan)</option>
                    <option value="IV">IV (Intravenous semasa Dialisis)</option>
                    <option value="SUBCUTANEOUS">SUBCUTANEOUS (Suntikan Bawah Kulit)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Preskripsi</span>
                </button>
              </div>
            </form>
          )}

          {/* Form Edit Ubat */}
          {editingMed && (
            <form onSubmit={handleSaveEdit} className="bg-slate-950 border-2 border-indigo-500 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>Kemaskini Preskripsi Ubat</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Ubat *</label>
                  <input
                    type="text"
                    required
                    value={editingMed.medication_name}
                    onChange={(e) => setEditingMed({ ...editingMed, medication_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dos *</label>
                  <input
                    type="text"
                    required
                    value={editingMed.dosage}
                    onChange={(e) => setEditingMed({ ...editingMed, dosage: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kekerapan & Arahan Pengambilan *</label>
                  <input
                    type="text"
                    required
                    value={editingMed.frequency}
                    onChange={(e) => setEditingMed({ ...editingMed, frequency: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Laluan Pengambilan (Route) *</label>
                  <select
                    value={editingMed.route}
                    onChange={(e) => setEditingMed({ ...editingMed, route: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ORAL">ORAL (Makan)</option>
                    <option value="IV">IV (Intravenous)</option>
                    <option value="SUBCUTANEOUS">SUBCUTANEOUS (Suntikan Bawah Kulit)</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="editActiveStatus"
                    checked={editingMed.is_active}
                    onChange={(e) => setEditingMed({ ...editingMed, is_active: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <label htmlFor="editActiveStatus" className="text-slate-300 font-medium cursor-pointer">
                    Preskripsi Ubat Ini Masih Aktif
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMed(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          )}

          {/* Existing Medications Table / List */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider">
              Senarai Preskripsi Ubat Semasa ({medications.length} Ubat):
            </h4>

            {medications.length === 0 ? (
              <div className="bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                Belum ada preskripsi ubat untuk pesakit ini. Gunakan butang di atas untuk menambah ubat baru.
              </div>
            ) : (
              <div className="space-y-2">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className={`bg-slate-950 border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                      med.is_active ? 'border-slate-800' : 'border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-black text-white text-base">{med.medication_name}</h5>
                        <span className="text-[10px] font-mono bg-slate-800 text-amber-300 font-semibold px-2 py-0.5 rounded border border-slate-700">
                          {med.route}
                        </span>
                        {med.is_active ? (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-bold px-2 py-0.5 rounded-full">
                            Diberhentikan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-400 font-semibold">Dos: {med.dosage}</p>
                      <p className="text-xs text-slate-400">Cara makan / jadual: {med.frequency}</p>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => onUpdate({ ...med, is_active: !med.is_active })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                          med.is_active
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                        }`}
                        title={med.is_active ? 'Nyahaktifkan Ubat' : 'Aktifkan Ubat'}
                      >
                        {med.is_active ? 'Nyahaktif' : 'Aktifkan'}
                      </button>

                      <button
                        onClick={() => setEditingMed(med)}
                        className="p-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
                        title="Edit Maklumat Dos"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Adakah anda pasti ingin memadam ubat ${med.medication_name}?`)) {
                            onDelete(med.id);
                          }
                        }}
                        className="p-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer"
                        title="Padam Ubat Dari Rekod"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3.5 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400">
            Perubahan diselaraskan serta-merta ke Portal Pesakit (Read-Only).
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
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
    patient_id_code: initialData?.patient_id_code || '',
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
    comorbidities: initialData?.comorbidities || ['Hipertensi', 'Diabetes Type 2'],
    hepatitis_status: initialData?.hepatitis_status || { hbs_ag: 'NEGATIF', anti_hcv: 'NEGATIF', hiv: 'NEGATIF' }
  });

  const [icParsed, setIcParsed] = useState<ReturnType<typeof parseMalaysianIC> | null>(() => {
    return initialData?.ic_number ? parseMalaysianIC(initialData.ic_number) : null;
  });

  const handleIcInputChange = (icVal: string) => {
    const parsed = parseMalaysianIC(icVal);
    setIcParsed(parsed);
    if (parsed.isValid) {
      setFormData(prev => ({
        ...prev,
        ic_number: parsed.formattedIC,
        age: parsed.years,
        gender: parsed.gender || prev.gender
      }));
    } else {
      setFormData(prev => ({ ...prev, ic_number: icVal }));
    }
  };

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
                  placeholder="Contoh: 800615-10-5123"
                  value={formData.ic_number}
                  onChange={(e) => handleIcInputChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                {icParsed && icParsed.isValid && (
                  <div className="mt-1.5 bg-emerald-950/80 border border-emerald-800/80 rounded-xl p-2 text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Umur:</span>
                      <strong className="text-emerald-300 font-bold">{icParsed.ageDisplay}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Tarikh Lahir & Jantina:</span>
                      <span className="text-slate-200">{icParsed.birthDateFormatted} ({icParsed.genderDisplay})</span>
                    </div>
                  </div>
                )}
                {icParsed && !icParsed.isValid && icParsed.errorMessage && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold bg-rose-950/70 p-2 rounded-xl border border-rose-800/80 leading-tight">
                    ⚠️ {icParsed.errorMessage}
                  </p>
                )}
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
                  <input
                    type="text"
                    readOnly
                    value={formData.gender || (icParsed?.gender || 'LELAKI')}
                    placeholder="Jantina"
                    className="w-1/2 bg-slate-900 border border-emerald-500/60 rounded-xl px-2 py-2 text-emerald-300 font-bold text-xs cursor-not-allowed"
                  />
                  <input
                    type="text"
                    readOnly
                    value={icParsed?.isValid ? icParsed.ageDisplay : getAgeDisplayFromIC(formData.ic_number, formData.age)}
                    placeholder="Umur"
                    className="w-1/2 bg-slate-900 border border-emerald-500/60 rounded-xl px-2 py-2 text-emerald-300 font-bold text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-emerald-400 flex items-center justify-between">
                  <span>Jenis / Kumpulan Darah <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">Sistem ABO & Rh</span>
                </label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="w-full bg-slate-950 border border-emerald-500/60 focus:border-emerald-400 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="O+">O+ (O Positif)</option>
                  <option value="A+">A+ (A Positif)</option>
                  <option value="B+">B+ (B Positif)</option>
                  <option value="AB+">AB+ (AB Positif)</option>
                  <option value="O-">O- (O Negatif)</option>
                  <option value="A-">A- (A Negatif)</option>
                  <option value="B-">B- (B Negatif)</option>
                  <option value="AB-">AB- (AB Negatif)</option>
                </select>
              </div>

              <div className="md:col-span-2">
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
          </div>

          {/* 1.5. Maklumat Waris / Penjaga (Kecemasan) */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="font-bold text-indigo-300 text-sm border-b border-slate-800 pb-1 flex items-center justify-between">
              <span>👤 Maklumat Waris / Penjaga Kecemasan</span>
              <span className="text-[10px] text-indigo-400 font-normal">Diperlukan Untuk Hubungi Kecemasan</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1">Nama Penuh Waris / Penjaga</label>
                <input
                  type="text"
                  placeholder="Contoh: Siti binti Ahmad"
                  value={formData.next_of_kin_name}
                  onChange={(e) => setFormData({ ...formData, next_of_kin_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Hubungan Dengan Pesakit</label>
                <select
                  value={formData.next_of_kin_relation}
                  onChange={(e) => setFormData({ ...formData, next_of_kin_relation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Pasangan">Suami / Isteri (Pasangan)</option>
                  <option value="Anak">Anak</option>
                  <option value="Ibu / Bapa">Ibu / Bapa</option>
                  <option value="Adik-Beradik">Adik-Beradik</option>
                  <option value="Penjaga Sah">Penjaga Sah</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">No. Telefon Waris</label>
                <input
                  type="tel"
                  placeholder="Contoh: 013-8899123"
                  value={formData.next_of_kin_phone}
                  onChange={(e) => setFormData({ ...formData, next_of_kin_phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
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
                <label className="block font-semibold mb-1">Pilihan Syif Rawatan Pesakit *</label>
                <select
                  value={formData.preferred_shift}
                  onChange={(e) => setFormData({ ...formData, preferred_shift: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                >
                  <option value="SYIF_1">1. Syif 1: 6:00 AM - 10:00 AM (Pagi Awal)</option>
                  <option value="SYIF_2">2. Syif 2: 10:30 AM - 2:30 PM (Tengah Hari)</option>
                  <option value="SYIF_3">3. Syif 3: 3:00 PM - 7:00 PM (Petang)</option>
                </select>
              </div>
            </div>

            {/* FCFS Clarification Notice */}
            <div className="bg-indigo-950/50 border border-indigo-800/60 rounded-2xl p-3.5 space-y-1 text-[11px] text-indigo-300">
              <span className="font-bold flex items-center text-white text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Penugasan Stesen Fleksibel (First-Come, First-Served)
              </span>
              <p className="text-slate-300">
                Pusat dialisis tidak mengikat pesakit pada mana-mana stesen kerusi atau mesin tetap. Pilihan kerusi (B-01 hingga B-12) dan mesin Fresenius ditentukan secara manual oleh jururawat bertugas sewaktu pesakit tiba mengikut susunan giliran ketibaan dan status nyahkuman stesen.
              </p>
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Modul Pentadbir Sistem</span>
            <h3 className="text-lg font-black text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Nama Penuh Staf / Pentadbir *</label>
            <input
              type="text"
              required
              placeholder="Cth: Dr. Azman bin Khairuddin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-300">Emel Log Masuk Sistem *</label>
            <input
              type="email"
              required
              placeholder="nama@kaizenbrosdialysis.com.my"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-300">Peranan (Hak Akses RBAC) *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-purple-500"
              >
                <option value="ADMIN">ADMIN (Pentadbir Utama)</option>
                <option value="NEPHROLOGIST">NEPHROLOGIST (Pakar Perubatan)</option>
                <option value="HEAD_NURSE">HEAD_NURSE (Ketua Jururawat / Sister)</option>
                <option value="STAFF_NURSE">STAFF_NURSE (Jururawat Klinikal)</option>
                <option value="PATIENT">PATIENT (Portal Pesakit)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-300">Status Akaun *</label>
              <select
                value={formData.is_active ? 'AKTIF' : 'NYAHAKTIF'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'AKTIF' })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-purple-500"
              >
                <option value="AKTIF">🟢 Aktif (Boleh Akses)</option>
                <option value="NYAHAKTIF">🔴 Digantung / Nyahaktif</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-300">No. Telefon *</label>
              <input
                type="tel"
                required
                placeholder="019-3389922"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-300">No. Kad Pengenalan (MyKad) *</label>
              <input
                type="text"
                required
                placeholder="740518-10-5891"
                value={formData.ic_number}
                onChange={(e) => setFormData({ ...formData, ic_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="bg-purple-950/40 border border-purple-900/60 rounded-xl p-3 text-[11px] text-purple-300 space-y-1">
            <p className="font-bold flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-400" />
              Info Keselamatan & Hak Akses
            </p>
            <p className="text-slate-300">
              Perubahan peranan akan mengemas kini skop kebenaran modul sistem serta-merta mengikut garis panduan KKM.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-black rounded-xl transition-all shadow-lg cursor-pointer"
            >
              {initialData ? 'Kemaskini Maklumat' : 'Tambah Pengguna'}
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
    user_id: initialData?.user_id || 105,
    staff_id_code: initialData?.staff_id_code || '',
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
                <option value="PAGI">Syif 1: Pagi (5:30 AM - 3:00 PM)</option>
                <option value="PETANG">Syif 2: Petang (12:00 PM - 8:00 PM)</option>
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
  onDelete?: (id: string) => void;
  onDeleteDoc?: (id: string) => void;
}

function EditRegistrationModal({ registration, onClose, onSave, onDelete, onDeleteDoc }: EditRegistrationModalProps) {
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
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs text-slate-300">
          {/* MAKLUMAT BORANG PENDAFTARAN PESAKIT & NOK */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-cyan-400 uppercase tracking-wide">
                📋 Maklumat Pendaftaran Pesakit
              </h4>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                Kategori: {formData.patient_category}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-relaxed">
              <div className="space-y-1">
                <p><span className="text-slate-400 font-semibold">Nama Penuh:</span> <strong className="text-white font-bold">{formData.full_name}</strong></p>
                <p><span className="text-slate-400 font-semibold">No. IC:</span> <strong className="text-slate-200 font-mono">{formData.ic_number}</strong></p>
                <p><span className="text-slate-400 font-semibold">No. Tel:</span> <strong className="text-slate-200 font-mono">{formData.phone_number}</strong></p>
                <p><span className="text-slate-400 font-semibold">E-mel:</span> <span className="text-slate-300">{formData.email || '-'}</span></p>
                <p><span className="text-slate-400 font-semibold">Umur / Jantina:</span> <span className="text-emerald-300 font-bold">{getAgeDisplayFromIC(formData.ic_number, formData.age)}</span> / <span className="text-slate-200">{formData.gender}</span></p>
                <p><span className="text-slate-400 font-semibold">Alamat:</span> <span className="text-slate-300">{formData.address}</span></p>
              </div>

              <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-3.5 space-y-2">
                <span className="text-xs font-black text-indigo-300 block uppercase tracking-wider">👤 Maklumat Waris / Penjaga:</span>
                {formData.nok_name ? (
                  <div className="space-y-1 text-[11px]">
                    <p><span className="text-slate-400 font-semibold">Nama Waris:</span> <strong className="text-white font-bold">{formData.nok_name}</strong></p>
                    <p><span className="text-slate-400 font-semibold">Hubungan:</span> <strong className="text-indigo-200">{formData.nok_relationship}</strong></p>
                    <p><span className="text-slate-400 font-semibold">No. Tel Waris:</span> <strong className="text-emerald-400 font-mono">{formData.nok_phone}</strong></p>
                    <p><span className="text-slate-400 font-semibold">E-mel Waris:</span> <span className="text-slate-300">{formData.nok_email || '-'}</span></p>
                  </div>
                ) : (
                  <p className="text-amber-400 italic text-[11px]">Tiada maklumat waris khusus diisi. (Rujuk catatan kesihatan)</p>
                )}
              </div>
            </div>

            {formData.medical_notes && (
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Catatan Kesihatan / Sejarah Ringkas Pesakit:</span>
                <p className="text-slate-200 mt-1 italic leading-relaxed">{formData.medical_notes}</p>
              </div>
            )}
          </div>

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
                  Pilihan Syif Rawatan Pesakit (3 Sesi)
                </label>
                <select
                  value={formData.preferred_shift || ''}
                  onChange={(e) => setFormData({ ...formData, preferred_shift: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-400"
                >
                  <option value="">-- Pilih Syif Pesakit --</option>
                  <option value="Syif 1: 6:00 AM - 10:00 AM (Sesi Pagi Awal)">Syif 1: 6:00 AM - 10:00 AM (Sesi Pagi Awal)</option>
                  <option value="Syif 2: 10:30 AM - 2:30 PM (Sesi Tengah Hari)">Syif 2: 10:30 AM - 2:30 PM (Sesi Tengah Hari)</option>
                  <option value="Syif 3: 3:00 PM - 7:00 PM (Sesi Petang)">Syif 3: 3:00 PM - 7:00 PM (Sesi Petang)</option>
                </select>
              </div>

              <div className="md:col-span-2 bg-indigo-950/40 border border-indigo-900/60 rounded-xl p-3 text-xs text-indigo-300">
                <span className="font-bold block text-white mb-0.5">Penugasan Stesen Kerusi (FCFS):</span>
                <span>Stesen kerusi dan mesin dialisis tidak ditetapkan secara kekal. Ia akan ditugaskan secara fleksibel oleh jururawat semasa pesakit tiba mengikut giliran dan kekosongan stesen.</span>
              </div>

              <div className="md:col-span-2">
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

          {/* 2. PENGURUSAN DOKUMEN LAMPIRAN (EDIT, TAMBAH, BUANG) */}
          <div className="bg-slate-950 border-2 border-emerald-500/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h4 className="font-extrabold text-sm text-emerald-300 uppercase tracking-wide">
                  2. Dokumen Rujukan & Laporan Perubatan
                </h4>
              </div>
              {formData.document ? (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                  Dokumen Dilampirkan
                </span>
              ) : (
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-bold">
                  Tiada Dokumen
                </span>
              )}
            </div>

            {formData.document ? (
              <div className="space-y-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-white text-sm truncate">{formData.document.name}</h5>
                      <p className="text-[11px] text-slate-400">
                        Jenis: <span className="text-slate-300 font-mono">{formData.document.type}</span> • Saiz: <span className="text-slate-300 font-mono">{formData.document.size}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {formData.document.data_url && (
                      <a
                        href={formData.document.data_url}
                        download={formData.document.name}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center space-x-1"
                        title="Muat Turun Fail"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Muat Turun</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, document: undefined }));
                        if (onDeleteDoc) {
                          onDeleteDoc(formData.id);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-md inline-flex items-center space-x-1.5 cursor-pointer"
                      title="Padam / Buang Dokumen ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Buang Dokumen</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-white mb-1">
                      Ubah / Kemaskini Nama Dokumen:
                    </label>
                    <input
                      type="text"
                      value={formData.document.name}
                      onChange={(e) => {
                        if (formData.document) {
                          setFormData({
                            ...formData,
                            document: { ...formData.document, name: e.target.value }
                          });
                        }
                      }}
                      placeholder="Nama fail dokumen..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white mb-1">
                      Ganti dengan Fail Baru (Pilih Fail):
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const sizeFormatted = file.size >= 1024 * 1024 
                          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
                          : `${(file.size / 1024).toFixed(1)} KB`;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          setFormData({
                            ...formData,
                            document: {
                              name: file.name,
                              type: file.type || 'application/pdf',
                              size: sizeFormatted,
                              data_url: evt.target?.result as string
                            }
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-950 file:text-emerald-300 hover:file:bg-emerald-900 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-5 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-200 font-bold">Tiada Dokumen Rujukan Dilampirkan</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Admin boleh memuat naik surat rujukan pakar, keputusan darah atau dokumen sokongan.
                  </p>
                </div>
                <div>
                  <label className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow-lg transition-all">
                    <Plus className="w-4 h-4" />
                    <span>+ Muat Naik / Tambah Dokumen</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const sizeFormatted = file.size >= 1024 * 1024 
                          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
                          : `${(file.size / 1024).toFixed(1)} KB`;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          setFormData({
                            ...formData,
                            document: {
                              name: file.name,
                              type: file.type || 'application/pdf',
                              size: sizeFormatted,
                              data_url: evt.target?.result as string
                            }
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(formData.id);
                }}
                className="px-4 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Padam Permohonan Ini</span>
              </button>
            ) : <div />}

            <div className="flex space-x-3">
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
  onEdit?: () => void;
  onDelete?: () => void;
}

function DocumentPreviewModal({ registration, onClose, onEdit, onDelete }: DocumentPreviewModalProps) {
  const doc = registration.document;
  if (!doc) return null;

  const isPdf = doc.type.includes('pdf');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-emerald-400 font-mono font-bold">Ref: {registration.id}</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                Pratonton Dokumen
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-0.5">Dokumen Lampiran: {registration.full_name}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center min-h-[300px] flex flex-col items-center justify-center space-y-4">
          {doc.data_url && !isPdf ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={doc.data_url} 
              alt={doc.name || 'Dokumen lampiran'} 
              className="max-h-[380px] max-w-full rounded-xl object-contain shadow-lg border border-slate-800"
            />
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-800 shadow-md">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-white text-base">{doc.name}</p>
                <p className="text-xs text-slate-400 mt-1">Jenis: {doc.type} • Saiz: {doc.size}</p>
                {doc.category && (
                  <span className="inline-block mt-1 text-[11px] bg-slate-900 text-cyan-300 border border-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                    {doc.category}
                  </span>
                )}
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2 bg-slate-800 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah / Ganti Dokumen</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Buang Dokumen</span>
              </button>
            )}
          </div>

          <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer">
            Tutup Pratonton
          </button>
        </div>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* COMPONENT: MANAGE DOCUMENT MODAL (EDIT, TAMBAH, BUANG DOKUMEN PENDAFTARAN) */}
{/* ========================================================================= */}
interface ManageDocumentModalProps {
  registration: NewRegistration;
  onClose: () => void;
  onSave: (doc: PatientRegistrationDoc | undefined) => void;
  onDelete?: () => void;
}

function ManageDocumentModal({ registration, onClose, onSave, onDelete }: ManageDocumentModalProps) {
  const existingDoc = registration.document;
  const isEditing = !!existingDoc;

  const [docName, setDocName] = useState(existingDoc?.name || '');
  const [docType, setDocType] = useState(existingDoc?.type || 'application/pdf');
  const [docSize, setDocSize] = useState(existingDoc?.size || '');
  const [docDataUrl, setDocDataUrl] = useState(existingDoc?.data_url || existingDoc?.dataUrl || '');
  const [docCategory, setDocCategory] = useState(existingDoc?.category || 'Surat Rujukan Pakar Nefrologi');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    const sizeFormatted = file.size >= 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${(file.size / 1024).toFixed(1)} KB`;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      setDocName(file.name);
      setDocType(file.type || 'application/pdf');
      setDocSize(sizeFormatted);
      setDocDataUrl(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      setErrorMsg('Sila masukkan nama dokumen atau pilih fail untuk dimuat naik.');
      return;
    }
    const finalDoc: PatientRegistrationDoc = {
      name: docName.trim(),
      type: docType || 'application/pdf',
      size: docSize || '250 KB',
      data_url: docDataUrl || undefined,
      category: docCategory,
      uploaded_at: new Date().toISOString().slice(0, 10)
    };
    onSave(finalDoc);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      onSave(undefined);
    }
  };

  const isPdf = docType.includes('pdf');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-5 p-6 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-emerald-400 font-mono font-bold">Ref: {registration.id}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                isEditing 
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800' 
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {isEditing ? 'Ubah / Ganti Dokumen' : 'Tambah Dokumen Baru'}
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              {isEditing ? 'Kemaskini Dokumen Lampiran' : 'Muat Naik Dokumen Lampiran'}
            </h3>
            <p className="text-xs text-slate-400">
              Pesakit: <strong className="text-white">{registration.full_name}</strong> • MyKad: <span className="font-mono text-slate-300">{registration.ic_number}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File Picker & Current File Info */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-white mb-1">
              Pilih Fail dari Peranti (PDF, JPG, PNG, DOCX):
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex-1 border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-900/60 rounded-xl p-4 text-center cursor-pointer transition-colors group">
                <Upload className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 mx-auto mb-1 transition-colors" />
                <span className="text-xs text-slate-300 font-semibold block">
                  Klik untuk pilih atau tukar fail dokumen
                </span>
                <span className="text-[10px] text-slate-500">
                  Format disokong: PDF, PNG, JPG, DOC (Maks: 10MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Current Active File Summary */}
            {docName && (
              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{docName}</p>
                    <p className="text-[10px] text-slate-400">
                      {docSize ? `Saiz: ${docSize} • ` : ''}Format: <span className="font-mono text-slate-300">{docType}</span>
                    </p>
                  </div>
                </div>

                {docDataUrl && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                    Sedia Dimuat Naik
                  </span>
                )}
              </div>
            )}

            {/* Thumbnail Preview for Images */}
            {docDataUrl && !isPdf && (
              <div className="mt-2 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={docDataUrl}
                  alt="Pratonton"
                  className="max-h-40 mx-auto rounded-xl object-contain border border-slate-800 shadow"
                />
              </div>
            )}
          </div>

          {/* Form Fields: Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Tajuk / Nama Dokumen: <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Contoh: Surat Rujukan Hospital Shah Alam"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Kategori Dokumen:
              </label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Surat Rujukan Pakar Nefrologi">Surat Rujukan Pakar Nefrologi</option>
                <option value="Laporan Keputusan Ujian Darah & Makmal">Laporan Keputusan Ujian Darah & Makmal</option>
                <option value="Surat Jaminan / Kelulusan Penaja (PERKESO/JPA/Zakat)">Surat Jaminan / Kelulusan Penaja (PERKESO/JPA/Zakat)</option>
                <option value="Salinan MyKad / Dokumen Pengenalan Diri">Salinan MyKad / Dokumen Pengenalan Diri</option>
                <option value="Laporan Klinikal / Sejarah Rawatan Dialisis">Laporan Klinikal / Sejarah Rawatan Dialisis</option>
                <option value="Lain-lain Dokumen Sokongan">Lain-lain Dokumen Sokongan</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Buang / Padam Dokumen Ini</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Simpan Dokumen' : 'Tambah & Simpan Dokumen'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* COMPONENT: MACHINE FORM MODAL (EDIT BREAKDOWN/OPERASI, NO MESIN, JENIS)  */}
{/* ========================================================================= */}
interface MachineFormModalProps {
  title: string;
  initialData?: DialysisMachine;
  onClose: () => void;
  onSave: (data: any) => void;
}

function MachineFormModal({ title, initialData, onClose, onSave }: MachineFormModalProps) {
  const [formData, setFormData] = useState({
    chair_number: initialData?.chair_number || 'B-01',
    chair_id: initialData?.chair_id || 1,
    serial_number: initialData?.serial_number || 'FMC-2024-8901',
    brand_model: initialData?.brand_model || 'Fresenius 5008S CorDiax (Online HDF)',
    status: initialData?.status || 'OPERATIONAL',
    online_hdf_capable: initialData?.online_hdf_capable ?? true,
    last_service_date: initialData?.last_service_date || '2026-08-15',
    next_service_date: initialData?.next_service_date || '2026-11-15',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4 p-6 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-cyan-400 font-bold uppercase tracking-wider block text-[10px]">PENGURUSAN MESIN & STESEN</span>
            <h3 className="text-lg font-black text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* No Stesen / Kerusi */}
            <div>
              <label className="block font-bold text-slate-200 mb-1">
                No. Stesen / Kerusi <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.chair_number}
                onChange={(e) => setFormData({ ...formData, chair_number: e.target.value })}
                placeholder="Contoh: B-01, B-02, B-12"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Status Mesin */}
            <div>
              <label className="block font-bold text-slate-200 mb-1">
                Status Operasi Mesin <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="OPERATIONAL">🟢 OPERASI (Sedia untuk Rawatan)</option>
                <option value="BREAKDOWN">🔴 BREAKDOWN / ROSAK (Tidak Boleh Guna)</option>
                <option value="MAINTENANCE">🟡 PENYELENGGARAAN (Dalam Servis Berkala)</option>
              </select>
            </div>

            {/* No Mesin / No Siri */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-200 mb-1">
                No. Mesin / No. Siri Mesin (Serial Number) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Contoh: FMC-2024-8901 atau SN-FMC-4008S-09"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-cyan-300 font-mono font-bold text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">No siri unik pengilang Fresenius untuk rekod audit aset & KKM.</span>
            </div>

            {/* Nama dan Model Mesin */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-200 mb-1">
                Nama dan Model / Jenis Mesin Dialisis <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.brand_model}
                onChange={(e) => setFormData({ ...formData, brand_model: e.target.value })}
                placeholder="Contoh: Fresenius 5008S CorDiax / Fresenius 4008S NG / Fresenius 6008"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Keupayaan Online HDF */}
            <div className="sm:col-span-2 flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="hdf_toggle"
                checked={formData.online_hdf_capable}
                onChange={(e) => setFormData({ ...formData, online_hdf_capable: e.target.checked })}
                className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
              />
              <label htmlFor="hdf_toggle" className="text-xs text-slate-200 font-medium cursor-pointer">
                Sokongan Rawatan <strong>Online HDF (Hemodiafiltration)</strong> Berkualiti Tinggi
              </label>
            </div>

            {/* Tarikh Servis Terakhir */}
            <div>
              <label className="block font-bold text-slate-200 mb-1">Tarikh Servis Terakhir</label>
              <input
                type="date"
                value={formData.last_service_date}
                onChange={(e) => setFormData({ ...formData, last_service_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Tarikh Servis Seterusnya */}
            <div>
              <label className="block font-bold text-slate-200 mb-1">Tarikh Servis Seterusnya</label>
              <input
                type="date"
                value={formData.next_service_date}
                onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Catatan Tambahan */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-200 mb-1">Catatan Stesen / Lokasi</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Contoh: Bilik Pengasingan Khas / Bersebelahan Kaunter Jururawat"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Stesen Mesin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* COMPONENT: CENTRE PROFILE EDIT MODAL (NAMA PUSAT, LESEN, TELEFON, DLL)   */}
{/* ========================================================================= */}
interface CentreProfileEditModalProps {
  initialProfile: CentreProfile;
  onClose: () => void;
  onSave: (updated: CentreProfile) => void;
}

function CentreProfileEditModal({ initialProfile, onClose, onSave }: CentreProfileEditModalProps) {
  const [formData, setFormData] = useState<CentreProfile>({ ...initialProfile });
  const [newPanelInput, setNewPanelInput] = useState('');

  const handleAddPanel = () => {
    if (newPanelInput.trim() && !formData.panels.includes(newPanelInput.trim())) {
      setFormData({ ...formData, panels: [...formData.panels, newPanelInput.trim()] });
      setNewPanelInput('');
    }
  };

  const handleRemovePanel = (index: number) => {
    setFormData({ ...formData, panels: formData.panels.filter((_, idx) => idx !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 shrink-0">
          <div>
            <span className="text-emerald-400 font-bold uppercase tracking-wider block text-[10px]">TETAPAN PENGURUSAN PUSAT</span>
            <h3 className="text-xl font-black text-white">Kemaskini Profil Berdaftar Pusat Dialisis</h3>
            <p className="text-slate-400 text-xs">Ubah pelbagai fungsi nama pusat, maklumat lesen KKM, perhubungan, kapasiti dan panel.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* 1. Nama & Jenama Pusat */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 border-b border-slate-800 pb-1">
              1. Maklumat Nama & Jenama Pusat
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Nama Rasmi Pusat Dialisis <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Pusat Dialisis KaizenBros"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Nama Jenama Dagangan (Brand) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Contoh: KaizenBros Dialysis Centre"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-200 mb-1">Slogan / Moto Pusat</label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  placeholder="Contoh: Kecemerlangan Rawatan Hemodialisis & Kasih Sayang Demi Kualiti Hidup Pesakit"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Pelesenan KKM & Tarikh */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 border-b border-slate-800 pb-1">
              2. Pelesenan KKM & Penubuhan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  No. Lesen / Perakuan KKM <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.kkm_license}
                  onChange={(e) => setFormData({ ...formData, kkm_license: e.target.value })}
                  placeholder="Contoh: KKM/BPP/2023/HD-8491"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Tarikh Ditubuhkan</label>
                <input
                  type="text"
                  value={formData.established_date}
                  onChange={(e) => setFormData({ ...formData, established_date: e.target.value })}
                  placeholder="Contoh: 15 Januari 2021"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Alamat Premis */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 border-b border-slate-800 pb-1">
              3. Lokasi & Alamat Premis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-200 mb-1">
                  Alamat Lengkap Bangunan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Contoh: 27 & 29G, Jalan 5/10, Seksyen 5 Bandar Rinching, 43500 Semenyih, Selangor"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Bandar</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Semenyih"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Poskod</label>
                <input
                  type="text"
                  value={formData.postcode || ''}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  placeholder="43500"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Negeri</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Selangor"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Talian Perhubungan & Kecemasan */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 border-b border-slate-800 pb-1">
              4. Perhubungan & Talian Kecemasan 24 Jam
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Telefon Utama Pusat <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone_main}
                  onChange={(e) => setFormData({ ...formData, phone_main: e.target.value })}
                  placeholder="03-87270791"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Talian Hotline Kecemasan 24 Jam <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.hotline_24h}
                  onChange={(e) => setFormData({ ...formData, hotline_24h: e.target.value })}
                  placeholder="019-338 9922"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-rose-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">No. WhatsApp Pesakit</label>
                <input
                  type="text"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="60193389922"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Emel Rasmi Pentadbiran</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@kaizenbrosdialysis.com.my"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 5. Pegawai Perubatan & Jururawat Bertanggungjawab */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 border-b border-slate-800 pb-1">
              5. Pegawai Perubatan & Kakitangan Utama
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Pakar Nefrologi (Medical Director)</label>
                <input
                  type="text"
                  value={formData.medical_director || ''}
                  onChange={(e) => setFormData({ ...formData, medical_director: e.target.value })}
                  placeholder="Dr. Azman bin Khairuddin"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Ketua Jururawat Klinikal (Sister in Charge)</label>
                <input
                  type="text"
                  value={formData.head_nurse || ''}
                  onChange={(e) => setFormData({ ...formData, head_nurse: e.target.value })}
                  placeholder="Sister Siti Fatimah binti Rahman"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 6. Kapasiti & Sistem Klinikal */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 border-b border-slate-800 pb-1">
              6. Kapasiti Stesen, Model Mesin & Sistem Rawatan Air
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Kapasiti Stesen Mesin (Unit)</label>
                <input
                  type="number"
                  value={formData.capacity_machines}
                  onChange={(e) => setFormData({ ...formData, capacity_machines: parseInt(e.target.value) || 12 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-200 mb-1">Model Utama Mesin Dialisis</label>
                <input
                  type="text"
                  value={formData.machine_model}
                  onChange={(e) => setFormData({ ...formData, machine_model: e.target.value })}
                  placeholder="Fresenius Medical Care 4008S NG & 5008S CorDiax"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-200 mb-1">Sistem Rawatan Air Double Pass RO</label>
                <input
                  type="text"
                  value={formData.water_system}
                  onChange={(e) => setFormData({ ...formData, water_system: e.target.value })}
                  placeholder="Sistem Rawatan Air Double Pass Reverse Osmosis (RO) Berstandard AAMI/ISO 23500"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 7. Senarai Panel Penaja */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 border-b border-slate-800 pb-1">
              7. Senarai Panel Penaja & Subsidi Rawatan Berdaftar
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPanelInput}
                  onChange={(e) => setNewPanelInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPanel(); } }}
                  placeholder="Tambah panel penaja baru (cth: PERKESO / SOCSO, JPA, Zakat...)"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddPanel}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  + Tambah Panel
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {formData.panels.map((panel, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-950 border border-indigo-700/80 text-indigo-300 px-3 py-1.5 rounded-xl flex items-center space-x-2 font-medium"
                  >
                    <span>✓ {panel}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePanel(idx)}
                      className="text-rose-400 hover:text-rose-300 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Semua Perubahan Profil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
