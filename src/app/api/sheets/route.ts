import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "YOUR_SPREADSHEET_ID_HERE";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function askGemini(code, problem, maxScore) {
    if (!GEMINI_API_KEY) return { score: 0, reasoning: "Lỗi: Vercel không đọc được GEMINI_API_KEY" };
    if (!code.trim()) return { score: 0, reasoning: "Lỗi: Code rỗng" };
    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key=${GEMINI_API_KEY}", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Đóng vai giáo viên. Học sinh giải bài: \. Code:\n\\n\nCode lỗi cú pháp/chạy sai (auto 0 điểm). Hãy đọc ý tưởng, nếu có tư duy đúng, cho điểm vớt (0 đến \). Viết lời phê bằng Tiếng Việt CỰC KỲ NGẮN GỌN (Tối đa 1 câu). KẾT QUẢ CUỐI CÙNG BẮT BUỘC CHỈ LÀ MỘT CON SỐ DUY NHẤT."
                    }]
                }]
            })
        });
        const data = await response.json();
        
        if (data.error) {
            return { score: 0, reasoning: "Lỗi API: " + data.error.message };
        }

        const parts = data.candidates?.[0]?.content?.parts || [];
        const textParts = parts.filter(p => !p.thought);
        const finalContent = textParts.map(p => p.text).join("\n").trim();
        
        const matches = finalContent.match(/\d+(\.\d+)?/g);
        const numStr = matches ? matches[matches.length - 1] : "0";
        const num = parseFloat(numStr);
        
        let reasoning = finalContent.replace(new RegExp(numStr + "\\s*$"), "").replace(/\n/g, " "").trim();
        if (reasoning.length > 150) {
            reasoning = reasoning.substring(0, 150) + "...";
        }

        return {
            score: isNaN(num) ? 0 : num,
            reasoning: reasoning || "Không trích xuất được lời phê"
        };
    } catch (e) {
        return { score: 0, reasoning: "Lỗi kết nối AI: " + e.message };
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { studentName, mode, week, category, problem, score, maxScore, errorMsg, code } = body;
        
        let numScore = parseFloat(score) || 0;
        const originalScore = numScore; 
        let numMaxScore = parseFloat(maxScore) || 0;

        if (numScore < numMaxScore && numMaxScore > 0) {
            const extractCode = code.split("--- KET QUA CHAY TAY ---")[0]; 
            const aiResult = await askGemini(extractCode, problem, numMaxScore);
            
            // LUÔN LUÔN ghi log ra sheet để debug, dù điểm là 0
            if (aiResult.score > numScore) {
                numScore = aiResult.score;
            }
            const aiNote = " [AI VỚT: \->\đ] Lời phê: \";
            errorMsg = (errorMsg || "") + aiNote;
            score = numScore.toString();
        }

        if (SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE") {
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
        const soTestSai = Math.max(0, numMaxScore - originalScore);
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
        console.error("Lỗi:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
