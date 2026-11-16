"""Lời giải chuẩn và lời giải trâu (đối chứng) cho các bài điều chỉnh Tuần 6, 7, 8, 10, 17."""
from math import gcd

def L0(data): return data.split('\n')[0].rstrip('\r')

# ===================== TUẦN 6 =====================
def shift(c, k):
    if 'A' <= c <= 'Z': return chr((ord(c) - 65 + k) % 26 + 65)
    if 'a' <= c <= 'z': return chr((ord(c) - 97 + k) % 26 + 97)
    if '0' <= c <= '9': return chr((ord(c) - 48 + k) % 10 + 48)
    return c
def mahoa_fast(data):
    lines = data.split('\n'); k = int(lines[0]); s = lines[1].rstrip('\r')
    return ''.join(shift(c, k) for c in s)
def mahoa_slow(data):                       # dịch từng bước một (chỉ dùng khi |K| nhỏ)
    lines = data.split('\n'); k = int(lines[0]); s = lines[1].rstrip('\r'); out = []
    for c in s:
        for _ in range(abs(k)): c = shift(c, 1 if k > 0 else -1)
        out.append(c)
    return ''.join(out)

def dichchu_fast(data):
    lines = data.split('\n'); k = int(lines[0]); s = lines[1].rstrip('\r')
    return ''.join(shift(c, k) if c.isalpha() and c.isascii() else c for c in s)
def dichchu_slow(data):
    lines = data.split('\n'); k = int(lines[0]); s = lines[1].rstrip('\r')
    up = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; lo = up.lower(); r = ''
    for c in s:
        if c in up: r += up[(up.index(c) + k) % 26]
        elif c in lo: r += lo[(lo.index(c) + k) % 26]
        else: r += c
    return r

def demchu_fast(data):
    cnt = [0] * 26
    for c in L0(data).lower():
        if 'a' <= c <= 'z': cnt[ord(c) - 97] += 1
    res = [f"{chr(97 + i)} {cnt[i]}" for i in range(26) if cnt[i]]
    return "\n".join(res) if res else "-1"
def demchu_slow(data):
    s = L0(data).lower(); res = []
    for c in 'abcdefghijklmnopqrstuvwxyz':
        if s.count(c): res.append(f"{c} {s.count(c)}")
    return "\n".join(res) if res else "-1"

def strong(p):
    return (len(p) >= 8 and any('A' <= c <= 'Z' for c in p) and any('a' <= c <= 'z' for c in p)
            and any('0' <= c <= '9' for c in p) and any(not (c.isascii() and c.isalnum()) for c in p))
def matkhau_fast(data):
    lines = data.split('\n'); q = int(lines[0])
    return "\n".join("YES" if strong(lines[1 + i].rstrip('\r')) else "NO" for i in range(q))
def matkhau_slow(data):
    lines = data.split('\n'); q = int(lines[0]); out = []
    for i in range(q):
        p = lines[1 + i].rstrip('\r'); h = t = so = dac = 0
        for c in p:
            if c.isupper(): h = 1
            elif c.islower(): t = 1
            elif c.isdigit(): so = 1
            else: dac = 1
        out.append("YES" if len(p) >= 8 and h and t and so and dac else "NO")
    return "\n".join(out)

# ===================== TUẦN 7 =====================
def xaudoixung_fast(data):                  # Manacher O(n)
    s = L0(data).strip()
    t = '^#' + '#'.join(s) + '#$'; n = len(t); p = [0] * n; c = r = 0
    for i in range(1, n - 1):
        if i < r: p[i] = min(r - i, p[2 * c - i])
        while t[i + p[i] + 1] == t[i - p[i] - 1]: p[i] += 1
        if i + p[i] > r: c, r = i, i + p[i]
    return str(max(p))
def xaudoixung_slow(data):                  # mở rộng từ tâm O(n^2)
    s = L0(data).strip(); best = 0
    for c in range(len(s)):
        for l, r in ((c, c), (c, c + 1)):
            while l >= 0 and r < len(s) and s[l] == s[r]: l -= 1; r += 1
            best = max(best, r - l - 1)
    return str(best)

# ===================== TUẦN 8 =====================
def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
def on_seg(p, a, b):
    return cross(a, b, p) == 0 and min(a[0], b[0]) <= p[0] <= max(a[0], b[0]) and min(a[1], b[1]) <= p[1] <= max(a[1], b[1])
def vitri(A, B, C, M):
    if on_seg(M, A, B) or on_seg(M, B, C) or on_seg(M, C, A): return 1
    d1, d2, d3 = cross(A, B, M), cross(B, C, M), cross(C, A, M)
    return 2 if (d1 > 0 and d2 > 0 and d3 > 0) or (d1 < 0 and d2 < 0 and d3 < 0) else 0
def tamgiac_fast(data):
    t = list(map(int, data.split())); A, B, C = (t[0], t[1]), (t[2], t[3]), (t[4], t[5]); n = t[6]
    tong = canh = 0
    for i in range(n):
        v = vitri(A, B, C, (t[7 + 2 * i], t[8 + 2 * i]))
        if v: tong += 1
        if v == 1: canh += 1
    return f"{tong}\n{canh}"
def tamgiac_slow(data):                      # so sánh diện tích (nhân 2, số nguyên)
    t = list(map(int, data.split())); A, B, C = (t[0], t[1]), (t[2], t[3]), (t[4], t[5]); n = t[6]
    S = abs(cross(A, B, C)); tong = canh = 0
    for i in range(n):
        M = (t[7 + 2 * i], t[8 + 2 * i])
        s1, s2, s3 = abs(cross(M, A, B)), abs(cross(M, B, C)), abs(cross(M, C, A))
        if s1 + s2 + s3 == S:
            tong += 1
            if s1 == 0 or s2 == 0 or s3 == 0: canh += 1
    return f"{tong}\n{canh}"

