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
                // Đọc các file chung (không chia nhóm)
                const files = fs.readdirSync(actualPath).filter(f => f.endsWith('.pdf'));
                for (const file of files) {
                    docsTree[week].push({ name: file, url: `/data/${week}/${foundDir}/${file}`, mode: 'ALL' });
                }

                // Đọc file Đại Trà
                if (fs.existsSync(path.join(actualPath, 'DAI_TRA'))) {
                    const dtFiles = fs.readdirSync(path.join(actualPath, 'DAI_TRA')).filter(f => f.endsWith('.pdf'));
                    for (const file of dtFiles) {
                        docsTree[week].push({ name: file, url: `/data/${week}/${foundDir}/DAI_TRA/${file}`, mode: 'DAI_TRA' });
                    }
                }

                // Đọc file Đội Tuyển
                if (fs.existsSync(path.join(actualPath, 'DOI_TUYEN'))) {
                    const dtFiles = fs.readdirSync(path.join(actualPath, 'DOI_TUYEN')).filter(f => f.endsWith('.pdf'));
                    for (const file of dtFiles) {
                        docsTree[week].push({ name: file, url: `/data/${week}/${foundDir}/DOI_TUYEN/${file}`, mode: 'DOI_TUYEN' });
                    }
                }
            }
        }
        return NextResponse.json(docsTree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
