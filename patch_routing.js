const fs = require('fs');
let content = fs.readFileSync('src/app/api/sheets/route.ts', 'utf8');

// Restore the constant logic
content = content.replace(
    'const SPREADSHEET_ID = "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";',
    'const OLD_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "YOUR_SPREADSHEET_ID_HERE";\nconst NEW_SPREADSHEET_ID = "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";'
);

// Restore the routing logic inside POST
const oldLogic = `// Ghi t?t c? k?t qu? vo tab KetQua c?a file m?i
        let targetRange = 'KetQua!A:K';

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,`;

const newLogic = `let targetSpreadsheetId = OLD_SPREADSHEET_ID;
        let targetRange = 'BangDiem_DaiTra!A:K';
        
        if (mode === 'DOI_TUYEN') {
            targetRange = 'BangDiem_DoiTuyen!A:K';
        } else if (mode === 'DE_THI') {
            targetSpreadsheetId = NEW_SPREADSHEET_ID;
            targetRange = 'KetQua!A:K';
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId: targetSpreadsheetId,`;

// Fallback logic replace in case of encoding issues in regex
if (content.includes("KetQua!A:K")) {
    // Let's just do a clean string replacement block
    const blockToReplace = content.substring(content.indexOf('const diem ='), content.indexOf('valueInputOption: \'USER_ENTERED\','));
    const safeBlock = `const diem = numMaxScore > 0 ? ((numScore / numMaxScore) * 10).toFixed(1) : "0.0";

        let targetSpreadsheetId = OLD_SPREADSHEET_ID;
        let targetRange = 'BangDiem_DaiTra!A:K';
        
        if (mode === 'DOI_TUYEN') {
            targetRange = 'BangDiem_DoiTuyen!A:K';
        } else if (mode === 'DE_THI') {
            targetSpreadsheetId = NEW_SPREADSHEET_ID;
            targetRange = 'KetQua!A:K';
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId: targetSpreadsheetId,
            range: targetRange,
            `;
            
    content = content.replace(blockToReplace, safeBlock);
}

fs.writeFileSync('src/app/api/sheets/route.ts', content, 'utf8');
