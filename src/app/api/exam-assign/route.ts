import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";

export const dynamic = 'force-dynamic';

function getAuth() {
    if (process.env.GOOGLE_CREDENTIALS) {
        return new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }
    return new google.auth.GoogleAuth({
        keyFile: path.join(process.cwd(), 'credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
}

// GET: Kiểm tra mã đề đã bốc của học sinh từ cột F (MaDe) tab DanhSachHS
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const studentName = searchParams.get('studentName')?.trim();
        const className = searchParams.get('className')?.trim();

        if (!studentName || !className) {
            return NextResponse.json({ error: "Thiếu tên hoặc lớp của học sinh" }, { status: 400 });
        }

        const auth = getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // Cột C: HoTen, D: Lop, E: SoLanThi, F: MaDe
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'DanhSachHS!C2:F',
        });

        const rows = response.data.values || [];
        const norm = (s: string) => (s || "").trim().toLowerCase();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rStudent = norm(row[0]);
            const rClass = norm(row[1]);

            if (rStudent === norm(studentName) && rClass === norm(className)) {
                const rowIndex = i + 2; // Dòng thực tế trong Google Sheet (bắt đầu từ C2 là dòng 2)
                const assignedExam = row[3] ? row[3].trim() : null; // Cột F là index 3 tính từ C
                return NextResponse.json({
                    found: true,
                    rowIndex,
                    assignedExam: assignedExam || null
                });
            }
        }

        return NextResponse.json({ found: false, assignedExam: null });
    } catch (error: any) {
        console.error("API Exam Assign GET Error:", error);
        return NextResponse.json({ error: error.message || "Lỗi kiểm tra mã đề" }, { status: 500 });
    }
}

// POST: Ghi mã đề đã bốc vào cột F của học sinh
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { studentName, className, examName, rowIndex } = body;

        if (!examName) {
            return NextResponse.json({ error: "Thiếu mã đề cần gán" }, { status: 400 });
        }

        const auth = getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        let targetRowIndex = rowIndex;

        // Nếu client chưa có rowIndex, tìm dòng của học sinh
        if (!targetRowIndex) {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: 'DanhSachHS!C2:D',
            });
            const rows = response.data.values || [];
            const norm = (s: string) => (s || "").trim().toLowerCase();
            for (let i = 0; i < rows.length; i++) {
                const rStudent = norm(rows[i][0]);
                const rClass = norm(rows[i][1]);
                if (rStudent === norm(studentName) && rClass === norm(className)) {
                    targetRowIndex = i + 2;
                    break;
                }
            }
        }

        if (!targetRowIndex) {
            return NextResponse.json({ error: "Không tìm thấy học sinh trong danh sách" }, { status: 404 });
        }

        // Cập nhật ô F{targetRowIndex} với mã đề
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `DanhSachHS!F${targetRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[examName.trim()]],
            },
        });

        return NextResponse.json({ success: true, rowIndex: targetRowIndex, examName: examName.trim() });
    } catch (error: any) {
        console.error("API Exam Assign POST Error:", error);
        return NextResponse.json({ error: error.message || "Lỗi cập nhật mã đề" }, { status: 500 });
    }
}
