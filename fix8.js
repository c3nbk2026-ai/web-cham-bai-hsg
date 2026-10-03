const fs = require('fs');
let content = fs.readFileSync('src/app/thi/page.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('placeholder="Nh?p t')) {
        lines[i] = lines[i].replace(/placeholder="Nh\?p t.*?n\.\.\."/, 'placeholder="Nh?p tên..."');
    }
    if (lines[i].includes('L?p</label>')) {
        lines[i] = lines[i].replace('L?p</label>', 'L?p</label>');
    }
    if (lines[i].includes('H?c Sinh</label>')) {
        lines[i] = lines[i].replace('H?c Sinh</label>', 'H?c Sinh</label>');
    }
}
fs.writeFileSync('src/app/thi/page.tsx', lines.join('\n'), 'utf8');
