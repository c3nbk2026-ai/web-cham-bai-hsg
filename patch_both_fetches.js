const fs = require('fs');

// Patch page.tsx
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldFetch = `fetch("/data/students.json")
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        if (data.length > 0) setStudentName(data[0]);
      })
      .catch(() => {});`;

const newFetch = `fetch("/api/students?t=" + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.error) {
            setStudentsData({"L?I CHUA C?P QUY?N": ["Vui lòng Share sheet cho email bot Vercel"]});
            setStudentClass("L?I CHUA C?P QUY?N");
            return;
        }
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
page = page.replace(/placeholder="Nh.*?"/g, 'placeholder="Nh\u1EADp t\u00EAn..."');

fs.writeFileSync('src/app/page.tsx', page, 'utf8');

// Patch thi/page.tsx
let thi = fs.readFileSync('src/app/thi/page.tsx', 'utf8');
const oldThiFetch = /fetch\("\/api\/students"\)[\s\S]*?catch\(\(\) => console\.log\("L?i t?i danh sách h?c sinh"\)\);/;

const newThiFetch = `fetch("/api/students?t=" + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.error) {
            setStudentsData({"L?I CHUA C?P QUY?N": ["Vui lòng Share sheet cho email bot Vercel"]});
            setClassName("L?I CHUA C?P QUY?N");
            return;
        }
        setStudentsData(data);
        const classes = Object.keys(data).sort();
        if (classes.length > 0) {
          setClassName(classes[0]);
          if (data[classes[0]].length > 0) {
            setStudentName(data[classes[0]][0]);
          }
        }
      })
      .catch(() => console.log("L?i t?i danh sách h?c sinh"));`;

thi = thi.replace(oldThiFetch, newThiFetch);
fs.writeFileSync('src/app/thi/page.tsx', thi, 'utf8');
