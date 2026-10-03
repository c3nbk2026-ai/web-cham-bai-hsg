const fs = require('fs');
let lines = fs.readFileSync('src/app/thi/page.tsx', 'utf8').split('\n');
lines[250] = lines[250].replace(/placeholder="Nh\?p t.*?n\.\.\."/, 'placeholder="Nh?p tên..."');
fs.writeFileSync('src/app/thi/page.tsx', lines.join('\n'), 'utf8');
