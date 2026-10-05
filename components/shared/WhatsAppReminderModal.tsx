'use client';

import React from 'react';
import { Patient } from '@/types';
import { MessageSquare, PhoneCall, X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-[#050B18]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0E1A30] border-2 border-teal-500 rounded-3xl max-w-md w-full p-6 sm:p-7 text-white space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1F385C] pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-950 text-teal-400 border border-teal-700 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Peringatan WhatsApp</h3>
              <p className="text-xs text-teal-300 font-bold">Pusat Dialisis KaizenBros</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#132238] hover:bg-[#1E3352] text-white font-bold flex items-center justify-center cursor-pointer text-xl"
          >
            ✕
          </button>
        </div>

        <div className="bg-[#0B132B] border border-[#1F385C] rounded-2xl p-4 space-y-1.5 text-sm">
          <span className="text-slate-400 block text-xs font-semibold uppercase">Maklumat Pesakit:</span>
          <p className="text-white font-black text-base">{patient.name}</p>
          <p className="text-cyan-300 font-mono text-sm">{patient.phone}</p>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed">
          Peringatan jadual sesi rawatan dialisis akan dihantar terus ke akaun WhatsApp pesakit ini.
        </p>

        <div className="flex space-x-3 pt-2">
          <button 
            onClick={onClose} 
            className="flex-1 min-h-[50px] py-3 bg-[#132238] hover:bg-[#1E3352] text-slate-200 font-bold text-sm rounded-xl cursor-pointer border border-[#1F385C]"
          >
            Batal
          </button>
          <a 
            href={`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}?text=Salam%20${encodeURIComponent(patient.name)},%20ini%20adalah%20peringatan%20sesi%20dialisis%20anda%20di%20Pusat%20Dialisis%20KaizenBros%20Semenyih.`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 min-h-[50px] py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl text-center flex items-center justify-center shadow-lg"
          >
            Hantar WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
