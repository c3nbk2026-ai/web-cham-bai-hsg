import os, random, sys, json, string
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from solutions import *
OUT = '/home/claude/w912/data'
def write(week, prob, idx, inp, out):
    for root, content, ext in (('public', inp, 'INP'), ('private', out, 'OUT')):
        d = f'{OUT}/{root}/TUAN {week}/TL_TU_HOC/BO_TEST/TEST_{prob}/Test{idx:02d}'
        os.makedirs(d, exist_ok=True)
        with open(f'{d}/{prob}.{ext}', 'w', newline='\n') as f: f.write(content.rstrip('\n') + '\n')
def run(week, prob, fast, slow, inputs, slow_ok):
    for i, inp in enumerate(inputs, 1):
        a = fast(inp)
        if slow_ok(i): assert a.split() == slow(inp).split(), (prob, i)
        write(week, prob, i, inp, a)
    json.dump({"_ghi_chu": "Bài tự học: không chia subtask.", "diemToiDa": 10, "gioiHanThoiGianGiay": 3},
              open(f'{OUT}/private/TUAN {week}/TL_TU_HOC/BO_TEST/TEST_{prob}/subtasks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(prob, 'ok', fast(inputs[0]).replace('\n', ' | ')[:60])
R = random.Random(912)
L = string.ascii_lowercase

# ---- TACHSOAM
def mix(n, neg=0.4, maxv=10**4):
    parts = []
    while sum(map(len, parts)) < n:
        parts.append(''.join(R.choice(L) for _ in range(R.randint(1, 4))))
        v = str(R.randint(0, maxv)); parts.append(('-' if R.random() < neg else '') + v)
    return ''.join(parts)
ins = ["abc-15xyz-3def12k24m-15p-27\n", "khongcoso\n", "-7\n", "a-b5c--8d0\n", "2026\n"] + [mix(R.randint(10**4, 10**5), maxv=10**9) + "\n" for _ in range(5)]
run(9, 'TACHSOAM', tachsoam_fast, tachsoam_slow, ins, lambda i: True)
# ---- DOANDAI
def dd(n, k, hi): return f"{n} {k}\n{' '.join(str(R.randint(1, hi)) for _ in range(n))}\n"
ins = ["6 1000\n400 300 200 500 200 100\n", "1 5\n10\n", "4 100\n10 20 30 40\n", "5 7\n8 9 7 10 7\n"] + [dd(R.randint(500, 2000), R.randint(100, 5000), 500) for _ in range(2)] + [dd(R.randint(50000, 100000), R.randint(10**5, 10**9), 10**6) for _ in range(4)]
run(9, 'DOANDAI', doandai_fast, doandai_slow, ins, lambda i: i <= 6)
# ---- KTARM
arm = [x for x in range(1, 10**6) if is_arm(x)] + [4679307774, 32164049650, 32164049651, 40028394225, 42678290603, 44708635679, 49388550606, 82693916578, 94204591914]
def qa(q, hi): return f"{q}\n" + "\n".join(str(R.choice(arm) if R.random() < 0.3 else R.randint(1, hi)) for _ in range(q)) + "\n"
ins = ["5\n153\n45\n370\n7\n100\n", "3\n1\n10\n9\n", "4\n9474\n9475\n4679307774\n1000000000000\n", qa(10, 1000)] + [qa(R.randint(10**4, 10**5), 10**12) for _ in range(6)]
run(10, 'KTARM', ktarm_fast, ktarm_slow, ins, lambda i: True)
# ---- MUAKEO
def mk(n, b, hi): return f"{n} {b}\n{' '.join(str(R.randint(1, hi)) for _ in range(n))}\n"
ins = ["5 50\n20 10 35 5 15\n", "1 3\n5\n", "4 100\n25 25 25 25\n", mk(8, 60, 30)] + [mk(R.randint(50000, 100000), R.randint(10**6, 10**12), 10**9) for _ in range(6)]
run(10, 'MUAKEO', muakeo_fast, muakeo_slow, ins, lambda i: i <= 4)
# ---- NENXAU
def runs(n, alpha='ABCDE', mx=12):
    s = []
    while len(s) < n: s += [R.choice(alpha)] * R.randint(1, mx)
    return ''.join(s[:n])
ins = ["AAAABBBCCDAA\n", "Z\n", "ABCDEF\n", "Q" * 1000 + "\n"] + [runs(R.randint(10**4, 10**5)) + "\n" for _ in range(6)]
run(11, 'NENXAU', nenxau_fast, nenxau_slow, ins, lambda i: True)
# ---- GIAINEN
ins = ["4A3B2C1D2A\n", "1Z\n", "12K3L\n", "100A1B\n"] + [nenxau_fast(runs(R.randint(10**4, 10**5), string.ascii_uppercase, 30)) + "\n" for _ in range(6)]
run(11, 'GIAINEN', giainen_fast, giainen_slow, ins, lambda i: True)
# ---- KTFIBO
F = [1, 1]
while F[-1] <= 10**18: F.append(F[-1] + F[-2])
F = F[:-1]
def qf(q, hi): return f"{q}\n" + "\n".join(str(R.choice(F) if R.random() < 0.3 else (R.choice(F) + R.choice([-1, 1]) if R.random() < 0.3 else R.randint(1, hi))) for _ in range(q)) + "\n"
ins = ["5\n13\n8\n20\n55\n4\n", "3\n1\n2\n3\n", f"3\n{F[-1]}\n{F[-1] + 1}\n{10**18}\n", qf(10, 100)] + [qf(R.randint(10**4, 10**5), 10**18) for _ in range(6)]
run(12, 'KTFIBO', ktfibo_fast, ktfibo_slow, ins, lambda i: True)
# ---- DEMCHUYEN
def dc(n, k):
    return f"{n} {k}\n{' '.join(str(R.randint(1, k)) for _ in range(n))}\n"
ins = ["5 600\n100 200 300 400 500\n", "1 10\n10\n", "4 5\n5 5 5 5\n", "6 1000\n1 1 1 1 1 1\n"] + [dc(R.randint(500, 1500), R.randint(10, 1000)) for _ in range(2)] + [dc(R.randint(50000, 100000), R.randint(10**3, 10**9)) for _ in range(4)]
run(12, 'DEMCHUYEN', demchuyen_fast, demchuyen_slow, ins, lambda i: i <= 6)
