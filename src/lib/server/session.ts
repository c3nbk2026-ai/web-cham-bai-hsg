import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * ĐĂNG NHẬP HỌC SINH ĐỘI TUYỂN BẰNG MÃ PIN
 *  - private-data/ma-pin.json: bản mã hóa PIN (tạo bằng scripts/tao-ma-pin.js)
 *  - Đăng nhập xong, máy chủ cấp "phiên" có chữ ký, lưu trong cookie hsg_session (30 ngày)
 */
export const SESSION_COOKIE = 'hsg_session';
export const SESSION_DAYS = 30;

const norm = (s: string) => String(s || '').normalize('NFC').trim().replace(/\s+/g, ' ');

function secretKey(): Buffer {
    const base = process.env.GRADE_SECRET || process.env.GOOGLE_CREDENTIALS || process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || 'chi-dung-khi-chay-thu-tren-may';
    return crypto.createHash('sha256').update('procoder-session|' + base).digest();
}

function sign(data: string): string {
    return crypto.createHmac('sha256', secretKey()).update(data).digest('base64url');
}

export function createSession(name: string): string {
    const data = Buffer.from(JSON.stringify({ n: norm(name), iat: Date.now() }), 'utf8').toString('base64url');
    return data + '.' + sign(data);
}

/** Đọc phiên đăng nhập từ cookie của yêu cầu; trả về tên học sinh hoặc null. */
export function readSession(req: Request): string | null {
    const cookie = req.headers.get('cookie') || '';
    const m = cookie.match(new RegExp('(?:^|;\\s*)' + SESSION_COOKIE + '=([^;]+)'));
    if (!m) return null;
    const [data, sig] = decodeURIComponent(m[1]).split('.');
    if (!data || !sig) return null;
    const a = Buffer.from(sign(data)), b = Buffer.from(sig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const p = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
        if (!p.n || !p.iat || Date.now() - p.iat > SESSION_DAYS * 86400_000) return null;
        return String(p.n);
    } catch {
        return null;
    }
}

function loadPinDb(): Record<string, { salt: string; hash: string }> {
    try {
        const db = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'private-data', 'ma-pin.json'), 'utf8'));
        return db.hocSinh || {};
    } catch {
        return {};
    }
}

// Chống dò PIN: sai 5 lần trong 15 phút → khóa tên đó 15 phút
const fails = new Map<string, { count: number; first: number; lockedUntil: number }>();

export type PinCheck = { ok: true; name: string } | { ok: false; error: string };

export function checkPin(nameRaw: string, pinRaw: string): PinCheck {
    const name = norm(nameRaw);
    const pin = String(pinRaw || '').trim();
    const now = Date.now();
    const f = fails.get(name);
    if (f && f.lockedUntil > now) {
        const min = Math.ceil((f.lockedUntil - now) / 60000);
        return { ok: false, error: `Nhập sai nhiều lần, em chờ ${min} phút rồi thử lại.` };
    }
    const entry = loadPinDb()[name];
    if (!entry) return { ok: false, error: 'Tên này chưa được cấp mã PIN, em báo giáo viên nhé.' };

    let ok = false;
    if (/^\d{6}$/.test(pin)) {
        const h = crypto.scryptSync(pin, entry.salt, 32, { N: 16384, r: 8, p: 1 });
        const expected = Buffer.from(entry.hash, 'hex');
        ok = expected.length === h.length && crypto.timingSafeEqual(h, expected);
    }
    if (ok) {
        fails.delete(name);
        return { ok: true, name };
    }
    const rec = f && now - f.first < 15 * 60_000 ? f : { count: 0, first: now, lockedUntil: 0 };
    rec.count += 1;
    if (rec.count >= 5) rec.lockedUntil = now + 15 * 60_000;
    fails.set(name, rec);
    return { ok: false, error: 'Mã PIN không đúng.' };
}
