const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add states safely
const stateRegex = /const \[studentName, setStudentName\] = useState\(""\);\s*const \[students, setStudents\] = useState<string\[\]>\(\[\]\);/g;
page = page.replace(stateRegex, `const [studentClass, setStudentClass] = useState("");\n  const [studentName, setStudentName] = useState("");\n  const [studentsData, setStudentsData] = useState<Record<string, string[]>>({});`);

// 2. Add fetch safely
const oldFetch = `fetch("/data/students.json")
      .then(res => res.json())
      .then(data => {
          setStudents(data);
          if (data.length > 0) setStudentName(data[0]);
      })
      .catch(() => console.log("Không tìm th?y file danh sách h?c sinh"));`;

const newFetch = `fetch("/api/students")
      .then(res => res.json())
      .then(data => {
        setStudentsData(data);
        const classes = Object.keys(data).sort();
        if (classes.length > 0) {
          setStudentClass(classes[0]);
          if (data[classes[0]].length > 0) {
            setStudentName(data[classes[0]][0]);
          }
        }
      })
      .catch(() => console.log("L?i t?i danh sách h?c sinh"));`;

page = page.replace(oldFetch, newFetch);

// 3. UI
const oldSelect = `<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên H?c Sinh</label>
                  {students.length > 0 ? (
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)}>
                      {students.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold transition-all shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nh?p tên..." />
                  )}`;

const newSelect = `<div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">L?p</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentClass} onChange={(e) => {
                      const newClass = e.target.value;
                      setStudentClass(newClass);
                      if (studentsData[newClass] && studentsData[newClass].length > 0) {
                        setStudentName(studentsData[newClass][0]);
                      } else {
                        setStudentName("");
                      }
                    }}>
                      {Object.keys(studentsData).sort().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">H?c Sinh</label>
                    {studentClass && studentsData[studentClass] && studentsData[studentClass].length > 0 ? (
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)}>
                        {studentsData[studentClass].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nh?p tên..." />
                    )}
                  </div>
                </div>`;

page = page.replace(oldSelect, newSelect);
fs.writeFileSync('src/app/page.tsx', page, 'utf8');
