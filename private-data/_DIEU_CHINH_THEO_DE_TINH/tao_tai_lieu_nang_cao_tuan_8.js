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
      const ds = (Array.isArray(p1) ? p1 : [p1, p2]).map(x => `**TEST_${x}**`);
      const dsTxt = ds.length === 2 ? ds.join(' hoặc ') : ds.slice(0, -1).join(', ') + ' hoặc ' + ds[ds.length - 1];
      out.push(p(rich(`Vào trang **Chấm Code** (chế độ ${L.mode}) → chọn **TUAN ${week}** → Loại bài "Tự học" → chọn ${dsTxt} → dán code → Chạy Code.` +
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
const IO = (n) => ['import sys', `sys.stdin = open('${n}.INP', 'r')`, `sys.stdout = open('${n}.OUT', 'w')   # đọc/ghi tệp như khi thi`];
const NCY = (w) => ['p', `**Yêu cầu:** Đọc kỹ lý thuyết, tự viết code các bài khởi động và kiểm thử trên web tới khi đạt 100% test. Sau đó làm Đề luyện tập số ${w} ở mục Luyện Đề.`];
const CBY = ['p', '**Yêu cầu:** Đọc kỹ ví dụ, tự gõ lại code (không sao chép), làm các bài tập và kiểm thử trên web tới khi đạt 100% test.'];
const ASCII = ['tbl', [2400, 2400, 4838], [
  ['Ký tự', 'ord(ký tự)', 'Ghi chú'],
  ["'A' … 'Z'", '65 … 90', "Chữ hoa: vị trí trong bảng chữ cái = ord(c) − 65"],
  ["'a' … 'z'", '97 … 122', "Chữ thường: vị trí = ord(c) − 97"],
  ["'0' … '9'", '48 … 57', "Chữ số: giá trị = ord(c) − 48"],
]];
const DICH = ['code', ['def dich(c, k):', "    if 'A' <= c <= 'Z':", '        return chr((ord(c) - 65 + k) % 26 + 65)', "    if 'a' <= c <= 'z':", '        return chr((ord(c) - 97 + k) % 26 + 97)', '    return c                    # ký tự khác giữ nguyên']];
const DEM26 = ['code', ['dem = [0] * 26', 'for c in s.lower():', "    if 'a' <= c <= 'z':", '        dem[ord(c) - 97] += 1', 'for i in range(26):', '    if dem[i] > 0:', '        print(chr(97 + i), dem[i])']];
const B6 = [
  ['h2', 'Bài 1: DỊCH CHỮ CÁI (DICHCHU)'],
  ['p', 'Dòng 1 là số nguyên K (0 ≤ K ≤ 25), dòng 2 là xâu S (độ dài ≤ 10^5). Dịch mỗi chữ cái của S đi K vị trí vòng tròn (giữ nguyên hoa/thường), các ký tự khác giữ nguyên. Ví dụ: K = 3, "Hello, Da Lat!" → "Khoor, Gd Odw!".'],
  ['h2', 'Bài 2: ĐẾM CHỮ CÁI (DEMCHU)'],
  ['p', 'Cho một dòng xâu S. Không phân biệt hoa thường, in mỗi chữ cái có xuất hiện trên một dòng gồm chữ cái (viết thường) và số lần xuất hiện, theo thứ tự a → z. Nếu S không có chữ cái nào in −1. Ví dụ: "Da Lat mong mo" → a 2, d 1, g 1, l 1, m 2, n 1, o 2, t 1.'],
  ['h2', 'Bài 3: KIỂM TRA MẬT KHẨU (MATKHAU)'],
  ['p', 'Dòng 1 là Q, Q dòng sau mỗi dòng một mật khẩu (không có dấu cách). Mật khẩu MẠNH nếu dài ít nhất 8 ký tự và có đủ: chữ hoa, chữ thường, chữ số và ký tự đặc biệt (không phải chữ cái, chữ số). In YES hoặc NO cho từng mật khẩu. Ví dụ: DaLat@2026 → YES, abc12345 → NO, TranPhu#1 → YES.'],
];
const B8 = [
  ['h2', 'Bài 1: LỌC SỐ CHÍNH PHƯƠNG VÀ SỐ HOÀN HẢO (DANHSACHSO)'],
  ['p', 'Bóc tách các số nguyên trong xâu S. Dòng 1 ghi các số chính phương, dòng 2 ghi các số hoàn hảo (theo thứ tự xuất hiện). Dòng nào không có số thì ghi −1. Ví dụ: "abc4def16ghi6jkl28" → "4 16" và "6 28".'],
  ['h2', 'Bài 2: XÂU ĐỐI XỨNG DÀI NHẤT TRONG DÃY XÂU (DOIXUNGMAX)'],
  ['p', 'Dòng 1 là N, N dòng sau mỗi dòng một xâu. Tìm xâu đối xứng dài nhất (nhiều xâu cùng dài nhất thì lấy xâu xuất hiện trước). Dòng 1 ghi xâu đó, dòng 2 ghi độ dài. Không có xâu đối xứng nào thì ghi −1.'],
  ['h2', 'Bài 3: ĐỔI HỆ CƠ SỐ (DOICOSO)'],
  ['p', 'Dòng 1 là Q, Q dòng sau mỗi dòng gồm hai số n và b (0 ≤ n ≤ 10^18, 2 ≤ b ≤ 16). In biểu diễn của n trong hệ cơ số b, dùng các chữ số 0–9 và A–F. Ví dụ: "10 2" → 1010; "255 16" → FF; "0 2" → 0.'],
  ['h2', 'Bài 4: VỊ TRÍ ĐIỂM SO VỚI TAM GIÁC (VITRIDIEM)'],
  ['p', 'Một dòng gồm 8 số nguyên xA yA xB yB xC yC xM yM (A, B, C không thẳng hàng). In TRONG nếu M nằm bên trong tam giác, TREN CANH nếu M nằm trên cạnh (kể cả đỉnh), NGOAI nếu ở ngoài. Ví dụ: "0 0 5 0 0 5 1 1" → TRONG; "0 0 5 0 0 5 2 3" → TREN CANH.'],
];
const DOICOSO_TBL = ['tbl', [2000, 2400, 2400, 2838], [
  ['n', 'n // 2', 'n % 2 (chữ số)', 'Ghi chú'], ['10', '5', '0', 'chữ số cuối cùng'], ['5', '2', '1', ''], ['2', '1', '0', ''], ['1', '0', '1', 'dừng khi n = 0'],
]];
const CROSS = ['code', ['def cross(O, A, B):   # tích có hướng của OA và OB', '    return (A[0]-O[0]) * (B[1]-O[1]) - (A[1]-O[1]) * (B[0]-O[0])', 'd1 = cross(A, B, M); d2 = cross(B, C, M); d3 = cross(C, A, M)', '# M nằm TRONG tam giác  ⇔  d1, d2, d3 cùng dấu (cùng > 0 hoặc cùng < 0)', '# M nằm trên đường thẳng AB  ⇔  d1 == 0 (kiểm tra thêm M nằm giữa A và B)']];
const GUIDES = [
// ======================= TUẦN 6 – NÂNG CAO =======================
{ lv: 'NC', week: 6, title: 'XÂU KÝ TỰ – PHƯƠNG THỨC XỬ LÝ XÂU & MÃ KÝ TỰ (ord, chr)', blocks: [
  ['intro'],
  ['p', 'Đề thi HSG thường cho xâu lẫn chữ cái, chữ số, dấu câu và yêu cầu biến đổi từng ký tự. Ngoài các phương thức xâu quen thuộc, em cần biết mỗi ký tự có một MÃ SỐ (ord) để tính toán trên ký tự như trên số.'],
  NCY(6),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Dùng thành thạo các phương thức xâu: len, lower/upper, strip, split/join, replace, isdigit/isalpha.'],
  ['b', 'Dùng ord() và chr() để dịch ký tự vòng tròn (mã hóa Caesar), kể cả với khóa K rất lớn hoặc âm.'],
  ['b', 'Đếm tần suất chữ cái bằng mảng 26 phần tử; kiểm tra điều kiện trên từng ký tự.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'],
  ['h2', '1. Mã ký tự: ord() và chr()'],
  ['p', 'ord(c) cho mã số của ký tự c, chr(x) làm ngược lại. Ví dụ ord(\'A\') = 65, chr(66) = \'B\'.'],
  ASCII,
  ['h2', '2. Dịch vòng tròn (mã hóa Caesar)'],
  ['p', 'Đưa chữ cái về vị trí 0..25, cộng K, lấy dư cho 26 rồi đổi lại thành chữ. Phép % trong Python luôn cho kết quả không âm (ví dụ (−3) % 26 = 23) nên K âm hay K = 10^18 đều dùng được ngay, KHÔNG cần lặp K lần.'],
  DICH,
  ['p', 'Chữ số dịch tương tự với % 10 và mốc 48. **Liên hệ đề số 6:** Câu 2 (MAHOA) có K tới 10^18 — dịch từng bước một sẽ không bao giờ chạy xong.'],
  ['h2', '3. Đếm chữ cái bằng mảng 26 phần tử'],
  DEM26,
  ['ch', 'CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 3 BÀI KHỞI ĐỘNG'],
  ['code', [...IO('DICHCHU'), 'k = int(input())', 's = input()', '# TODO: dịch từng chữ cái bằng hàm dich(c, k) rồi in kết quả']],
  ...B6,
  ['test', ['DICHCHU', 'DEMCHU', 'MATKHAU'], null, 'K = 0, K = 25, xâu không có chữ cái, mật khẩu vừa đủ 8 ký tự', 'Xâu dài tới 10^5, tới 2 × 10^4 mật khẩu', 6],
]},
// ======================= TUẦN 6 – CƠ BẢN =======================
{ lv: 'CB', week: 6, title: 'XÂU KÝ TỰ – CÁC PHƯƠNG THỨC XỬ LÝ XÂU & MÃ KÝ TỰ', blocks: [
  ['intro'],
  ['p', 'Mỗi ký tự trên máy tính được lưu bằng một con số gọi là mã ký tự. Biết mã ký tự, em có thể "dịch" chữ cái như cộng trừ số — đó là cách làm mật mã Caesar mà người La Mã cổ đại từng dùng.'],
  CBY,
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Ôn các phương thức xâu: len, lower, upper, strip, split, join, replace.'],
  ['b', 'Dùng ord() và chr() để chuyển giữa ký tự và mã số.'],
  ['b', 'Đếm số lần xuất hiện của từng chữ cái.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Một số phương thức xâu'],
  ['tbl', [4000, 5638], [['Câu lệnh', 'Kết quả'], ["'Da Lat'.upper()", "'DA LAT'"], ["'  hoa  '.strip()", "'hoa'"], ["'a-b-c'.replace('-', '')", "'abc'"], ["'2026'.isdigit()", 'True'], ["len('Da Lat')", '6']]],
  ['h2', '2. Mã ký tự'],
  ASCII,
  ['p', 'Ví dụ: chữ \'D\' có mã 68, vị trí trong bảng chữ cái là 68 − 65 = 3. Dịch 3 vị trí: (3 + 3) % 26 = 6 → chr(6 + 65) = \'G\'. Dấu % giúp quay vòng: sau Z lại là A.'],
  DICH,
  ['h2', '3. Đếm chữ cái'],
  DEM26,
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ...B6,
  ['code', ['k = int(input())', 's = input()', '# Viết code bài 1...']],
  ['test', ['DICHCHU', 'DEMCHU', 'MATKHAU'], null, 'K = 0, K = 25, xâu không có chữ cái, mật khẩu vừa đủ 8 ký tự', 'Xâu dài tới 10^5, nhiều mật khẩu', 6],
]},
// ======================= TUẦN 8 – NÂNG CAO =======================
{ lv: 'NC', week: 8, title: 'TỔNG HỢP GIAI ĐOẠN 1 – SỐ HỌC, XÂU, HỆ CƠ SỐ & TỌA ĐỘ ĐIỂM NGUYÊN', blocks: [
  ['intro'],
  ['p', 'Buổi 8 khép lại Giai đoạn 1 (Dạng 1) và bổ sung hai kỹ năng hay gặp trong đề: đổi hệ cơ số và xét vị trí điểm nguyên so với tam giác.'],
  NCY(8),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Phối hợp bóc tách số trong xâu với các hàm kiểm tra: nguyên tố, chính phương, hoàn hảo, đối xứng.'],
  ['b', 'Đổi số từ hệ thập phân sang hệ cơ số b bằng phép chia lấy dư.'],
  ['b', 'Dùng tích có hướng (chỉ với số nguyên) để biết điểm nằm trong, trên cạnh hay ngoài tam giác.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'],
  ['h2', '1. Bộ hàm kiểm tra tính chất số'],
  ['tbl', [3000, 6638], [['Tính chất', 'Cách kiểm tra (x là số nguyên dương)'],
    ['Đối xứng', "str(x) == str(x)[::-1]"], ['Chính phương', 'r = math.isqrt(x); r * r == x'],
    ['Nguyên tố', 'x ≥ 2 và không có ước nào từ 2 đến √x'], ['Hoàn hảo', 'tổng các ước nhỏ hơn x (duyệt tới √x) bằng x']]],
  ['h2', '2. Đổi hệ cơ số: chia lấy dư liên tiếp'],
  ['p', 'Chia n cho b, ghi lại số dư; lấy thương chia tiếp tới khi bằng 0. Đọc các số dư theo thứ tự ngược lại. Ví dụ 10 sang hệ 2:'],
  DOICOSO_TBL,
  ['code', ["CS = '0123456789ABCDEF'", "kq = '' if n > 0 else '0'", 'while n > 0:', '    kq = CS[n % b] + kq', '    n //= b', "# Chiều ngược lại: int('FF', 16) = 255, int('1010', 2) = 10"]],
  ['h2', '3. Tọa độ điểm nguyên: tích có hướng'],
  ['p', 'Với ba điểm O, A, B: cross(O, A, B) > 0 nếu B nằm bên trái tia OA, < 0 nếu bên phải, = 0 nếu thẳng hàng. Điểm M nằm trong tam giác ABC khi M nằm cùng một phía với cả ba cạnh.'],
  CROSS,
  ['p', '**Vì sao chỉ dùng số nguyên?** Với tọa độ tới 10^9, tích có hướng tới khoảng 10^18. Số thực (float) chỉ chính xác khoảng 15–16 chữ số nên có thể kết luận sai với điểm nằm trên cạnh. Số nguyên Python thì luôn chính xác. Tránh phép chia "/" (như S = |...| / 2): so sánh 2S thay cho S. **Liên hệ đề số 8:** Câu 2 (TAMGIAC).'],
  ['ch', 'CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 4 BÀI KHỞI ĐỘNG'],
  ['code', [...IO('VITRIDIEM'), 'xA, yA, xB, yB, xC, yC, xM, yM = map(int, input().split())', 'A, B, C, M = (xA, yA), (xB, yB), (xC, yC), (xM, yM)', '# TODO: dùng cross như mục 3, in TRONG / TREN CANH / NGOAI']],
  ...B8,
  ['test', ['DANHSACHSO', 'DOIXUNGMAX', 'DOICOSO', 'VITRIDIEM'], null, 'Số 0, n = 0, điểm trùng đỉnh, điểm nằm trên cạnh', 'Xâu dài, n tới 10^18, tọa độ tới 10^9', 8],
]},
// ======================= TUẦN 8 – CƠ BẢN =======================
{ lv: 'CB', week: 8, title: 'TỔNG HỢP: SỐ HỌC, XÂU, HỆ NHỊ PHÂN & TỌA ĐỘ', blocks: [
  ['intro'],
  ['p', 'Buổi 8 ôn lại các kỹ năng đã học (bóc tách số, kiểm tra tính chất số, xâu đối xứng) và làm quen thêm hai nội dung gắn với môn Toán: viết số trong hệ nhị phân và xét vị trí của một điểm so với tam giác trên mặt phẳng tọa độ.'],
  CBY,
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Viết các hàm kiểm tra số chính phương, số hoàn hảo, số đối xứng.'],
  ['b', 'Đổi một số sang hệ nhị phân (hệ 2) và hệ cơ số khác.'],
  ['b', 'Kiểm tra một điểm nằm trong, trên cạnh hay ngoài tam giác.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Đổi số sang hệ nhị phân'],
  ['p', 'Chia liên tiếp cho 2 và ghi lại số dư, rồi đọc số dư từ dưới lên. Ví dụ 10 → 1010:'],
  DOICOSO_TBL,
  ['code', ['n, b = map(int, input().split())', "CS = '0123456789ABCDEF'", "kq = '' if n > 0 else '0'", 'while n > 0:', '    kq = CS[n % b] + kq', '    n = n // b', 'print(kq)']],
  ['h2', '2. Điểm và tam giác'],
  ['p', 'Biểu thức cross(O, A, B) = (xA − xO)(yB − yO) − (yA − yO)(xB − xO) cho biết B nằm bên trái (> 0), bên phải (< 0) hay thẳng hàng (= 0) với O, A. Điểm M nằm trong tam giác ABC nếu ba giá trị cross(A, B, M), cross(B, C, M), cross(C, A, M) cùng dấu. Chỉ dùng số nguyên, không chia.'],
  CROSS,
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ...B8,
  ['test', ['DANHSACHSO', 'DOIXUNGMAX', 'DOICOSO', 'VITRIDIEM'], null, 'Số 0, n = 0, điểm trùng đỉnh, điểm nằm trên cạnh', 'Dữ liệu lớn', 8],
]},
];
(async () => { const g = GUIDES.find(x => x.lv === 'NC' && x.week === 8); const { file, doc } = buildGuide(g.lv, g.week, g.title, g.blocks); fs.writeFileSync(file, await Packer.toBuffer(doc)); console.log('ok'); })();
