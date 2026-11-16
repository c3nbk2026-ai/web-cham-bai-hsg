import os, random, time, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from solutions import *

OUT = '/home/claude/w16/data'
def write(kind, prob, idx, inp, out):
    cat, sub = kind
    for root, content, ext in (('public', inp, 'INP'), ('private', out, 'OUT')):
        d = f'{OUT}/{root}/TUAN 16/{cat}/{sub}/TEST_{prob}/Test{idx:02d}'
        os.makedirs(d, exist_ok=True)
        with open(f'{d}/{prob}.{ext}', 'w', newline='\n') as f:
            f.write(content.rstrip('\n') + '\n')
def check(name, fast, slow, inp, use_slow, student=None):
    t0 = time.time(); a = fast(inp); tf = time.time() - t0
    if use_slow:
        b = slow(inp); assert a.split() == b.split(), f'{name}: lời giải chuẩn và trâu KHÁC NHAU'
    ts = 0
    if student:
        t0 = time.time(); c = student(inp); ts = time.time() - t0
        assert a.split() == c.split(), f'{name}: lời giải kiểu HS sai'
    return a, tf, ts
report = []

# ===================== HOMESTAY (12 nhỏ + 8 lớn) =====================
R = random.Random(1601)
for i in range(1, 21):
    if i == 1: inp = "5 4\n500 300 800 300 1200\n250 300 1000 2000\n"      # 0 2 4 5
    else:
        small = i <= 12
        n = R.randint(1, 10) if i <= 3 else (R.randint(500, 1000) if small else R.randint(50000, 100000))
        q = R.randint(1, 10) if i <= 3 else (R.randint(500, 1000) if small else R.randint(50000, 100000))
        M = 10**6 if small else 10**9
        if i == 4: a = [R.randint(1, 5) * 100 for _ in range(n)]          # nhiều giá trùng nhau
        else: a = [R.randint(1, M) for _ in range(n)]
        xs = []
        for _ in range(q):
            r = R.random()
            if r < 0.25: xs.append(R.choice(a))                            # đúng bằng một giá phòng
            elif r < 0.3: xs.append(R.choice([1, M, min(a) - 1 if min(a) > 1 else 1]))
            else: xs.append(R.randint(1, M))
        inp = f"{n} {q}\n{' '.join(map(str, a))}\n{' '.join(map(str, xs))}\n"
    out, tf, ts = check('HOMESTAY', homestay_fast, homestay_slow, inp, i <= 12, homestay_student)
    write(('DE_THI', 'TestCases'), 'HOMESTAY', i, inp, out); report.append(('HOMESTAY', i, len(inp), round(tf, 3), round(ts, 3)))

# ===================== THUYEN (10 nhỏ + 10 lớn) =====================
R = random.Random(1602)
for i in range(1, 21):
    if i == 1: inp = "5 100\n45 60 30 70 55\n"                             # 30+45, 30+55, 30+60, 30+70, 45+55 → 5
    else:
        small = i <= 10
        n = R.randint(1, 10) if i <= 3 else (R.randint(1000, 2000) if small else R.randint(50000, 100000))
        if i == 2: n = 1
        a = [R.randint(20, 120) if R.random() < 0.8 else R.randint(1, 10**6) for _ in range(n)]
        if i in (5, 15): a = [50] * n; s = 100                               # mọi cặp đều đi được
        elif i in (6, 16): s = 1                                            # không cặp nào
        elif i % 3 == 0: s = R.randint(1, 2 * 10**6)
        else: s = R.randint(80, 240)
        inp = f"{n} {s}\n{' '.join(map(str, a))}\n"
    out, tf, ts = check('THUYEN', thuyen_fast, thuyen_slow, inp, i <= 10, thuyen_student)
    write(('DE_THI', 'TestCases'), 'THUYEN', i, inp, out); report.append(('THUYEN', i, len(inp), round(tf, 3), round(ts, 3)))

# ===================== Khởi động: TIMX, DEMX (10 test) =====================
R = random.Random(1603)
for i in range(1, 11):
    if i == 1: inp = "6 4\n2 5 8 12 16 23\n12 2 7 23\n"                  # 4 1 -1 6
    else:
        n = R.randint(1, 10) if i <= 4 else R.randint(10000, 100000)
        q = R.randint(1, 10) if i <= 4 else R.randint(10000, 100000)
        if i == 2: n = 1
        a = sorted(R.sample(range(-10**9, 10**9), n))
        xs = [R.choice(a) if R.random() < 0.5 else R.randint(-10**9, 10**9) for _ in range(q)]
        if i == 3: xs = [a[0] - 1, a[-1] + 1, a[0], a[-1]]; q = 4
        inp = f"{n} {q}\n{' '.join(map(str, a))}\n{' '.join(map(str, xs))}\n"
    out, tf, _ = check('TIMX', timx_fast, timx_slow, inp, i <= 6)
    write(('TL_TU_HOC', 'BO_TEST'), 'TIMX', i, inp, out); report.append(('TIMX', i, len(inp), round(tf, 3), 0))
for i in range(1, 11):
    if i == 1: inp = "8 4\n1 3 3 3 5 7 7 9\n3 7 4 9\n"                     # 3 2 0 1
    else:
        n = R.randint(1, 10) if i <= 4 else R.randint(10000, 100000)
        q = R.randint(1, 10) if i <= 4 else R.randint(10000, 100000)
        V = 5 if i in (2, 5) else (100 if i <= 7 else 10**9)
        a = sorted(R.randint(1, V) for _ in range(n))
        xs = [R.choice(a) if R.random() < 0.6 else R.randint(0, V + 1) for _ in range(q)]
        inp = f"{n} {q}\n{' '.join(map(str, a))}\n{' '.join(map(str, xs))}\n"
    out, tf, _ = check('DEMX', demx_fast, demx_slow, inp, i <= 4)
    write(('TL_TU_HOC', 'BO_TEST'), 'DEMX', i, inp, out); report.append(('DEMX', i, len(inp), round(tf, 3), 0))

cfgs = {('DE_THI', 'TestCases', 'HOMESTAY'): ("1-12", "13-20", 6.0, 4.0), ('DE_THI', 'TestCases', 'THUYEN'): ("1-10", "11-20", 5.0, 5.0)}
for (cat, sub, p), (r1, r2, d1, d2) in cfgs.items():
    json.dump({"_ghi_chu": "Cấu hình chấm chuẩn HSG (chế độ Nâng Cao và Luyện Đề). Lấy từ đề PDF; cô có thể sửa tay.", "diemToiDa": 10, "gioiHanThoiGianGiay": 3,
               "subtasks": [{"ten": "Subtask 1", "tests": r1, "diem": d1}, {"ten": "Subtask 2", "tests": r2, "diem": d2}]},
              open(f'{OUT}/private/TUAN 16/{cat}/{sub}/TEST_{p}/subtasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
for p in ('TIMX', 'DEMX'):
    json.dump({"_ghi_chu": "Bài tự học: không chia subtask.", "diemToiDa": 10, "gioiHanThoiGianGiay": 3},
              open(f'{OUT}/private/TUAN 16/TL_TU_HOC/BO_TEST/TEST_{p}/subtasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
for r in report: print('%-8s %3d %9d %6.3f %6.3f' % r)
