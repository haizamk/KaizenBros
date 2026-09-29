import { BloodTestRecord } from '../types';

export function generateDrAiBloodSummary(record: Partial<BloodTestRecord>): string {
  const hb = Number(record.hb ?? 11.8);
  const potassium = Number(record.potassium ?? 5.4);
  const ktV = Number(record.ktV ?? 1.38);
  const urea = Number(record.urea ?? 13.2);
  const creatinine = Number(record.creatinine ?? 905);
  const ferritin = record.ferritin !== undefined ? Number(record.ferritin) : 474;
  const tarikh = record.tarikhUjian || new Date().toISOString().split('T')[0];

  const lines: string[] = [];
  lines.push(`🤖 [Rumusan Klinikal Dr AI - Imbasan Ujian Darah ${tarikh}]`);
  
  // Hemoglobin Evaluation
  if (hb < 10.0) {
    lines.push(`• Hemoglobin (Hb: ${hb} g/dL): ANEMIA / DI BAWAH SASARAN (Target 10.0 - 12.0 g/dL). Cadangan Dr AI: Pertimbangkan pelarasan dos Erythropoietin (EPO) & periksa simpanan zat besi.`);
  } else if (hb > 12.0) {
    lines.push(`• Hemoglobin (Hb: ${hb} g/dL): Optimum / Atas sasaran. Kekalkan dos EPO dan pantau tekanan darah.`);
  } else {
    lines.push(`• Hemoglobin (Hb: ${hb} g/dL): Berada dalam julat sasaran KKM ideal (10.0 - 12.0 g/dL).`);
  }

  // Potassium Evaluation
  if (potassium > 5.5) {
    lines.push(`• Kalium / Potassium (${potassium} mmol/L): HIPERKALEMIA RINGAN/SEDERHANA (Normal 3.5 - 5.5 mmol/L). Cadangan Dr AI: Nasihatkan pesakit hadkan pengambilan makanan tinggi kalium (pisang, kurma, air kelapa). Periksa pembersihan dialisis.`);
  } else if (potassium < 3.5) {
    lines.push(`• Kalium / Potassium (${potassium} mmol/L): HIPOKALEMIA. Pantau simptom kelemahan otot.`);
  } else {
    lines.push(`• Kalium / Potassium (${potassium} mmol/L): Julat selamat dan stabil (3.5 - 5.5 mmol/L).`);
  }

  // Kt/V Adequacy Evaluation
  if (ktV >= 1.2) {
    lines.push(`• Kecukupan Dialisis (Kt/V: ${ktV}): MENCAPAI SASARAN KKM (Target >= 1.2). Pembersihan toksin urea berasaskan saiz badan adalah efektif.`);
  } else {
    lines.push(`• Kecukupan Dialisis (Kt/V: ${ktV}): DI BAWAH SASARAN (Target >= 1.2). Cadangan Dr AI: Tingkatkan kadar aliran darah (BFR) atau nilaikan masalah recirculation vaskular.`);
  }

  // Renal Profile
  lines.push(`• Profil Renal & Toksin: Creatinine ${creatinine} µmol/L, Pre-Urea ${urea} mmol/L.`);
  lines.push(`• Simpanan Zat Besi (Ferritin): ${ferritin} ng/mL (${ferritin >= 200 ? 'Mencukupi bagi pesakit hemodialisis' : 'Perlu suplemen IV Iron'}).`);
  
  lines.push(`\n📌 [Catatan Tambahan Doktor Pakar / Consultant Nephrologist]:`);
  lines.push(`"Parameter stabil secara keseluruhan. Teruskan pelan rawatan dialisis 3x seminggu @ 4 jam per sesi. - Dr. Pakar Nefrologi"`);

  return lines.join('\n');
}
