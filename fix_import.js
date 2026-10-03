const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

if (!page.includes('import Editor')) {
    page = page.replace(
        'import { useState, useEffect, useRef } from "react";',
        'import { useState, useEffect, useRef } from "react";\nimport Editor from "@monaco-editor/react";'
    );
    fs.writeFileSync('src/app/page.tsx', page, 'utf8');
    console.log("Added import Editor");
} else {
    console.log("import Editor already exists");
}
