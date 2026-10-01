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
            
            const tuHocDir = path.join(dataDir, week, 'TL_TU_HOC', 'BO_TEST');
            if (fs.existsSync(tuHocDir)) {
                tree[week]["TL_TU_HOC"] = fs.readdirSync(tuHocDir);
            }
            
            const deThiDir = path.join(dataDir, week, 'DE_THI', 'TestCases');
            if (fs.existsSync(deThiDir)) {
                tree[week]["DE_THI"] = fs.readdirSync(deThiDir);
            }
        }
        return NextResponse.json(tree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
