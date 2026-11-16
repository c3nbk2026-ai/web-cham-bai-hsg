/*
 * LUỒNG CHẠY PYTHON RIÊNG (Web Worker)
 * Code học sinh chạy ở đây, tách khỏi trang web. Nếu code lặp vô hạn hoặc quá giờ,
 * trang chỉ cần dừng luồng này (terminate) và tạo luồng mới: trang không bị treo, không mất bài.
 */
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/';
importScripts(PYODIDE_URL + 'pyodide.js');

let pyReady = null;
function getPy() {
  if (!pyReady) pyReady = loadPyodide({ indexURL: PYODIDE_URL });
  return pyReady;
}

function readFileIfAny(py, names) {
  for (const n of names) {
    try {
      const s = py.FS.readFile(n, { encoding: 'utf8' });
      if (s && s.trim()) return s;
    } catch (e) {}
  }
  return '';
}

self.onmessage = async (e) => {
  const msg = e.data || {};
  const id = msg.id;
  if (msg.type === 'warmup') {
    try { await getPy(); self.postMessage({ id, type: 'ready' }); }
    catch (err) { self.postMessage({ id, type: 'load-error', err: String(err && err.message || err) }); }
    return;
  }
  if (msg.type !== 'run') return;

  let py;
  try { py = await getPy(); }
  catch (err) { self.postMessage({ id, type: 'load-error', err: String(err && err.message || err) }); return; }

  const pName = String(msg.pName || 'BAI');
  const input = String(msg.input || '');
  // Chuẩn bị file .INP/.OUT để code đọc/ghi file như khi thi thật
  for (const n of [pName + '.INP', pName + '.inp']) { try { py.FS.writeFile(n, input); } catch (e) {} }
  for (const n of [pName + '.OUT', pName + '.out']) { try { py.FS.writeFile(n, ''); } catch (e) {} }

  py.globals.set('test_input_data', input);
  py.globals.set('student_code', String(msg.code || ''));
  await py.runPythonAsync('import sys, io\nsys.stdin = io.StringIO(test_input_data)\nsys.stdout = io.StringIO()');

  let err = null;
  const t0 = performance.now();
  try {
    // Mỗi lần chạy dùng một không gian tên mới, biến của test trước không lẫn sang test sau
    await py.runPythonAsync("exec(compile(student_code, 'bai_lam.py', 'exec'), {'__name__': '__main__'})");
  } catch (ex) {
    err = String(ex && ex.message || ex);
  }
  const ms = performance.now() - t0;

  // Bài làm đọc/ghi tệp như khi thi (sys.stdout = open('X.OUT', 'w')) thường không đóng tệp:
  // phải đẩy bộ đệm ra tệp thì mới đọc được kết quả.
  try {
    await py.runPythonAsync([
      'import sys, io, gc',
      'for _f in (sys.stdout, sys.stderr):',
      '    if not isinstance(_f, io.StringIO):',
      '        try:',
      '            _f.flush()',
      '        except Exception:',
      '            pass',
      'gc.collect()',
    ].join('\n'));
  } catch (e) {}

  let out = readFileIfAny(py, [pName + '.OUT', pName + '.out']);
  if (!out) {
    try { out = py.runPython('sys.stdout.getvalue()'); } catch (e) { out = ''; }
  }
  self.postMessage({ id, type: 'result', ok: !err, out: String(out || '').trim(), err, ms });
};
