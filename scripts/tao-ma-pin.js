/**
 * TẠO MÃ PIN ĐĂNG NHẬP CHO HỌC SINH ĐỘI TUYỂN
 * -------------------------------------------
 * Đọc danh sách tên trong public/data/students.json, tạo mã PIN 6 số ngẫu nhiên.
 *  - private-data/ma-pin.json : CHỈ lưu bản mã hóa (scrypt) của PIN → được đẩy lên mạng, máy chủ dùng để kiểm tra.
 *  - MA_PIN_HOC_SINH.csv      : PIN rõ để giáo viên IN PHÁT cho học sinh → CHỈ nằm trên máy giáo viên (không đẩy lên GitHub).
 *
 * Cách dùng:
 *   node scripts/tao-ma-pin.js                      → tạo PIN cho học sinh MỚI (chưa có PIN)
 *   node scripts/tao-ma-pin.js --lam-moi "Họ Tên"   → cấp lại PIN cho 1 học sinh (khi em quên)
 *   node scripts/tao-ma-pin.js --tat-ca             → cấp lại PIN cho TẤT CẢ học sinh
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const STUDENTS = path.join(ROOT, 'public', 'data', 'students.json');
const PIN_DB = path.join(ROOT, 'private-data', 'ma-pin.json');
const CSV = path.join(ROOT, 'MA_PIN_HOC_SINH.csv');

const norm = s => String(s || '').normalize('NFC').trim().replace(/\s+/g, ' ');

function hashPin(pin, salt) {
  return crypto.scryptSync(pin, salt, 32, { N: 16384, r: 8, p: 1 }).toString('hex');
}
function newPin() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}
function readCsv() {
  const map = new Map();
  if (!fs.existsSync(CSV)) return map;
  const lines = fs.readFileSync(CSV, 'utf8').replace(/^﻿/, '').split(/\r?\n/).slice(1);
  for (const line of lines) {
    const m = line.match(/^"(.*)","(\d{6})"/);
    if (m) map.set(norm(m[1].replace(/""/g, '"')), m[2]);
  }
  return map;
}

const args = process.argv.slice(2);
const renewAll = args.includes('--tat-ca');
const renewIdx = args.indexOf('--lam-moi');
const renewOne = renewIdx >= 0 ? norm(args[renewIdx + 1]) : '';

const names = JSON.parse(fs.readFileSync(STUDENTS, 'utf8')).map(norm).filter(Boolean);
if (renewOne && !names.includes(renewOne)) {
  console.error(`Không tìm thấy học sinh "${renewOne}" trong students.json`);
  process.exit(1);
}

let db = { hocSinh: {} };
try { db = JSON.parse(fs.readFileSync(PIN_DB, 'utf8')); } catch {}
db.hocSinh = db.hocSinh || {};
const csv = readCsv();

const changed = [];
for (const name of names) {
  const need = renewAll || name === renewOne || !db.hocSinh[name];
  if (!need) continue;
  const pin = newPin();
  const salt = crypto.randomBytes(16).toString('hex');
  db.hocSinh[name] = { salt, hash: hashPin(pin, salt), taoLuc: new Date().toISOString() };
  csv.set(name, pin);
  changed.push(name);
}
// Học sinh đã bị xóa khỏi danh sách: xóa PIN
for (const name of Object.keys(db.hocSinh)) {
  if (!names.includes(name)) { delete db.hocSinh[name]; csv.delete(name); }
}

fs.mkdirSync(path.dirname(PIN_DB), { recursive: true });
fs.writeFileSync(PIN_DB, JSON.stringify(db, null, 2) + '\n');
const rows = ['"Họ và tên","Mã PIN"'];
for (const name of names) rows.push(`"${name.replace(/"/g, '""')}","${csv.get(name) || 'ĐÃ CẤP TRƯỚC ĐÓ - xem bản in cũ'}"`);
fs.writeFileSync(CSV, '﻿' + rows.join('\r\n') + '\r\n');

if (changed.length) {
  console.log(`Đã tạo mã PIN mới cho ${changed.length} học sinh: ${changed.join(', ')}`);
  console.log(`Mở file MA_PIN_HOC_SINH.csv (bằng Excel) để in và phát cho học sinh.`);
} else {
  console.log('Không có học sinh mới, mã PIN giữ nguyên.');
}
