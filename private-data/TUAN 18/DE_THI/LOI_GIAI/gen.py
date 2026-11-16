import os, random, time, sys, json, string
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from solutions import *
OUT = '/home/claude/w18/data'
def write(kind, prob, idx, inp, out):
    cat, sub = kind
    for root, content, ext in (('public', inp, 'INP'), ('private', out, 'OUT')):
        d = f'{OUT}/{root}/TUAN 18/{cat}/{sub}/TEST_{prob}/Test{idx:02d}'
        os.makedirs(d, exist_ok=True)
        with open(f'{d}/{prob}.{ext}', 'w', newline='\n') as f: f.write(content.rstrip('\n') + '\n')
def check(name, fast, slow, inp, use_slow):
    t0 = time.time(); a = fast(inp); tf = time.time() - t0
    if use_slow:
        t1 = time.time(); b = slow(inp); assert a.split() == b.split(), name
    return a, tf
R = random.Random(1801); rep = []
VOCAB = ['da', 'lat', 'hoa', 'mai', 'anh', 'dao', 'thong', 'suong', 'ho', 'xuan', 'huong', 'cho', 'dem', 'ca', 'phe', 'dau', 'tay', 'atiso', 'langbiang', 'tuyen', 'lam', 'cau', 'dat', 'che', 'festival', 'mong', 'mo', 'pho', 'nui', 'doi', 'gio', 'lanh', 'tram', 'nam', 'tuoi', 'xanh', 'tim', 'vang', 'hong', 'trang']
PUNCT = [' ', ' ', ' ', ', ', '. ', '! ', ' - ', '; ', '? ', '  ', ' (', ') ', '"', ':']
def text(nw, vocab, digits=False):
    out = []
    for _ in range(nw):
        w = R.choice(vocab)
        if digits and R.random() < 0.05: w = str(R.randint(0, 2026))
        r = R.random()
        if r < 0.15: w = w.upper()
        elif r < 0.35: w = w.capitalize()
        out.append(w + R.choice(PUNCT))
    return ''.join(out)
# ===== TUKHOA 10 nhỏ + 10 lớn =====
for i in range(1, 21):
    if i == 1: inp = "Da Lat, da lat! Thanh pho ngan hoa - DA LAT mong mo.\n"
    elif i == 2: inp = "!!! ... ---\n"
    elif i == 3: inp = "Langbiang\n"
    elif i == 4: inp = "b a B A c\n"                                           # hòa: chọn từ nhỏ nhất
    else:
        small = i <= 10
        vocab = VOCAB if i % 2 else [''.join(R.choice(string.ascii_lowercase) for _ in range(R.randint(1, 6))) for _ in range(3000 if not small else 60)]
        s = text(R.randint(30, 150) if small else 10**6, vocab, digits=True)
        lim = 1000 if small else 10**5
        s = s[:lim].rstrip()
        inp = s + "\n"
    out, tf = check('TUKHOA', tukhoa_fast, tukhoa_slow, inp, i <= 12)
    write(('DE_THI', 'TestCases'), 'TUKHOA', i, inp, out); rep.append(('TUKHOA', i, len(inp), round(tf, 3)))
# ===== DENLONG 10 nhỏ + 10 lớn =====
for i in range(1, 21):
    if i == 1: inp = "DVDDVV\nD V\n"
    elif i == 2: inp = "VVVDDD\nD V\n"                                         # không cặp nào
    elif i == 3: inp = "AAAAA\nA A\n"                                          # X trùng Y: C(5,2) = 10
    else:
        small = i <= 10
        n = R.randint(100, 1000) if small else R.randint(5 * 10**5, 10**6)
        alpha = 'DV' if i % 3 == 0 else ('XYZ' if i % 3 == 1 else string.ascii_uppercase[:R.randint(2, 26)])
        s = ''.join(R.choice(alpha) for _ in range(n))
        x, y = R.choice(alpha), R.choice(alpha)
        if i in (9, 19): x = y
        inp = f"{s}\n{x} {y}\n"
    out, tf = check('DENLONG', denlong_fast, denlong_slow, inp, i <= 10)
    write(('DE_THI', 'TestCases'), 'DENLONG', i, inp, out); rep.append(('DENLONG', i, len(inp), round(tf, 3)))
# ===== Khởi động =====
PRINT = string.ascii_letters + string.digits + ' ' * 10 + '.,!?-;:()@#'
for i in range(1, 11):
    if i == 1: inp = "Da Lat 2026, mua hoa!\n"
    elif i == 2: inp = "A\n"
    elif i == 3: inp = "12345 67890\n"
    elif i == 4: inp = "@#!?.,\n"
    else: inp = ''.join(R.choice(PRINT) for _ in range(R.randint(100, 1000) if i <= 6 else R.randint(5 * 10**4, 10**5))).strip() + "\n"
    out, tf = check('DEMKYTU', demkytu_fast, demkytu_slow, inp, True)
    write(('TL_TU_HOC', 'BO_TEST'), 'DEMKYTU', i, inp, out); rep.append(('DEMKYTU', i, len(inp), round(tf, 3)))
for i in range(1, 11):
    if i == 1: inp = "  Da   Lat  mong mo \n"
    elif i == 2: inp = "Langbiang\n"
    elif i == 3: inp = "   mot    hai    \n"
    elif i == 4: inp = "a b c d e\n"
    else:
        nw = R.randint(10, 100) if i <= 6 else R.randint(5000, 15000)
        inp = ' ' * R.randint(0, 3) + ''.join(R.choice(VOCAB) + ' ' * R.randint(1, 4) for _ in range(nw)) + "\n"
    out, tf = check('DAOTU', daotu_fast, daotu_slow, inp, i <= 6)
    write(('TL_TU_HOC', 'BO_TEST'), 'DAOTU', i, inp, out); rep.append(('DAOTU', i, len(inp), round(tf, 3)))
for (p, r1, r2, d1, d2) in (('TUKHOA', "1-10", "11-20", 5.0, 5.0), ('DENLONG', "1-10", "11-20", 5.0, 5.0)):
    json.dump({"_ghi_chu": "Cấu hình chấm chuẩn HSG (chế độ Nâng Cao và Luyện Đề). Lấy từ đề PDF; cô có thể sửa tay.", "diemToiDa": 10, "gioiHanThoiGianGiay": 3,
               "subtasks": [{"ten": "Subtask 1", "tests": r1, "diem": d1}, {"ten": "Subtask 2", "tests": r2, "diem": d2}]},
              open(f'{OUT}/private/TUAN 18/DE_THI/TestCases/TEST_{p}/subtasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
for p in ('DEMKYTU', 'DAOTU'):
    json.dump({"_ghi_chu": "Bài tự học: không chia subtask.", "diemToiDa": 10, "gioiHanThoiGianGiay": 3},
              open(f'{OUT}/private/TUAN 18/TL_TU_HOC/BO_TEST/TEST_{p}/subtasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
for r in rep:
    if r[1] in (1, 10, 11, 20): print('%-8s %3d %9d %6.3f' % r)
