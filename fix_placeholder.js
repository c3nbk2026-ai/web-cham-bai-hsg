const fs = require('fs');

function fix(file) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(/placeholder="Nh.*?p t.*?n\.\.\."/g, 'placeholder="Nh?p tên..."');
    text = text.replace(/L\xEF\xBF\xBDi t\xEF\xBF\xBDi danh s.*?ch h.*?c sinh/g, 'L?i t?i danh sách h?c sinh');
    fs.writeFileSync(file, text, 'utf8');
}
fix('src/app/page.tsx');
fix('src/app/thi/page.tsx');
