'use client';

import React from 'react';
import { Patient } from '@/types';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onLogAudit?: (action: string, details: string) => void;
  onNavigateToSettings?: () => void;
}

export function WhatsAppReminderModal({ isOpen, onClose, patient }: WhatsAppReminderModalProps) {
  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl max-w-md w-full p-6 text-white space-y-4">
        <h3 className="text-xl font-bold">Hantar Peringatan WhatsApp</h3>
        <p className="text-sm text-slate-300">Peringatan sesi rawatan dialisis untuk {patient.name} ({patient.phone})</p>
        <div className="flex space-x-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-800 rounded-xl font-bold text-sm">Batal</button>
          <a 
            href={`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}?text=Peringatan%20sesi%20dialisis%20KaizenBros%20Semenyih.`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2 bg-emerald-600 rounded-xl font-bold text-sm text-center"
          >
            Hantar WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
