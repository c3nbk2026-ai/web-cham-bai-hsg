const fs = require('fs');

// --- 1. PATCH src/app/page.tsx ---
let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

// Hide DE_KTGK from default selection
pageContent = pageContent.replace(
    'const weeks = Object.keys(data);',
    'const weeks = Object.keys(data).filter(w => w !== \'DE_KTGK\');'
);

// Hide DE_KTGK from dropdown
pageContent = pageContent.replace(
    '{Object.keys(structure).map((w) => (',
    '{Object.keys(structure).filter(w => w !== \'DE_KTGK\').map((w) => ('
);

// Add smartInp logic inside submitCode
pageContent = pageContent.replace(
    'py.globals.set("test_input_data", t.inp);',
    `let smartInp = t.inp;
        if (mode === 'DAI_TRA' && !code.includes('split(') && !code.includes('split()') && !code.includes('sys.stdin.read')) {
            smartInp = (t.inp || "").trim().replace(/[ \\t]+/g, '\\n');
        }
        py.globals.set("test_input_data", smartInp);`
);

// Replace t.inp in writeFile to smartInp
pageContent = pageContent.replace(/try \{ py\.FS\.writeFile\(pName \+ "\.INP", t\.inp\); \} catch\(e\) \{\}/g, 'try { py.FS.writeFile(pName + ".INP", smartInp); } catch(e) {}');
pageContent = pageContent.replace(/try \{ py\.FS\.writeFile\(pName \+ "\.inp", t\.inp\); \} catch\(e\) \{\}/g, 'try { py.FS.writeFile(pName + ".inp", smartInp); } catch(e) {}');

fs.writeFileSync('src/app/page.tsx', pageContent, 'utf8');

// --- 2. PATCH src/app/thi/page.tsx ---
let thiContent = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

thiContent = thiContent.replace(
    'py.globals.set("test_input_data", t.inp);',
    `let smartInp = t.inp;
              if (!code.includes('split(') && !code.includes('split()') && !code.includes('sys.stdin.read')) {
                  smartInp = (t.inp || "").trim().replace(/[ \\t]+/g, '\\n');
              }
              py.globals.set("test_input_data", smartInp);`
);

fs.writeFileSync('src/app/thi/page.tsx', thiContent, 'utf8');
