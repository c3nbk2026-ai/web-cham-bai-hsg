"""Lời giải chuẩn (nhanh) và lời giải trâu (chậm, dùng để đối chứng) cho Tuần 14."""

# ---------- LOAIHOA: số loại khác nhau + loại xuất hiện nhiều nhất ----------
def loaihoa_fast(data):
    t = data.split(); n = int(t[0])
    cnt = {}
    for x in t[1:1 + n]:
        v = int(x); cnt[v] = cnt.get(v, 0) + 1
    best = min(cnt, key=lambda v: (-cnt[v], v))      # nhiều nhất; bằng nhau lấy mã nhỏ nhất
    return f"{len(cnt)}\n{best} {cnt[best]}"

def loaihoa_slow(data):
    t = data.split(); n = int(t[0]); a = list(map(int, t[1:1 + n]))
    distinct = []; best = None; bc = 0
    for i in range(n):
        if a[i] not in distinct: distinct.append(a[i])
        c = 0
        for j in range(n):
            if a[j] == a[i]: c += 1
        if c > bc or (c == bc and a[i] < best): best, bc = a[i], c
    return f"{len(distinct)}\n{best} {bc}"

# ---------- GHEPCAP: số cặp i < j có A[i] + A[j] = S ----------
def ghepcap_fast(data):
    t = data.split(); n, s = int(t[0]), int(t[1])
    seen = {}; ans = 0
    for x in t[2:2 + n]:
        v = int(x)
        ans += seen.get(s - v, 0)
        seen[v] = seen.get(v, 0) + 1
    return str(ans)

def ghepcap_slow(data):
    t = data.split(); n, s = int(t[0]), int(t[1]); a = list(map(int, t[2:2 + n]))
    ans = 0
    for i in range(n):
        for j in range(i + 1, n):
            if a[i] + a[j] == s: ans += 1
    return str(ans)

# ---------- DEMSO: mỗi giá trị xuất hiện bao nhiêu lần (tăng dần) ----------
def demso_fast(data):
    t = data.split(); n = int(t[0]); cnt = {}
    for x in t[1:1 + n]:
        v = int(x); cnt[v] = cnt.get(v, 0) + 1
    return "\n".join(f"{v} {cnt[v]}" for v in sorted(cnt))

def demso_slow(data):
    t = data.split(); n = int(t[0]); a = list(map(int, t[1:1 + n]))
    return "\n".join(f"{v} {a.count(v)}" for v in sorted(set(a)))

# ---------- CHUNGSO: số giá trị khác nhau có mặt ở cả A và B ----------
def chungso_fast(data):
    t = data.split(); n, m = int(t[0]), int(t[1])
    a = set(t[2:2 + n]); b = set(t[2 + n:2 + n + m])
    return str(len({int(x) for x in a} & {int(x) for x in b}))

def chungso_slow(data):
    t = data.split(); n, m = int(t[0]), int(t[1])
    a = list(map(int, t[2:2 + n])); b = list(map(int, t[2 + n:2 + n + m]))
    common = []
    for x in a:
        if x in b and x not in common: common.append(x)
    return str(len(common))
