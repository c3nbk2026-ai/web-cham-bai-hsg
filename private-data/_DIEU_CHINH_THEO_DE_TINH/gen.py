import os, random, time, sys, json, string
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from solutions import *
OUT = '/home/claude/adj/data'
def write(w, kind, prob, idx, inp, out):
    sub = 'DE_THI/TestCases' if kind == 'DE' else 'TL_TU_HOC/BO_TEST'
    for root, content, ext in (('public', inp, 'INP'), ('private', out, 'OUT')):
        d = f'{OUT}/{root}/TUAN {w}/{sub}/TEST_{prob}/Test{idx:02d}'
        os.makedirs(d, exist_ok=True)
        with open(f'{d}/{prob}.{ext}', 'w', newline='\n') as f: f.write(content.rstrip('\n') + '\n')
def cfg(w, kind, prob, sec, sub=None):
    d = f'{OUT}/private/TUAN {w}/' + ('DE_THI/TestCases' if kind == 'DE' else 'TL_TU_HOC/BO_TEST') + f'/TEST_{prob}'
    o = {"_ghi_chu": "Cấu hình chấm chuẩn HSG (chế độ Nâng Cao và Luyện Đề). Lấy từ đề PDF; cô có thể sửa tay." if sub else "Bài tự học: không chia subtask.", "diemToiDa": 10, "gioiHanThoiGianGiay": sec}
    if sub: o["subtasks"] = [{"ten": "Subtask 1", "tests": sub[0], "diem": sub[2]}, {"ten": "Subtask 2", "tests": sub[1], "diem": sub[3]}]
    json.dump(o, open(f'{d}/subtasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
def run(w, kind, prob, fast, slow, inputs, slow_ok):
    tmax = 0
    for i, inp in enumerate(inputs, 1):
        t0 = time.time(); a = fast(inp); tmax = max(tmax, time.time() - t0)
        if slow_ok(i): assert a.split() == slow(inp).split(), (prob, i)
        write(w, kind, prob, i, inp, a)
    print(f'{prob:10} {len(inputs)} test, nhanh nhat {tmax:.3f}s | Test01 -> {fast(inputs[0])[:50]!r}')
R = random.Random(2026)
PR = string.ascii_letters + string.digits + ' .,!?-:@#'
# ---------------- TUẦN 6 ----------------
ins = ["3\nDa Lat 2026!\n", "0\nKhong doi\n", "25\nAbc xyz 789\n", "-3\nGd Odw 5359!\n", "26\nzZ9 vong lai\n"]
while len(ins) < 12: ins.append(f"{R.randint(0, 25)}\n{''.join(R.choice(PR) for _ in range(R.randint(50, 1000))).strip()}\n")
ins += ["1000000000000000000\nThanh pho Da Lat 2026\n", "-999999999999999999\nHoa Mai Anh Dao 0123456789\n"]
while len(ins) < 20: ins.append(f"{R.randint(-10**18, 10**18)}\n{''.join(R.choice(PR) for _ in range(R.randint(5*10**4, 10**5))).strip()}\n")
run(6, 'DE', 'MAHOA', mahoa_fast, mahoa_slow, ins, lambda i: i <= 12); cfg(6, 'DE', 'MAHOA', 3, ("1-12", "13-20", 6.0, 4.0))
ins = ["3\nHello, Da Lat!\n", "0\nabc XYZ\n", "25\nAbc Xyz\n", "13\n2026 - nam moi!\n"] + [f"{R.randint(0, 25)}\n{''.join(R.choice(PR) for _ in range(R.randint(100, 10**5))).strip()}\n" for _ in range(6)]
run(6, 'TL', 'DICHCHU', dichchu_fast, dichchu_slow, ins, lambda i: True); cfg(6, 'TL', 'DICHCHU', 3)
ins = ["Da Lat mong mo\n", "1234 !!!\n", "AaAaA\n", "Zz\n"] + [''.join(R.choice(PR) for _ in range(R.randint(100, 10**5))).strip() + "\n" for _ in range(6)]
run(6, 'TL', 'DEMCHU', demchu_fast, demchu_slow, ins, lambda i: True); cfg(6, 'TL', 'DEMCHU', 3)
def pw():
    n = R.randint(4, 16); pool = [string.ascii_uppercase, string.ascii_lowercase, string.digits, '@#$%&*!?_-']
    use = [p for p in pool if R.random() < 0.8] or pool
    return ''.join(R.choice(R.choice(use)) for _ in range(n))
ins = ["3\nDaLat@2026\nabc12345\nTranPhu#1\n", "1\nAa1@aaa\n", "1\nAa1@aaaa\n", "4\nABCDEFG1@\nabcdefg1@\nAbcdefgh@\nAbcdefg12\n"] + [f"{q}\n" + "\n".join(pw() for _ in range(q)) + "\n" for q in [R.randint(10, 100), R.randint(10, 100)] + [R.randint(5000, 20000) for _ in range(4)]]
run(6, 'TL', 'MATKHAU', matkhau_fast, matkhau_slow, ins, lambda i: True); cfg(6, 'TL', 'MATKHAU', 3)
# ---------------- TUẦN 7 ----------------
def rs(n, a): return ''.join(R.choice(a) for _ in range(n))
ins = ["Abcbcadk%\n", "a\n", "abcd\n", "abcccccbbbbdddkh\n", "Aa\n"]
while len(ins) < 12:
    n = R.randint(100, 1000); s = list(rs(n, 'ab' if len(ins) % 2 else 'abcxyz'))
    if R.random() < .6:
        h = rs(R.randint(5, 40), 'abcxyz'); p = h + h[::-1]; i = R.randint(0, n - len(p)); s[i:i+len(p)] = p
    ins.append(''.join(s) + "\n")
ins += ['a' * 200000 + "\n", ('ab' * 100000) + "\n", ('abc' * 66666) + "\n", rs(200000, 'ab') + "\n"]
for _ in range(4):
    h = rs(R.randint(20000, 80000), 'ab'); core = h + R.choice('ab') + h[::-1]; pad = 200000 - len(core)
    ins.append(rs(pad // 2, 'abc') + core + rs(pad - pad // 2, 'abc') + "\n")
run(7, 'DE', 'XAUDOIXUNG', xaudoixung_fast, xaudoixung_slow, ins, lambda i: i <= 12); cfg(7, 'DE', 'XAUDOIXUNG', 3, ("1-12", "13-20", 6.0, 4.0))
# ---------------- TUẦN 8 ----------------
def tri(M):
    while True:
        P = [(R.randint(-M, M), R.randint(-M, M)) for _ in range(3)]
        if cross(*P) != 0: return P
def pts(P, n, M):
    out = []
    for _ in range(n):
        r = R.random()
        if r < 0.15: out.append(R.choice(P))                                   # đỉnh
        elif r < 0.35:                                                         # trên cạnh (điểm nguyên)
            a, b = R.sample(P, 2); g = gcd(abs(b[0] - a[0]), abs(b[1] - a[1])) or 1; k = R.randint(0, g)
            out.append((a[0] + (b[0] - a[0]) // g * k, a[1] + (b[1] - a[1]) // g * k))
        elif r < 0.6:                                                           # gần trọng tâm
            cx = sum(p[0] for p in P) // 3; cy = sum(p[1] for p in P) // 3; d = max(1, M // 50)
            out.append((cx + R.randint(-d, d), cy + R.randint(-d, d)))
        else: out.append((R.randint(-M, M), R.randint(-M, M)))
    return out
def tg_txt(P, Q): return ' '.join(f"{x} {y}" for x, y in P) + f"\n{len(Q)}\n" + "\n".join(f"{x} {y}" for x, y in Q) + "\n"
ins = ["0 0 5 0 0 5\n5\n1 1\n5 0\n2 3\n3 3\n-1 0\n", "0 0 4 0 0 3\n1\n10 10\n", "-2 -2 2 -2 0 2\n3\n0 0\n-2 -2\n0 -2\n"]
while len(ins) < 10: P = tri(1000); ins.append(tg_txt(P, pts(P, R.randint(10, 1000), 1000)))
for k in range(10):
    M = 10**9; P = tri(M) if k % 2 else [(-10**9, -10**9), (10**9, -10**9 + 1), (-10**9 + 1, 10**9)]
    if k == 3: P = [(0, 0), (999999999, 1), (1, 999999998)]                    # tam giác dẹt, dễ sai số thực
    ins.append(tg_txt(P, pts(P, R.randint(50000, 100000), M)))
run(8, 'DE', 'TAMGIAC', tamgiac_fast, tamgiac_slow, ins, lambda i: True); cfg(8, 'DE', 'TAMGIAC', 3, ("1-10", "11-20", 5.0, 5.0))
ins = ["3\n10 2\n255 16\n0 2\n", "1\n1 2\n", "3\n7 8\n35 36 \n15 16\n".replace(" \n", "\n").replace("35 36", "35 3")] 
ins.append("4\n" + "\n".join(f"{10**18} {b}" for b in (2, 7, 10, 16)) + "\n")
for k in range(6):
    q = R.randint(10, 50) if k < 2 else R.randint(5000, 20000)
    ins.append(f"{q}\n" + "\n".join(f"{R.choice([R.randint(0, 100), R.randint(0, 10**18)])} {R.randint(2, 16)}" for _ in range(q)) + "\n")
run(8, 'TL', 'DOICOSO', doicoso_fast, doicoso_slow, ins, lambda i: True); cfg(8, 'TL', 'DOICOSO', 3)
ins = ["0 0 5 0 0 5 1 1\n", "0 0 5 0 0 5 2 3\n", "0 0 5 0 0 5 3 3\n", "0 0 5 0 0 5 0 5\n"]
while len(ins) < 10:
    P = tri(10**9 if len(ins) > 6 else 100); M = pts(P, 1, 10**9 if len(ins) > 6 else 100)[0]
    ins.append(' '.join(f"{x} {y}" for x, y in P + [M]) + "\n")
run(8, 'TL', 'VITRIDIEM', vitridiem_fast, vitridiem_slow, ins, lambda i: True); cfg(8, 'TL', 'VITRIDIEM', 3)
# ---------------- TUẦN 10 ----------------
for _ in range(3000):                                                           # đối chiếu tham lam với QHĐ
    n = R.randint(1, 9); a = [R.choice([-1, 1]) * R.randint(1, 6) for _ in range(n)]
    d = f"{n}\n{' '.join(map(str, a))}\n"; assert xepthap_fast(d) == xepthap_slow(d), d
def xt(n, M): return f"{n}\n{' '.join(str(R.choice([-1, 1]) * R.randint(1, M)) for _ in range(n))}\n"
ins = ["7\n10 -9 8 -8 5 3 -1\n", "1\n-5\n", "4\n5 5 -5 -5\n", "5\n7 -2 6 9 -3\n", "8\n11 -9 2 5 18 17 -15 4\n", xt(1000, 50)] + [xt(R.randint(2 * 10**5, 5 * 10**5), 10**9) for _ in range(4)]
run(10, 'TL', 'XEPTHAP', xepthap_fast, xepthap_slow, ins, lambda i: i <= 6); cfg(10, 'TL', 'XEPTHAP', 4)
TEN = ['An', 'Binh', 'Chi', 'Dung', 'Giang', 'Ha', 'Hoa', 'Khang', 'Lan', 'Linh', 'Mai', 'Minh', 'Nam', 'Ngoc', 'Phuc', 'Quang', 'Son', 'Thao', 'Trang', 'Tuan', 'Uyen', 'Vy']
def hs(n, uniq=True):
    names = set()
    while len(names) < n: names.add(R.choice(TEN) + (str(R.randint(1, 9999)) if n > 20 else ''))
    return f"{n}\n" + "\n".join(f"{t} {R.randint(0, 10)}" for t in names) + "\n"
ins = ["4\nMai 8\nAn 9\nBinh 8\nChi 10\n", "1\nLan 7\n", "3\nTuan 5\nAn 5\nHa 5\n", hs(10)] + [hs(R.randint(50, 200)) for _ in range(2)] + [hs(R.randint(5000, 20000)) for _ in range(4)]
run(10, 'TL', 'SAPXEPHS', sapxephs_fast, sapxephs_slow, ins, lambda i: i <= 6); cfg(10, 'TL', 'SAPXEPHS', 3)
# ---------------- TUẦN 17 ----------------
def sq(n, lo, hi): return f"{n}\n" + "\n".join(" ".join(str(R.randint(lo, hi)) for _ in range(n)) for _ in range(n)) + "\n"
ins = ["3\n1 2 3\n4 5 6\n7 8 9\n", "1\n42\n", "2\n1 2\n3 4\n", sq(4, -9, 9), sq(30, -100, 100), sq(50, 0, 1000)] + [sq(R.randint(300, 500), -10**9, 10**9) for _ in range(4)]
run(17, 'TL', 'XOAYBANG', xoaybang_fast, xoaybang_slow, ins, lambda i: True); cfg(17, 'TL', 'XOAYBANG', 3)
# ---------------- TUẦN 15: LUYTHUA ----------------
ins = ["3\n2 5\n7 2\n10 3\n", "1\n1 1000000000000000000\n", "4\n2 1\n2 2\n2 3\n2 4\n", "3\n999999999 1000000000000000000\n123456789 999999999999999999\n5 1\n"]
for k in range(6):
    q = R.randint(10, 100) if k < 2 else R.randint(5 * 10**4, 10**5)
    ins.append(f"{q}\n" + "\n".join(f"{R.randint(1, 10**9)} {R.choice([R.randint(1, 20), R.randint(1, 10**18)])}" for _ in range(q)) + "\n")
run(15, 'TL', 'LUYTHUA', luythua_fast, luythua_slow, ins, lambda i: True); cfg(15, 'TL', 'LUYTHUA', 3)
