const fs = require('fs');

function fix(file) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(/L\xEF\xBF\xBDp/g, 'L?p');
    text = text.replace(/H\xEF\xBF\xBDc Sinh/g, 'H?c Sinh');
    text = text.replace(/Nh\xEF\xBF\xBDp t\xEF\xBF\xBDn\.\.\./g, 'Nh?p tên...');
    text = text.replace(/L\xEF\xBF\xBDi t\xEF\xBF\xBDi danh s\xEF\xBF\xBDch h\xEF\xBF\xBDc sinh/g, 'L?i t?i danh sách h?c sinh');
    fs.writeFileSync(file, text, 'utf8');
}
fix('src/app/page.tsx');
fix('src/app/thi/page.tsx');
