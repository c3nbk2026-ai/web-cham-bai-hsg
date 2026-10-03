const fs = require('fs');

// === Fix thi/page.tsx ===
let thi = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

const fixes_thi = [
    ['Vui l\uFFFDng Share file cho email Bot', 'Vui l\u00F2ng Share file cho email Bot'],
    ['L?i t?i danh s\uFFFDch h?c sinh', 'L\u1ED7i t\u1EA3i danh s\u00E1ch h\u1ECDc sinh'],
    ['DANG CHAY...', '\u0110ang ch\u1EA1y...'],
    ['CHAY CODE', 'CH\u1EA0Y CODE'],
    ['DANG CHAM...', '\u0110ang ch\u1EA5m...'],
    ['DA NOP BAI', '\u0110\u00E3 n\u1ED9p b\u00E0i'],
    ['NOP BAI', 'N\u1ED8P B\u00C0I'],
    ['Ban co chac chan muon nop bai? He thong se tu dong cham diem va ban KHONG THE sua lai!', 'B\u1EA1n c\u00F3 ch\u1EAFc ch\u1EAFn mu\u1ED1n n\u1ED9p b\u00E0i? H\u1EC7 th\u1ED1ng s\u1EBD t\u1EF1 \u0111\u1ED9ng ch\u1EA5m \u0111i\u1EC3m v\u00E0 b\u1EA1n KH\u00D4NG TH\u1EC2 s\u1EEDa l\u1EA1i!'],
    ['Noi dung De Thi', 'N\u1ED9i dung \u0110\u1EC1 Thi'],
    ['Ket qua se hien thi o day sau khi bam Chay Code...', 'K\u1EBFt qu\u1EA3 s\u1EBD hi\u1EC3n th\u1ECB \u1EDF \u0111\u00E2y sau khi b\u1EA5m Ch\u1EA1y Code...'],
    ['Bai: ', 'B\u00E0i: '],
];

for (const [bad, good] of fixes_thi) {
    if (thi.includes(bad)) {
        thi = thi.split(bad).join(good);
        console.log('Fixed thi:', bad.substring(0, 30));
    }
}
fs.writeFileSync('src/app/thi/page.tsx', thi, 'utf8');

// === Fix api/sheets/route.ts ===
let route = fs.readFileSync('src/app/api/sheets/route.ts', 'utf8');

const fixes_route = [
    ['gemini-3.5-flash', 'gemini-2.5-flash'],  // fix model name too
    // Corrupted Vietnamese in the AI prompt
    ['t\u1EF1 h\u1ECDc', 'T\u1EF1 h\u1ECDc'],
];

// Fix corrupted strings in askGemini
route = route.replace(/\uFFFD/g, '');  // Remove replacement chars

fs.writeFileSync('src/app/api/sheets/route.ts', route, 'utf8');

console.log('Done!');
