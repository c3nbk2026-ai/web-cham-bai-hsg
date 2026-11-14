import { getSheetsClient, SPREADSHEET_ID } from './google';

/** Các khóa bí mật trong tab CauHinh: KHÔNG BAO GIỜ gửi về trình duyệt. */
const SECRET_KEYS = /matkhau|password|maphongthi/i;

export async function getRawExamConfig(): Promise<Record<string, string>> {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'CauHinh!A1:B20',
    });
    const rows = response.data.values || [];
    const config: Record<string, string> = {};
    rows.forEach((row: any[]) => {
        if (row[0] && row[1] !== undefined) {
            config[String(row[0]).trim()] = String(row[1]).trim();
        }
    });
    return config;
}

export function publicExamConfig(config: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(config)) {
        if (!SECRET_KEYS.test(k)) out[k] = v;
    }
    return out;
}
