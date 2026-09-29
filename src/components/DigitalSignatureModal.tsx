import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RefreshCw, PenTool, ShieldCheck, UserCheck, FileSignature, Trash2, Award } from 'lucide-react';
import { DigitalSignatureData } from '../types';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (signatureData: DigitalSignatureData) => void;
  initialSignature?: DigitalSignatureData | null;
  patientName?: string;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
  initialSignature,
  patientName = 'Pesakit'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#0F172A'); // Default dark navy
  const [penWidth, setPenWidth] = useState(3);
  const [signerName, setSignerName] = useState('Dr. Sarah binti Mohamad Noor');
  const [signerRole, setSignerRole] = useState('Pakar Nefrologi / Pengarah Perubatan (MMC 59402)');
  const [presetType, setPresetType] = useState<'CANVAS' | 'DR_SARAH' | 'SISTER_HANIM'>('CANVAS');

  useEffect(() => {
    if (isOpen) {
      if (initialSignature && initialSignature.signatureImage) {
        setSignerName(initialSignature.signerName);
        setSignerRole(initialSignature.signerRole);
        loadSignatureImageToCanvas(initialSignature.signatureImage);
      } else {
        clearCanvas();
      }
    }
  }, [isOpen, initialSignature]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw subtle grid line for signature alignment
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 35);
    ctx.lineTo(canvas.width - 30, canvas.height - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    setHasDrawn(false);
    setPresetType('CANVAS');
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height)
      };
    } else if ('clientX' in e) {
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const loadPresetSignature = (type: 'DR_SARAH' | 'SISTER_HANIM') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw baseline
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 35);
    ctx.lineTo(canvas.width - 30, canvas.height - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'DR_SARAH') {
      setSignerName('Dr. Sarah binti Mohamad Noor');
      setSignerRole('Pakar Nefrologi / Pengarah Perubatan (MMC 59402)');

      // Draw stylized Dr. Sarah signature loop
      ctx.beginPath();
      // "Dr. S" loop
      ctx.moveTo(50, 75);
      ctx.bezierCurveTo(40, 20, 90, 20, 70, 70);
      ctx.bezierCurveTo(60, 110, 110, 110, 100, 70);
      // "arah" flow
      ctx.quadraticCurveTo(120, 85, 140, 75);
      ctx.quadraticCurveTo(155, 65, 170, 80);
      ctx.quadraticCurveTo(185, 90, 200, 75);
      // Flourish swoop under
      ctx.bezierCurveTo(220, 50, 250, 60, 270, 80);
      ctx.moveTo(60, 100);
      ctx.bezierCurveTo(120, 120, 240, 115, 320, 95);
      ctx.stroke();

    } else if (type === 'SISTER_HANIM') {
      setSignerName('Sister Hanim binti Ahmad');
      setSignerRole('Pengurus Jururawat Dialisis (LJM 18204)');

      // Draw Sister Hanim signature loop
      ctx.beginPath();
      ctx.moveTo(60, 80);
      ctx.bezierCurveTo(50, 30, 95, 30, 80, 85);
      ctx.bezierCurveTo(110, 50, 130, 90, 150, 70);
      ctx.quadraticCurveTo(170, 60, 190, 85);
      ctx.bezierCurveTo(200, 105, 250, 105, 310, 85);
      ctx.moveTo(70, 105);
      ctx.quadraticCurveTo(180, 120, 290, 100);
      ctx.stroke();
    }

    setHasDrawn(true);
    setPresetType(type);
  };

  const loadSignatureImageToCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHasDrawn(true);
    };
    img.src = dataUrl;
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const dataUrl = canvas.toDataURL('image/png');
    const now = new Date();

    const timestampStr = now.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const randomRef = Math.floor(1000 + Math.random() * 9000);
    const signatureId = `DS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${randomRef}`;

    const signatureData: DigitalSignatureData = {
      signatureImage: dataUrl,
      signerName: signerName || 'Dr. Sarah binti Mohamad Noor',
      signerRole: signerRole || 'Pakar Nefrologi (MMC 59402)',
      signedAt: timestampStr,
      signatureId: signatureId,
      isVerified: true
    };

    onSaveSignature(signatureData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#0F172A] border border-[#374151] rounded-2xl w-full max-w-xl text-white shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#374151] flex items-center justify-between bg-[#1E293B]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>Pengesahan & Tandatangan Digital</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  e-Signature KKM
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sahkan laporan perubatan pesakit <strong>{patientName}</strong> secara digital.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Quick Presets / Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Pilihan Penandatangan / Preset Fast-Sign:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => loadPresetSignature('DR_SARAH')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center ${
                  presetType === 'DR_SARAH'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs'
                    : 'bg-[#1E293B] border-[#374151] text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold">Dr. Sarah binti Mohamad Noor</span>
                <span className="text-[10px] text-slate-400">Pakar Nefrologi (MMC 59402)</span>
              </button>

              <button
                type="button"
                onClick={() => loadPresetSignature('SISTER_HANIM')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center ${
                  presetType === 'SISTER_HANIM'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs'
                    : 'bg-[#1E293B] border-[#374151] text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold">Sister Hanim binti Ahmad</span>
                <span className="text-[10px] text-slate-400">Pengurus Jururawat (LJM 18204)</span>
              </button>

              <button
                type="button"
                onClick={clearCanvas}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition cursor-pointer text-center ${
                  presetType === 'CANVAS'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs'
                    : 'bg-[#1E293B] border-[#374151] text-slate-300 hover:bg-slate-800'
                }`}
              >
                <PenTool className="w-4 h-4 mb-1 text-emerald-400" />
                <span className="font-bold">Lukis Sendiri (Canvas)</span>
              </button>
            </div>
          </div>

          {/* Interactive Canvas Pad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-emerald-400" />
                Ruangan Lukis Tandatangan:
              </span>

              {/* Tools Controls */}
              <div className="flex items-center space-x-2">
                {/* Pen Colors */}
                <div className="flex items-center space-x-1 bg-[#1E293B] p-1 rounded-lg border border-[#374151]">
                  <button
                    type="button"
                    onClick={() => setPenColor('#0F172A')}
                    className={`w-4 h-4 rounded-full bg-slate-900 border ${penColor === '#0F172A' ? 'ring-2 ring-emerald-400' : ''}`}
                    title="Warna Hitam / Navy"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#047857')}
                    className={`w-4 h-4 rounded-full bg-emerald-600 border ${penColor === '#047857' ? 'ring-2 ring-emerald-400' : ''}`}
                    title="Warna Hijau Emerald"
                  />
                  <button
                    type="button"
                    onClick={() => setPenColor('#1E3A8A')}
                    className={`w-4 h-4 rounded-full bg-blue-800 border ${penColor === '#1E3A8A' ? 'ring-2 ring-emerald-400' : ''}`}
                    title="Warna Biru Dokumen"
                  />
                </div>

                {/* Clear Canvas */}
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2 py-1 bg-[#1E293B] hover:bg-slate-800 text-slate-300 rounded-lg border border-[#374151] text-[11px] flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Padam</span>
                </button>
              </div>
            </div>

            <div className="relative bg-white rounded-xl border-2 border-slate-300 overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-36 touch-none cursor-crosshair block"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                  Sila lukis tandatangan anda di sini menggunakan Tetikus atau Touchscreen
                </div>
              )}
            </div>
          </div>

          {/* Doctor Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Nama Penandatangan:</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 bg-[#1E293B] border border-[#374151] rounded-xl text-white focus:outline-hidden focus:border-emerald-500 font-bold"
                placeholder="cth: Dr. Sarah binti Mohamad Noor"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Jawatan & No. Kelayakan (MMC/LJM):</label>
              <input
                type="text"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                className="w-full px-3 py-2 bg-[#1E293B] border border-[#374151] rounded-xl text-white focus:outline-hidden focus:border-emerald-500 font-mono text-xs"
                placeholder="cth: Pakar Nefrologi (MMC 59402)"
              />
            </div>
          </div>

          {/* Digital Verification Notice */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start space-x-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-emerald-200 text-[11px] space-y-0.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>Pengesahan Integriti Laporan Perubatan</span>
              </div>
              <p className="text-emerald-300/80">
                Tandatangan digital ini akan disertakan dengan Cap Masa Sistem (Timestamp) dan Digital Signature ID rasmi bagi mengesahkan kesahihan rekod rawatan pesakit ini.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#374151] bg-[#1E293B] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs border border-[#374151] transition"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasDrawn}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition ${
              hasDrawn
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Sahkan & Tampal Tandatangan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
