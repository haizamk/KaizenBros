import React, { useState, useEffect, useRef } from 'react';
import { 
  CentreInfo, 
  StaffMember, 
  Patient, 
  TreatmentSession, 
  BloodTestRecord, 
  DoctorVisit, 
  TransactionPayment, 
  NotificationLog,
  PreRegisteredPatient,
  ShiftConfig,
  JobVacancy,
  JobApplication,
  TouristDialysisBooking,
  AppTheme,
  AdminPageVisibility,
  DEFAULT_ADMIN_PAGE_VISIBILITY
} from './types';
import { 
  INITIAL_CENTRE_INFO, 
  INITIAL_STAFF, 
  INITIAL_PATIENTS, 
  INITIAL_TREATMENT_SESSIONS, 
  INITIAL_BLOOD_TESTS, 
  INITIAL_DOCTOR_VISITS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_PRE_REGISTERED_PATIENTS,
  INITIAL_SHIFTS,
  INITIAL_JOB_VACANCIES,
  INITIAL_JOB_APPLICATIONS,
  INITIAL_TOURIST_BOOKINGS
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { subscribeToCollection, saveBatchToFirestore, saveDocumentToFirestore } from './lib/firebaseSync';
import { CentreProfileView } from './components/CentreProfileView';
import { TouristDialysisView } from './components/TouristDialysisView';
import { PatientRegistrationView } from './components/PatientRegistrationView';
import { TreatmentScheduleView } from './components/TreatmentScheduleView';
import { MedicalBloodTestView } from './components/MedicalBloodTestView';
import { DoctorVisitsView } from './components/DoctorVisitsView';
import { WhatsAppNotificationCenter } from './components/WhatsAppNotificationCenter';
import { PaymentFinanceView } from './components/PaymentFinanceView';
import { AnalyticsView } from './components/AnalyticsView';
import { DailyClinicalSummaryView } from './components/DailyClinicalSummaryView';
import { PatientPortalView } from './components/PatientPortalView';
import { NewStaffRecruitmentView } from './components/NewStaffRecruitmentView';
import { PublicCareerVacanciesView } from './components/PublicCareerVacanciesView';
import { StaffManagementView } from './components/StaffManagementView';
import { StaffSelfProfileModal } from './components/StaffSelfProfileModal';
import { JobApplicationModal } from './components/JobApplicationModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminRoleManagementModal } from './components/AdminRoleManagementModal';
import { PatientQuickLookupModal } from './components/PatientQuickLookupModal';
import { PreRegistrationModal } from './components/PreRegistrationModal';
import { SystemBackupModal } from './components/SystemBackupModal';
import { HospitalReferralLetterModal } from './components/HospitalReferralLetterModal';
import { 
  createSessionReminderMessage, 
  createDoctorVisitMessage, 
  createBloodTestReminderMessage, 
  createPaymentReminderMessage, 
  buildWhatsAppLink,
  createSessionEmailMessage,
  createDoctorVisitEmailMessage,
  createBloodTestEmailMessage,
  createPaymentEmailMessage
} from './utils/whatsappHelper';
import { ShieldCheck, Heart, PhoneCall, Clock, CheckCircle2, Lock, KeyRound, Cloud } from 'lucide-react';

const getInitialArray = <T extends { id?: string }>(key: string, defaultData: T[]): T[] => {
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // If defaultData is empty, return empty array to respect user request to wipe patient data
        if (defaultData.length === 0 && (key.includes('patient') || key.includes('session') || key.includes('blood') || key.includes('doctor') || key.includes('trx') || key.includes('notif') || key.includes('prereg'))) {
          return [];
        }
        return parsed;
      }
    }
    return defaultData;
  } catch {
    return defaultData;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('profil');
  const [centreInfo] = useState<CentreInfo>(INITIAL_CENTRE_INFO);
  const [staff, setStaff] = useState<StaffMember[]>(() =>
    getInitialArray('kaizenbros_staff', INITIAL_STAFF)
  );

  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const savedTheme = localStorage.getItem('kaizenbros_app_theme') as AppTheme;
      if (savedTheme && ['dark', 'light-black-footer', 'light-professional'].includes(savedTheme)) {
        return savedTheme;
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('kaizenbros_app_theme', theme);
    } catch (e) {
      console.warn('Theme storage error:', e);
    }
    document.documentElement.classList.remove('theme-dark', 'theme-light-black-footer', 'theme-light-professional');
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  // Persistent / dynamic state with guaranteed non-empty array fallbacks
  const [patients, setPatients] = useState<Patient[]>(() => 
    getInitialArray('kaizenbros_patients', INITIAL_PATIENTS)
  );

  const [sessions, setSessions] = useState<TreatmentSession[]>(() => 
    getInitialArray('kaizenbros_sessions', INITIAL_TREATMENT_SESSIONS)
  );

  const [bloodTests, setBloodTests] = useState<BloodTestRecord[]>(() => 
    getInitialArray('kaizenbros_blood_tests', INITIAL_BLOOD_TESTS)
  );

  const [doctorVisits, setDoctorVisits] = useState<DoctorVisit[]>(() => 
    getInitialArray('kaizenbros_doctor_visits', INITIAL_DOCTOR_VISITS)
  );

  const [transactions, setTransactions] = useState<TransactionPayment[]>(() => 
    getInitialArray('kaizenbros_transactions', INITIAL_TRANSACTIONS)
  );

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => 
    getInitialArray('kaizenbros_notifications', INITIAL_NOTIFICATIONS)
  );

  const [preRegisteredPatients, setPreRegisteredPatients] = useState<PreRegisteredPatient[]>(() =>
    getInitialArray('kaizenbros_prereg_patients', INITIAL_PRE_REGISTERED_PATIENTS)
  );

  const [shifts, setShifts] = useState<ShiftConfig[]>(() =>
    getInitialArray('kaizenbros_shifts', INITIAL_SHIFTS)
  );

  const [jobApplications, setJobApplications] = useState<JobApplication[]>(() =>
    getInitialArray('kaizenbros_job_applications', INITIAL_JOB_APPLICATIONS)
  );

  const [jobVacancies, setJobVacancies] = useState<JobVacancy[]>(() =>
    getInitialArray('kaizenbros_job_vacancies', INITIAL_JOB_VACANCIES)
  );

  const [touristBookings, setTouristBookings] = useState<TouristDialysisBooking[]>(() =>
    getInitialArray('kaizenbros_tourist_bookings', INITIAL_TOURIST_BOOKINGS)
  );
  const [touristInitialSubTab, setTouristInitialSubTab] = useState<'tips' | 'form' | 'admin'>('tips');

  const [isQuickLookupOpen, setIsQuickLookupOpen] = useState(false);
  const [isPreRegModalOpen, setIsPreRegModalOpen] = useState(false);
  const [isJobAppModalOpen, setIsJobAppModalOpen] = useState(false);
  const [selectedVacancyForApp, setSelectedVacancyForApp] = useState<JobVacancy | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isHospitalReferralModalOpen, setIsHospitalReferralModalOpen] = useState(false);
  const [selectedPatientForReferral, setSelectedPatientForReferral] = useState<Patient | null>(null);

  // Dynamic Admin Page Visibility State (Can hide / show every page in admin)
  const [adminPageVisibility, setAdminPageVisibility] = useState<AdminPageVisibility>(() => {
    try {
      const saved = localStorage.getItem('kaizenbros_admin_page_visibility');
      if (saved) return { ...DEFAULT_ADMIN_PAGE_VISIBILITY, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Error reading adminPageVisibility:', e);
    }
    return DEFAULT_ADMIN_PAGE_VISIBILITY;
  });

  const handleUpdatePageVisibility = (newVisibility: AdminPageVisibility) => {
    setAdminPageVisibility(newVisibility);
    try {
      localStorage.setItem('kaizenbros_admin_page_visibility', JSON.stringify(newVisibility));
      saveDocumentToFirestore('systemSettings', { id: 'admin_page_visibility', ...newVisibility });
    } catch (e) {
      console.warn('Error saving adminPageVisibility:', e);
    }
  };

  const handleOpenJobAppModal = (vacancy?: JobVacancy) => {
    setSelectedVacancyForApp(vacancy || null);
    setIsJobAppModalOpen(true);
  };

  const handleOpenHospitalReferral = (patient?: Patient) => {
    setSelectedPatientForReferral(patient || null);
    setIsHospitalReferralModalOpen(true);
  };

  const handleRestoreData = (
    restored: {
      patients?: Patient[];
      sessions?: TreatmentSession[];
      bloodTests?: BloodTestRecord[];
      doctorVisits?: DoctorVisit[];
      transactions?: TransactionPayment[];
      notifications?: NotificationLog[];
      preRegisteredPatients?: PreRegisteredPatient[];
      shifts?: ShiftConfig[];
    },
    mode: 'OVERWRITE' | 'MERGE'
  ) => {
    if (mode === 'OVERWRITE') {
      if (restored.patients) setPatients(restored.patients);
      if (restored.sessions) setSessions(restored.sessions);
      if (restored.bloodTests) setBloodTests(restored.bloodTests);
      if (restored.doctorVisits) setDoctorVisits(restored.doctorVisits);
      if (restored.transactions) setTransactions(restored.transactions);
      if (restored.notifications) setNotifications(restored.notifications);
      if (restored.preRegisteredPatients) setPreRegisteredPatients(restored.preRegisteredPatients);
      if (restored.shifts) setShifts(restored.shifts);
    } else {
      if (restored.patients) {
        setPatients((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const newItems = restored.patients!.filter((p) => !ids.has(p.id));
          return [...newItems, ...prev];
        });
      }
      if (restored.sessions) {
        setSessions((prev) => {
          const ids = new Set(prev.map((s) => s.id));
          const newItems = restored.sessions!.filter((s) => !ids.has(s.id));
          return [...newItems, ...prev];
        });
      }
      if (restored.bloodTests) {
        setBloodTests((prev) => {
          const ids = new Set(prev.map((b) => b.id));
          const newItems = restored.bloodTests!.filter((b) => !ids.has(b.id));
          return [...newItems, ...prev];
        });
      }
      if (restored.doctorVisits) {
        setDoctorVisits((prev) => {
          const ids = new Set(prev.map((v) => v.id));
          const newItems = restored.doctorVisits!.filter((v) => !ids.has(v.id));
          return [...newItems, ...prev];
        });
      }
      if (restored.transactions) {
        setTransactions((prev) => {
          const ids = new Set(prev.map((t) => t.id));
          const newItems = restored.transactions!.filter((t) => !ids.has(t.id));
          return [...newItems, ...prev];
        });
      }
      if (restored.notifications) {
        setNotifications((prev) => {
          const ids = new Set(prev.map((n) => n.id));
          const newItems = restored.notifications!.filter((n) => !ids.has(n.id));
          return [...newItems, ...prev];
        });
      }
      if (restored.preRegisteredPatients) {
        setPreRegisteredPatients((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const newItems = restored.preRegisteredPatients!.filter((p) => !ids.has(p.id));
          return [...newItems, ...prev];
        });
      }
      if (restored.shifts) {
        setShifts((prev) => {
          const ids = new Set(prev.map((s) => s.id));
          const newItems = restored.shifts!.filter((s) => !ids.has(s.id));
          return [...newItems, ...prev];
        });
      }
    }
  };

  const handleResetFreshStart = () => {
    setPatients([]);
    setSessions([]);
    setBloodTests([]);
    setDoctorVisits([]);
    setTransactions([]);
    setNotifications([]);
    setPreRegisteredPatients([]);
    setJobApplications([]);

    try {
      localStorage.removeItem('kaizenbros_patients');
      localStorage.removeItem('kaizenbros_sessions');
      localStorage.removeItem('kaizenbros_blood_tests');
      localStorage.removeItem('kaizenbros_doctor_visits');
      localStorage.removeItem('kaizenbros_transactions');
      localStorage.removeItem('kaizenbros_notifications');
      localStorage.removeItem('kaizenbros_prereg_patients');
      localStorage.removeItem('kaizenbros_job_applications');
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
  };

  // Realtime Firebase Firestore Subscriptions
  useEffect(() => {
    const unsubPatients = subscribeToCollection('patients', patients, setPatients);
    const unsubSessions = subscribeToCollection('sessions', sessions, setSessions);
    const unsubBloodTests = subscribeToCollection('bloodTests', bloodTests, setBloodTests);
    const unsubDoctorVisits = subscribeToCollection('doctorVisits', doctorVisits, setDoctorVisits);
    const unsubTransactions = subscribeToCollection('transactions', transactions, setTransactions);
    const unsubNotifications = subscribeToCollection('notifications', notifications, setNotifications);
    const unsubPreReg = subscribeToCollection('preRegisteredPatients', preRegisteredPatients, setPreRegisteredPatients);
    const unsubShifts = subscribeToCollection('shifts', shifts, setShifts);
    const unsubJobApps = subscribeToCollection('jobApplications', jobApplications, setJobApplications);
    const unsubJobVacancies = subscribeToCollection('jobVacancies', jobVacancies, setJobVacancies);
    const unsubSettings = subscribeToCollection('systemSettings', [], (settings: any[]) => {
      const pageVis = settings.find(s => s.id === 'admin_page_visibility');
      if (pageVis) {
        const { id, ...visData } = pageVis;
        setAdminPageVisibility(prev => ({ ...prev, ...visData }));
      }
    });

    return () => {
      unsubPatients();
      unsubSessions();
      unsubBloodTests();
      unsubDoctorVisits();
      unsubTransactions();
      unsubNotifications();
      unsubPreReg();
      unsubShifts();
      unsubJobApps();
      unsubJobVacancies();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kaizenbros_prereg_patients', JSON.stringify(preRegisteredPatients));
      saveBatchToFirestore('preRegisteredPatients', preRegisteredPatients);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [preRegisteredPatients]);

  useEffect(() => {
    try {
      localStorage.setItem('kaizenbros_shifts', JSON.stringify(shifts));
      saveBatchToFirestore('shifts', shifts);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [shifts]);

  useEffect(() => {
    try {
      localStorage.setItem('kaizenbros_job_applications', JSON.stringify(jobApplications));
      saveBatchToFirestore('jobApplications', jobApplications);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [jobApplications]);

  useEffect(() => {
    try {
      localStorage.setItem('kaizenbros_job_vacancies', JSON.stringify(jobVacancies));
      saveBatchToFirestore('jobVacancies', jobVacancies);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [jobVacancies]);

  useEffect(() => {
    try {
      localStorage.setItem('kaizenbros_tourist_bookings', JSON.stringify(touristBookings));
      saveBatchToFirestore('touristBookings', touristBookings);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [touristBookings]);

  const handleAddTouristBooking = (booking: TouristDialysisBooking) => {
    setTouristBookings((prev) => [booking, ...prev]);
  };

  const handleUpdateTouristBooking = (updated: TouristDialysisBooking) => {
    setTouristBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleDeleteTouristBooking = (id: string) => {
    setTouristBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddJobApplication = (app: JobApplication) => {
    setJobApplications((prev) => [app, ...prev]);
  };

  const handleUpdateJobApplication = (updated: JobApplication) => {
    setJobApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleAddJobVacancy = (vacancy: JobVacancy) => {
    setJobVacancies((prev) => [vacancy, ...prev]);
  };

  const handleUpdateJobVacancy = (updated: JobVacancy) => {
    setJobVacancies((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const handleDeleteJobVacancy = (id: string) => {
    setJobVacancies((prev) => prev.filter((v) => v.id !== id));
  };

  // Ensure Khairul Haizam (PT-007) and his blood test records exist in state cleanly
  useEffect(() => {
    const khairulPatient = INITIAL_PATIENTS.find(p => p.id === 'PT-007');
    if (khairulPatient) {
      setPatients(prev => {
        const hasKhairul = prev.some(p => p.id === 'PT-007');
        if (hasKhairul) {
          // Clean up any potential duplicates in prev state
          const seen = new Set<string>();
          return prev.filter(p => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
        }
        return [khairulPatient, ...prev];
      });
    }

    const khairulTests = INITIAL_BLOOD_TESTS.filter(b => b.patientId === 'PT-007');
    if (khairulTests.length > 0) {
      setBloodTests(prev => {
        const existingIds = new Set(prev.map(b => b.id));
        const missingTests = khairulTests.filter(b => !existingIds.has(b.id));
        if (missingTests.length > 0) {
          return [...missingTests, ...prev];
        }
        return prev;
      });
    }
  }, []);

  const handleAddShift = (newShift: ShiftConfig) => {
    setShifts((prev) => [...prev, newShift]);
  };

  const handleUpdateShift = (updatedShift: ShiftConfig) => {
    setShifts((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
  };

  const handleDeleteShift = (shiftId: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
  };

  // Admin Authentication & Session State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kaizenbros_admin_auth');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [currentAdminStaff, setCurrentAdminStaff] = useState<StaffMember | null>(INITIAL_STAFF[0] || null);
  const [adminRoleTitle, setAdminRoleTitle] = useState<string>('Dr. Azman • Super Admin (Owner)');
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [isAdminRoleModalOpen, setIsAdminRoleModalOpen] = useState<boolean>(false);
  const [adminRoleModalTab, setAdminRoleModalTab] = useState<'ROLES' | 'PAGES'>('ROLES');
  const [isSelfProfileModalOpen, setIsSelfProfileModalOpen] = useState<boolean>(false);

  const handleOpenAdminRoleManagement = (tab: 'ROLES' | 'PAGES' = 'ROLES') => {
    setAdminRoleModalTab(tab);
    setIsAdminRoleModalOpen(true);
  };

  useEffect(() => {
    try {
      localStorage.setItem('kaizenbros_admin_auth', JSON.stringify(isAdminAuthenticated));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [isAdminAuthenticated]);

  // Redirect if currently activeTab is set to hidden in admin mode
  useEffect(() => {
    if (isAdminAuthenticated && adminPageVisibility) {
      const isVisible = adminPageVisibility[activeTab as keyof AdminPageVisibility];
      if (isVisible === false) {
        const priorityOrder = [
          'ringkasan_klinikal',
          'pendaftaran',
          'jadual',
          'perubatan',
          'doktor',
          'kewangan',
          'pengurusan_staf',
          'permohonan_kerjaya',
          'whatsapp',
          'analitik',
          'profil',
          'portal_pesakit'
        ];
        const firstVisible = priorityOrder.find(id => adminPageVisibility[id as keyof AdminPageVisibility] !== false);
        if (firstVisible) {
          setActiveTab(firstVisible);
        }
      }
    }
  }, [activeTab, adminPageVisibility, isAdminAuthenticated]);

  const handleSelectTab = (tab: string, subTab?: 'tips' | 'form' | 'admin') => {
    const publicTabs = ['profil', 'portal_pesakit', 'kerjaya', 'dialisis_pelancong'];
    if (!isAdminAuthenticated && !publicTabs.includes(tab)) {
      setIsAdminLoginModalOpen(true);
      return;
    }
    if (tab === 'dialisis_pelancong' && subTab) {
      setTouristInitialSubTab(subTab);
    }
    setActiveTab(tab);
  };

  const handleAdminLoginSuccess = (staffMember: StaffMember, roleTitle: string) => {
    setIsAdminAuthenticated(true);
    setCurrentAdminStaff(staffMember);
    setAdminRoleTitle(roleTitle);
    setIsAdminLoginModalOpen(false);
    setActiveTab('ringkasan_klinikal');
  };

  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setCurrentAdminStaff(null);
    setAdminRoleTitle('');
    if (!['profil', 'portal_pesakit', 'kerjaya'].includes(activeTab)) {
      setActiveTab('profil');
    }
  };

  const [autoSaveToast, setAutoSaveToast] = useState<{ time: string; msg: string } | null>(null);
  const isAutoSaveMounted = useRef(false);

  // Sync to localStorage and Firestore
  useEffect(() => {
    try {
      localStorage.setItem('kaizenbros_patients', JSON.stringify(patients));
      localStorage.setItem('kaizenbros_sessions', JSON.stringify(sessions));
      localStorage.setItem('kaizenbros_blood_tests', JSON.stringify(bloodTests));
      localStorage.setItem('kaizenbros_doctor_visits', JSON.stringify(doctorVisits));
      localStorage.setItem('kaizenbros_transactions', JSON.stringify(transactions));
      localStorage.setItem('kaizenbros_notifications', JSON.stringify(notifications));

      saveBatchToFirestore('patients', patients);
      saveBatchToFirestore('sessions', sessions);
      saveBatchToFirestore('bloodTests', bloodTests);
      saveBatchToFirestore('doctorVisits', doctorVisits);
      saveBatchToFirestore('transactions', transactions);
      saveBatchToFirestore('notifications', notifications);

      if (isAutoSaveMounted.current) {
        const timeNow = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setAutoSaveToast({
          time: timeNow,
          msg: 'Data Pesakit & Kewangan Disimpan ke Cloud Firestore'
        });
        const timer = setTimeout(() => {
          setAutoSaveToast(null);
        }, 3500);
        return () => clearTimeout(timer);
      } else {
        isAutoSaveMounted.current = true;
      }
    } catch (e) {
      console.warn('Storage quota or error saving:', e);
    }
  }, [patients, sessions, bloodTests, doctorVisits, transactions, notifications]);

  // Handlers for adding new items
  const handleAddPatient = (patient: Patient) => {
    setPatients((prev) => [patient, ...prev]);

    // Automatically remove from pre-registered / clinical assessment list if transferred/registered
    setPreRegisteredPatients((prev) => prev.filter((p) => p.noIC !== patient.noIC && p.id !== patient.id));

    // Also auto-create their first treatment session
    const newSession: TreatmentSession = {
      id: `SES-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      tarikh: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      corakHari: patient.sesiJadual.corakHari,
      shift: patient.sesiJadual.shift,
      masaMula: patient.sesiJadual.shift === 'PAGI' ? '06:00' : patient.sesiJadual.shift === 'TENGAHARI' ? '10:00' : '14:00',
      masaTamat: patient.sesiJadual.shift === 'PAGI' ? '10:00' : patient.sesiJadual.shift === 'TENGAHARI' ? '14:00' : '18:00',
      stesenNo: patient.sesiJadual.stesenNo,
      status: 'AKAN_DATANG',
      jururawatBertugas: 'Sister Hanim binti Othman',
      ultrafiltrationGoal: 2.0
    };
    setSessions((prev) => [newSession, ...prev]);

    // Create automatic WhatsApp log
    const msg = createSessionReminderMessage(patient, newSession);
    const notif: NotificationLog = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      noTelefon: patient.noTelefon,
      emel: patient.emel,
      jenis: 'SESI_RAWATAN',
      saluran: 'WHATSAPP',
      tajuk: 'Pendaftaran & Jadual Sesi Rawatan Pertama',
      kandungan: msg,
      tarikhMasaDihantar: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'BERJAYA',
      pautanWhatsApp: buildWhatsAppLink(patient.noTelefon, msg)
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleAddSession = (session: TreatmentSession) => {
    setSessions((prev) => [session, ...prev]);
  };

  const handleUpdateSession = (updatedSession: TreatmentSession) => {
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === updatedSession.id);
      if (exists) {
        return prev.map((s) => (s.id === updatedSession.id ? updatedSession : s));
      } else {
        return [updatedSession, ...prev];
      }
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
  };

  const handleAddBloodTest = (record: BloodTestRecord) => {
    setBloodTests((prev) => [record, ...prev]);

    // Update the patient's next blood test date
    setPatients((prev) =>
      prev.map((p) =>
        p.id === record.patientId
          ? { ...p, tarikhUjianDarahSeterusnya: record.tarikhUjianSeterusnya }
          : p
      )
    );
  };

  const handleUpdateBloodTest = (record: BloodTestRecord) => {
    setBloodTests((prev) => prev.map((b) => (b.id === record.id ? record : b)));
  };

  const handleDeletePreRegisteredPatient = (preId: string) => {
    setPreRegisteredPatients((prev) => prev.filter((p) => p.id !== preId));
  };

  const handleAddDoctorVisit = (visit: DoctorVisit) => {
    setDoctorVisits((prev) => [visit, ...prev]);

    // Update patient next doctor date
    setPatients((prev) =>
      prev.map((p) =>
        p.id === visit.patientId
          ? { ...p, tarikhLawatanDoktorSeterusnya: visit.tarikhLawatan }
          : p
      )
    );
  };

  const handleAddTransaction = (tx: TransactionPayment) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  // Notification triggers (Dual Channel: WhatsApp + Auto Email Backup)
  const handleSendSessionNotification = (session: TreatmentSession, patient: Patient) => {
    const waMsg = createSessionReminderMessage(patient, session);
    const emailData = createSessionEmailMessage(patient, session);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const waLog: NotificationLog = {
      id: `NOTIF-WA-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      noTelefon: patient.noTelefon,
      emel: patient.emel,
      jenis: 'SESI_RAWATAN',
      saluran: 'WHATSAPP',
      tajuk: `Peringatan Sesi Stesen #${session.stesenNo} (WhatsApp)`,
      kandungan: waMsg,
      tarikhMasaDihantar: nowStr,
      status: 'BERJAYA',
      pautanWhatsApp: buildWhatsAppLink(patient.noTelefon, waMsg)
    };

    const emailLog: NotificationLog = {
      id: `NOTIF-EML-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      noTelefon: patient.noTelefon,
      emel: patient.emel,
      jenis: 'SESI_RAWATAN',
      saluran: 'EMAIL',
      tajuk: emailData.subject,
      kandungan: emailData.bodyText,
      tarikhMasaDihantar: nowStr,
      status: 'BERJAYA'
    };

    setNotifications((prev) => [waLog, emailLog, ...prev]);
  };

  const handleSendDoctorVisitReminder = (visit: DoctorVisit, patient: Patient) => {
    const waMsg = createDoctorVisitMessage(patient, visit);
    const emailData = createDoctorVisitEmailMessage(patient, visit);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const waLog: NotificationLog = {
      id: `NOTIF-WA-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      noTelefon: patient.noTelefon,
      emel: patient.emel,
      jenis: 'LAWATAN_DOKTOR',
      saluran: 'WHATSAPP',
      tajuk: `Peringatan Lawatan ${visit.namaDoktor} (WhatsApp)`,
      kandungan: waMsg,
      tarikhMasaDihantar: nowStr,
      status: 'BERJAYA',
      pautanWhatsApp: buildWhatsAppLink(patient.noTelefon, waMsg)
    };

    const emailLog: NotificationLog = {
      id: `NOTIF-EML-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      noTelefon: patient.noTelefon,
      emel: patient.emel,
      jenis: 'LAWATAN_DOKTOR',
      saluran: 'EMAIL',
      tajuk: emailData.subject,
      kandungan: emailData.bodyText,
      tarikhMasaDihantar: nowStr,
      status: 'BERJAYA'
    };

    setNotifications((prev) => [waLog, emailLog, ...prev]);

    setDoctorVisits((prev) =>
      prev.map((v) => (v.id === visit.id ? { ...v, notifikasiDihantar: true } : v))
    );
  };

  const handleSendBloodTestReminder = (test: BloodTestRecord, patient: Patient) => {
    const waMsg = createBloodTestReminderMessage(patient, test.tarikhUjianSeterusnya, test.catatan);
    const emailData = createBloodTestEmailMessage(patient, test.tarikhUjianSeterusnya, test.catatan);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const waLog: NotificationLog = {
      id: `NOTIF-WA-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      noTelefon: patient.noTelefon,
      emel: patient.emel,
      jenis: 'TEST_DARAH',
      saluran: 'WHATSAPP',
      tajuk: 'Peringatan Tarikh Ambil Test Darah (WhatsApp)',
      kandungan: waMsg,
      tarikhMasaDihantar: nowStr,
      status: 'BERJAYA',
      pautanWhatsApp: buildWhatsAppLink(patient.noTelefon, waMsg)
    };

    const emailLog: NotificationLog = {
      id: `NOTIF-EML-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      noTelefon: patient.noTelefon,
      emel: patient.emel,
      jenis: 'TEST_DARAH',
      saluran: 'EMAIL',
      tajuk: emailData.subject,
      kandungan: emailData.bodyText,
      tarikhMasaDihantar: nowStr,
      status: 'BERJAYA'
    };

    setNotifications((prev) => [waLog, emailLog, ...prev]);

    setBloodTests((prev) =>
      prev.map((b) => (b.id === test.id ? { ...b, statusPeringatan: 'DIHANTAR' } : b))
    );
  };

  const handleSendPaymentNotification = (tx: TransactionPayment, patient: Patient) => {
    const waMsg = createPaymentReminderMessage(patient, tx);
    const emailData = createPaymentEmailMessage(patient, tx);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const waLog: NotificationLog = {
      id: `NOTIF-WA-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      noTelefon: patient.noTelefon,
      emel: patient.emel,
      jenis: 'PEMBAYARAN_INVOIS',
      saluran: 'WHATSAPP',
      tajuk: `Penyata Invois ${tx.invoisNo} (WhatsApp)`,
      kandungan: waMsg,
      tarikhMasaDihantar: nowStr,
      status: 'BERJAYA',
      pautanWhatsApp: buildWhatsAppLink(patient.noTelefon, waMsg)
    };

    const emailLog: NotificationLog = {
      id: `NOTIF-EML-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.nama,
      noTelefon: patient.noTelefon,
      emel: patient.emel,
      jenis: 'PEMBAYARAN_INVOIS',
      saluran: 'EMAIL',
      tajuk: emailData.subject,
      kandungan: emailData.bodyText,
      tarikhMasaDihantar: nowStr,
      status: 'BERJAYA'
    };

    setNotifications((prev) => [waLog, emailLog, ...prev]);
  };

  // Bulk scan and dispatch simulator (Dual-Channel: WhatsApp + Email)
  const handleBulkTriggerReminders = (): number => {
    let generatedCount = 0;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newLogs: NotificationLog[] = [];

    patients.forEach((patient) => {
      // Find upcoming session
      const sess = sessions.find((s) => s.patientId === patient.id);
      if (sess) {
        const waMsg = createSessionReminderMessage(patient, sess);
        const emailData = createSessionEmailMessage(patient, sess);

        newLogs.push({
          id: `NOTIF-WA-${Date.now().toString().slice(-4)}-${generatedCount}`,
          patientId: patient.id,
          patientName: patient.nama,
          noTelefon: patient.noTelefon,
          emel: patient.emel,
          jenis: 'SESI_RAWATAN',
          saluran: 'WHATSAPP',
          tajuk: 'Peringatan Automatik Sesi Dialisis (WhatsApp)',
          kandungan: waMsg,
          tarikhMasaDihantar: nowStr,
          status: 'BERJAYA',
          pautanWhatsApp: buildWhatsAppLink(patient.noTelefon, waMsg)
        });

        newLogs.push({
          id: `NOTIF-EML-${Date.now().toString().slice(-4)}-${generatedCount}`,
          patientId: patient.id,
          patientName: patient.nama,
          noTelefon: patient.noTelefon,
          emel: patient.emel,
          jenis: 'SESI_RAWATAN',
          saluran: 'EMAIL',
          tajuk: emailData.subject,
          kandungan: emailData.bodyText,
          tarikhMasaDihantar: nowStr,
          status: 'BERJAYA'
        });

        generatedCount += 2;
      }

      // Check blood test reminder
      if (patient.tarikhUjianDarahSeterusnya) {
        const waMsg = createBloodTestReminderMessage(patient, patient.tarikhUjianDarahSeterusnya);
        const emailData = createBloodTestEmailMessage(patient, patient.tarikhUjianDarahSeterusnya);

        newLogs.push({
          id: `NOTIF-WA-${Date.now().toString().slice(-4)}-${generatedCount}`,
          patientId: patient.id,
          patientName: patient.nama,
          noTelefon: patient.noTelefon,
          emel: patient.emel,
          jenis: 'TEST_DARAH',
          saluran: 'WHATSAPP',
          tajuk: 'Peringatan Automatik Tarikh Ambil Test Darah (WhatsApp)',
          kandungan: waMsg,
          tarikhMasaDihantar: nowStr,
          status: 'BERJAYA',
          pautanWhatsApp: buildWhatsAppLink(patient.noTelefon, waMsg)
        });

        newLogs.push({
          id: `NOTIF-EML-${Date.now().toString().slice(-4)}-${generatedCount}`,
          patientId: patient.id,
          patientName: patient.nama,
          noTelefon: patient.noTelefon,
          emel: patient.emel,
          jenis: 'TEST_DARAH',
          saluran: 'EMAIL',
          tajuk: emailData.subject,
          kandungan: emailData.bodyText,
          tarikhMasaDihantar: nowStr,
          status: 'BERJAYA'
        });

        generatedCount += 2;
      }
    });

    if (newLogs.length > 0) {
      setNotifications((prev) => [...newLogs, ...prev]);
    }

    return generatedCount;
  };

  const handleSelectPatientForDirectMessage = (patient: Patient) => {
    setActiveTab('whatsapp');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 theme-${theme} app-body transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0A0C10] text-[#E2E8F0]' : 'bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      {/* Top Navbar */}
      <Navbar
        centreInfo={centreInfo}
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onOpenQuickSearch={() => setIsQuickLookupOpen(true)}
        onOpenPreRegister={() => setIsPreRegModalOpen(true)}
        onOpenJobApplication={() => handleOpenJobAppModal()}
        onOpenHospitalReferral={() => handleOpenHospitalReferral()}
        onOpenAdminRoleManagement={handleOpenAdminRoleManagement}
        onOpenSelfProfile={() => setIsSelfProfileModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        pendingNotificationsCount={0}
        pendingJobAppsCount={jobApplications.filter(a => a.statusPermohonan === 'DALAM_SEMAKAN').length}
        isAdminAuthenticated={isAdminAuthenticated}
        currentAdminStaff={currentAdminStaff}
        adminRoleTitle={adminRoleTitle}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        currentTheme={theme}
        onSelectTheme={setTheme}
        adminPageVisibility={adminPageVisibility}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!isAdminAuthenticated && !['profil', 'portal_pesakit', 'kerjaya', 'dialisis_pelancong'].includes(activeTab) ? (
          <div className="p-12 text-center bg-[#111827] rounded-2xl border border-[#1F2937] space-y-5 max-w-lg mx-auto my-12 shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-950 border border-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase tracking-wider mb-2">
                Akses Terpelihara KKM
              </div>
              <h2 className="text-xl font-bold text-white font-serif">Sesi Pentadbir Dikunci</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Akses ke modul pengurusan ini memerlukan pengesahan keselamatan staf berdaftar KKM. Sila log masuk dengan akaun pentadbir.
              </p>
            </div>
            <button
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 cursor-pointer flex items-center justify-center gap-2 mx-auto transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>Log Masuk Admin Portal</span>
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'profil' && (
              <CentreProfileView
                centreInfo={centreInfo}
                staff={staff}
                onNavigateToRegister={() => handleSelectTab('pendaftaran')}
                onOpenPreRegister={() => setIsPreRegModalOpen(true)}
                onOpenJobApplication={() => handleOpenJobAppModal()}
                onNavigateToCareer={() => handleSelectTab('kerjaya')}
                onNavigateToTouristDialysis={() => handleSelectTab('dialisis_pelancong', 'tips')}
                onOpenPatientPortal={() => handleSelectTab('portal_pesakit')}
                onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            )}

            {activeTab === 'dialisis_pelancong' && (
              <TouristDialysisView
                centreInfo={centreInfo}
                bookings={touristBookings}
                staff={staff}
                initialSubTab={touristInitialSubTab}
                onAddBooking={handleAddTouristBooking}
                onUpdateBooking={handleUpdateTouristBooking}
                onDeleteBooking={handleDeleteTouristBooking}
                isAdminAuthenticated={isAdminAuthenticated}
                onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
              />
            )}

            {activeTab === 'kerjaya' && (
              <PublicCareerVacanciesView
                jobVacancies={jobVacancies}
                onOpenJobApplicationModal={handleOpenJobAppModal}
                onNavigateToHome={() => handleSelectTab('profil')}
              />
            )}

            {activeTab === 'permohonan_kerjaya' && (
              <NewStaffRecruitmentView
                jobApplications={jobApplications}
                jobVacancies={jobVacancies}
                onUpdateJobApplication={handleUpdateJobApplication}
                onAddJobVacancy={handleAddJobVacancy}
                onUpdateJobVacancy={handleUpdateJobVacancy}
                onDeleteJobVacancy={handleDeleteJobVacancy}
              />
            )}

            {activeTab === 'pengurusan_staf' && (
              <StaffManagementView
                staffList={staff}
                currentAdminStaff={currentAdminStaff}
                onUpdateStaffList={(updated) => setStaff(updated)}
                onOpenSelfProfile={() => setIsSelfProfileModalOpen(true)}
                onOpenAdminRoleManagement={handleOpenAdminRoleManagement}
              />
            )}

            {activeTab === 'pendaftaran' && (
              <PatientRegistrationView
                patients={patients}
                preRegisteredPatients={preRegisteredPatients}
                onAddPatient={handleAddPatient}
                onUpdatePatient={handleUpdatePatient}
                onAddPreRegisteredPatient={(newPre) => setPreRegisteredPatients((prev) => [newPre, ...prev])}
                onUpdatePreRegisteredPatient={(updatedPre) => setPreRegisteredPatients((prev) => prev.map((p) => p.id === updatedPre.id ? updatedPre : p))}
                onDeletePreRegisteredPatient={handleDeletePreRegisteredPatient}
                onSelectPatientForMessage={handleSelectPatientForDirectMessage}
              />
            )}

            {activeTab === 'jadual' && (
              <TreatmentScheduleView
                sessions={sessions}
                patients={patients}
                shifts={shifts}
                onAddSession={handleAddSession}
                onUpdateSession={handleUpdateSession}
                onDeleteSession={handleDeleteSession}
                onUpdatePatient={handleUpdatePatient}
                onSendNotification={handleSendSessionNotification}
                onAddShift={handleAddShift}
                onUpdateShift={handleUpdateShift}
                onDeleteShift={handleDeleteShift}
              />
            )}

            {activeTab === 'perubatan' && (
              <MedicalBloodTestView
                bloodTests={bloodTests}
                patients={patients}
                doctorVisits={doctorVisits}
                centreInfo={centreInfo}
                onAddBloodTest={handleAddBloodTest}
                onUpdateBloodTest={handleUpdateBloodTest}
                onSendBloodTestReminder={handleSendBloodTestReminder}
              />
            )}

            {activeTab === 'doktor' && (
              <DoctorVisitsView
                doctorVisits={doctorVisits}
                patients={patients}
                staff={staff}
                onAddDoctorVisit={handleAddDoctorVisit}
                onSendDoctorVisitReminder={handleSendDoctorVisitReminder}
              />
            )}

            {activeTab === 'ringkasan_klinikal' && (
              <DailyClinicalSummaryView
                patients={patients}
                sessions={sessions}
                setSessions={setSessions}
                doctorVisits={doctorVisits}
                setDoctorVisits={setDoctorVisits}
                bloodTests={bloodTests}
                centreInfo={centreInfo}
                onOpenHospitalReferral={handleOpenHospitalReferral}
              />
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppNotificationCenter
                notifications={notifications}
                patients={patients}
                sessions={sessions}
                doctorVisits={doctorVisits}
                bloodTests={bloodTests}
                transactions={transactions}
                onTriggerBulkReminders={handleBulkTriggerReminders}
                onSendCustomNotification={(log) => setNotifications((prev) => [log, ...prev])}
              />
            )}

            {activeTab === 'kewangan' && (
              <PaymentFinanceView
                transactions={transactions}
                patients={patients}
                centreInfo={centreInfo}
                onAddTransaction={handleAddTransaction}
                onSendPaymentNotification={handleSendPaymentNotification}
              />
            )}

            {activeTab === 'analitik' && (
              <AnalyticsView
                patients={patients}
                sessions={sessions}
                bloodTests={bloodTests}
                transactions={transactions}
                onOpenBackup={() => setIsBackupModalOpen(true)}
              />
            )}

            {activeTab === 'portal_pesakit' && (
              <PatientPortalView
                patients={patients}
                sessions={sessions}
                bloodTests={bloodTests}
                doctorVisits={doctorVisits}
                transactions={transactions}
                centreInfo={centreInfo}
                onOpenPreRegistration={() => setIsPreRegModalOpen(true)}
                onSwitchToAdminPortal={() => setIsAdminLoginModalOpen(true)}
                onUpdatePatient={handleUpdatePatient}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className={`py-8 border-t mt-12 transition-colors duration-200 ${
        theme === 'light-black-footer' 
          ? 'bg-[#090D16] text-slate-200 border-slate-800 bg-black-footer' 
          : theme === 'light-professional' 
          ? 'bg-slate-100 text-slate-800 border-slate-300' 
          : 'bg-[#0A0C10] text-slate-400 border-[#1F2937]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className={`flex items-center justify-center sm:justify-start space-x-2 font-bold font-serif ${
              theme === 'light-professional' ? 'text-slate-900' : 'text-white'
            }`}>
              <span className="text-[#10B981]">KAIZENBROS</span>
              <span>- {centreInfo.nama}</span>
              <span className={`text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded border ${
                theme === 'light-professional' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' 
                  : 'bg-[#1F2937] border-[#374151]'
              }`}>
                Berlesen KKM
              </span>
            </div>
            <p className={`text-[11px] ${
              theme === 'light-professional' ? 'text-slate-600' : 'text-slate-400'
            }`}>{centreInfo.alamat}</p>
          </div>

          <div className={`flex flex-wrap items-center justify-center gap-6 text-[11px] ${
            theme === 'light-professional' ? 'text-slate-700' : 'text-slate-400'
          }`}>
            <span>Telefon: <strong className={theme === 'light-professional' ? 'text-slate-900' : 'text-slate-200'}>{centreInfo.telefonUtama}</strong></span>
            <span>Kecemasan 24 Jam: <strong className="text-rose-500 font-bold">{centreInfo.talianKecemasan24Jam}</strong></span>
            <span>WhatsApp: <strong className="text-emerald-500 font-bold">+{centreInfo.whatsappRasmi}</strong></span>

            {/* Admin Portal Login Link in Footer as requested */}
            {!isAdminAuthenticated ? (
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                id="btn-footer-admin-login"
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-950 via-[#1E1B4B] to-slate-900 hover:from-amber-900 hover:to-indigo-950 text-amber-300 border border-amber-500/60 rounded-xl text-xs font-bold shadow-lg transition cursor-pointer hover:scale-[1.03]"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>🔐 Log Masuk Admin / Portal Staf</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-300 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sesi Admin Aktif: <strong>{currentAdminStaff?.nama.split(' ')[0]}</strong></span>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Patient Quick Lookup Modal */}
      <PatientQuickLookupModal
        isOpen={isQuickLookupOpen}
        onClose={() => setIsQuickLookupOpen(false)}
        patients={patients}
        sessions={sessions}
        bloodTests={bloodTests}
        doctorVisits={doctorVisits}
      />

      {/* Admin Security Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        staffList={staff}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Pre-Registration Modal */}
      <PreRegistrationModal
        isOpen={isPreRegModalOpen}
        onClose={() => setIsPreRegModalOpen(false)}
        onAddPreRegisteredPatient={(newPre) => {
          setPreRegisteredPatients((prev) => [newPre, ...prev]);
        }}
      />

      {/* Job Vacancy Quick Application Modal */}
      <JobApplicationModal
        isOpen={isJobAppModalOpen}
        onClose={() => setIsJobAppModalOpen(false)}
        vacancies={jobVacancies}
        onAddJobApplication={handleAddJobApplication}
        selectedVacancy={selectedVacancyForApp}
      />

      {/* System Data Backup & Restore Modal (JSON 5-Year Compliance) */}
      <SystemBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        patients={patients}
        sessions={sessions}
        bloodTests={bloodTests}
        doctorVisits={doctorVisits}
        transactions={transactions}
        notifications={notifications}
        preRegisteredPatients={preRegisteredPatients}
        shifts={shifts}
        centreInfo={centreInfo}
        onRestoreData={handleRestoreData}
        onResetFreshStart={handleResetFreshStart}
      />

      {/* Official Emergency Hospital Referral Letter Generator */}
      <HospitalReferralLetterModal
        isOpen={isHospitalReferralModalOpen}
        onClose={() => setIsHospitalReferralModalOpen(false)}
        patients={patients}
        centreInfo={centreInfo}
        staffList={staff}
        preSelectedPatient={selectedPatientForReferral}
      />

      {/* Multi-Level Admin Access (RBAC) & Page Visibility Management Modal for Super Admin */}
      <AdminRoleManagementModal
        isOpen={isAdminRoleModalOpen}
        onClose={() => setIsAdminRoleModalOpen(false)}
        staffList={staff}
        currentAdminStaff={currentAdminStaff}
        onUpdateStaffList={(updatedStaff) => {
          setStaff(updatedStaff);
          // If current logged in staff got updated, sync currentAdminStaff
          if (currentAdminStaff) {
            const fresh = updatedStaff.find(s => s.id === currentAdminStaff.id);
            if (fresh) setCurrentAdminStaff(fresh);
          }
        }}
        adminPageVisibility={adminPageVisibility}
        onUpdatePageVisibility={handleUpdatePageVisibility}
        initialActiveTab={adminRoleModalTab}
      />

      {/* Staff Self-Profile & Login Update Modal */}
      <StaffSelfProfileModal
        isOpen={isSelfProfileModalOpen}
        onClose={() => setIsSelfProfileModalOpen(false)}
        currentStaff={currentAdminStaff}
        onUpdateStaffProfile={(updatedStaff) => {
          const updatedList = staff.map(s => s.id === updatedStaff.id ? updatedStaff : s);
          setStaff(updatedList);
          setCurrentAdminStaff(updatedStaff);
        }}
      />

      {/* Floating Auto-Backup Firestore Toast */}
      {autoSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border-2 border-emerald-400 text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3.5 animate-bounce-short">
          <div className="p-2 bg-emerald-950 rounded-xl text-emerald-400 border border-emerald-600/60 shrink-0">
            <Cloud className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black text-emerald-300 uppercase font-mono tracking-wider">
                Auto-Backup Firestore
              </span>
              <span className="text-[10px] text-slate-400 font-mono">({autoSaveToast.time})</span>
            </div>
            <p className="text-xs font-bold text-white mt-0.5">
              Data Disimpan ke Cloud • Selamat
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
