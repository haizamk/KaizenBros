'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { Header } from '@/components/layout/Header';
import { PublicWebsite } from '@/components/public/PublicWebsite';
import { NewPatientRegistration } from '@/components/public/NewPatientRegistration';
import { PatientPortal } from '@/components/patient/PatientPortal';
import { NursePortal } from '@/components/nurse/NursePortal';
import { AdminPortal } from '@/components/admin/AdminPortal';
import { DatabaseExplorer } from '@/components/database/DatabaseExplorer';
import { 
  INITIAL_PATIENTS, 
  INITIAL_TODAY_SESSIONS, 
  INITIAL_PATIENT_MEDICATIONS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_CHECK_INS,
  INITIAL_REGISTRATIONS,
  INITIAL_MEDICAL_RECORDS
} from '@/lib/mock-data';
import { AuditLog, PatientCheckIn, DialysisSession, Patient, NewRegistration, PatientMedication, SessionStatus, MedicalRecord } from '@/types';
import { syncPatientsWithMalaysiaSchedule } from '@/lib/malaysia-time';
import { useMalaysiaTime } from '@/hooks/useMalaysiaTime';
import { Home as HomeIcon, User, AlertTriangle, PhoneCall, MessageSquare, ShieldAlert } from 'lucide-react';
import { 
  PatientAccount, 
  StaffAccount, 
  getActivePatientSession, 
  getActiveStaffSession, 
  clearPatientSession, 
  clearStaffSession,
  getPatientAccounts,
  savePatientAccounts,
  INITIAL_PATIENT_ACCOUNTS,
  INITIAL_STAFF_ACCOUNTS
} from '@/lib/auth-service';
import { PatientLoginModal } from '@/components/auth/PatientLoginModal';
import { 
  syncCollection, 
  saveDocument, 
  removeDocument, 
  clearCollection 
} from '@/lib/firebase';

