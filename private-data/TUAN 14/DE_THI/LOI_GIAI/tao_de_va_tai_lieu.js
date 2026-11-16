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
       p(r('ĐỀ LUYỆN TẬP SỐ 14', { b: true, size: 23 }), { align: C, after: 0 })],
      [p(r('KỲ THI CHỌN HSG CẤP TỈNH', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('LỚP 12 THPT (ĐỀ LUYỆN TẬP)', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('Môn: TIN HỌC (Lập trình Python)', { i: true, size: 23 }), { align: C, after: 0 }),
       p(r('Thời gian: 90 phút (không kể phát đề)', { i: true, size: 23 }), { align: C, after: 0 })],
    ]], { noBorder: true }),
    p('', { rule: true, after: 200 }),
    p(r('CHUYÊN ĐỀ: ĐẾM TẦN SUẤT BẰNG DICT / SET', { b: true }), { align: C, after: 160 }),
    p(r('DANH MỤC CÁC BÀI THI', { b: true }), { align: C, after: 120 }),
    table([900, 2138, 1900, 1900, 1900, 900], [
      ['Câu', 'Tên bài', 'File mã nguồn', 'File input', 'File output', 'Điểm'].map(t => p(r(t, { b: true }), { align: C, after: 0 })),
      row('Câu 1', 'Lễ hội hoa Đà Lạt', 'LOAIHOA'),
      row('Câu 2', 'Ghép cặp thùng nông sản', 'GHEPCAP'),
    ], { head: 'EDEDED' }),

    // ---------------- CÂU 1 ----------------
    head('Câu 1 (10.0 điểm): LỄ HỘI HOA ĐÀ LẠT (LOAIHOA)'),
    p('Ban tổ chức Festival Hoa Đà Lạt trưng bày N chậu hoa dọc đường Trần Quốc Toản. Mỗi chậu hoa có một mã loại hoa là số nguyên dương; chậu thứ i có mã loại A[i]. Các chậu cùng mã thuộc cùng một loại hoa.', { align: J }),
    lbl('Yêu cầu: ', 'Hãy cho biết có bao nhiêu loại hoa khác nhau, và loại hoa nào có nhiều chậu nhất. Nếu có nhiều loại cùng có số chậu nhiều nhất, chọn loại có mã nhỏ nhất.'),
    lbl('Dữ liệu vào: Đọc từ tệp LOAIHOA.INP gồm:'),
    p('Dòng 1: Số nguyên dương N.', { bullet: true }),
    p('Dòng 2: N số nguyên dương A[1], A[2], ..., A[N] (A[i] ≤ 10^9), cách nhau một khoảng trắng.', { bullet: true }),
    lbl('Dữ liệu ra: Ghi ra tệp LOAIHOA.OUT gồm:'),
    p('Dòng 1: Số loại hoa khác nhau.', { bullet: true }),
    p('Dòng 2: Hai số nguyên: mã loại hoa có nhiều chậu nhất và số chậu của loại đó, cách nhau một khoảng trắng.', { bullet: true }),
    lbl('Ví dụ:'),
    ex(['8', '5 3 5 7 3 5 9 3'], ['4', '3 3']),
    p([r('Giải thích: ', { b: true }), r('Có 4 loại hoa: 3, 5, 7, 9. Loại 3 và loại 5 cùng có 3 chậu (nhiều nhất), chọn loại có mã nhỏ hơn là 3.')], { align: J, before: 120 }),
    lbl('Ràng buộc Subtask:'),
    p('Subtask 1 (60% số điểm): N ≤ 10^3.', { bullet: true }),
    p('Subtask 2 (40% số điểm): N ≤ 10^5.', { bullet: true }),

    // ---------------- CÂU 2 ----------------
    head('Câu 2 (10.0 điểm): GHÉP CẶP THÙNG NÔNG SẢN (GHEPCAP)'),
    p('Kho nông sản Đức Trọng có N thùng hàng, thùng thứ i nặng A[i] kg. Mỗi chuyến xe máy chỉ chở được ĐÚNG HAI thùng và tổng khối lượng phải bằng đúng S kg để cân bằng hai bên xe.', { align: J }),
    lbl('Yêu cầu: ', 'Hãy đếm số cặp thùng (i, j) với 1 ≤ i < j ≤ N thỏa mãn A[i] + A[j] = S.'),
    lbl('Dữ liệu vào: Đọc từ tệp GHEPCAP.INP gồm:'),
    p('Dòng 1: Hai số nguyên dương N và S (S ≤ 2 × 10^9).', { bullet: true }),
    p('Dòng 2: N số nguyên dương A[1], A[2], ..., A[N] (A[i] ≤ 10^9).', { bullet: true }),
    lbl('Dữ liệu ra: Ghi ra tệp GHEPCAP.OUT gồm:'),
    p('Một số nguyên duy nhất là số cặp thùng thỏa mãn.', { bullet: true }),
    lbl('Ví dụ:'),
    ex(['6 10', '3 7 5 5 2 8'], ['3']),
    p([r('Giải thích: ', { b: true }), r('Có 3 cặp: thùng 1 và 2 (3 + 7); thùng 3 và 4 (5 + 5); thùng 5 và 6 (2 + 8).')], { align: J, before: 120 }),
    lbl('Ràng buộc Subtask:'),
    p('Subtask 1 (50% số điểm): N ≤ 10^3.', { bullet: true }),
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
    p(r('BUỔI 14: ĐẾM TẦN SUẤT BẰNG DICT / SET – TRA CỨU TỨC THÌ', { b: true, color: blue, size: 32 }), { line: 380, after: 60 }),
    p(r('(Phiên bản Điện tử — Tự học dành cho Học sinh Đội tuyển)', { i: true, color: '808080', size: 20 }), { after: 200 }),
    p(r('📖 LỜI NÓI ĐẦU & NGUYÊN TẮC TỰ HỌC', { b: true, color: blue }), { keepNext: true }),
    p('Rất nhiều bài HSG hỏi: "giá trị này xuất hiện bao nhiêu lần?", "có bao nhiêu giá trị khác nhau?", "đã gặp số này chưa?". Nếu mỗi lần hỏi lại duyệt cả danh sách thì chỉ qua được Subtask 1. Từ điển (dict) và tập hợp (set) trả lời các câu hỏi đó gần như tức thì, giúp em ăn trọn Subtask 2.', { align: J }),
    p([r('Yêu cầu: ', { b: true }), r('Đọc kỹ lý thuyết, tự viết code 2 bài khởi động và kiểm thử trên web tới khi đạt 100% test. Sau đó làm Đề luyện tập số 14 ở mục Luyện Đề.')], { align: J }),

    ...ch('CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'),
    p('Dùng dict để đếm số lần xuất hiện của mỗi giá trị trong một vòng lặp.', { bullet: true }),
    p('Dùng set để khử trùng lặp và kiểm tra "x có trong tập không" thật nhanh.', { bullet: true }),
    p('Hiểu vì sao "x in list" và list.count(x) bị QUÁ THỜI GIAN với dữ liệu lớn.', { bullet: true }),
    p('Biết mở rộng: đếm cặp có tổng bằng S bằng cách tra từ điển cnt[S − x].', { bullet: true }),

    ...ch('CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'),
    h2('1. Đếm bằng từ điển (dict)'),
    p('Từ điển lưu các cặp "khóa → giá trị". Ở bài đếm, khóa là số cần đếm, giá trị là số lần đã gặp:', { align: J }),
    ...code(['cnt = {}', 'for x in a:', '    cnt[x] = cnt.get(x, 0) + 1   # chưa có thì coi như 0', '# cnt[x] là số lần x xuất hiện; len(cnt) là số giá trị khác nhau']),
    p('Ví dụ với a = 5 3 5 7 3 5 9 3, sau vòng lặp: cnt = {5: 3, 3: 3, 7: 1, 9: 1}.', { align: J, before: 80 }),
    h2('2. Tập hợp (set): khử trùng và tra cứu nhanh'),
    ...code(['s = set(a)          # các giá trị khác nhau của a', 'len(s)              # số giá trị khác nhau', 'x in s              # kiểm tra có mặt: rất nhanh', 'set(a) & set(b)     # các giá trị có ở CẢ a và b (giao)']),
    h2('3. Vì sao nhanh hơn? (độ phức tạp)'),
    tbl([3700, 2700, 3238], [
      ['Thao tác (N = 10^5 phần tử)', 'Dùng list', 'Dùng dict / set'],
      ['Kiểm tra "x có trong dãy không"', 'duyệt N phần tử', 'gần như 1 bước'],
      ['Đếm mọi giá trị', 'khoảng N × N = 10^10', 'khoảng N = 10^5'],
      ['Kết quả trên web chấm', 'QUÁ THỜI GIAN Subtask 2', 'Đúng và nhanh cả 2 Subtask'],
    ]),
    h2('4. Mở rộng: đếm cặp có tổng bằng S'),
    p('Duyệt dãy từ trái sang phải. Khi gặp A[j], số cặp (i, j) mới tạo được bằng số lần giá trị S − A[j] đã xuất hiện TRƯỚC đó, tức cnt[S − A[j]]. Cộng dồn lại rồi mới đưa A[j] vào cnt. Đây là ý tưởng của Câu 2 trong đề luyện tập số 14.', { align: J }),

    ...ch('CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 2 BÀI KHỞI ĐỘNG'),
    h2('Bài khởi động 1: ĐẾM SỐ LẦN XUẤT HIỆN (DEMSO)'),
    p('Đề bài: Cho N (N ≤ 10^5) và dãy N số nguyên (|A[i]| ≤ 10^9). Với mỗi giá trị khác nhau, in một dòng gồm giá trị đó và số lần xuất hiện, theo thứ tự giá trị TĂNG DẦN.', { align: J }),
    p('Ví dụ: vào "7" và "4 2 4 1 2 4 9" → ra 4 dòng: "1 1", "2 2", "4 3", "9 1".', { align: J }),
    ...code(['import sys', 'data = sys.stdin.read().split()', 'n = int(data[0])', 'cnt = {}', 'for x in data[1:n + 1]:', '    x = int(x)', '    # TODO: tăng cnt[x] lên 1', 'for v in sorted(cnt):', "    print(v, cnt[v])"]),
    h2('Bài khởi động 2: SỐ CHUNG CỦA HAI DÃY (CHUNGSO)'),
    p('Đề bài: Cho dãy A gồm N số và dãy B gồm M số (N, M ≤ 10^5). Đếm số giá trị KHÁC NHAU có mặt ở cả hai dãy.', { align: J }),
    p('Ví dụ: vào "5 4", "1 2 2 3 5", "2 3 3 4" → ra "2" (các giá trị chung là 2 và 3).', { align: J }),
    p('Gợi ý: chuyển hai dãy thành hai set rồi lấy giao.', { align: J }),

    ...ch('CHƯƠNG IV', 'HỆ THỐNG KIỂM THỬ TỰ ĐỘNG'),
    p('Vào trang Chấm Code → chọn TUAN 14 → Loại bài "Tự học" → chọn TEST_DEMSO hoặc TEST_CHUNGSO → dán code → Chạy Code. Đạt 100% thì sang mục Luyện Đề làm Đề số 14. Mỗi bài khởi động có 10 test:', { align: J }),
    tbl([1800, 7838], [
      ['Bộ test', 'Ý nghĩa'],
      ['Test01', 'Ví dụ trong tài liệu'],
      ['Test02 – 04', 'Dữ liệu rất nhỏ, có trường hợp hai dãy không có số chung'],
      ['Test05 – 10', 'Dữ liệu lớn tới 10^5 phần tử, có số âm, số tới 10^9, nhiều số trùng (kiểm tra tốc độ)'],
    ]),
  ];
  const footer = new Footer({ children: [p([r('Tài liệu bồi dưỡng học sinh giỏi năm học 2026-2027 — Trang ', { size: 18, color: '808080' }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '808080', font: 'Arial' }), r(' / ', { size: 18, color: '808080' }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '808080', font: 'Arial' })], { align: AlignmentType.RIGHT })] });
  return new Document({ numbering, sections: [{ properties: { page }, footers: { default: footer }, children }] });
}

(async () => {
  fs.writeFileSync('de_thi_hsg_lam_dong_1_2_(14).docx', await Packer.toBuffer(deThi()));
  fs.writeFileSync('hs-hsg-huong-dan-tu-hoc-tuan-14.docx', await Packer.toBuffer(tuHoc()));
  console.log('ok');
})();
