import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const tree: any = {};
    
    try {
        if (!fs.existsSync(dataDir)) return NextResponse.json({});
        
        // Quét các thư mục TUAN (dành cho HSG) và các thư mục bắt đầu bằng DE_ (dành cho thi định kỳ, VD: DE_KTGK)
        const folders = fs.readdirSync(dataDir).filter(f => f.startsWith('TUAN') || f.startsWith('DE_'));
        
        for (const folder of folders) {
            tree[folder] = { "TL_TU_HOC": [], "DE_THI": [] };
            
            if (folder.startsWith('DE_')) {
                // Với thư mục đề thi (DE_KTGK), đọc trực tiếp các file PDF ngay bên trong thư mục đó
                const folderPath = path.join(dataDir, folder);
                if (fs.existsSync(folderPath)) {
                    const files = fs.readdirSync(folderPath)
                        .filter(f => f.toLowerCase().endsWith('.pdf'))
                        .map(f => f.slice(0, -4)); // Bỏ đuôi .pdf để lấy tên bài
                    tree[folder]["DE_THI"] = files;
                }
            } else {
                // Với TUAN (HSG), đọc các TestCases
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
                tree[folder]["DE_THI"] = deThiDirs.length > 0 ? deThiDirs : tuHocDirs;
            }
        }
        return NextResponse.json(tree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
