import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(req: Request) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Hệ thống chưa cấu hình AI (Thiếu API Key)." }, { status: 500 });
        }
        const body = await req.json();
        const documentName = body.documentName || "Tài liệu học tập";
        
        // Hỗ trợ cả 2 định dạng từ /tu-hoc và /luyen-de
        let rawHistory = Array.isArray(body.history) ? body.history : [];
        let userMessage = body.message || "";
        let userAttachment = body.attachment || null;

        if (Array.isArray(body.messages) && body.messages.length > 0) {
            rawHistory = body.messages.slice(0, -1);
            const lastItem = body.messages[body.messages.length - 1];
            if (!userMessage && lastItem.text) userMessage = lastItem.text;
            if (!userAttachment && lastItem.attachment) userAttachment = lastItem.attachment;
        }

        const systemInstruction = `Bạn là Thầy/Cô Trợ giảng AI chuyên bồi dưỡng Học sinh giỏi môn Tin học (ngôn ngữ Python). Học sinh đang học bài/tài liệu: "${documentName}".

NGUYÊN TẮC SƯ PHẠM CỐT LÕI (BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT):
Học sinh cần tự rèn luyện tư duy thuật toán và tự tay viết code. Bạn là người hướng dẫn đồng hành (theo phương pháp Gợi mở - Socratic / Scaffolding), TUYỆT ĐỐI KHÔNG LÀM HỘ VÀ KHÔNG ĐƯA RA NGAY ĐÁP ÁN/CODE HOÀN CHỈNH CHO HỌC SINH.

1. TUYỆT ĐỐI KHÔNG CUNG CẤP TOÀN BỘ CODE GIẢI:
   - Dù học sinh có nài nỉ xin đáp án, xin code hoàn chỉnh, hay than "khó quá em không làm được", bạn KHÔNG ĐƯỢC viết code giải trọn vẹn cả bài.
   - Nếu cần minh họa cú pháp hay cấu trúc, CHỈ viết tối đa 1-2 dòng code khung (pseudo-code) hoặc để trống phần xử lý quan trọng kèm lời nhắc (ví dụ: "# TODO: Em hãy tự điền điều kiện kiểm tra tại đây").

2. CHIẾN LƯỢC GỢI MỞ THEO TỪNG BƯỚC:
   - Bước 1 (Hiểu đề): Giúp học sinh xác định rõ: Đề bài yêu cầu gì? Input là gì, Output là gì? Giới hạn dữ liệu (N, A[i]) là bao nhiêu?
   - Bước 2 (Gợi ý hướng đi): Đặt câu hỏi kích thích suy nghĩ thay vì nói luôn thuật toán (Ví dụ: "Để tìm số lớn nhất, em định kiểm tra lần lượt từng phần tử hay sắp xếp trước?", "Nếu N lên đến 10^5 mà dùng 2 vòng lặp lồng nhau O(N^2) thì có bị quá thời gian 1 giây không? Em có thể dùng cấu trúc nào như dict hay set để tra cứu nhanh hơn?").
   - Bước 3 (Chia nhỏ bài toán): Hướng dẫn học sinh giải quyết từng bước nhỏ, hoàn thành bước này rồi mới sang bước tiếp theo.

3. KHI HỌC SINH GẶP LỖI HOẶC SAI TEST:
   - Không tự ý sửa code hộ học sinh.
   - Hãy giải thích nguyên nhân gây ra lỗi (ví dụ: lỗi tràn chỉ số IndexError, lỗi ép kiểu dữ liệu int/str, vòng lặp vô hạn, hoặc thiếu sót test đặc biệt như N=0, số âm...).
   - Hướng dẫn học sinh cách in thử giá trị biến (print debug) để em tự tìm ra chỗ sai.

4. NGÔN NGỮ & THÁI ĐỘ:
   - CHỈ sử dụng ngôn ngữ Python. TUYỆT ĐỐI KHÔNG dùng C++, Pascal hay ngôn ngữ khác.
   - Giọng điệu ấm áp, ân cần, khích lệ và chuẩn mực sư phạm. Xưng "thầy/cô" và gọi học sinh là "em".
   - Luôn kết thúc câu trả lời bằng 1 câu hỏi gợi mở để học sinh tiếp tục động não và tương tác tiếp.`;

        const contents = rawHistory.map((msg: any) => {
            const parts: any[] = [];
            if (msg.attachment) {
                parts.push({
                    inlineData: {
                        mimeType: msg.attachment.mimeType,
                        data: msg.attachment.data
                    }
                });
            }
            if (msg.text) parts.push({ text: msg.text });
            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts: parts
            };
        });

        const userParts: any[] = [];
        if (userAttachment) {
            userParts.push({
                inlineData: {
                    mimeType: userAttachment.mimeType,
                    data: userAttachment.data
                }
            });
        }
        if (userMessage) userParts.push({ text: userMessage });

        contents.push({
            role: 'user',
            parts: userParts
        });

        const CANDIDATE_MODELS = [
            'gemini-3.8-flash',
            'gemini-3.5-flash',
            'gemini-3.5-flash-lite'
        ];

        let lastErrorMessage = "";
        let successfulData: any = null;

        for (const model of CANDIDATE_MODELS) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` + GEMINI_API_KEY.trim(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        contents: contents
                    })
                });

                const data = await response.json();
                
                if (data.error) {
                    console.warn(`Model ${model} báo lỗi:`, data.error.message);
                    lastErrorMessage = data.error.message;
                    continue; // Thử model kế tiếp
                }

                if (data.candidates && data.candidates.length > 0) {
                    successfulData = data;
                    break; // Thành công!
                }
            } catch (err: any) {
                console.warn(`Gọi model ${model} thất bại:`, err.message);
                lastErrorMessage = err.message;
            }
        }

        if (!successfulData) {
            throw new Error(lastErrorMessage || "Tất cả model AI đều đang quá tải hoặc không khả dụng. Vui lòng thử lại sau.");
        }

        const candidate = successfulData.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        const validParts = parts.filter((p: any) => !p.thought && p.text);
        const reply = (validParts.length > 0
            ? validParts.map((p: any) => p.text).join("\n")
            : parts.map((p: any) => p.text).join("\n")
        ).trim() || "Xin lỗi, thầy/cô không thể trả lời lúc này.";
        
        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Lỗi kết nối AI: " + error.message }, { status: 500 });
    }
}
