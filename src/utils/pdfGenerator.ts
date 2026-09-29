import jsPDF from 'jspdf';
import { safeCaptureHtmlToCanvas } from './html2canvasHelper';

export interface GeneratedFileResult {
  blob: Blob;
  file: File;
  dataUrl: string;
}

/**
 * Captures an HTML element by ID and converts it into a PDF file/blob (A5 or A4 size).
 */
export async function generateElementAsPdf(
  elementId: string,
  fileName: string = 'Resit_Rasmi_KaizenBros.pdf'
): Promise<GeneratedFileResult | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element ID "${elementId}" not found for PDF generation.`);
    return null;
  }

  try {
    const canvas = await safeCaptureHtmlToCanvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    // A5 dimensions in mm: 148 x 210
    const pdfWidth = 148;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const blob = pdf.output('blob');
    const pdfFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const file = new File([blob], pdfFileName, { type: 'application/pdf' });
    const dataUrl = URL.createObjectURL(blob);

    return { blob, file, dataUrl };
  } catch (err) {
    console.error('Error generating PDF:', err);
    return null;
  }
}

/**
 * Captures an HTML element by ID and converts it into a PNG file/blob.
 */
export async function generateElementAsPng(
  elementId: string,
  fileName: string = 'Resit_Rasmi_KaizenBros.png'
): Promise<GeneratedFileResult | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element ID "${elementId}" not found for PNG generation.`);
    return null;
  }

  try {
    const canvas = await safeCaptureHtmlToCanvas(element, { scale: 2 });
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const pngFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
        const file = new File([blob], pngFileName, { type: 'image/png' });
        const dataUrl = URL.createObjectURL(blob);
        resolve({ blob, file, dataUrl });
      }, 'image/png');
    });
  } catch (err) {
    console.error('Error generating PNG:', err);
    return null;
  }
}

/**
 * Triggers 1-Click Send to WhatsApp or Email with attached/downloaded PDF or PNG file.
 */
export async function sendReceiptDocument({
  elementId = 'printable-a5-receipt',
  format = 'pdf',
  target = 'whatsapp',
  patientName,
  phoneNumber,
  emailAddress,
  receiptNo,
  amountStr,
  tarikhStr,
  perkara,
  isPaid,
  penaja
}: {
  elementId?: string;
  format: 'pdf' | 'png';
  target: 'whatsapp' | 'email';
  patientName: string;
  phoneNumber?: string;
  emailAddress?: string;
  receiptNo: string;
  amountStr: string;
  tarikhStr: string;
  perkara: string;
  isPaid: boolean;
  penaja?: string;
}): Promise<{ success: boolean; sharedViaApi: boolean; message: string }> {
  const fileName = `Resit_A5_KaizenBros_${receiptNo}.${format}`;

  let generatedResult: GeneratedFileResult | null = null;
  if (format === 'pdf') {
    generatedResult = await generateElementAsPdf(elementId, fileName);
  } else {
    generatedResult = await generateElementAsPng(elementId, fileName);
  }

  if (!generatedResult) {
    return {
      success: false,
      sharedViaApi: false,
      message: 'Gagal menjana dokumen resit. Sila cuba lagi.'
    };
  }

  const { file, dataUrl } = generatedResult;

  // Formulate text body
  const statusStr = isPaid ? 'PAID (LUNAS)' : 'DALAM PROSES / UNPAID';
  const whatsappMsg = 
`*PUSAT DIALISIS KAIZENBROS* 💳
_Resit & Invois Rasmi Rawatan Dialisis (Format ${format.toUpperCase()})_

Salam Sejahtera *${patientName}*,

Berikut disertakan dokumen resit/invois rasmi anda bagi rawatan hemodialisis:
• *No. Resit/Invois*: ${receiptNo}
• *Tarikh*: ${tarikhStr}
• *Perkara*: ${perkara}
• *Jumlah Bayaran*: RM ${amountStr}
• *Penaja Rawatan*: ${penaja || 'Persendirian'}
• *Status*: ${statusStr}

📄 *Dokumen ${format.toUpperCase()} telah dijana khas.* Dokumen ini diiktiraf oleh KKM & LHDN untuk tuntutan PERKESO/JPA/Zakat dan pelepasan cukai pendapatan.

Terima kasih.
_Pusat Dialisis KaizenBros_`;

  const emailSubject = `Resit Rasmi Rawatan Dialisis #${receiptNo} (${format.toUpperCase()}) - Pusat Dialisis KaizenBros`;
  const emailBody = 
`Salam Sejahtera ${patientName},

Berikut disertakan salinan resit/invois rasmi rawatan hemodialisis anda dalam format ${format.toUpperCase()}:

--------------------------------------------------
No. Resit / Invois : ${receiptNo}
Nama Pesakit       : ${patientName}
Tarikh Rawatan     : ${tarikhStr}
Perkara Rawatan    : ${perkara}
Jumlah Bayaran     : RM ${amountStr}
Penaja Rawatan     : ${penaja || 'Persendirian'}
Status Bayaran     : ${statusStr}
--------------------------------------------------

Dokumen resit rasmi berformat ${format.toUpperCase()} ini sah bagi urusan pelepasan cukai pendapatan LHDN & tuntutan penaja (PERKESO/JPA/Zakat).

Terima kasih kerana memilih Pusat Dialisis KaizenBros.

Pusat Dialisis KaizenBros
Tel Kaunter: 03-87270791`;

  // Check if Web Share API with files is supported (e.g. mobile/supported browsers)
  let sharedViaApi = false;
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: `Resit ${receiptNo}`,
        text: target === 'whatsapp' ? whatsappMsg : emailBody
      });
      sharedViaApi = true;
      return {
        success: true,
        sharedViaApi: true,
        message: `Dokumen resit ${format.toUpperCase()} berjaya dikongsi menerusi pilihan perkongsian sistem!`
      };
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.warn('Web Share API failed, fallback to direct download + launch app:', e);
      } else {
        return {
          success: true,
          sharedViaApi: true,
          message: 'Perkongsian dibatalkan oleh pengguna.'
        };
      }
    }
  }

  // Fallback if Web Share is not available or rejected:
  // 1. Trigger browser download of PDF or PNG
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 2. Open WhatsApp or Email app
  if (target === 'whatsapp') {
    const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('60')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? '6' + cleanPhone
      : '60' + cleanPhone;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(waUrl, '_blank');
  } else {
    const mailUrl = `mailto:${emailAddress || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailUrl, '_blank');
  }

  return {
    success: true,
    sharedViaApi: false,
    message: `Fail resit ${format.toUpperCase()} dimuat turun & aplikasi ${target === 'whatsapp' ? 'WhatsApp' : 'E-mel'} dibuka!`
  };
}
