"""Lời giải chuẩn (nhanh) và lời giải trâu (đối chứng) cho Tuần 17 – Mảng 2 chiều."""

def read_grid(t, pos, m, n):
    g = [[int(t[pos + i * n + j]) for j in range(n)] for i in range(m)]
    return g, pos + m * n

# ---------- DOICHE: ô đỉnh = lớn hơn hẳn mọi ô kề cạnh ----------
def doiche_fast(data):
    t = data.split(); m, n = int(t[0]), int(t[1]); g, _ = read_grid(t, 2, m, n)
    cnt = 0; best = -1
    for i in range(m):
        row = g[i]; up = g[i - 1] if i > 0 else None; down = g[i + 1] if i + 1 < m else None
        for j in range(n):
            v = row[j]
            if up is not None and up[j] >= v: continue
            if down is not None and down[j] >= v: continue
            if j > 0 and row[j - 1] >= v: continue
            if j + 1 < n and row[j + 1] >= v: continue
            cnt += 1
            if v > best: best = v
    return f"{cnt}\n{best}"

def doiche_slow(data):
    t = data.split(); m, n = int(t[0]), int(t[1]); g, _ = read_grid(t, 2, m, n); peaks = []
    for i in range(m):
        for j in range(n):
            nb = [g[x][y] for x, y in ((i - 1, j), (i + 1, j), (i, j - 1), (i, j + 1)) if 0 <= x < m and 0 <= y < n]
            if all(g[i][j] > v for v in nb): peaks.append(g[i][j])
    return f"{len(peaks)}\n{max(peaks) if peaks else -1}"

# ---------- VUONDAU: Q truy vấn tổng hình chữ nhật (x1, y1) - (x2, y2) ----------
def prefix2d(g, m, n):
    S = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        Si, Sp, gi = S[i], S[i - 1], g[i - 1]; run = 0
        for j in range(1, n + 1):
            run += gi[j - 1]; Si[j] = Sp[j] + run
    return S

def vuondau_fast(data):
    t = data.split(); m, n, q = int(t[0]), int(t[1]), int(t[2]); g, pos = read_grid(t, 3, m, n)
    S = prefix2d(g, m, n); out = []
    for k in range(q):
        x1, y1, x2, y2 = map(int, t[pos + 4 * k: pos + 4 * k + 4])
        out.append(S[x2][y2] - S[x1 - 1][y2] - S[x2][y1 - 1] + S[x1 - 1][y1 - 1])
    return "\n".join(map(str, out))

def vuondau_slow(data):
    t = data.split(); m, n, q = int(t[0]), int(t[1]), int(t[2]); g, pos = read_grid(t, 3, m, n); out = []
    for k in range(q):
        x1, y1, x2, y2 = map(int, t[pos + 4 * k: pos + 4 * k + 4])
        out.append(sum(g[i][j] for i in range(x1 - 1, x2) for j in range(y1 - 1, y2)))
    return "\n".join(map(str, out))

# ---------- Khởi động TONGHANG: tổng từng hàng, tổng từng cột ----------
def tonghang_fast(data):
    t = data.split(); m, n = int(t[0]), int(t[1]); g, _ = read_grid(t, 2, m, n)
    return " ".join(str(sum(r)) for r in g) + "\n" + " ".join(str(sum(c)) for c in zip(*g))
def tonghang_slow(data):
    t = data.split(); m, n = int(t[0]), int(t[1]); g, _ = read_grid(t, 2, m, n)
    rows = []; cols = [0] * n
    for i in range(m):
        s = 0
        for j in range(n): s += g[i][j]; cols[j] += g[i][j]
        rows.append(s)
    return " ".join(map(str, rows)) + "\n" + " ".join(map(str, cols))

# ---------- Khởi động BANGCD: in bảng cộng dồn 2 chiều ----------
def bangcd_fast(data):
    t = data.split(); m, n = int(t[0]), int(t[1]); g, _ = read_grid(t, 2, m, n)
    S = prefix2d(g, m, n)
    return "\n".join(" ".join(map(str, S[i][1:])) for i in range(1, m + 1))
def bangcd_slow(data):
    t = data.split(); m, n = int(t[0]), int(t[1]); g, _ = read_grid(t, 2, m, n)
    return "\n".join(" ".join(str(sum(g[a][b] for a in range(i + 1) for b in range(j + 1))) for j in range(n)) for i in range(m))

# ---------- Lời giải "kiểu học sinh" (vòng for lồng nhau, đo thời gian) ----------
def vuondau_student(data):
    t = data.split(); m, n, q = int(t[0]), int(t[1]), int(t[2]); a = [[0] * (n + 1)]
    p = 3
    for i in range(m):
        a.append([0] + [int(x) for x in t[p:p + n]]); p += n
    S = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            S[i][j] = S[i - 1][j] + S[i][j - 1] - S[i - 1][j - 1] + a[i][j]
    out = []
    for k in range(q):
        x1 = int(t[p]); y1 = int(t[p + 1]); x2 = int(t[p + 2]); y2 = int(t[p + 3]); p += 4
        out.append(S[x2][y2] - S[x1 - 1][y2] - S[x2][y1 - 1] + S[x1 - 1][y1 - 1])
    return "\n".join(map(str, out))
