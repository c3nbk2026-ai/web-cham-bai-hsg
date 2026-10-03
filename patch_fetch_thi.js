const fs = require('fs');
let page = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

const oldFetch = `fetch("/data/students.json").then(r => r.json()).then(data => {
      setStudents(data);
      if (data.length > 0) setStudentName(data[0]);
    }).catch(() => {});`;

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

if (page.includes('fetch("/data/students.json")')) {
    page = page.replace(oldFetch, newFetch);
    fs.writeFileSync('src/app/thi/page.tsx', page, 'utf8');
    console.log("Replaced fetch!");
}
