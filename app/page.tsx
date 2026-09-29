'use client';

import React, { useState } from 'react';
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
  INITIAL_AUDIT_LOGS 
} from '@/lib/mock-data';
import { AuditLog } from '@/types';

export default function Home() {
  const [currentView, setCurrentView] = useState<'public' | 'patient' | 'nurse' | 'admin' | 'database' | 'registration'>('patient');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const demoPatient = INITIAL_PATIENTS[0]; // Ahmad bin Ali (P00123)
  const demoSession = INITIAL_TODAY_SESSIONS[0]; // Ahmad bin Ali's 2:00 PM session in B-08
  const demoMeds = INITIAL_PATIENT_MEDICATIONS;
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        activePatientName={demoPatient.name}
        activeNurseName={demoNurseName}
      />

      <div className="flex-1">
        {currentView === 'public' && (
          <PublicWebsite
            onLoginAsPatient={() => setCurrentView('patient')}
            onLoginAsNurse={() => setCurrentView('nurse')}
            onLoginAsAdmin={() => setCurrentView('admin')}
            onOpenRegistration={() => setCurrentView('registration')}
          />
        )}

        {currentView === 'registration' && (
          <NewPatientRegistration
            onBackToPublic={() => setCurrentView('public')}
            onSuccessRedirect={() => setCurrentView('patient')}
            onNewRegistrationSubmitted={(newReg) => {
              handleAuditLog('PENDAFTARAN_BARU', `Pendaftaran pesakit baru diterima: ${newReg.full_name} (${newReg.id})`);
            }}
          />
        )}

        {currentView === 'patient' && (
          <PatientPortal
            patient={demoPatient}
            session={demoSession}
            medications={demoMeds}
          />
        )}

        {currentView === 'nurse' && (
          <NursePortal
            currentNurseName={demoNurseName}
            onAuditLog={handleAuditLog}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            auditLogs={auditLogs}
            onAuditLog={handleAuditLog}
          />
        )}

        {currentView === 'database' && (
          <DatabaseExplorer />
        )}
      </div>
    </div>
  );
}
