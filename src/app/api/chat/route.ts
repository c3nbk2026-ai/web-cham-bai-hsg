import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(req: Request) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "Hệ thống chưa cấu hình AI (Thiếu API Key)." }, { status: 500 });
        }
        const body = await req.json();
        const { message, documentName, history } = body;

        const systemInstruction = `Bạn là một giáo viên chuyên bồi dưỡng Học sinh giỏi môn Tin học (C++, Python). Học sinh đang tự học tài liệu có tên: "${documentName}". Hãy giải đáp các thắc mắc của học sinh một cách dễ hiểu, sư phạm, và ngắn gọn. Khuyến khích học sinh suy nghĩ thay vì đưa code giải sẵn ngay lập tức. Dùng ngôn ngữ thân thiện, xưng thầy/cô và gọi học sinh là em.`;

        // Chuyển đổi history sang định dạng Gemini
        const contents = history.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + GEMINI_API_KEY.trim(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: contents
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, thầy/cô không thể trả lời lúc này.";
        
        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Lỗi kết nối AI: " + error.message }, { status: 500 });
    }
}