DIG = '0123456789ABCDEF'
def doicoso_fast(data):
    t = data.split(); q = int(t[0]); out = []
    for i in range(q):
        n, b = int(t[1 + 2 * i]), int(t[2 + 2 * i]); s = ''
        if n == 0: s = '0'
        while n: s = DIG[n % b] + s; n //= b
        out.append(s)
    return "\n".join(out)
def doicoso_slow(data):
    t = data.split(); q = int(t[0]); out = []
    for i in range(q):
        n, b = int(t[1 + 2 * i]), int(t[2 + 2 * i])
        if b == 2: out.append(bin(n)[2:])
        elif b == 8: out.append(oct(n)[2:])
        elif b == 16: out.append(hex(n)[2:].upper())
        else:
            ds = []
            while True:
                ds.append(DIG[n % b]); n //= b
                if n == 0: break
            out.append(''.join(reversed(ds)))
    return "\n".join(out)

NAME = {0: 'NGOAI', 1: 'TREN CANH', 2: 'TRONG'}
def vitridiem_fast(data):
    t = list(map(int, data.split())); return NAME[vitri((t[0], t[1]), (t[2], t[3]), (t[4], t[5]), (t[6], t[7]))]
def vitridiem_slow(data):
    t = list(map(int, data.split())); A, B, C, M = (t[0], t[1]), (t[2], t[3]), (t[4], t[5]), (t[6], t[7])
    S = abs(cross(A, B, C)); s = [abs(cross(M, A, B)), abs(cross(M, B, C)), abs(cross(M, C, A))]
    if sum(s) != S: return 'NGOAI'
    return 'TREN CANH' if 0 in s else 'TRONG'

# ===================== TUẦN 10 =====================
def xepthap_fast(data):
    t = data.split(); n = int(t[0]); a = sorted(((abs(int(x)), int(x) > 0) for x in t[1:1 + n]), reverse=True)
    best = 0
    for start in (True, False):
        need, last, cnt = start, None, 0
        for w, red in a:
            if red == need and (last is None or w < last):
                cnt += 1; last = w; need = not need
        best = max(best, cnt)
    return str(best)
def xepthap_slow(data):                     # quy hoạch động O(n^2) trên dãy đã sắp xếp
    t = data.split(); n = int(t[0]); a = sorted(((abs(int(x)), int(x) > 0) for x in t[1:1 + n]), reverse=True)
    f = [1] * n
    for i in range(n):
        for j in range(i):
            if a[j][0] > a[i][0] and a[j][1] != a[i][1]: f[i] = max(f[i], f[j] + 1)
    return str(max(f) if f else 0)

def sapxephs_fast(data):
    lines = data.split('\n'); n = int(lines[0]); hs = []
    for i in range(n):
        ten, diem = lines[1 + i].split(); hs.append((ten, int(diem)))
    hs.sort(key=lambda x: (-x[1], x[0]))
    return "\n".join(f"{t} {d}" for t, d in hs)
def sapxephs_slow(data):
    lines = data.split('\n'); n = int(lines[0]); hs = []
    for i in range(n):
        ten, diem = lines[1 + i].split(); hs.append([ten, int(diem)])
    for i in range(n):                       # sắp xếp nổi bọt
        for j in range(n - 1 - i):
            a, b = hs[j], hs[j + 1]
            if a[1] < b[1] or (a[1] == b[1] and a[0] > b[0]): hs[j], hs[j + 1] = b, a
    return "\n".join(f"{t} {d}" for t, d in hs)

# ===================== TUẦN 17 =====================
def xoaybang_fast(data):
    t = data.split(); n = int(t[0]); a = [[int(t[1 + i * n + j]) for j in range(n)] for i in range(n)]
    c1 = sum(a[i][i] for i in range(n)); c2 = sum(a[i][n - 1 - i] for i in range(n))
    rot = [[a[n - 1 - j][i] for j in range(n)] for i in range(n)]
    return f"{c1} {c2}\n" + "\n".join(" ".join(map(str, r)) for r in rot)
def xoaybang_slow(data):
    t = data.split(); n = int(t[0]); a = [[int(t[1 + i * n + j]) for j in range(n)] for i in range(n)]
    c1 = c2 = 0
    for i in range(n):
        for j in range(n):
            if i == j: c1 += a[i][j]
            if i + j == n - 1: c2 += a[i][j]
    rot = [list(r) for r in zip(*a[::-1])]
    return f"{c1} {c2}\n" + "\n".join(" ".join(map(str, r)) for r in rot)

# ===================== TUẦN 15 (bổ sung) =====================
def luythua_fast(data):
    t = data.split(); q = int(t[0])
    return "\n".join(str(pow(int(t[1 + 2 * i]), int(t[2 + 2 * i]), 10)) for i in range(q))
def luythua_slow(data):                     # chu kỳ chữ số cuối (độ dài chu kỳ chia hết cho 4)
    t = data.split(); q = int(t[0]); out = []
    for i in range(q):
        a, n = int(t[1 + 2 * i]) % 10, int(t[2 + 2 * i])
        e = (n - 1) % 4 + 1                 # n >= 1
        out.append(str(a ** e % 10))
    return "\n".join(out)
