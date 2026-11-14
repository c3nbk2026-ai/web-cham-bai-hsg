/**
 * Hàm dùng chung cho TRÌNH DUYỆT và MÁY CHỦ khi chấm bài.
 * Trình duyệt chỉ gửi "dấu vân tay" (mã băm SHA-256) của kết quả chạy,
 * máy chủ băm đáp án theo đúng cách này rồi so sánh. Đáp án không bao giờ rời máy chủ.
 */

/** Chuẩn hóa theo dòng: bỏ \r, bỏ khoảng trắng cuối dòng, bỏ dòng trống đầu/cuối. */
export function normLines(s: string): string {
  return (s || "").replace(/\r/g, "").split("\n").map(l => l.trimEnd()).join("\n").trim();
}

/** Chuẩn hóa theo từ (token): mọi khoảng trắng/xuống dòng coi như nhau. */
export function normTokens(s: string): string {
  return (s || "").replace(/\r/g, "").trim().split(/\s+/).filter(t => t.length > 0).join(" ");
}

/** Lấy dãy các con số trong kết quả (dùng cho điểm vớt "đúng số, sai định dạng"). */
export function extractNumbers(s: string): string {
  return ((s || "").match(/-?\d+(\.\d+)?/g) || []).join(",");
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export interface OutputFingerprint {
  hLine: string;
  hTok: string;
  hNum: string; // "" nếu kết quả không có con số nào
}

/** Tạo dấu vân tay của một kết quả chạy chương trình. */
export async function fingerprintOutput(output: string): Promise<OutputFingerprint> {
  const nums = extractNumbers(output);
  return {
    hLine: await sha256Hex("v1|line|" + normLines(output)),
    hTok: await sha256Hex("v1|tok|" + normTokens(output)),
    hNum: nums ? await sha256Hex("v1|num|" + nums) : "",
  };
}

export async function sha256OfText(text: string): Promise<string> {
  return sha256Hex(text);
}
