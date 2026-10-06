'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Scale, TrendingDown, TrendingUp, Activity, Info, Award, Calendar } from 'lucide-react';
import { DialysisSession, Patient } from '@/types';

interface HistoricalWeightChartProps {
  patient?: Patient | null;
  sessions?: DialysisSession[];
  patientDryWeight?: number;
}

export interface WeightDataPoint {
  sessionNum: number;
  sessionLabel: string;
  dateStr: string;
  fullDate: string;
  preWeight: number;
  postWeight: number;
  dryWeight: number;
  fluidRemoved: number;
  preBp?: string;
  postBp?: string;
  isReal: boolean;
}

export function HistoricalWeightChart({
  patient,
  sessions = [],
  patientDryWeight = 66.0
}: HistoricalWeightChartProps) {
  const [mounted, setMounted] = useState(false);
  const [chartView, setChartView] = useState<'lines' | 'fluid' | 'table'>('lines');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute ONLY real recorded weight session data points
  const chartData = useMemo<WeightDataPoint[]>(() => {
    const targetDry = patient?.dry_weight_kg || patientDryWeight || 66.0;

    // Filter sessions matching current patient AND having ACTUAL pre or post weight recorded
    const filtered = (sessions || [])
      .filter(s => {
        if (!patient) return true;
        return (
          s.patient_id === patient.id ||
          (patient.patient_id_code && s.patient_id_code === patient.patient_id_code)
        );
      })
      .filter(s => Boolean(s.pre_weight_kg || s.post_weight_kg))
      .sort((a, b) => new Date(a.scheduled_date || 0).getTime() - new Date(b.scheduled_date || 0).getTime());

    // Take up to the last 12 actual recorded weight sessions
    const realSessions = filtered.slice(-12);

    // Map existing sessions strictly using real entered values
    return realSessions.map((s, idx) => {
      const pre = s.pre_weight_kg || targetDry;
      const post = s.post_weight_kg || targetDry;
      const fluid = s.actual_uf_litres || Number((Math.max(0, pre - post)).toFixed(1));
      const d = s.scheduled_date ? new Date(s.scheduled_date) : new Date();

      const dayStr = isNaN(d.getTime())
        ? `Sesi ${idx + 1}`
        : d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' });
      const fullDate = isNaN(d.getTime())
        ? `Sesi ${idx + 1}`
        : d.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });

      return {
        sessionNum: idx + 1,
        sessionLabel: dayStr,
        dateStr: dayStr,
        fullDate,
        preWeight: pre,
        postWeight: post,
        dryWeight: targetDry,
        fluidRemoved: fluid,
        preBp: s.pre_bp || '-',
        postBp: s.post_bp || '-',
        isReal: true
      };
    });
  }, [patient, sessions, patientDryWeight]);

  // Key stats derived from 12 sessions
  const stats = useMemo(() => {
    if (chartData.length === 0) return { avgFluid: 0, maxPre: 0, minPost: 0, dryWeight: 66 };
    const preWeights = chartData.map(d => d.preWeight);
    const postWeights = chartData.map(d => d.postWeight);
    const fluids = chartData.map(d => d.fluidRemoved);

    const avgFluid = Number((fluids.reduce((a, b) => a + b, 0) / fluids.length).toFixed(1));
    const maxPre = Math.max(...preWeights);
    const minPost = Math.min(...postWeights);
    const dryWeight = chartData[0]?.dryWeight || 66.0;

    return { avgFluid, maxPre, minPost, dryWeight };
  }, [chartData]);

  if (!mounted) {
    return (
      <div className="bg-[#0A1324] border-2 border-[#1F385C] rounded-2xl p-6 min-h-[320px] flex items-center justify-center">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Calculate Y-axis domain dynamically
  const allWeights = chartData.flatMap(d => [d.preWeight, d.postWeight, d.dryWeight]);
  const yMin = Math.floor(Math.min(...allWeights) - 1.5);
  const yMax = Math.ceil(Math.max(...allWeights) + 1.5);

  return (
    <div className="bg-[#0A1324] border-2 border-[#1F385C] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
      {/* Header Controls & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F385C] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-teal-950 text-teal-300 border border-teal-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Graf Trend Berat Badan (12 Sesi Terakhir)
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Pantau perubahan Berat Pra vs Selepas vs Berat Kering Sasaran Pakar
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-[#122238] p-1 rounded-xl border border-[#203E5F] text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setChartView('lines')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartView === 'lines'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📈 Trend Berat
          </button>
          <button
            onClick={() => setChartView('fluid')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartView === 'fluid'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            💧 Penyingkiran UF
          </button>
          <button
            onClick={() => setChartView('table')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartView === 'table'
                ? 'bg-indigo-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 Jadual Sesi
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#070E1A] p-3 rounded-xl border border-[#1A2E4C] space-y-0.5">
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">BERAT KERING (TARGET)</span>
          <div className="text-xl font-black text-white font-mono">{stats.dryWeight} kg</div>
          <span className="text-[10px] text-slate-400">Sasaran Nefrologi</span>
        </div>

        <div className="bg-[#070E1A] p-3 rounded-xl border border-[#1A2E4C] space-y-0.5">
          <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">BERAT PRA TERTINGGI</span>
          <div className="text-xl font-black text-amber-300 font-mono">{stats.maxPre} kg</div>
          <span className="text-[10px] text-amber-400 font-mono">
            +{(stats.maxPre - stats.dryWeight).toFixed(1)} kg over
          </span>
        </div>

        <div className="bg-[#070E1A] p-3 rounded-xl border border-[#1A2E4C] space-y-0.5">
          <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">BERAT POS TERENDAH</span>
          <div className="text-xl font-black text-cyan-300 font-mono">{stats.minPost} kg</div>
          <span className="text-[10px] text-cyan-400 font-mono">Pasca Dialisis</span>
        </div>

        <div className="bg-[#070E1A] p-3 rounded-xl border border-[#1A2E4C] space-y-0.5">
          <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wider block">PURATA CECAIR DITAPIS</span>
          <div className="text-xl font-black text-teal-300 font-mono">{stats.avgFluid} kg</div>
          <span className="text-[10px] text-teal-400">Ultrafiltration (UF)</span>
        </div>
      </div>

      {/* Main Chart / Empty State Area */}
      {chartData.length === 0 ? (
        <div className="p-8 bg-[#070E1A] border-2 border-dashed border-[#1A2E4C] rounded-2xl text-center space-y-2.5">
          <Scale className="w-10 h-10 text-cyan-500/60 mx-auto" />
          <h4 className="text-base font-bold text-white">Tiada Rekod Berat Sebenar Lagi</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Graf penjejakan ini hanya memaparkan data berat sebenar yang telah direkodkan. Sila masukkan berat pra atau pos dialisis untuk melihat trend perubahan berat badan.
          </p>
        </div>
      ) : (
        <>
          {chartView === 'lines' && (
        <div className="space-y-3">
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E385C" vertical={false} />
                <XAxis
                  dataKey="dateStr"
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis
                  domain={[yMin, yMax]}
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }}
                  unit="kg"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 'bold' }}
                />

                {/* Dry Weight Target Line */}
                <ReferenceLine
                  y={stats.dryWeight}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Berat Kering (${stats.dryWeight}kg)`,
                    fill: '#34D399',
                    fontSize: 10,
                    fontWeight: 'bold',
                    position: 'insideTopLeft'
                  }}
                />

                {/* Pre Weight Line */}
                <Line
                  type="monotone"
                  dataKey="preWeight"
                  name="Berat Sebelum (Pra-Dialisis)"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#F59E0B', stroke: '#78350F', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#FBBF24' }}
                />

                {/* Post Weight Line */}
                <Line
                  type="monotone"
                  dataKey="postWeight"
                  name="Berat Selepas (Pos-Dialisis)"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#06B6D4', stroke: '#164E63', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#22D3EE' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1F385C]">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <strong className="text-amber-300">Garisan Jingga:</strong> Berat Pra-Dialisis
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
                <strong className="text-cyan-300">Garisan Sian:</strong> Berat Pos-Dialisis
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
                <strong className="text-emerald-400">Putus-Putus:</strong> Sasaran Berat Kering
              </span>
            </div>
            <span className="text-slate-500 font-mono">12 Sesi Terakhir (Chronological)</span>
          </div>
        </div>
      )}

      {/* Fluid Removal Bar Chart View */}
      {chartView === 'fluid' && (
        <div className="space-y-3">
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E385C" vertical={false} />
                <XAxis
                  dataKey="dateStr"
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 'bold' }}
                  unit="L"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 'bold' }}
                />

                <Bar
                  dataKey="fluidRemoved"
                  name="Jumlah Cecair Disingkirkan (UF Litres / kg)"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <span>Purata Penyingkiran Cecair (UF): <strong>{stats.avgFluid} Litres / kg per sesi</strong></span>
            </span>
            <span className="text-[10px] bg-emerald-900 px-2 py-0.5 rounded font-mono font-black text-emerald-300">
              Safe Ultrafiltration
            </span>
          </div>
        </div>
      )}

      {/* Table Detail View */}
      {chartView === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-[#1F385C]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0E1A30] text-slate-400 font-extrabold uppercase border-b border-[#1F385C]">
              <tr>
                <th className="px-3 py-2.5"># Sesi</th>
                <th className="px-3 py-2.5">Tarikh</th>
                <th className="px-3 py-2.5 text-center">Berat Pra</th>
                <th className="px-3 py-2.5 text-center">BP Pra</th>
                <th className="px-3 py-2.5 text-center">Berat Pos</th>
                <th className="px-3 py-2.5 text-center">BP Pos</th>
                <th className="px-3 py-2.5 text-right">Cecair (UF)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2E4C] bg-[#070E1A]">
              {chartData.map((pt, i) => (
                <tr key={i} className="hover:bg-[#0E1A30]/60 transition-colors">
                  <td className="px-3 py-2.5 font-bold font-mono text-cyan-400">Sesi {pt.sessionNum}</td>
                  <td className="px-3 py-2.5 font-semibold text-white">{pt.fullDate}</td>
                  <td className="px-3 py-2.5 text-center font-bold font-mono text-amber-300">{pt.preWeight} kg</td>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-400">{pt.preBp || '-'}</td>
                  <td className="px-3 py-2.5 text-center font-bold font-mono text-cyan-300">{pt.postWeight} kg</td>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-400">{pt.postBp || '-'}</td>
                  <td className="px-3 py-2.5 text-right font-bold font-mono text-emerald-400">-{pt.fluidRemoved} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}
    </div>
  );
}

// Custom Tooltip Component for Recharts
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data: WeightDataPoint = payload[0].payload;
    return (
      <div className="bg-[#0B1528] border-2 border-cyan-500 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
          <span className="font-black text-white text-sm">📅 Sesi: {data.fullDate}</span>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-mono font-bold">
            Sesi {data.sessionNum}
          </span>
        </div>

        <div className="space-y-1 font-mono">
          <div className="flex justify-between items-center text-amber-300 font-bold">
            <span>• Berat Sebelum (Pra):</span>
            <span className="text-sm">{data.preWeight} kg</span>
          </div>
          <div className="flex justify-between items-center text-cyan-300 font-bold">
            <span>• Berat Selepas (Pos):</span>
            <span className="text-sm">{data.postWeight} kg</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400 font-bold">
            <span>• Cecair Disingkir (UF):</span>
            <span className="text-sm">-{data.fluidRemoved} kg</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
            <span>• Berat Kering Sasaran:</span>
            <span>{data.dryWeight} kg</span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-[10px]">
            <span>• Tekanan Darah (BP):</span>
            <span>{data.preBp} → {data.postBp}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
