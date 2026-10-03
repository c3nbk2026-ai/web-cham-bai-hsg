const fs = require('fs');

function fix(file) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(/mb-2">L.p<\/label>/g, 'mb-2">L?p</label>');
    text = text.replace(/mb-2">H.c Sinh<\/label>/g, 'mb-2">H?c Sinh</label>');
    text = text.replace(/placeholder="Nh.p t.*?n..."/g, 'placeholder="Nh?p tên..."');
    text = text.replace(/console.log\("L.i t.i danh s.*?ch h.c sinh"\)/g, 'console.log("L?i t?i danh sách h?c sinh")');
    fs.writeFileSync(file, text, 'utf8');
}
fix('src/app/page.tsx');
fix('src/app/thi/page.tsx');
