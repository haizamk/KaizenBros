import { jsPDF } from 'jspdf';
import { MedicalRecord, Patient } from '@/types';

export function downloadBloodRecordPdf(record: MedicalRecord, patient: Patient) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette
  const primaryColor = [11, 19, 43]; // Deep Navy
  const secondaryColor = [31, 56, 92]; // Blue Steel
  const accentColor = [190, 24, 74]; // Crimson Rose
  const lightBg = [248, 250, 252]; // Light Slate

  // Page Width and Height
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper: Draw Header Band
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Clinic Logo / Text Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('KAIZENBROS DIALYSIS CENTRE', 15, 16);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Sistem Pengurusan Dialisis & Rekod Kesihatan Pesakit Live', 15, 22);
  doc.text('No. Pendaftaran KKM: KKM/HQ/KB-DIALYSIS/2026', 15, 27);
  doc.text('Tel: +603-8899-7711 | Email: support@kaizenbrosdialysis.com.my', 15, 32);

  // Document Title Badge
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(pageWidth - 65, 12, 50, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.text('LAPORAN MAKMAL RASMI', pageWidth - 61, 17.5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text(`ID: ${record.id}`, pageWidth - 65, 26);
  doc.text(`Tarikh Ujian: ${record.examination_date}`, pageWidth - 65, 31);

  // Y-cursor starting position
  let y = 48;

  // Patient Info Box (Background Card)
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(15, y, pageWidth - 30, 26, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, y, pageWidth - 30, 26, 'D');

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text('MAKLUMAT PESAKIT', 18, y + 5);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  
  // Left Column
  doc.text(`Nama Pesakit: ${patient.name}`, 18, y + 11);
  doc.text(`No MyKad / IC: ${patient.ic_number}`, 18, y + 16);
  doc.text(`ID Pesakit: ${patient.patient_id_code}`, 18, y + 21);

  // Right Column
  doc.text(`Kumpulan Darah: ${patient.blood_group || 'O+'}`, 110, y + 11);
  doc.text(`Jantina: ${patient.gender}`, 110, y + 16);
  doc.text(`Pemeriksaan: ${record.examination_type}`, 110, y + 21);

  y += 33;

  // Section: Clinical Results Table Header
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(15, y, pageWidth - 30, 7.5, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('Helvetica', 'bold');
  doc.text('PARAMETER UJIAN DARAH (LAB RESULTS)', 18, y + 5);

  y += 7.5;

  // Table Headers
  doc.setFillColor(235, 240, 245);
  doc.rect(15, y, pageWidth - 30, 6, 'F');
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.text('Parameter Kesihatan', 18, y + 4.5);
  doc.text('Keputusan Darah', 80, y + 4.5);
  doc.text('Unit', 110, y + 4.5);
  doc.text('Julat Sasaran Standard', 135, y + 4.5);
  doc.text('Status', 175, y + 4.5);

  y += 6;

  // Collect test results safely
  const results: Array<{ name: string; val: string | number; unit: string; range: string; status: string }> = [];
  const br = record.blood_results;

  if (br) {
    if (br.hematology?.hemoglobin !== undefined) {
      const hbVal = br.hematology.hemoglobin;
      const isLow = Number(hbVal) < 11.5;
      results.push({ name: 'Hemoglobin (Hb)', val: hbVal, unit: 'g/dL', range: '12.0 - 17.0', status: isLow ? 'RENDAH' : 'NORMAL' });
    }
    if (br.hematology?.wbc !== undefined) {
      results.push({ name: 'White Blood Cell (WBC)', val: br.hematology.wbc, unit: '10^3/uL', range: '4.0 - 11.0', status: 'NORMAL' });
    }
    if (br.hematology?.platelet !== undefined) {
      results.push({ name: 'Platelet', val: br.hematology.platelet, unit: '10^3/uL', range: '150 - 400', status: 'NORMAL' });
    }
    if (br.renal?.urea !== undefined) {
      results.push({ name: 'Urea', val: br.renal.urea, unit: 'mmol/L', range: '2.5 - 7.8', status: 'NORMAL' });
    }
    if (br.renal?.creatinine !== undefined) {
      results.push({ name: 'Creatinine', val: br.renal.creatinine, unit: 'umol/L', range: '60 - 110', status: 'NORMAL' });
    }
    if (br.renal?.egfr !== undefined) {
      results.push({ name: 'eGFR (Fungsi Buah Pinggang)', val: br.renal.egfr, unit: 'mL/min/1.73m2', range: '> 90', status: Number(br.renal.egfr) < 90 ? 'RENDAH' : 'NORMAL' });
    }
    if (br.renal?.potassium !== undefined) {
      const kVal = br.renal.potassium;
      const isHigh = Number(kVal) > 5.1;
      results.push({ name: 'Potassium (Kalium)', val: kVal, unit: 'mmol/L', range: '3.5 - 5.1', status: isHigh ? 'TINGGI' : 'NORMAL' });
    }
    if (br.renal?.phosphate !== undefined) {
      const phVal = br.renal.phosphate;
      const isHigh = Number(phVal) > 1.4;
      results.push({ name: 'Phosphate (Fosfat)', val: phVal, unit: 'mmol/L', range: '0.8 - 1.4', status: isHigh ? 'TINGGI' : 'NORMAL' });
    }
    if (br.renal?.calcium !== undefined) {
      results.push({ name: 'Calcium (Kalsium)', val: br.renal.calcium, unit: 'mmol/L', range: '2.1 - 2.6', status: 'NORMAL' });
    }
    if (br.renal?.sodium !== undefined) {
      results.push({ name: 'Sodium (Natrium)', val: br.renal.sodium, unit: 'mmol/L', range: '135 - 145', status: 'NORMAL' });
    }
    if (br.diabetes?.glucose !== undefined) {
      results.push({ name: 'Glucose (Gula Darah)', val: br.diabetes.glucose, unit: 'mmol/L', range: '4.0 - 6.1', status: 'NORMAL' });
    }
    if (br.diabetes?.hba1c !== undefined) {
      results.push({ name: 'HbA1c', val: br.diabetes.hba1c, unit: '%', range: '< 6.0%', status: 'NORMAL' });
    }
    if (br.lipid?.cholesterol !== undefined) {
      results.push({ name: 'Total Cholesterol', val: br.lipid.cholesterol, unit: 'mmol/L', range: '< 5.2', status: 'NORMAL' });
    }
    if (br.lipid?.ldl !== undefined) {
      results.push({ name: 'LDL (Kolesterol Jahat)', val: br.lipid.ldl, unit: 'mmol/L', range: '< 2.6', status: 'NORMAL' });
    }
    if (br.lipid?.hdl !== undefined) {
      results.push({ name: 'HDL (Kolesterol Baik)', val: br.lipid.hdl, unit: 'mmol/L', range: '> 1.0', status: 'NORMAL' });
    }
    if (br.lipid?.triglycerides !== undefined) {
      results.push({ name: 'Triglycerides', val: br.lipid.triglycerides, unit: 'mmol/L', range: '< 1.7', status: 'NORMAL' });
    }

    if (br.other_tests) {
      br.other_tests.forEach(ot => {
        results.push({
          name: ot.test_name,
          val: ot.result,
          unit: ot.unit,
          range: ot.range || 'N/A',
          status: ot.status || 'NORMAL'
        });
      });
    }
  }

  // Draw rows
  doc.setFont('Helvetica', 'normal');
  results.forEach((row, rIdx) => {
    // Zebra striping
    if (rIdx % 2 === 1) {
      doc.setFillColor(250, 252, 254);
      doc.rect(15, y, pageWidth - 30, 5.5, 'F');
    }
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.text(row.name, 18, y + 4);
    doc.setFont('Helvetica', 'bold');
    doc.text(String(row.val), 80, y + 4);
    doc.setFont('Helvetica', 'normal');
    doc.text(row.unit, 110, y + 4);
    doc.text(row.range, 135, y + 4);

    if (row.status !== 'NORMAL') {
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setFont('Helvetica', 'bold');
      doc.text(row.status, 175, y + 4);
      doc.setFont('Helvetica', 'normal');
    } else {
      doc.setTextColor(10, 120, 60);
      doc.text('NORMAL', 175, y + 4);
    }

    y += 5.5;
  });

  y += 5;

  // Notes Section
  if (record.clinical_notes || record.doctor_comments || record.ai_analysis_notes) {
    // Clean Page Break Check
    if (y > pageHeight - 65) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, y, pageWidth - 30, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('KOMEN KLINIKAL & NOTA RAWATAN', 18, y + 4);
    
    y += 6;

    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(15, y, pageWidth - 30, 32, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, y, pageWidth - 30, 32, 'D');

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');

    let textY = y + 4;
    if (record.clinical_notes) {
      doc.setFont('Helvetica', 'bold');
      doc.text('Nota Kakitangan / Jururawat:', 18, textY);
      doc.setFont('Helvetica', 'normal');
      doc.text(record.clinical_notes.substring(0, 110), 18, textY + 3.5);
      textY += 9;
    }

    if (record.doctor_comments) {
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Komen Doktor / Pakar Nefrologi:', 18, textY);
      doc.setFont('Helvetica', 'normal');
      doc.text(record.doctor_comments.substring(0, 110), 18, textY + 3.5);
      textY += 9;
    }

    if (record.ai_analysis_notes) {
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('Rumusan Analisis Automatik AI:', 18, textY);
      doc.setFont('Helvetica', 'normal');
      doc.text(record.ai_analysis_notes.substring(0, 110), 18, textY + 3.5);
    }

    y += 37;
  }

  // Footer & Signatures
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 20;
  }

  // Signatures Panel
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 180, 180);
  
  doc.line(20, y + 18, 70, y + 18);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Disediakan Oleh,', 20, y + 3);
  doc.setFont('Helvetica', 'normal');
  doc.text(record.created_by || 'Staff Nurse KaizenBros', 20, y + 21);
  doc.text('Jururawat Dialisis Berdaftar', 20, y + 25);

  doc.line(pageWidth - 70, y + 18, pageWidth - 20, y + 18);
  doc.setFont('Helvetica', 'bold');
  doc.text('Disahkan Oleh,', pageWidth - 70, y + 3);
  doc.setFont('Helvetica', 'normal');
  doc.text('Dr. Azman bin Khairuddin', pageWidth - 70, y + 21);
  doc.text('Pakar Nefrologi (Nephrologist)', pageWidth - 70, y + 25);

  // Print Stamp note
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.text('Laporan ini dijana secara digital. Tiada tandatangan fizikal diperlukan.', 15, pageHeight - 12);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('ms-MY')}`, pageWidth - 90, pageHeight - 12);

  // Save the PDF
  doc.save(`Laporan_Darah_KaizenBros_${patient.name.replace(/\s+/g, '_')}_${record.examination_date}.pdf`);
}
