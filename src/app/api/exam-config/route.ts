import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let auth;
        if (process.env.GOOGLE_CREDENTIALS) {
            auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } else {
            auth = new google.auth.GoogleAuth({
                keyFile: path.join(process.cwd(), 'credentials.json'),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'CauHinh!A1:B20',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "Không tìm thấy cấu hình." }, { status: 404 });
        }

        const config: Record<string, string> = {};
        rows.forEach(row => {
            if (row[0] && row[1] !== undefined) {
                config[row[0].trim()] = row[1].trim();
            }
        });

        return NextResponse.json(config);
    } catch (error: any) {
        console.error('API Exam Config Error:', error);
        return NextResponse.json({ error: error.message || 'Lỗi lấy cấu hình phòng thi' }, { status: 500 });
    }
}
