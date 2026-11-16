"""Lời giải chuẩn (nhanh) và lời giải trâu (chậm, dùng để đối chứng) cho Tuần 15."""
from math import isqrt

def sieve(n):
    """Sàng Eratosthenes: is_p[i] = 1 nếu i là số nguyên tố (0 <= i <= n)."""
    n = max(n, 1)
    is_p = bytearray([1]) * (n + 1); is_p[0] = 0; is_p[1] = 0
    for i in range(2, isqrt(n) + 1):
        if is_p[i]:
            is_p[i * i::i] = bytearray(len(range(i * i, n + 1, i)))
    return is_p

def is_prime_slow(x):
    if x < 2: return False
    d = 2
    while d * d <= x:
        if x % d == 0: return False
        d += 1
    return True

# ---------- VEMAYMAN: đếm số nguyên tố trong [L, R] cho Q câu hỏi ----------
def vemayman_fast(data):
    t = data.split(); q = int(t[0])
    qs = [(int(t[1 + 2 * i]), int(t[2 + 2 * i])) for i in range(q)]
    m = max(r for _, r in qs)
    is_p = sieve(m)
    cnt = [0] * (m + 1); c = 0
    for i in range(m + 1):
        c += is_p[i]; cnt[i] = c
    return "\n".join(str(cnt[r] - cnt[l - 1]) for l, r in qs)

def vemayman_slow(data):
    t = data.split(); q = int(t[0]); out = []
    for i in range(q):
        l, r = int(t[1 + 2 * i]), int(t[2 + 2 * i])
        out.append(str(sum(1 for x in range(l, r + 1) if is_prime_slow(x))))
    return "\n".join(out)

# ---------- BAUOC: số có đúng 3 ước (= p^2 với p nguyên tố) ----------
def bauoc_fast(data):
    t = data.split(); n = int(t[0]); a = list(map(int, t[1:1 + n]))
    is_p = sieve(10**6)
    k = 0; s = 0
    for x in a:
        r = isqrt(x)
        if r * r == x and r <= 10**6 and is_p[r]:
            k += 1; s += x
    return f"{k}\n{s}"

def bauoc_slow(data):
    t = data.split(); n = int(t[0]); a = list(map(int, t[1:1 + n]))
    k = 0; s = 0
    for x in a:
        cnt = 0; d = 1
        while d * d <= x:
            if x % d == 0:
                cnt += 1 if d * d == x else 2
            d += 1
        if cnt == 3: k += 1; s += x
    return f"{k}\n{s}"

# ---------- SANGNT: số lượng số nguyên tố <= N và số nguyên tố lớn nhất <= N ----------
def sangnt_fast(data):
    n = int(data.split()[0])
    if n < 2: return "0\n-1"
    is_p = sieve(n)
    k = sum(is_p)
    big = next(i for i in range(n, 1, -1) if is_p[i])
    return f"{k}\n{big}"

def sangnt_slow(data):
    n = int(data.split()[0]); ps = [x for x in range(2, n + 1) if is_prime_slow(x)]
    return f"{len(ps)}\n{ps[-1] if ps else -1}"

# ---------- UOCNT: số ước nguyên tố khác nhau của từng số ----------
def uocnt_fast(data):
    t = data.split(); q = int(t[0]); xs = list(map(int, t[1:1 + q]))
    m = max(xs + [2])
    spf = list(range(m + 1))                      # ước nguyên tố nhỏ nhất
    for i in range(2, isqrt(m) + 1):
        if spf[i] == i:
            for j in range(i * i, m + 1, i):
                if spf[j] == j: spf[j] = i
    out = []
    for x in xs:
        c = 0
        while x > 1:
            p = spf[x]; c += 1
            while x % p == 0: x //= p
        out.append(str(c))
    return " ".join(out)

def uocnt_slow(data):
    t = data.split(); q = int(t[0]); out = []
    for x in map(int, t[1:1 + q]):
        c = 0; d = 2
        while d * d <= x:
            if x % d == 0:
                c += 1
                while x % d == 0: x //= d
            d += 1
        if x > 1: c += 1
        out.append(str(c))
    return " ".join(out)
