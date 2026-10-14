import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const exams: any[] = [];

    try {
        if (!fs.existsSync(dataDir)) return NextResponse.json([]);

        const weekFolders = fs.readdirSync(dataDir)
            .filter(f => f.startsWith('TUAN '))
            .sort((a, b) => {
                const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
                const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
                return numA - numB;
            });

        for (const week of weekFolders) {
            const deThiDir = path.join(dataDir, week, 'DE_THI');
            if (!fs.existsSync(deThiDir)) continue;

            const files = fs.readdirSync(deThiDir);
            const docxFile = files.find(f => f.toLowerCase().endsWith('.docx'));
            const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));

            if (!docxFile && !pdfFile) continue;

            const weekNum = parseInt(week.replace(/[^0-9]/g, '')) || 0;

            // Tìm danh sách bài toán trong TestCases
            let problems: string[] = [];
            const testCasesDir = path.join(deThiDir, 'TestCases');
            if (fs.existsSync(testCasesDir)) {
                const problemOrderMap: Record<string, string[]> = {
                    'TUAN 1': ['NUMPRIME', 'CHONQUA'],
                    'TUAN 2': ['NUMSUM', 'NONGSAN'],
                    'TUAN 3': ['SIEUDEP', 'DALAT'],
                    'TUAN 4': ['SOPHUONG', 'CHELOC'],
                    'TUAN 5': ['HOANHAO', 'MUAHOA'],
                    'TUAN 6': ['PALINNUM', 'RAUCU'],
                    'TUAN 7': ['PRIMEODD', 'SAURIENG'],
                    'TUAN 8': ['PALINPRIME', 'BODILINH'],
                    'TUAN 9': ['NEGADIV', 'TUYENLAM'],
                    'TUAN 10': ['ARMSTRONG', 'GIATRI'],
                    'TUAN 11': ['RLECOMP', 'XECHO'],
                    'TUAN 12': ['FIBONUM', 'TAITRONG'],
                };
                const expectedOrder = problemOrderMap[week] || [];
                problems = fs.readdirSync(testCasesDir)
                    .filter(f => fs.statSync(path.join(testCasesDir, f)).isDirectory())
                    .map(p => p.replace(/^TEST_/i, ''))
                    .sort((a, b) => {
                        const idxA = expectedOrder.indexOf(a);
                        const idxB = expectedOrder.indexOf(b);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return a.localeCompare(b);
                    });
            }

            // Tiêu đề đề thi
            let title = `Đề thi HSG Lâm Đồng Dạng 1 & 2 (Đề số ${weekNum})`;
            if (docxFile) {
                const match = docxFile.match(/\(?(\d+)\)?\.docx$/i);
                if (match) {
                    title = `Đề thi HSG Lâm Đồng Dạng 1 & 2 (Đề số ${match[1]})`;
                }
            }

            exams.push({
                week,
                weekNum,
                title,
                docxFile: docxFile || null,
                pdfFile: pdfFile || null,
                docxUrl: docxFile ? `/data/${week}/DE_THI/${docxFile}` : null,
                pdfUrl: pdfFile ? `/data/${week}/DE_THI/${pdfFile}` : null,
                problems,
            });
        }

        return NextResponse.json(exams);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
