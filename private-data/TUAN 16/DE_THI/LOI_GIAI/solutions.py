"""Lời giải chuẩn (nhanh) và lời giải trâu (chậm, dùng để đối chứng) cho Tuần 16 – Tìm kiếm nhị phân."""
from bisect import bisect_left, bisect_right

# ---------- HOMESTAY: với mỗi ngân sách x, đếm số phòng có giá <= x ----------
def homestay_fast(data):
    t = data.split(); n, q = int(t[0]), int(t[1])
    a = sorted(map(int, t[2:2 + n])); xs = t[2 + n:2 + n + q]
    return "\n".join(str(bisect_right(a, int(x))) for x in xs)

def homestay_slow(data):
    t = data.split(); n, q = int(t[0]), int(t[1])
    a = list(map(int, t[2:2 + n])); xs = list(map(int, t[2 + n:2 + n + q]))
    return "\n".join(str(sum(1 for v in a if v <= x)) for x in xs)

# ---------- THUYEN: đếm cặp i < j có w[i] + w[j] <= S ----------
def thuyen_fast(data):
    t = data.split(); n, s = int(t[0]), int(t[1])
    a = sorted(map(int, t[2:2 + n])); c = 0
    for i in range(n):
        c += max(0, bisect_right(a, s - a[i], i + 1, n) - (i + 1))
    return str(c)

def thuyen_slow(data):
    t = data.split(); n, s = int(t[0]), int(t[1])
    a = list(map(int, t[2:2 + n])); c = 0
    for i in range(n):
        for j in range(i + 1, n):
            if a[i] + a[j] <= s: c += 1
    return str(c)

# ---------- Khởi động TIMX: dãy tăng chặt, tìm vị trí (1-based) của x, không có in -1 ----------
def timx_fast(data):
    t = data.split(); n, q = int(t[0]), int(t[1])
    a = list(map(int, t[2:2 + n])); res = []
    for x in map(int, t[2 + n:2 + n + q]):
        k = bisect_left(a, x)
        res.append(str(k + 1) if k < n and a[k] == x else "-1")
    return "\n".join(res)

def timx_slow(data):
    t = data.split(); n, q = int(t[0]), int(t[1])
    a = list(map(int, t[2:2 + n]))
    return "\n".join(str(a.index(x) + 1) if x in a else "-1" for x in map(int, t[2 + n:2 + n + q]))

# ---------- Khởi động DEMX: dãy không giảm, đếm số lần xuất hiện của x ----------
def demx_fast(data):
    t = data.split(); n, q = int(t[0]), int(t[1])
    a = list(map(int, t[2:2 + n]))
    return "\n".join(str(bisect_right(a, x) - bisect_left(a, x)) for x in map(int, t[2 + n:2 + n + q]))

def demx_slow(data):
    t = data.split(); n, q = int(t[0]), int(t[1])
    a = list(map(int, t[2:2 + n]))
    return "\n".join(str(a.count(x)) for x in map(int, t[2 + n:2 + n + q]))

# ---------- Lời giải "kiểu học sinh": tự viết vòng while nhị phân (đo thời gian) ----------
def homestay_student(data):
    t = data.split(); n, q = int(t[0]), int(t[1])
    a = [int(v) for v in t[2:2 + n]]; a.sort(); out = []
    for j in range(q):
        x = int(t[2 + n + j]); lo, hi = 0, n          # tìm vị trí đầu tiên có a[k] > x
        while lo < hi:
            mid = (lo + hi) // 2
            if a[mid] <= x: lo = mid + 1
            else: hi = mid
        out.append(str(lo))
    return "\n".join(out)

def thuyen_student(data):
    t = data.split(); n, s = int(t[0]), int(t[1])
    a = [int(v) for v in t[2:2 + n]]; a.sort(); c = 0
    for i in range(n):
        lo, hi = i + 1, n
        while lo < hi:
            mid = (lo + hi) // 2
            if a[i] + a[mid] <= s: lo = mid + 1
            else: hi = mid
        c += lo - (i + 1)
    return str(c)
