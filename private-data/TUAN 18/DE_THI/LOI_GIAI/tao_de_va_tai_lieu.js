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

// Bộ dựng tài liệu tự học: mỗi tuần mô tả bằng một mảng khối nội dung.
const LV = {
  NC: { head: 'BỘ TÀI LIỆU CHUYÊN ĐỀ ÔN LUYỆN HỌC SINH GIỎI TIN HỌC', sub: '(Phiên bản Điện tử — Tự học dành cho Học sinh Đội tuyển)',
        foot: 'Tài liệu bồi dưỡng học sinh giỏi năm học 2026-2027 — Trang ', file: w => `hs-hsg-huong-dan-tu-hoc-tuan-${w}.docx`, mode: 'Nâng Cao' },
  CB: { head: 'BỘ TÀI LIỆU CHUYÊN ĐỀ HỌC TẬP MÔN TIN HỌC', sub: '(Phiên bản Điện tử — Tự học dành cho Học sinh)',
        foot: 'Tài liệu tự học môn Tin học năm học 2026-2027 — Trang ', file: w => `hs-hs-huong-dan-tu-hoc-tuan-${w}.docx`, mode: 'Cơ Bản' },
};
function buildGuide(lv, week, title, blocks) {
  const L = LV[lv];
  const { r, p, table } = makeHelpers('Arial', 22);
  const J = AlignmentType.JUSTIFIED;
  const blue = '1F4E79', red = 'C00000';
  // **đậm** trong chuỗi
  const rich = (s) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(x => x.startsWith('**') ? r(x.slice(2, -2), { b: true }) : r(x));
  const out = [
    p(r(L.head, { b: true, size: 20 }), { after: 0 }),
    p(r('NĂM HỌC 2026-2027', { b: true, size: 20 }), { rule: true, after: 240 }),
    p(r('TÀI LIỆU HƯỚNG DẪN TỰ HỌC', { b: true, color: blue, size: 32 }), { line: 380, after: 0 }),
    p(r(lv === 'NC' ? 'LẬP TRÌNH PYTHON CHUYÊN SÂU' : 'LẬP TRÌNH PYTHON', { b: true, color: blue, size: 32 }), { line: 380, after: 0 }),
    p(r(`BUỔI ${week}: ${title}`, { b: true, color: blue, size: 32 }), { line: 380, after: 60 }),
    p(r(L.sub, { i: true, color: '808080', size: 20 }), { after: 200 }),
  ];
  for (const b of blocks) {
    const [t, ...a] = b;
    if (t === 'intro') out.push(p(r('📖 LỜI NÓI ĐẦU & NGUYÊN TẮC TỰ HỌC', { b: true, color: blue }), { keepNext: true }));
    else if (t === 'p') out.push(p(rich(a[0]), { align: J }));
    else if (t === 'b') out.push(p(rich(a[0]), { bullet: true }));
    else if (t === 'h2') out.push(p(r(a[0], { b: true, color: blue, size: 24 }), { before: 160, after: 80, keepNext: true }));
    else if (t === 'ch') out.push(p(r(a[0], { b: true, color: red, size: 22 }), { before: 200, after: 0, keepNext: true }), p(r(a[1], { b: true, color: blue, size: 28 }), { after: 100, line: 300, keepNext: true }));
    else if (t === 'code') a[0].forEach(l => out.push(p(r(l || ' ', { mono: true, size: 20 }), { after: 0, line: 240, shade: 'F2F2F2', indent: 120 })));
    else if (t === 'tbl') out.push(table(a[0], a[1].map((row, ri) => row.map(c => p(r(c, { b: ri === 0, size: 20 }), { after: 0 }))), { head: 'DCE6F1' }), p('', { after: 60 }));
    else if (t === 'test') {           // chương kiểm thử dùng chung
      out.push(p(r('CHƯƠNG IV', { b: true, color: red, size: 22 }), { before: 200, after: 0, keepNext: true }), p(r('HỆ THỐNG KIỂM THỬ TỰ ĐỘNG', { b: true, color: blue, size: 28 }), { after: 100, line: 300, keepNext: true }));
      const [p1, p2, bien, lon, deSo] = a;
      out.push(p(rich(`Vào trang **Chấm Code** (chế độ ${L.mode}) → chọn **TUAN ${week}** → Loại bài "Tự học" → chọn **TEST_${p1}** hoặc **TEST_${p2}** → dán code → Chạy Code.` +
        (lv === 'NC' ? ` Đạt 100% thì sang mục Luyện Đề làm Đề số ${deSo}.` : ' Sửa code tới khi đạt 100% test.') + ' Mỗi bài có 10 test:'), { align: J }));
      out.push(table([1800, 7838], [['Bộ test', 'Ý nghĩa'], ['Test01', 'Ví dụ trong tài liệu'], ['Test02 – 04', bien], ['Test05 – 10', lon]].map((row, ri) => row.map(c => p(r(c, { b: ri === 0, size: 20 }), { after: 0 }))), { head: 'DCE6F1' }));
      if (lv === 'CB') out.push(p(rich('**Mẹo:** chạy được ví dụ chưa đủ — hãy tự nghĩ thêm trường hợp đặc biệt (dữ liệu rỗng, chỉ 1 phần tử, số rất lớn) trước khi nộp.'), { align: J, before: 120 }));
    }
    else throw new Error('khối lạ: ' + t);
  }
  const g = { size: 18, color: '808080' };
  const footer = new Footer({ children: [p([r(L.foot, g), new TextRun({ children: [PageNumber.CURRENT], ...g, font: 'Arial' }), r(' / ', g), new TextRun({ children: [PageNumber.TOTAL_PAGES], ...g, font: 'Arial' })], { align: AlignmentType.RIGHT })] });
  return { file: L.file(week), doc: new Document({ numbering, sections: [{ properties: { page }, footers: { default: footer }, children: out }] }) };
}
const GUIDES = [
{ lv: 'NC', week: 18, title: 'XỬ LÝ XÂU KÝ TỰ – TÁCH TỪ, ĐẾM TẦN SUẤT & ĐẾM CẶP MỘT LẦN DUYỆT', blocks: [
  ['intro'],
  ['p', 'Bài xâu trong đề HSG thường yêu cầu tách từ, thống kê từ và đếm nhanh trên xâu rất dài. Buổi này tổng hợp các kỹ năng đó.'],
  ['p', '**Yêu cầu:** Đọc kỹ lý thuyết, tự viết code 2 bài khởi động và kiểm thử trên web tới khi đạt 100% test. Sau đó làm Đề luyện tập số 18 ở mục Luyện Đề.'],
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Tách từ khi dấu câu và khoảng trắng lẫn lộn; đếm tần suất từ bằng dict.'],
  ['b', 'Đếm cặp (i < j) trên xâu dài 10^6 chỉ với một lần duyệt.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'],
  ['h2', '1. Các hàm xâu hay dùng'],
  ['tbl', [3600, 6038], [
    ['Câu lệnh', 'Ý nghĩa'],
    ["s.split()", 'Tách theo khoảng trắng, tự bỏ khoảng trắng thừa ở đầu, cuối, giữa'],
    ["' '.join(ds)", 'Ghép danh sách từ, cách nhau đúng một dấu cách'],
    ["'A' <= c <= 'Z'", 'c là chữ cái in hoa (chỉ bảng chữ cái tiếng Anh)'],
  ]],
  ['h2', '2. Tách từ khi có dấu câu'],
  ['p', 'Duyệt từng ký tự: chữ cái/chữ số thì ghép vào từ đang đọc, gặp ký tự khác thì kết thúc từ. Thêm một dấu cách vào cuối xâu để không bỏ sót từ cuối cùng.'],
  ['code', ['import sys', "sys.stdin = open('TUKHOA.INP', 'r')", "sys.stdout = open('TUKHOA.OUT', 'w')   # đọc/ghi tệp như khi thi", 's = input()', 'tu = []; cur = []', "for c in s + ' ':", '    if c.isascii() and c.isalnum():', '        cur.append(c.lower())', '    elif cur:', "        tu.append(''.join(cur)); cur = []", 'dem = {}', 'for w in tu:', '    dem[w] = dem.get(w, 0) + 1', 'best = min(dem, key=lambda w: (-dem[w], w))   # nhiều nhất, hòa thì nhỏ nhất']],
  ['p', 'Khóa (−dem[w], w): số lần lớn hơn đứng trước, cùng số lần thì từ nhỏ hơn đứng trước. Không dùng tu.count(w) cho từng từ vì rất chậm.'],
  ['h2', '3. Đếm cặp (i < j) bằng một lần duyệt'],
  ['p', 'Đếm cặp X đứng trước Y: duyệt từ trái sang, giữ biến cx = số chữ X đã gặp. Gặp chữ Y thì mọi chữ X phía trước đều ghép được với nó, nên cộng cx vào đáp án. Phải cộng TRƯỚC rồi mới tăng cx để đúng cả khi X trùng Y.'],
  ['tbl', [1300, 1300, 2200, 4838], [
    ['i', 'S[i]', 'cx (số D đã gặp)', 'Đáp án (X = D, Y = V)'],
    ['1', 'D', '1', '0'], ['2', 'V', '1', '0 + 1 = 1'], ['3, 4', 'D, D', '3', '1'], ['5', 'V', '3', '1 + 3 = 4'], ['6', 'V', '3', '4 + 3 = 7'],
  ]],
  ['code', ['import sys', "sys.stdin = open('DENLONG.INP', 'r')", "sys.stdout = open('DENLONG.OUT', 'w')   # đọc/ghi tệp như khi thi", 's = input().strip()', 'x, y = input().split()', 'cx = 0; dap_an = 0', 'for c in s:', '    if c == y:', '        dap_an += cx', '    if c == x:', '        cx += 1', 'print(dap_an)']],
  ['p', 'Chỉ cần 10^6 bước thay vì khoảng 5 × 10^11 bước của hai vòng for. **Liên hệ đề số 18:** Câu 1 = tách từ + dict; Câu 2 = đếm cặp một lần duyệt.'],
  ['ch', 'CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 2 BÀI KHỞI ĐỘNG'],
  ['h2', 'Bài khởi động 1: PHÂN LOẠI KÝ TỰ (DEMKYTU)'],
  ['p', 'Đề bài: Cho một dòng xâu S (độ dài ≤ 10^5). In trên một dòng 5 số: số chữ in hoa, số chữ thường, số chữ số, số dấu cách và số ký tự còn lại.'],
  ['p', 'Ví dụ: vào "Da Lat 2026, mua hoa!" → ra "2 9 4 4 2".'],
  ['h2', 'Bài khởi động 2: ĐẢO THỨ TỰ TỪ (DAOTU)'],
  ['p', 'Đề bài: Cho một dòng gồm các từ cách nhau bởi một hoặc nhiều dấu cách (có thể thừa dấu cách ở đầu, cuối). In các từ theo thứ tự ngược lại, cách nhau đúng một dấu cách.'],
  ['p', 'Ví dụ: vào "  Da   Lat  mong mo " → ra "mo mong Lat Da". Gợi ý: split(), đảo ngược danh sách bằng [::-1], ghép bằng join.'],
  ['test', 'DEMKYTU', 'DAOTU', 'Xâu 1 ký tự, toàn chữ số, toàn dấu câu, nhiều dấu cách liền nhau', 'Xâu dài tới 10^5 ký tự', 18],
]},
{ lv: 'CB', week: 18, title: 'XỬ LÝ XÂU KÝ TỰ – PHÂN LOẠI KÝ TỰ, TÁCH VÀ ĐẾM TỪ', blocks: [
  ['intro'],
  ['p', 'Xâu ký tự có mặt ở khắp nơi: tên học sinh, tin nhắn, bình luận trên mạng... Buổi này ôn lại và nâng cao kỹ năng xử lý xâu: nhận biết từng loại ký tự, tách câu thành các từ và đếm.'],
  ['p', '**Yêu cầu:** Đọc kỹ ví dụ, tự gõ lại code (không sao chép), làm 2 bài tập và kiểm thử trên web tới khi đạt 100% test.'],
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Duyệt từng ký tự của xâu và phân loại ký tự.'],
  ['b', 'Dùng split() và join() để tách, ghép và chuẩn hóa khoảng trắng.'],
  ['b', 'Đếm số lần xuất hiện của từng từ.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Duyệt và phân loại ký tự'],
  ['code', ['s = input()', 'hoa = thuong = so = cach = khac = 0', 'for c in s:', "    if 'A' <= c <= 'Z':", '        hoa += 1', "    elif 'a' <= c <= 'z':", '        thuong += 1', "    elif '0' <= c <= '9':", '        so += 1', "    elif c == ' ':", '        cach += 1', '    else:', '        khac += 1', 'print(hoa, thuong, so, cach, khac)']],
  ['p', 'Ví dụ "Da Lat 2026, mua hoa!" có 2 chữ hoa (D, L), 9 chữ thường, 4 chữ số, 4 dấu cách và 2 ký tự khác (dấu phẩy, dấu chấm than).'],
  ['h2', '2. Tách và ghép từ'],
  ['tbl', [4400, 5238], [
    ['Câu lệnh', 'Kết quả'],
    ["'  Da   Lat  mong mo '.split()", "['Da', 'Lat', 'mong', 'mo']"],
    ["ds[::-1]", "['mo', 'mong', 'Lat', 'Da']  (đảo ngược)"],
    ["' '.join(['mo', 'mong'])", "'mo mong'"],
    ["'DA Lat'.lower()", "'da lat'"],
  ]],
  ['p', 'split() không có tham số sẽ tự bỏ mọi khoảng trắng thừa, nên rất tiện để chuẩn hóa xâu.'],
  ['h2', '3. Đếm số lần xuất hiện của từng từ'],
  ['code', ["tu = 'da lat da lat hoa da'.split()", 'dem = {}', 'for w in tu:', '    dem[w] = dem.get(w, 0) + 1', "print(dem)        # {'da': 3, 'lat': 2, 'hoa': 1}"]],
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ['h2', 'Bài 1: PHÂN LOẠI KÝ TỰ (DEMKYTU)'],
  ['p', 'Nhập một dòng xâu S. In trên một dòng 5 số: số chữ in hoa, chữ thường, chữ số, dấu cách và ký tự còn lại. Ví dụ: "Da Lat 2026, mua hoa!" → "2 9 4 4 2".'],
  ['h2', 'Bài 2: ĐẢO THỨ TỰ TỪ (DAOTU)'],
  ['p', 'Nhập một dòng gồm các từ (có thể thừa dấu cách). In các từ theo thứ tự ngược lại, cách nhau đúng một dấu cách. Ví dụ: "  Da   Lat  mong mo " → "mo mong Lat Da".'],
  ['code', ['s = input()', '# Viết code: tách từ, đảo ngược, ghép lại rồi in']],
  ['test', 'DEMKYTU', 'DAOTU', 'Xâu 1 ký tự, toàn chữ số, toàn dấu câu, nhiều dấu cách liền nhau', 'Xâu dài tới 10^5 ký tự', 18],
]},
];


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
       p(r('ĐỀ LUYỆN TẬP SỐ 18', { b: true, size: 23 }), { align: C, after: 0 })],
      [p(r('KỲ THI CHỌN HSG CẤP TỈNH', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('LỚP 12 THPT (ĐỀ LUYỆN TẬP)', { b: true, size: 23 }), { align: C, after: 0 }),
       p(r('Môn: TIN HỌC (Lập trình Python)', { i: true, size: 23 }), { align: C, after: 0 }),
       p(r('Thời gian: 90 phút (không kể phát đề)', { i: true, size: 23 }), { align: C, after: 0 })],
    ]], { noBorder: true }),
    p('', { rule: true, after: 200 }),
    p(r('CHUYÊN ĐỀ: XỬ LÝ XÂU KÝ TỰ', { b: true }), { align: C, after: 160 }),
    p(r('DANH MỤC CÁC BÀI THI', { b: true }), { align: C, after: 120 }),
    table([900, 2138, 1900, 1900, 1900, 900], [
      ['Câu', 'Tên bài', 'File mã nguồn', 'File input', 'File output', 'Điểm'].map(t => p(r(t, { b: true }), { align: C, after: 0 })),
      row('Câu 1', 'Từ khóa du lịch', 'TUKHOA'),
      row('Câu 2', 'Dây đèn lồng phố đêm', 'DENLONG'),
    ], { head: 'EDEDED' }),

    // ---------------- CÂU 1 ----------------
    head('Câu 1 (10.0 điểm): TỪ KHÓA DU LỊCH (TUKHOA)'),
    p('Sở Du lịch Lâm Đồng thu thập một đoạn bình luận của du khách về Đà Lạt (chỉ gồm chữ cái tiếng Anh không dấu, chữ số, dấu cách và các dấu câu). Một TỪ là một dãy liên tiếp dài nhất gồm các chữ cái hoặc chữ số; mọi ký tự khác đều là ký tự phân cách. Không phân biệt chữ hoa và chữ thường: "Lat", "LAT" và "lat" là cùng một từ.', { align: J }),
    lbl('Yêu cầu: ', 'Hãy đếm tổng số từ, số từ khác nhau và tìm từ xuất hiện nhiều nhất. Nếu có nhiều từ cùng xuất hiện nhiều nhất, chọn từ nhỏ nhất theo thứ tự từ điển.'),
    lbl('Dữ liệu vào: Đọc từ tệp TUKHOA.INP gồm:'),
    p('Một dòng duy nhất là đoạn bình luận S.', { bullet: true }),
    lbl('Dữ liệu ra: Ghi ra tệp TUKHOA.OUT gồm:'),
    p('Dòng 1: Tổng số từ.', { bullet: true }),
    p('Dòng 2: Số từ khác nhau.', { bullet: true }),
    p('Dòng 3: Từ xuất hiện nhiều nhất (viết bằng chữ thường) và số lần xuất hiện. Nếu S không có từ nào thì dòng 3 ghi −1.', { bullet: true }),
    lbl('Ví dụ:'),
    ex(['Da Lat, da lat! Thanh pho ngan hoa - DA LAT mong mo.'], ['12', '8', 'da 3']),
    p([r('Giải thích: ', { b: true }), r('Có 12 từ, 8 từ khác nhau. "da" và "lat" cùng xuất hiện 3 lần; "da" nhỏ hơn theo thứ tự từ điển.')], { align: J, before: 120 }),
    lbl('Ràng buộc Subtask:'),
    p('Subtask 1 (50% số điểm): Độ dài S ≤ 1000.', { bullet: true }),
    p('Subtask 2 (50% số điểm): Độ dài S ≤ 10^5.', { bullet: true }),

    // ---------------- CÂU 2 ----------------
    head('Câu 2 (10.0 điểm): DÂY ĐÈN LỒNG PHỐ ĐÊM (DENLONG)'),
    p('Chợ đêm Đà Lạt treo một dây đèn lồng dài, mỗi chiếc đèn được ghi một chữ cái in hoa cho biết màu của nó. Dây đèn được mô tả bằng xâu S, ký tự thứ i là màu của đèn thứ i tính từ trái sang.', { align: J }),
    p('Ban tổ chức chọn hai màu X và Y. Một cặp đèn (i, j) được gọi là ĐẸP nếu i < j, đèn i có màu X và đèn j có màu Y (X và Y có thể trùng nhau).', { align: J }),
    lbl('Yêu cầu: ', 'Hãy đếm số cặp đèn đẹp.'),
    lbl('Dữ liệu vào: Đọc từ tệp DENLONG.INP gồm:'),
    p('Dòng 1: Xâu S chỉ gồm chữ cái in hoa.', { bullet: true }),
    p('Dòng 2: Hai chữ cái in hoa X và Y, cách nhau một dấu cách.', { bullet: true }),
    lbl('Dữ liệu ra: Ghi ra tệp DENLONG.OUT gồm:'),
    p('Một số nguyên duy nhất là số cặp đèn đẹp.', { bullet: true }),
    lbl('Ví dụ:'),
    ex(['DVDDVV', 'D V'], ['7']),
    p([r('Giải thích: ', { b: true }), r('Đèn D ở vị trí 1 ghép được với 3 đèn V phía sau nó; đèn D ở vị trí 3 và 4 mỗi đèn ghép được với 2 đèn V. Tổng 3 + 2 + 2 = 7.')], { align: J, before: 120 }),
    lbl('Ràng buộc Subtask:'),
    p('Subtask 1 (50% số điểm): Độ dài S ≤ 1000.', { bullet: true }),
    p('Subtask 2 (50% số điểm): Độ dài S ≤ 10^6.', { bullet: true }),

    p(r('------------------ HẾT ------------------', { b: true }), { align: C, before: 300 }),
    p(r('Đề luyện tập do tổ Tin học – Trường THPT Trần Phú biên soạn, phục vụ bồi dưỡng đội tuyển.', { i: true, size: 22 }), { align: C }),
  ];
  return new Document({ numbering, sections: [{ properties: { page }, children }] });
}

// ======================= TÀI LIỆU TỰ HỌC TUẦN 14 =======================
(async () => {
  fs.writeFileSync('de_thi_hsg_lam_dong_1_2_(18).docx', await Packer.toBuffer(deThi()));
  for (const g of GUIDES) { const { file, doc } = buildGuide(g.lv, g.week, g.title, g.blocks); fs.writeFileSync(file, await Packer.toBuffer(doc)); }
  console.log('ok');
})();
