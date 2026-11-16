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
const NCY = (w) => ['p', `**Yêu cầu:** Đọc kỹ lý thuyết, tự viết code 2 bài khởi động và kiểm thử trên web tới khi đạt 100% test. Sau đó làm Đề luyện tập số ${w} ở mục Luyện Đề.`];
const GUIDES_NC = [
// ============================== TUẦN 9 ==============================
{ lv: 'NC', week: 9, title: 'KỸ THUẬT HAI CON TRỎ (CỬA SỔ TRƯỢT) & BÓC TÁCH SỐ ÂM', blocks: [
  ['intro'],
  ['p', 'Sang Giai đoạn 2, đề thi bắt đầu đòi hỏi thuật toán nhanh. Buổi này học hai kỹ năng: bóc tách cả số âm ra khỏi xâu (nâng cấp kỹ thuật Buổi 7–8) và kỹ thuật HAI CON TRỎ để tìm đoạn liên tiếp tốt nhất chỉ với một lần duyệt mảng.'],
  NCY(9),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Bóc tách số nguyên có dấu âm: dấu "-" đứng ngay trước cụm chữ số thì số đó âm.'],
  ['b', 'Loại giá trị trùng bằng set, sắp xếp tăng dần bằng sorted().'],
  ['b', 'Dùng cửa sổ trượt (hai con trỏ l, r) tìm đoạn liên tiếp dài nhất có tổng ≤ K trong O(N).'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'],
  ['h2', '1. Bóc tách số âm'],
  ['p', 'Duyệt xâu bằng chỉ số i. Gặp chữ số thì đọc hết cụm chữ số liền nhau; nếu ký tự ngay trước cụm là "-" thì đổi dấu. Chú ý: trong Python, (-15) % 3 == 0 nên phép kiểm tra chia hết vẫn đúng với số âm.'],
  ['code', ['nums = []', 'i = 0', 'while i < len(s):', '    if s[i].isdigit():', '        j = i', '        while j < len(s) and s[j].isdigit():', '            j += 1', '        x = int(s[i:j])', "        if i > 0 and s[i - 1] == '-':", '            x = -x', '        nums.append(x)', '        i = j', '    else:', '        i += 1', 'khac_nhau = sorted(set(nums))   # loại trùng + tăng dần']],
  ['h2', '2. Cửa sổ trượt: đoạn dài nhất có tổng ≤ K'],
  ['p', 'Giữ đoạn [l, r] luôn có tổng ≤ K. Mỗi bước tăng r để thêm một phần tử; nếu tổng vượt K thì tăng l (bỏ phần tử bên trái) cho tới khi hợp lệ trở lại. Mỗi phần tử vào và ra cửa sổ tối đa 1 lần nên chỉ mất O(N).'],
  ['tbl', [900, 2600, 2600, 3538], [
    ['r', 'Thêm A[r] → tổng', 'Bỏ bên trái', 'Đoạn hiện tại (K = 1000)'],
    ['0', '400', '—', '[400] dài 1'],
    ['2', '900', '—', '[400 300 200] dài 3'],
    ['3', '1400 > 1000', 'bỏ 400 → 1000', '[300 200 500] dài 3'],
    ['4', '1200 > 1000', 'bỏ 300 → 900', '[200 500 200] dài 3'],
    ['5', '1000', '—', '[200 500 200 100] dài 4 ← tốt nhất'],
  ]],
  ['code', ['l = 0; s = 0; best = 0', 'for r in range(n):', '    s += a[r]', '    while s > k:', '        s -= a[l]', '        l += 1', '    best = max(best, r - l + 1)']],
  ['tbl', [3700, 2900, 3038], [
    ['N = 10^5', 'Vét cạn mọi đoạn (2 vòng for)', 'Hai con trỏ'],
    ['Số bước', 'khoảng 5 × 10^9', 'khoảng 2 × 10^5'],
    ['Kết quả trên web chấm', 'QUÁ THỜI GIAN Subtask 2', 'Đúng và nhanh cả 2 Subtask'],
  ]],
  ['p', '**Liên hệ đề số 9:** Câu 1 (NEGADIV) = bóc tách số âm + lọc + set; Câu 2 (TUYENLAM) = cửa sổ trượt, khi gặp đoạn dài bằng đoạn tốt nhất thì so thêm tổng để chọn đoạn có tổng lớn hơn.'],
  ['ch', 'CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 2 BÀI KHỞI ĐỘNG'],
  ['h2', 'Bài khởi động 1: BÓC TÁCH SỐ ÂM (TACHSOAM)'],
  ['p', 'Đề bài: Cho xâu S (độ dài ≤ 10^5) gồm chữ cái, chữ số và dấu "-". Bóc tách mọi số nguyên trong S (dấu "-" ngay trước cụm chữ số thì số đó âm). Dòng 1 in số lượng số; dòng 2 in tổng của chúng (không có số nào thì in 0 và 0).'],
  ['p', 'Ví dụ: vào "abc-15xyz-3def12k24m-15p-27" → ra "6" và "-24".'],
  ['h2', 'Bài khởi động 2: ĐOẠN DÀI NHẤT (DOANDAI)'],
  ['p', 'Đề bài: Dòng 1 gồm N và K (N ≤ 10^5, K ≤ 10^9); dòng 2 gồm N số nguyên dương. In độ dài lớn nhất của một đoạn liên tiếp có tổng ≤ K (in 0 nếu không có).'],
  ['p', 'Ví dụ: vào "6 1000" và "400 300 200 500 200 100" → ra "4".'],
  ['code', ['import sys', 'data = sys.stdin.read().split()', 'n, k = int(data[0]), int(data[1])', 'a = [int(x) for x in data[2:2 + n]]', '# TODO: cửa sổ trượt như Chương II', 'print(best)']],
  ['test', 'TACHSOAM', 'DOANDAI', 'Không có số; chỉ một số âm; dấu "-" không đứng sát chữ số; một phần tử lớn hơn K', 'Xâu dài 10^5 ký tự; N tới 10^5 (phải dùng hai con trỏ)', 9],
]},
// ============================== TUẦN 10 ==============================
{ lv: 'NC', week: 10, title: 'THUẬT TOÁN THAM LAM (GREEDY) KẾT HỢP SẮP XẾP', blocks: [
  ['intro'],
  ['p', 'Tham lam là cách giải: ở mỗi bước chọn phương án "đang tốt nhất" và không quay lại. Muốn tham lam đúng, phải SẮP XẾP dữ liệu theo đúng tiêu chí ưu tiên. Buổi này cũng ôn lại kỹ thuật tách chữ số qua bài số Armstrong.'],
  NCY(10),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Kiểm tra số Armstrong: tách chữ số bằng str(x), tính tổng lũy thừa bậc d.'],
  ['b', 'Sắp xếp theo khóa: sort(key=...) với nhiều tiêu chí (giảm dần, rồi tăng dần).'],
  ['b', 'Cài đặt tham lam: duyệt theo thứ tự ưu tiên, món nào chọn được thì chọn.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'],
  ['h2', '1. Số Armstrong'],
  ['p', 'X có d chữ số là số Armstrong nếu tổng lũy thừa bậc d các chữ số bằng X. Ví dụ 153 = 1³ + 5³ + 3³. Số ≤ 10^12 chỉ có tối đa 13 chữ số nên kiểm tra rất nhanh.'],
  ['code', ['def la_armstrong(x):', '    s = str(x)', '    d = len(s)', '    return sum(int(c) ** d for c in s) == x']],
  ['h2', '2. Tham lam: mua được nhiều món nhất'],
  ['p', 'Có ngân sách B, muốn mua NHIỀU món nhất: rõ ràng nên mua món rẻ trước. Sắp xếp giá tăng dần rồi mua lần lượt tới khi hết tiền.'],
  ['tbl', [2400, 2400, 4838], [
    ['Giá đã sắp xếp', 'Đã tiêu (B = 50)', 'Quyết định'],
    ['5', '5', 'Mua'], ['10', '15', 'Mua'], ['15', '30', 'Mua'], ['20', '50', 'Mua (vừa đủ)'], ['35', '85 > 50', 'Dừng: món sau còn đắt hơn'],
  ]],
  ['h2', '3. Sắp xếp theo nhiều tiêu chí'],
  ['p', 'Câu 2 đề số 10 (GIATRI) ưu tiên đơn giá V/W cao nhất, bằng nhau thì khối lượng nhỏ hơn. Viết khóa sắp xếp là một bộ (tuple): phần tử đầu là tiêu chí chính (đổi dấu để thành giảm dần), phần tử sau là tiêu chí phụ.'],
  ['code', ['bao = list(zip(w, v))', 'bao.sort(key=lambda b: (-b[1] / b[0], b[0]))', 'tong_w = tong_v = dem = 0', 'for wi, vi in bao:', '    if tong_w + wi <= K:      # chở vừa thì lấy', '        tong_w += wi; tong_v += vi; dem += 1', '    # không vừa thì BỎ QUA, xét tiếp bao sau']],
  ['p', '**Chú ý:** ở GIATRI, gặp bao không vừa thì bỏ qua và xét tiếp (bao sau có thể nhẹ hơn); còn ở bài mua món rẻ nhất thì dừng luôn được vì món sau chỉ đắt hơn. Đọc kỹ đề để biết khi nào dừng.'],
  ['ch', 'CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 2 BÀI KHỞI ĐỘNG'],
  ['h2', 'Bài khởi động 1: KIỂM TRA SỐ ARMSTRONG (KTARM)'],
  ['p', 'Đề bài: Dòng 1 là Q (Q ≤ 10^5); Q dòng sau, mỗi dòng một số nguyên dương x ≤ 10^12. Với mỗi x in YES nếu x là số Armstrong, ngược lại in NO (mỗi kết quả một dòng).'],
  ['p', 'Ví dụ: vào 5 số 153, 45, 370, 7, 100 → ra YES, NO, YES, YES, NO.'],
  ['h2', 'Bài khởi động 2: MUA KẸO (MUAKEO)'],
  ['p', 'Đề bài: Dòng 1 gồm N và B (N ≤ 10^5, B ≤ 10^12); dòng 2 gồm N giá tiền. Mỗi gói mua tối đa 1 lần. In số gói nhiều nhất mua được và số tiền đã tiêu tương ứng (theo cách mua rẻ trước).'],
  ['p', 'Ví dụ: vào "5 50" và "20 10 35 5 15" → ra "4 50".'],
  ['code', ['import sys', 'data = sys.stdin.read().split()', 'n, b = int(data[0]), int(data[1])', 'gia = sorted(int(x) for x in data[2:2 + n])', '# TODO: mua lần lượt khi còn đủ tiền', 'print(dem, da_tieu)']],
  ['test', 'KTARM', 'MUAKEO', 'Số 1 chữ số, số 10, số Armstrong 10 chữ số; ngân sách không đủ mua gói nào', 'Q, N tới 10^5, giá trị tới 10^12', 10],
]},
// ============================== TUẦN 11 ==============================
{ lv: 'NC', week: 11, title: 'NÉN XÂU RLE – NHÓM KÝ TỰ LIÊN TIẾP & GHÉP CẶP HAI CON TRỎ', blocks: [
  ['intro'],
  ['p', 'Nhiều bài xâu yêu cầu xử lý từng NHÓM ký tự giống nhau đứng liền nhau. Buổi này luyện vòng while "đọc hết một nhóm" và kỹ thuật hai con trỏ đi từ hai đầu dãy để ghép cặp tối ưu.'],
  NCY(11),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Nén xâu RLE: nhóm k ký tự C liên tiếp thành "kC"; giải nén ngược lại.'],
  ['b', 'Ghép xâu kết quả bằng list rồi "".join() để chạy nhanh với xâu dài 10^5.'],
  ['b', 'Ghép cặp tham lam bằng hai con trỏ: nhẹ nhất đi với nặng nhất.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'],
  ['h2', '1. Đọc hết một nhóm ký tự giống nhau'],
  ['code', ['ket_qua = []', 'i = 0', 'while i < len(s):', '    j = i', '    while j < len(s) and s[j] == s[i]:', '        j += 1', '    ket_qua.append(str(j - i) + s[i])   # nhóm s[i..j-1]', '    i = j', "print(''.join(ket_qua))"]],
  ['p', 'Ví dụ AAAABBBCCDAA → 4A3B2C1D2A. Không viết kq = kq + ... trong vòng lặp với xâu dài: mỗi lần nối tạo xâu mới nên rất chậm.'],
  ['p', '**Đếm tần suất:** dùng dict hoặc mảng 26 phần tử. Nếu nhiều ký tự cùng xuất hiện nhiều nhất, duyệt A → Z và chỉ cập nhật khi số lần LỚN HƠN HẲN để giữ ký tự nhỏ nhất.'],
  ['h2', '2. Ghép cặp hai con trỏ (Câu 2 đề số 11)'],
  ['p', 'Mỗi xe chở tối đa 2 bao, tổng ≤ K. Sắp xếp tăng dần, i ở đầu (nhẹ nhất), j ở cuối (nặng nhất). Bao nặng nhất luôn phải lên xe: nếu ghép được với bao nhẹ nhất thì ghép, không thì đi một mình.'],
  ['tbl', [1800, 2300, 2300, 3238], [
    ['Xe', 'a[i] (nhẹ)', 'a[j] (nặng)', 'K = 100'],
    ['1', '30', '80', '110 > 100 → 80 đi một mình'],
    ['2', '30', '70', '100 ≤ 100 → ghép cặp'],
    ['3', '40', '60', '100 ≤ 100 → ghép cặp. Hết: 3 xe'],
  ]],
  ['code', ['a.sort()', 'i, j, xe = 0, n - 1, 0', 'while i <= j:', '    if a[i] + a[j] <= K:', '        i += 1', '    j -= 1', '    xe += 1']],
  ['ch', 'CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 2 BÀI KHỞI ĐỘNG'],
  ['h2', 'Bài khởi động 1: NÉN XÂU (NENXAU)'],
  ['p', 'Đề bài: Cho xâu S chỉ gồm chữ in hoa (độ dài ≤ 10^5). In xâu nén RLE của S.'],
  ['p', 'Ví dụ: vào "AAAABBBCCDAA" → ra "4A3B2C1D2A".'],
  ['h2', 'Bài khởi động 2: GIẢI NÉN (GIAINEN)'],
  ['p', 'Đề bài: Cho xâu đã nén RLE (số lần có thể gồm nhiều chữ số, xâu giải nén dài ≤ 10^5). In xâu ban đầu.'],
  ['p', 'Ví dụ: vào "12K3L" → ra "KKKKKKKKKKKKLLL". Gợi ý: đọc chữ số thì so = so * 10 + chữ số; gặp chữ cái thì thêm chữ cái * so rồi đặt so = 0.'],
  ['code', ['s = input().strip()', 'so = 0', 'ket_qua = []', 'for c in s:', '    # TODO: xử lý chữ số / chữ cái', '    pass', "print(''.join(ket_qua))"]],
  ['test', 'NENXAU', 'GIAINEN', 'Xâu 1 ký tự; không có ký tự lặp; số lần nhiều chữ số (12K, 100A)', 'Xâu dài tới 10^5 (phải ghép xâu bằng list)', 11],
]},
// ============================== TUẦN 12 ==============================
{ lv: 'NC', week: 12, title: 'CHẶT NHỊ PHÂN KẾT QUẢ – TÌM TẢI TRỌNG NHỎ NHẤT', blocks: [
  ['intro'],
  ['p', 'Có những bài hỏi "giá trị NHỎ NHẤT để làm được việc X". Nếu dễ KIỂM TRA một giá trị cho trước có làm được hay không, ta đoán đáp án và thu hẹp khoảng đoán đi một nửa sau mỗi lần thử. Đó là chặt nhị phân kết quả.'],
  NCY(12),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Sinh trước dãy Fibonacci ≤ 10^18 (chỉ khoảng 88 số) vào set để tra cứu tức thì.'],
  ['b', 'Viết hàm kiểm tra: với tải trọng K cần bao nhiêu chuyến xe (tham lam).'],
  ['b', 'Chặt nhị phân trên đáp án K trong khoảng [max(A), tổng A].'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT NỀN TẢNG & MÔ HÌNH TRỰC QUAN'],
  ['h2', '1. Số Fibonacci'],
  ['code', ['fib = set()', 'a, b = 1, 1', 'while a <= 10**18:', '    fib.add(a)', '    a, b = b, a + b', '# x là số Fibonacci  ⇔  x in fib']],
  ['h2', '2. Hàm kiểm tra: tải trọng K cần mấy chuyến?'],
  ['p', 'Chở các kiện theo đúng thứ tự: còn chất thêm được thì chất, không thì mở chuyến mới. Với K ≥ max(A) cách này cho số chuyến ít nhất.'],
  ['code', ['def so_chuyen(K):', '    chuyen, dang_cho = 1, 0', '    for x in a:', '        if dang_cho + x > K:', '            chuyen += 1', '            dang_cho = 0', '        dang_cho += x', '    return chuyen']],
  ['h2', '3. Chặt nhị phân đáp án'],
  ['p', 'K càng lớn thì số chuyến càng ít (tính đơn điệu). Ví dụ A = 100 200 300 400 500, M = 3:'],
  ['tbl', [2400, 2400, 4838], [
    ['Thử K', 'Số chuyến', 'Kết luận'],
    ['1000', '2', '≤ 3: được, thử nhỏ hơn'],
    ['750', '3', 'được, thử nhỏ hơn'],
    ['600', '3', 'được: [100 200 300] [400] [500]'],
    ['599', '4', 'không được → đáp án là 600'],
  ]],
  ['code', ['lo, hi = max(a), sum(a)', 'while lo < hi:', '    mid = (lo + hi) // 2', '    if so_chuyen(mid) <= M:', '        hi = mid        # mid làm được: thử nhỏ hơn', '    else:', '        lo = mid + 1', 'print(lo)']],
  ['p', 'Mỗi lần thử tốn O(N), số lần thử khoảng log₂(tổng A) ≈ 47 nên tổng cộng khoảng 5 × 10^6 bước, chạy kịp với N = 10^5.'],
  ['ch', 'CHƯƠNG III', 'KHUNG CHƯƠNG TRÌNH & 2 BÀI KHỞI ĐỘNG'],
  ['h2', 'Bài khởi động 1: KIỂM TRA SỐ FIBONACCI (KTFIBO)'],
  ['p', 'Đề bài: Dòng 1 là Q (Q ≤ 10^5); Q dòng sau mỗi dòng một số nguyên dương x ≤ 10^18. In YES nếu x thuộc dãy Fibonacci, ngược lại in NO.'],
  ['p', 'Ví dụ: vào 13, 8, 20, 55, 4 → ra YES, YES, NO, YES, NO.'],
  ['h2', 'Bài khởi động 2: ĐẾM SỐ CHUYẾN (DEMCHUYEN)'],
  ['p', 'Đề bài: Dòng 1 gồm N và K (N ≤ 10^5); dòng 2 gồm N khối lượng (mỗi số ≤ K). Chở các kiện theo đúng thứ tự, mỗi chuyến tổng ≤ K. In số chuyến ít nhất.'],
  ['p', 'Ví dụ: vào "5 600" và "100 200 300 400 500" → ra "3". Đây chính là hàm kiểm tra của Câu 2 đề số 12.'],
  ['code', ['import sys', 'data = sys.stdin.read().split()', 'n, K = int(data[0]), int(data[1])', 'a = [int(x) for x in data[2:2 + n]]', '# TODO: viết so_chuyen(K) như Chương II', 'print(so_chuyen(K))']],
  ['test', 'KTFIBO', 'DEMCHUYEN', 'Số 1, 2, 3; số Fibonacci lớn nhất ≤ 10^18; mỗi kiện đúng bằng K', 'Q, N tới 10^5, số tới 10^18', 12],
]},
];
const CBY = ['p', '**Yêu cầu:** Đọc kỹ ví dụ, tự gõ lại code (không sao chép), làm 2 bài tập và kiểm thử trên web tới khi đạt 100% test.'];
const CBI = (s) => [['intro'], ['p', s], CBY];
const GUIDES_CB = [
// ---------- 9 ----------
{ lv: 'CB', week: 9, title: 'BÓC TÁCH SỐ ÂM TRONG XÂU & ĐOẠN LIÊN TIẾP CÓ TỔNG KHÔNG VƯỢT K', blocks: [
  ...CBI('Ở Buổi 7–8 em đã bóc tách số dương trong xâu. Buổi này mở rộng thêm số âm và làm quen với bài toán tìm đoạn liên tiếp, một dạng rất hay gặp trong bài kiểm tra.'),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Nhận biết số âm: dấu "-" đứng ngay trước cụm chữ số.'],
  ['b', 'Tìm đoạn liên tiếp dài nhất có tổng ≤ K, trước bằng hai vòng lặp, sau bằng hai con trỏ.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Bóc tách số có thể âm'],
  ['p', 'Dùng biến temp gom các chữ số liền nhau như Buổi 7. Khi bắt đầu một cụm số, nhìn ký tự đứng ngay trước: nếu là "-" thì nhớ đổi dấu.'],
  ['code', ['s = input().strip()', 'nums = []', 'i = 0', 'while i < len(s):', '    if s[i].isdigit():', '        j = i', '        while j < len(s) and s[j].isdigit():', '            j += 1', '        x = int(s[i:j])', "        if i > 0 and s[i - 1] == '-':", '            x = -x', '        nums.append(x)', '        i = j', '    else:', '        i += 1', 'print(len(nums))', 'print(sum(nums))']],
  ['p', 'Ví dụ "a-12b7" → các số −12 và 7. Còn "a-b5" thì dấu "-" không sát chữ số nên chỉ có số 5.'],
  ['h2', '2. Đoạn liên tiếp dài nhất có tổng ≤ K'],
  ['p', '**Cách 1 (dễ hiểu):** thử mọi điểm đầu l, cộng dần sang phải tới khi tổng vượt K. Chạy tốt khi N nhỏ (vài nghìn).'],
  ['code', ['best = 0', 'for l in range(n):', '    s = 0', '    for r in range(l, n):', '        s += a[r]', '        if s > k:', '            break', '        best = max(best, r - l + 1)']],
  ['p', '**Cách 2 (nhanh):** giữ một "cửa sổ" [l, r]; thêm a[r] vào, nếu tổng vượt K thì bỏ dần phần tử bên trái (tăng l). Mỗi số chỉ vào và ra cửa sổ một lần.'],
  ['code', ['l = 0; s = 0; best = 0', 'for r in range(n):', '    s += a[r]', '    while s > k:', '        s -= a[l]', '        l += 1', '    best = max(best, r - l + 1)']],
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ['h2', 'Bài 1: BÓC TÁCH SỐ ÂM (TACHSOAM)'],
  ['p', 'Nhập xâu S. Dòng 1 in số lượng số nguyên trong S, dòng 2 in tổng của chúng (không có số thì in 0 và 0). Ví dụ: "abc-15xyz-3def12k24m-15p-27" → 6 và −24.'],
  ['h2', 'Bài 2: ĐOẠN DÀI NHẤT (DOANDAI)'],
  ['p', 'Dòng 1 nhập N và K, dòng 2 nhập N số nguyên dương. In độ dài đoạn liên tiếp dài nhất có tổng ≤ K (không có thì in 0). Ví dụ: "6 1000" và "400 300 200 500 200 100" → 4 (đoạn 200 500 200 100).'],
  ['code', ['n, k = map(int, input().split())', 'a = list(map(int, input().split()))', '# Viết code...']],
  ['test', 'TACHSOAM', 'DOANDAI', 'Không có số; chỉ một số âm; một phần tử lớn hơn K', 'Dữ liệu lớn: xâu 10^5 ký tự, N tới 10^5 (nên dùng Cách 2)', 9],
]},
// ---------- 10 ----------
{ lv: 'CB', week: 10, title: 'SỐ ARMSTRONG & CHIẾN LƯỢC THAM LAM (CHỌN CÁI TỐT NHẤT TRƯỚC)', blocks: [
  ...CBI('Buổi này ôn kỹ năng tách chữ số của một số, và học một cách nghĩ mới: muốn được nhiều nhất thì ưu tiên chọn thứ "có lợi nhất" trước. Cách nghĩ này gọi là tham lam.'),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Tách chữ số bằng str(x) và tính lũy thừa bằng toán tử **.'],
  ['b', 'Sắp xếp danh sách bằng sort() rồi chọn lần lượt.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Số Armstrong'],
  ['p', 'Số X có d chữ số là số Armstrong nếu cộng lũy thừa bậc d của các chữ số được đúng X. Ví dụ 153 có 3 chữ số: 1³ + 5³ + 3³ = 1 + 125 + 27 = 153. Mọi số có 1 chữ số đều là số Armstrong.'],
  ['code', ['x = int(input())', 's = str(x)', 'd = len(s)', 'tong = 0', 'for c in s:', '    tong += int(c) ** d', "print('YES' if tong == x else 'NO')"]],
  ['h2', '2. Tham lam: mua được nhiều gói kẹo nhất'],
  ['p', 'Có 50 nghìn đồng, các gói giá 20, 10, 35, 5, 15. Muốn mua nhiều gói nhất thì mua gói rẻ trước: sắp xếp thành 5, 10, 15, 20, 35 rồi mua lần lượt.'],
  ['tbl', [2400, 2400, 4838], [
    ['Giá gói', 'Đã tiêu', 'Quyết định'],
    ['5', '5', 'Mua'], ['10', '15', 'Mua'], ['15', '30', 'Mua'], ['20', '50', 'Mua (vừa hết tiền)'], ['35', '85 > 50', 'Không đủ tiền → dừng'],
  ]],
  ['code', ['gia.sort()', 'dem = 0; da_tieu = 0', 'for g in gia:', '    if da_tieu + g > b:', '        break', '    da_tieu += g', '    dem += 1', 'print(dem, da_tieu)']],
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ['h2', 'Bài 1: KIỂM TRA SỐ ARMSTRONG (KTARM)'],
  ['p', 'Dòng 1 nhập Q, Q dòng sau mỗi dòng một số x. Với mỗi số in YES hoặc NO trên một dòng. Ví dụ: 153, 45, 370, 7, 100 → YES, NO, YES, YES, NO.'],
  ['code', ['q = int(input())', 'for _ in range(q):', '    x = int(input())', '    # Viết code...']],
  ['h2', 'Bài 2: MUA KẸO (MUAKEO)'],
  ['p', 'Dòng 1 nhập N và B (ngân sách), dòng 2 nhập N giá tiền. In số gói nhiều nhất mua được và số tiền đã tiêu. Ví dụ: "5 50" và "20 10 35 5 15" → "4 50".'],
  ['test', 'KTARM', 'MUAKEO', 'Số 1 chữ số, số 10; ngân sách không đủ mua gói nào', 'Dữ liệu lớn: tới 10^5 số', 10],
]},
// ---------- 11 ----------
{ lv: 'CB', week: 11, title: 'NÉN XÂU RLE – ĐẾM NHÓM KÝ TỰ GIỐNG NHAU LIÊN TIẾP', blocks: [
  ...CBI('Khi gửi dữ liệu có nhiều ký tự lặp lại (AAAA...), người ta nén lại để gửi nhanh hơn: AAAABBB thành 4A3B. Buổi này em tự viết chương trình nén và giải nén xâu theo cách đó.'),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Dùng vòng lặp while để đọc hết một nhóm ký tự giống nhau đứng liền nhau.'],
  ['b', 'Đổi qua lại giữa xâu ký tự và số (str, int), gom chữ số thành số nhiều chữ số.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Nén xâu'],
  ['tbl', [3200, 3200, 3238], [
    ['Nhóm', 'Độ dài', 'Mã hóa'],
    ['AAAA', '4', '4A'], ['BBB', '3', '3B'], ['CC', '2', '2C'], ['D', '1', '1D'], ['AA', '2', '2A'],
  ]],
  ['p', 'Ghép lại: AAAABBBCCDAA → 4A3B2C1D2A. Chú ý nhóm A cuối là một nhóm MỚI vì bị ngăn cách bởi B, C, D.'],
  ['code', ['s = input().strip()', 'ket_qua = []', 'i = 0', 'while i < len(s):', '    j = i', '    while j < len(s) and s[j] == s[i]:', '        j += 1', '    ket_qua.append(str(j - i) + s[i])', '    i = j', "print(''.join(ket_qua))"]],
  ['p', '**Mẹo:** gom các phần vào list rồi dùng "".join() ở cuối, chương trình chạy nhanh hơn nhiều so với cộng xâu liên tục.'],
  ['h2', '2. Giải nén'],
  ['p', 'Đọc từng ký tự: gặp chữ số thì ghép vào số đang đọc (so = so * 10 + chữ số, vì có thể là 12, 100...); gặp chữ cái thì lặp chữ cái đó "so" lần rồi đặt lại so = 0. Ví dụ "12K3L" → 12 chữ K và 3 chữ L.'],
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ['h2', 'Bài 1: NÉN XÂU (NENXAU)'],
  ['p', 'Nhập xâu S gồm chữ in hoa. In xâu nén. Ví dụ: AAAABBBCCDAA → 4A3B2C1D2A.'],
  ['h2', 'Bài 2: GIẢI NÉN (GIAINEN)'],
  ['p', 'Nhập xâu đã nén. In xâu ban đầu. Ví dụ: 4A3B2C1D2A → AAAABBBCCDAA.'],
  ['code', ['s = input().strip()', 'so = 0', 'ket_qua = []', 'for c in s:', '    if c.isdigit():', '        pass  # Viết code...', '    else:', '        pass  # Viết code...', "print(''.join(ket_qua))"]],
  ['test', 'NENXAU', 'GIAINEN', 'Xâu 1 ký tự; không có ký tự lặp; số lần nhiều chữ số (12K, 100A)', 'Xâu dài tới 10^5 ký tự', 11],
]},
// ---------- 12 ----------
{ lv: 'CB', week: 12, title: 'DÃY FIBONACCI & BÀI TOÁN XẾP HÀNG LÊN XE', blocks: [
  ...CBI('Dãy Fibonacci 1, 1, 2, 3, 5, 8, 13, ... (mỗi số bằng tổng hai số trước) xuất hiện rất nhiều trong toán và tin học. Buổi này em sinh dãy Fibonacci để kiểm tra một số, và mô phỏng việc xếp hàng lên xe tải.'),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Sinh dãy Fibonacci bằng vòng lặp while và lưu vào set để kiểm tra nhanh.'],
  ['b', 'Mô phỏng chất hàng lên xe theo thứ tự: còn chở được thì chất thêm, không thì sang xe mới.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Sinh dãy Fibonacci'],
  ['code', ['fib = set()', 'a, b = 1, 1', 'while a <= 10**18:', '    fib.add(a)', '    a, b = b, a + b', 'x = int(input())', "print('YES' if x in fib else 'NO')"]],
  ['p', 'Dù giới hạn tới 10^18, dãy chỉ có khoảng 88 số nên sinh rất nhanh. Dòng "a, b = b, a + b" cập nhật hai số cùng lúc.'],
  ['h2', '2. Chất hàng lên xe theo thứ tự'],
  ['p', 'Các kiện hàng xếp thành hàng, mỗi xe chở tối đa K kg và phải chở các kiện LIÊN TIẾP. Ví dụ K = 600, kiện 100 200 300 400 500:'],
  ['tbl', [2000, 2600, 5038], [
    ['Kiện', 'Xe đang chở', 'Quyết định'],
    ['100, 200, 300', '600', 'Xe 1 chất vừa đủ 600'],
    ['400', '400', '600 + 400 > 600 → sang xe 2'],
    ['500', '500', '400 + 500 > 600 → sang xe 3. Kết quả: 3 xe'],
  ]],
  ['code', ['n, k = map(int, input().split())', 'a = list(map(int, input().split()))', 'xe = 1; dang_cho = 0', 'for x in a:', '    if dang_cho + x > k:', '        xe += 1', '        dang_cho = 0', '    dang_cho += x', 'print(xe)']],
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ['h2', 'Bài 1: KIỂM TRA SỐ FIBONACCI (KTFIBO)'],
  ['p', 'Dòng 1 nhập Q, Q dòng sau mỗi dòng một số x. In YES nếu x thuộc dãy Fibonacci, ngược lại NO. Ví dụ: 13, 8, 20, 55, 4 → YES, YES, NO, YES, NO.'],
  ['h2', 'Bài 2: ĐẾM SỐ CHUYẾN (DEMCHUYEN)'],
  ['p', 'Dòng 1 nhập N và K, dòng 2 nhập N khối lượng (mỗi kiện ≤ K). In số xe (chuyến) ít nhất. Ví dụ: "5 600" và "100 200 300 400 500" → 3.'],
  ['test', 'KTFIBO', 'DEMCHUYEN', 'Số 1, 2, 3; số rất lớn gần 10^18; mỗi kiện đúng bằng K', 'Dữ liệu lớn: tới 10^5 số', 12],
]},
// ---------- 13 ----------
{ lv: 'CB', week: 13, title: 'MẢNG CỘNG DỒN – TÍNH TỔNG ĐOẠN THẬT NHANH', blocks: [
  ...CBI('Nếu phải tính tổng của rất nhiều đoạn khác nhau trong một dãy, cộng lại từng đoạn sẽ rất chậm. Mảng cộng dồn giúp tính tổng mọi đoạn chỉ bằng một phép trừ.'),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Xây dựng mảng cộng dồn S[i] = A[1] + A[2] + ... + A[i].'],
  ['b', 'Tính tổng đoạn [L, R] bằng S[R] − S[L−1].'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Mảng cộng dồn'],
  ['tbl', [1800, 1500, 1500, 1500, 1500, 1838], [
    ['i', '1', '2', '3', '4', '5'],
    ['A[i]', '3', '1', '4', '1', '5'],
    ['S[i]', '3', '4', '8', '9', '14'],
  ]],
  ['p', 'Mỗi S[i] = S[i−1] + A[i], nên chỉ cần một vòng lặp. Đặt S[0] = 0 cho tiện.'],
  ['code', ['n = int(input())', 'a = list(map(int, input().split()))', 's = [0] * (n + 1)', 'for i in range(1, n + 1):', '    s[i] = s[i - 1] + a[i - 1]']],
  ['h2', '2. Tổng đoạn bằng một phép trừ'],
  ['p', 'Tổng các phần tử từ vị trí L đến R = S[R] − S[L−1]. Ví dụ tổng từ 2 đến 4 = S[4] − S[1] = 9 − 3 = 6 (đúng bằng 1 + 4 + 1).'],
  ['p', '**Tổng K phần tử liên tiếp lớn nhất:** đoạn bắt đầu ở i có tổng S[i+K−1] − S[i−1]; thử mọi i và lấy giá trị lớn nhất.'],
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ['h2', 'Bài 1: DÃY CỘNG DỒN (CONGDON)'],
  ['p', 'Dòng 1 nhập N, dòng 2 nhập N số nguyên. In S[1], S[2], ..., S[N] trên một dòng. Ví dụ: 3 1 4 1 5 → 3 4 8 9 14.'],
  ['h2', 'Bài 2: TỔNG K NGÀY LIÊN TIẾP LỚN NHẤT (TONGKMAX)'],
  ['p', 'Dòng 1 nhập N và K, dòng 2 nhập N số (có thể âm). In tổng lớn nhất của K số đứng liền nhau. Ví dụ: "7 3" và "2 -1 4 5 -3 6 1" → 8.'],
  ['code', ['n, k = map(int, input().split())', 'a = list(map(int, input().split()))', '# Bước 1: tạo mảng cộng dồn s', '# Bước 2: duyệt i từ 1 đến n - k + 1, lấy max của s[i+k-1] - s[i-1]']],
  ['test', 'CONGDON', 'TONGKMAX', 'Dãy 1 phần tử, toàn số âm, K = N', 'Dữ liệu lớn: N tới 10^5', 13],
]},
// ---------- 14 ----------
{ lv: 'CB', week: 14, title: 'ĐẾM TẦN SUẤT BẰNG DICT VÀ LOẠI TRÙNG BẰNG SET', blocks: [
  ...CBI('Muốn biết mỗi giá trị xuất hiện bao nhiêu lần, hay hai danh sách có những phần tử chung nào, Python có sẵn hai công cụ rất mạnh: từ điển (dict) và tập hợp (set).'),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Đếm số lần xuất hiện của mỗi giá trị bằng dict.'],
  ['b', 'Loại phần tử trùng và tìm phần tử chung bằng set.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Đếm bằng dict'],
  ['code', ['cnt = {}', 'for x in [4, 2, 4, 1, 2, 4, 9]:', '    cnt[x] = cnt.get(x, 0) + 1', 'print(cnt)          # {4: 3, 2: 2, 1: 1, 9: 1}', 'for v in sorted(cnt):', '    print(v, cnt[v])']],
  ['p', 'cnt.get(x, 0) trả về số lần đã đếm của x, hoặc 0 nếu x chưa có trong từ điển.'],
  ['h2', '2. Set: tập hợp không có phần tử trùng'],
  ['tbl', [4000, 5638], [
    ['Câu lệnh', 'Kết quả'],
    ['set([1, 2, 2, 3, 5])', '{1, 2, 3, 5}'],
    ['{1, 2, 3, 5} & {2, 3, 4}', '{2, 3}  (phần tử chung)'],
    ['len({2, 3})', '2'],
    ['3 in {1, 2, 3}', 'True  (kiểm tra rất nhanh)'],
  ]],
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ['h2', 'Bài 1: ĐẾM SỐ LẦN XUẤT HIỆN (DEMSO)'],
  ['p', 'Dòng 1 nhập N, dòng 2 nhập N số nguyên. Với mỗi giá trị khác nhau, in một dòng gồm giá trị và số lần xuất hiện, theo giá trị tăng dần. Ví dụ: 4 2 4 1 2 4 9 → "1 1", "2 2", "4 3", "9 1".'],
  ['h2', 'Bài 2: SỐ CHUNG CỦA HAI DÃY (CHUNGSO)'],
  ['p', 'Dòng 1 nhập N và M, dòng 2 nhập dãy A (N số), dòng 3 nhập dãy B (M số). In số giá trị KHÁC NHAU có mặt ở cả hai dãy. Ví dụ: "5 4", "1 2 2 3 5", "2 3 3 4" → 2.'],
  ['code', ['n, m = map(int, input().split())', 'a = list(map(int, input().split()))', 'b = list(map(int, input().split()))', '# Gợi ý: chuyển a, b thành set rồi lấy giao']],
  ['test', 'DEMSO', 'CHUNGSO', 'Một phần tử, mọi phần tử giống nhau, số âm, hai dãy không có số chung', 'Dữ liệu lớn: tới 10^5 số', 14],
]},
// ---------- 15 ----------
{ lv: 'CB', week: 15, title: 'SÀNG NGUYÊN TỐ – TÌM MỌI SỐ NGUYÊN TỐ TỪ 1 ĐẾN N', blocks: [
  ...CBI('Em đã biết kiểm tra một số có nguyên tố hay không bằng cách thử chia. Khi cần biết tất cả số nguyên tố tới 1 triệu, có một cách thông minh hơn: "sàng" bỏ dần các hợp số, gọi là sàng Eratosthenes.'),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Hiểu và cài đặt sàng Eratosthenes.'],
  ['b', 'Dùng mảng đánh dấu để đếm số nguyên tố và tìm ước nguyên tố.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Sàng Eratosthenes với N = 30'],
  ['tbl', [1800, 7838], [
    ['Bước', 'Gạch bỏ các bội'],
    ['Số 2', '4 6 8 10 12 14 16 18 20 22 24 26 28 30'],
    ['Số 3', '9 15 21 27'],
    ['Số 5', '25'],
    ['Còn lại', '2 3 5 7 11 13 17 19 23 29 → 10 số nguyên tố'],
  ]],
  ['code', ['n = int(input())', 'nt = [True] * (n + 1)', 'nt[0] = False', 'if n >= 1: nt[1] = False', 'i = 2', 'while i * i <= n:', '    if nt[i]:', '        for j in range(i * i, n + 1, i):', '            nt[j] = False', '    i += 1', 'print(sum(nt))       # số lượng số nguyên tố <= n']],
  ['h2', '2. Ước nguyên tố khác nhau của một số'],
  ['p', 'Ví dụ 12 = 2 × 2 × 3 có 2 ước nguyên tố khác nhau (2 và 3); 30 = 2 × 3 × 5 có 3; số 1 có 0. Cách đơn giản: thử chia x cho d = 2, 3, 4, ...; mỗi khi d chia hết thì đếm 1 và chia x cho d tới khi hết.'],
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ['h2', 'Bài 1: SÀNG NGUYÊN TỐ (SANGNT)'],
  ['p', 'Nhập N (N ≤ 10^6). Dòng 1 in số lượng số nguyên tố ≤ N; dòng 2 in số nguyên tố lớn nhất ≤ N (in −1 nếu không có). Ví dụ: 30 → 10 và 29; 1 → 0 và −1.'],
  ['h2', 'Bài 2: SỐ ƯỚC NGUYÊN TỐ (UOCNT)'],
  ['p', 'Dòng 1 nhập Q, dòng 2 nhập Q số x (x ≤ 2 × 10^5). In trên một dòng số ước nguyên tố khác nhau của từng số. Ví dụ: "5" và "12 7 1 30 64" → "2 1 0 3 1".'],
  ['code', ['q = int(input())', 'xs = list(map(int, input().split()))', 'kq = []', 'for x in xs:', '    dem = 0', '    # Viết code đếm ước nguyên tố khác nhau của x', '    kq.append(dem)', "print(' '.join(map(str, kq)))"]],
  ['test', 'SANGNT', 'UOCNT', 'N = 1, N = 2; toàn số 1; số có nhiều ước nguyên tố (30030)', 'Dữ liệu lớn: N tới 10^6, tới 10^5 số', 15],
]},
// ---------- 16 ----------
{ lv: 'CB', week: 16, title: 'TÌM KIẾM NHỊ PHÂN TRÊN DÃY ĐÃ SẮP XẾP', blocks: [
  ...CBI('Khi tra từ điển, em không lật từng trang từ đầu mà mở ở giữa rồi chọn nửa trước hoặc nửa sau. Tìm kiếm nhị phân làm đúng như vậy trên dãy số đã sắp xếp.'),
  ['ch', 'CHƯƠNG I', 'MỤC TIÊU BÀI HỌC'],
  ['b', 'Hiểu cách chia đôi vùng tìm kiếm trên dãy đã sắp xếp.'],
  ['b', 'Tự viết tìm kiếm nhị phân bằng vòng lặp while.'],
  ['ch', 'CHƯƠNG II', 'LÝ THUYẾT & VÍ DỤ MINH HỌA'],
  ['h2', '1. Tìm x = 16 trong dãy 2 5 8 12 16 23 38'],
  ['tbl', [1200, 1200, 1200, 2400, 3638], [
    ['Bước', 'trái', 'phải', 'Phần tử giữa', 'Kết luận'],
    ['1', '0', '6', 'a[3] = 12', '12 < 16 → tìm nửa phải'],
    ['2', '4', '6', 'a[5] = 23', '23 > 16 → tìm nửa trái'],
    ['3', '4', '4', 'a[4] = 16', 'Tìm thấy ở vị trí thứ 5'],
  ]],
  ['code', ['trai, phai = 0, n - 1', 'vi_tri = -1', 'while trai <= phai:', '    giua = (trai + phai) // 2', '    if a[giua] == x:', '        vi_tri = giua + 1     # đánh số từ 1', '        break', '    elif a[giua] < x:', '        trai = giua + 1', '    else:', '        phai = giua - 1', 'print(vi_tri)']],
  ['h2', '2. Vì sao nhanh?'],
  ['p', 'Mỗi bước loại bỏ một nửa dãy: dãy 100 000 số chỉ cần khoảng 17 bước, trong khi tìm lần lượt có thể mất 100 000 bước. **Nhớ:** dãy phải được sắp xếp trước.'],
  ['p', '**Đếm số lần x xuất hiện:** tìm vị trí ĐẦU TIÊN có giá trị ≥ x và vị trí đầu tiên có giá trị > x; hiệu hai vị trí là số lần xuất hiện. Có thể dùng sẵn bisect_left, bisect_right trong thư viện bisect.'],
  ['ch', 'CHƯƠNG III', 'BÀI TẬP THỰC HÀNH'],
  ['h2', 'Bài 1: TÌM VỊ TRÍ (TIMX)'],
  ['p', 'Dòng 1 nhập N và Q; dòng 2 nhập dãy N số khác nhau đã tăng dần; dòng 3 nhập Q số x. Với mỗi x in vị trí của x (đánh số từ 1) hoặc −1. Ví dụ: "6 4", "2 5 8 12 16 23", "12 2 7 23" → 4, 1, −1, 6.'],
  ['h2', 'Bài 2: ĐẾM SỐ LẦN XUẤT HIỆN (DEMX)'],
  ['p', 'Dữ liệu vào giống Bài 1 nhưng dãy có thể có số trùng (không giảm). Với mỗi x in số lần x xuất hiện. Ví dụ: "8 4", "1 3 3 3 5 7 7 9", "3 7 4 9" → 3, 2, 0, 1.'],
  ['code', ['n, q = map(int, input().split())', 'a = list(map(int, input().split()))', 'xs = list(map(int, input().split()))', 'for x in xs:', '    pass   # Viết code tìm kiếm nhị phân, in kết quả']],
  ['test', 'TIMX', 'DEMX', 'Dãy 1 phần tử; x nhỏ hơn số đầu hoặc lớn hơn số cuối; số âm', 'Dữ liệu lớn: N, Q tới 10^5', 16],
]},
];
(async () => {
  const fs2 = require('fs');
  for (const g of [...GUIDES_NC, ...GUIDES_CB]) {
    const { file, doc } = buildGuide(g.lv, g.week, g.title, g.blocks);
    fs2.writeFileSync(file, await Packer.toBuffer(doc));
  }
  console.log('ok');
})();
