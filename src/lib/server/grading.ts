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
    expected?: string; // chỉ trả về ở trang Nộp bài (HSG), không trả về ở Phòng thi KTGK
}

export interface SubtaskResult {
    ten: string;
    diem: number;      // điểm tối đa của subtask
    dat: number;       // điểm đạt được
    dung: number;      // số test đúng
    tong: number;      // số test của subtask
}

export interface GradeResult {
    kind: 'HSG' | 'KTGK';
    problem: string;
    passed: number;
    total: number;
    score: string;
    maxScore: number;
    tests: TestVerdict[];
    strict?: boolean;            // true = chấm chuẩn HSG (Nâng Cao, Luyện Đề)
    subtasks?: SubtaskResult[];
}

// ============ CẤU HÌNH SUBTASK (private-data/.../TEST_X/subtasks.json) ============

export interface ProblemConfig {
    timeLimitMs: number;
    maxScore: number;
    subtasks: { ten: string; diem: number; testNums: number[] }[];
}

const DEFAULT_TIME_LIMIT_MS = 2000;

/** "1-12" | "13-20" | "1,3,5-7" → [1,2,...] */
function parseRange(spec: unknown): number[] {
    const out: number[] = [];
    for (const part of String(spec || '').split(',')) {
        const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!m) continue;
        const a = parseInt(m[1]), b = m[2] ? parseInt(m[2]) : a;
        for (let i = Math.min(a, b); i <= Math.max(a, b) && out.length < 500; i++) out.push(i);
    }
    return out;
}

function testNumber(name: string): number {
    return parseInt(name.replace(/\D/g, '')) || 0;
}

export function readProblemConfig(baseDir: string, testNames: string[]): ProblemConfig {
    const nums = testNames.map(testNumber);
    let raw: any = null;
    try { raw = JSON.parse(fs.readFileSync(path.join(baseDir, 'subtasks.json'), 'utf8')); } catch {}
    const maxScore = Number(raw?.diemToiDa) > 0 ? Number(raw.diemToiDa) : 10;
    const seconds = Number(raw?.gioiHanThoiGianGiay);
    const timeLimitMs = seconds > 0 ? Math.round(seconds * 1000) : DEFAULT_TIME_LIMIT_MS;
    let subtasks = Array.isArray(raw?.subtasks) ? raw.subtasks.map((s: any, i: number) => ({
        ten: String(s?.ten || `Subtask ${i + 1}`),
        diem: Number(s?.diem) || 0,
        testNums: parseRange(s?.tests).filter(n => nums.includes(n)),
    })).filter((s: any) => s.testNums.length > 0 && s.diem > 0) : [];
    if (subtasks.length === 0) {
        // Không có cấu hình: cả bài là một subtask, mỗi test bằng điểm nhau
        subtasks = [{ ten: 'Toàn bài', diem: maxScore, testNums: nums }];
    }
    return { timeLimitMs, maxScore, subtasks };
}

// ============ ĐƯỜNG DẪN ĐÁP ÁN ============

function resolveHsg(body: any) {
    const week = safeSegment(body?.week, 'Tuần');
    const category = body?.category === 'TL_TU_HOC' ? 'TL_TU_HOC' : 'DE_THI';
    const problem = safeSegment(body?.problem, 'Tên bài');
    const pName = problem.replace(/^TEST_/i, '');
    const sub = category === 'TL_TU_HOC' ? 'BO_TEST' : 'TestCases';
    return { baseDir: path.join(PRIVATE_DATA_DIR, week, category, sub, problem), pName, problem };
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
        .sort((a, b) => testNumber(a) - testNumber(b))
        .map(d => ({ name: d, expected: readExpected(path.join(baseDir, d), pName) }))
        .filter((t): t is { name: string; expected: string } => t.expected !== null);
}

/** Thông tin công khai của bài (giới hạn thời gian, các subtask) để trình duyệt biết trước khi chạy. */
export function hsgProblemInfo(query: any) {
    const { baseDir, pName } = resolveHsg(query);
    const tests = listTests(baseDir, pName);
    const cfg = readProblemConfig(baseDir, tests.map(t => t.name));
    return {
        timeLimitMs: cfg.timeLimitMs,
        maxScore: cfg.maxScore,
        subtasks: cfg.subtasks.map(s => ({
            ten: s.ten,
            diem: s.diem,
            tests: tests.filter(t => s.testNums.includes(testNumber(t.name))).map(t => t.name),
        })),
    };
}

/**
 * Chấm bài: so dấu vân tay kết quả của học sinh với đáp án trên máy chủ.
 *  - HSG Cơ Bản (trang Nộp bài): so theo từ (token), mỗi test đúng = 1 điểm.
 *  - HSG chấm chuẩn (strict: Nâng Cao, Luyện Đề): điểm theo subtask, thang 10.
 *  - KTGK (Phòng thi): so theo dòng; sai định dạng nhưng đúng các con số = 0.5 test; quy về thang 3.
 */
export async function gradeSubmission(body: any): Promise<GradeResult> {
    const kind = body?.kind === 'KTGK' ? 'KTGK' : 'HSG';
    const strict = kind === 'HSG' && body?.strict === true;
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
        ({ baseDir, pName, problem } = resolveHsg(body));
        // Trang Nộp bài (luyện tập HSG): test sai hiện "Mẫu" để học sinh đối chiếu, cả Tự học lẫn Đề thi.
        // Phòng thi KTGK thì KHÔNG hiện.
        showExpected = true;
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

    if (strict) {
        const cfg = readProblemConfig(baseDir, tests.map(t => t.name));
        const okNums = new Set(verdicts.filter(v => v.status === 'DUNG').map(v => testNumber(v.name)));
        const subtasks: SubtaskResult[] = cfg.subtasks.map(s => {
            const dung = s.testNums.filter(n => okNums.has(n)).length;
            const dat = Math.round(s.diem * dung / s.testNums.length * 100) / 100;
            return { ten: s.ten, diem: s.diem, dat, dung, tong: s.testNums.length };
        });
        const sum = Math.round(subtasks.reduce((a, s) => a + s.dat, 0) * 100) / 100;
        return { kind, problem, passed, total, score: String(sum), maxScore: cfg.maxScore, tests: verdicts, strict, subtasks };
    }

    const score = kind === 'KTGK' ? (passed / total * 3).toFixed(1) : String(passed);
    const maxScore = kind === 'KTGK' ? 3 : total;
    return { kind, problem, passed, total, score, maxScore, tests: verdicts };
}
