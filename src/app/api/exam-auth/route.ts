import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRawExamConfig, publicExamConfig } from '@/lib/server/examConfig';

export const dynamic = 'force-dynamic';

function sameText(a: string, b: string): boolean {
    const ha = crypto.createHash('sha256').update(a).digest();
    const hb = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(ha, hb);
}

/**
 * POST /api/exam-auth  { kind: 'room' | 'teacher', value }
 * Kiểm tra Mã phòng thi / Mật khẩu giám thị NGAY TRÊN MÁY CHỦ.
 * Trình duyệt không bao giờ nhận được mã/mật khẩu thật.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const kind = body?.kind === 'teacher' ? 'teacher' : 'room';
        const value = typeof body?.value === 'string' ? body.value.trim() : '';
        // Làm chậm thử sai hàng loạt
        await new Promise(r => setTimeout(r, 400));

        const raw = await getRawExamConfig();
        if (kind === 'room') {
            const target = (raw['MaPhongThi'] || '').trim().toUpperCase();
            if (!target) return NextResponse.json({ ok: false, error: 'Chưa cấu hình MaPhongThi trong tab CauHinh' });
            const ok = !!value && sameText(value.toUpperCase(), target);
            return NextResponse.json(ok ? { ok, config: publicExamConfig(raw) } : { ok: false });
        }

        const target = (raw['MatKhauGiamThi'] || raw['AdminPassword'] || '').trim();
        if (!target) {
            return NextResponse.json({ ok: false, error: 'Chưa cấu hình MatKhauGiamThi trong tab CauHinh' });
        }
        const ok = !!value && sameText(value, target);
        return NextResponse.json(ok ? { ok, config: publicExamConfig(raw) } : { ok: false });
    } catch (error: any) {
        console.error('Exam auth error:', error);
        return NextResponse.json({ ok: false, error: 'Lỗi kết nối Google Sheets' }, { status: 500 });
    }
}
