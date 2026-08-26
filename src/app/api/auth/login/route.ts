import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPin, sanitizeString } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const { username, pin } = await req.json();

    const cleanUsername = sanitizeString(username)?.toLowerCase().trim();
    const cleanPin = String(pin || '').trim();

    if (!cleanUsername || !cleanPin) {
      return NextResponse.json({ success: false, error: 'Username and PIN are required.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        username: cleanUsername,
        active: true,
      },
    });

    if (!user || !verifyPin(cleanPin, user.pin)) {
      // Log failed attempt
      await prisma.activityLog.create({
        data: {
          userId: 'guest',
          userName: cleanUsername || 'Unknown',
          action: 'LOGIN_FAILED',
          details: `Failed login attempt for username "${cleanUsername}"`,
        },
      });

      return NextResponse.json({ success: false, error: 'Invalid username or security PIN code.' }, { status: 401 });
    }

    // Successful login log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'USER_LOGIN',
        details: `User ${user.name} logged in successfully as ${user.role}`,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal authentication error' }, { status: 500 });
  }
}
