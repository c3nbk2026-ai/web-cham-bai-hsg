import { NextResponse } from 'next/server';
import { getRawExamConfig, publicExamConfig } from '@/lib/server/examConfig';

export const dynamic = 'force-dynamic';

/** Cấu hình phòng thi CÔNG KHAI (đã lọc bỏ mã phòng thi và mật khẩu giám thị). */
export async function GET() {
    try {
        const config = publicExamConfig(await getRawExamConfig());
        if (Object.keys(config).length === 0) {
            return NextResponse.json({ error: "Không tìm thấy cấu hình." }, { status: 404 });
        }
        return NextResponse.json(config);
    } catch (error: any) {
        console.error('API Exam Config Error:', error);
        return NextResponse.json({ error: 'Lỗi lấy cấu hình phòng thi' }, { status: 500 });
    }
}
