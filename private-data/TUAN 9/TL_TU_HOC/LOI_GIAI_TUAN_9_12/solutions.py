"""Lời giải chuẩn và lời giải trâu (đối chứng) cho 8 bài khởi động Tuần 9–12."""
import re

# ---------- Tuần 9: TACHSOAM — bóc tách số nguyên (có thể âm), in số lượng và tổng ----------
def tachsoam_fast(data):
    s = data.rstrip('\n')
    nums = [int(x) for x in re.findall(r'-?\d+', s)]
    return f"{len(nums)}\n{sum(nums)}"

def tachsoam_slow(data):
    s = data.rstrip('\n'); nums = []; i = 0
    while i < len(s):
        if s[i].isdigit():
            j = i
            while j < len(s) and s[j].isdigit(): j += 1
            v = int(s[i:j])
            if i > 0 and s[i - 1] == '-': v = -v
            nums.append(v); i = j
        else: i += 1
    return f"{len(nums)}\n{sum(nums)}"

# ---------- Tuần 9: DOANDAI — đoạn liên tiếp dài nhất có tổng <= K ----------
def doandai_fast(data):
    t = data.split(); n, k = int(t[0]), int(t[1]); a = list(map(int, t[2:2 + n]))
    best = 0; s = 0; l = 0
    for r in range(n):
        s += a[r]
        while s > k: s -= a[l]; l += 1
        best = max(best, r - l + 1)
    return str(best)

def doandai_slow(data):
    t = data.split(); n, k = int(t[0]), int(t[1]); a = list(map(int, t[2:2 + n])); best = 0
    for l in range(n):
        s = 0
        for r in range(l, n):
            s += a[r]
            if s > k: break
            best = max(best, r - l + 1)
    return str(best)

# ---------- Tuần 10: KTARM — kiểm tra số Armstrong ----------
def is_arm(x):
    s = str(x); d = len(s)
    return sum(int(c) ** d for c in s) == x
def ktarm_fast(data):
    t = data.split(); q = int(t[0])
    return "\n".join("YES" if is_arm(int(x)) else "NO" for x in t[1:1 + q])
def ktarm_slow(data):
    t = data.split(); q = int(t[0]); res = []
    for x in map(int, t[1:1 + q]):
        y, digs = x, []
        while y > 0: digs.append(y % 10); y //= 10
        tot = 0
        for c in digs:
            p = 1
            for _ in range(len(digs)): p *= c
            tot += p
        res.append("YES" if tot == x else "NO")
    return "\n".join(res)

# ---------- Tuần 10: MUAKEO — mua được nhiều gói nhất với ngân sách B (tham lam) ----------
def muakeo_fast(data):
    t = data.split(); n, b = int(t[0]), int(t[1]); a = sorted(map(int, t[2:2 + n]))
    cnt = 0; spent = 0
    for v in a:
        if spent + v > b: break
        spent += v; cnt += 1
    return f"{cnt} {spent}"
def muakeo_slow(data):
    from itertools import combinations
    t = data.split(); n, b = int(t[0]), int(t[1]); a = list(map(int, t[2:2 + n]))
    for k in range(n, -1, -1):
        best = None
        for c in combinations(a, k):
            s = sum(c)
            if s <= b and (best is None or s < best): best = s
        if best is not None: return f"{k} {best}"

# ---------- Tuần 11: NENXAU — nén RLE ----------
def nenxau_fast(data):
    s = data.strip(); out = []; i = 0
    while i < len(s):
        j = i
        while j < len(s) and s[j] == s[i]: j += 1
        out.append(f"{j - i}{s[i]}"); i = j
    return "".join(out)
def nenxau_slow(data):
    from itertools import groupby
    return "".join(f"{len(list(g))}{c}" for c, g in groupby(data.strip()))

# ---------- Tuần 11: GIAINEN — giải nén RLE ----------
def giainen_fast(data):
    return "".join(c * int(k) for k, c in re.findall(r'(\d+)([A-Z])', data.strip()))
def giainen_slow(data):
    s = data.strip(); out = []; num = 0
    for ch in s:
        if ch.isdigit(): num = num * 10 + int(ch)
        else: out.append(ch * num); num = 0
    return "".join(out)

# ---------- Tuần 12: KTFIBO — kiểm tra số Fibonacci (x <= 10^18) ----------
def ktfibo_fast(data):
    t = data.split(); q = int(t[0]); F = {0, 1}; a, b = 1, 1
    while b <= 10**18: F.add(b); a, b = b, a + b
    return "\n".join("YES" if int(x) in F else "NO" for x in t[1:1 + q])
def ktfibo_slow(data):
    from math import isqrt
    t = data.split(); q = int(t[0]); res = []
    for x in map(int, t[1:1 + q]):
        ok = any(isqrt(v) ** 2 == v for v in (5 * x * x + 4, 5 * x * x - 4) if v >= 0)
        res.append("YES" if ok else "NO")
    return "\n".join(res)

# ---------- Tuần 12: DEMCHUYEN — số chuyến xe ít nhất khi chở các kiện liên tiếp, tải trọng K ----------
def demchuyen_fast(data):
    t = data.split(); n, k = int(t[0]), int(t[1]); a = list(map(int, t[2:2 + n]))
    trips = 1; cur = 0
    for v in a:
        if cur + v > k: trips += 1; cur = 0
        cur += v
    return str(trips)
def demchuyen_slow(data):
    t = data.split(); n, k = int(t[0]), int(t[1]); a = list(map(int, t[2:2 + n]))
    INF = float('inf'); f = [0] + [INF] * n          # quy hoạch động O(N^2) để đối chứng
    for i in range(1, n + 1):
        s = 0
        for j in range(i, 0, -1):
            s += a[j - 1]
            if s > k: break
            f[i] = min(f[i], f[j - 1] + 1)
    return str(f[n])
