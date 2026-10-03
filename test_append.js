const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function testAppend() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, 'credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M",
            range: "KetQua!A:K",
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    ["2026-10-03 10:50:00", "Test Student", "10A1", "Ð? thi", "TestProblem", 10, 10, 0, "", "10.0", "print('hello')"]
                ],
            },
        });
        console.log("SUCCESS:", JSON.stringify(response.data));
    } catch (e) {
        console.log("ERROR:", e.message);
    }
}

testAppend();
