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
const KHUNG_DOC = ['m, n = map(int, input().split())', 'a = []', 'for i in range(m):', '    a.append(list(map(int, input().split())))', '# a[i][j]: hàng i, cột j (đánh số từ 0)'];
const GUIDES = [
{ lv: 'NC', week: 17, title: 'MẢNG HAI CHIỀU (BẢNG SỐ) – DUYỆT Ô KỀ & CỘNG DỒN HAI CHIỀU', blocks: [
  ['intro'],
  ['p', 'Bản đồ, ruộng bậc thang, bảng điểm... đều là bảng số gồm nhiều hàng, nhiều cột. Buổi này học cách lưu bảng bằng danh sách lồng nhau, duyệt các ô kề cạnh và dùng mảng cộng dồn hai chiều để tính tổng một hình chữ nhật con chỉ bằng 4 phép tính.'],
  ['p', '**Yêu cầu:** Đọc kỹ lý thuyết, tự viết code các bài khởi động và kiểm thử trên web tới khi đạt 100% test. Sau đó làm Đề luyện tập số 17 ở mục Luyện Đề.'],
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Đọc bảng M × N vào danh sách lồng nhau a[i][j]; tính tổng hàng, tổng cột.'],
  ['b', 'Duyệt 4 ô kề của một ô và kiểm tra ô kề có nằm trong bảng hay không.'],
  ['b', 'Xây bảng cộng dồn S và tính tổng hình chữ nhật con trong O(1).'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'],
  ['h2', '1. Đọc bảng và duyệt 4 ô kề'],
  ['code', ['import sys', "sys.stdin = open('TONGHANG.INP', 'r')", "sys.stdout = open('TONGHANG.OUT', 'w')   # đọc/ghi tệp như khi thi", 'data = sys.stdin.read().split()', 'm, n = int(data[0]), int(data[1])', 'a = [[int(data[2 + i * n + j]) for j in range(n)] for i in range(m)]', 'dx = [-1, 1, 0, 0]; dy = [0, 0, -1, 1]   # trên, dưới, trái, phải', 'for i in range(m):', '    for j in range(n):', '        for k in range(4):', '            x, y = i + dx[k], j + dy[k]', '            if 0 <= x < m and 0 <= y < n:', '                pass  # a[x][y] là một ô kề của a[i][j]']],
  ['p', 'Điều kiện 0 ≤ x < m, 0 ≤ y < n giúp ô ở mép bảng không bị truy cập ra ngoài.'],
  ['h2', '2. Bảng cộng dồn hai chiều'],
  ['p', 'S[i][j] = tổng các ô từ (1, 1) đến (i, j). Thêm hàng 0 và cột 0 toàn số 0 để khỏi xét trường hợp mép:'],
  ['code', ['S = [[0] * (n + 1) for _ in range(m + 1)]', 'for i in range(1, m + 1):', '    for j in range(1, n + 1):', '        S[i][j] = S[i-1][j] + S[i][j-1] - S[i-1][j-1] + a[i-1][j-1]']],
  ['tbl', [1800, 3900, 3938], [
    ['', 'Bảng A (cột 1, 2, 3)', 'Bảng S (cột 1, 2, 3)'], ['hàng 1', '1   2   3', '1   3   6'], ['hàng 2', '4   5   6', '5   12   21'], ['hàng 3', '7   8   9', '12   27   45'],
  ]],
  ['h2', '3. Tổng hình chữ nhật (x1, y1) – (x2, y2)'],
  ['code', ['tong = S[x2][y2] - S[x1-1][y2] - S[x2][y1-1] + S[x1-1][y1-1]']],
  ['p', 'Lấy cả khối lớn, bỏ phần phía trên và phần bên trái; phần góc trên trái bị bỏ hai lần nên cộng lại một lần. Ví dụ tổng hàng 2–3, cột 2–3 của bảng A = 45 − 6 − 12 + 1 = 28 = 5 + 6 + 8 + 9.'],
  ['p', 'Với M = N = 500 và Q = 10^5 truy vấn, cộng từng ô cần tới 2,5 × 10^10 phép tính (quá thời gian), còn dùng bảng S chỉ cần khoảng 6 × 10^5.'],
  ['h2', '4. Đường chéo và xoay bảng vuông N × N'],
  ['p', 'Ô (i, j) nằm trên đường chéo chính khi i == j, trên đường chéo phụ khi i + j == N − 1. Xoay 90° theo chiều kim đồng hồ: hàng i của bảng mới là cột i của bảng cũ đọc từ dưới lên, tức b[i][j] = a[N−1−j][i].'],
  ['code', ['cheo_chinh = sum(a[i][i] for i in range(n))', 'cheo_phu = sum(a[i][n - 1 - i] for i in range(n))', 'b = [[a[n - 1 - j][i] for j in range(n)] for i in range(n)]   # xoay 90°']],
  ['p', '**Liên hệ đề số 17:** Câu 1 (DOICHE) dùng kỹ thuật duyệt 4 ô kề; Câu 2 (VUONDAU) dùng bảng cộng dồn hai chiều.'],
  ['ch', 'CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 3 BÀI KHỞI ĐỘNG'],
  ['h2', 'Bài khởi động 1: TỔNG HÀNG, TỔNG CỘT (TONGHANG)'],
  ['p', 'Đề bài: Dòng 1 gồm M, N (M, N ≤ 500); M dòng sau là bảng số nguyên (|A[i][j]| ≤ 10^9). Dòng 1 in M tổng hàng, dòng 2 in N tổng cột (cách nhau một khoảng trắng).'],
  ['p', 'Ví dụ: vào "2 3", "1 2 3", "4 5 6" → ra "6 15" và "5 7 9".'],
  ['h2', 'Bài khởi động 2: BẢNG CỘNG DỒN (BANGCD)'],
  ['p', 'Đề bài: Dữ liệu vào giống bài 1 (0 ≤ A[i][j] ≤ 10^4). In bảng S gồm M dòng, mỗi dòng N số S[i][1], ..., S[i][N].'],
  ['p', 'Ví dụ: bảng 1 2 3 / 4 5 6 / 7 8 9 → ra 1 3 6 / 5 12 21 / 12 27 45.'],
  ['code', ['# đọc bảng như Chương II, tạo S', 'for i in range(1, m + 1):', "    print(' '.join(map(str, S[i][1:])))"]],
  ['h2', 'Bài khởi động 3: ĐƯỜNG CHÉO VÀ XOAY BẢNG (XOAYBANG)'],
  ['p', 'Đề bài: Dòng 1 là N (N ≤ 500), N dòng sau là bảng vuông. Dòng 1 in tổng đường chéo chính và tổng đường chéo phụ; N dòng tiếp theo in bảng sau khi xoay 90° theo chiều kim đồng hồ. Ví dụ: 1 2 3 / 4 5 6 / 7 8 9 → "15 15", rồi 7 4 1 / 8 5 2 / 9 6 3.'],
  ['test', ['TONGHANG', 'BANGCD', 'XOAYBANG'], null, 'Bảng 1 × 1, bảng chỉ 1 hàng hoặc 1 cột, số âm', 'Bảng lớn tới 500 × 500 (đọc nhanh bằng sys.stdin.read)', 17],
]},
{ lv: 'CB', week: 17, title: 'MẢNG HAI CHIỀU – LÀM VIỆC VỚI BẢNG SỐ', blocks: [
  ['intro'],
  ['p', 'Bảng điểm cả lớp, sơ đồ chỗ ngồi, bản đồ ô vuông... đều là BẢNG SỐ có nhiều hàng và nhiều cột. Trong Python, bảng được lưu bằng một danh sách mà mỗi phần tử lại là một danh sách (một hàng).'],
  ['p', '**Yêu cầu:** Đọc kỹ ví dụ, tự gõ lại code (không sao chép), làm 2 bài tập và kiểm thử trên web tới khi đạt 100% test.'],
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Nhập một bảng M hàng, N cột và truy cập ô a[i][j].'],
  ['b', 'Dùng hai vòng for lồng nhau để tính tổng hàng, tổng cột, tổng toàn bảng.'],
  ['b', 'Làm quen với bảng cộng dồn hai chiều.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Nhập bảng và chỉ số ô'],
  ['code', KHUNG_DOC],
  ['tbl', [2400, 2400, 2400, 2438], [
    ['', 'cột 0', 'cột 1', 'cột 2'], ['hàng 0', 'a[0][0] = 1', 'a[0][1] = 2', 'a[0][2] = 3'], ['hàng 1', 'a[1][0] = 4', 'a[1][1] = 5', 'a[1][2] = 6'],
  ]],
  ['h2', '2. Tổng hàng và tổng cột'],
  ['code', ['tong_hang = []', 'for i in range(m):', '    tong_hang.append(sum(a[i]))', 'tong_cot = [0] * n', 'for i in range(m):', '    for j in range(n):', '        tong_cot[j] += a[i][j]', "print(' '.join(map(str, tong_hang)))", "print(' '.join(map(str, tong_cot)))"]],
  ['p', 'Với bảng trên: tổng hàng là 6 và 15; tổng cột là 5, 7, 9.'],
  ['h2', '3. Bảng cộng dồn'],
  ['p', 'S[i][j] là tổng mọi ô nằm trong hình chữ nhật từ góc trên trái tới ô (i, j). Ta tính bằng công thức: S[i][j] = S[i−1][j] + S[i][j−1] − S[i−1][j−1] + a[i][j] (phần chung bị cộng hai lần nên trừ đi một lần). Ví dụ bảng 1 2 3 / 4 5 6 / 7 8 9 có bảng cộng dồn 1 3 6 / 5 12 21 / 12 27 45.'],
  ['code', ['S = [[0] * (n + 1) for _ in range(m + 1)]   # thêm hàng 0, cột 0 toàn số 0', 'for i in range(1, m + 1):', '    for j in range(1, n + 1):', '        S[i][j] = S[i-1][j] + S[i][j-1] - S[i-1][j-1] + a[i-1][j-1]']],
  ['h2', '4. Đường chéo và xoay bảng'],
  ['p', 'Với bảng vuông N × N: ô a[i][i] nằm trên đường chéo chính, ô a[i][N−1−i] nằm trên đường chéo phụ. Xoay bảng 90° theo chiều kim đồng hồ thì hàng đầu tiên của bảng mới là cột đầu tiên của bảng cũ đọc từ dưới lên: 1 2 3 / 4 5 6 / 7 8 9 thành 7 4 1 / 8 5 2 / 9 6 3.'],
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ['h2', 'Bài 1: TỔNG HÀNG, TỔNG CỘT (TONGHANG)'],
  ['p', 'Dòng 1 nhập M và N, M dòng sau nhập bảng. Dòng 1 in M tổng hàng, dòng 2 in N tổng cột. Ví dụ: "2 3", "1 2 3", "4 5 6" → "6 15" và "5 7 9".'],
  ['h2', 'Bài 2: BẢNG CỘNG DỒN (BANGCD)'],
  ['p', 'Nhập bảng như Bài 1. In bảng cộng dồn S gồm M dòng, mỗi dòng N số. Ví dụ: 1 2 3 / 4 5 6 / 7 8 9 → 1 3 6 / 5 12 21 / 12 27 45.'],
  ['code', ['# Sau khi tạo S:', 'for i in range(1, m + 1):', "    print(' '.join(map(str, S[i][1:])))"]],
  ['h2', 'Bài 3: ĐƯỜNG CHÉO VÀ XOAY BẢNG (XOAYBANG)'],
  ['p', 'Nhập N và bảng vuông N × N. Dòng 1 in tổng đường chéo chính và tổng đường chéo phụ; tiếp theo in bảng sau khi xoay 90° theo chiều kim đồng hồ. Ví dụ: 1 2 3 / 4 5 6 / 7 8 9 → "15 15", rồi 7 4 1 / 8 5 2 / 9 6 3.'],
  ['test', ['TONGHANG', 'BANGCD', 'XOAYBANG'], null, 'Bảng 1 × 1, bảng chỉ 1 hàng hoặc 1 cột, số âm', 'Bảng lớn tới 500 × 500', 17],
]},
];
(async () => { for (const g of GUIDES) { const { file, doc } = buildGuide(g.lv, g.week, g.title, g.blocks); fs.writeFileSync(file, await Packer.toBuffer(doc)); } console.log('ok17'); })();
