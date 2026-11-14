# ProCoder VIP – Nền tảng luyện thi HSG Tin học (Python)

Webapp Next.js cho đội tuyển HSG Tin học THPT Trần Phú – Đà Lạt: tự học, luyện đề Dạng 1–2, phòng thi KTGK, trợ giảng AI.

## Chạy trên máy

```bash
npm install
npm run dev     # mở http://localhost:3000
```

## Biến môi trường (Vercel → Settings → Environment Variables)

| Tên | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `GOOGLE_CREDENTIALS` | Có | Nội dung file JSON của service account Google Sheets |
| `GOOGLE_SHEETS_ID` | Không | Bảng điểm đội tuyển HSG (có ID mặc định) |
| `GOOGLE_EXAM_SHEETS_ID` | Không | Sheet Phòng thi KTGK lớp học (có ID mặc định) |
| `GEMINI_API_KEYS` | Có | **Nhiều** key Gemini, cách nhau bởi dấu phẩy: `key1,key2,key3`. Key hết hạn mức hoặc bị lỗi sẽ tự chuyển sang key khác |
| `GEMINI_API_KEY` | Không | Cách cũ (1 key), vẫn dùng được, được gộp chung với `GEMINI_API_KEYS` |
| `GEMINI_MODELS` | Không | Danh sách model theo thứ tự ưu tiên, ví dụ `gemini-3.8-flash,gemini-3.7-flash,gemini-2.5-flash`. Bỏ trống thì dùng danh sách mặc định trong `src/lib/server/gemini.ts` |
| `GRADE_SECRET` | Nên có | Chuỗi bí mật bất kỳ (≥ 32 ký tự) để ký điểm. Nếu không đặt, hệ thống tự suy ra từ `GOOGLE_CREDENTIALS` |

## Cấu trúc dữ liệu đề – QUAN TRỌNG

| Thư mục | Công khai? | Chứa gì |
| --- | --- | --- |
| `public/data/TUAN x/...` | **Có** (ai cũng tải được) | Đề PDF/DOCX, tài liệu tự học, file vào `.INP`, `template.py` |
| `private-data/TUAN x/...` | **Không** | Đáp án `.OUT`, lời giải mẫu `.py`, file chấm |

Máy chủ (`/api/grade`) đọc đáp án trong `private-data/` để chấm. Trình duyệt **không bao giờ** nhận được đáp án.

**Khi thêm tuần mới:** cứ chép cả thư mục tuần (có `.INP` và `.OUT`) vào `public/data/` như trước,
rồi chạy `Day_Bai_Len_Mang.bat`. File này tự chạy `node scripts/tach-dap-an.js` để chuyển mọi `.OUT`
và lời giải sang `private-data/` trước khi đẩy lên mạng.

## Cách chấm điểm (từ Giai đoạn 1)

1. Trình duyệt tải `.INP`, chạy code học sinh bằng Pyodide.
2. Trình duyệt chỉ gửi **mã băm (dấu vân tay)** của kết quả lên `/api/grade`, không gửi điểm.
3. Máy chủ so với đáp án, tính điểm và trả về **chữ ký điểm** (`gradeToken`).
4. `/api/sheets` chỉ ghi điểm khi chữ ký hợp lệ và khớp đúng mã nguồn đã chấm. Không có chữ ký → điểm tự động = 0, ghi chú "chờ GV xem lại".

Ở trang **Nộp bài** (cả Tự học và Đề thi), test sai vẫn hiện "Mẫu" để học sinh đối chiếu. **Phòng thi KTGK** thì không hiện.

## Bảng tính Google Sheet (hai bảng)

| Bảng tính | Biến môi trường (ID mặc định) | Tab |
| --- | --- | --- |
| Bảng điểm đội tuyển HSG | `GOOGLE_SHEETS_ID` (`1UIrvCAp3NRE6CVhux1jOdRxyQ1ZcwuYmpVLUJ9KdprE`) | `BangDiem_DaiTra`, `BangDiem_DoiTuyen` |
| Phòng thi KTGK (học sinh lớp học) | `GOOGLE_EXAM_SHEETS_ID` (`1cVDdX91Se8hCbNms9MLwZu_1ed9f4s5c-hfRPt6Hs3M`) | `CauHinh`, `DanhSachHS` (C: HoTen, D: Lop, E: SoLanThi, F: MaDe, G: TrangThai), `DiemThucHanh` |

Hai ID này khai báo tại `src/lib/server/google.ts`. Tài khoản dịch vụ trong `GOOGLE_CREDENTIALS` phải có quyền **Người chỉnh sửa** trên cả hai bảng tính.

## Phòng thi (tab `CauHinh`)

- `MaPhongThi`, `MatKhauGiamThi`: được kiểm tra trên máy chủ (`/api/exam-auth`), không gửi về trình duyệt. **Bắt buộc phải có**, không còn mật khẩu mặc định.
- Ô Mã đề (cột F tab `DanhSachHS`) chỉ được ghi khi đang trống. Muốn cho học sinh bốc lại đề: xóa ô đó.
