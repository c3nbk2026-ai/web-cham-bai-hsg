const fs = require('fs');
let route = fs.readFileSync('src/app/api/sheets/route.ts', 'utf8');

route = route.replace(/if \(SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE"\) \{/g, 'if (OLD_SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE") {');

fs.writeFileSync('src/app/api/sheets/route.ts', route, 'utf8');
