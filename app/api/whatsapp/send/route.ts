import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, message, token } = body;

    if (!target || !message) {
      return NextResponse.json(
        { success: false, error: 'Nombor telefon penerima dan mesej WhatsApp diperlukan.' },
        { status: 400 }
      );
    }

    const fonnteToken = token || process.env.FONNTE_API_TOKEN || process.env.NEXT_PUBLIC_FONNTE_TOKEN;

    if (!fonnteToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Fonnte API Token belum dikonfigurasikan. Sila masukkan token Fonnte di Portal Pentadbir > Tetapan Sistem.' 
        },
        { status: 400 }
      );
    }

    // Format target phone number to standard format (e.g., 0123456789 -> 60123456789 or 017-6543210 -> 60176543210)
    let cleanPhone = target.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '6' + cleanPhone;
    } else if (!cleanPhone.startsWith('60') && cleanPhone.length >= 9) {
      cleanPhone = '60' + cleanPhone;
    }

    const fonnteRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: cleanPhone,
        message: message,
        countryCode: '60',
      }),
    });

    const data = await fonnteRes.json().catch(() => null);

    if (!fonnteRes.ok || (data && data.status === false)) {
      return NextResponse.json(
        { 
          success: false, 
          error: data?.reason || data?.message || 'Gagal menghantar mesej melalui penyedia Fonnte.',
          details: data 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mesej WhatsApp berjaya dihantar melalui Fonnte.',
      data: data
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Ralat pelayan semasa menghantar WhatsApp.' },
      { status: 500 }
    );
  }
}
