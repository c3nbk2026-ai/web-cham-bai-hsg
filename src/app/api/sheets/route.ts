import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

const OLD_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "YOUR_SPREADSHEET_ID_HERE";
const NEW_SPREADSHEET_ID = "1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const KTGK_PROBLEMS: Record<string, { title: string, desc: string }> = {
    'NHAPAM': {
        title: 'Điều khiển nhập số nguyên âm (x < 0)',
        desc: 'Nhập số nguyên x. Dùng vòng lặp while yêu cầu nhập lại nếu x >= 0. Khi nhập đúng số âm thì dừng, in "DA NHAP SO AM" và in x.'
    },
    'NHAPKHONGAM': {
        title: 'Điều khiển nhập số nguyên không âm (y >= 0)',
        desc: 'Nhập số nguyên y. Dùng vòng lặp while yêu cầu nhập lại nếu y < 0. Khi nhập đúng số không âm thì dừng, in "DA NHAP SO KHONG AM" và in y.'
    },
    'NHAPCANH': {
        title: 'Nhập độ dài cạnh hình vuông hợp lệ (a > 0)',
        desc: 'Nhập số thực a (float). Dùng vòng lặp while yêu cầu nhập lại nếu a <= 0. Khi nhập đúng cạnh dương thì dừng, in "DA NHAP CANH HINH VUONG" và in a.'
    },
    'NHAPBANKINH': {
        title: 'Nhập bán kính hình tròn hợp lệ (r > 0)',
        desc: 'Nhập số thực r (float). Dùng vòng lặp while yêu cầu nhập lại nếu r <= 0. Khi nhập đúng bán kính dương thì dừng, in "DA NHAP BAN KINH HINH TRON" và in r.'
    },
    'NHAPCHAN': {
        title: 'Nhập số nguyên chẵn',
        desc: 'Nhập số nguyên a. Dùng vòng lặp while yêu cầu nhập lại nếu a % 2 != 0. Khi nhập đúng số chẵn thì dừng, in "DA NHAP SO CHAN" và in a.'
    },
    'NHAPLE': {
        title: 'Nhập số nguyên lẻ',
        desc: 'Nhập số nguyên b. Dùng vòng lặp while yêu cầu nhập lại nếu b % 2 == 0. Khi nhập đúng số lẻ thì dừng, in "DA NHAP SO LE" và in b.'
    },
    'NHAPLECHUC': {
        title: 'Nhập số lẻ chục (không chia hết cho 10)',
        desc: 'Nhập số nguyên c. Dùng vòng lặp while yêu cầu nhập lại nếu c % 10 == 0. Khi nhập đúng số lẻ chục thì dừng, in "DA NHAP SO LE CHUC" và in c.'
    },
    'NHAPTRONCHUC': {
        title: 'Nhập số tròn chục (chia hết cho 10)',
        desc: 'Nhập số nguyên d. Dùng vòng lặp while yêu cầu nhập lại nếu d % 10 != 0. Khi nhập đúng số tròn chục thì dừng, in "DA NHAP SO TRON CHUC" và in d.'
    },
    'NHAPDUONG': {
        title: 'Nhập số nguyên dương (n > 0)',
        desc: 'Nhập số nguyên n. Dùng vòng lặp while yêu cầu nhập lại nếu n <= 0. Khi nhập đúng số dương thì dừng, in "DA NHAP SO DUONG" và in n.'
    },
    'NHAPSOKHAC0': {
        title: 'Nhập số nguyên khác 0 (n != 0)',
        desc: 'Nhập số nguyên n. Dùng vòng lặp while yêu cầu nhập lại nếu n == 0. Khi nhập đúng số khác 0 thì dừng, in "DA NHAP SO KHAC 0" và in n.'
    },
    'NHAPCHIA5': {
        title: 'Nhập số nguyên chia hết cho 5',
        desc: 'Nhập số nguyên n. Dùng vòng lặp while yêu cầu nhập lại nếu n % 5 != 0. Khi nhập đúng số chia hết cho 5 thì dừng, in "DA NHAP SO CHIA HET CHO 5" và in n.'
    },
    'NHAPCHIA3': {
        title: 'Nhập số nguyên chia hết cho 3',
        desc: 'Nhập số nguyên n. Dùng vòng lặp while yêu cầu nhập lại nếu n % 3 != 0. Khi nhập đúng số chia hết cho 3 thì dừng, in "DA NHAP SO CHIA HET CHO 3" và in n.'
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

YÊU CẦU CHẤM VỚT Ý TƯỞNG THEO BAREM CHUẨN CỦA TỔ BỘ MÔN:
Học sinh chạy test tự động chưa đạt trọn vẹn điểm (do lỗi cú pháp nhỏ, nhầm lẫn điều kiện biên hoặc sai định dạng in).
Quy định barem điểm vớt khuyến khích tư duy thuật toán (thang điểm tối đa ${maxScore} điểm):
1. [2.0 - 2.5 ĐIỂM] NẾU HỌC SINH NẮM ĐÚNG CẤU TRÚC VÒNG LẶP WHILE VÀ TƯ DUY THUẬT TOÁN, NHƯNG CHỈ SAI ĐIỀU KIỆN BIÊN HOẶC DẤU SO SÁNH (ví dụ: dùng <= 0 thay vì < 0, >= 0 thay vì > 0, % 2 == 1 thay vì != 0): HÃY CHO 2.5 ĐIỂM (hoặc 2.0 điểm).
2. [2.0 ĐIỂM] NẾU HỌC SINH ĐIỀN ĐÚNG BIỂU THỨC NHƯNG SAI TÊN BIẾN (ví dụ dùng x thay vì a, n thay vì y): HÃY CHO 2.0 ĐIỂM.
3. [1.5 ĐIỂM] NẾU HỌC SINH CÓ VIẾT ĐƯỢC MỘT PHẦN Ý TƯỞNG NHƯNG CHƯA HOÀN CHỈNH: HÃY CHO 1.5 ĐIỂM.
4. [1.0 ĐIỂM] NẾU HỌC SINH ĐỂ NGUYÊN CODE MẪU (CHƯA ĐIỀN HOẶC ĐỂ TRỐNG DẤU "..."): HÃY CHO ĐÚNG 1.0 ĐIỂM (đây là điểm thành phần phần Nhập dữ liệu và Xuất kết quả theo barem). Lời phê: "Đạt 1.0 điểm phần nhập/xuất dữ liệu, chưa điền biểu thức điều kiện vòng lặp while."
5. [0 ĐIỂM] NẾU CODE HOÀN TOÀN RỖNG, BỊ XÓA HẾT MÃ NGUỒN, LẠC ĐỀ HOÀN TOÀN HOẶC CHÉP LINH TINH: CHO 0 ĐIỂM.
6. Viết lời nhận xét ngắn gọn (1 câu tiếng Việt nhận xét đúng nội dung) và KẾT QUẢ ĐIỂM SỐ CUỐI CÙNG LÀ MỘT CON SỐ DUY NHẤT Ở CUỐI CÂU.`;

    // Debug API Key (chỉ lấy 5 ký tự đầu và cuối để kiểm chứng)
    const keyPrefix = GEMINI_API_KEY.substring(0, 5);
    const keySuffix = GEMINI_API_KEY.slice(-5);
    const keyLength = GEMINI_API_KEY.length;

    const CANDIDATE_MODELS = [
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash'
    ];

    let lastError = "";

    for (const model of CANDIDATE_MODELS) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 3.5s timeout

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` + GEMINI_API_KEY.trim(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: promptText
                        }]
                    }]
                })
            });
            clearTimeout(timeoutId);
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
            let num = parseFloat(numStr);
            if (isNaN(num)) num = 0;
            const maxScoreNum = parseFloat(maxScore.toString()) || 3.0;

            // Nếu AI trả về điểm theo thang 10 (ví dụ 6.7 hoặc 7) trong khi bài thi thang 3.0 điểm
            if (num > 3.0 && maxScoreNum <= 3.0) {
                num = Math.round((num / 10 * 3.0) * 10) / 10;
            }
            num = Math.min(maxScoreNum, num);
            
            let reasoning = finalContent.replace(new RegExp(numStr + "\\s*$"), "").replace(/\n/g, " ").trim();
            // Lọc bỏ các từ quy đổi thang 10 nếu AI lỡ viết
            reasoning = reasoning.replace(/\b(?:6\.7|3\.3|10|thang 10|qui đổi|quy đổi)\b/gi, "").trim();
            if (reasoning.length > 150) {
                reasoning = reasoning.substring(0, 150) + "...";
            }

            return {
                score: num,
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
        let body: any;
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            body = await req.json();
        } else {
            const rawText = await req.text();
            try { body = JSON.parse(rawText); } catch(e) { body = {}; }
        }
        let { studentName, mode, week, category, problem, score, maxScore, errorMsg, code } = body;
        
        let numScore = parseFloat(score) || 0;
        const originalScore = numScore; 
        let numMaxScore = parseFloat(maxScore) || 3.0;

        // Nhận diện bài thi KTGK (Thực hành Python 3 điểm)
        const isKTGK = mode === 'DE_THI' || category === 'DE_THI' || numMaxScore <= 3.0;

        if (numScore < numMaxScore && numMaxScore > 0 && code) {
            try {
                const extractCode = code.split("--- KET QUA CHAY TAY ---")[0]; 
                if (GEMINI_API_KEY && extractCode.trim()) {
                    const aiResult = await askGemini(extractCode, problem, isKTGK ? 3.0 : numMaxScore);
                    if (aiResult && aiResult.score > numScore) {
                        numScore = aiResult.score;
                    }
                    if (aiResult && aiResult.reasoning) {
                        const aiNote = isKTGK 
                            ? " [AI VỚT: " + originalScore + "->" + numScore + "/3.0đ] Lời phê: " + aiResult.reasoning
                            : " [AI VỚT: " + originalScore + "->" + numScore + "đ] Lời phê: " + aiResult.reasoning;
                        errorMsg = (errorMsg || "") + aiNote;
                        score = numScore.toString();
                    }
                }
            } catch (aiErr: any) {
                console.warn("AI scoring error, skipping AI:", aiErr);
            }
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
        
        // Điểm thực hành KTGK luôn luôn lưu đúng thang 3 điểm (tối đa 3.0), TUYỆT ĐỐI không quy đổi ra thang 10
        let diem = numScore.toFixed(1);
        if (!isKTGK && numMaxScore > 3.0) {
            diem = ((numScore / numMaxScore) * 10).toFixed(1);
        }

        let targetSpreadsheetId = OLD_SPREADSHEET_ID;
        let targetRange = 'BangDiem_DaiTra!A:K';
        
        if (mode === 'DOI_TUYEN') {
            targetRange = 'BangDiem_DoiTuyen!A:K';
        } else if (isKTGK) {
            targetSpreadsheetId = NEW_SPREADSHEET_ID;
            targetRange = 'DiemThucHanh!A:K';
        }

        if (targetSpreadsheetId === "YOUR_SPREADSHEET_ID_HERE") {
            return NextResponse.json({ success: true, demo: true });
        }

        try {
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
        } catch (appendErr: any) {
            console.warn("Append to targetRange failed, trying fallback...", appendErr.message);
            const fallbackRange = targetRange.includes('DiemThucHanh') ? 'KetQua!A:K' : 'Sheet1!A:K';
            await sheets.spreadsheets.values.append({
                spreadsheetId: targetSpreadsheetId,
                range: fallbackRange,
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
        }

        // TỰ ĐỘNG ĐỒNG BỘ ĐIỂM VÀ SỐ LẦN THI SANG TAB DanhSachHS (Cột E: SoLanThi, Cột G: TrangThai)
        if (isKTGK && studentName) {
            try {
                const dsRes = await sheets.spreadsheets.values.get({
                    spreadsheetId: NEW_SPREADSHEET_ID,
                    range: 'DanhSachHS!C2:G',
                });
                const dsRows = dsRes.data.values || [];
                const norm = (s: string) => (s || "").trim().toLowerCase();

                for (let i = 0; i < dsRows.length; i++) {
                    const rStudent = norm(dsRows[i][0]); // C
                    const rClass = norm(dsRows[i][1]);   // D
                    if (rStudent === norm(studentName) && (!week || rClass === norm(week))) {
                        const targetRow = i + 2;
                        const prevTimes = parseInt(dsRows[i][2] || "0", 10) || 0;
                        const newTimes = prevTimes + 1;
                        const statusText = diem; // Chỉ lưu số điểm thuần túy (ví dụ 2.5, 3.0) theo yêu cầu giáo viên
                        
                        await sheets.spreadsheets.values.update({
                            spreadsheetId: NEW_SPREADSHEET_ID,
                            range: `DanhSachHS!E${targetRow}:G${targetRow}`,
                            valueInputOption: 'USER_ENTERED',
                            requestBody: {
                                values: [[
                                    newTimes.toString(), // E: SoLanThi
                                    problem || dsRows[i][3] || "", // F: MaDe
                                    statusText // G: TrangThai
                                ]]
                            }
                        });
                        break;
                    }
                }
            } catch (syncErr) {
                console.warn("Không đồng bộ được sang DanhSachHS:", syncErr);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Lỗi:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const studentName = searchParams.get('studentName')?.trim();
        const className = searchParams.get('className')?.trim();

        if (!studentName) {
            return NextResponse.json({ error: "Thiếu tên học sinh" }, { status: 400 });
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

        let rows: any[] = [];
        try {
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: NEW_SPREADSHEET_ID,
                range: 'DiemThucHanh!A:K',
            });
            rows = res.data.values || [];
        } catch (e: any) {
            try {
                const resFallback = await sheets.spreadsheets.values.get({
                    spreadsheetId: NEW_SPREADSHEET_ID,
                    range: 'KetQua!A:K',
                });
                rows = resFallback.data.values || [];
            } catch (err) {}
        }

        if (rows.length === 0) {
            return NextResponse.json({ submitted: false });
        }

        const norm = (s: string) => (s || "").trim().toLowerCase();
        for (let i = rows.length - 1; i >= 0; i--) {
            const row = rows[i];
            const rStudent = norm(row[1]);
            const rClass = norm(row[2]);

            const matchStudent = rStudent === norm(studentName);
            const matchClass = !className || rClass === norm(className);

            if (matchStudent && matchClass) {
                return NextResponse.json({
                    submitted: true,
                    data: {
                        timestamp: row[0] || "",
                        studentName: row[1] || studentName,
                        className: row[2] || className,
                        problem: row[4] || "",
                        score: row[9] || row[6] || "0",
                        note: row[8] || ""
                    }
                });
            }
        }

        return NextResponse.json({ submitted: false });
    } catch (error: any) {
        console.error("Lỗi kiểm tra bài nộp:", error);
        return NextResponse.json({ error: error.message || "Lỗi kiểm tra bài nộp" }, { status: 500 });
    }
}
