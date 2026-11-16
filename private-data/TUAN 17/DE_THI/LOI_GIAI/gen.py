import os, random, time, sys, json
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from solutions import *
OUT = '/home/claude/w17/data'
def write(kind, prob, idx, inp, out):
    cat, sub = kind
    for root, content, ext in (('public', inp, 'INP'), ('private', out, 'OUT')):
        d = f'{OUT}/{root}/TUAN 17/{cat}/{sub}/TEST_{prob}/Test{idx:02d}'
        os.makedirs(d, exist_ok=True)
        with open(f'{d}/{prob}.{ext}', 'w', newline='\n') as f: f.write(content.rstrip('\n') + '\n')
def check(name, fast, slow, inp, use_slow, student=None):
    t0 = time.time(); a = fast(inp); tf = time.time() - t0
    if use_slow: assert a.split() == slow(inp).split(), name
    ts = 0
    if student:
        t0 = time.time(); c = student(inp); ts = time.time() - t0; assert a.split() == c.split()
    return a, tf, ts
def grid_txt(g): return "\n".join(" ".join(map(str, r)) for r in g)
R = random.Random(1701); rep = []
# ===== DOICHE 12 nhỏ + 8 lớn =====
for i in range(1, 21):
    if i == 1: inp = "3 4\n1 3 2 1\n4 2 5 3\n2 6 1 4\n"
    else:
        small = i <= 12
        if i == 2: m, n = 1, 1
        elif i == 3: m, n = 1, R.randint(5, 10)
        elif i == 4: m, n = R.randint(5, 10), 1
        elif small: m, n = R.randint(20, 100), R.randint(20, 100)
        else: m, n = R.randint(300, 500), R.randint(300, 500)
        hi = 10**9 if not small else 100
        if i in (5, 13): g = [[7] * n for _ in range(m)]                      # toàn bằng nhau: không có đỉnh
        elif i in (6, 14): g = [[R.randint(1, 3) for _ in range(n)] for _ in range(m)]   # nhiều ô bằng nhau
        else: g = [[R.randint(1, hi) for _ in range(n)] for _ in range(m)]
        inp = f"{m} {n}\n{grid_txt(g)}\n"
    out, tf, _ = check('DOICHE', doiche_fast, doiche_slow, inp, True)
    write(('DE_THI', 'TestCases'), 'DOICHE', i, inp, out); rep.append(('DOICHE', i, len(inp), round(tf, 3), 0))
# ===== VUONDAU 10 nhỏ + 10 lớn =====
for i in range(1, 21):
    if i == 1: inp = "3 4 2\n1 2 3 4\n5 6 7 8\n9 10 11 12\n1 2 2 3\n1 1 3 4\n"
    else:
        small = i <= 10
        if i == 2: m, n, q = 1, 1, 1
        elif small: m, n, q = R.randint(5, 100), R.randint(5, 100), R.randint(1, 100)
        else: m, n, q = R.randint(300, 500), R.randint(300, 500), R.randint(50000, 100000)
        hi = 10**4 if small else 10**9
        g = [[R.randint(0, hi) for _ in range(n)] for _ in range(m)]
        qs = []
        for _ in range(q):
            r = R.random()
            if r < 0.1: qs.append(f"1 1 {m} {n}")
            elif r < 0.2: x = R.randint(1, m); y = R.randint(1, n); qs.append(f"{x} {y} {x} {y}")
            else:
                x1, x2 = sorted((R.randint(1, m), R.randint(1, m))); y1, y2 = sorted((R.randint(1, n), R.randint(1, n)))
                qs.append(f"{x1} {y1} {x2} {y2}")
        inp = f"{m} {n} {q}\n{grid_txt(g)}\n" + "\n".join(qs) + "\n"
    out, tf, ts = check('VUONDAU', vuondau_fast, vuondau_slow, inp, i <= 10, vuondau_student)
    write(('DE_THI', 'TestCases'), 'VUONDAU', i, inp, out); rep.append(('VUONDAU', i, len(inp), round(tf, 3), round(ts, 3)))
# ===== Khởi động =====
for prob, f, s, ex in (('TONGHANG', tonghang_fast, tonghang_slow, "2 3\n1 2 3\n4 5 6\n"), ('BANGCD', bangcd_fast, bangcd_slow, "3 3\n1 2 3\n4 5 6\n7 8 9\n")):
    for i in range(1, 11):
        if i == 1: inp = ex
        else:
            if i == 2: m, n = 1, 1
            elif i == 3: m, n = 1, R.randint(3, 8)
            elif i == 4: m, n = R.randint(3, 8), 1
            elif i <= 6: m, n = R.randint(10, 50), R.randint(10, 50)
            else: m, n = R.randint(200, 500), R.randint(200, 500)
            lo = -10**9 if prob == 'TONGHANG' else 0
            hi = 10**9 if prob == 'TONGHANG' else 10**4
            g = [[R.randint(lo, hi) for _ in range(n)] for _ in range(m)]
            inp = f"{m} {n}\n{grid_txt(g)}\n"
        out, tf, _ = check(prob, f, s, inp, i <= 6)
        write(('TL_TU_HOC', 'BO_TEST'), prob, i, inp, out); rep.append((prob, i, len(inp), round(tf, 3), 0))
for (p, r1, r2, d1, d2) in (('DOICHE', "1-12", "13-20", 6.0, 4.0), ('VUONDAU', "1-10", "11-20", 5.0, 5.0)):
    json.dump({"_ghi_chu": "Cấu hình chấm chuẩn HSG (chế độ Nâng Cao và Luyện Đề). Lấy từ đề PDF; cô có thể sửa tay.", "diemToiDa": 10, "gioiHanThoiGianGiay": 3,
               "subtasks": [{"ten": "Subtask 1", "tests": r1, "diem": d1}, {"ten": "Subtask 2", "tests": r2, "diem": d2}]},
              open(f'{OUT}/private/TUAN 17/DE_THI/TestCases/TEST_{p}/subtasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
for p in ('TONGHANG', 'BANGCD'):
    json.dump({"_ghi_chu": "Bài tự học: không chia subtask.", "diemToiDa": 10, "gioiHanThoiGianGiay": 3},
              open(f'{OUT}/private/TUAN 17/TL_TU_HOC/BO_TEST/TEST_{p}/subtasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
for r in rep:
    if r[1] in (1, 12, 13, 20, 10): print('%-9s %3d %9d %6.3f %6.3f' % r)
