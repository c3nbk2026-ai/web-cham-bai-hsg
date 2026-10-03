const fs = require('fs');

function patch(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add cache buster and error handling
    content = content.replace(
        /fetch\("\/api\/students"\)\s*\.then\(res => res\.json\(\)\)\s*\.then\(data => \{/,
        `fetch("/api/students?t=" + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.error) {
            console.error("L?i t? Google Sheets:", data.error);
            setStudentsData({"L?I: Chua c?p quy?n": ["Vui lòng Share file cho email Bot"]});
            setStudentClass("L?I: Chua c?p quy?n");
            setStudentName("Vui lòng Share file cho email Bot");
            return;
        }`
    );
    
    fs.writeFileSync(file, content, 'utf8');
}

patch('src/app/page.tsx');
patch('src/app/thi/page.tsx');
