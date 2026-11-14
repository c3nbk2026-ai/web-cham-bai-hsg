import crypto from 'crypto';

/**
 * "Chữ ký điểm": sau khi máy chủ chấm, nó ký kết quả bằng khóa bí mật.
 * /api/sheets chỉ ghi điểm khi chữ ký hợp lệ, nên học sinh không thể tự gửi điểm giả.
 * Khóa lấy từ biến môi trường GRADE_SECRET (nên đặt trên Vercel);
 * nếu chưa đặt thì suy ra từ GOOGLE_CREDENTIALS (vốn đã bí mật).
 */
export interface GradePayload {
    k: 'HSG' | 'KTGK';   // loại bài
    p: string;           // tên bài (problem) đúng như gửi lên bảng điểm
    s: string;           // điểm
    m: number;           // điểm tối đa
    pa: number;          // số test đúng (có thể lẻ 0.5 với KTGK)
    t: number;           // tổng số test
    ch: string;          // mã băm SHA-256 của mã nguồn đã chấm
    iat: number;         // thời điểm chấm (ms)
}

const MAX_AGE_MS = 6 * 60 * 60 * 1000; // chữ ký có hiệu lực 6 giờ

function secretKey(): Buffer {
    const base = process.env.GRADE_SECRET || process.env.GOOGLE_CREDENTIALS || process.env.GEMINI_API_KEY || 'chi-dung-khi-chay-thu-tren-may';
    return crypto.createHash('sha256').update('procoder-grade|' + base).digest();
}

function sign(data: string): string {
    return crypto.createHmac('sha256', secretKey()).update(data).digest('base64url');
}

export function signGrade(payload: GradePayload): string {
    const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    return data + '.' + sign(data);
}

export function verifyGrade(token: unknown): GradePayload | null {
    if (typeof token !== 'string' || token.length > 4000) return null;
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expected = Buffer.from(sign(data));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as GradePayload;
        if (!payload.iat || Date.now() - payload.iat > MAX_AGE_MS) return null;
        return payload;
    } catch {
        return null;
    }
}

export function sha256Node(text: string): string {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}
