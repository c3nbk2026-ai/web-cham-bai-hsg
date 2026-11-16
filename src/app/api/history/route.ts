import { NextResponse } from 'next/server';
import { getSheetsClient, SCORE_SPREADSHEET_ID } from '@/lib/server/google';
import { readSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/history: 30 lần nộp gần nhất của học sinh ĐANG ĐĂNG NHẬP,
 * đọc từ tab BangDiem_DaiTra và BangDiem_DoiTuyen (A: thời gian, B: tên, C: tuần, D: loại bài,
 * E: bài, J: điểm thang 10, K: mã nguồn).
 */
export async function GET(req: Request) {
    const name = readSession(req);
    if (!name) return NextResponse.json({ error: 'Em cần đăng nhập để xem lịch sử.' }, { status: 401 });
    try {
        const sheets = getSheetsClient(true);
        const res = await sheets.spreadsheets.values.batchGet({
            spreadsheetId: SCORE_SPREADSHEET_ID,
            ranges: ['BangDiem_DaiTra!A:K', 'BangDiem_DoiTuyen!A:K'],
        });
        const norm = (s: string) => String(s || '').normalize('NFC').trim().toLowerCase();
        const me = norm(name);
        const items: any[] = [];
        (res.data.valueRanges || []).forEach((vr: any, tab: number) => {
            (vr.values || []).forEach((row: any[], i: number) => {
                if (norm(row[1]) !== me) return;
                items.push({
                    order: tab * 1e6 + i,
                    date: row[0] || '',
                    week: row[2] || '',
                    loaiBai: row[3] || '',
                    problem: row[4] || '',
                    score: row[9] || '',
                    maxScore: 10,
                    code: String(row[10] || '').slice(0, 5000),
                    nhom: tab === 0 ? 'Cơ Bản / Luyện Đề' : 'Nâng Cao',
                });
            });
        });
        // Mới nhất trước: trong mỗi tab dòng dưới là dòng mới hơn; trộn 2 tab theo thời gian ghi trong cột A
        const toTime = (s: string) => {
            const m = String(s).match(/(\d{1,2}):(\d{2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            return m ? Date.UTC(+m[6], +m[5] - 1, +m[4], +m[1], +m[2], +m[3]) : 0;
        };
        items.sort((a, b) => (toTime(b.date) - toTime(a.date)) || (b.order - a.order));
        return NextResponse.json({ name, items: items.slice(0, 30).map(({ order, ...x }) => x) });
    } catch (e: any) {
        console.error('History error:', e);
        return NextResponse.json({ error: 'Không đọc được lịch sử từ Google Sheet.' }, { status: 500 });
    }
}
