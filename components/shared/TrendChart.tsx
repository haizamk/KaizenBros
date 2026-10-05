'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { MedicalRecord, Patient } from '@/types';

interface TrendChartProps {
  medicalRecords: MedicalRecord[];
  patient: Patient;
}

type DurationInterval = '3_bulan' | '6_bulan' | '9_bulan' | '12_bulan' | '2_tahun' | '3_tahun' | '5_tahun' | 'semua';
type ParameterId = 'hemoglobin' | 'urea' | 'creatinine';

export function TrendChart({ medicalRecords = [], patient }: TrendChartProps) {
  const [mounted, setMounted] = useState(false);
  const [duration, setDuration] = useState<DurationInterval>('12_bulan');
  const [paramId, setParamId] = useState<ParameterId>('hemoglobin');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-[#0B1528] border-2 border-[#1E3B60] rounded-3xl p-6 min-h-[300px] flex items-center justify-center">
        <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  // Filter records specifically for the active patient
  const patientRecords = medicalRecords
    .filter(r => r.patient_id === patient?.id || String(r.patient_id) === String(patient?.id) || (r.patient_id_code && patient?.patient_id_code && r.patient_id_code === patient.patient_id_code))
    .sort((a, b) => new Date(a.examination_date).getTime() - new Date(b.examination_date).getTime()); // oldest first for chronological trends

  // Helper for parameter details
  const paramConfig = {
    hemoglobin: {
      label: 'Hemoglobin (Hb)',
      unit: 'g/dL',
      targetMin: 10.0,
      targetMax: 15.0,
      targetStr: '10.0 - 15.0 g/dL',
      color: '#ef4444',
      getValue: (r: MedicalRecord) => r.blood_results?.hematology?.hemoglobin ? Number(r.blood_results.hematology.hemoglobin) : null
    },
    urea: {
      label: 'Urea',
      unit: 'mmol/L',
      targetMin: 2.5,
      targetMax: 7.8,
      targetStr: '2.5 - 7.8 mmol/L',
      color: '#06b6d4',
      getValue: (r: MedicalRecord) => r.blood_results?.renal?.urea ? Number(r.blood_results.renal.urea) : null
    },
    creatinine: {
      label: 'Kreatinin (Creatinine)',
      unit: 'µmol/L',
      targetMin: 60,
      targetMax: 110,
      targetStr: '60 - 110 µmol/L',
      color: '#ec4899',
      getValue: (r: MedicalRecord) => r.blood_results?.renal?.creatinine ? Number(r.blood_results.renal.creatinine) : null
    }
  };

  const activeParam = paramConfig[paramId];

  // Filter records by duration
  const now = new Date();
  const filteredRecords = patientRecords.filter(r => {
    const examDate = new Date(r.examination_date);
    const diffTime = Math.abs(now.getTime() - examDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (duration === '3_bulan') return diffDays <= 90;
    if (duration === '6_bulan') return diffDays <= 180;
    if (duration === '9_bulan') return diffDays <= 270;
    if (duration === '12_bulan') return diffDays <= 365;
    if (duration === '2_tahun') return diffDays <= 730;
    if (duration === '3_tahun') return diffDays <= 1095;
    if (duration === '5_tahun') return diffDays <= 1825;
    return true; // semua
  });

  // Map to chart data structure
  // CRITICAL REQUIREMENT: "pastikan hanya data sebenar yg di upload di paparan. -tidak perlu masukkan data andaian atau demo data"
  const chartData = filteredRecords
    .map(r => {
      const val = activeParam.getValue(r);
      return {
        dateStr: new Date(r.examination_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: '2-digit' }),
        rawDate: new Date(r.examination_date),
        value: val,
        recordId: r.id
      };
    })
    .filter(p => p.value !== null && !isNaN(p.value)); // Only include real data points!

  const durations: Array<{ id: DurationInterval; label: string }> = [
    { id: '3_bulan', label: '3 Bln' },
    { id: '6_bulan', label: '6 Bln' },
    { id: '9_bulan', label: '9 Bln' },
    { id: '12_bulan', label: '12 Bln' },
    { id: '2_tahun', label: '2 Thn' },
    { id: '3_tahun', label: '3 Thn' },
    { id: '5_tahun', label: '5 Thn' },
    { id: 'semua', label: 'Semua' }
  ];

  const params: Array<{ id: ParameterId; label: string; unit: string }> = [
    { id: 'hemoglobin', label: 'Hemoglobin (Hb)', unit: 'g/dL' },
    { id: 'urea', label: 'Urea', unit: 'mmol/L' },
    { id: 'creatinine', label: 'Kreatinin (Creatinine)', unit: 'µmol/L' }
  ];

  return (
    <div className="bg-[#0B1528] border-2 border-[#1E3B60] rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2.5 text-cyan-400">
          <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          <div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">📈 Grafik Trend Keputusan Makmal (Recharts)</h3>
            <p className="text-xs text-slate-300">Visualisasi trend data makmal sebenar untuk parameter kritikal rawatan</p>
          </div>
        </div>

        {/* Intervals */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-max max-w-full">
          {durations.map(d => (
            <button
              key={d.id}
              onClick={() => setDuration(d.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                duration === d.id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parameter Buttons Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {params.map(p => (
          <button
            key={p.id}
            onClick={() => setParamId(p.id)}
            className={`p-3 rounded-2xl text-xs font-black transition-all border text-center cursor-pointer flex flex-col items-center justify-center space-y-1 ${
              paramId === p.id
                ? 'bg-[#122c4d] border-cyan-500 text-cyan-300 shadow-inner'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span className="block font-bold">{p.label}</span>
            <span className="text-[10px] text-slate-400 font-mono">({p.unit})</span>
          </button>
        ))}
      </div>

      {/* Recharts Render Container */}
      <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 relative">
        <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2 mb-4 font-black">
          <span className="text-slate-300 uppercase tracking-wide">
            Graf: {activeParam.label} ({activeParam.unit})
          </span>
          <span className="text-cyan-400 font-bold bg-[#11243b] px-2.5 py-0.5 rounded border border-[#1d3d5e]">
            Julat Sasaran Standard: {activeParam.targetStr}
          </span>
        </div>

        {chartData.length < 2 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center space-y-2">
            <Activity className="w-8 h-8 text-slate-700 animate-pulse" />
            <p className="text-xs text-slate-400 font-bold">Data sebenar tidak mencukupi untuk melukis trend ({chartData.length}/2 keputusan pemeriksaan)</p>
            <p className="text-[10px] text-slate-500">Hanya rekod ujian darah sebenar yang diupload dalam sistem akan dipaparkan.</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="dateStr" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight="bold" 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight="bold" 
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isNormal = Number(data.value) >= activeParam.targetMin && Number(data.value) <= activeParam.targetMax;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-slate-200">
                          <p className="font-bold text-white font-mono">Tarikh: {data.dateStr}</p>
                          <p className="font-extrabold flex items-center gap-1.5" style={{ color: activeParam.color }}>
                            Nilai: {data.value} {activeParam.unit}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isNormal ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                              {isNormal ? 'Normal' : 'Luar Julat'}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400">ID Rekod: {data.recordId}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Reference line for normal threshold boundaries */}
                <ReferenceLine 
                  y={activeParam.targetMax} 
                  stroke="#e11d48" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Had Tinggi', fill: '#e11d48', fontSize: 8, fontWeight: 'bold', position: 'insideTopRight' }} 
                />
                <ReferenceLine 
                  y={activeParam.targetMin} 
                  stroke="#059669" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Had Rendah', fill: '#059669', fontSize: 8, fontWeight: 'bold', position: 'insideBottomRight' }} 
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={activeParam.color}
                  strokeWidth={3}
                  activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2 }}
                  dot={{ r: 5, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
