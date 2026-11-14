import { google } from 'googleapis';
import path from 'path';

/**
 * App dùng MỘT bảng tính Google Sheet duy nhất, gồm các tab:
 *  - BangDiem_DaiTra, BangDiem_DoiTuyen : điểm luyện tập HSG
 *  - CauHinh       : cấu hình Phòng thi KTGK (MaPhongThi, MatKhauGiamThi, ThoiGianThi, LopDangThi)
 *  - DanhSachHS    : danh sách học sinh lớp học (C: HoTen, D: Lop, E: SoLanThi, F: MaDe, G: TrangThai)
 *  - DiemThucHanh  : điểm KTGK thực hành
 * Đặt GOOGLE_SHEETS_ID trên Vercel; nếu thiếu thì dùng ID mặc định bên dưới.
 */
export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1UIrvCAp3NRE6CVhux1jOdRxyQ1ZcwuYmpVLUJ9KdprE";

export function getSheetsClient(readonly = false) {
    const scopes = [readonly
        ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
        : 'https://www.googleapis.com/auth/spreadsheets'];
    const auth = process.env.GOOGLE_CREDENTIALS
        ? new google.auth.GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), scopes })
        : new google.auth.GoogleAuth({ keyFile: path.join(process.cwd(), 'credentials.json'), scopes });
    return google.sheets({ version: 'v4', auth });
}
