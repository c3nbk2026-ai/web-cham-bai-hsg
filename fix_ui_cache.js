const fs = require('fs');

function fixEncoding(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix L?p
    content = content.replace(/>L\?p</g, '>L?p<');
    
    // Fix H?c Sinh
    content = content.replace(/>H\?c Sinh</g, '>H?c Sinh<');
    
    // Fix Nh?p tn... (Regex because of weird characters)
    content = content.replace(/Nh\?p t.*?n\.\.\./g, 'Nh?p tên...');
    
    // Also check L?i t?i
    content = content.replace(/L\?i t\?i danh s.*?ch h\?c sinh/g, 'L?i t?i danh sách h?c sinh');

    fs.writeFileSync(file, content, 'utf8');
}

fixEncoding('src/app/page.tsx');
fixEncoding('src/app/thi/page.tsx');

// Fix caching in API
let apiFile = 'src/app/api/students/route.ts';
let apiContent = fs.readFileSync(apiFile, 'utf8');
if (!apiContent.includes('force-dynamic')) {
    apiContent = apiContent.replace(
        "export async function GET",
        "export const dynamic = 'force-dynamic';\n\nexport async function GET"
    );
    fs.writeFileSync(apiFile, apiContent, 'utf8');
}

console.log("Fixes applied successfully.");
