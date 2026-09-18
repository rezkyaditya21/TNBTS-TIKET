import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth.js';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const result = authenticateUser(email.trim(), password);

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Email atau kata sandi salah.' },
        { status: 401 }
      );
    }

    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      user: result.user,
      token: result.token,
    });

    // Set cookie — httpOnly prevents XSS token theft
    response.cookies.set('tnbts_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem pada saat login.' },
      { status: 500 }
    );
  }
}
