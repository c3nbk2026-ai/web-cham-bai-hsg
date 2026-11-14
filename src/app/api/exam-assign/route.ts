import { NextResponse } from 'next/server';
import { getSheetsClient, SPREADSHEET_ID } from '@/lib/server/google';

export const dynamic = 'force-dynamic';

const norm = (s: string) => (s || "").trim().toLowerCase();

/** Tìm dòng của học sinh trong tab DanhSachHS (C: HoTen, D: Lop, E: SoLanThi, F: MaDe). */
async function findStudentRow(studentName: string, className: string) {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'DanhSachHS!C2:F',
    });
    const rows = response.data.values || [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (norm(row[0]) === norm(studentName) && norm(row[1]) === norm(className)) {
            const assignedExam = row[3] ? String(row[3]).trim() : null;
            return { sheets, rowIndex: i + 2, assignedExam: assignedExam || null };
        }
    }
    return { sheets, rowIndex: 0, assignedExam: null as string | null };
}

// GET: Kiểm tra mã đề đã bốc của học sinh (cột F)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const studentName = searchParams.get('studentName')?.trim();
        const className = searchParams.get('className')?.trim();
        if (!studentName || !className) {
            return NextResponse.json({ error: "Thiếu tên hoặc lớp của học sinh" }, { status: 400 });
        }
        const found = await findStudentRow(studentName, className);
        if (!found.rowIndex) return NextResponse.json({ found: false, assignedExam: null });
        return NextResponse.json({ found: true, rowIndex: found.rowIndex, assignedExam: found.assignedExam });
    } catch (error: any) {
        console.error("API Exam Assign GET Error:", error);
        return NextResponse.json({ error: "Lỗi kiểm tra mã đề" }, { status: 500 });
    }
}

// POST: Ghi mã đề vừa bốc vào cột F.
// Chỉ ghi khi ô F đang TRỐNG (học sinh chưa bốc đề, hoặc giáo viên đã xóa để cho thi lại).
// Máy chủ tự tìm dòng theo tên + lớp, không tin số dòng do trình duyệt gửi.
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const studentName = typeof body?.studentName === 'string' ? body.studentName : '';
        const className = typeof body?.className === 'string' ? body.className : '';
        const examName = typeof body?.examName === 'string' ? body.examName.trim() : '';

        if (!examName || examName.length > 60) {
            return NextResponse.json({ error: "Thiếu mã đề cần gán" }, { status: 400 });
        }
        if (!studentName || !className) {
            return NextResponse.json({ error: "Thiếu tên hoặc lớp của học sinh" }, { status: 400 });
        }

        const found = await findStudentRow(studentName, className);
        if (!found.rowIndex) {
            return NextResponse.json({ error: "Không tìm thấy học sinh trong danh sách" }, { status: 404 });
        }
        if (found.assignedExam) {
            if (norm(found.assignedExam) === norm(examName)) {
                return NextResponse.json({ success: true, rowIndex: found.rowIndex, examName: found.assignedExam });
            }
            return NextResponse.json({
                error: `Học sinh đã có mã đề ${found.assignedExam}. Giáo viên cần xóa ô Mã đề (cột F) để cho bốc lại.`,
                assignedExam: found.assignedExam,
            }, { status: 409 });
        }

        await found.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `DanhSachHS!F${found.rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[examName]] },
        });
        return NextResponse.json({ success: true, rowIndex: found.rowIndex, examName });
    } catch (error: any) {
        console.error("API Exam Assign POST Error:", error);
        return NextResponse.json({ error: "Lỗi cập nhật mã đề" }, { status: 500 });
    }
}
