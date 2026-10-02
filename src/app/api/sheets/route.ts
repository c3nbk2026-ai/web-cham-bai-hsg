import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "YOUR_SPREADSHEET_ID_HERE";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function askGemini(code, problem, maxScore) {
    if (!GEMINI_API_KEY || !code.trim()) return { score: 0, reasoning: "" };
    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key=${GEMINI_API_KEY}", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Đóng vai giáo viên chấm thi Python. Học sinh giải bài toán: \. Mã nguồn của học sinh:\n\n\\n\nCode này bị lỗi cú pháp hoặc chạy sai kết quả (chỉ đạt 0 điểm auto). Hãy đọc ý tưởng (khai báo biến, vòng lặp, if/else). Nếu có tư duy đúng, hãy cho điểm vớt từ 0 đến \ (có thể lẻ 0.5). Hãy phân tích và viết lời phê bằng Tiếng Việt. KẾT QUẢ CUỐI CÙNG BẮT BUỘC CHỈ LÀ MỘT CON SỐ DUY NHẤT (ví dụ: 1.5)."
                    }]
                }]
            })
        });
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        
        // Lấy con số ở phần tử cuối cùng
        const text = parts[parts.length - 1]?.text || "0";
        const num = parseFloat(text.trim());
        
        // Lấy lời phê ở phần suy nghĩ (thought) hoặc các phần text trước đó
        let reasoning = "";
        if (parts.length > 1) {
            reasoning = parts.slice(0, -1).map(p => p.text).join("\n").trim();
        }

        return {
            score: isNaN(num) ? 0 : num,
            reasoning: reasoning
        };
    } catch (e) {
        console.error("Gemini Error:", e);
        return { score: 0, reasoning: "" };
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { studentName, mode, week, category, problem, score, maxScore, errorMsg, code } = body;
        
        let numScore = parseFloat(score) || 0;
        const originalScore = numScore; // Lưu lại điểm gốc
        let numMaxScore = parseFloat(maxScore) || 0;

        // Tích hợp AI chấm vớt nếu điểm hệ thống thấp hơn tối đa
        if (numScore < numMaxScore && numMaxScore > 0) {
            const extractCode = code.split("--- KET QUA CHAY TAY ---")[0]; 
            const aiResult = await askGemini(extractCode, problem, numMaxScore);
            if (aiResult.score > numScore) {
                numScore = aiResult.score;
                const aiNote = "\n\n[🤖 AI VỚT ĐIỂM]\n- Điểm gốc máy chấm: \/\\n- Điểm AI chấm lại: \/\\n- Lời phê của AI:\n\";
                errorMsg = (errorMsg || "") + aiNote;
                score = numScore.toString();
            }
        }

        if (SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE") {
            console.log("Demo mode: Data that WOULD be sent to Google Sheets:");
            console.dir(body);
            return NextResponse.json({ success: true, demo: true });
        }

        let auth;
        if (process.env.GOOGLE_CREDENTIALS) {
            auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } else {
            auth = new google.auth.GoogleAuth({
                keyFile: path.join(process.cwd(), 'credentials.json'),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        
        const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const loaiBai = category === "TL_TU_HOC" ? "Tự học" : "Đề thi";
        const soTestSai = Math.max(0, numMaxScore - numScore);
        const diem = numMaxScore > 0 ? ((numScore / numMaxScore) * 10).toFixed(1) : "0.0";

        let targetRange = 'BangDiem_DaiTra!A:K';
        if (mode === 'DOI_TUYEN') targetRange = 'BangDiem_DoiTuyen!A:K';
        else if (mode === 'DE_THI') targetRange = 'BangDiem_KiemTra!A:K';

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: targetRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    timestamp,
                    studentName,
                    week,
                    loaiBai,
                    problem,
                    numMaxScore,
                    numScore,
                    soTestSai,
                    errorMsg || "",
                    diem,
                    code
                ]],
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Lỗi đồng bộ Google Sheets:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
