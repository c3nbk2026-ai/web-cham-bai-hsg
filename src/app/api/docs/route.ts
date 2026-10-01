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
            
            const tuHocDir = path.join(dataDir, week, 'TL_TU_HOC');
            if (fs.existsSync(tuHocDir)) {
                // Find all files that are PDFs (can add more later)
                const files = fs.readdirSync(tuHocDir)
                    .filter(f => f.endsWith('.pdf'));
                
                for (const file of files) {
                    docsTree[week].push({
                        name: file,
                        url: `/data/${week}/TL_TU_HOC/${file}`
                    });
                }
            }
        }
        return NextResponse.json(docsTree);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
