import { NextResponse } from 'next/server';
import { gradeSubmission, GradeError } from '@/lib/server/grading';
import { signGrade, sha256Node } from '@/lib/server/gradeToken';

export const dynamic = 'force-dynamic';

/**
 * POST /api/grade
 * Trình duyệt gửi: mã nguồn + dấu vân tay kết quả từng test (KHÔNG gửi điểm).
 * Máy chủ: so với đáp án trong private-data/, tính điểm, trả về kèm "chữ ký điểm".
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const code = typeof body?.code === 'string' ? body.code : '';
        if (code.length > 100_000) {
            return NextResponse.json({ error: 'Mã nguồn quá dài' }, { status: 413 });
        }
        const result = await gradeSubmission(body);
        const token = signGrade({
            k: result.kind,
            p: result.problem,
            s: result.score,
            m: result.maxScore,
            pa: result.passed,
            t: result.total,
            ch: sha256Node(code),
            iat: Date.now(),
        });
        return NextResponse.json({ ...result, token });
    } catch (error: any) {
        if (error instanceof GradeError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Grade API Error:', error);
        return NextResponse.json({ error: 'Lỗi máy chấm' }, { status: 500 });
    }
}
