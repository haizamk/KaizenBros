'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Activity, Heart, ShieldCheck, AlertTriangle, TrendingDown, Info, Calendar } from 'lucide-react';
import { DialysisSession, Patient } from '@/types';

interface HistoricalBloodPressureChartProps {
  patient?: Patient | null;
  sessions?: DialysisSession[];
}

export interface BpDataPoint {
  sessionNum: number;
  sessionLabel: string;
  dateStr: string;
  fullDate: string;
  preSystolic: number | null;
  preDiastolic: number | null;
  postSystolic: number | null;
  postDiastolic: number | null;
  preBpStr: string;
  postBpStr: string;
  statusLabel: string;
  isStable: boolean;
}

function parseBp(bpStr?: string): { systolic: number | null; diastolic: number | null } {
  if (!bpStr || bpStr === '-' || bpStr === '--') return { systolic: null, diastolic: null };
  const parts = bpStr.split('/');
  if (parts.length >= 2) {
    const sys = parseInt(parts[0].trim(), 10);
    const dia = parseInt(parts[1].trim(), 10);
    return {
      systolic: isNaN(sys) ? null : sys,
      diastolic: isNaN(dia) ? null : dia
    };
  }
  return { systolic: null, diastolic: null };
}

export function HistoricalBloodPressureChart({
  patient,
  sessions = []
}: HistoricalBloodPressureChartProps) {
  const [mounted, setMounted] = useState(false);
  const [chartView, setChartView] = useState<'all' | 'pre' | 'post' | 'table'>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter and compute chronological real BP points
  const chartData = useMemo<BpDataPoint[]>(() => {
    const filtered = (sessions || [])
      .filter(s => {
        if (!patient) return true;
        return (
          s.patient_id === patient.id ||
          (patient.patient_id_code && s.patient_id_code === patient.patient_id_code)
        );
      })
      .filter(s => {
        const hasPre = Boolean(s.pre_bp && s.pre_bp !== '-' && s.pre_bp.includes('/'));
        const hasPost = Boolean(s.post_bp && s.post_bp !== '-' && s.post_bp.includes('/'));
        return hasPre || hasPost;
      })
      .sort((a, b) => new Date(a.scheduled_date || 0).getTime() - new Date(b.scheduled_date || 0).getTime());

    // Take up to the last 12 recorded sessions
    const targetSessions = filtered.slice(-12);

    return targetSessions.map((s, idx) => {
      const preParsed = parseBp(s.pre_bp);
      const postParsed = parseBp(s.post_bp);

      const d = s.scheduled_date ? new Date(s.scheduled_date) : new Date();
      const dateStr = isNaN(d.getTime())
        ? `Sesi ${idx + 1}`
        : d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' });
      const fullDate = isNaN(d.getTime())
        ? `Sesi ${idx + 1}`
        : d.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Determine clinical stability label based on post or pre systolic
      const effectiveSys = postParsed.systolic || preParsed.systolic;
      const effectiveDia = postParsed.diastolic || preParsed.diastolic;

      let statusLabel = 'Terkawal';
      let isStable = true;

      if (effectiveSys !== null) {
        if (effectiveSys < 100) {
          statusLabel = 'Hipotensi (Rendah)';
          isStable = false;
        } else if (effectiveSys > 160) {
          statusLabel = 'Hipertensi (Tinggi)';
          isStable = false;
        } else if (effectiveSys >= 140 || (effectiveDia !== null && effectiveDia >= 90)) {
          statusLabel = 'Sederhana';
          isStable = true;
        } else {
          statusLabel = 'Optimum & Stabil';
          isStable = true;
        }
      }

      return {
        sessionNum: idx + 1,
        sessionLabel: dateStr,
        dateStr,
        fullDate,
        preSystolic: preParsed.systolic,
        preDiastolic: preParsed.diastolic,
        postSystolic: postParsed.systolic,
        postDiastolic: postParsed.diastolic,
        preBpStr: s.pre_bp || '-',
        postBpStr: s.post_bp || '-',
        statusLabel,
        isStable
      };
    });
  }, [patient, sessions]);

  // Aggregate statistics for 12 sessions
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgPreSys: null,
        avgPreDia: null,
        avgPostSys: null,
        avgPostDia: null,
        stablePercentage: 100,
        totalSessions: 0
      };
    }

    const preSysList = chartData.map(d => d.preSystolic).filter((v): v is number => v !== null);
    const preDiaList = chartData.map(d => d.preDiastolic).filter((v): v is number => v !== null);
    const postSysList = chartData.map(d => d.postSystolic).filter((v): v is number => v !== null);
    const postDiaList = chartData.map(d => d.postDiastolic).filter((v): v is number => v !== null);

    const avgPreSys = preSysList.length ? Math.round(preSysList.reduce((a, b) => a + b, 0) / preSysList.length) : null;
    const avgPreDia = preDiaList.length ? Math.round(preDiaList.reduce((a, b) => a + b, 0) / preDiaList.length) : null;
    const avgPostSys = postSysList.length ? Math.round(postSysList.reduce((a, b) => a + b, 0) / postSysList.length) : null;
    const avgPostDia = postDiaList.length ? Math.round(postDiaList.reduce((a, b) => a + b, 0) / postDiaList.length) : null;

    const stableCount = chartData.filter(d => d.isStable).length;
    const stablePercentage = Math.round((stableCount / chartData.length) * 100);

    return {
      avgPreSys,
      avgPreDia,
      avgPostSys,
      avgPostDia,
      stablePercentage,
      totalSessions: chartData.length
    };
  }, [chartData]);

  if (!mounted) {
    return (
      <div className="bg-[#0A1324] border-2 border-[#1F385C] rounded-2xl p-6 min-h-[320px] flex items-center justify-center">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Calculate dynamic Y-axis bounds based on recorded data
  const allBpValues: number[] = [];
  chartData.forEach(d => {
    if (d.preSystolic) allBpValues.push(d.preSystolic);
    if (d.postSystolic) allBpValues.push(d.postSystolic);
    if (d.preDiastolic) allBpValues.push(d.preDiastolic);
    if (d.postDiastolic) allBpValues.push(d.postDiastolic);
  });

  const yMin = allBpValues.length > 0 ? Math.max(50, Math.floor(Math.min(...allBpValues) / 10) * 10 - 10) : 60;
  const yMax = allBpValues.length > 0 ? Math.min(220, Math.ceil(Math.max(...allBpValues) / 10) * 10 + 10) : 180;

  return (
    <div className="bg-[#0A1324] border-2 border-[#1F385C] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F385C] pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-950 text-rose-400 border border-rose-600 flex items-center justify-center shadow-inner">
              <Heart className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Graf Sejarah Tekanan Darah (BP)
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Pantau kestabilan tekanan darah Sistolik & Diastolik sebelum dan selepas dialisis
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-[#122238] p-1 rounded-xl border border-[#203E5F] text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setChartView('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartView === 'all'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 Pra & Selepas
          </button>
          <button
            onClick={() => setChartView('pre')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartView === 'pre'
                ? 'bg-amber-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🟡 Pra Saja
          </button>
          <button
            onClick={() => setChartView('post')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartView === 'post'
                ? 'bg-cyan-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔵 Selepas Saja
          </button>
          <button
            onClick={() => setChartView('table')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartView === 'table'
                ? 'bg-indigo-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 Jadual
          </button>
        </div>
      </div>

      {/* KPI BP Stability Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#070E1A] p-3 rounded-xl border border-[#1A2E4C] space-y-0.5">
          <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">PURATA PRA-DIALISIS</span>
          <div className="text-xl font-black text-amber-300 font-mono">
            {stats.avgPreSys && stats.avgPreDia ? `${stats.avgPreSys}/${stats.avgPreDia}` : '--'}
            <span className="text-xs text-slate-400 font-normal ml-1">mmHg</span>
          </div>
          <span className="text-[10px] text-slate-400">Sebelum Rawatan</span>
        </div>

        <div className="bg-[#070E1A] p-3 rounded-xl border border-[#1A2E4C] space-y-0.5">
          <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">PURATA SELEPAS DIALISIS</span>
          <div className="text-xl font-black text-cyan-300 font-mono">
            {stats.avgPostSys && stats.avgPostDia ? `${stats.avgPostSys}/${stats.avgPostDia}` : '--'}
            <span className="text-xs text-slate-400 font-normal ml-1">mmHg</span>
          </div>
          <span className="text-[10px] text-slate-400">Pasca Dialisis</span>
        </div>

        <div className="bg-[#070E1A] p-3 rounded-xl border border-[#1A2E4C] space-y-0.5">
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">KADAR KESTABILAN BP</span>
          <div className="text-xl font-black text-emerald-300 font-mono">
            {stats.stablePercentage}%
          </div>
          <span className="text-[10px] text-emerald-400">Sesi Terkawal</span>
        </div>

        <div className="bg-[#070E1A] p-3 rounded-xl border border-[#1A2E4C] space-y-0.5">
          <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wider block">PENURUNAN SISTOLIK PURATA</span>
          <div className="text-xl font-black text-white font-mono">
            {stats.avgPreSys && stats.avgPostSys ? `${stats.avgPreSys - stats.avgPostSys} mmHg` : '--'}
          </div>
          <span className="text-[10px] text-slate-400">Delta Penyingkiran Air</span>
        </div>
      </div>

      {/* Main Chart / Empty State Area */}
      {chartData.length === 0 ? (
        <div className="p-8 bg-[#070E1A] border-2 border-dashed border-[#1A2E4C] rounded-2xl text-center space-y-2.5">
          <Heart className="w-10 h-10 text-rose-500/60 mx-auto" />
          <h4 className="text-base font-bold text-white">Tiada Rekod Tekanan Darah Sebenar Lagi</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Graf ini hanya memplot bacaan tekanan darah (BP) sebenar yang disimpan dalam sistem. Masukkan bacaan BP pra atau selepas dialisis untuk melihat carta kestabilan.
          </p>
        </div>
      ) : (
        <>
          {chartView !== 'table' && (
            <div className="space-y-3">
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 25 }}>
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
                      unit=" "
                    />
                    <Tooltip content={<CustomBpTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 'bold' }}
                    />

                    {/* Reference Line for Target Upper Systolic Threshold (140 mmHg) */}
                    <ReferenceLine
                      y={140}
                      stroke="#EAB308"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: 'Sasaran Sistolik (140)',
                        fill: '#FACC15',
                        fontSize: 10,
                        fontWeight: 'bold',
                        position: 'insideTopLeft'
                      }}
                    />

                    {/* Reference Line for Hypotension Alert Threshold (100 mmHg) */}
                    <ReferenceLine
                      y={100}
                      stroke="#F43F5E"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{
                        value: 'Awas Hipotensi (100)',
                        fill: '#FB7185',
                        fontSize: 10,
                        fontWeight: 'bold',
                        position: 'insideBottomLeft'
                      }}
                    />

                    {/* Pre-Dialysis Systolic Line */}
                    {(chartView === 'all' || chartView === 'pre') && (
                      <Line
                        type="monotone"
                        dataKey="preSystolic"
                        name="Sistolik Pra (Sebelum)"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#F59E0B', stroke: '#78350F', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#FBBF24' }}
                        connectNulls
                      />
                    )}

                    {/* Post-Dialysis Systolic Line */}
                    {(chartView === 'all' || chartView === 'post') && (
                      <Line
                        type="monotone"
                        dataKey="postSystolic"
                        name="Sistolik Selepas"
                        stroke="#06B6D4"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#06B6D4', stroke: '#164E63', strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: '#22D3EE' }}
                        connectNulls
                      />
                    )}

                    {/* Pre-Dialysis Diastolic Line */}
                    {(chartView === 'all' || chartView === 'pre') && (
                      <Line
                        type="monotone"
                        dataKey="preDiastolic"
                        name="Diastolik Pra"
                        stroke="#FB7185"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={{ r: 4, fill: '#FB7185' }}
                        connectNulls
                      />
                    )}

                    {/* Post-Dialysis Diastolic Line */}
                    {(chartView === 'all' || chartView === 'post') && (
                      <Line
                        type="monotone"
                        dataKey="postDiastolic"
                        name="Diastolik Selepas"
                        stroke="#14B8A6"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={{ r: 4, fill: '#14B8A6' }}
                        connectNulls
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Legends guide */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1F385C] gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    <strong className="text-amber-300">Sistolik Pra</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
                    <strong className="text-cyan-300">Sistolik Selepas</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-rose-400 inline-block" />
                    <strong className="text-rose-300">Diastolik Pra</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-teal-400 inline-block" />
                    <strong className="text-teal-300">Diastolik Selepas</strong>
                  </span>
                </div>
                <span className="text-slate-500 font-mono">12 Sesi Terakhir (mmHg)</span>
              </div>
            </div>
          )}

          {/* Table View */}
          {chartView === 'table' && (
            <div className="overflow-x-auto rounded-xl border border-[#1F385C]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0E1A30] text-slate-400 font-extrabold uppercase border-b border-[#1F385C]">
                  <tr>
                    <th className="px-3 py-2.5"># Sesi</th>
                    <th className="px-3 py-2.5">Tarikh</th>
                    <th className="px-3 py-2.5 text-center">BP Pra (Sebelum)</th>
                    <th className="px-3 py-2.5 text-center">BP Selepas</th>
                    <th className="px-3 py-2.5 text-center">Delta Sistolik</th>
                    <th className="px-3 py-2.5 text-right">Status Kestabilan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2E4C] bg-[#070E1A]">
                  {chartData.map((pt, i) => {
                    const delta = (pt.preSystolic && pt.postSystolic) ? (pt.preSystolic - pt.postSystolic) : null;
                    return (
                      <tr key={i} className="hover:bg-[#0E1A30]/60 transition-colors">
                        <td className="px-3 py-2.5 font-bold font-mono text-rose-400">Sesi {pt.sessionNum}</td>
                        <td className="px-3 py-2.5 font-semibold text-white">{pt.fullDate}</td>
                        <td className="px-3 py-2.5 text-center font-bold font-mono text-amber-300">
                          {pt.preBpStr}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold font-mono text-cyan-300">
                          {pt.postBpStr}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono">
                          {delta !== null ? (
                            <span className={delta >= 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                              {delta >= 0 ? `-${delta}` : `+${Math.abs(delta)}`} mmHg
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            pt.isStable ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                          }`}>
                            {pt.statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Clinical Advice Note for Dialysis BP Stability */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <div className="flex items-center space-x-2 text-cyan-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Nota Klinikal Kestabilan Tekanan Darah (Pusat Dialisis KaizenBros):</span>
            </div>
            <p>
              • <strong>Sasaran Sistolik Pasca-Dialisis:</strong> Julat optimum adalah <strong>110 - 140 mmHg</strong>. Penurunan sederhana membuktikan penyingkiran cecair yang berkesan.
            </p>
            <p>
              • <strong>Awas Hipotensi (&lt; 100 mmHg):</strong> Sekiranya tekanan darah jatuh mendadak selepas dialisis atau anda berasa pening / berpinar ketika bangun, segera maklumkan jururawat bertugas.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Custom Tooltip for BP Recharts
function CustomBpTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data: BpDataPoint = payload[0].payload;
    return (
      <div className="bg-[#0B1528] border-2 border-rose-500 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[210px]">
        <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
          <span className="font-black text-white text-sm">📅 Sesi: {data.fullDate}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
            data.isStable ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
          }`}>
            {data.statusLabel}
          </span>
        </div>

        <div className="space-y-1 font-mono">
          <div className="flex justify-between items-center text-amber-300 font-bold">
            <span>• BP Pra (Sebelum):</span>
            <span className="text-sm">{data.preBpStr} mmHg</span>
          </div>
          <div className="flex justify-between items-center text-cyan-300 font-bold">
            <span>• BP Selepas Rawatan:</span>
            <span className="text-sm">{data.postBpStr} mmHg</span>
          </div>

          {(data.preSystolic && data.postSystolic) && (
            <div className="flex justify-between items-center text-emerald-400 font-bold pt-1 border-t border-slate-800 text-[11px]">
              <span>• Perubahan Sistolik:</span>
              <span>{data.preSystolic - data.postSystolic} mmHg</span>
            </div>
          )}

          <div className="text-[10px] text-slate-400 pt-1">
            <span>Ambang Normal: 110-140 / 70-90 mmHg</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
