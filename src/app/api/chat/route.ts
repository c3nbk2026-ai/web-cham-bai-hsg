import { NextResponse } from 'next/server';

import { generateWithFallback, geminiKeys } from '@/lib/server/gemini';

// Cho phép hàm chạy tối đa 60 giây (đủ để thử nhiều model/key)
export const maxDuration = 60;

// ===== GIỚI HẠN SỬ DỤNG (tránh bị lạm dụng làm hết hạn mức Gemini) =====
// Cả phòng máy thường dùng chung 1 địa chỉ IP, nên hạn mức theo IP đặt rộng rãi.
const RATE_WINDOW_MS = 10 * 60 * 1000;   // 10 phút
const RATE_MAX_PER_IP = 150;             // tối đa 150 câu hỏi / 10 phút / 1 IP
const MAX_MESSAGE_CHARS = 6000;          // 1 câu hỏi tối đa 6.000 ký tự
const MAX_HISTORY = 20;                  // chỉ gửi kèm 20 tin nhắn gần nhất
const MAX_ATTACHMENT_BASE64 = 4_000_000; // tệp đính kèm tối đa ~3 MB
const ALLOWED_MIME = /^(image\/(png|jpeg|webp|gif)|application\/pdf|text\/plain)$/;

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
    const now = Date.now();
    const list = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 5000) hits.clear();
    return list.length > RATE_MAX_PER_IP;
}

function validAttachment(a: any): boolean {
    return !!a && typeof a.mimeType === 'string' && ALLOWED_MIME.test(a.mimeType)
        && typeof a.data === 'string' && a.data.length <= MAX_ATTACHMENT_BASE64;
}

export async function POST(req: Request) {
    try {
        if (geminiKeys().length === 0) {
            return NextResponse.json({ error: "Hệ thống chưa cấu hình AI (Thiếu API Key)." }, { status: 500 });
        }
        const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
        if (rateLimited(ip)) {
            return NextResponse.json({ error: "Lớp mình hỏi AI nhiều quá, các em chờ vài phút rồi hỏi tiếp nhé." }, { status: 429 });
        }
        const body = await req.json();
        const documentName = String(body.documentName || "Tài liệu học tập").slice(0, 200);
        
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

        rawHistory = rawHistory.slice(-MAX_HISTORY);
        userMessage = String(userMessage || "");
        if (userMessage.length > MAX_MESSAGE_CHARS) {
            return NextResponse.json({ error: `Câu hỏi quá dài (tối đa ${MAX_MESSAGE_CHARS} ký tự).` }, { status: 413 });
        }
        if (userAttachment && !validAttachment(userAttachment)) {
            return NextResponse.json({ error: "Tệp đính kèm chỉ nhận ảnh, PDF hoặc văn bản, tối đa khoảng 3 MB." }, { status: 413 });
        }

        const contents = rawHistory.map((msg: any) => {
            const parts: any[] = [];
            if (msg.attachment && validAttachment(msg.attachment)) {
                parts.push({
                    inlineData: {
                        mimeType: msg.attachment.mimeType,
                        data: msg.attachment.data
                    }
                });
            }
            if (msg.text) parts.push({ text: String(msg.text).slice(0, MAX_MESSAGE_CHARS) });
            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts: parts
            };
        }).filter((c: any) => c.parts.length > 0);

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

        // Thử lần lượt các model theo thứ tự ưu tiên, mỗi model thử với nhiều API key
        const result = await generateWithFallback({
            systemInstruction,
            contents,
            perAttemptMs: 25_000,
            deadlineMs: 55_000,
        });
        const reply = result.text || "Xin lỗi, thầy/cô không thể trả lời lúc này.";

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Trợ giảng AI tạm thời không trả lời được, em thử lại sau ít phút nhé." }, { status: 500 });
    }
}
