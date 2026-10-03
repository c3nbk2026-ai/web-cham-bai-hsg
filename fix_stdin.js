const fs = require('fs');
let content = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

content = content.replace(/placeholder="Nh\u1EADp t\u00EAn\.\.\." value=\{stdin\}/, 'placeholder="Nhap du lieu dau vao de thu..." value={stdin}');

fs.writeFileSync('src/app/thi/page.tsx', content, 'utf8');
