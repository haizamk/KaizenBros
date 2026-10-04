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
  INITIAL_REGISTRATIONS
} from '@/lib/mock-data';
import { AuditLog, PatientCheckIn, DialysisSession, Patient, NewRegistration, PatientMedication, SessionStatus } from '@/types';
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

export default function Home() {
  const malaysiaTime = useMalaysiaTime();

  const [currentView, setCurrentView] = useState<'public' | 'patient' | 'nurse' | 'admin' | 'database' | 'registration'>('patient');
  const [showGlobalHelpModal, setShowGlobalHelpModal] = useState(false);
  const [showPatientLoginModal, setShowPatientLoginModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('kaizenbros_theme', next); } catch {}
      return next;
    });
  };

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

  // Safely synchronize localStorage after mount without hydration mismatches
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedTheme = localStorage.getItem('kaizenbros_theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setTheme(storedTheme);
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

  // Synchronize document and body background with theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.body.style.backgroundColor = '#F5F7FA';
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.body.style.backgroundColor = '#020617';
      }
    }
  }, [theme]);

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
  const demoPatientCheckIn = demoPatient ? checkInQueue.find(q => q.patient_id === demoPatient.id) : undefined;
  const demoSession = demoPatient ? sessions.find(s => s.patient_id === demoPatient.id) || null : null;
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
    setPatients(prev => {
      const next = prev.map(p => p.id === updatedPt.id ? updatedPt : p);
      try {
        localStorage.setItem('kaizenbros_patients', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDeletePatient = (patientId: number) => {
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

    const targetSession = sessions.find(s => s.id === sessionId);
    if (targetSession) {
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
            const startMs = s.start_timestamp || (s.actual_start_time ? Date.now() - 3.5 * 3600 * 1000 : null);
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

  // Nurse assigns station to patient in queue
  const handleAssignStation = (patientId: number, chairNumber: string, machineModel: string) => {
    const updatedQueue = checkInQueue.map(q => {
      if (q.patient_id === patientId) {
        return {
          ...q,
          status: 'SEDANG_DIALISIS' as const,
          assigned_chair: chairNumber,
          assigned_machine_model: machineModel,
          called_at: new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
      }
      return q;
    });
    setCheckInQueue(updatedQueue);
    try {
      localStorage.setItem('kaizenbros_queue', JSON.stringify(updatedQueue));
    } catch {}

    setSessions(prev => prev.map(s => {
      if (s.patient_id === patientId) {
        return {
          ...s,
          chair_number: chairNumber,
          machine_model: machineModel,
          status: 'SEDANG_DIALISIS',
          actual_start_time: new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
      }
      return s;
    }));
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

  return (
    <div suppressHydrationWarning className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-[#EEF2F6] text-slate-900 light' : 'bg-slate-950 text-slate-100 dark'}`}>
      <Header
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        activePatientName={activePatient ? activePatient.name : 'Tiada Pesakit Dipilih'}
        activeNurseName={authenticatedStaff ? authenticatedStaff.name : demoNurseName}
        theme={theme}
        onThemeToggle={toggleTheme}
        authenticatedStaff={authenticatedStaff}
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
            checkInRecord={demoPatientCheckIn}
            isLoggedIn={!!authenticatedPatient}
            onUpdateWeights={handlePatientUpdateWeights}
            onCheckInArrival={handlePatientSelfCheckIn}
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
            onUpdateSession={(updatedSession) => {
              setSessions(prev => {
                const next = prev.map(s => s.id === updatedSession.id ? updatedSession : s);
                try {
                  localStorage.setItem('kaizenbros_sessions', JSON.stringify(next));
                } catch {}
                return next;
              });
              if (updatedSession.post_weight_kg || updatedSession.pre_weight_kg) {
                setPatients(prev => {
                  const next = prev.map(p => {
                    if (p.id === updatedSession.patient_id) {
                      return {
                        ...p,
                        latest_weight_kg: updatedSession.post_weight_kg ?? updatedSession.pre_weight_kg ?? p.latest_weight_kg,
                        latest_bp: updatedSession.post_bp || updatedSession.pre_bp || p.latest_bp
                      };
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
            }}
            onAddSession={(newSess) => {
              const newId = sessions.length > 0 ? Math.max(...sessions.map(s => s.id)) + 1 : 1;
              const newSessionObj: DialysisSession = { ...newSess, id: newId };
              setSessions(prev => [newSessionObj, ...prev]);
              try {
                localStorage.setItem('kaizenbros_sessions', JSON.stringify([newSessionObj, ...sessions]));
              } catch {}
            }}
            onDeleteSession={(sessionId) => {
              setSessions(prev => prev.filter(s => s.id !== sessionId));
              try {
                localStorage.setItem('kaizenbros_sessions', JSON.stringify(sessions.filter(s => s.id !== sessionId)));
              } catch {}
            }}
            onAddPatient={handleAddPatient}
            onUpdatePatient={handleUpdatePatient}
            onDeletePatient={handleDeletePatient}
            onDeleteRegistration={handleDeleteRegistration}
            onUpdateRegistration={handleUpdateRegistration}
            onAuditLog={handleAuditLog}
          />
        )}

        {currentView === 'database' && (
          <DatabaseExplorer />
        )}
      </div>

      {/* GLOBAL PERSISTENT MINIMALIST BOTTOM NAVIGATION */}
      {(currentView === 'public' || currentView === 'patient' || currentView === 'registration') && (
        <div className="h-[76px]">
          {/* Space buffer to prevent navigation overlapping contents */}
          <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 z-40 px-4 py-2.5 shadow-2xl">
            <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
              {/* Menu 1: Utama */}
              <button
                onClick={() => setCurrentView('public')}
                className={`min-h-[50px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  currentView === 'public'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white font-extrabold shadow-lg shadow-teal-950/40 border border-teal-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <HomeIcon className="w-5 h-5" />
                <span className="text-[11px] mt-1 font-black">UTAMA</span>
              </button>

              {/* Menu 2: Portal Pesakit */}
              <button
                onClick={() => setCurrentView('patient')}
                className={`min-h-[50px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  currentView === 'patient'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-500 font-extrabold shadow-lg shadow-teal-950/40 border border-teal-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <User className="w-5 h-5 text-white" />
                <span 
                  className={`text-[11px] mt-1 font-black ${currentView === 'patient' ? '!text-black portal-pesakit-active-text' : ''}`}
                  style={currentView === 'patient' ? { color: '#000000', WebkitTextFillColor: '#000000' } : undefined}
                >
                  PORTAL PESAKIT
                </span>
              </button>

              {/* Menu 3: Bantuan */}
              <button
                onClick={() => setShowGlobalHelpModal(true)}
                className={`min-h-[50px] rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  showGlobalHelpModal
                    ? 'bg-rose-600 text-white font-extrabold shadow-lg shadow-rose-950/40 border border-rose-500'
                    : 'text-rose-400 hover:text-rose-300 hover:bg-slate-900/60'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                <span className="text-[11px] mt-1 font-black">BANTUAN</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* GLOBAL EMERGENCY SOS HELP MODAL */}
      {showGlobalHelpModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl max-w-md w-full p-6 text-white space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-rose-400">Talian Bantuan & SOS</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Help Center</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGlobalHelpModal(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-750 text-white font-bold flex items-center justify-center cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 text-center space-y-2">
                <span className="text-xs uppercase text-rose-300 font-extrabold tracking-widest block">Talian Kecemasan 24-Jam</span>
                <a 
                  href="tel:0193389922" 
                  className="text-2xl font-black text-white hover:text-rose-300 transition-colors flex items-center justify-center space-x-2"
                >
                  <PhoneCall className="w-6 h-6 text-rose-400 animate-bounce" />
                  <span>019-338 9922</span>
                </a>
                <p className="text-xs text-rose-200 leading-normal">Tekan nombor di atas untuk membuat panggilan panggilan kecemasan terus ke kaunter utama.</p>
              </div>

              <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm">💡 Panduan Tindakan Segera:</h4>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-start">
                    <span className="text-rose-400 mr-2 font-bold">•</span>
                    <span><strong>Sesak Nafas / Sakit Dada:</strong> Hubungi 999 dengan segera dan maklumkan kepada jururawat di talian hotline.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-400 mr-2 font-bold">•</span>
                    <span><strong>Kecemasan Logistik:</strong> Sila hubungi talian hotline jika kenderaan panel pengangkutan lewat menjemput anda.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-400 mr-2 font-bold">•</span>
                    <span><strong>Kesan Sampingan:</strong> Jika anda mengalami pening melampau atau kekejangan otot selepas pulang, hubungi klinik.</span>
                  </li>
                </ul>
              </div>

              {/* Directly start a WhatsApp Chat to Staff */}
              <a
                href="https://wa.me/60193389922?text=Saya%20memerlukan%20bantuan%20kecemasan%20dialisis%20segera"
                target="_blank"
                rel="noreferrer"
                className="w-full min-h-[50px] bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40 border border-emerald-500 cursor-pointer text-center text-sm transition-colors"
              >
                <MessageSquare className="w-5 h-5 fill-white/10" />
                <span>Hubungi Kaunter via WhatsApp</span>
              </a>
            </div>

            <button
              onClick={() => setShowGlobalHelpModal(false)}
              style={{ color: '#000000' }}
              className="w-full min-h-[48px] bg-slate-200 hover:bg-slate-300 text-black !text-black font-bold rounded-2xl cursor-pointer transition-colors text-sm tutup-faham-btn"
            >
              <span style={{ color: '#000000' }} className="text-black !text-black font-bold">
                Tutup & Faham
              </span>
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
