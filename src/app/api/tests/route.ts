import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const tree: any = {};
    
    try {
        if (!fs.existsSync(dataDir)) return NextResponse.json({});
        
        const weeks = fs.readdirSync(dataDir).filter(f => f.startsWith('TUAN'));
        for (const week of weeks) {
            tree[week] = { "TL_TU_HOC": [], "DE_THI": [] };
            
            // Hàm trợ giúp kiểm tra thư mục tồn tại và trả về danh sách thư mục con
            const getDirs = (paths: string[]) => {
                for (const p of paths) {
                    const fullPath = path.join(dataDir, week, ...p.split('/'));
                    if (fs.existsSync(fullPath)) {
                        return fs.readdirSync(fullPath);
                    }
                }
                return [];
            };

            // Lấy danh sách bài Tự Học
            const tuHocDirs = getDirs([
                'TL_TU_HOC/BO_TEST',
                'TAI_LIEU/BO_TEST',
                'BO_TEST' // Fallback nếu nằm ngay ngoài
            ]);
            tree[week]["TL_TU_HOC"] = tuHocDirs;
            
            // Lấy danh sách bài Đề Thi
            const deThiDirs = getDirs([
                'DE_THI/TestCases',
                'DE_THI/BO_TEST'
            ]);
            // Nếu Đề Thi trống mà bên ngoài có BO_TEST, gán tạm để code hoạt động
            tree[week]["DE_THI"] = deThiDirs.length > 0 ? deThiDirs : tuHocDirs;
        }
        return NextResponse.json(tree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
