const fs = require('fs');

function fix(file) {
    let lines = fs.readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('mb-2">L?p</label>')) {
            lines[i] = lines[i].replace('L?p', 'L?p');
        }
        if (lines[i].includes('mb-2">H?c Sinh</label>')) {
            lines[i] = lines[i].replace('H?c Sinh', 'H?c Sinh');
        }
        if (lines[i].includes('placeholder="Nh?p t') && lines[i].includes('n..."')) {
            lines[i] = lines[i].replace(/placeholder="Nh\?p t.*n\.\.\."/, 'placeholder="Nh?p tên..."');
        }
        if (lines[i].includes('L?i t?i danh s') && lines[i].includes('ch h?c sinh')) {
            lines[i] = lines[i].replace(/L\?i t\?i danh s.*ch h\?c sinh/, 'L?i t?i danh sách h?c sinh');
        }
    }
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
}
fix('src/app/page.tsx');
fix('src/app/thi/page.tsx');
