const fs = require('fs');
let content = fs.readFileSync('src/app/api/sheets/route.ts', 'utf8');

content = content.replace(
    'const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";',
    'const SPREADSHEET_ID = "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";'
);

fs.writeFileSync('src/app/api/sheets/route.ts', content, 'utf8');
