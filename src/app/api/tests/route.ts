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
        return NextResponse.json(tree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
