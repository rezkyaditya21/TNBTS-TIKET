import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { validateTicketScan } from '@/lib/ticketEngine.js';

export async function POST(request) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Silakan login sebagai petugas gerbang.' },
        { status: 401 }
      );
    }

    const isAuthorized = ['PETUGAS', 'SUPER_ADMIN', 'ADMIN_TNBTS'].includes(user.primary_role);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: Hanya petugas pos jaga yang berhak memindai tiket.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { qrPayload, ticketCode, token, gateLocation = 'CEMORO_LAWANG', isOfflineSync = false } = body;

    let finalTicketCode = ticketCode;
    let finalToken = token;

    // Support parsing raw QR code payload if sent directly
    if (qrPayload) {
      try {
        const parsed = JSON.parse(qrPayload);
        finalTicketCode = parsed.code || parsed.ticketCode || finalTicketCode;
        finalToken = parsed.token || finalToken;
      } catch (e) {
        // Raw code fallback
        finalTicketCode = qrPayload.trim();
      }
    }

    if (!finalTicketCode) {
      return NextResponse.json(
        { success: false, message: 'Kode tiket tidak terdeteksi pada pemindaian.' },
        { status: 400 }
      );
    }

    const result = validateTicketScan({
      ticketCode: finalTicketCode,
      providedToken: finalToken,
      officerUserId: user.id,
      gateLocation,
      deviceInfo: request.headers.get('user-agent') || 'Ranger-Mobile-Scanner',
      isOfflineSync,
    });

    return NextResponse.json({
      success: result.isValid,
      data: result,
    });
  } catch (err) {
    console.error('Gate scan error:', err);
    return NextResponse.json(
      { success: false, message: 'Terjadi kegagalan verifikasi pada gerbang.' },
      { status: 500 }
    );
  }
}
