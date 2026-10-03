const fs = require('fs');

function fix(file) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(/>L\?p</g, '>L?p<');
    text = text.replace(/>H\?c Sinh</g, '>H?c Sinh<');
    text = text.replace(/Nh\?p t.*?n\.\.\./g, 'Nh?p tên...');
    text = text.replace(/L\?i t\?i danh s.*?ch h\?c sinh/g, 'L?i t?i danh sách h?c sinh');
    fs.writeFileSync(file, text, 'utf8');
}
fix('src/app/page.tsx');
fix('src/app/thi/page.tsx');
