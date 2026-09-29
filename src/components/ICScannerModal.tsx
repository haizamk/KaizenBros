import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Zap, 
  ZapOff,
  SwitchCamera,
  CreditCard,
  Check
} from 'lucide-react';

export interface ExtractedICData {
  nama: string;
  noIC: string;
  jantina?: string;
  alamat?: string;
  tarikhLahir?: string;
}

interface ICScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: ExtractedICData) => void;
}

export const ICScannerModal: React.FC<ICScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [extractedResult, setExtractedResult] = useState<ExtractedICData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stop current camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setTorchOn(false);
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setErrorMessage(null);

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Pelayar anda tidak menyokong akses kamera media.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch((e) => console.warn('Video play warning:', e));
      }

      // Check for torch capability
      const videoTrack = newStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as any) : {};
      if (capabilities.torch) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Gagal mengakses kamera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Kebenaran akses kamera ditolak. Sila berikan kebenaran kamera dalam tetapan pelayar anda, atau muat naik gambar IC.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Tiada peranti kamera dikesan pada komputer/telefon anda. Sila gunakan fungsi muat naik gambar.';
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  }, [facingMode, stream]);

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      const newTorchState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: newTorchState }]
      });
      setTorchOn(newTorchState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Toggle Camera Facing Mode
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Trigger camera start when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera('environment');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Handle modal close
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setExtractedResult(null);
    setErrorMessage(null);
    setIsProcessing(false);
    onClose();
  };

  // Capture current frame from camera
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // Stop camera stream to freeze
    stopCamera();
    setCapturedImage(dataUrl);

    // Automatically analyze with AI
    analyzeImageWithAI(dataUrl);
  };

  // Upload file fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        stopCamera();
        setCapturedImage(dataUrl);
        analyzeImageWithAI(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Send image to /api/scan-ic
  const analyzeImageWithAI = async (imageDataUrl: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessStep('Menghubungi Enjin AI Gemini 3.8 Flash...');

    try {
      setProcessStep('Mengekstrak teks & nombor MyKad...');
      
      const response = await fetch('/api/scan-ic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          mimeType: 'image/jpeg'
        })
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengekstrak maklumat daripada kad pengenalan.');
      }

      const extracted: ExtractedICData = json.data;

      if (!extracted.nama && !extracted.noIC) {
        throw new Error('Maklumat kad pengenalan tidak dapat dibaca dengan jelas. Sila pastikan pencahayaan terang dan kad berada dalam bingkai.');
      }

      setProcessStep('Pengekstrakan berjaya diselesaikan!');
      setExtractedResult(extracted);
    } catch (err: any) {
      console.error('Scan IC processing error:', err);
      setErrorMessage(err.message || 'Ralat berlaku semasa memproses imej.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedResult(null);
    setErrorMessage(null);
    startCamera(facingMode);
  };

  // Apply extracted data to the registration form
  const handleApplyData = () => {
    if (extractedResult) {
      onScanComplete(extractedResult);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="ic-scanner-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      <div 
        id="ic-scanner-container"
        className="bg-[#0B1329] border border-emerald-500/40 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Camera className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Imbas Kad Pengenalan (MyKad)</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-700/60 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" /> AI OCR
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Akses kamera untuk mengekstrak Nama & No. IC secara automatik ke dalam borang.
              </p>
            </div>
          </div>

          <button
            id="btn-close-ic-scanner"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[340px] max-h-[500px]">
          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden File Input for fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* STATE 1: Camera Active */}
          {!capturedImage && cameraActive && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* IC Guide Frame Overlay (Standard Malaysian MyKad Ratio ~ 85.6mm x 53.98mm = ~1.58) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                <div className="relative w-full max-w-[420px] aspect-[1.58/1] rounded-2xl border-2 border-dashed border-emerald-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex flex-col justify-between p-4">
                  {/* Corner Accent Brackets */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Header Guide Label */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm self-center">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      Letakkan Kad Pengenalan di Dalam Bingkai
                    </span>
                  </div>

                  {/* Laser Scan Animation Line */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse" 
                       style={{ top: '48%' }}
                  />

                  {/* Footer Hint */}
                  <div className="text-center text-[10px] text-slate-300 font-medium bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm self-center">
                    Pastikan nama dan 12-digit nombor IC jelas & tidak silau
                  </div>
                </div>
              </div>

              {/* Top Quick Controls Overlay */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2.5 rounded-xl backdrop-blur-md border text-xs font-bold flex items-center transition ${
                      torchOn 
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30' 
                        : 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800'
                    }`}
                    title="Lampu Flash"
                  >
                    {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4 text-slate-400" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md text-xs font-bold transition"
                  title="Tukar Kamera Depan/Belakang"
                >
                  <SwitchCamera className="w-4 h-4 text-teal-400" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: Captured Image Preview */}
          {capturedImage && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img 
                src={capturedImage} 
                alt="Captured MyKad" 
                className="max-w-full max-h-[440px] object-contain"
              />

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Enjin AI Sedang Mengekstrak Maklumat MyKad...
                  </h4>
                  <p className="text-xs text-emerald-400 font-medium">
                    {processStep}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STATE 3: Camera Error or Disabled */}
          {!capturedImage && !cameraActive && cameraError && (
            <div className="p-8 text-center max-w-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-600/50 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Akses Kamera Diperlukan</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {cameraError}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cuba Akses Kamera Semula</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-teal-400" />
                  <span>Muat Naik Imej IC Fail</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Data Result Card (if ready) */}
        {extractedResult && !isProcessing && (
          <div className="p-4 bg-emerald-950/40 border-t border-emerald-700/50 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Maklumat Berjaya Dikesan oleh AI:
              </span>
              <span className="text-[11px] text-slate-400">Sila semak & tekan 'Gunakan Maklumat Ini'</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0F172A] p-3 rounded-xl border border-emerald-800/40 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nama Penuh</span>
                <span className="text-white font-bold text-sm tracking-wide">
                  {extractedResult.nama || <span className="text-amber-400 italic">Tidak dapat dibaca</span>}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">No. Kad Pengenalan</span>
                <span className="text-emerald-400 font-mono font-black text-sm">
                  {extractedResult.noIC || <span className="text-amber-400 italic">Tidak dapat dibaca</span>}
                </span>
              </div>
              {extractedResult.jantina && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Jantina</span>
                  <span className="text-slate-200 font-medium">{extractedResult.jantina}</span>
                </div>
              )}
              {extractedResult.tarikhLahir && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tarikh Lahir</span>
                  <span className="text-slate-200 font-medium font-mono">{extractedResult.tarikhLahir}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error message card */}
        {errorMessage && !isProcessing && (
          <div className="p-4 bg-rose-950/60 border-t border-rose-800/60 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-bold text-rose-300 block">Pengekstrakan Tidak Berjaya</span>
              <p className="text-rose-200/90 mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={handleRetake}
              className="px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Imbas Semula
            </button>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0B1329] flex flex-wrap items-center justify-between gap-3">
          {/* Left: Upload file fallback */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>Muat Naik Foto IC</span>
          </button>

          {/* Right: Camera Trigger / Retake / Apply */}
          <div className="flex items-center gap-2">
            {!capturedImage && cameraActive && (
              <button
                type="button"
                id="btn-capture-ic"
                onClick={handleCapture}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2 cursor-pointer border border-emerald-300/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>Tangkap & Imbas AI</span>
              </button>
            )}

            {capturedImage && (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ambil Semula</span>
                </button>

                {extractedResult && (
                  <button
                    type="button"
                    id="btn-apply-ic-data"
                    onClick={handleApplyData}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2 cursor-pointer border border-emerald-300/40"
                  >
                    <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                    <span>Gunakan Maklumat Ini</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
