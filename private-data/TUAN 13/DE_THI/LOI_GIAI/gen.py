import os, random, time, json, sys
sys.path.insert(0, os.path.dirname(__file__))
from solutions import *

OUT = '/home/claude/w13/data'
def write(kind, prob, idx, inp, out):
    # kind: ('DE_THI','TestCases') hoặc ('TL_TU_HOC','BO_TEST')
    cat, sub = kind
    for root, content, ext in (('public', inp, 'INP'), ('private', out, 'OUT')):
        d = f'{OUT}/{root}/TUAN 13/{cat}/{sub}/TEST_{prob}/Test{idx:02d}'
        os.makedirs(d, exist_ok=True)
        with open(f'{d}/{prob}.{ext}', 'w', newline='\n') as f:
            f.write(content.rstrip('\n') + '\n')

def check(name, fast, slow, inp, use_slow):
    t0 = time.time(); a = fast(inp); tf = time.time() - t0
    if use_slow:
        b = slow(inp)
        assert a.split() == b.split(), f'{name}: lời giải chuẩn và trâu KHÁC NHAU'
    return a, tf

report = []
# ===================== LUONGMUA (20 test, 12 nhỏ + 8 lớn) =====================
R = random.Random(1301)
for i in range(1, 21):
    if i == 1:
        inp = "7 3\n12 0 35 8 0 20 5\n1 3\n4 7\n2 2\n"          # ví dụ trong đề
    else:
        small = i <= 12
        n = R.randint(1, 15) if i <= 3 else (R.randint(500, 1000) if small else R.randint(50000, 100000))
        q = R.randint(1, 15) if i <= 3 else (R.randint(500, 1000) if small else R.randint(50000, 100000))
        hi = [0, 10, 1000, 10**9][min(3, i % 4)] if i not in (2, 13) else 0   # test 2,13: toàn số 0
        a = [R.randint(0, hi) for _ in range(n)]
        qs = []
        for j in range(q):
            r = R.random()
            if r < 0.1: l, rr = 1, n                     # cả dãy
            elif r < 0.2: l = rr = R.randint(1, n)       # 1 ngày
            else:
                l, rr = sorted((R.randint(1, n), R.randint(1, n)))
            qs.append(f"{l} {rr}")
        inp = f"{n} {q}\n{' '.join(map(str, a))}\n" + "\n".join(qs) + "\n"
    out, tf = check('LUONGMUA', luongmua_fast, luongmua_slow, inp, i <= 12)
    write(('DE_THI', 'TestCases'), 'LUONGMUA', i, inp, out)
    report.append(('LUONGMUA', i, len(inp), round(tf, 3)))

# ===================== THUNGDAU (20 test, 10 nhỏ + 10 lớn) =====================
R = random.Random(1302)
for i in range(1, 21):
    if i == 1:
        inp = "5 3\n1 2 3 4 5\n"                          # ví dụ trong đề: đáp án 7
    else:
        small = i <= 10
        n = R.randint(1, 10) if i <= 3 else (R.randint(300, 1000) if small else R.randint(50000, 100000))
        mode = i % 5
        if mode == 0: k = 1                               # K = 1: mọi đoạn đều chia hết
        elif mode == 1: k = 10**9                         # K rất lớn
        elif mode == 2: k = R.randint(2, 10)
        elif mode == 3: k = R.randint(11, 1000)
        else: k = R.randint(2, 50)
        if i in (6, 16):
            a = [k * R.randint(1, 1000) for _ in range(n)]   # mọi phần tử chia hết cho K
        else:
            a = [R.randint(1, 10**9) for _ in range(n)]
        inp = f"{n} {k}\n{' '.join(map(str, a))}\n"
    out, tf = check('THUNGDAU', thungdau_fast, thungdau_slow, inp, i <= 10)
    write(('DE_THI', 'TestCases'), 'THUNGDAU', i, inp, out)
    report.append(('THUNGDAU', i, len(inp), round(tf, 3)))

# ===================== Khởi động: CONGDON, TONGKMAX (10 test) =====================
R = random.Random(1303)
for i in range(1, 11):
    if i == 1: inp = "5\n3 1 4 1 5\n"
    else:
        n = R.randint(1, 10) if i <= 4 else R.randint(1000, 100000)
        a = [R.randint(-1000, 1000) if i % 3 == 0 else R.randint(0, 10**9) for _ in range(n)]
        inp = f"{n}\n{' '.join(map(str, a))}\n"
    out, tf = check('CONGDON', congdon_fast, congdon_slow, inp, i <= 6)
    write(('TL_TU_HOC', 'BO_TEST'), 'CONGDON', i, inp, out)
    report.append(('CONGDON', i, len(inp), round(tf, 3)))
for i in range(1, 11):
    if i == 1: inp = "7 3\n2 -1 4 5 -3 6 1\n"
    else:
        n = R.randint(1, 10) if i <= 4 else R.randint(1000, 100000)
        k = 1 if i == 2 else (n if i == 3 else R.randint(1, n))
        a = [R.randint(-10**6, 10**6) if i % 2 == 0 else R.randint(-1000, 1000) for _ in range(n)]
        inp = f"{n} {k}\n{' '.join(map(str, a))}\n"
    out, tf = check('TONGKMAX', tongkmax_fast, tongkmax_slow, inp, i <= 6)
    write(('TL_TU_HOC', 'BO_TEST'), 'TONGKMAX', i, inp, out)
    report.append(('TONGKMAX', i, len(inp), round(tf, 3)))

for r in report: print(*r)
