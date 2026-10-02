import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const docsTree: any = {};
    
    try {
        if (!fs.existsSync(dataDir)) return NextResponse.json({});
        
        const weeks = fs.readdirSync(dataDir).filter(f => f.startsWith('TUAN'));
        for (const week of weeks) {
            docsTree[week] = [];
            
            const possibleDirs = ['TL_TU_HOC', 'TAI_LIEU'];
            let actualPath = '';
            let foundDir = '';
            
            for (const pDir of possibleDirs) {
                const testPath = path.join(dataDir, week, pDir);
                if (fs.existsSync(testPath)) {
                    actualPath = testPath;
                    foundDir = pDir;
                    break;
                }
            }
            
            if (actualPath) {
                const files = fs.readdirSync(actualPath).filter(f => f.endsWith('.pdf'));
                for (const file of files) {
                    let mode = 'ALL';
                    const lower = file.toLowerCase();
                    if (lower.startsWith('hs-hsg')) {
                        mode = 'DOI_TUYEN';
                    } else if (lower.startsWith('hs-hs')) {
                        mode = 'DAI_TRA';
                    }
                    docsTree[week].push({ name: file, url: `/data/${week}/${foundDir}/${file}`, mode });
                }
            }
        }
        return NextResponse.json(docsTree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
