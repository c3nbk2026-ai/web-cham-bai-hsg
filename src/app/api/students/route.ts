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
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
        } else {
            auth = new google.auth.GoogleAuth({
                keyFile: path.join(process.cwd(), 'credentials.json'),
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'DanhSachHS!C2:D', // C = HoTen, D = Lop
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return NextResponse.json({});
        }

        const studentsByClass: Record<string, string[]> = {};
        rows.forEach((row) => {
            if (row.length >= 2) {
                const name = row[0].trim();
                const className = row[1].trim();
                if (name && className) {
                    if (!studentsByClass[className]) {
                        studentsByClass[className] = [];
                    }
                    studentsByClass[className].push(name);
                }
            }
        });

        return NextResponse.json(studentsByClass);
    } catch (error: any) {
        console.error("API Students Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
