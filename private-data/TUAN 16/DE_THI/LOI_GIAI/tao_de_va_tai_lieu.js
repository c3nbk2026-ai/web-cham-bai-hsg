const fs = require('fs');
const D = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle,
        ShadingType, LevelFormat, Footer, PageNumber, HeadingLevel, VerticalAlign } = D;

const W = 9638; // chiều rộng nội dung (A4, lề 2 cm)
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const LINE = { style: BorderStyle.SINGLE, size: 4, color: '808080' };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const allBorders = { top: LINE, bottom: LINE, left: LINE, right: LINE };

function makeHelpers(font, size) {
  const r = (text, o = {}) => new TextRun({ text, font: o.mono ? 'Courier New' : font, size: o.size || size, bold: o.b, italics: o.i, color: o.color });
  const p = (runs, o = {}) => new Paragraph({
    children: (Array.isArray(runs) ? runs : [runs]).map(x => typeof x === 'string' ? r(x) : x),
    alignment: o.align, spacing: { before: o.before ?? 0, after: o.after ?? 80, line: o.line ?? 276 },
    numbering: o.bullet ? { reference: 'dots', level: 0 } : undefined,
    border: o.rule ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: '808080', space: 4 } } : undefined,
    keepNext: o.keepNext, shading: o.shade ? { type: ShadingType.CLEAR, fill: o.shade, color: 'auto' } : undefined,
    indent: o.indent ? { left: o.indent } : undefined,
  });
  const cell = (children, width, o = {}) => new TableCell({
    children: Array.isArray(children) ? children : [children], width: { size: width, type: WidthType.DXA },
    borders: o.noBorder ? noBorders : allBorders, verticalAlign: VerticalAlign.TOP,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
  });
  const table = (widths, rows, o = {}) => new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: rows.map((row, ri) => new TableRow({ children: row.map((c, ci) => cell(c, widths[ci], { noBorder: o.noBorder, fill: o.head && ri === 0 ? o.head : undefined })) })),
  });
  return { r, p, table };
}
const numbering = { config: [{ reference: 'dots', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] };
const page = { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } };



// ======================= ĐỀ THI SỐ 14 =======================
function deThi() {
  const { r, p, table } = makeHelpers('Times New Roman', 26);
  const C = AlignmentType.CENTER, J = AlignmentType.JUSTIFIED;
  const blue = '1F4E79';
  const code = (lines) => lines.map(l => p(r(l, { mono: true, size: 22 }), { after: 0, line: 240 }));
  const ex = (inp, out) => table([W / 2, W / 2], [
    [p(r('INPUT', { b: true }), { align: C, after: 0 }), p(r('OUTPUT', { b: true }), { align: C, after: 0 })],
    [code(inp), code(out)],
  ], { head: 'EDEDED' });
  const head = (t) => p(r(t, { b: true, color: blue, size: 28 }), { before: 240, after: 120, keepNext: true });
  const lbl = (t, rest) => p([r(t, { b: true }), r(rest || '')], { align: J, keepNext: !rest });
  const row = (cau, ten, f) => [p(r(cau, { b: true, size: 24 }), { align: C, after: 0 }), p(r(ten, { size: 22 }), { after: 0 }),
    p(r(f + '.PY', { size: 20 }), { align: C, after: 0 }), p(r(f + '.INP', { size: 20 }), { align: C, after: 0 }), p(r(f + '.OUT', { size: 20 }), { align: C, after: 0 }), p(r('10.0', { b: true }), { align: C, after: 0 })];

  const children = [
    table([W / 2, W / 2], [[
      [p(r('TRƯỜNG THPT TRẦN PHÚ – ĐÀ LẠT', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('ĐỘI TUYỂN HSG TIN HỌC', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('ĐỀ LUYỆN TẬP SỐ 16', { b: true, size: 23 }), { align: C, after: 0 })],
      [p(r('KỲ THI CHỌN HSG CẤP TỈNH', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('LỚP 12 THPT (ĐỀ LUYỆN TẬP)', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('Môn: TIN HỌC (Lập trình Python)', { i: true, size: 23 }), { align: C, after: 0 }),
       p(r('Thời gian: 90 phút (không kể phát đề)', { i: true, size: 23 }), { align: C, after: 0 })],
    ]], { noBorder: true }),
    p('', { rule: true, after: 200 }),
    p(r('CHUYÊN ĐỀ: TÌM KIẾM NHỊ PHÂN', { b: true }), { align: C, after: 160 }),
    p(r('DANH MỤC CÁC BÀI THI', { b: true }), { align: C, after: 120 }),
    table([900, 2138, 1900, 1900, 1900, 900], [
      ['Câu', 'Tên bài', 'File mã nguồn', 'File input', 'File output', 'Điểm'].map(t => p(r(t, { b: true }), { align: C, after: 0 })),
      row('Câu 1', 'Đặt phòng homestay', 'HOMESTAY'),
      row('Câu 2', 'Thuyền thiên nga hồ Xuân Hương', 'THUYEN'),
    ], { head: 'EDEDED' }),

    // ---------------- CÂU 1 ----------------
    head('Câu 1 (10.0 điểm): ĐẶT PHÒNG HOMESTAY (HOMESTAY)'),
    p('Một trang web du lịch Đà Lạt có N phòng homestay, phòng thứ i có giá thuê một đêm là A[i] (nghìn đồng). Có Q du khách vào tra cứu, du khách thứ j có ngân sách x (nghìn đồng) và muốn biết có bao nhiêu phòng mình đủ tiền thuê.', { align: J }),
    lbl('Yêu cầu: ', 'Với mỗi du khách, hãy đếm số phòng có giá thuê không vượt quá ngân sách x của du khách đó.'),
    lbl('Dữ liệu vào: Đọc từ tệp HOMESTAY.INP gồm:'),
    p('Dòng 1: Hai số nguyên dương N và Q.', { bullet: true }),
    p('Dòng 2: N số nguyên dương A[1], A[2], ..., A[N] (chưa được sắp xếp).', { bullet: true }),
    p('Dòng 3: Q số nguyên dương là ngân sách của Q du khách.', { bullet: true }),
    lbl('Dữ liệu ra: Ghi ra tệp HOMESTAY.OUT gồm:'),
    p('Q dòng, dòng thứ j ghi số phòng mà du khách thứ j đủ tiền thuê.', { bullet: true }),
    lbl('Ví dụ:'),
    ex(['5 4', '500 300 800 300 1200', '250 300 1000 2000'], ['0', '2', '4', '5']),
    p([r('Giải thích: ', { b: true }), r('Với ngân sách 300 có 2 phòng giá 300; với 1000 có 4 phòng (300, 300, 500, 800); với 2000 thuê được cả 5 phòng.')], { align: J, before: 120 }),
    lbl('Ràng buộc Subtask:'),
    p('Subtask 1 (60% số điểm): N, Q ≤ 10^3 và A[i], x ≤ 10^6.', { bullet: true }),
    p('Subtask 2 (40% số điểm): N, Q ≤ 10^5 và A[i], x ≤ 10^9.', { bullet: true }),

    // ---------------- CÂU 2 ----------------
    head('Câu 2 (10.0 điểm): THUYỀN THIÊN NGA HỒ XUÂN HƯƠNG (THUYEN)'),
    p('Đoàn du lịch có N du khách, người thứ i nặng w[i] (kg). Mỗi chiếc thuyền thiên nga trên hồ Xuân Hương chở đúng 2 người và chỉ an toàn khi tổng cân nặng của 2 người không vượt quá S (kg).', { align: J }),
    lbl('Yêu cầu: ', 'Hãy đếm số cách chọn ra 2 du khách khác nhau (không kể thứ tự) để họ có thể đi chung một thuyền an toàn.'),
    lbl('Dữ liệu vào: Đọc từ tệp THUYEN.INP gồm:'),
    p('Dòng 1: Hai số nguyên dương N và S (S ≤ 2 × 10^6).', { bullet: true }),
    p('Dòng 2: N số nguyên dương w[1], w[2], ..., w[N] (w[i] ≤ 10^6).', { bullet: true }),
    lbl('Dữ liệu ra: Ghi ra tệp THUYEN.OUT gồm:'),
    p('Một số nguyên duy nhất là số cặp du khách đi chung thuyền được.', { bullet: true }),
    lbl('Ví dụ:'),
    ex(['5 100', '45 60 30 70 55'], ['5']),
    p([r('Giải thích: ', { b: true }), r('Các cặp hợp lệ: (45, 30), (45, 55), (60, 30), (30, 70), (30, 55).')], { align: J, before: 120 }),
    lbl('Ràng buộc Subtask:'),
    p('Subtask 1 (50% số điểm): N ≤ 2000.', { bullet: true }),
    p('Subtask 2 (50% số điểm): N ≤ 10^5.', { bullet: true }),

    p(r('------------------ HẾT ------------------', { b: true }), { align: C, before: 300 }),
    p(r('Đề luyện tập do tổ Tin học – Trường THPT Trần Phú biên soạn, phục vụ bồi dưỡng đội tuyển.', { i: true, size: 22 }), { align: C }),
  ];
  return new Document({ numbering, sections: [{ properties: { page }, children }] });
}

// ======================= TÀI LIỆU TỰ HỌC TUẦN 14 =======================
function tuHoc() {
  const { r, p, table } = makeHelpers('Arial', 22);
  const J = AlignmentType.JUSTIFIED, C = AlignmentType.CENTER;
  const blue = '1F4E79', red = 'C00000';
  const code = (lines) => lines.map(l => p(r(l || ' ', { mono: true, size: 20 }), { after: 0, line: 240, shade: 'F2F2F2', indent: 120 }));
  const ch = (no, t) => [p(r(no, { b: true, color: red, size: 22 }), { before: 200, after: 0, keepNext: true }), p(r(t, { b: true, color: blue, size: 28 }), { after: 100, line: 300, keepNext: true })];
  const h2 = (t) => p(r(t, { b: true, color: blue, size: 24 }), { before: 160, after: 80, keepNext: true });
  const tbl = (widths, rows) => table(widths, rows.map((row, ri) => row.map(c => p(r(c, { b: ri === 0, mono: ri > 0 && /^[-–\d ,.]+$/.test(c), size: 20 }), { after: 0 }))), { head: 'DCE6F1' });

  const children = [
    p(r('BỘ TÀI LIỆU CHUYÊN ĐỀ ÔN LUYỆN HỌC SINH GIỎI TIN HỌC', { b: true, size: 20 }), { after: 0 }),
    p(r('NĂM HỌC 2026-2027', { b: true, size: 20 }), { rule: true, after: 240 }),
    p(r('TÀI LIỆU HƯỚNG DẪN TỰ HỌC', { b: true, color: blue, size: 32 }), { line: 380, after: 0 }),
    p(r('LẬP TRÌNH PYTHON CHUYÊN SÂU', { b: true, color: blue, size: 32 }), { line: 380, after: 0 }),
    p(r('BUỔI 16: TÌM KIẾM NHỊ PHÂN – MỖI LẦN HỎI CHỈ CẦN KHOẢNG 17 BƯỚC', { b: true, color: blue, size: 32 }), { line: 380, after: 60 }),
    p(r('(Phiên bản Điện tử — Tự học dành cho Học sinh Đội tuyển)', { i: true, color: '808080', size: 20 }), { after: 200 }),
    p(r('📖 LỜI NÓI ĐẦU & NGUYÊN TẮC TỰ HỌC', { b: true, color: blue }), { keepNext: true }),
    p('Khi cần tìm một giá trị trong dãy, cách tự nhiên là duyệt từ đầu đến cuối. Nếu dãy đã SẮP XẾP, mỗi lần so sánh với phần tử ở giữa sẽ loại bỏ được một nửa dãy, nên chỉ cần khoảng 17 bước cho dãy 10^5 phần tử.', { align: J }),
    p([r('Yêu cầu: ', { b: true }), r('Đọc kỹ lý thuyết, tự viết code 2 bài khởi động và kiểm thử trên web tới khi đạt 100% test. Sau đó làm Đề luyện tập số 16 ở mục Luyện Đề.')], { align: J }),

    ...ch('CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'),
    p('Tự cài đặt tìm kiếm nhị phân bằng vòng lặp while trên dãy đã sắp xếp.', { bullet: true }),
    p('Tìm được vị trí đầu tiên có giá trị ≥ x hoặc > x, và dùng chúng để đếm số phần tử ≤ x hoặc số lần x xuất hiện.', { bullet: true }),
    p('Biết dùng thư viện bisect của Python (bisect_left, bisect_right) để kiểm tra lại kết quả.', { bullet: true }),

    ...ch('CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'),
    h2('1. Ý tưởng: chia đôi vùng tìm kiếm'),
    p('Tìm x = 16 trong dãy tăng a = [2, 5, 8, 12, 16, 23, 38] (chỉ số từ 0). Giữ hai đầu lo, hi; mỗi bước xét phần tử giữa mid = (lo + hi) // 2:', { align: J }),
    tbl([1300, 1300, 1300, 2200, 3538], [
      ['Bước', 'lo', 'hi', 'a[mid]', 'Kết luận'],
      ['1', '0', '6', 'a[3] = 12', '12 < 16 → bỏ nửa trái, lo = 4'],
      ['2', '4', '6', 'a[5] = 23', '23 > 16 → bỏ nửa phải, hi = 4'],
      ['3', '4', '4', 'a[4] = 16', 'Tìm thấy ở chỉ số 4 (vị trí thứ 5)'],
    ]),
    h2('2. Khung code tìm vị trí đầu tiên có a[k] > x'),
    p('Đây là khung quan trọng nhất của buổi học. Kết quả lo chính là SỐ PHẦN TỬ ≤ x (dãy đã sắp xếp tăng dần):', { align: J }),
    ...code(['a.sort()', 'lo, hi = 0, n            # vùng tìm kiếm [lo, hi)', 'while lo < hi:', '    mid = (lo + hi) // 2', '    if a[mid] <= x:', '        lo = mid + 1       # a[mid] chưa vượt x: đáp án nằm bên phải', '    else:', '        hi = mid           # a[mid] > x: đáp án là mid hoặc bên trái', '# lo = vị trí đầu tiên có a[lo] > x = số phần tử <= x']),
    p('Đổi điều kiện "a[mid] <= x" thành "a[mid] < x" thì lo là vị trí đầu tiên có a[lo] ≥ x. Thư viện bisect làm sẵn hai việc này: bisect_right(a, x) và bisect_left(a, x).', { align: J }),
    h2('3. Vì sao nhanh hơn? (độ phức tạp)'),
    tbl([3700, 2900, 3038], [
      ['Việc cần làm (N = Q = 10^5)', 'Duyệt tuần tự', 'Sắp xếp + nhị phân'],
      ['Trả lời 1 câu hỏi', 'tới 10^5 phép so sánh', 'khoảng 17 phép so sánh'],
      ['Trả lời cả Q câu hỏi', 'khoảng 10^10 phép → rất lâu', 'khoảng 2 × 10^6 phép'],
      ['Kết quả trên web chấm', 'QUÁ THỜI GIAN Subtask 2', 'Đúng và nhanh cả 2 Subtask'],
    ]),
    h2('4. Mở rộng: đếm cặp'),
    p([r('Đếm cặp có tổng ≤ S: ', { b: true }), r('sắp xếp dãy; với mỗi i, các bạn j > i đi chung được là những người có w[j] ≤ S − w[i]. Vì dãy đã sắp xếp nên họ nằm liền nhau ngay sau i: dùng tìm kiếm nhị phân trên đoạn [i + 1, n) để đếm. Đây là ý tưởng của Câu 2 trong đề số 16.')], { align: J }),
    p([r('Lỗi hay gặp: ', { b: true }), r('quên sắp xếp trước khi tìm; viết lo = mid thay vì lo = mid + 1 làm vòng lặp chạy mãi; đếm cả cặp (i, i) hoặc đếm mỗi cặp hai lần.')], { align: J }),

    ...ch('CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 2 BÀI KHỞI ĐỘNG'),
    h2('Bài khởi động 1: TÌM VỊ TRÍ (TIMX)'),
    p('Đề bài: Cho dãy N số nguyên đôi một khác nhau, đã sắp xếp TĂNG DẦN, và Q câu hỏi (N, Q ≤ 10^5, |giá trị| ≤ 10^9). Dòng 1 chứa N và Q, dòng 2 chứa dãy, dòng 3 chứa Q số x. Với mỗi x, in trên một dòng vị trí của x trong dãy (đánh số từ 1), hoặc −1 nếu x không có trong dãy.', { align: J }),
    p('Ví dụ: vào "6 4", "2 5 8 12 16 23", "12 2 7 23" → ra 4, 1, −1, 6 (mỗi số một dòng).', { align: J }),
    h2('Bài khởi động 2: ĐẾM SỐ LẦN XUẤT HIỆN (DEMX)'),
    p('Đề bài: Cho dãy N số nguyên dương đã sắp xếp KHÔNG GIẢM (có thể trùng nhau) và Q câu hỏi (N, Q ≤ 10^5). Dữ liệu vào giống bài TIMX. Với mỗi x, in trên một dòng số lần x xuất hiện trong dãy.', { align: J }),
    p('Ví dụ: vào "8 4", "1 3 3 3 5 7 7 9", "3 7 4 9" → ra 3, 2, 0, 1.', { align: J }),
    p('Gợi ý: số lần xuất hiện = (vị trí đầu tiên có a[k] > x) − (vị trí đầu tiên có a[k] ≥ x).', { align: J }),
    ...code(['import sys', "sys.stdin = open('DEMX.INP', 'r')", "sys.stdout = open('DEMX.OUT', 'w')   # đọc/ghi tệp như khi thi", 'data = sys.stdin.read().split()', 'n, q = int(data[0]), int(data[1])', 'a = [int(v) for v in data[2:2 + n]]', 'kq = []', 'for j in range(q):', '    x = int(data[2 + n + j])', '    # TODO: tìm kiếm nhị phân, thêm kết quả vào kq', 'print("\\n".join(kq))']),

    ...ch('CHƯƠNG IV', 'HỆ THỐNG KIỂM THỬ TỰ ĐỘNG'),
    p('Vào trang Chấm Code → chọn TUAN 16 → Loại bài "Tự học" → chọn TEST_TIMX hoặc TEST_DEMX → dán code → Chạy Code. Đạt 100% thì sang mục Luyện Đề làm Đề số 16. Mỗi bài khởi động có 10 test:', { align: J }),
    tbl([1800, 7838], [
      ['Bộ test', 'Ý nghĩa'],
      ['Test01', 'Ví dụ trong tài liệu'],
      ['Test02 – 04', 'Trường hợp biên: dãy 1 phần tử, x nhỏ hơn số đầu hoặc lớn hơn số cuối, số âm'],
      ['Test05 – 10', 'Dữ liệu lớn: N, Q tới 10^5 (kiểm tra tốc độ, phải dùng nhị phân)'],
    ]),
  ];
  const footer = new Footer({ children: [p([r('Tài liệu bồi dưỡng học sinh giỏi năm học 2026-2027 — Trang ', { size: 18, color: '808080' }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '808080', font: 'Arial' }), r(' / ', { size: 18, color: '808080' }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '808080', font: 'Arial' })], { align: AlignmentType.RIGHT })] });
  return new Document({ numbering, sections: [{ properties: { page }, footers: { default: footer }, children }] });
}

(async () => {
  fs.writeFileSync('de_thi_hsg_lam_dong_1_2_(16).docx', await Packer.toBuffer(deThi()));
  fs.writeFileSync('hs-hsg-huong-dan-tu-hoc-tuan-16.docx', await Packer.toBuffer(tuHoc()));
  console.log('ok');
})();