export default function Home() {
  const malaysiaTime = useMalaysiaTime();

  const [currentView, setCurrentView] = useState<'public' | 'patient' | 'nurse' | 'admin' | 'database' | 'registration'>('public');
  const [showGlobalHelpModal, setShowGlobalHelpModal] = useState(false);
  const [showPatientLoginModal, setShowPatientLoginModal] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Authentication State (Patients & Staff)
  const [authenticatedPatient, setAuthenticatedPatient] = useState<PatientAccount | null>(null);
  const [authenticatedStaff, setAuthenticatedStaff] = useState<StaffAccount | null>(INITIAL_STAFF_ACCOUNTS[0]);

  // Registrations state
  const [registrations, setRegistrations] = useState<NewRegistration[]>(INITIAL_REGISTRATIONS);

  // Patients state (syncs with Malaysia Real-Time schedule)
  const [patients, setPatients] = useState<Patient[]>(() => syncPatientsWithMalaysiaSchedule(INITIAL_PATIENTS));

  // Active Selected Patient ID in Patient Portal
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  // Shared Queue & Sessions State across all views
  const [checkInQueue, setCheckInQueue] = useState<PatientCheckIn[]>(INITIAL_CHECK_INS);
  const [sessions, setSessions] = useState<DialysisSession[]>(INITIAL_TODAY_SESSIONS);

  // Patient Medications State
  const [medications, setMedications] = useState<PatientMedication[]>(INITIAL_PATIENT_MEDICATIONS);

  // Medical Records State
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(INITIAL_MEDICAL_RECORDS);

  // Safely synchronize localStorage after mount without hydration mismatches
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Migration to clear mock/assumed records once
        const isReset = localStorage.getItem('kaizenbros_patients_reset_v3');
        if (isReset !== 'true') {
          localStorage.removeItem('kaizenbros_patients');
          localStorage.removeItem('kaizenbros_registrations');
          localStorage.removeItem('kaizenbros_queue');
          localStorage.removeItem('kaizenbros_sessions');
          localStorage.removeItem('kaizenbros_patient_medications');
          localStorage.removeItem('kaizenbros_medical_records');
          localStorage.removeItem('kaizenbros_medical_records_clean');
          localStorage.setItem('kaizenbros_patients_reset_v3', 'true');
        }

        // Migration v5: Reset patient information box and queue to clean state (user request)
        const isResetBoxV5 = localStorage.getItem('kaizenbros_patient_box_reset_v5');
        if (isResetBoxV5 !== 'true') {
          localStorage.removeItem('kaizenbros_queue');
          localStorage.removeItem('kaizenbros_sessions');
          setCheckInQueue([]);
          setSessions([]);
          localStorage.setItem('kaizenbros_patient_box_reset_v5', 'true');
        }

        // Migration v6: Purge old mock/duplicate blood test records (6.2 / 10.5 / 640) from local storage
        const isResetBloodV6 = localStorage.getItem('kaizenbros_blood_purge_v6');
        if (isResetBloodV6 !== 'true') {
          localStorage.removeItem('kaizenbros_medical_records');
          localStorage.removeItem('kaizenbros_medical_records_clean');
          setMedicalRecords([]);
          localStorage.setItem('kaizenbros_blood_purge_v6', 'true');
        }

        // Migration v7: Reset dialysis sessions to clear clean state as requested by user
        const isResetDialysisV7 = localStorage.getItem('kaizenbros_dialysis_records_reset_v7');
        if (isResetDialysisV7 !== 'true') {
          localStorage.removeItem('kaizenbros_sessions');
          setSessions([]);
          localStorage.setItem('kaizenbros_dialysis_records_reset_v7', 'true');
        }

        const storedPatients = localStorage.getItem('kaizenbros_patients');
        if (storedPatients) {
          const parsed = JSON.parse(storedPatients);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPatients(syncPatientsWithMalaysiaSchedule(parsed));
          }
        }
        const storedRegs = localStorage.getItem('kaizenbros_registrations');
        if (storedRegs !== null) {
          setRegistrations(JSON.parse(storedRegs));
        }
        const storedQ = localStorage.getItem('kaizenbros_queue');
        if (storedQ) {
          setCheckInQueue(JSON.parse(storedQ));
        }
        const storedSess = localStorage.getItem('kaizenbros_sessions');
        if (storedSess) {
          setSessions(JSON.parse(storedSess));
        }
        const storedMeds = localStorage.getItem('kaizenbros_patient_medications');
        if (storedMeds) {
          setMedications(JSON.parse(storedMeds));
        }
        const storedMedRecords = localStorage.getItem('kaizenbros_medical_records_clean');
        if (storedMedRecords) {
          setMedicalRecords(JSON.parse(storedMedRecords));
        }
        // Safely restore patient session after mount without SSR hydration mismatch
        const isPatientLoggedOut = localStorage.getItem('kaizenbros_patient_logged_out');
        if (isPatientLoggedOut === 'true') {
          setAuthenticatedPatient(null);
          setSelectedPatientId(null);
        } else {
          const patientSession = getActivePatientSession();
          if (patientSession) {
            setAuthenticatedPatient(patientSession);
            setSelectedPatientId(patientSession.id);
          }
        }

        // Safely restore staff session after mount without SSR hydration mismatch
        const isStaffLoggedOut = localStorage.getItem('kaizenbros_staff_logged_out');
        if (isStaffLoggedOut === 'true') {
          setAuthenticatedStaff(null);
        } else {
          const staffSession = getActiveStaffSession();
          if (staffSession) {
            setAuthenticatedStaff(staffSession);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Set dark medical theme permanently
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.style.backgroundColor = '#0B132B';
    }
  }, []);

  // Live Sync with Firebase Firestore
  useEffect(() => {
    // 1. Sync Patients
    const unsubPatients = syncCollection('patients', (data) => {
      if (data && data.length > 0) {
        const sorted = data.sort((a, b) => Number(a.id) - Number(b.id));
        setPatients(sorted);
        try {
          localStorage.setItem('kaizenbros_patients', JSON.stringify(sorted));
        } catch {}
      }
    });

    // 2. Sync Dialysis Sessions
    const unsubSessions = syncCollection('dialysis_sessions', (data) => {
      if (data) {
        const sorted = data.sort((a, b) => Number(b.id) - Number(a.id));
        setSessions(sorted);
        try {
          localStorage.setItem('kaizenbros_sessions', JSON.stringify(sorted));
        } catch {}

        // Keep checkInQueue synchronized with clinical session statuses
        setCheckInQueue(prev => {
          const next = prev.map(q => {
            const matched = sorted.find(s => s.patient_id === q.patient_id);
            if (matched) {
              return {
                ...q,
                status: matched.status,
                assigned_chair: matched.chair_number || q.assigned_chair,
                assigned_machine_model: matched.machine_model || q.assigned_machine_model
              };
            }
            return q;
          });
          try {
            localStorage.setItem('kaizenbros_queue', JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    });

    // 3. Sync Medical/Blood Records
    const unsubRecords = syncCollection('medical_records', (data) => {
      if (data) {
        const mapped = data.map(r => ({
          ...r,
          id: r.id || r.id_str
        }));
        setMedicalRecords(mapped);
        try {
          localStorage.setItem('kaizenbros_medical_records_clean', JSON.stringify(mapped));
        } catch {}
      }
    });

    return () => {
      unsubPatients();
      unsubSessions();
      unsubRecords();
    };
  }, []);

  // Automatically derive patients with real-time next dialysis schedules (including >7pm rollover)
  const syncedPatients = useMemo(() => {
    return syncPatientsWithMalaysiaSchedule(patients, malaysiaTime.effectiveDate);
  }, [patients, malaysiaTime.effectiveDate]);

  const activePatient = useMemo(() => {
    if (!authenticatedPatient) return null;
    
    // First priority: match by authenticatedPatient account
    const cleanAuthCode = (authenticatedPatient.patientIdCode || '').trim().toLowerCase();
    const cleanAuthEmail = (authenticatedPatient.email || '').trim().toLowerCase();
    const cleanAuthIc = (authenticatedPatient.icNumber || '').replace(/\D/g, '');

    const matched = syncedPatients.find(p => {
      const matchId = p.id === authenticatedPatient.id;
      const matchCode = (p.patient_id_code || '').trim().toLowerCase() === cleanAuthCode;
      const matchEmail = p.email && p.email.trim().toLowerCase() === cleanAuthEmail;
      const matchIc = cleanAuthIc && p.ic_number && p.ic_number.replace(/\D/g, '') === cleanAuthIc;
      return matchId || matchCode || matchEmail || matchIc;
    });
    if (matched) return matched;

    return syncedPatients.find(p => p.id === authenticatedPatient.id) || null;
  }, [authenticatedPatient, syncedPatients]);

  const handleAddMedication = (newMed: Omit<PatientMedication, 'id'>) => {
    setMedications(prev => {
      const newId = prev.length > 0 ? Math.max(...prev.map(m => m.id)) + 1 : 1;
      const next = [{ ...newMed, id: newId }, ...prev];
      try {
        localStorage.setItem('kaizenbros_patient_medications', JSON.stringify(next));
      } catch {}
      return next;
    });
    handleAuditLog(
      'TAMBAH_PRESKRIPSI_UBAT',
      `Doktor/Pentadbir menambah ubat ${newMed.medication_name} (${newMed.dosage}) untuk Pesakit ID #${newMed.patient_id}.`
    );
  };

  const handleUpdateMedication = (updatedMed: PatientMedication) => {
    setMedications(prev => {
      const next = prev.map(m => m.id === updatedMed.id ? updatedMed : m);
      try {
        localStorage.setItem('kaizenbros_patient_medications', JSON.stringify(next));
      } catch {}
      return next;
    });
    handleAuditLog(
      'KEMASKINI_PRESKRIPSI_UBAT',
      `Doktor/Pentadbir mengemaskini dos ubat ${updatedMed.medication_name} (${updatedMed.dosage}, ${updatedMed.frequency}).`
    );
  };

  const handleDeleteMedication = (medId: number) => {
    const med = medications.find(m => m.id === medId);
    setMedications(prev => {
      const next = prev.filter(m => m.id !== medId);
      try {
        localStorage.setItem('kaizenbros_patient_medications', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (med) {
      handleAuditLog(
        'PADAM_PRESKRIPSI_UBAT',
        `Doktor/Pentadbir menghentikan/memadam preskripsi ubat ${med.medication_name} (${med.dosage}).`
      );
    }
  };

  const demoPatient = activePatient;
  const demoPatientCheckIn = useMemo(() => {
    if (!demoPatient) return undefined;
    return checkInQueue.find(q => q.patient_id === demoPatient.id);
  }, [demoPatient, checkInQueue]);

  const demoSession = useMemo(() => {
    if (!demoPatient) return null;
    const ptSessions = sessions.filter(s => s.patient_id === demoPatient.id);
    if (ptSessions.length === 0) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySess = ptSessions.find(s => s.scheduled_date === todayStr);
    return todaySess || ptSessions[0];
  }, [demoPatient, sessions]);
  const demoNurseName = 'Sister Siti Fatimah';

  const handleAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: Date.now(),
      user_name: demoNurseName,
      user_role: 'HEAD_NURSE',
      action,
      entity_type: 'dialysis_sessions',
      entity_id: 1,
      details,
      ip_address: '192.168.1.10',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Patient CRUD Handlers
  const handleAddPatient = (newPt: Patient) => {
    saveDocument('patients', String(newPt.id), newPt).catch(console.error);
    setPatients(prev => {
      const next = [newPt, ...prev.filter(p => p.id !== newPt.id)];
      try {
        localStorage.setItem('kaizenbros_patients', JSON.stringify(next));
      } catch {}
      return next;
    });
    setSelectedPatientId(newPt.id);

    // Auto-create PatientAccount in auth-service for seamless login
    const accounts = getPatientAccounts();
    const newAcc: PatientAccount = {
      id: newPt.id,
      patientIdCode: newPt.patient_id_code,
      name: newPt.name,
      email: newPt.email || `${(newPt.patient_id_code || 'pt').toLowerCase()}@kaizenbros.com.my`,
      phone: newPt.phone || '012-3456789',
      icNumber: newPt.ic_number || '700101-10-5000',
      passwordHash: 'kaizen123',
      isLocked: false,
      failedAttempts: 0
    };
    savePatientAccounts([newAcc, ...accounts.filter(a => a.id !== newPt.id)]);
    setAuthenticatedPatient(newAcc);

    try {
      localStorage.setItem('kaizenbros_active_patient_id', String(newPt.id));
      localStorage.setItem('kaizenbros_active_patient_session', JSON.stringify(newAcc));
      localStorage.removeItem('kaizenbros_patient_logged_out');
    } catch {}
  };

  const handleUpdatePatient = (updatedPt: Patient) => {
    saveDocument('patients', String(updatedPt.id), updatedPt).catch(console.error);
    setPatients(prev => {
      const next = prev.map(p => p.id === updatedPt.id ? updatedPt : p);
      try {
        localStorage.setItem('kaizenbros_patients', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDeletePatient = (patientId: number) => {
    removeDocument('patients', String(patientId)).catch(console.error);
    setPatients(prev => {
      const next = prev.filter(p => p.id !== patientId);
      try {
        localStorage.setItem('kaizenbros_patients', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (selectedPatientId === patientId) {
      setSelectedPatientId(null);
      try {
        localStorage.removeItem('kaizenbros_active_patient_id');
      } catch {}
    }
  };

  // Registration CRUD Handlers
  const handleDeleteRegistration = (regId: string) => {
    setRegistrations(prev => {
      const next = prev.filter(r => r.id !== regId);
      try {
        localStorage.setItem('kaizenbros_registrations', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleUpdateRegistration = (updatedReg: NewRegistration) => {
    setRegistrations(prev => {
      const next = prev.map(r => r.id === updatedReg.id ? updatedReg : r);
      try {
        localStorage.setItem('kaizenbros_registrations', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Patient Self Check-In from Patient Portal Kiosk
  const handlePatientSelfCheckIn = (preWeight: number, preBp?: string) => {
    if (!demoPatient) return;
    const nextQNum = `Q-${(checkInQueue.length + 1).toString().padStart(2, '0')}`;
    const currentTimeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
    const finalBp = preBp?.trim() || '-';

    const newCheckIn: PatientCheckIn = {
      id: `CHK-${Date.now()}`,
      patient_id: demoPatient.id,
      patient_id_code: demoPatient.patient_id_code,
      patient_name: demoPatient.name,
      queue_number: nextQNum,
      check_in_time: currentTimeStr,
      check_in_timestamp: Date.now(),
      shift: demoPatient.preferred_shift || 'SYIF_1',
      status: 'MENUNGGU_GILIRAN',
      pre_weight_kg: preWeight,
      dry_weight_kg: demoPatient.dry_weight_kg,
      pre_bp: finalBp,
      notes: 'Pesakit mendaftar masuk sendiri melalui Portal Pesakit (FCFS).'
    };

    const updatedQueue = [newCheckIn, ...checkInQueue.filter(q => q.patient_id !== demoPatient.id)];
    setCheckInQueue(updatedQueue);
    try {
      localStorage.setItem('kaizenbros_queue', JSON.stringify(updatedQueue));
    } catch {}

    // Update session status to waiting
    setSessions(prev => prev.map(s => {
      if (s.patient_id === demoPatient.id) {
        return {
          ...s,
          status: 'MENUNGGU_GILIRAN',
          pre_weight_kg: preWeight,
          pre_bp: finalBp,
          current_bp: finalBp
        };
      }
      return s;
    }));

    handleAuditLog(
      'SELF_CHECK_IN_PESAKIT',
      `Pesakit ${demoPatient.name} (${demoPatient.patient_id_code}) telah check-in ketibaan. No. Giliran FCFS: ${nextQNum}. Berat: ${preWeight}kg.`
    );
  };

  // Reset patient check-in status (to test/verify 'Belum Sampai di Kaunter' and clean patient box)
  const handlePatientResetCheckIn = () => {
    if (!demoPatient) return;
    const ptId = demoPatient.id;

    setCheckInQueue(prev => {
      const next = prev.filter(q => q.patient_id !== ptId);
      try {
        localStorage.setItem('kaizenbros_queue', JSON.stringify(next));
      } catch {}
      return next;
    });

    setSessions(prev => {
      const toDelete = prev.filter(s => s.patient_id === ptId);
      toDelete.forEach(s => {
        removeDocument('dialysis_sessions', String(s.id)).catch(console.error);
      });
      const next = prev.filter(s => s.patient_id !== ptId);
      try {
        localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });

    handleAuditLog(
      'RESET_KETIBAAN_PESAKIT',
      `Status pesakit ${demoPatient.name} diset semula sepenuhnya kepada 'Belum Sampai di Kaunter' dan dikosongkan dari sesi aktif.`
    );
  };

  // Nurse assigns chair station (e.g. B-02) upon arrival - DOES NOT start dialysis yet!
  const handlePatientAssignStationDemo = () => {
    if (!demoPatient) return;
    handleAssignStation(demoPatient.id, 'B-02', 'Fresenius 4008S NG', false);
    handleAuditLog(
      'TUGAS_STESEN_JURURAWAT',
      `Jururawat bertugas menugaskan Kerusi B-02 kepada pesakit ${demoPatient.name}. Status: Menunggu Mula.`
    );
  };

  // Nurse starts dialysis (status changes to SEDANG_DIALISIS)
  const handlePatientStartDialysisDemo = () => {
    if (!demoPatient) return;
    const ptId = demoPatient.id;
    const nowStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
    const nowMs = Date.now();

    // 1. Update queue status
    setCheckInQueue(prev => {
      const next = prev.map(q => {
        if (q.patient_id === ptId) {
          return {
            ...q,
            status: 'SEDANG_DIALISIS' as const
          };
        }
        return q;
      });
      try {
        localStorage.setItem('kaizenbros_queue', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Update session status
    setSessions(prev => {
      let found = false;
      const next = prev.map(s => {
        if (s.patient_id === ptId) {
          found = true;
          const isStartingDialysis = s.status !== 'SEDANG_DIALISIS';
          const updated = {
            ...s,
            status: 'SEDANG_DIALISIS' as SessionStatus,
            actual_start_time: isStartingDialysis ? nowStr : (s.actual_start_time || nowStr),
            start_timestamp: isStartingDialysis ? nowMs : (s.start_timestamp || nowMs),
            updated_at: new Date().toISOString()
          };
          saveDocument('dialysis_sessions', String(updated.id), updated).catch(console.error);
          return updated;
        }
        return s;
      });

      if (!found) {
        const newSess: DialysisSession = {
          id: Date.now(),
          patient_id: demoPatient.id,
          patient_id_code: demoPatient.patient_id_code,
          patient_name: demoPatient.name,
          chair_number: 'B-02',
          machine_model: 'Fresenius 4008S NG',
          scheduled_date: new Date().toISOString().slice(0, 10),
          scheduled_time: '08:00 AM',
          status: 'SEDANG_DIALISIS',
          actual_start_time: nowStr,
          start_timestamp: nowMs,
          dry_weight_kg: demoPatient.dry_weight_kg,
          pre_weight_kg: demoPatient.latest_weight_kg || demoPatient.dry_weight_kg + 1.8,
          pre_bp: demoPatient.latest_bp || '130/80',
          current_bp: demoPatient.latest_bp || '130/80',
          created_at: new Date().toISOString()
        };
        next.unshift(newSess);
        saveDocument('dialysis_sessions', String(newSess.id), newSess).catch(console.error);
      }

      try {
        localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });

    handleAuditLog(
      'MULA_DIALISIS_JURURAWAT',
      `Jururawat memulakan rawatan dialisis untuk pesakit ${demoPatient.name}. Status bertukar kepada 'SEDANG_DIALISIS'.`
    );
  };

  // Patient records Pre and/or Post Dialysis weights & blood pressure
  const handlePatientUpdateWeights = (
    preWeight?: number, 
    postWeight?: number, 
    preBp?: string, 
    postBp?: string
  ) => {
    if (!demoPatient) return;
    const ptId = demoPatient.id;

    // 1. Update or create DialysisSession
    setSessions(prev => {
      let found = false;
      const next = prev.map(s => {
        if (s.patient_id === ptId) {
          found = true;
          const newPre = (preWeight !== undefined && preWeight !== null) ? preWeight : s.pre_weight_kg;
          const newPost = (postWeight !== undefined && postWeight !== null) ? postWeight : s.post_weight_kg;
          const newActualUf = (newPre !== undefined && newPost !== undefined) ? Number((newPre - newPost).toFixed(2)) : s.actual_uf_litres;
          const newStatus: SessionStatus = newPost ? 'SUDAH_SELESAI' : s.status;
          return {
            ...s,
            pre_weight_kg: newPre,
            post_weight_kg: newPost,
            pre_bp: preBp || s.pre_bp,
            post_bp: postBp || s.post_bp,
            current_bp: postBp || preBp || s.current_bp,
            actual_uf_litres: newActualUf,
            status: newStatus,
            updated_at: new Date().toISOString()
          };
        }
        return s;
      });

      if (!found) {
        const newPre = preWeight !== undefined ? preWeight : demoPatient.dry_weight_kg + 1.8;
        const newPost = postWeight !== undefined ? postWeight : undefined;
        const newSession: DialysisSession = {
          id: Date.now(),
          patient_id: ptId,
          patient_id_code: demoPatient.patient_id_code,
          patient_name: demoPatient.name,
          chair_id: 1,
          chair_number: demoPatient.assigned_chair || 'C-01',
          scheduled_date: new Date().toISOString().slice(0, 10),
          scheduled_time: '08:00 AM',
          status: newPost ? 'SUDAH_SELESAI' : 'MENUNGGU_GILIRAN',
          dry_weight_kg: demoPatient.dry_weight_kg,
          pre_weight_kg: newPre,
          post_weight_kg: newPost,
          target_uf_litres: Number((newPre - demoPatient.dry_weight_kg).toFixed(2)),
          actual_uf_litres: newPost ? Number((newPre - newPost).toFixed(2)) : undefined,
          pre_bp: preBp || '130/80',
          post_bp: postBp,
          current_bp: postBp || preBp || '130/80',
          created_at: new Date().toISOString()
        };
        next.unshift(newSession);
      }

      try {
        localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Update patient profile latest_weight_kg and latest_bp
    setPatients(prev => {
      const next = prev.map(p => {
        if (p.id === ptId) {
          return {
            ...p,
            latest_weight_kg: postWeight ?? preWeight ?? p.latest_weight_kg,
            latest_bp: postBp || preBp || p.latest_bp
          };
        }
        return p;
      });
      try {
        localStorage.setItem('kaizenbros_patients', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3. Update queue if present
    setCheckInQueue(prev => {
      const next = prev.map(q => {
        if (q.patient_id === ptId) {
          return {
            ...q,
            pre_weight_kg: preWeight ?? q.pre_weight_kg,
            pre_bp: preBp || q.pre_bp
          };
        }
        return q;
      });
      try {
        localStorage.setItem('kaizenbros_queue', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 4. Audit Log
    handleAuditLog(
      'KEMASKINI_BERAT_PESAKIT',
      `Pesakit ${demoPatient.name} memasukkan data berat: Pra: ${preWeight !== undefined ? `${preWeight}kg` : '-'} (BP: ${preBp || '-'}), Selepas: ${postWeight !== undefined ? `${postWeight}kg` : '-'} (BP: ${postBp || '-'}).`
    );
  };

  // Quick Session Status Change Handler (with 4-hour start timestamp recording)
  const handleSessionStatusChange = (sessionId: number, newStatus: SessionStatus, reason?: string) => {
    setSessions(prev => {
      const nowStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
      const nowMs = Date.now();

      const next = prev.map(s => {
        if (s.id === sessionId) {
          const isStartingDialysis = newStatus === 'SEDANG_DIALISIS' && s.status !== 'SEDANG_DIALISIS';
          const isEndingDialysis = (newStatus === 'SUDAH_SELESAI' || newStatus === 'GAGAL_HABIS_DIALISIS' || newStatus === 'TAMAT_AWAL');

          return {
            ...s,
            status: newStatus,
            status_reason: reason || s.status_reason,
            actual_start_time: isStartingDialysis ? nowStr : s.actual_start_time,
            start_timestamp: isStartingDialysis ? nowMs : s.start_timestamp || (newStatus === 'SEDANG_DIALISIS' ? nowMs : undefined),
            actual_end_time: isEndingDialysis ? nowStr : s.actual_end_time,
            updated_at: new Date().toISOString()
          };
        }
        return s;
      });

      try {
        localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Keep checkInQueue synchronized
    const targetSession = sessions.find(s => s.id === sessionId);
    if (targetSession) {
      setCheckInQueue(prevQ => {
        const nextQ = prevQ.map(q => {
          if (q.patient_id === targetSession.patient_id) {
            return {
              ...q,
              status: newStatus
            };
          }
          return q;
        });
        try {
          localStorage.setItem('kaizenbros_queue', JSON.stringify(nextQ));
        } catch {}
        return nextQ;
      });

      handleAuditLog(
        'TUKAR_STATUS_SESI',
        `Status sesi pesakit ${targetSession.patient_name} (${targetSession.patient_id_code}) ditukar kepada ${newStatus}${reason ? ` (Sebab: ${reason})` : ''}.`
      );
    }
  };

  // Auto-Complete Logic: Automatically switch status to 'SUDAH_SELESAI' after 1 hour post 4-hour standard session (5 hours total)
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const nowMs = Date.now();
      const FIVE_HOURS_MS = 5 * 3600 * 1000; // 5 hours in ms (4h standard + 1h grace)
      const nowStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

      setSessions(prev => {
        let changed = false;
        const next = prev.map(s => {
          if (s.status === 'SEDANG_DIALISIS') {
            let startMs = s.start_timestamp;
            if (!startMs && s.actual_start_time) {
              const match = s.actual_start_time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
              if (match) {
                let hrs = parseInt(match[1], 10);
                const mins = parseInt(match[2], 10);
                const ampm = match[3];
                if (ampm && ampm.toUpperCase() === 'PM' && hrs < 12) hrs += 12;
                if (ampm && ampm.toUpperCase() === 'AM' && hrs === 12) hrs = 0;
                const d = new Date();
                d.setHours(hrs, mins, 0, 0);
                startMs = d.getTime();
              }
            }
            if (startMs && (nowMs - startMs) >= FIVE_HOURS_MS) {
              changed = true;
              return {
                ...s,
                status: 'SUDAH_SELESAI' as SessionStatus,
                auto_completed: true,
                status_reason: 'Auto-Discaj: melepasi 1 jam dari tempoh standard 4 jam',
                actual_end_time: nowStr,
                updated_at: new Date().toISOString()
              };
            }
          }
          return s;
        });

        if (changed) {
          try {
            localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
          } catch {}
          handleAuditLog(
            'AUTO_DISCAJ_SELESAI',
            `Sistem menukar automatik status sesi dialisis kepada 'SUDAH_SELESAI' kerana telah melepasi 1 jam dari waktu tamat standard 4 jam.`
          );
        }
        return next;
      });
    }, 10000); // Check every 10s

    return () => clearInterval(timerInterval);
  }, []);

  // Nurse assigns station to patient in queue (startNow defaults to false)
  const handleAssignStation = (patientId: number, chairNumber: string, machineModel: string, startNow: boolean = false) => {
    const newStatus: SessionStatus = startNow ? 'SEDANG_DIALISIS' : 'SUDAH_HADIR';
    const currentTimeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    const updatedQueue = checkInQueue.map(q => {
      if (q.patient_id === patientId) {
        return {
          ...q,
          status: newStatus,
          assigned_chair: chairNumber,
          assigned_machine_model: machineModel,
          called_at: currentTimeStr
        };
      }
      return q;
    });
    setCheckInQueue(updatedQueue);
    try {
      localStorage.setItem('kaizenbros_queue', JSON.stringify(updatedQueue));
    } catch {}

    setSessions(prev => {
      let found = false;
      const next = prev.map(s => {
        if (s.patient_id === patientId) {
          found = true;
          const updated = {
            ...s,
            chair_number: chairNumber,
            machine_model: machineModel,
            status: newStatus,
            actual_start_time: startNow ? currentTimeStr : s.actual_start_time,
            start_timestamp: startNow ? Date.now() : s.start_timestamp
          };
          saveDocument('dialysis_sessions', String(updated.id), updated).catch(console.error);
          return updated;
        }
        return s;
      });

      if (!found) {
        const pt = syncedPatients.find(p => p.id === patientId) || demoPatient;
        if (pt) {
          const newSession: DialysisSession = {
            id: Date.now(),
            patient_id: pt.id,
            patient_id_code: pt.patient_id_code,
            patient_name: pt.name,
            chair_id: parseInt(chairNumber.replace(/\D/g, ''), 10) || 1,
            chair_number: chairNumber,
            machine_model: machineModel,
            scheduled_date: new Date().toISOString().slice(0, 10),
            scheduled_time: '08:00 AM',
            status: newStatus,
            dry_weight_kg: pt.dry_weight_kg,
            pre_weight_kg: pt.latest_weight_kg || pt.dry_weight_kg + 1.8,
            pre_bp: pt.latest_bp || '130/80',
            current_bp: pt.latest_bp || '130/80',
            actual_start_time: startNow ? currentTimeStr : undefined,
            start_timestamp: startNow ? Date.now() : undefined,
            created_at: new Date().toISOString()
          };
          next.unshift(newSession);
          saveDocument('dialysis_sessions', String(newSession.id), newSession).catch(console.error);
        }
      }

      try {
        localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Nurse checks in a patient at the front desk
  const handleNurseCheckInPatient = (patientId: number, preWeight: number, preBp: string, notes?: string) => {
    const pt = syncedPatients.find(p => p.id === patientId) || demoPatient;
    if (!pt) return;
    const nextQNum = `Q-${(checkInQueue.length + 1).toString().padStart(2, '0')}`;
    const currentTimeStr = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newCheckIn: PatientCheckIn = {
      id: `CHK-${Date.now()}`,
      patient_id: pt.id,
      patient_id_code: pt.patient_id_code,
      patient_name: pt.name,
      queue_number: nextQNum,
      check_in_time: currentTimeStr,
      check_in_timestamp: Date.now(),
      shift: 'PETANG',
      status: 'MENUNGGU_GILIRAN',
      pre_weight_kg: preWeight,
      dry_weight_kg: pt.dry_weight_kg,
      pre_bp: preBp || '-',
      notes: notes || 'Check-in di kaunter jururawat (FCFS).'
    };

    const updatedQueue = [...checkInQueue.filter(q => q.patient_id !== patientId), newCheckIn];
    setCheckInQueue(updatedQueue);
    try {
      localStorage.setItem('kaizenbros_queue', JSON.stringify(updatedQueue));
    } catch {}
  };

  // Real-time calculation of patients needing attention or who have completed their dialysis
  const nurseAttentionCount = useMemo(() => {
    // 1. Sessions completed (needing post-dialysis review / discharge)
    const completedCount = sessions.filter(s => s.status === 'SUDAH_SELESAI' || s.status === 'SELESAI').length;
    // 2. Queue patients waiting for chair allocation
    const waitingQueueCount = checkInQueue.filter(q => q.status === 'MENUNGGU_GILIRAN' && !q.assigned_chair).length;
    // 3. Checked-in patients waiting at station to start dialysis
    const waitingStartCount = sessions.filter(s => s.status === 'SUDAH_HADIR' || (s.chair_number && s.status === 'MENUNGGU_GILIRAN')).length;
    // 4. Dialysis in final 30 minutes or over time
    const urgentActiveCount = sessions.filter(s => {
      if (s.status !== 'SEDANG_DIALISIS') return false;
      if (s.start_timestamp) {
        const elapsedMin = (Date.now() - s.start_timestamp) / 60000;
        const targetMin = s.target_duration_minutes || (s.duration_hours ? s.duration_hours * 60 : 240);
        if (elapsedMin >= targetMin - 30) return true;
      }
      return false;
    }).length;

    return completedCount + waitingQueueCount + waitingStartCount + urgentActiveCount;
  }, [sessions, checkInQueue]);

  return (
    <div suppressHydrationWarning className="min-h-screen flex flex-col bg-[#0B132B] text-slate-100 dark">
      <Header
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        activePatientName={activePatient ? activePatient.name : 'Tiada Pesakit Dipilih'}
        activeNurseName={authenticatedStaff ? authenticatedStaff.name : demoNurseName}
        authenticatedStaff={authenticatedStaff}
        nurseAttentionCount={nurseAttentionCount}
        onStaffLoginSuccess={(staff) => {
          setAuthenticatedStaff(staff);
          handleAuditLog('LOGIN_STAFF', `Kakitangan ${staff.name} log masuk.`);
        }}
        onStaffLogout={() => {
          clearStaffSession();
          setAuthenticatedStaff(null);
          setCurrentView('public');
          handleAuditLog('LOGOUT_STAFF', 'Kakitangan log keluar.');
        }}
        onAuditLog={handleAuditLog}
      />

      <div className="flex-1">
        {currentView === 'public' && (
          <PublicWebsite
            onLoginAsPatient={(patientAcc) => {
              if (patientAcc) {
                setAuthenticatedPatient(patientAcc);
                setSelectedPatientId(patientAcc.id);
                setCurrentView('patient');
              } else {
                setShowPatientLoginModal(true);
              }
            }}
            onLoginAsNurse={(staffAcc) => {
              if (staffAcc) {
                setAuthenticatedStaff(staffAcc);
              }
              setCurrentView('nurse');
            }}
            onLoginAsAdmin={(staffAcc) => {
              if (staffAcc) {
                setAuthenticatedStaff(staffAcc);
              }
              setCurrentView('admin');
            }}
            onOpenRegistration={() => setCurrentView('registration')}
            onAuditLog={handleAuditLog}
          />
        )}

        {currentView === 'registration' && (
          <NewPatientRegistration
            onBackToPublic={() => setCurrentView('public')}
            onSuccessRedirect={() => setCurrentView('admin')}
            onNewRegistrationSubmitted={(newReg) => {
              setRegistrations(prev => {
                const next = [newReg, ...prev];
                try {
                  localStorage.setItem('kaizenbros_registrations', JSON.stringify(next));
                } catch {}
                return next;
              });
              handleAuditLog('PENDAFTARAN_BARU', `Pendaftaran pesakit baru diterima: ${newReg.full_name} (${newReg.id})`);
            }}
          />
        )}

        {currentView === 'patient' && (
          <PatientPortal
            patient={activePatient}
            patients={syncedPatients}
            session={demoSession}
            sessions={sessions}
            medications={medications}
            medicalRecords={medicalRecords}
            auditLogs={auditLogs}
            checkInRecord={demoPatientCheckIn}
            isLoggedIn={!!authenticatedPatient}
            onUpdateWeights={handlePatientUpdateWeights}
            onCheckInArrival={handlePatientSelfCheckIn}
            onResetCheckIn={handlePatientResetCheckIn}
            onAssignStationDemo={handlePatientAssignStationDemo}
            onStartDialysisDemo={handlePatientStartDialysisDemo}
            onPatientLogout={() => {
              clearPatientSession();
              setAuthenticatedPatient(null);
              setSelectedPatientId(null);
              setShowPatientLoginModal(false);
              handleAuditLog('LOGOUT_PESAKIT', 'Pesakit berjaya log keluar 100% daripada portal.');
            }}
            onOpenLogin={() => setShowPatientLoginModal(true)}
            onSelectPatient={(selectedPt) => {
              setSelectedPatientId(selectedPt.id);
              const accounts = getPatientAccounts();
              let matchedAcc = accounts.find(a => a.id === selectedPt.id || ((a.patientIdCode || '').toLowerCase() === (selectedPt.patient_id_code || '').toLowerCase()));
              if (!matchedAcc) {
                matchedAcc = {
                  id: selectedPt.id,
                  patientIdCode: selectedPt.patient_id_code,
                  name: selectedPt.name,
                  email: selectedPt.email || `${(selectedPt.patient_id_code || 'pt').toLowerCase()}@kaizenbros.com.my`,
                  phone: selectedPt.phone || '012-3456789',
                  icNumber: selectedPt.ic_number || '700101-10-5000',
                  passwordHash: 'kaizen123',
                  isLocked: false,
                  failedAttempts: 0
                };
                savePatientAccounts([matchedAcc, ...accounts]);
              }
              setAuthenticatedPatient(matchedAcc);
              try {
                localStorage.setItem('kaizenbros_active_patient_id', String(selectedPt.id));
                localStorage.setItem('kaizenbros_active_patient_session', JSON.stringify(matchedAcc));
                localStorage.removeItem('kaizenbros_patient_logged_out');
              } catch {}
            }}
            onNavigateToAdmin={() => setCurrentView('admin')}
            onNavigateToRegistration={() => setCurrentView('registration')}
          />
        )}

        {currentView === 'nurse' && (
          <NursePortal
            currentNurseName={authenticatedStaff ? authenticatedStaff.name : demoNurseName}
            patients={syncedPatients}
            sessions={sessions}
            registrations={registrations}
            medicalRecords={medicalRecords}
            onUpdateMedicalRecords={(updatedRecords) => {
              // Find deleted records and delete from Firebase
              const deleted = medicalRecords.filter(oldRec => !updatedRecords.some(newRec => newRec.id === oldRec.id));
              deleted.forEach((rec) => {
                removeDocument('medical_records', String(rec.id)).catch(console.error);
              });

              setMedicalRecords(updatedRecords);
              try {
                localStorage.setItem('kaizenbros_medical_records_clean', JSON.stringify(updatedRecords));
              } catch {}

              // Upload new or updated records
              updatedRecords.forEach((record) => {
                saveDocument('medical_records', String(record.id), record).catch(console.error);
              });
            }}
            onUpdateSession={(updatedSession) => {
              setSessions(prev => {
                const next = prev.map(s => s.id === updatedSession.id ? updatedSession : s);
                try {
                  localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
                } catch {}
                return next;
              });
              saveDocument('dialysis_sessions', String(updatedSession.id), updatedSession).catch(console.error);

              // 100% synchronize checkInQueue status with session status
              setCheckInQueue(prevQ => {
                const nextQ = prevQ.map(q => {
                  if (q.patient_id === updatedSession.patient_id) {
                    return {
                      ...q,
                      status: updatedSession.status,
                      assigned_chair: updatedSession.chair_number || q.assigned_chair,
                      assigned_machine_model: updatedSession.machine_model || q.assigned_machine_model
                    };
                  }
                  return q;
                });
                try {
                  localStorage.setItem('kaizenbros_queue', JSON.stringify(nextQ));
                } catch {}
                return nextQ;
              });

              if (updatedSession.post_weight_kg || updatedSession.pre_weight_kg) {
                setPatients(prev => {
                  const next = prev.map(p => {
                    if (p.id === updatedSession.patient_id) {
                      const updatedPt = {
                        ...p,
                        latest_weight_kg: updatedSession.post_weight_kg ?? updatedSession.pre_weight_kg ?? p.latest_weight_kg,
                        latest_bp: updatedSession.post_bp || updatedSession.pre_bp || p.latest_bp
                      };
                      saveDocument('patients', String(p.id), updatedPt).catch(console.error);
                      return updatedPt;
                    }
                    return p;
                  });
                  try {
                    localStorage.setItem('kaizenbros_patients', JSON.stringify(next));
                  } catch {}
                  return next;
                });
              }
            }}
            onAuditLog={handleAuditLog}
            checkInQueue={checkInQueue}
            onCheckInPatient={handleNurseCheckInPatient}
            onAssignStation={handleAssignStation}
            onStaffLogout={() => {
              clearStaffSession();
              setAuthenticatedStaff(null);
              setCurrentView('public');
              handleAuditLog('LOGOUT_STAFF', 'Kakitangan log keluar daripada portal.');
            }}
            onClearQueue={() => {
              setCheckInQueue([]);
              setSessions([]);
              clearCollection('dialysis_sessions').catch(console.error);
              try {
                localStorage.setItem('kaizenbros_queue', JSON.stringify([]));
                localStorage.setItem('kaizenbros_sessions', JSON.stringify([]));
              } catch {}
            }}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            auditLogs={auditLogs}
            registrations={registrations}
            patients={syncedPatients}
            sessions={sessions}
            medications={medications}
            medicalRecords={medicalRecords}
            onUpdateMedicalRecords={(updatedRecords) => {
              const deleted = medicalRecords.filter(oldRec => !updatedRecords.some(newRec => newRec.id === oldRec.id));
              deleted.forEach((rec) => {
                removeDocument('medical_records', String(rec.id)).catch(console.error);
              });
              setMedicalRecords(updatedRecords);
              try {
                localStorage.setItem('kaizenbros_medical_records_clean', JSON.stringify(updatedRecords));
              } catch {}
              updatedRecords.forEach((record) => {
                saveDocument('medical_records', String(record.id), record).catch(console.error);
              });
            }}
            onAddMedication={handleAddMedication}
            onUpdateMedication={handleUpdateMedication}
            onDeleteMedication={handleDeleteMedication}
            onStaffLogout={() => {
              clearStaffSession();
              setAuthenticatedStaff(null);
              setCurrentView('public');
              handleAuditLog('LOGOUT_STAFF', 'Kakitangan log keluar daripada portal.');
            }}
            onUpdateSession={(updated) => {
              setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
              try {
                localStorage.setItem('kaizenbros_sessions', JSON.stringify(sessions.map(s => s.id === updated.id ? updated : s)));
              } catch {}
              saveDocument('dialysis_sessions', String(updated.id), updated).catch(console.error);
              // Synchronize checkInQueue status with session status
              setCheckInQueue(prevQ => {
                const nextQ = prevQ.map(q => {
                  if (q.patient_id === updated.patient_id) {
                    return {
                      ...q,
                      status: updated.status,
                      assigned_chair: updated.chair_number || q.assigned_chair,
                      assigned_machine_model: updated.machine_model || q.assigned_machine_model
                    };
                  }
                  return q;
                });
                try {
                  localStorage.setItem('kaizenbros_queue', JSON.stringify(nextQ));
                } catch {}
                return nextQ;
              });
            }}
            onAddSession={(newSess) => {
              const newId = sessions.length > 0 ? Math.max(...sessions.map(s => s.id)) + 1 : 1;
              const newSessionObj: DialysisSession = { ...newSess, id: newId };
              setSessions(prev => [newSessionObj, ...prev]);
              try {
                localStorage.setItem('kaizenbros_sessions', JSON.stringify([newSessionObj, ...sessions]));
              } catch {}
              saveDocument('dialysis_sessions', String(newId), newSessionObj).catch(console.error);
            }}
            onDeleteSession={(sessionId) => {
              setSessions(prev => prev.filter(s => s.id !== sessionId));
              try {
                localStorage.setItem('kaizenbros_sessions', JSON.stringify(sessions.filter(s => s.id !== sessionId)));
              } catch {}
              removeDocument('dialysis_sessions', String(sessionId)).catch(console.error);
            }}
            onAddPatient={handleAddPatient}
            onUpdatePatient={handleUpdatePatient}
            onDeletePatient={handleDeletePatient}
            onDeleteRegistration={handleDeleteRegistration}
            onUpdateRegistration={handleUpdateRegistration}
            onAuditLog={handleAuditLog}
            onResetPatients={() => {
              setPatients([]);
              setRegistrations([]);
              setCheckInQueue([]);
              setMedications([]);
              try {
                localStorage.setItem('kaizenbros_patients', JSON.stringify([]));
                localStorage.setItem('kaizenbros_registrations', JSON.stringify([]));
                localStorage.setItem('kaizenbros_queue', JSON.stringify([]));
                localStorage.setItem('kaizenbros_patient_medications', JSON.stringify([]));
              } catch {}
              clearCollection('patients').catch(console.error);
              handleAuditLog('RESET_PESAKIT', 'Pentadbir memadam dan menetap semula (reset) semua data pesakit, preskripsi ubat, pendaftaran, dan giliran di klinik secara total.');
            }}
            onResetDialysisData={() => {
              setSessions([]);
              try {
                localStorage.setItem('kaizenbros_sessions', JSON.stringify([]));
              } catch {}
              clearCollection('dialysis_sessions').catch(console.error);
              handleAuditLog('RESET_DIALISIS', 'Pentadbir memadam dan menetap semula (reset) semua sesi dialisis sedia ada di klinik secara total.');
            }}
            onResetBloodData={() => {
              setMedicalRecords([]);
              try {
                localStorage.setItem('kaizenbros_medical_records_clean', JSON.stringify([]));
              } catch {}
              clearCollection('medical_records').catch(console.error);
              handleAuditLog('RESET_DARAH', 'Pentadbir memadam dan menetap semula (reset) semua keputusan ujian darah berkala di klinik secara total.');
            }}
          />
        )}

        {currentView === 'database' && (
          <DatabaseExplorer />
        )}
      </div>

      {/* GLOBAL PERSISTENT ACCESSIBLE BOTTOM NAVIGATION (ELDERLY-FRIENDLY) */}
      {(currentView === 'public' || currentView === 'patient' || currentView === 'registration') && (
        <div className="h-[84px]">
          {/* Space buffer to prevent navigation overlapping contents */}
          <nav className="fixed bottom-0 left-0 right-0 bg-[#0B132B]/95 backdrop-blur-md border-t border-[#1F385C] z-40 px-4 py-3 shadow-2xl">
            <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
              {/* Menu 1: Utama */}
              <button
                onClick={() => setCurrentView('public')}
                className={`min-h-[58px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  currentView === 'public'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-extrabold shadow-lg shadow-teal-950/50 border-2 border-cyan-400'
                    : 'text-slate-300 hover:text-white hover:bg-[#132238] border border-transparent'
                }`}
              >
                <HomeIcon className="w-5 h-5 text-white" />
                <span className="text-xs mt-1 font-black tracking-wide">UTAMA</span>
              </button>

              {/* Menu 2: Portal Pesakit */}
              <button
                onClick={() => setCurrentView('patient')}
                className={`min-h-[58px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  currentView === 'patient'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 font-extrabold shadow-lg shadow-teal-950/50 border-2 border-cyan-400'
                    : 'text-slate-300 hover:text-white hover:bg-[#132238] border border-transparent'
                }`}
              >
                <User className="w-5 h-5 text-white" />
                <span 
                  className={`text-xs mt-1 font-black tracking-wide ${currentView === 'patient' ? '!text-black portal-pesakit-active-text' : ''}`}
                  style={currentView === 'patient' ? { color: '#000000', WebkitTextFillColor: '#000000' } : undefined}
                >
                  PORTAL PESAKIT
                </span>
              </button>

              {/* Menu 3: Bantuan */}
              <button
                onClick={() => setShowGlobalHelpModal(true)}
                className={`min-h-[58px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  showGlobalHelpModal
                    ? 'bg-rose-600 text-white font-extrabold shadow-lg shadow-rose-950/50 border-2 border-rose-400'
                    : 'text-rose-400 hover:text-rose-300 hover:bg-[#132238] border border-rose-900/60'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                <span className="text-xs mt-1 font-black tracking-wide">BANTUAN</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* GLOBAL EMERGENCY SOS HELP MODAL */}
      {showGlobalHelpModal && (
        <div className="fixed inset-0 bg-[#050B18]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E1A30] border-2 border-rose-500 rounded-3xl max-w-lg w-full p-6 sm:p-7 text-white space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1F385C] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-950 text-rose-400 border border-rose-700 flex items-center justify-center animate-pulse shadow-md">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-rose-400">Talian Bantuan & SOS</h3>
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Emergency Help Center</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGlobalHelpModal(false)}
                className="w-10 h-10 rounded-full bg-[#132238] hover:bg-[#1E3352] text-white font-bold flex items-center justify-center cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-rose-950/50 border-2 border-rose-700/90 rounded-2xl p-5 text-center space-y-2">
                <span className="text-xs uppercase text-rose-300 font-black tracking-widest block">Talian Kecemasan 24-Jam</span>
                <a 
                  href="tel:0193389922" 
                  className="text-2xl sm:text-3xl font-black text-white hover:text-rose-300 transition-colors flex items-center justify-center space-x-2 py-1"
                >
                  <PhoneCall className="w-7 h-7 text-rose-400 animate-bounce" />
                  <span>019-338 9922</span>
                </a>
                <p className="text-xs sm:text-sm text-rose-200 leading-normal font-medium">Tekan nombor di atas untuk membuat panggilan kecemasan terus ke kaunter utama.</p>
              </div>

              <div className="bg-[#0A1324] p-5 rounded-2xl border border-[#1F385C] space-y-3">
                <h4 className="font-bold text-white text-sm sm:text-base">💡 Panduan Tindakan Segera:</h4>
                <ul className="text-xs sm:text-sm text-slate-200 space-y-2.5">
                  <li className="flex items-start">
                    <span className="text-rose-400 mr-2 font-bold text-base">•</span>
                    <span><strong>Sesak Nafas / Sakit Dada:</strong> Hubungi 999 dengan segera dan maklumkan kepada jururawat di talian hotline.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-400 mr-2 font-bold text-base">•</span>
                    <span><strong>Kecemasan Logistik:</strong> Sila hubungi talian hotline jika kenderaan panel pengangkutan lewat menjemput anda.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-400 mr-2 font-bold text-base">•</span>
                    <span><strong>Kesan Sampingan:</strong> Jika anda mengalami pening melampau atau kekejangan otot selepas pulang, hubungi klinik.</span>
                  </li>
                </ul>
              </div>

              {/* Directly start a WhatsApp Chat to Staff */}
              <a
                href="https://wa.me/60193389922?text=Saya%20memerlukan%20bantuan%20kecemasan%20dialisis%20segera"
                target="_blank"
                rel="noreferrer"
                className="w-full min-h-[54px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50 border border-emerald-400 cursor-pointer text-center text-sm sm:text-base transition-colors"
              >
                <MessageSquare className="w-5 h-5 fill-white/10" />
                <span>Hubungi Kaunter via WhatsApp</span>
              </a>
            </div>

            <button
              onClick={() => setShowGlobalHelpModal(false)}
              className="w-full min-h-[52px] bg-slate-200 hover:bg-white text-slate-950 font-black rounded-2xl cursor-pointer transition-colors text-base shadow-md"
            >
              Tutup & Faham
            </button>
          </div>
        </div>
      )}

      {/* PATIENT LOGIN MODAL */}
      <PatientLoginModal
        isOpen={showPatientLoginModal}
        onClose={() => setShowPatientLoginModal(false)}
        onLoginSuccess={(patientAcc) => {
          setAuthenticatedPatient(patientAcc);
          setSelectedPatientId(patientAcc.id);
          setCurrentView('patient');
          handleAuditLog('LOGIN_PESAKIT_BERJAYA', `Pesakit ${patientAcc.name} (${patientAcc.patientIdCode}) berjaya log masuk.`);
        }}
      />
    </div>
  );
}
