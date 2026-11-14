import { google } from 'googleapis';
import path from 'path';

/** Bảng tính dùng cho phòng thi KTGK (DanhSachHS, CauHinh, DiemThucHanh). */
export const EXAM_SPREADSHEET_ID = "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";

export function getSheetsClient(readonly = false) {
    const scopes = [readonly
        ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
        : 'https://www.googleapis.com/auth/spreadsheets'];
    const auth = process.env.GOOGLE_CREDENTIALS
        ? new google.auth.GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), scopes })
        : new google.auth.GoogleAuth({ keyFile: path.join(process.cwd(), 'credentials.json'), scopes });
    return google.sheets({ version: 'v4', auth });
}
