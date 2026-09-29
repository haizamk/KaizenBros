import { Patient, TreatmentSession, DoctorVisit, BloodTestRecord, TransactionPayment } from '../types';
import { convertNumberToMalayWords } from './numberToWords';

export function generatePatientMRN(patients: Patient[]): string {
  const safeList = Array.isArray(patients) ? patients : [];
  let maxNum = 0;
  safeList.forEach((p) => {
    if (p && p.id) {
      const matches = p.id.match(/\d+/g);
      if (matches && matches.length > 0) {
        const num = parseInt(matches[matches.length - 1], 10);
        if (num > maxNum && num < 100000) maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `PT-${nextNum.toString().padStart(3, '0')}`;
}

export function normalizeMalaysianPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '6' + cleaned;
  }
  if (!cleaned.startsWith('60')) {
    cleaned = '60' + cleaned;
  }
  return cleaned;
}

export function formatCurrencyRM(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatMalayDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = [
      'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
      'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
    ];
    const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
}

// Generate WhatsApp Message for Treatment Session
export function createSessionReminderMessage(patient: Patient, session: TreatmentSession): string {
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://kaizenbrosdialysis.com.my';

  return `*PUSAT DIALISIS KAIZENBROS* 🏥
_Peringatan Janji Temu Sesi Hemodialisis_

Salam sejahtera *${patient.nama}*,

Peringatan mesra jadual rawatan hemodialisis anda yang seterusnya:
🗓 *Tarikh:* ${formatMalayDate(session.tarikh)}
⏰ *Masa Rawatan:* ${session.masaMula} - ${session.masaTamat} (${session.shift})
💺 *Penetapan Mesin:* Agihan secara 'First-Come First-Served' (FCFS) di kaunter pendaftaran
👩‍⚕️ *Jururawat Bertugas:* ${session.jururawatBertugas}

📄 *Dokumen Slip Jadual Rawatan:* Format PDF Rasmi (Default) / Pilihan PNG
📌 *Pautan Dokumen PDF / PNG:*
${appOrigin}/?doc=SLIP_JADUAL&id=${session.id}&mrn=${patient.id}

📌 *Peringatan Penting Untuk Pesakit:*
1. Sila hadir *15 minit awal* sebelum masa rawatan untuk pemeriksaan tekanan darah & timbang berat badan.
2. Basuh lengan akses vaskular (*${patient.jenisAkses}* - ${patient.lokasiAkses}) dengan sabun antiseptik sebelum masuk ke ruang rawatan.
3. Sila maklumkan kepada jururawat jika anda mengalami demam, sesak nafas, atau bengkak luar biasa.

Sebarang kecemasan atau penukaran jadual, sila hubungi kami di talian *03-87270791* atau WhatsApp *019-338 9922*.

_Kesihatan & Keselesaan Anda Keutamaan KaizenBros._`;
}

// Generate WhatsApp Message for 1-Hour Pre-Arrival Reminder
export function createOneHourReminderMessage(patient: Patient, session: TreatmentSession): string {
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://kaizenbrosdialysis.com.my';

  return `*PUSAT DIALISIS KAIZENBROS* ⏰
_PERINGATAN MESRA: 1 JAM SEBELUM SESI DIALISIS_

Salam sejahtera *${patient.nama}*,

Pemberitahuan mesra bahawa sesi hemodialisis anda akan bermula dalam masa *1 JAM* lagi:

⏰ *Masa Rawatan:* ${session.masaMula} - ${session.masaTamat} (${session.shift})
🗓 *Tarikh Sesi:* ${formatMalayDate(session.tarikh)}
💺 *Stesen Mesin:* Ditugaskan secara *First-Come First-Served (FCFS)* semasa anda mendaftar ketibaan di kaunter
👩‍⚕️ *Jururawat Bertugas:* ${session.jururawatBertugas}

📄 *Dokumen Pas Masuk Saringan:* Format PDF Rasmi (Default) / Pilihan PNG
📌 *Pautan Pas Masuk PDF / PNG:*
${appOrigin}/?doc=PAS_MASUK&id=${session.id}&mrn=${patient.id}

📌 *Arahan Persediaan 1 Jam Sebelum Hadir:*
1. Sila bersiap dan hadir *15 minit awal* ke kaunter saringan.
2. Sila basuh lengan akses vaskular (*${patient.jenisAkses}*) dengan sabun antiseptik di sinki pendaftaran.
3. Pastikan anda mengambil ubat rutin harian mengikut arahan doktor/jururawat.

Sekiranya anda berhalangan, kelewatan, atau perlu menukar sesi, sila hubungi kaunter dialisis segera di talian *03-87270791*.

Terima kasih & Jumpa sebentar lagi!
_Pusat Dialisis KaizenBros_`;
}

// Generate WhatsApp Message for Doctor Visit
export function createDoctorVisitMessage(patient: Patient, visit: DoctorVisit): string {
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://kaizenbrosdialysis.com.my';

  return `*PUSAT DIALISIS KAIZENBROS* 🩺
_Peringatan Lawatan Pakar Nefrologi (Setiap 3 Bulan)_

Salam sejahtera *${patient.nama}*,

Sukacita dimaklumkan bahawa *${visit.namaDoktor}* (${visit.jawatanDoktor}) akan mengadakan lawatan klinikal & konsultasi berkala 3 bulan bersama anda:
🗓 *Tarikh Lawatan:* ${formatMalayDate(visit.tarikhLawatan)}
⏰ *Masa:* ${visit.masa}
🎯 *Tujuan:* ${visit.tujuan}
📋 *Catatan:* ${visit.catatanPakar || 'Pemeriksaan rutin berkala 3 bulan & pemantauan dos rawatan'}

📄 *Dokumen Slip Janji Temu Pakar:* Format PDF Rasmi (Default) / Pilihan PNG
📌 *Pautan Slip Konsultasi PDF / PNG:*
${appOrigin}/?doc=PAS_PAKAR&id=${visit.id}&mrn=${patient.id}

Sila bawa buku rekod ubat terkini atau senarai preskripsi klinik sekiranya ada perubahan ubat luar.

Jumpa anda pada sesi tersebut! Terima kasih.`;
}

// Generate WhatsApp Message for Blood Test Date Reminder
export function createBloodTestReminderMessage(patient: Patient, testDate: string, notes?: string): string {
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://kaizenbrosdialysis.com.my';

  return `*PUSAT DIALISIS KAIZENBROS* 🩸
_Peringatan Tarikh Pengambilan Ujian Darah Berkala (Setiap 3 Bulan)_

Salam sejahtera *${patient.nama}*,

Pemberitahuan tarikh pengambilan sampel darah berkala 3 bulan anda di pusat dialisis:
🗓 *Tarikh Ujian Darah:* ${formatMalayDate(testDate)}
🧪 *Parameter Ujian:* Profil Buah Pinggang (Urea/Creatinine), Hemoglobin (Hb), Elektrolit (Kalium/K), Kalsium & Fosfat, Kecukupan Dialisis (Kt/V)
📝 *Arahan:* ${notes || 'Sampel darah diambil oleh jururawat bertugas melalui akses vaskular sebelum dialisis bermula. Tidak perlu berpuasa melainkan dimaklumkan.'}

📄 *Dokumen Borang Permohonan Ujian Lab:* Format PDF Rasmi (Default) / Pilihan PNG
📌 *Pautan Borang Lab PDF / PNG:*
${appOrigin}/?doc=BORANG_LAB&mrn=${patient.id}&date=${testDate}

Ujian berkala 3 bulan ini penting bagi memastikan rawatan dialisis anda berkesan, memantau kadar kecukupan (Kt/V), serta menilai keperluan ubat penambah darah & pelaras fosfat.

Terima kasih atas kerjasama anda.`;
}

// Generate WhatsApp Message for Payment / Invoice (PDF / PNG Format Reference)
export function createPaymentReminderMessage(patient: Patient, tx: TransactionPayment): string {
  const isPaid = (tx.status as string) === 'PAID' || (tx.status as string) === 'Paid' || (tx.status as string) === 'LUNAS';
  const docType = isPaid ? 'RESIT_RASMI' : 'INVOIS_RAWATAN';
  const docLabel = isPaid ? 'Resit Rasmi Pembayaran' : 'Invois Rawatan Hemodialisis';
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://kaizenbrosdialysis.com.my';

  return `*PUSAT DIALISIS KAIZENBROS* 📄
_Dokumen ${docLabel} (Format PDF / PNG)_

Salam sejahtera *${patient.nama}*,

Sila muat turun / lihat dokumen *${docLabel}* anda dalam format PDF / PNG melalui pautan rasmi di bawah:

📄 *Jenis Dokumen:* ${docLabel} (PDF / PNG)
🧾 *No. Invois / Resit:* ${tx.invoisNo} ${tx.resitNo ? `(${tx.resitNo})` : ''}
🗓 *Tarikh:* ${formatMalayDate(tx.tarikh)}
💵 *Jumlah Baki Bayaran:* *${formatCurrencyRM(tx.bayaranPesakit)}*
📊 *Status:* ${isPaid ? '✅ Paid (PDF/PNG Resit Sedia)' : '⏳ Unpaid (Invois PDF/PNG Sedia)'}

📌 *Pautan Dokumen Rasmi (PDF / PNG):*
${appOrigin}/?doc=${docType}&id=${tx.id}&mrn=${patient.id}

_(Dokumen mengandungi cop pengesahan digital & kod QR pengesahan rasmi Pusat Dialisis KaizenBros)_

Terima kasih,
_Bahagian Kewangan & Bil Pusat Dialisis KaizenBros_`;
}

// Generate WhatsApp Message for Official A5 Receipt (PDF / PNG Format Document)
export function createOfficialReceiptWhatsAppMessage(patient: Patient, tx: TransactionPayment): string {
  const receiptNo = tx.resitNo || `KB-RCP-2026-${tx.id.replace(/\D/g, '').padStart(4, '0')}`;
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://kaizenbrosdialysis.com.my';

  return `*PUSAT DIALISIS KAIZENBROS* 📄
_Dokumen Resit Rasmi Rawatan Hemodialisis A5 (Format PDF / PNG)_
_No. Pendaftaran KKM: KKM/BPP/2023/HD-8491_

Salam sejahtera *${patient.nama}*,

Dokumen *Resit Rasmi Rawatan Hemodialisis (Format PDF / PNG A5)* anda sedia untuk dimuat turun bagi tujuan rekod atau tuntutan (PERKESO / JPA / Zakat / Pelepasan Cukai LHDN):

📄 *Dokumen:* Resit Rasmi Rawatan A5 (PDF / PNG)
🧾 *No. Resit Rasmi:* *${receiptNo}*
📑 *No. Invois:* ${tx.invoisNo}
👤 *Nama Pesakit:* ${patient.nama} (No. IC: ${patient.noIC})
💵 *Jumlah Bersih Diterima:* *${formatCurrencyRM(tx.bayaranPesakit)}*
✅ *Status:* Paid (Sah Bercop Digital & QR)

📌 *Pautan Muat Turun Dokumen PDF / PNG:*
${appOrigin}/?doc=RESIT_RASMI_A5&id=${tx.id}&mrn=${patient.id}

Resit PDF / PNG ini diiktiraf di bawah Seksyen 46 Akta Cukai Pendapatan 1967 bagi perbelanjaan rawatan perubatan penyakit serius (Kegagalan Buah Pinggang Tahap Akhir).

Terima kasih atas kepercayaan anda kepada KaizenBros.
_Bahagian Kewangan & Tuntutan Pusat Dialisis KaizenBros_
Talian Kecemasan: 019-338 9922 | Kaunter: 03-87270791`;
}

// Generate real WhatsApp Link
export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = normalizeMalaysianPhone(phone);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

// ==========================================
// DUAL-CHANNEL EMAIL NOTIFICATION HELPERS
// ==========================================

export interface EmailNotificationContent {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

// Generate Email for Treatment Session
export function createSessionEmailMessage(patient: Patient, session: TreatmentSession): EmailNotificationContent {
  const dateFormatted = formatMalayDate(session.tarikh);
  const subject = `[Peringatan Dialisis] Sesi Rawatan Hemodialisis Anda (${dateFormatted}) - KaizenBros`;

  const bodyText = `PUSAT DIALISIS KAIZENBROS (Berlesen KKM)
PERINGATAN MESRA SESI RAWATAN HEMODIALISIS (NOTIFIKASI SALURAN SANDARAN EMEL)

Salam Sejahtera ${patient.nama},

Ini adalah pencerahan & peringatan bertulis bagi jadual rawatan hemodialisis anda yang seterusnya:

---------------------------------------------------------
BUTIRAN RAWATAN & JANJI TEMU:
---------------------------------------------------------
- Nama Pesakit      : ${patient.nama} (No. IC: ${patient.noIC})
- Tarikh Rawatan    : ${dateFormatted}
- Masa Rawatan      : ${session.masaMula} - ${session.masaTamat} (${session.shift})
- Lokasi & Stesen   : Kaunter Saringan / Agihan FCFS (Stesen #${session.stesenNo})
- Jururawat Bertugas: ${session.jururawatBertugas}
- Akses Vaskular    : ${patient.jenisAkses} (${patient.lokasiAkses})

---------------------------------------------------------
ARAHAN PERSIAPAN SEBELUM HADIR:
---------------------------------------------------------
1. Hadir 15 MINIT AWAL sebelum masa rawatan untuk ujian tekanan darah & timbangan berat badan.
2. Basuh lengan akses vaskular (${patient.jenisAkses}) menggunakan sabun antiseptik di sinki kaunter.
3. Sila maklumkan dengan kadar segera kepada jururawat jika anda mengalami demam, sesak nafas, atau bengkak air luar biasa.

Jika terdapat sebarang masalah atau penukaran jadual kecemasan, sila hubungi talian Kaunter Dialisis 03-87270791 atau WhatsApp 019-338 9922.

Sekian, terima kasih.
Unit Dialisis & Pengurusan Pesakit
Pusat Dialisis KaizenBros`;

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #064e3b; padding: 20px; text-align: center; border-bottom: 2px solid #10b981;">
        <h2 style="margin: 0; color: #34d399; font-size: 20px;">🏥 PUSAT DIALISIS KAIZENBROS</h2>
        <p style="margin: 5px 0 0; color: #a7f3d0; font-size: 12px;">Notifikasi Dua Saluran (Sandaran Emel Automatik) • KKM/BPP/2023/HD-8491</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #cbd5e1;">Salam Sejahtera <strong style="color: #ffffff;">${patient.nama}</strong>,</p>
        <p style="font-size: 13px; color: #94a3b8; leading-height: 1.6;">
          Peringatan rasmi mengenai sesi rawatan hemodialisis anda yang dijadualkan seperti berikut:
        </p>

        <div style="background-color: #1e293b; border-left: 4px solid #10b981; padding: 16px; margin: 18px 0; border-radius: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr><td style="padding: 4px 0; color: #94a3b8; width: 140px;">Tarikh Rawatan:</td><td style="font-weight: bold; color: #34d399;">${dateFormatted}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Masa Rawatan:</td><td style="font-weight: bold; color: #ffffff;">${session.masaMula} - ${session.masaTamat} (${session.shift})</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Penetapan Mesin:</td><td style="color: #cbd5e1;">First-Come First-Served (FCFS) @ Kaunter</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Jururawat Bertugas:</td><td style="color: #cbd5e1;">${session.jururawatBertugas}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Akses Vaskular:</td><td style="color: #38bdf8;">${patient.jenisAkses} (${patient.lokasiAkses})</td></tr>
          </table>
        </div>

        <h4 style="color: #f1f5f9; margin-top: 20px; font-size: 13px;">📌 Arahan Persediaan Pesakit:</h4>
        <ul style="font-size: 12px; color: #cbd5e1; padding-left: 20px; line-height: 1.8;">
          <li>Sila hadir <strong>15 minit awal</strong> sebelum masa rawatan untuk ujian tekanan darah & timbangan berat.</li>
          <li>Basuh lengan akses vaskular dengan sabun antiseptik di kaunter pendaftaran.</li>
          <li>Maklumkan kepada jururawat bertugas jika ada demam atau gejala luar biasa.</li>
        </ul>

        <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #334155; padding-top: 12px;">
          Sebarang kecemasan, sila hubungi talian kaunter <strong>03-87270791</strong> atau WhatsApp <strong>019-338 9922</strong>.
        </p>
      </div>
    </div>
  `;

  return { subject, bodyText, bodyHtml };
}

// Generate Email for Doctor Visit
export function createDoctorVisitEmailMessage(patient: Patient, visit: DoctorVisit): EmailNotificationContent {
  const dateFormatted = formatMalayDate(visit.tarikhLawatan);
  const subject = `[Lawatan Pakar Nefrologi] Janji Temu Konsultasi ${visit.namaDoktor} - KaizenBros`;

  const bodyText = `PUSAT DIALISIS KAIZENBROS
PERINGATAN LAWATAN PAKAR NEFROLOGI (EMEL SANDARAN)

Salam Sejahtera ${patient.nama},

Sukacita dimaklumkan bahawa ${visit.namaDoktor} (${visit.jawatanDoktor}) akan mengadakan lawatan klinikal & konsultasi berkala 3 bulan bersama anda:

---------------------------------------------------------
BUTIRAN LAWATAN PAKAR:
---------------------------------------------------------
- Nama Pakar     : ${visit.namaDoktor}
- Jawatan Pakar  : ${visit.jawatanDoktor}
- Tarikh Lawatan : ${dateFormatted}
- Masa           : ${visit.masa}
- Tujuan Lawatan : ${visit.tujuan}
- Catatan Pakar  : ${visit.catatanPakar || 'Konsultasi berkala & pemantauan rawatan'}

Sila bawa buku rekod senarai ubat harian terkini. Terima kasih.
Pusat Dialisis KaizenBros`;

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #312e81; padding: 20px; text-align: center; border-bottom: 2px solid #6366f1;">
        <h2 style="margin: 0; color: #a5b4fc; font-size: 20px;">🩺 LAWATAN PAKAR NEFROLOGI</h2>
        <p style="margin: 5px 0 0; color: #c7d2fe; font-size: 12px;">Notifikasi Emel Rasmi • Pusat Dialisis KaizenBros</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #cbd5e1;">Salam Sejahtera <strong style="color: #ffffff;">${patient.nama}</strong>,</p>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
          Pakar Nefrologi KaizenBros akan membuat jangkauan rondaan klinikal berkala bersama anda:
        </p>

        <div style="background-color: #1e293b; border-left: 4px solid #6366f1; padding: 16px; margin: 18px 0; border-radius: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr><td style="padding: 4px 0; color: #94a3b8; width: 140px;">Pakar Nefrologi:</td><td style="font-weight: bold; color: #a5b4fc;">${visit.namaDoktor}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Tarikh Lawatan:</td><td style="font-weight: bold; color: #ffffff;">${dateFormatted}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Masa Consultation:</td><td style="color: #cbd5e1;">${visit.masa}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Tujuan:</td><td style="color: #cbd5e1;">${visit.tujuan}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Catatan:</td><td style="color: #93c5fd;">${visit.catatanPakar || 'Konsultasi berkala & pemantauan rawatan'}</td></tr>
          </table>
        </div>

        <p style="font-size: 12px; color: #cbd5e1;">
          📌 Sila pastikan anda membawa senarai ubat-ubatan harian terkini semasa sesi ronde berlangsung.
        </p>
      </div>
    </div>
  `;

  return { subject, bodyText, bodyHtml };
}

// Generate Email for Blood Test Date
export function createBloodTestEmailMessage(patient: Patient, testDate: string, notes?: string): EmailNotificationContent {
  const dateFormatted = formatMalayDate(testDate);
  const subject = `[Ujian Darah Berkala] Peringatan Ambil Sampel Darah (${dateFormatted}) - KaizenBros`;

  const bodyText = `PUSAT DIALISIS KAIZENBROS
PERINGATAN TARIKH UJIAN DARAH BERKALA (EMEL SANDARAN)

Salam Sejahtera ${patient.nama},

Pemberitahuan rasmi tarikh pengambilan sampel darah berkala 3 bulan anda di Pusat Dialisis KaizenBros:

- Tarikh Pengambilan : ${dateFormatted}
- Parameter Ujian    : Profil Buah Pinggang (Urea/Creatinine), Hemoglobin (Hb), Elektrolit (Kalium/K), Kalsium & Fosfat, Kt/V
- Arahan Jururawat   : ${notes || 'Sampel darah diambil melalui akses vaskular sebelum dialisis bermula.'}

Sekian, terima kasih.
Pusat Dialisis KaizenBros`;

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #881337; padding: 20px; text-align: center; border-bottom: 2px solid #f43f5e;">
        <h2 style="margin: 0; color: #fda4af; font-size: 20px;">🩸 UJIAN DARAH BERKALA 3 BULAN</h2>
        <p style="margin: 5px 0 0; color: #fecdd3; font-size: 12px;">Pusat Dialisis KaizenBros</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #cbd5e1;">Salam Sejahtera <strong style="color: #ffffff;">${patient.nama}</strong>,</p>
        <p style="font-size: 13px; color: #94a3b8;">Pemberitahuan jadual sampel darah berkala anda:</p>

        <div style="background-color: #1e293b; border-left: 4px solid #f43f5e; padding: 16px; margin: 18px 0; border-radius: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr><td style="padding: 4px 0; color: #94a3b8; width: 140px;">Tarikh Ujian:</td><td style="font-weight: bold; color: #fda4af;">${dateFormatted}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Ujian Terlibat:</td><td style="color: #cbd5e1;">Hb, Urea, Creatinine, Kalium, Kalsium, Kt/V</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Arahan:</td><td style="color: #fecdd3;">${notes || 'Sampel diambil melalui akses vaskular sebelum dialisis bermula.'}</td></tr>
          </table>
        </div>
      </div>
    </div>
  `;

  return { subject, bodyText, bodyHtml };
}

// Generate Email for Payment / Invoice
export function createPaymentEmailMessage(patient: Patient, tx: TransactionPayment): EmailNotificationContent {
  const dateFormatted = formatMalayDate(tx.tarikh);
  const subject = `[Invois & Penyata Rawatan] Invois #${tx.invoisNo} - KaizenBros`;

  const bodyText = `PUSAT DIALISIS KAIZENBROS
INVOIS & PENYATA RAWATAN (EMEL SANDARAN)

Salam Sejahtera ${patient.nama},

Berikut adalah perincian invois perkhidmatan rawatan anda:
- No. Invois     : ${tx.invoisNo}
- Tarikh Transaksi: ${dateFormatted}
- Perkara        : ${tx.perkara}
- Jumlah Kasar   : RM ${tx.jumlahKasar.toFixed(2)}
- Subsidi Penaja : -RM ${tx.subsidiPenaja.toFixed(2)} (${patient.penaja})
- Baki Bayaran   : RM ${tx.bayaranPesakit.toFixed(2)}
- Status         : ${tx.status === 'PAID' ? 'PAID (LUNAS)' : 'MENUNGGU BAYARAN'}

Terima kasih,
Bahagian Kewangan Pusat Dialisis KaizenBros`;

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #065f46; padding: 20px; text-align: center; border-bottom: 2px solid #10b981;">
        <h2 style="margin: 0; color: #34d399; font-size: 20px;">💳 INVOIS & PENYATA RAWATAN</h2>
        <p style="margin: 5px 0 0; color: #a7f3d0; font-size: 12px;">Pusat Dialisis KaizenBros</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #cbd5e1;">Salam Sejahtera <strong style="color: #ffffff;">${patient.nama}</strong>,</p>
        <div style="background-color: #1e293b; border-left: 4px solid #10b981; padding: 16px; margin: 18px 0; border-radius: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr><td style="padding: 4px 0; color: #94a3b8; width: 140px;">No. Invois:</td><td style="font-weight: bold; color: #ffffff;">${tx.invoisNo}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Tarikh:</td><td style="color: #cbd5e1;">${dateFormatted}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Perkara:</td><td style="color: #cbd5e1;">${tx.perkara}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Baki Bayaran:</td><td style="font-weight: bold; color: #34d399;">RM ${tx.bayaranPesakit.toFixed(2)}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Status:</td><td style="font-weight: bold; color: #38bdf8;">${tx.status === 'PAID' ? '✅ PAID' : '⏳ MENUNGGU BAYARAN'}</td></tr>
          </table>
        </div>
      </div>
    </div>
  `;

  return { subject, bodyText, bodyHtml };
}
