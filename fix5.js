const fs = require('fs');

function fix(file) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(/mb-2">L[^<]+<\/label>/g, 'mb-2">L?p</label>');
    text = text.replace(/mb-2">H[^<]+Sinh<\/label>/g, 'mb-2">H?c Sinh</label>');
    text = text.replace(/placeholder="Nh[^"]+n\.\.\."/g, 'placeholder="Nh?p tên..."');
    fs.writeFileSync(file, text, 'utf8');
}
fix('src/app/page.tsx');
fix('src/app/thi/page.tsx');
