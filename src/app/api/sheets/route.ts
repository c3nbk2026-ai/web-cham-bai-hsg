import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

const OLD_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "YOUR_SPREADSHEET_ID_HERE";
const NEW_SPREADSHEET_ID = "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const KTGK_PROBLEMS: Record<string, { title: string, desc: string }> = {
    'DIEM': {
        title: 'Kiểm tra kết quả học tập',
        desc: 'Nhập điểm trung bình môn Tin học (số thực float). Nếu điểm >= 5.0 in "DAT", ngược lại in "CHUA DAT".'
    },
    'CHANLE': {
        title: 'Kiểm tra tính chẵn lẻ',
        desc: 'Nhập số nguyên n từ bàn phím. Nếu n là số chẵn in "SO CHAN", ngược lại in "SO LE".'
    },
    'TUOI': {
        title: 'Kiểm tra độ tuổi công dân',
        desc: 'Nhập tuổi của một người (số nguyên). Nếu tuổi >= 18 in "DU TUOI CONG DAN", ngược lại in "CHUA DU TUOI".'
    },
    'TONGDAN': {
        title: 'Tính tổng dãy số từ 1 đến n',
        desc: 'Nhập số nguyên dương n. Dùng vòng lặp for tính tổng S = 1 + 2 + ... + n và in ra "Tong tu 1 den n la: <S>".'
    },
    'CUUCHUONG': {
        title: 'In bảng cửu chương của một số',
        desc: 'Nhập số nguyên n (từ 1 đến 9). Dùng vòng lặp for in bảng nhân của n từ n x 1 đến n x 10.'
    },
    'SOCHAN': {
        title: 'In các số chẵn từ 1 đến n',
        desc: 'Nhập số nguyên dương n. Dùng vòng lặp for in tất cả các số chẵn trong khoảng từ 1 đến n trên cùng một dòng.'
    },
    'DEMNGUOC': {
        title: 'Đếm ngược từ n về 1',
        desc: 'Nhập số nguyên n. Dùng vòng lặp while in dãy số giảm dần từ n về 1 trên cùng một dòng.'
    },
    'TIENVO': {
        title: 'Tính tiền mua vở theo số lượng',
        desc: 'Nhập số lượng vở s cần mua. Nếu s >= 10 thì giá là 8000đ/quyển, ngược lại là 10000đ/quyển. In ra "Tong so tien: <tổng tiền>".'
    },
    'CHIAHETCHOBA': {
        title: 'Đếm các số chia hết cho 3 từ 1 đến n',
        desc: 'Nhập số nguyên dương n. Đếm và in ra số lượng các số chia hết cho 3 trong khoảng từ 1 đến n: "So cac so chia het cho 3 la: <kết quả>".'
    },
    'NHAPDUONG': {
        title: 'Kiểm tra nhập số nguyên dương (vòng lặp while)',
        desc: 'Nhập số nguyên n. Dùng vòng lặp while yêu cầu nhập lại nếu n <= 0. Khi nhập đúng n > 0 thì in ra "DA NHAP DUONG".'
    }
};

