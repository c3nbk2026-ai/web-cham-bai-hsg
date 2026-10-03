const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');
page = page.replace(
    'import { useState, useEffect } from "react";',
    'import { useState, useEffect } from "react";\nimport Editor from "@monaco-editor/react";'
);
fs.writeFileSync('src/app/page.tsx', page, 'utf8');
