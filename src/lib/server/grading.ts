import fs from 'fs';
import path from 'path';
import { fingerprintOutput } from '@/lib/gradingShared';

/** Đáp án (.OUT) nằm ở đây, KHÔNG nằm trong public/ nên trình duyệt không tải được. */
export const PRIVATE_DATA_DIR = path.join(process.cwd(), 'private-data');

export class GradeError extends Error {}

/** Chỉ chấp nhận tên thư mục/bài "sạch" để không ai đọc được file ngoài private-data. */
function safeSegment(value: unknown, label: string): string {
    if (typeof value !== 'string') throw new GradeError(`Thiếu ${label}`);
    const v = value.trim();
    if (!v || v.length > 80 || v.includes('..') || !/^[\p{L}\p{N} _\-().]+$/u.test(v)) {
        throw new GradeError(`${label} không hợp lệ`);
    }
    return v;
}

export interface ClientResult {
    name: string;
    hLine?: string;
    hTok?: string;
    hNum?: string;
}

export interface TestVerdict {
    name: string;
    status: 'DUNG' | 'VOT' | 'SAI';
    expected?: string; // chỉ trả về ở chế độ Tự học
}

export interface GradeResult {
    kind: 'HSG' | 'KTGK';
    problem: string;
    passed: number;
    total: number;
    score: string;
    maxScore: number;
    tests: TestVerdict[];
}

function readExpected(dir: string, pName: string): string | null {
    for (const ext of ['.OUT', '.out']) {
        const f = path.join(dir, pName + ext);
        if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
    }
    return null;
}

function listTests(baseDir: string, pName: string): { name: string; expected: string }[] {
    if (!fs.existsSync(baseDir)) throw new GradeError('Không tìm thấy đáp án của bài này trên máy chủ');
    return fs.readdirSync(baseDir)
        .filter(d => /^Test\d+$/i.test(d))
        .sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
        .map(d => ({ name: d, expected: readExpected(path.join(baseDir, d), pName) }))
        .filter((t): t is { name: string; expected: string } => t.expected !== null);
}

/**
 * Chấm bài: so dấu vân tay kết quả của học sinh với đáp án trên máy chủ.
 *  - HSG (trang Nộp bài): so theo từ (token), mỗi test đúng = 1 điểm.
 *  - KTGK (Phòng thi): so theo dòng; sai định dạng nhưng đúng các con số = 0.5 test; quy về thang 3.
 */
export async function gradeSubmission(body: any): Promise<GradeResult> {
    const kind = body?.kind === 'KTGK' ? 'KTGK' : 'HSG';
    const results: ClientResult[] = Array.isArray(body?.results) ? body.results.slice(0, 100) : [];
    const byName = new Map<string, ClientResult>();
    for (const r of results) {
        if (r && typeof r.name === 'string') byName.set(r.name.toLowerCase(), r);
    }

    let baseDir: string;
    let pName: string;
    let problem: string;
    let showExpected = false;

    if (kind === 'KTGK') {
        const folder = safeSegment(body.folder, 'Thư mục đề');
        const deFolder = safeSegment(body.deFolderName, 'Mã đề');
        pName = safeSegment(body.problem, 'Tên bài');
        problem = pName;
        baseDir = path.join(PRIVATE_DATA_DIR, folder, 'Test_Case', deFolder);
    } else {
        const week = safeSegment(body.week, 'Tuần');
        const category = body.category === 'TL_TU_HOC' ? 'TL_TU_HOC' : 'DE_THI';
        problem = safeSegment(body.problem, 'Tên bài');
        pName = problem.replace(/^TEST_/i, '');
        const sub = category === 'TL_TU_HOC' ? 'BO_TEST' : 'TestCases';
        baseDir = path.join(PRIVATE_DATA_DIR, week, category, sub, problem);
        showExpected = category === 'TL_TU_HOC';
    }

    const tests = listTests(baseDir, pName);
    if (tests.length === 0) throw new GradeError('Bài này chưa có đáp án trên máy chủ');

    let passed = 0;
    const verdicts: TestVerdict[] = [];
    for (const t of tests) {
        const r = byName.get(t.name.toLowerCase());
        const fp = await fingerprintOutput(t.expected);
        let status: TestVerdict['status'] = 'SAI';
        if (r) {
            if (kind === 'HSG') {
                if (r.hTok === fp.hTok) status = 'DUNG';
            } else {
                if (r.hLine === fp.hLine) status = 'DUNG';
                else if (fp.hNum && r.hNum === fp.hNum) status = 'VOT';
            }
        }
        if (status === 'DUNG') passed += 1;
        if (status === 'VOT') passed += 0.5;
        const v: TestVerdict = { name: t.name, status };
        if (showExpected && status === 'SAI') v.expected = t.expected.trim().slice(0, 4000);
        verdicts.push(v);
    }

    const total = tests.length;
    const score = kind === 'KTGK' ? (passed / total * 3).toFixed(1) : String(passed);
    const maxScore = kind === 'KTGK' ? 3 : total;
    return { kind, problem, passed, total, score, maxScore, tests: verdicts };
}
