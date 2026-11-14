/**
 * GỌI GEMINI VỚI NHIỀU API KEY + NHIỀU MODEL THEO THỨ TỰ ƯU TIÊN
 * --------------------------------------------------------------
 * Cấu hình trên Vercel (Settings → Environment Variables):
 *   GEMINI_API_KEYS = key1,key2,key3      (nhiều key, cách nhau bởi dấu phẩy hoặc xuống dòng)
 *   GEMINI_API_KEY  = key                 (vẫn dùng được, được gộp chung với danh sách trên)
 *   GEMINI_MODELS   = model1,model2,...   (không bắt buộc; thứ tự = thứ tự ưu tiên)
 *
 * Cách chạy: thử model ưu tiên nhất với lần lượt từng key; nếu key hết hạn mức (429),
 * key sai, máy chủ Google lỗi hay trả lời quá chậm thì chuyển key / model kế tiếp.
 * Key sai hoặc model không tồn tại được "cho nghỉ" một thời gian để lần sau bỏ qua ngay.
 */

const DEFAULT_MODELS = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
];

function splitList(v: string | undefined): string[] {
    return (v || '').split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
}

export function geminiKeys(): string[] {
    return Array.from(new Set([...splitList(process.env.GEMINI_API_KEYS), ...splitList(process.env.GEMINI_API_KEY)]));
}

export function geminiModels(): string[] {
    const m = splitList(process.env.GEMINI_MODELS);
    return m.length > 0 ? m : DEFAULT_MODELS;
}

// "Cho nghỉ" key / model / cặp key+model bị lỗi (nhớ trong bộ nhớ máy chủ)
const cooldownUntil = new Map<string, number>();
function isCooling(id: string): boolean {
    const t = cooldownUntil.get(id);
    if (!t) return false;
    if (Date.now() > t) { cooldownUntil.delete(id); return false; }
    return true;
}
function coolDown(id: string, ms: number) {
    cooldownUntil.set(id, Date.now() + ms);
}

let roundRobin = 0; // chia đều lượt hỏi cho các key

export class GeminiUnavailable extends Error {}

export interface GeminiRequest {
    systemInstruction?: string;
    contents: any[];
    perAttemptMs?: number; // thời gian chờ tối đa cho 1 lần gọi
    deadlineMs?: number;   // tổng thời gian tối đa cho cả lượt hỏi
}

export interface GeminiResult {
    text: string;
    model: string;
}

function extractText(data: any): string {
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const visible = parts.filter((p: any) => !p.thought && p.text);
    return (visible.length > 0 ? visible : parts).map((p: any) => p.text || '').join('\n').trim();
}

export async function generateWithFallback(req: GeminiRequest): Promise<GeminiResult> {
    const keys = geminiKeys();
    if (keys.length === 0) throw new GeminiUnavailable('Chưa cấu hình GEMINI_API_KEYS / GEMINI_API_KEY');
    const models = geminiModels();
    const perAttempt = req.perAttemptMs ?? 20_000;
    const deadline = Date.now() + (req.deadlineMs ?? 50_000);
    const offset = roundRobin++ % keys.length;
    let lastError = 'Không có model nào khả dụng';

    const body = JSON.stringify({
        ...(req.systemInstruction ? { systemInstruction: { parts: [{ text: req.systemInstruction }] } } : {}),
        contents: req.contents,
    });

    for (const model of models) {
        if (isCooling('model:' + model)) continue;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[(offset + i) % keys.length];
            const keyId = 'key:' + key;
            const pairId = 'pair:' + key + '|' + model;
            if (isCooling(keyId) || isCooling(pairId)) continue;

            const remaining = deadline - Date.now();
            if (remaining < 2_000) throw new GeminiUnavailable('Hết thời gian chờ: ' + lastError);

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), Math.min(perAttempt, remaining));
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
                    body,
                    signal: controller.signal,
                });
                const data: any = await res.json().catch(() => ({}));

                if (res.ok) {
                    const text = extractText(data);
                    if (text) return { text, model };
                    // Bị chặn bởi bộ lọc an toàn / trả về rỗng: thử model khác
                    lastError = `${model}: trả lời rỗng`;
                    break;
                }

                const msg = String(data?.error?.message || res.status);
                lastError = `${model}: ${msg}`;
                if (res.status === 404 || /not found|not supported|is not available/i.test(msg)) {
                    coolDown('model:' + model, 60 * 60_000); // model không tồn tại: bỏ qua 1 giờ
                    break;
                }
                if (res.status === 401 || res.status === 403 || /api key/i.test(msg)) {
                    coolDown(keyId, 30 * 60_000); // key sai / bị khóa: bỏ qua 30 phút
                    continue;
                }
                if (res.status === 429) {
                    coolDown(pairId, 60_000); // key này hết hạn mức với model này: nghỉ 1 phút
                    continue;
                }
                if (res.status >= 500) continue; // máy chủ Google lỗi tạm thời: thử key khác
                break; // lỗi yêu cầu khác: thử model kế tiếp
            } catch (e: any) {
                const slow = e?.name === 'AbortError';
                lastError = `${model}: ${slow ? 'trả lời quá chậm' : e?.message}`;
                if (slow) coolDown('model:' + model, 2 * 60_000); // model đang chậm: tạm bỏ qua 2 phút
                break; // chuyển sang model kế tiếp thay vì thử lại với key khác
            } finally {
                clearTimeout(timer);
            }
        }
    }
    throw new GeminiUnavailable(lastError);
}
