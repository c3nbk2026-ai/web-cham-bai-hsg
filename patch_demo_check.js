const fs = require('fs');
let route = fs.readFileSync('src/app/api/sheets/route.ts', 'utf8');

const regex = /if \(OLD_SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE"\) \{\s*return NextResponse\.json\(\{ success: true, demo: true \}\);\s*\}/;

const newCode = `if (targetSpreadsheetId === "YOUR_SPREADSHEET_ID_HERE") {
            return NextResponse.json({ success: true, demo: true });
        }`;

route = route.replace(regex, ""); // Remove it from the top
// Now insert it right before await sheets.spreadsheets.values.append
route = route.replace(/await sheets\.spreadsheets\.values\.append\(\{/g, newCode + "\n\n        await sheets.spreadsheets.values.append({");

fs.writeFileSync('src/app/api/sheets/route.ts', route, 'utf8');
