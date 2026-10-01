import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "YOUR_SPREADSHEET_ID_HERE";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { studentName, week, category, problem, score, maxScore, errorMsg, code } = body;

        if (SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE") {
            console.log("Demo mode: Data that WOULD be sent to Google Sheets:");
            console.dir(body);
            return NextResponse.json({ success: true, demo: true });
        }

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
        
        const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const loaiBai = category === "TL_TU_HOC" ? "Tự học" : "Đề thi";
        const soTestSai = maxScore - score;
        const diem = maxScore > 0 ? ((score / maxScore) * 10).toFixed(1) : "0.0";

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'BangDiem!A:K',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    timestamp,
                    studentName,
                    week,
                    loaiBai,
                    problem,
                    maxScore,
                    score,
                    soTestSai,
                    errorMsg || "",
                    diem,
                    code
                ]],
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Lỗi đồng bộ Google Sheets:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
