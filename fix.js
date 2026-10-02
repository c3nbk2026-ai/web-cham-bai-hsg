const fs = require('fs');
let c = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

c = c.replace(
    /src=\{\\`\/data\/\$\\{testFolder\\}\/DE_THI\/\$\\{problem\.replace\("TEST_", ""\)\}\.pdf#toolbar=0&navpanes=0\\`\}/g,
    "src={`/data/${testFolder}/DE_THI/${problem.replace('TEST_', '')}.pdf#toolbar=0&navpanes=0`}"
);

fs.writeFileSync('src/app/thi/page.tsx', c);
