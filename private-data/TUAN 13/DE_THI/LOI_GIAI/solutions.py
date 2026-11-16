"""Lời giải chuẩn (nhanh) và lời giải trâu (chậm, dùng để đối chứng) cho Tuần 13."""
from collections import defaultdict

# ---------- LUONGMUA: tổng đoạn [L, R] ----------
def luongmua_fast(data):
    it = iter(data.split()); n = int(next(it)); q = int(next(it))
    s = [0] * (n + 1)
    for i in range(1, n + 1):
        s[i] = s[i - 1] + int(next(it))
    out = []
    for _ in range(q):
        l = int(next(it)); r = int(next(it))
        out.append(str(s[r] - s[l - 1]))
    return "\n".join(out)

def luongmua_slow(data):
    t = data.split(); n, q = int(t[0]), int(t[1]); a = list(map(int, t[2:2 + n])); p = 2 + n
    out = []
    for _ in range(q):
        l, r = int(t[p]), int(t[p + 1]); p += 2
        tot = 0
        for i in range(l - 1, r):
            tot += a[i]
        out.append(str(tot))
    return "\n".join(out)

# ---------- THUNGDAU: số đoạn liên tiếp có tổng chia hết cho K ----------
def thungdau_fast(data):
    t = data.split(); n, k = int(t[0]), int(t[1]); a = t[2:2 + n]
    cnt = defaultdict(int); cnt[0] = 1; s = 0; ans = 0
    for x in a:
        s = (s + int(x)) % k
        ans += cnt[s]
        cnt[s] += 1
    return str(ans)

def thungdau_slow(data):
    t = data.split(); n, k = int(t[0]), int(t[1]); a = list(map(int, t[2:2 + n]))
    ans = 0
    for i in range(n):
        s = 0
        for j in range(i, n):
            s += a[j]
            if s % k == 0:
                ans += 1
    return str(ans)

# ---------- CONGDON: in dãy tổng cộng dồn ----------
def congdon_fast(data):
    t = data.split(); n = int(t[0]); s = 0; out = []
    for x in t[1:1 + n]:
        s += int(x); out.append(str(s))
    return " ".join(out)

def congdon_slow(data):
    t = data.split(); n = int(t[0]); a = list(map(int, t[1:1 + n]))
    return " ".join(str(sum(a[:i + 1])) for i in range(n))

# ---------- TONGKMAX: tổng K phần tử liên tiếp lớn nhất ----------
def tongkmax_fast(data):
    t = data.split(); n, k = int(t[0]), int(t[1]); a = list(map(int, t[2:2 + n]))
    s = [0] * (n + 1)
    for i in range(n): s[i + 1] = s[i] + a[i]
    return str(max(s[i + k] - s[i] for i in range(n - k + 1)))

def tongkmax_slow(data):
    t = data.split(); n, k = int(t[0]), int(t[1]); a = list(map(int, t[2:2 + n]))
    return str(max(sum(a[i:i + k]) for i in range(n - k + 1)))
