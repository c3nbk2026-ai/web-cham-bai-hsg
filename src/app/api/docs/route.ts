import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function formatDisplayName(fileName: string, week: string): string {
    const clean = fileName
        .replace(/^hs-hsg[-_ ]?/i, '')
        .replace(/^hs-hs[-_ ]?/i, '')
        .replace(/\.pdf$/i, '')
        .trim();

    const match = clean.match(/^(?:huong[-_ ]?dan[-_ ]?tu[-_ ]?hoc|hướng[-_ ]?dẫn[-_ ]?tự[-_ ]?học)[-_ ]?tuan[-_ ]?(\d+)/i);
    if (match) {
        return `Hướng dẫn tự học tuần ${match[1]}`;
    }

    const matchTuan = clean.match(/^(?:tuan|tuần)[-_ ]?(\d+)/i);
    if (matchTuan) {
        return `Hướng dẫn tự học tuần ${matchTuan[1]}`;
    }

    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(clean)) {
        return clean.replace(/_/g, ' ');
    }

    const weekNum = week.replace(/[^0-9]/g, '');
    if (weekNum) {
        return `Hướng dẫn tự học tuần ${weekNum}`;
    }

    return clean.replace(/[-_]/g, ' ');
}

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
                    const displayName = formatDisplayName(file, week);
                    docsTree[week].push({ name: file, displayName, url: `/data/${week}/${foundDir}/${file}`, mode });
                }
            }
        }
        return NextResponse.json(docsTree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
