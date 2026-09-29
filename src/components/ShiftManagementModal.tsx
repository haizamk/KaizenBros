import React, { useState } from 'react';
import { ShiftConfig } from '../types';
import { Clock, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X, Power, Sparkles, Sliders } from 'lucide-react';

interface ShiftManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: ShiftConfig[];
  onAddShift: (shift: ShiftConfig) => void;
  onUpdateShift: (shift: ShiftConfig) => void;
  onDeleteShift: (shiftId: string) => void;
}

export const ShiftManagementModal: React.FC<ShiftManagementModalProps> = ({
  isOpen,
  onClose,
  shifts = [],
  onAddShift,
  onUpdateShift,
  onDeleteShift
}) => {
  const safeShifts = Array.isArray(shifts) ? shifts : [];

  const [editingShift, setEditingShift] = useState<ShiftConfig | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // New shift form state
  const [formData, setFormData] = useState({
    kod: '',
    label: '',
    masaMula: '20:30',
    masaTamat: '00:30',
    keterangan: 'Sesi rawatan hemodialisis tambahan'
  });

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleSaveNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kod.trim() || !formData.label.trim()) return;

    const newKodUpper = formData.kod.trim().toUpperCase().replace(/\s+/g, '_');

    // Check if kod already exists
    if (safeShifts.some((s) => s.kod === newKodUpper)) {
      showNotification(`Kod shift "${newKodUpper}" telah wujud. Sila guna kod lain.`);
      return;
    }

    const newShiftObj: ShiftConfig = {
      id: `SHIFT-${Date.now().toString().slice(-4)}`,
      kod: newKodUpper,
      label: formData.label.trim(),
      masaMula: formData.masaMula,
      masaTamat: formData.masaTamat,
      aktif: true,
      keterangan: formData.keterangan.trim()
    };

    onAddShift(newShiftObj);
    setShowAddForm(false);
    setFormData({
      kod: '',
      label: '',
      masaMula: '20:30',
      masaTamat: '00:30',
      keterangan: 'Sesi rawatan hemodialisis tambahan'
    });
    showNotification(`Shift baru "${newShiftObj.label}" berjaya ditambah!`);
  };

  const handleSaveEditedShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    onUpdateShift(editingShift);
    setEditingShift(null);
    showNotification(`Waktu shift "${editingShift.label}" berjaya dikemaskini.`);
  };

  const handleToggleActive = (shift: ShiftConfig) => {
    const updated = { ...shift, aktif: !shift.aktif };
    onUpdateShift(updated);
    showNotification(`Status shift "${shift.label}" ditukar kepada ${updated.aktif ? 'AKTIF' : 'NYAHAKTIF'}.`);
  };

  const handleDelete = (shift: ShiftConfig) => {
    if (safeShifts.length <= 1) {
      showNotification('Sistem mesti mempunyai sekurang-kurangnya 1 waktu shift.');
      return;
    }
    if (window.confirm(`Adakah anda pasti untuk memadamkan shift "${shift.label}"?`)) {
      onDeleteShift(shift.id);
      showNotification(`Shift "${shift.label}" telah dipadamkan.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#111827] border border-[#1F2937] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8 animate-fadeIn text-[#E2E8F0]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#111827] to-cyan-950 p-6 border-b border-[#1F2937] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Pengurusan Waktu 'Shift' Dinamik</span>
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-md font-mono uppercase">
                  Admin Control
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ubah masa mula/tamat sesi, tambah shift malam/khas, atau aktifkan/nyahaktifkan masa operasi mengikut keperluan pusat.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-shift-modal"
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1F2937] rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {statusMsg && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Quick Action bar */}
          <div className="flex items-center justify-between bg-[#1F2937]/50 p-4 rounded-xl border border-[#374151]">
            <div>
              <h3 className="text-sm font-bold text-white">Senarai Waktu Shift Konfigurasi</h3>
              <p className="text-xs text-slate-400">Sistem mengemaskini jadual rawatan secara langsung berdasarkan konfigurasi di bawah.</p>
            </div>

            {!showAddForm && !editingShift && (
              <button
                onClick={() => setShowAddForm(true)}
                id="btn-show-add-shift-form"
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Shift Baru</span>
              </button>
            )}
          </div>

          {/* ADD NEW SHIFT FORM */}
          {showAddForm && (
            <form onSubmit={handleSaveNewShift} className="bg-emerald-950/30 border border-emerald-800/50 p-5 rounded-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-emerald-800/30 pb-2">
                <h4 className="text-sm font-bold text-emerald-300 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Borang Tambah Shift / Waktu Dialisis Baru</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kod Unik Shift (Contoh: MALAM / EXTRA)</label>
                  <input
                    type="text"
                    required
                    placeholder="MALAM"
                    value={formData.kod}
                    onChange={(e) => setFormData({ ...formData, kod: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama / Paparan Shift</label>
                  <input
                    type="text"
                    required
                    placeholder="Sesi 4 (Malam / On-Call)"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Waktu Mula (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={formData.masaMula}
                    onChange={(e) => setFormData({ ...formData, masaMula: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Waktu Tamat (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={formData.masaTamat}
                    onChange={(e) => setFormData({ ...formData, masaTamat: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Keterangan / Nota Operasi</label>
                  <input
                    type="text"
                    placeholder="Sesi rawatan hemodialisis malam bagi pesakit bekerja"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold"
                >
                  Simpan Shift Baru
                </button>
              </div>
            </form>
          )}

          {/* EDIT SHIFT FORM */}
          {editingShift && (
            <form onSubmit={handleSaveEditedShift} className="bg-cyan-950/30 border border-cyan-800/50 p-5 rounded-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-cyan-800/30 pb-2">
                <h4 className="text-sm font-bold text-cyan-300 flex items-center space-x-1.5">
                  <Edit2 className="w-4 h-4 text-cyan-400" />
                  <span>Kemaskini Waktu Operasi: {editingShift.label} ({editingShift.kod})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingShift(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama / Label Shift</label>
                  <input
                    type="text"
                    required
                    value={editingShift.label}
                    onChange={(e) => setEditingShift({ ...editingShift, label: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Keterangan</label>
                  <input
                    type="text"
                    value={editingShift.keterangan || ''}
                    onChange={(e) => setEditingShift({ ...editingShift, keterangan: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Waktu Mula (Masa Tempatan)</label>
                  <input
                    type="time"
                    required
                    value={editingShift.masaMula}
                    onChange={(e) => setEditingShift({ ...editingShift, masaMula: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Waktu Tamat (Masa Tempatan)</label>
                  <input
                    type="time"
                    required
                    value={editingShift.masaTamat}
                    onChange={(e) => setEditingShift({ ...editingShift, masaTamat: e.target.value })}
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingShift(null)}
                  className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold"
                >
                  Simpan Perubahan Masa
                </button>
              </div>
            </form>
          )}

          {/* LIST OF SHIFTS */}
          <div className="space-y-3">
            {safeShifts.map((sh) => (
              <div
                key={sh.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  sh.aktif
                    ? 'bg-[#1F2937]/70 border-[#374151]'
                    : 'bg-[#111827]/40 border-[#1F2937] opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{sh.label}</span>
                    <span className="text-[10px] bg-[#111827] text-slate-300 px-2 py-0.5 rounded font-mono border border-[#374151]">
                      {sh.kod}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sh.aktif
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      {sh.aktif ? 'AKTIF' : 'NYAHAKTIF'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-300 font-mono">
                    <div className="flex items-center space-x-1 text-emerald-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sh.masaMula} – {sh.masaTamat}</span>
                    </div>
                    {sh.keterangan && (
                      <span className="text-slate-400 font-sans truncate max-w-xs">
                        • {sh.keterangan}
                      </span>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(sh)}
                    title={sh.aktif ? 'Nyahaktifkan Shift' : 'Aktifkan Shift'}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center space-x-1 cursor-pointer ${
                      sh.aktif
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800/40 hover:bg-amber-900/60'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{sh.aktif ? 'Tukar Nyahaktif' : 'Aktifkan'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingShift(sh);
                      setShowAddForm(false);
                    }}
                    title="Ubah Waktu Operasi"
                    className="p-1.5 bg-[#111827] hover:bg-[#374151] text-cyan-300 border border-[#374151] rounded-lg transition cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(sh)}
                    title="Padam Shift"
                    className="p-1.5 bg-[#111827] hover:bg-rose-950 text-rose-400 border border-[#374151] hover:border-rose-800/60 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#1F2937]/50 p-4 border-t border-[#1F2937] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-emerald-400" />
            <span>Perubahan waktu shift akan berkuatkuasa secara automatik di matriks jadual dan peringatan pesakit.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#111827] hover:bg-[#374151] text-white font-bold rounded-lg border border-[#374151] transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
