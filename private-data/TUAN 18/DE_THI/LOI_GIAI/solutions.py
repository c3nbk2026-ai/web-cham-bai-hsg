"""Lời giải chuẩn (nhanh) và lời giải trâu (đối chứng) cho Tuần 18 – Xử lý xâu."""
import re

def first_line(data):
    return data.split('\n')[0].rstrip('\r')

# ---------- TUKHOA: tách từ (chữ cái/chữ số liền nhau), không phân biệt hoa thường ----------
def tukhoa_fast(data):
    words = re.findall(r'[A-Za-z0-9]+', first_line(data).lower())
    if not words: return "0\n0\n-1"
    cnt = {}
    for w in words: cnt[w] = cnt.get(w, 0) + 1
    best = min(cnt, key=lambda w: (-cnt[w], w))
    return f"{len(words)}\n{len(cnt)}\n{best} {cnt[best]}"

def tukhoa_slow(data):
    s = first_line(data); words = []; cur = ''
    for c in s + ' ':
        if c.isascii() and c.isalnum(): cur += c.lower()
        else:
            if cur: words.append(cur)
            cur = ''
    if not words: return "0\n0\n-1"
    distinct = sorted(set(words)); best = None; bc = 0
    for w in distinct:
        c = words.count(w)
        if c > bc: best, bc = w, c
    return f"{len(words)}\n{len(distinct)}\n{best} {bc}"

# ---------- DENLONG: đếm cặp i < j với s[i] = X, s[j] = Y ----------
def denlong_fast(data):
    lines = data.split('\n'); s = lines[0].strip(); x, y = lines[1].split()
    cx = 0; ans = 0
    for c in s:
        if c == y: ans += cx
        if c == x: cx += 1
    return str(ans)

def denlong_slow(data):
    lines = data.split('\n'); s = lines[0].strip(); x, y = lines[1].split(); ans = 0
    for i in range(len(s)):
        if s[i] == x:
            for j in range(i + 1, len(s)):
                if s[j] == y: ans += 1
    return str(ans)

# ---------- Khởi động DEMKYTU: chữ hoa, chữ thường, chữ số, khoảng trắng, ký tự khác ----------
def demkytu_fast(data):
    s = first_line(data)
    up = sum(1 for c in s if 'A' <= c <= 'Z'); lo = sum(1 for c in s if 'a' <= c <= 'z')
    dg = sum(1 for c in s if '0' <= c <= '9'); sp = s.count(' ')
    return f"{up} {lo} {dg} {sp} {len(s) - up - lo - dg - sp}"
def demkytu_slow(data):
    s = first_line(data); r = [0] * 5
    for c in s:
        if c.isupper() and c.isascii(): r[0] += 1
        elif c.islower() and c.isascii(): r[1] += 1
        elif c.isdigit(): r[2] += 1
        elif c == ' ': r[3] += 1
        else: r[4] += 1
    return " ".join(map(str, r))

# ---------- Khởi động DAOTU: đảo thứ tự các từ, mỗi từ cách nhau đúng 1 dấu cách ----------
def daotu_fast(data):
    return " ".join(first_line(data).split()[::-1])
def daotu_slow(data):
    s = first_line(data); words = []; cur = ''
    for c in s + ' ':
        if c == ' ':
            if cur: words.append(cur)
            cur = ''
        else: cur += c
    res = ''
    for w in words: res = w if res == '' else w + ' ' + res
    return res
