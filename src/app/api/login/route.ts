import { NextResponse } from 'next/server';
import { checkPin, createSession, readSession, SESSION_COOKIE, SESSION_DAYS } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

function cookieOptions(maxAge: number) {
    return { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge };
}

// GET: đang đăng nhập với tên nào?
export async function GET(req: Request) {
    return NextResponse.json({ name: readSession(req) });
}

// POST { name, pin }: đăng nhập
export async function POST(req: Request) {
    try {
        const body = await req.json();
        await new Promise(r => setTimeout(r, 300)); // làm chậm thử sai hàng loạt
        const result = checkPin(String(body?.name || ''), String(body?.pin || ''));
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
        const res = NextResponse.json({ name: result.name });
        res.cookies.set(SESSION_COOKIE, createSession(result.name), cookieOptions(SESSION_DAYS * 86400));
        return res;
    } catch {
        return NextResponse.json({ error: 'Lỗi đăng nhập' }, { status: 500 });
    }
}

// DELETE: đăng xuất
export async function DELETE() {
    const res = NextResponse.json({ name: null });
    res.cookies.set(SESSION_COOKIE, '', cookieOptions(0));
    return res;
}
