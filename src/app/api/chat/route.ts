import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(req: Request) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Hệ thống chưa cấu hình AI (Thiếu API Key)." }, { status: 500 });
        }
        const body = await req.json();
        const { message, documentName, history, attachment } = body;

        const systemInstruction = `Bạn là một giáo viên chuyên bồi dưỡng Học sinh giỏi môn Tin học. Học sinh đang tự học tài liệu có tên: "${documentName}". Hãy giải đáp các thắc mắc của học sinh một cách dễ hiểu, sư phạm, và ngắn gọn. YÊU CẦU BẮT BUỘC: CHỈ dùng ngôn ngữ Python để giải thích, gợi ý, và viết code minh họa. Tuyệt đối KHÔNG dùng C++ hay ngôn ngữ khác. Khuyến khích học sinh suy nghĩ thay vì đưa code giải sẵn ngay lập tức. Dùng ngôn ngữ thân thiện, xưng thầy/cô và gọi học sinh là em.`;

        const contents = history.map((msg: any) => {
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
        if (attachment) {
            userParts.push({
                inlineData: {
                    mimeType: attachment.mimeType,
                    data: attachment.data
                }
            });
        }
        if (message) userParts.push({ text: message });

        contents.push({
            role: 'user',
            parts: userParts
        });

        const CANDIDATE_MODELS = [
            'gemini-3.8-flash',
            'gemini-3.5-flash-lite',
            'gemini-2.5-flash',
            'gemini-3.5-flash'
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
