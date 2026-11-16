import os, random, time, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from solutions import *

OUT = '/home/claude/w15/data'
def write(kind, prob, idx, inp, out):
    cat, sub = kind
    for root, content, ext in (('public', inp, 'INP'), ('private', out, 'OUT')):
        d = f'{OUT}/{root}/TUAN 15/{cat}/{sub}/TEST_{prob}/Test{idx:02d}'
        os.makedirs(d, exist_ok=True)
        with open(f'{d}/{prob}.{ext}', 'w', newline='\n') as f:
            f.write(content.rstrip('\n') + '\n')
def check(name, fast, slow, inp, use_slow):
    t0 = time.time(); a = fast(inp); tf = time.time() - t0
    if use_slow:
        b = slow(inp); assert a.split() == b.split(), f'{name}: lời giải chuẩn và trâu KHÁC NHAU'
    return a, tf

P = sieve(10**6); primes = [i for i in range(2, 10**6 + 1) if P[i]]
report = []
# ===================== VEMAYMAN (12 nhỏ + 8 lớn) =====================
R = random.Random(1501)
for i in range(1, 21):
    if i == 1: inp = "3\n1 10\n11 20\n7 7\n"                        # ví dụ: 4, 4, 1
    else:
        small = i <= 12
        q = R.randint(1, 10) if small else R.randint(50000, 100000)
        M = 10**4 if small else 10**6
        qs = []
        for _ in range(q):
            x = R.random()
            if i == 2: l = r = R.choice([1, 2, 3, 4])                  # biên: 1 không phải SNT, 2 là SNT
            elif x < 0.1: l, r = 1, M
            elif x < 0.2: l = r = R.choice(primes[:1229 if small else len(primes)])   # đúng 1 số nguyên tố
            else: l, r = sorted((R.randint(1, M), R.randint(1, M)))
            qs.append(f"{l} {r}")
        inp = f"{q}\n" + "\n".join(qs) + "\n"
    out, tf = check('VEMAYMAN', vemayman_fast, vemayman_slow, inp, i <= 12)
    write(('DE_THI', 'TestCases'), 'VEMAYMAN', i, inp, out); report.append(('VEMAYMAN', i, len(inp), round(tf, 3)))

# ===================== BAUOC (10 nhỏ + 10 lớn) =====================
R = random.Random(1502)
small_p = [p for p in primes if p <= 1000]
for i in range(1, 21):
    if i == 1: inp = "6\n4 9 12 25 1 49\n"                              # 4, 9, 25, 49 có đúng 3 ước → 4; tổng 87
    else:
        small = i <= 10
        n = R.randint(1, 10) if i <= 3 else (R.randint(500, 1000) if small else R.randint(50000, 100000))
        pool = small_p if small else primes
        AMAX = 10**6 if small else 10**12
        a = []
        for _ in range(n):
            x = R.random()
            if x < 0.25: v = R.choice(pool) ** 2                         # đúng 3 ước
            elif x < 0.35: v = R.choice(pool) ** 3 if R.choice(pool) ** 3 <= AMAX else 1   # 4 ước
            elif x < 0.45:
                c = R.randint(2, isqrt(AMAX)); v = c * c                 # số chính phương bất kỳ (thường KHÔNG có 3 ước)
            elif x < 0.5: v = 1
            else: v = R.randint(1, AMAX)
            a.append(min(v, AMAX))
        if i == 20: a[:3] = [999983 ** 2, 10**12, 999979 ** 2]           # biên: số nguyên tố lớn nhất dưới 10^6
        inp = f"{n}\n{' '.join(map(str, a))}\n"
    out, tf = check('BAUOC', bauoc_fast, bauoc_slow, inp, i <= 10)
    write(('DE_THI', 'TestCases'), 'BAUOC', i, inp, out); report.append(('BAUOC', i, len(inp), round(tf, 3)))

# ===================== Khởi động: SANGNT, UOCNT (10 test) =====================
R = random.Random(1503)
ns = [30, 1, 2, 10, 100, 997, 10**4, 123456, 999999, 10**6]
for i, n in enumerate(ns, 1):
    inp = f"{n}\n"
    out, tf = check('SANGNT', sangnt_fast, sangnt_slow, inp, n <= 10**4)
    write(('TL_TU_HOC', 'BO_TEST'), 'SANGNT', i, inp, out); report.append(('SANGNT', i, len(inp), round(tf, 3)))
for i in range(1, 11):
    if i == 1: inp = "5\n12 7 1 30 64\n"                                  # 2 1 0 3 1
    else:
        q = R.randint(1, 10) if i <= 4 else R.randint(1000, 100000)
        xs = [R.randint(1, 2 * 10**5) for _ in range(q)]
        if i == 2: xs = [1] * q
        if i == 3: xs = [200000, 199999, 30030, 2 * 3 * 5 * 7 * 11 * 13][:q] or [1]; q = len(xs)
        inp = f"{q}\n{' '.join(map(str, xs))}\n"
    out, tf = check('UOCNT', uocnt_fast, uocnt_slow, inp, i <= 6)
    write(('TL_TU_HOC', 'BO_TEST'), 'UOCNT', i, inp, out); report.append(('UOCNT', i, len(inp), round(tf, 3)))

# subtasks.json (đề thi) + giới hạn thời gian cho bài tự học (sàng tới 10^6 cần thêm thời gian)
cfgs = {('DE_THI', 'TestCases', 'VEMAYMAN'): ("1-12", "13-20", 6.0, 4.0), ('DE_THI', 'TestCases', 'BAUOC'): ("1-10", "11-20", 5.0, 5.0)}
for (cat, sub, p), (r1, r2, d1, d2) in cfgs.items():
    json.dump({"_ghi_chu": "Cấu hình chấm chuẩn HSG (chế độ Nâng Cao và Luyện Đề). Lấy từ đề PDF; cô có thể sửa tay.", "diemToiDa": 10, "gioiHanThoiGianGiay": 4,
               "subtasks": [{"ten": "Subtask 1", "tests": r1, "diem": d1}, {"ten": "Subtask 2", "tests": r2, "diem": d2}]},
              open(f'{OUT}/private/TUAN 15/{cat}/{sub}/TEST_{p}/subtasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
for p in ('SANGNT', 'UOCNT'):
    json.dump({"_ghi_chu": "Bài tự học: không chia subtask; nới giới hạn thời gian vì có sàng.", "diemToiDa": 10, "gioiHanThoiGianGiay": 4},
              open(f'{OUT}/private/TUAN 15/TL_TU_HOC/BO_TEST/TEST_{p}/subtasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
for r in report: print('%-8s %3d %9d %6.3f' % r)
