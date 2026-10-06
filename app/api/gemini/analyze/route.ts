import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { fileDataUrl, fileName, patientName, patientAge, patientGender } = await req.json();

    if (!fileDataUrl) {
      return NextResponse.json({ error: "Tiada data fail disediakan." }, { status: 400 });
    }

    // Extract base64 and mime type safely
    let mimeType = 'image/png';
    let base64Data = '';

    const matches = fileDataUrl.match(/^data:([^;]+)(;base64)?,(.*)$/);
    if (matches) {
      mimeType = matches[1].trim();
      base64Data = matches[3];
    } else {
      base64Data = fileDataUrl.replace(/^data:.*?;base64,/, '');
    }

    if (fileName) {
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (lower.endsWith('.png')) mimeType = 'image/png';
      else if (lower.endsWith('.webp')) mimeType = 'image/webp';
    }

    const prompt = `
Anda adalah Pakar Analisis & Pengekstrakan Laporan Makmal Darah (Laboratory Blood Test Extraction AI) berlesen di Pusat Dialisis KaizenBros.

TUGAS UTAMA:
Ekstrak secara teliti, tepat dan 100% TULEN HANYA bacaan berangka (numerical values) SEBENAR yang benar-benar tercatat dalam dokumen atau imej laporan makmal ini.

MAKLUMAT PESAKIT DALAM SISTEM:
- Nama Pesakit: ${patientName || "Pesakit Hemodialisis"}
- Umur: ${patientAge || "N/A"}
- Jantina: ${patientGender || "N/A"}
- Nama Fail: ${fileName || "Laporan Makmal"}

SYARAT MUTLAK BEBAS-HALUSINASI & WAJIB DIPATUHI:
1. HANYA ekstrak apa yang TERPAMPANG JELAS dalam dokumen.
2. DILARANG SAMA SEKALI mencipta, mengagak, atau menggunakan data palsu/contoh/andaian (seperti 6.2, 10.5, 640, 18.2, 5.1 dsb) jika tidak tertera dalam dokumen ini!
3. Jika sesuatu ujian TIDAK ADA dalam dokumen, tinggalkan medan sebagai "" (string kosong). JANGAN letak sebarang angka andaian.
4. Nilai berangka hendaklah bersih tanpa unit (contoh: jika tertulis "Hb 11.2 g/dL", ekstrak "11.2"; jika "K+ 5.4 mmol/L", ekstrak "5.4"; jika "Albumin 38", ekstrak "38").
5. Cari sinonim dan singkatan klinikal makmal Malaysia:
   - Hemoglobin (Hb, Hgb)
   - WBC (White Blood Count, Leukocytes, TLC)
   - Platelet (Plt, Thrombocytes)
   - Urea (Blood Urea, B. Urea, BUN)
   - Creatinine (Creat, Serum Creatinine, Cr, Serum Cr)
   - eGFR (GFR, Glomerular Filtration Rate)
   - Calcium (Serum Calcium, Total Calcium, Ca)
   - Phosphate (Serum Phosphate, Inorganic Phosphorus, PO4, Phosphate PO4)
   - Potassium (Serum Potassium, Kalium, K, K+)
   - Sodium (Serum Sodium, Natrium, Na, Na+)
   - Glucose (Fasting Blood Sugar, FBS, Blood Glucose, Random Blood Sugar, RBS, Glukosa)
   - HbA1c (Glycated Hemoglobin, A1c)
   - Lipid Profile: Total Cholesterol (TC), LDL, HDL, Triglycerides (TG)
6. Jika ada ujian makmal lain yang tidak tersenarai di atas (cth: Albumin, ALT, AST, Ferritin, Uric Acid, dsb) yang ADA dalam dokumen, masukkan ke dalam array "other_tests".
7. Ekstrak tarikh ujian makmal sebenar sekiranya tercatat dalam dokumen (format YYYY-MM-DD).

Sila balas DALAM FORMAT JSON SAHAJA mengikut skema berikut:
{
  "test_date": "YYYY-MM-DD atau kosong jika tiada dalam dokumen",
  "lab_name": "Nama makmal atau hospital jika ada tertera",
  "document_patient_name": "Nama pesakit yang tertera pada laporan jika ada",
  "extracted_results": {
    "hematology": {
      "hemoglobin": "",
      "wbc": "",
      "platelet": ""
    },
    "renal": {
      "urea": "",
      "creatinine": "",
      "egfr": "",
      "calcium": "",
      "phosphate": "",
      "potassium": "",
      "sodium": ""
    },
    "diabetes": {
      "glucose": "",
      "hba1c": ""
    },
    "lipid": {
      "cholesterol": "",
      "ldl": "",
      "hdl": "",
      "triglycerides": ""
    },
    "other_tests": [
      {
        "test_name": "Nama Ujian",
        "result": "Nilai Angka",
        "unit": "Unit jika ada",
        "range": "Julat rujukan jika ada",
        "status": "NORMAL | HIGH | LOW"
      }
    ]
  },
  "document_summary": "Penerangan ringkas jenis laporan dan ringkasan ujian yang benar-benar wujud dalam dokumen ini",
  "ai_analysis": "Ulasan klinikal berasaskan HANYA data sebenar yang berjaya diekstrak di atas dalam Bahasa Melayu yang mesra pesakit hemodialisis. Berikan tumpuan kepada parameter kritikal seperti Potassium, Phosphate, Hemoglobin, dan Glucose sekiranya ada. Jika sesuatu ujian tiada dalam laporan, nyatakan dengan jujur bahawa ia tidak terkandung dalam dokumen ini."
}
`;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "Kunci API Gemini tidak dikonfigurasikan di pelayan. Sila masukkan data darah secara manual.",
        extracted_results: null,
        ai_analysis: null
      }, { status: 503 });
    }

    // Try reliable standard Gemini models: gemini-2.5-flash first, followed by gemini-1.5-flash, gemini-2.0-flash, and gemini-2.5-pro
    const candidateModels = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            prompt
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        if (response && response.text) {
          const cleanText = response.text.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
          const parsed = JSON.parse(cleanText);
          
          if (parsed && (parsed.extracted_results || parsed.ai_analysis)) {
            // Count actual non-empty values
            let count = 0;
            const er = parsed.extracted_results || {};
            for (const cat of ['hematology', 'renal', 'diabetes', 'lipid']) {
              if (er[cat]) {
                for (const key of Object.keys(er[cat])) {
                  if (er[cat][key] !== undefined && er[cat][key] !== null && String(er[cat][key]).trim() !== '') {
                    count++;
                  }
                }
              }
            }
            if (Array.isArray(er.other_tests)) {
              count += er.other_tests.length;
            }

            return NextResponse.json({
              ...parsed,
              extracted_count: count,
              model_used: modelName,
              is_real_extraction: true
            });
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed during blood report analysis:`, err?.message || err);
      }
    }

    console.error("All Gemini models failed for blood report analysis:", lastError);
    
    // Check if error is quota exceeded (429)
    const isQuotaExceeded = String(lastError?.message || '').includes('429') || String(lastError?.message || '').includes('RESOURCE_EXHAUSTED') || String(lastError?.message || '').includes('quota');
    const userMessage = isQuotaExceeded
      ? "Had kuota penggunaan Gemini API sementara ini telah dipenuhi (Rate limit 429). Sila masukkan nilai ujian darah secara manual atau cuba sebentar lagi."
      : "AI tidak dapat membaca fail ini dengan jelas (" + (lastError?.message || 'Ralat sambungan') + "). Sila semak format dokumen atau masukkan bacaan secara manual.";

    return NextResponse.json({
      error: userMessage,
      extracted_results: null,
      ai_analysis: null
    }, { status: isQuotaExceeded ? 429 : 500 });

  } catch (error: any) {
    console.error("Analysis route error:", error);
    return NextResponse.json({ 
      error: "Gagal memproses analisis darah: " + error.message,
      extracted_results: null,
      ai_analysis: null
    }, { status: 500 });
  }
}
