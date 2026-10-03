const fs = require('fs');
let content = fs.readFileSync('src/app/api/sheets/route.ts', 'utf8');

// Update SPREADSHEET_ID default
content = content.replace(
    /const SPREADSHEET_ID = process\.env\.GOOGLE_SHEETS_ID \|\| ".*?";/,
    'const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";'
);

// Update targetRange logic to point to KetQua
const oldTargetLogic = `let targetRange = 'BangDiem_DaiTra!A:K';
        if (mode === 'DOI_TUYEN') targetRange = 'BangDiem_DoiTuyen!A:K';
        else if (mode === 'DE_THI') targetRange = 'BangDiem_KiemTra!A:K';`;

const newTargetLogic = `// Ghi t?t c? k?t qu? vào tab KetQua c?a file m?i
        let targetRange = 'KetQua!A:K';`;

content = content.replace(oldTargetLogic, newTargetLogic);

fs.writeFileSync('src/app/api/sheets/route.ts', content, 'utf8');
