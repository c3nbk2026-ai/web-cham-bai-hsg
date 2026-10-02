import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const tree: any = {};
    
    try {
        if (!fs.existsSync(dataDir)) return NextResponse.json({});
        
        // Quét các thư mục TUAN (dành cho HSG) và các thư mục bắt đầu bằng DE_ (dành cho thi định kỳ)
        const folders = fs.readdirSync(dataDir).filter(f => f.startsWith('TUAN') || f.startsWith('DE_'));
        
        for (const folder of folders) {
            tree[folder] = { "TL_TU_HOC": [], "DE_THI": [] };
            
            if (folder.startsWith('DE_')) {
                // Với thư mục đề thi (DE_KTGK), đọc trực tiếp cả file PDF VÀ DOCX
                const folderPath = path.join(dataDir, folder);
                if (fs.existsSync(folderPath)) {
                    const files = fs.readdirSync(folderPath)
                        .filter(f => f.toLowerCase().endsWith('.pdf') || f.toLowerCase().endsWith('.docx'));
                    // Giữ nguyên phần mở rộng (.pdf, .docx) để client biết cách hiển thị
                    tree[folder]["DE_THI"] = files;
                }
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

                const tuHocDirs = getDirs([
                    'TL_TU_HOC/BO_TEST',
                    'TAI_LIEU/BO_TEST',
                    'BO_TEST' 
                ]);
                tree[folder]["TL_TU_HOC"] = tuHocDirs;
                
                const deThiDirs = getDirs([
                    'DE_THI/TestCases',
                    'DE_THI/BO_TEST'
                ]);
                // Đối với chế độ cũ, cần lấy tên thư mục
                tree[folder]["DE_THI"] = deThiDirs.length > 0 ? deThiDirs : tuHocDirs;
            }
        }
        return NextResponse.json(tree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
