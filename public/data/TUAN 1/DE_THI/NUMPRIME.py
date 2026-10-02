import math
import sys
sys.stdin = open('NUMPRIME.INP', 'r')
sys.stdout = open('NUMPRIME.OUT', 'w')
def snt(n):
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    for i in range(3, math.isqrt(n) + 1, 2):
        if n % i == 0:
            return False
    return True

s = input()
a = []
p = ""

for c in s:
    if c.isdigit():
        p += c
    else:
        if p:
            x = int(p)
            if snt(x):
                a.append(x)
            p = ""

if p:
    x = int(p)
    if snt(x):
        a.append(x)
print(len(a))
if a:
    print(*a)
else:
    print(-1)
print(sum(a))