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

// ======================= ĐỀ THI SỐ 13 =======================
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

  const children = [
    table([W / 2, W / 2], [[
      [p(r('TRƯỜNG THPT TRẦN PHÚ – ĐÀ LẠT', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('ĐỘI TUYỂN HSG TIN HỌC', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('ĐỀ LUYỆN TẬP SỐ 13', { b: true, size: 23 }), { align: C, after: 0 })],
      [p(r('KỲ THI CHỌN HSG CẤP TỈNH', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('LỚP 12 THPT (ĐỀ LUYỆN TẬP)', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('Môn: TIN HỌC (Lập trình Python)', { i: true, size: 23 }), { align: C, after: 0 }),
       p(r('Thời gian: 90 phút (không kể phát đề)', { i: true, size: 23 }), { align: C, after: 0 })],
    ]], { noBorder: true }),
    p('', { rule: true, after: 200 }),
    p(r('CHUYÊN ĐỀ: MẢNG CỘNG DỒN (TỔNG TIỀN TỐ)', { b: true }), { align: C, after: 160 }),
    p(r('DANH MỤC CÁC BÀI THI', { b: true }), { align: C, after: 120 }),
    table([900, 2138, 1900, 1900, 1900, 900], [
      ['Câu', 'Tên bài', 'File mã nguồn', 'File input', 'File output', 'Điểm'].map(t => p(r(t, { b: true }), { align: C, after: 0 })),
      [p(r('Câu 1', { b: true, size: 24 }), { align: C, after: 0 }), p(r('Lượng mưa Đà Lạt', { size: 22 }), { after: 0 }), p(r('LUONGMUA.PY', { size: 20 }), { align: C, after: 0 }), p(r('LUONGMUA.INP', { size: 20 }), { align: C, after: 0 }), p(r('LUONGMUA.OUT', { size: 20 }), { align: C, after: 0 }), p(r('10.0', { b: true }), { align: C, after: 0 })],
      [p(r('Câu 2', { b: true, size: 24 }), { align: C, after: 0 }), p(r('Đóng thùng dâu tây', { size: 22 }), { after: 0 }), p(r('THUNGDAU.PY', { size: 20 }), { align: C, after: 0 }), p(r('THUNGDAU.INP', { size: 20 }), { align: C, after: 0 }), p(r('THUNGDAU.OUT', { size: 20 }), { align: C, after: 0 }), p(r('10.0', { b: true }), { align: C, after: 0 })],
    ], { head: 'EDEDED' }),

    // ---------------- CÂU 1 ----------------
    head('Câu 1 (10.0 điểm): LƯỢNG MƯA ĐÀ LẠT (LUONGMUA)'),
    p('Trạm khí tượng Đà Lạt ghi lại lượng mưa (đơn vị mm) của N ngày liên tiếp, đánh số từ ngày 1 đến ngày N. Ngày thứ i có lượng mưa là A[i].', { align: J }),
    p('Để phục vụ công tác phòng chống sạt lở, cán bộ trạm cần trả lời Q câu hỏi. Mỗi câu hỏi gồm hai số L và R (1 ≤ L ≤ R ≤ N), yêu cầu tính tổng lượng mưa từ ngày L đến ngày R:', { align: J }),
    p('A[L] + A[L+1] + ... + A[R]', { align: C }),
    lbl('Yêu cầu: ', 'Hãy trả lời lần lượt Q câu hỏi.'),
    lbl('Dữ liệu vào: Đọc từ tệp LUONGMUA.INP gồm:'),
    p('Dòng 1: Hai số nguyên dương N và Q.', { bullet: true }),
    p('Dòng 2: N số nguyên A[1], A[2], ..., A[N] (0 ≤ A[i] ≤ 10^9), cách nhau một khoảng trắng.', { bullet: true }),
    p('Q dòng tiếp theo: Mỗi dòng gồm hai số nguyên L và R (1 ≤ L ≤ R ≤ N).', { bullet: true }),
    lbl('Dữ liệu ra: Ghi ra tệp LUONGMUA.OUT gồm:'),
    p('Q dòng, dòng thứ j ghi một số nguyên là câu trả lời cho câu hỏi thứ j.', { bullet: true }),
    lbl('Ví dụ:'),
    ex(['7 3', '12 0 35 8 0 20 5', '1 3', '4 7', '2 2'], ['47', '33', '0']),
    p([r('Giải thích: ', { b: true }), r('Ngày 1 đến ngày 3: 12 + 0 + 35 = 47. Ngày 4 đến ngày 7: 8 + 0 + 20 + 5 = 33. Ngày 2: 0.')], { align: J, before: 120 }),
    lbl('Ràng buộc Subtask:'),
    p('Subtask 1 (60% số điểm): N ≤ 10^3 và Q ≤ 10^3.', { bullet: true }),
    p('Subtask 2 (40% số điểm): N ≤ 10^5 và Q ≤ 10^5.', { bullet: true }),

    // ---------------- CÂU 2 ----------------
    head('Câu 2 (10.0 điểm): ĐÓNG THÙNG DÂU TÂY (THUNGDAU)'),
    p('Một hợp tác xã dâu tây ở Đà Lạt xếp N giỏ dâu thành một hàng, đánh số từ 1 đến N. Giỏ thứ i nặng A[i] gam.', { align: J }),
    p('Hợp tác xã muốn chọn ra một số giỏ ĐỨNG LIÊN TIẾP NHAU trên hàng (từ giỏ L đến giỏ R, 1 ≤ L ≤ R ≤ N) để đóng vào các thùng, mỗi thùng chứa đúng K gam. Cách chọn chỉ hợp lệ khi tổng khối lượng các giỏ được chọn chia hết cho K (đóng vừa đủ, không thừa gam nào).', { align: J }),
    lbl('Yêu cầu: ', 'Hãy đếm số cách chọn đoạn giỏ liên tiếp hợp lệ. Hai cách chọn được coi là khác nhau nếu khác giỏ đầu L hoặc khác giỏ cuối R.'),
    lbl('Dữ liệu vào: Đọc từ tệp THUNGDAU.INP gồm:'),
    p('Dòng 1: Hai số nguyên dương N và K (1 ≤ K ≤ 10^9).', { bullet: true }),
    p('Dòng 2: N số nguyên dương A[1], A[2], ..., A[N] (1 ≤ A[i] ≤ 10^9).', { bullet: true }),
    lbl('Dữ liệu ra: Ghi ra tệp THUNGDAU.OUT gồm:'),
    p('Một số nguyên duy nhất là số cách chọn hợp lệ.', { bullet: true }),
    lbl('Ví dụ:'),
    ex(['5 3', '1 2 3 4 5'], ['7']),
    p([r('Giải thích: ', { b: true }), r('Có 7 đoạn có tổng chia hết cho 3: [1, 2] = 3; [3] = 3; [1, 2, 3] = 6; [2, 3, 4] = 9; [4, 5] = 9; [3, 4, 5] = 12; [1, 2, 3, 4, 5] = 15.')], { align: J, before: 120 }),
    lbl('Ràng buộc Subtask:'),
    p('Subtask 1 (50% số điểm): N ≤ 10^3.', { bullet: true }),
    p('Subtask 2 (50% số điểm): N ≤ 10^5.', { bullet: true }),

    p(r('------------------ HẾT ------------------', { b: true }), { align: C, before: 300 }),
    p(r('Đề luyện tập do tổ Tin học – Trường THPT Trần Phú biên soạn, phục vụ bồi dưỡng đội tuyển.', { i: true, size: 22 }), { align: C }),
  ];
  return new Document({ numbering, sections: [{ properties: { page }, children }] });
}

// ======================= TÀI LIỆU TỰ HỌC TUẦN 13 =======================
function tuHoc() {
  const { r, p, table } = makeHelpers('Arial', 22);
  const J = AlignmentType.JUSTIFIED, C = AlignmentType.CENTER;
  const blue = '1F4E79', red = 'C00000';
  const code = (lines) => lines.map((l, i) => p(r(l || ' ', { mono: true, size: 20 }), { after: 0, line: 240, shade: 'F2F2F2', indent: 120 }));
  const ch = (no, t) => [p(r(no, { b: true, color: red, size: 22 }), { before: 200, after: 0, keepNext: true }), p(r(t, { b: true, color: blue, size: 28 }), { after: 100, line: 300, keepNext: true })];
  const h2 = (t) => p(r(t, { b: true, color: blue, size: 24 }), { before: 160, after: 80, keepNext: true });
  const tbl = (widths, rows) => table(widths, rows.map((row, ri) => row.map(c => (Array.isArray(c) ? c : [c]).map(x => typeof x === 'string' ? p(r(x, { b: ri === 0, mono: ri > 0 && /^[-–\d ,.]+$/.test(x), size: 20 }), { after: 0 }) : x))), { head: 'DCE6F1' });

  const children = [
    p(r('BỘ TÀI LIỆU CHUYÊN ĐỀ ÔN LUYỆN HỌC SINH GIỎI TIN HỌC', { b: true, size: 20 }), { after: 0 }),
    p(r('NĂM HỌC 2026-2027', { b: true, size: 20 }), { rule: true, after: 240 }),
    p(r('TÀI LIỆU HƯỚNG DẪN TỰ HỌC', { b: true, color: blue, size: 32 }), { line: 380, after: 0 }),
    p(r('LẬP TRÌNH PYTHON CHUYÊN SÂU', { b: true, color: blue, size: 32 }), { line: 380, after: 0 }),
    p(r('BUỔI 13: MẢNG CỘNG DỒN (TỔNG TIỀN TỐ) – TÍNH TỔNG ĐOẠN THẬT NHANH', { b: true, color: blue, size: 32 }), { line: 380, after: 60 }),
    p(r('(Phiên bản Điện tử — Tự học dành cho Học sinh Đội tuyển)', { i: true, color: '808080', size: 20 }), { after: 200 }),
    p(r('📖 LỜI NÓI ĐẦU & NGUYÊN TẮC TỰ HỌC', { b: true, color: blue }), { keepNext: true }),
    p('Buổi này giúp em giải quyết một tình huống rất hay gặp trong đề thi HSG: phải tính tổng của rất nhiều đoạn con trong một dãy số. Cách cộng lại từng đoạn chỉ đủ nhanh với dữ liệu nhỏ (Subtask 1). Kỹ thuật mảng cộng dồn giúp mỗi câu hỏi được trả lời chỉ bằng MỘT phép trừ, đủ nhanh để ăn trọn Subtask 2.', { align: J }),
    p([r('Yêu cầu: ', { b: true }), r('Đọc kỹ lý thuyết, tự viết code 2 bài khởi động (không sao chép) và kiểm thử trên web cho tới khi đạt 100% test. Sau đó làm Đề luyện tập số 13 ở mục Luyện Đề.')], { align: J }),

    ...ch('CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'),
    p('Sau buổi học, em cần:', { keepNext: true }),
    p('Xây dựng được mảng cộng dồn S từ dãy A trong một vòng lặp.', { bullet: true }),
    p('Tính tổng đoạn [L, R] bằng công thức S[R] − S[L−1].', { bullet: true }),
    p('Hiểu vì sao cách cộng từng đoạn bị QUÁ THỜI GIAN ở Subtask 2, còn mảng cộng dồn thì không.', { bullet: true }),
    p('Biết mở rộng: đếm số đoạn có tổng chia hết cho K bằng cách đếm số dư của S.', { bullet: true }),

    ...ch('CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'),
    h2('1. Mảng cộng dồn là gì?'),
    p('Cho dãy A[1..N]. Mảng cộng dồn S có N + 1 phần tử, trong đó S[0] = 0 và S[i] là tổng i phần tử đầu tiên:', { align: J }),
    p(r('S[i] = S[i−1] + A[i]        (với i = 1, 2, ..., N)', { b: true, mono: true }), { align: C }),
    p('Ví dụ với A = 12, 0, 35, 8, 0, 20, 5:', { keepNext: true }),
    tbl([1302, 1042, 1042, 1042, 1042, 1042, 1042, 1042, 1042], [
      ['i', '0', '1', '2', '3', '4', '5', '6', '7'],
      ['A[i]', '–', '12', '0', '35', '8', '0', '20', '5'],
      ['S[i]', '0', '12', '12', '47', '55', '55', '75', '80'],
    ]),
    h2('2. Tính tổng đoạn bằng một phép trừ'),
    p('Tổng các phần tử từ vị trí L đến R bằng tổng R phần tử đầu trừ đi tổng L−1 phần tử đầu:', { align: J }),
    p(r('A[L] + A[L+1] + ... + A[R] = S[R] − S[L−1]', { b: true, mono: true }), { align: C }),
    p('Ví dụ: tổng từ ngày 4 đến ngày 7 = S[7] − S[3] = 80 − 47 = 33.', { align: J }),
    h2('3. Vì sao nhanh hơn? (độ phức tạp)'),
    tbl([3200, 3200, 3238], [
      ['Cách làm', 'Số phép tính (N = Q = 10^5)', 'Kết quả trên web chấm'],
      ['Mỗi câu hỏi cộng lại từ L đến R', 'khoảng N × Q = 10^10', 'QUÁ THỜI GIAN ở Subtask 2'],
      ['Mảng cộng dồn', 'khoảng N + Q = 2 × 10^5', 'Đúng và nhanh cả 2 Subtask'],
    ]),
    p('Lưu ý: dùng sum(A[L-1:R]) cho mỗi câu hỏi vẫn là cộng lại từng đoạn, chỉ nhanh hơn một chút nhưng vẫn quá thời gian với dữ liệu lớn.', { align: J, before: 120 }),
    h2('4. Mở rộng: đoạn có tổng chia hết cho K'),
    p('Đoạn [L, R] có tổng chia hết cho K khi và chỉ khi S[R] và S[L−1] có CÙNG số dư khi chia cho K. Vì vậy chỉ cần đếm xem mỗi số dư xuất hiện bao nhiêu lần trong S[0], S[1], ..., S[N]: nếu số dư r xuất hiện c lần thì có c × (c − 1) / 2 đoạn ứng với số dư đó. Đây là ý tưởng của Câu 2 trong đề luyện tập số 13.', { align: J }),

    ...ch('CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 2 BÀI KHỞI ĐỘNG'),
    h2('Cách đọc dữ liệu nhanh (dùng cho mọi bài)'),
    ...code(['import sys', 'data = sys.stdin.read().split()   # đọc toàn bộ dữ liệu một lần', 'n = int(data[0])', '# ... xử lý ...', 'print(...)']),
    h2('Bài khởi động 1: DÃY CỘNG DỒN (CONGDON)'),
    p('Đề bài: Cho N và dãy N số nguyên A[1..N] (|A[i]| ≤ 10^9, N ≤ 10^5). In ra N số S[1], S[2], ..., S[N] trên một dòng, cách nhau một khoảng trắng.', { align: J }),
    p('Ví dụ: vào "5" và "3 1 4 1 5" → ra "3 4 8 9 14".', { align: J }),
    ...code(['import sys', 'data = sys.stdin.read().split()', 'n = int(data[0])', 's = 0', 'ket_qua = []', 'for i in range(1, n + 1):', '    # TODO: cộng thêm phần tử thứ i vào s rồi lưu s vào ket_qua', '    pass', "print(' '.join(map(str, ket_qua)))"]),
    h2('Bài khởi động 2: TỔNG K NGÀY LIÊN TIẾP LỚN NHẤT (TONGKMAX)'),
    p('Đề bài: Cho N, K (1 ≤ K ≤ N ≤ 10^5) và dãy A[1..N] (có thể có số âm). Tìm tổng lớn nhất của K phần tử đứng liên tiếp.', { align: J }),
    p('Ví dụ: vào "7 3" và "2 -1 4 5 -3 6 1" → ra "8" (đoạn −1, 4, 5 hoặc đoạn 5, −3, 6).', { align: J }),
    p('Gợi ý: tổng đoạn [i, i+K−1] = S[i+K−1] − S[i−1]. Duyệt mọi i và lấy giá trị lớn nhất.', { align: J }),

    ...ch('CHƯƠNG IV', 'HỆ THỐNG KIỂM THỬ TỰ ĐỘNG'),
    p('Vào trang Chấm Code → chọn TUAN 13 → Loại bài "Tự học" → chọn TEST_CONGDON hoặc TEST_TONGKMAX → dán code → Chạy Code. Đạt 100% thì sang mục Luyện Đề làm Đề số 13. Mỗi bài khởi động có 10 test:', { align: J }),
    tbl([1800, 7838], [
      ['Bộ test', 'Ý nghĩa'],
      ['Test01', 'Ví dụ trong tài liệu'],
      ['Test02 – 04', 'Dữ liệu rất nhỏ: N = 1, K = 1, K = N'],
      ['Test05 – 10', 'Dữ liệu lớn tới 10^5 phần tử, có số âm và số tới 10^9 (kiểm tra tốc độ)'],
    ]),
  ];
  const footer = new Footer({ children: [p([r('Tài liệu bồi dưỡng học sinh giỏi năm học 2026-2027 — Trang ', { size: 18, color: '808080' }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '808080', font: 'Arial' }), r(' / ', { size: 18, color: '808080' }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '808080', font: 'Arial' })], { align: AlignmentType.RIGHT })] });
  return new Document({ numbering, sections: [{ properties: { page }, footers: { default: footer }, children }] });
}

(async () => {
  fs.writeFileSync('de_thi_hsg_lam_dong_1_2_(13).docx', await Packer.toBuffer(deThi()));
  fs.writeFileSync('hs-hsg-huong-dan-tu-hoc-tuan-13.docx', await Packer.toBuffer(tuHoc()));
  console.log('ok');
})();
