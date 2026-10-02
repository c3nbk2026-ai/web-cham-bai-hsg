import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const tree: any = {};
    
    try {
        if (!fs.existsSync(dataDir)) return NextResponse.json({});
        
        const folders = fs.readdirSync(dataDir).filter(f => f.startsWith('TUAN') || f.startsWith('DE_'));
        
        for (const folder of folders) {
            tree[folder] = { "TL_TU_HOC": [], "DE_THI": [] };
            
            if (folder.startsWith('DE_')) {
                // Đọc file .pdf và .docx làm danh sách đề thi
                const folderPath = path.join(dataDir, folder);
                const files = fs.readdirSync(folderPath)
                    .filter(f => f.toLowerCase().endsWith('.pdf') || f.toLowerCase().endsWith('.docx'));
                
                // Với mỗi file đề, tìm thông tin TestCase tương ứng trong thư mục Test_Case
                const deList = files.map(file => {
                    const baseName = file.replace(/\.[^/.]+$/, ''); // VD: "1" từ "1.docx"
                    
                    // Tìm thư mục De tương ứng (De01, De02...) khớp theo số thứ tự
                    const deNum = parseInt(baseName);
                    if (!isNaN(deNum)) {
                        const deFolderName = 'De' + deNum.toString().padStart(2, '0'); // "De01"
                        const testCasePath = path.join(dataDir, folder, 'Test_Case', deFolderName, 'Test01');
                        
                        let problemName = baseName; // Mặc định dùng tên file
                        if (fs.existsSync(testCasePath)) {
                            // Lấy tên file INP để biết tên bài toán (VD: DIEM từ DIEM.INP)
                            const inpFile = fs.readdirSync(testCasePath).find(f => f.toUpperCase().endsWith('.INP'));
                            if (inpFile) {
                                problemName = inpFile.replace(/\.[^/.]+$/, ''); // VD: "DIEM"
                            }
                        }
                        
                        return {
                            file,          // "1.docx" - dùng để hiển thị viewer
                            deFolderName,  // "De01" - dùng để tìm TestCases
                            problemName,   // "DIEM" - tên file INP/OUT
                        };
                    }
                    return { file, deFolderName: '', problemName: baseName };
                });
                
                tree[folder]["DE_THI"] = deList;
            } else {
                // Với TUAN (HSG)
                const getDirs = (paths: string[]) => {
                    for (const p of paths) {
                        const fullPath = path.join(dataDir, folder, ...p.split('/'));
                        if (fs.existsSync(fullPath)) {
                            return fs.readdirSync(fullPath);
                        }
                    }
                    return [];
                };

                const tuHocDirs = getDirs(['TL_TU_HOC/BO_TEST', 'TAI_LIEU/BO_TEST', 'BO_TEST']);
                tree[folder]["TL_TU_HOC"] = tuHocDirs;
                
                const deThiDirs = getDirs(['DE_THI/TestCases', 'DE_THI/BO_TEST']);
                tree[folder]["DE_THI"] = deThiDirs.length > 0 ? deThiDirs : tuHocDirs;
            }
        }
        return NextResponse.json(tree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
