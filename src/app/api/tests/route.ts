import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const tree: any = {};
    
    try {
        if (!fs.existsSync(dataDir)) return NextResponse.json({});
        
        // Quét các thư mục TUAN (dành cho HSG) và NGAN_HANG_DE (dành cho thi định kỳ)
        const folders = fs.readdirSync(dataDir).filter(f => f.startsWith('TUAN') || f === 'NGAN_HANG_DE');
        
        for (const folder of folders) {
            tree[folder] = { "TL_TU_HOC": [], "DE_THI": [] };
            
            if (folder === 'NGAN_HANG_DE') {
                // Với NGAN_HANG_DE, chỉ cần đọc trực tiếp các file PDF trong thư mục DE_THI
                const deThiPath = path.join(dataDir, folder, 'DE_THI');
                if (fs.existsSync(deThiPath)) {
                    const files = fs.readdirSync(deThiPath)
                        .filter(f => f.toLowerCase().endsWith('.pdf'))
                        .map(f => f.slice(0, -4)); // Bỏ đuôi .pdf để lấy tên bài (ví dụ: BAI1)
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
