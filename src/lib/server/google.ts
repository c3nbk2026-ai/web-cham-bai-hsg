import { google } from 'googleapis';
import path from 'path';

/**
 * App dùng HAI bảng tính Google Sheet:
 *
 * 1) Bảng điểm đội tuyển HSG (GOOGLE_SHEETS_ID)
 *    - BangDiem_DaiTra, BangDiem_DoiTuyen : điểm luyện tập ở trang Nộp bài
 *
 * 2) Phòng thi KTGK của học sinh lớp học (GOOGLE_EXAM_SHEETS_ID)
 *    - CauHinh      : MaPhongThi, MatKhauGiamThi, ThoiGianThi, LopDangThi
 *    - DanhSachHS   : C: HoTen, D: Lop, E: SoLanThi, F: MaDe, G: TrangThai
 *    - DiemThucHanh : điểm KTGK thực hành
 *
 * Nếu chưa đặt biến môi trường thì dùng ID mặc định bên dưới.
 */
export const SCORE_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1UIrvCAp3NRE6CVhux1jOdRxyQ1ZcwuYmpVLUJ9KdprE";
export const EXAM_SPREADSHEET_ID = process.env.GOOGLE_EXAM_SHEETS_ID || "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";

export function getSheetsClient(readonly = false) {
    const scopes = [readonly
        ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
        : 'https://www.googleapis.com/auth/spreadsheets'];
    const auth = process.env.GOOGLE_CREDENTIALS
        ? new google.auth.GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), scopes })
        : new google.auth.GoogleAuth({ keyFile: path.join(process.cwd(), 'credentials.json'), scopes });
    return google.sheets({ version: 'v4', auth });
}
