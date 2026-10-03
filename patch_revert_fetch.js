const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const fetchRegex = /fetch\("\/api\/students\?t=" \+ Date\.now\(\)\)[\s\S]*?\}\)\n\s*\.catch\(\(\) => console\.log\("Không tìm th?y file danh sách h?c sinh"\)\);/;
const newFetch = `fetch("/data/students.json")
      .then(res => res.json())
      .then(data => {
          setStudents(data);
          if (data.length > 0) setStudentName(data[0]);
      })
      .catch(() => console.log("Không tìm th?y file danh sách h?c sinh"));`;
content = content.replace(fetchRegex, newFetch);

// Since my old regex failed because of the error handling I added, I'll use a safer one:
const looseRegex = /fetch\("\/api\/students\?t=" \+ Date\.now\(\)\)[\s\S]*?setStudentClass\(classes\[0\]\);\s*\n\s*if\s*\(data\[classes\[0\]\]\.length > 0\)\s*\{\s*\n\s*setStudentName\(data\[classes\[0\]\]\[0\]\);\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}\)\s*\n\s*\.catch\(\(\) => console\.log\("Không tìm th?y file danh sách h?c sinh"\)\);/;
content = content.replace(looseRegex, newFetch);

// Try absolute fallback replacement:
const absoluteRegex = /fetch\("\/api\/students\?t=" \+ Date\.now\(\)\)[\s\S]*?Kh.*ng t.*m th.*y file danh s.*ch.*h?c sinh"\)\);/g;
content = content.replace(absoluteRegex, newFetch);

content = content.replace(/Nh\?p t\xEF\xBF\xBDn\.\.\./g, 'Nh\u1EADp t\u00EAn...');

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