async function askGemini(code: string, problem: string, maxScore: number | string) {
    if (!GEMINI_API_KEY) return { score: 0, reasoning: "Lỗi: Vercel không đọc được GEMINI_API_KEY" };
    if (!code.trim()) return { score: 0, reasoning: "Lỗi: Code rỗng" };
    
    // Tìm đề bài chuẩn xác để AI không bị nhầm lẫn
    const cleanProb = (problem || "").toUpperCase().trim();
    const matchedKey = Object.keys(KTGK_PROBLEMS).find(k => cleanProb.includes(k) || k.includes(cleanProb));
    const probInfo = matchedKey ? KTGK_PROBLEMS[matchedKey] : null;

    const problemDesc = probInfo 
        ? `Tên bài: "${probInfo.title}". Yêu cầu đề bài: ${probInfo.desc}`
        : `Bài toán lập trình: "${problem}".`;

    const promptText = `Bạn là giáo viên Tin học chấm thi thực hành Python (thang điểm tối đa: ${maxScore} điểm).
ĐỀ BÀI CỦA HỌC SINH:
${problemDesc}

BÀI LÀM CỦA HỌC SINH (CODE PYTHON):
\`\`\`python
${code}
\`\`\`

YÊU CẦU CHẤM VỚT Ý TƯỞNG:
Học sinh chạy test tự động chưa đạt trọn vẹn điểm (có thể do lỗi cú pháp nhỏ, thụt lề, sai định dạng in kết quả, hoặc thiếu điều kiện biên).
1. Hãy đọc code và đánh giá tư duy thuật toán của học sinh ĐỐI VỚI ĐÚNG ĐỀ BÀI TRÊN (tuyệt đối không bịa đề khác).
2. Nếu có ý tưởng xử lý đúng hướng, cho điểm vớt từ 0.5 đến ${maxScore} điểm (ví dụ 1.0, 1.5, 2.0, 2.5, ${maxScore}).
3. Nếu code rỗng, lạc đề hoàn toàn hoặc chép linh tinh: Cho 0 điểm.
4. Viết lời nhận xét cực kỳ ngắn gọn (Tối đa 1 câu tiếng Việt nhận xét đúng nội dung bài) và KẾT QUẢ ĐIỂM SỐ CUỐI CÙNG LÀ MỘT CON SỐ DUY NHẤT Ở CUỐI CÂU.`;

    // Debug API Key (chỉ lấy 5 ký tự đầu và cuối để kiểm chứng)
    const keyPrefix = GEMINI_API_KEY.substring(0, 5);
    const keySuffix = GEMINI_API_KEY.slice(-5);
    const keyLength = GEMINI_API_KEY.length;

    const CANDIDATE_MODELS = [
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-3.5-flash'
    ];

    let lastError = "";

    for (const model of CANDIDATE_MODELS) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` + GEMINI_API_KEY.trim(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: promptText
                        }]
                    }]
                })
            });
            const data = await response.json();
            
            if (data.error) {
                lastError = data.error.message;
                continue;
            }

            const parts = data.candidates?.[0]?.content?.parts || [];
            const textParts = parts.filter((p: any) => !p.thought && p.text);
            const finalContent = (textParts.length > 0 ? textParts.map((p: any) => p.text).join("\n") : parts.map((p: any) => p.text).join("\n")).trim();
            
            const matches = finalContent.match(/\d+(\.\d+)?/g);
            const numStr = matches ? matches[matches.length - 1] : "0";
            const num = parseFloat(numStr);
            
            let reasoning = finalContent.replace(new RegExp(numStr + "\\s*$"), "").replace(/\n/g, " ").trim();
            if (reasoning.length > 150) {
                reasoning = reasoning.substring(0, 150) + "...";
            }

            return {
                score: isNaN(num) ? 0 : Math.min(parseFloat(maxScore.toString()), num),
                reasoning: reasoning || "Không trích xuất được lời phê"
            };
        } catch (e: any) {
            lastError = e.message;
        }
    }

    return { score: 0, reasoning: "Lỗi API (" + keyPrefix + "..." + keySuffix + ", len:" + keyLength + "): " + (lastError || "Tất cả model AI đều đang quá tải") };
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
            
            if (aiResult.score > numScore) {
                numScore = aiResult.score;
            }
            const aiNote = " [AI VỚT: " + originalScore + "->" + numScore + "đ] Lời phê: " + aiResult.reasoning;
            errorMsg = (errorMsg || "") + aiNote;
            score = numScore.toString();
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
        
        // Với phần thi KTGK (mode === 'DE_THI'): thang điểm chuẩn là 3 điểm, không cần quy đổi ra thang 10
        let diem = numScore.toFixed(1);
        if (mode !== 'DE_THI' && numMaxScore > 0) {
            diem = ((numScore / numMaxScore) * 10).toFixed(1);
        }

        let targetSpreadsheetId = OLD_SPREADSHEET_ID;
        let targetRange = 'BangDiem_DaiTra!A:K';
        
        if (mode === 'DOI_TUYEN') {
            targetRange = 'BangDiem_DoiTuyen!A:K';
        } else if (mode === 'DE_THI') {
            targetSpreadsheetId = NEW_SPREADSHEET_ID;
            targetRange = 'KetQua!A:K';
        }

        if (targetSpreadsheetId === "YOUR_SPREADSHEET_ID_HERE") {
            return NextResponse.json({ success: true, demo: true });
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId: targetSpreadsheetId,
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
