import os, random, time, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from solutions import *

OUT = '/home/claude/w14/data'
def write(kind, prob, idx, inp, out):
    cat, sub = kind
    for root, content, ext in (('public', inp, 'INP'), ('private', out, 'OUT')):
        d = f'{OUT}/{root}/TUAN 14/{cat}/{sub}/TEST_{prob}/Test{idx:02d}'
        os.makedirs(d, exist_ok=True)
        with open(f'{d}/{prob}.{ext}', 'w', newline='\n') as f:
            f.write(content.rstrip('\n') + '\n')

def check(name, fast, slow, inp, use_slow):
    t0 = time.time(); a = fast(inp); tf = time.time() - t0
    if use_slow:
        b = slow(inp)
        assert a.split() == b.split(), f'{name}: lời giải chuẩn và trâu KHÁC NHAU\n{inp[:200]}\n{a[:100]}\n{b[:100]}'
    return a, tf

report = []
# ===================== LOAIHOA (12 nhỏ + 8 lớn) =====================
R = random.Random(1401)
for i in range(1, 21):
    if i == 1:
        inp = "8\n5 3 5 7 3 5 9 3\n"                              # ví dụ: 4 loại; 3 và 5 cùng 3 chậu → lấy 3
    else:
        small = i <= 12
        n = R.randint(1, 10) if i <= 3 else (R.randint(500, 1000) if small else R.randint(50000, 100000))
        kind = i % 4
        if i in (2, 13): a = [R.randint(1, 10**9)] * n               # tất cả cùng một loại
        elif kind == 0: a = [R.randint(1, 10**9) for _ in range(n)]  # hầu như khác nhau hết
        elif kind == 1: a = [R.randint(1, 20) for _ in range(n)]     # ít loại, nhiều trùng
        elif kind == 2: a = [R.choice((10**9, 1, 999999937)) for _ in range(n)]
        else:
            pool = [R.randint(1, 10**9) for _ in range(max(1, n // 50))]
            a = [R.choice(pool) for _ in range(n)]
        if i in (5, 15):                                             # cố tình tạo hòa: 2 loại cùng số lần lớn nhất
            h = n // 2; a = [777] * h + [333] * h + [R.randint(1000, 10**9) for _ in range(n - 2 * h)]; R.shuffle(a)
        inp = f"{n}\n{' '.join(map(str, a))}\n"
    out, tf = check('LOAIHOA', loaihoa_fast, loaihoa_slow, inp, i <= 12)
    write(('DE_THI', 'TestCases'), 'LOAIHOA', i, inp, out); report.append(('LOAIHOA', i, len(inp), round(tf, 3)))

# ===================== GHEPCAP (10 nhỏ + 10 lớn) =====================
R = random.Random(1402)
for i in range(1, 21):
    if i == 1:
        inp = "6 10\n3 7 5 5 2 8\n"                                # ví dụ: (3,7) (5,5) (2,8) → 3
    else:
        small = i <= 10
        n = R.randint(1, 10) if i <= 3 else (R.randint(300, 1000) if small else R.randint(50000, 100000))
        mode = i % 5
        if i in (2, 12):
            v = R.randint(1, 10**9); a = [v] * n; s = 2 * v          # mọi cặp đều hợp lệ: N(N-1)/2
        elif mode == 0:
            a = [R.randint(1, 100) for _ in range(n)]; s = R.randint(2, 200)
        elif mode == 1:
            a = [R.randint(1, 10**9) for _ in range(n)]; s = R.randint(2, 2 * 10**9)   # thường rất ít cặp
        elif mode == 2:
            a = [R.randint(1, 10**9) for _ in range(n)]; s = a[0] + a[-1] if n > 1 else 2
        elif mode == 3:
            a = [R.randint(1, 1000) for _ in range(n)]; s = 1001
        else:
            a = [R.randint(1, 50) * 2 for _ in range(n)]; s = 51     # tổng chẵn, S lẻ → 0 cặp
        inp = f"{n} {s}\n{' '.join(map(str, a))}\n"
    out, tf = check('GHEPCAP', ghepcap_fast, ghepcap_slow, inp, i <= 10)
    write(('DE_THI', 'TestCases'), 'GHEPCAP', i, inp, out); report.append(('GHEPCAP', i, len(inp), round(tf, 3)))

# ===================== Khởi động: DEMSO, CHUNGSO (10 test) =====================
R = random.Random(1403)
for i in range(1, 11):
    if i == 1: inp = "7\n4 2 4 1 2 4 9\n"
    else:
        n = R.randint(1, 10) if i <= 4 else R.randint(1000, 100000)
        hi = 10 if i % 2 == 0 else 10**9
        a = [R.randint(-hi if i % 3 == 0 else 1, hi) for _ in range(n)]
        inp = f"{n}\n{' '.join(map(str, a))}\n"
    out, tf = check('DEMSO', demso_fast, demso_slow, inp, i <= 6)
    write(('TL_TU_HOC', 'BO_TEST'), 'DEMSO', i, inp, out); report.append(('DEMSO', i, len(inp), round(tf, 3)))
for i in range(1, 11):
    if i == 1: inp = "5 4\n1 2 2 3 5\n2 3 3 4\n"
    else:
        n = R.randint(1, 10) if i <= 4 else R.randint(1000, 100000)
        m = R.randint(1, 10) if i <= 4 else R.randint(1000, 100000)
        hi = 20 if i % 2 == 0 else 10**6
        a = [R.randint(1, hi) for _ in range(n)]; b = [R.randint(1, hi) for _ in range(m)]
        if i == 3: b = [x + hi for x in b]                          # không có số chung → 0
        inp = f"{n} {m}\n{' '.join(map(str, a))}\n{' '.join(map(str, b))}\n"
    out, tf = check('CHUNGSO', chungso_fast, chungso_slow, inp, i <= 5)
    write(('TL_TU_HOC', 'BO_TEST'), 'CHUNGSO', i, inp, out); report.append(('CHUNGSO', i, len(inp), round(tf, 3)))

for r in report: print('%-8s %3d %9d %6.3f' % r)
