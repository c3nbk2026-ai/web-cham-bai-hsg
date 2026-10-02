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
            
            // Check both possible folder names
            const possibleDirs = ['TL_TU_HOC', 'TAI_LIEU'];
            let foundDir = '';
            let actualPath = '';
            
            for (const pDir of possibleDirs) {
                const testPath = path.join(dataDir, week, pDir);
                if (fs.existsSync(testPath)) {
                    actualPath = testPath;
                    foundDir = pDir;
                    break;
                }
            }
            
            if (actualPath) {
                // Find all files that are PDFs
                const files = fs.readdirSync(actualPath)
                    .filter(f => f.endsWith('.pdf'));
                
                for (const file of files) {
                    docsTree[week].push({
                        name: file,
                        url: `/data/${week}/${foundDir}/${file}`
                    });
                }
            }
        }
        return NextResponse.json(docsTree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
