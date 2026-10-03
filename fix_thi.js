const fs = require('fs');
let content = fs.readFileSync('src/app/thi/page.tsx', 'utf8');
content = content.split('Nh\uFFFDp t\uFFFDn...').join('Nh?p tên...');
content = content.split('L\uFFFDi t\uFFFDi danh s\uFFFDch h\uFFFDc sinh').join('L?i t?i danh sách h?c sinh');
content = content.split('L\uFFFDp').join('L?p');
content = content.split('H\uFFFDc Sinh').join('H?c Sinh');
fs.writeFileSync('src/app/thi/page.tsx', content, 'utf8');
