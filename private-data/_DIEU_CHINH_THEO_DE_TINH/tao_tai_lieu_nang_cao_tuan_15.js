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
const page = { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: 1134, right: 1134 } };



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
       p(r('ĐỀ LUYỆN TẬP SỐ 15', { b: true, size: 23 }), { align: C, after: 0 })],
      [p(r('KỲ THI CHỌN HSG CẤP TỈNH', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('LỚP 12 THPT (ĐỀ LUYỆN TẬP)', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('Môn: TIN HỌC (Lập trình Python)', { i: true, size: 23 }), { align: C, after: 0 }),
       p(r('Thời gian: 90 phút (không kể phát đề)', { i: true, size: 23 }), { align: C, after: 0 })],
    ]], { noBorder: true }),
    p('', { rule: true, after: 200 }),
    p(r('CHUYÊN ĐỀ: SÀNG NGUYÊN TỐ', { b: true }), { align: C, after: 160 }),
    p(r('DANH MỤC CÁC BÀI THI', { b: true }), { align: C, after: 120 }),
    table([900, 2138, 1900, 1900, 1900, 900], [
      ['Câu', 'Tên bài', 'File mã nguồn', 'File input', 'File output', 'Điểm'].map(t => p(r(t, { b: true }), { align: C, after: 0 })),
      row('Câu 1', 'Vé may mắn Festival Hoa', 'VEMAYMAN'),
      row('Câu 2', 'Hạt giống ba ước', 'BAUOC'),
    ], { head: 'EDEDED' }),

    // ---------------- CÂU 1 ----------------
    head('Câu 1 (10.0 điểm): VÉ MAY MẮN FESTIVAL HOA (VEMAYMAN)'),
    p('Tại Festival Hoa Đà Lạt, mỗi vé vào cổng được đánh một số thứ tự là số nguyên dương. Ban tổ chức tặng quà cho mọi vé có số thứ tự là SỐ NGUYÊN TỐ (số nguyên lớn hơn 1, chỉ chia hết cho 1 và chính nó).', { align: J }),
    p('Có Q đợt phát quà. Ở đợt thứ j, ban tổ chức phát quà cho các vé có số thứ tự từ L đến R và cần biết trước phải chuẩn bị bao nhiêu phần quà.', { align: J }),
    lbl('Yêu cầu: ', 'Với mỗi đợt, hãy đếm số các số nguyên tố trong đoạn [L, R].'),
    lbl('Dữ liệu vào: Đọc từ tệp VEMAYMAN.INP gồm:'),
    p('Dòng 1: Số nguyên dương Q.', { bullet: true }),
    p('Q dòng tiếp theo: Mỗi dòng gồm hai số nguyên L và R (1 ≤ L ≤ R).', { bullet: true }),
    lbl('Dữ liệu ra: Ghi ra tệp VEMAYMAN.OUT gồm:'),
    p('Q dòng, dòng thứ j ghi số lượng số nguyên tố trong đoạn [L, R] của đợt thứ j.', { bullet: true }),
    lbl('Ví dụ:'),
    ex(['3', '1 10', '11 20', '7 7'], ['4', '4', '1']),
    p([r('Giải thích: ', { b: true }), r('Từ 1 đến 10 có 4 số nguyên tố: 2, 3, 5, 7. Từ 11 đến 20 có 4 số: 11, 13, 17, 19. Số 7 là số nguyên tố.')], { align: J, before: 120 }),
    lbl('Ràng buộc Subtask:'),
    p('Subtask 1 (60% số điểm): Q ≤ 10 và R ≤ 10^4.', { bullet: true }),
    p('Subtask 2 (40% số điểm): Q ≤ 10^5 và R ≤ 10^6.', { bullet: true }),

    // ---------------- CÂU 2 ----------------
    head('Câu 2 (10.0 điểm): HẠT GIỐNG BA ƯỚC (BAUOC)'),
    p('Trung tâm giống cây trồng Lâm Đồng có N gói hạt giống, gói thứ i được dán mã số là số nguyên dương A[i]. Gói hạt giống được xếp loại "quý" nếu mã số của nó có ĐÚNG BA ƯỚC SỐ nguyên dương.', { align: J }),
    p('Ví dụ: 9 có đúng 3 ước là 1, 3, 9 nên gói mã 9 là gói quý; 12 có 6 ước (1, 2, 3, 4, 6, 12) nên không quý; 1 chỉ có 1 ước nên không quý.', { align: J }),
    lbl('Yêu cầu: ', 'Hãy đếm số gói hạt giống quý và tính tổng mã số của các gói quý đó.'),
    lbl('Dữ liệu vào: Đọc từ tệp BAUOC.INP gồm:'),
    p('Dòng 1: Số nguyên dương N.', { bullet: true }),
    p('Dòng 2: N số nguyên dương A[1], A[2], ..., A[N].', { bullet: true }),
    lbl('Dữ liệu ra: Ghi ra tệp BAUOC.OUT gồm:'),
    p('Dòng 1: Số gói hạt giống quý.', { bullet: true }),
    p('Dòng 2: Tổng mã số của các gói quý (ghi 0 nếu không có gói nào).', { bullet: true }),
    lbl('Ví dụ:'),
    ex(['6', '4 9 12 25 1 49'], ['4', '87']),
    p([r('Giải thích: ', { b: true }), r('Các mã 4, 9, 25, 49 đều có đúng 3 ước. Tổng = 4 + 9 + 25 + 49 = 87.')], { align: J, before: 120 }),
    lbl('Ràng buộc Subtask:'),
    p('Subtask 1 (50% số điểm): N ≤ 10^3 và A[i] ≤ 10^6.', { bullet: true }),
    p('Subtask 2 (50% số điểm): N ≤ 10^5 và A[i] ≤ 10^12.', { bullet: true }),

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
    p(r('BUỔI 15: SÀNG NGUYÊN TỐ ERATOSTHENES – KIỂM TRA HÀNG TRIỆU SỐ CÙNG LÚC', { b: true, color: blue, size: 32 }), { line: 380, after: 60 }),
    p(r('(Phiên bản Điện tử — Tự học dành cho Học sinh Đội tuyển)', { i: true, color: '808080', size: 20 }), { after: 200 }),
    p(r('📖 LỜI NÓI ĐẦU & NGUYÊN TẮC TỰ HỌC', { b: true, color: blue }), { keepNext: true }),
    p('Ở các tuần trước, em kiểm tra một số có nguyên tố hay không bằng cách thử chia tới căn bậc hai của nó. Cách đó rất tốt khi chỉ cần kiểm tra vài số. Nhưng khi phải kiểm tra hàng trăm nghìn số, hoặc trả lời nhiều câu hỏi về số nguyên tố, em cần SÀNG: đánh dấu một lần cho mọi số từ 1 đến N, sau đó tra cứu tức thì.', { align: J }),
    p([r('Yêu cầu: ', { b: true }), r('Đọc kỹ lý thuyết, tự viết code các bài khởi động và kiểm thử trên web tới khi đạt 100% test. Sau đó làm Đề luyện tập số 15 ở mục Luyện Đề.')], { align: J }),

    ...ch('CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'),
    p('Cài đặt sàng Eratosthenes để biết mọi số từ 0 đến N có nguyên tố hay không.', { bullet: true }),
    p('Kết hợp sàng với mảng cộng dồn (Tuần 13) để đếm số nguyên tố trong đoạn [L, R] tức thì.', { bullet: true }),
    p('Biết sàng ước nguyên tố nhỏ nhất để phân tích nhanh một số ra thừa số nguyên tố.', { bullet: true }),
    p('Nhận ra tính chất: một số có đúng 3 ước khi và chỉ khi nó là bình phương của một số nguyên tố.', { bullet: true }),

    ...ch('CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'),
    h2('1. Ý tưởng sàng Eratosthenes'),
    p('Ban đầu coi mọi số từ 2 đến N là nguyên tố. Lần lượt xét i = 2, 3, 4, ...: nếu i vẫn còn được đánh dấu nguyên tố thì gạch bỏ mọi bội của i bắt đầu từ i × i. Chỉ cần xét i đến căn bậc hai của N.', { align: J }),
    tbl([1500, 8138], [
      ['Bước', 'Các số bị gạch (N = 30)'],
      ['i = 2', '4 6 8 10 12 14 16 18 20 22 24 26 28 30'],
      ['i = 3', '9 15 21 27 (các bội chẵn đã gạch ở bước trước)'],
      ['i = 5', '25'],
      ['Còn lại', '2 3 5 7 11 13 17 19 23 29 → 10 số nguyên tố'],
    ]),
    h2('2. Khung code sàng'),
    ...code(['nt = [True] * (n + 1)', 'nt[0] = nt[1] = False', 'i = 2', 'while i * i <= n:', '    if nt[i]:', '        for j in range(i * i, n + 1, i):', '            nt[j] = False', '    i += 1', '# nt[x] == True  ⇔  x là số nguyên tố']),
    h2('3. Vì sao nhanh hơn? (độ phức tạp)'),
    p('Kiểm tra mọi số từ 1 đến 10^6 bằng cách thử chia cần khoảng 10^9 phép chia (quá thời gian); sàng chỉ cần khoảng 3 × 10^6 bước, làm một lần rồi tra cứu tức thì.', { align: J }),
    h2('4. Mở rộng'),
    p([r('Đếm số nguyên tố trong [L, R]: ', { b: true }), r('tạo dem[x] = số lượng số nguyên tố ≤ x (cộng dồn từ mảng nt), khi đó đáp án là dem[R] − dem[L − 1].')], { align: J }),
    p([r('Số có đúng 3 ước: ', { b: true }), r('x có đúng 3 ước ⇔ x = p × p với p nguyên tố. Với x ≤ 10^12 thì p ≤ 10^6: chỉ cần tính r = isqrt(x), kiểm tra r × r == x và nt[r]. Đây là ý tưởng của Câu 2 trong đề số 15.')], { align: J }),

    p([r('Lũy thừa theo modulo: ', { b: true }), r('chữ số cuối của a^n là a^n mod 10. Với n tới 10^18 không thể nhân n lần; dùng pow(a, n, 10) của Python (lũy thừa nhanh, chỉ khoảng 60 phép nhân), hoặc nhận xét chữ số cuối lặp lại theo chu kỳ 4: 2, 4, 8, 6, 2, ...')], { align: J }),

    ...ch('CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 3 BÀI KHỞI ĐỘNG'),
    h2('Bài khởi động 1: SÀNG NGUYÊN TỐ (SANGNT)'),
    p('Đề bài: Cho số nguyên dương N (N ≤ 10^6). Dòng 1 in số lượng số nguyên tố không vượt quá N; dòng 2 in số nguyên tố lớn nhất không vượt quá N (in −1 nếu không có).', { align: J }),
    p('Ví dụ: vào "30" → ra "10" và "29". Vào "1" → ra "0" và "-1".', { align: J }),
    ...code(['import sys', "sys.stdin = open('SANGNT.INP', 'r')", "sys.stdout = open('SANGNT.OUT', 'w')   # đọc/ghi tệp như khi thi", 'n = int(input())', '# TODO: sàng như mục 2, in số lượng và số nguyên tố lớn nhất']),
    h2('Bài khởi động 2: SỐ ƯỚC NGUYÊN TỐ (UOCNT)'),
    p('Đề bài: Cho Q số nguyên dương x (Q ≤ 10^5, x ≤ 2 × 10^5). Với mỗi số, in số lượng ước nguyên tố KHÁC NHAU của nó, các kết quả trên cùng một dòng.', { align: J }),
    p('Ví dụ: vào "5" và "12 7 1 30 64" → ra "2 1 0 3 1" (12 = 2² × 3; 30 = 2 × 3 × 5; 64 = 2⁶).', { align: J }),
    ...code(['spf = list(range(m + 1))          # spf[x] = ước nguyên tố nhỏ nhất của x', 'for i in range(2, isqrt(m) + 1):', '    if spf[i] == i:                # i là số nguyên tố', '        for j in range(i * i, m + 1, i):', '            if spf[j] == j:', '                spf[j] = i', '# TODO: dùng spf để đếm ước nguyên tố khác nhau của từng x']),

    h2('Bài khởi động 3: CHỮ SỐ CUỐI CỦA LŨY THỪA (LUYTHUA)'),
    p('Đề bài: Dòng 1 là Q (Q ≤ 10^5); Q dòng sau mỗi dòng gồm a và n (1 ≤ a ≤ 10^9, 1 ≤ n ≤ 10^18). Với mỗi dòng in chữ số cuối cùng của a^n. Ví dụ: "2 5" → 2 (2^5 = 32); "7 2" → 9; "10 3" → 0.', { align: J }),

    ...ch('CHƯƠNG IV', 'HỆ THỐNG KIỂM THỬ TỰ ĐỘNG'),
    p('Vào trang Chấm Code → chọn TUAN 15 → Loại bài "Tự học" → chọn TEST_SANGNT, TEST_UOCNT hoặc TEST_LUYTHUA → dán code → Chạy Code. Đạt 100% thì sang mục Luyện Đề làm Đề số 15. Mỗi bài khởi động có 10 test:', { align: J }),
    tbl([1800, 7838], [
      ['Bộ test', 'Ý nghĩa'],
      ['Test01', 'Ví dụ trong tài liệu'],
      ['Test02 – 04', 'Trường hợp biên: N = 1, N = 2, toàn số 1, số có nhiều ước nguyên tố (30030)'],
      ['Test05 – 10', 'Dữ liệu lớn: N tới 10^6, tới 10^5 số cần phân tích (kiểm tra tốc độ)'],
    ]),
  ];
  const footer = new Footer({ children: [p([r('Tài liệu bồi dưỡng học sinh giỏi năm học 2026-2027 — Trang ', { size: 18, color: '808080' }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '808080', font: 'Arial' }), r(' / ', { size: 18, color: '808080' }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '808080', font: 'Arial' })], { align: AlignmentType.RIGHT })] });
  return new Document({ numbering, sections: [{ properties: { page }, footers: { default: footer }, children }] });
}

(async () => {
  fs.writeFileSync('de_thi_hsg_lam_dong_1_2_(15).docx', await Packer.toBuffer(deThi()));
  fs.writeFileSync('hs-hsg-huong-dan-tu-hoc-tuan-15.docx', await Packer.toBuffer(tuHoc()));
  console.log('ok');
})();
