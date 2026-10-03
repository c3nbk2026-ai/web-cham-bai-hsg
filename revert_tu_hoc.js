const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace state
content = content.replace(/const \[studentClass, setStudentClass\] = useState\(""\);\n/, '');
content = content.replace(/const \[studentsData, setStudentsData\] = useState<Record<string, string\[\]>>\(\{\}\);\n/, '  const [students, setStudents] = useState<string[]>([]);\n');

// Replace fetch
const fetchRegex = /fetch\("\/api\/students\?t=" \+ Date\.now\(\)\)[\s\S]*?\}\n\s*\}\)\n\s*\.catch\(\(\) => console\.log\("Không tìm th?y file danh sách h?c sinh"\)\);/;
const newFetch = `fetch("/data/students.json")
      .then(res => res.json())
      .then(data => {
          setStudents(data);
          if (data.length > 0) setStudentName(data[0]);
      })
      .catch(() => console.log("Không tìm th?y file danh sách h?c sinh"));`;
content = content.replace(fetchRegex, newFetch);

// Replace UI
const uiRegex = /<div className="flex gap-4">[\s\S]*?<\/div>\s*<\/div>\s*<div className="grid grid-cols-2 gap-4">/;
const newUi = `<div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">H?c Sinh</label>
                    {students.length > 0 ? (
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)}>
                        {students.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nh?p tên..." />
                    )}
                  </div>

                <div className="grid grid-cols-2 gap-4">`;
content = content.replace(uiRegex, newUi);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
