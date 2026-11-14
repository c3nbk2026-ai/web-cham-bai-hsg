/**
 * TÁCH ĐÁP ÁN KHỎI THƯ MỤC CÔNG KHAI
 * ----------------------------------
 * Mọi file trong public/ đều tải được qua trình duyệt, nên đáp án (.OUT)
 * và lời giải mẫu KHÔNG được để ở đó.
 *
 * Script này chuyển:
 *   - mọi file .OUT / .out trong public/data
 *   - các file lời giải / chấm bài (*.py trừ template.py, BANG_DIEM*.txt)
 * sang thư mục private-data/ (giữ nguyên cấu trúc thư mục con).
 * Máy chủ (API /api/grade) đọc đáp án từ private-data/ để chấm.
 *
 * Cách dùng:  node scripts/tach-dap-an.js
 * (Day_Bai_Len_Mang.bat tự chạy script này trước khi đẩy bài lên mạng.)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DATA = path.join(ROOT, 'public', 'data');
const PRIVATE_DATA = path.join(ROOT, 'private-data');

function canGiau(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.out')) return true;
  if (lower.endsWith('.py') && lower !== 'template.py') return true;
  if (lower.startsWith('bang_diem') && lower.endsWith('.txt')) return true;
  return false;
}

let soFile = 0;
function duyet(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      duyet(full);
    } else if (entry.isFile() && canGiau(entry.name)) {
      const rel = path.relative(PUBLIC_DATA, full);
      const dest = path.join(PRIVATE_DATA, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.renameSync(full, dest);
      soFile++;
    }
  }
}

if (!fs.existsSync(PUBLIC_DATA)) {
  console.log('Không thấy thư mục public/data');
  process.exit(0);
}
duyet(PUBLIC_DATA);
console.log(`Đã chuyển ${soFile} file đáp án/lời giải sang private-data/`);
