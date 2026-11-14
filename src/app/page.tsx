"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

import { useMode } from "@/components/ModeContext";
import { fingerprintOutput } from "@/lib/gradingShared";
import { PyRunner } from "@/lib/pyRunner";

export default function Home() {
  const { mode } = useMode();
  const [structure, setStructure] = useState<any>({});
  const [week, setWeek] = useState("");
  const [category, setCategory] = useState("TL_TU_HOC");
  const [problem, setProblem] = useState("");
  const [code, setCode] = useState("# Viết code tại đây\n");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Bộ chạy Python trong luồng riêng (chống treo trang khi code lặp vô hạn)
  const runnerRef = useRef<PyRunner | null>(null);
  const getRunner = () => {
    if (!runnerRef.current) runnerRef.current = new PyRunner();
    return runnerRef.current;
  };
  const [progress, setProgress] = useState("");
  const [subtaskSummary, setSubtaskSummary] = useState<any>(null);
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  // Chấm chuẩn HSG (giới hạn thời gian, TLE, điểm theo subtask) chỉ áp dụng cho Nâng Cao và Luyện Đề
  const strictMode = mode === 'DOI_TUYEN' || mode === 'LUYEN_DE';

  useEffect(() => {
    return () => { runnerRef.current?.dispose(); };
  }, []);
  
  const [studentName, setStudentName] = useState("");
  const [students, setStudents] = useState<string[]>([]);
  const [docsTree, setDocsTree] = useState<any>({});
  const [examsList, setExamsList] = useState<any[]>([]);
  const [showTheoryModal, setShowTheoryModal] = useState(false);
  const [theoryUrl, setTheoryUrl] = useState('');
  const [modalTitle, setModalTitle] = useState('Lý thuyết đang học');

  useEffect(() => {
    fetch("/api/tests", { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setStructure(data);
        const searchParams = new URLSearchParams(window.location.search);
        const paramWeek = searchParams.get('week');
        const paramCat = searchParams.get('cat');
        if (paramCat) setCategory(paramCat);

        const weeks = Object.keys(data)
          .filter(w => w !== 'DE_KTGK')
          .sort((a, b) => {
            const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
            const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
            return numA - numB;
          });

        if (paramWeek && weeks.includes(paramWeek)) {
          setWeek(paramWeek);
        } else if (weeks.length > 0) {
          setWeek(weeks[0]);
        }
      });

    fetch("/api/docs", { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setDocsTree(data))
      .catch(() => console.log("Không thể tải tài liệu lý thuyết"));

    fetch("/api/exams", { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setExamsList(data))
      .catch(() => console.log("Không thể tải danh sách đề thi"));

    fetch("/data/students.json", { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
          setStudents(data);
          if (data.length > 0) setStudentName(data[0]);
      })
      .catch(() => console.log("Không tìm thấy file danh sách học sinh"));
  }, []);

  useEffect(() => {
    if (structure[week] && structure[week][category]) {
      setProblem(structure[week][category][0] || "");
    }
  }, [week, category, structure]);

  const getTestUrl = (testName: string, ext: string) => {
    const subfolder = category === "TL_TU_HOC" ? "BO_TEST" : "TestCases";
    const problemName = problem.replace("TEST_", "");
    return `/data/${week}/${category}/${subfolder}/${problem}/${testName}/${problemName}.${ext}`;
  };

  const submitCode = async () => {
    if (!problem) return alert("Vui lòng chọn bài!");
    setIsLoading(true);
    setResults([]);
    setSubtaskSummary(null);

    const strict = strictMode;
    let limitMs = strict ? 2000 : 10000; // Cơ Bản: chỉ chặn vòng lặp vô hạn, không tính TLE chặt
    const subtaskOf = new Map<string, number>();

    try {
      if (strict) {
        try {
          const infoRes = await fetch(`/api/grade?week=${encodeURIComponent(week)}&category=${encodeURIComponent(category)}&problem=${encodeURIComponent(problem)}`);
          const info = await infoRes.json();
          if (infoRes.ok) {
            if (info.timeLimitMs) limitMs = info.timeLimitMs;
            (info.subtasks || []).forEach((st: any, i: number) => (st.tests || []).forEach((tn: string) => subtaskOf.set(tn, i)));
          }
        } catch (e) {}
        setTimeLimitMs(limitMs);
      }

      // Chỉ tải dữ liệu vào (.INP). Đáp án (.OUT) nằm trên máy chủ: máy chủ tự so và tính điểm.
      setProgress("Đang tải dữ liệu test...");
      const testCases: { name: string, inp: string }[] = [];
      const maxTests = category === "TL_TU_HOC" ? 10 : 20;
      for (let i = 1; i <= maxTests; i++) {
        const testFolder = `Test${i.toString().padStart(2, "0")}`;
        try {
          const inpRes = await fetch(getTestUrl(testFolder, "INP"));
          if (!inpRes.ok) break;
          testCases.push({ name: testFolder, inp: await inpRes.text() });
        } catch(e) {
          break;
        }
      }

      if (testCases.length === 0) {
        throw new Error("Không tìm thấy dữ liệu Test Case cho bài này.");
      }

      setProgress("Đang chuẩn bị Python...");
      const runner = getRunner();
      await runner.warmup();

      const localRuns: { name: string, actual?: string, err?: string, ms?: number, tle?: boolean, skipped?: boolean }[] = [];
      const fingerprints: any[] = [];
      const tleStreak = new Map<number, number>();
      const pName = problem.replace("TEST_", "");

      for (let idx = 0; idx < testCases.length; idx++) {
        const t = testCases[idx];
        const st = subtaskOf.get(t.name) ?? -1;
        // 2 test liên tiếp cùng subtask đã quá thời gian: bỏ qua các test còn lại của subtask đó cho đỡ chờ
        if ((tleStreak.get(st) || 0) >= 2) {
          localRuns.push({ name: t.name, tle: true, skipped: true });
          continue;
        }
        setProgress(`Đang chạy ${t.name} (${idx + 1}/${testCases.length})...`);

        let smartInp = t.inp;
        if (mode === 'DAI_TRA' && !code.includes('split(') && !code.includes('split()') && !code.includes('sys.stdin.read')) {
            smartInp = (t.inp || "").trim().replace(/[ \t]+/g, '\n');
        }

        const r = await runner.run(code, smartInp, pName, limitMs);
        if (r.status === 'TLE') {
          tleStreak.set(st, (tleStreak.get(st) || 0) + 1);
          localRuns.push({ name: t.name, tle: true, ms: r.ms });
          continue;
        }
        tleStreak.set(st, 0);
        if (r.status === 'RE') {
          if ((r.err || '').startsWith('Không tải được Python')) throw new Error(r.err);
          localRuns.push({ name: t.name, err: r.err, ms: r.ms });
          continue;
        }
        localRuns.push({ name: t.name, actual: r.out, ms: r.ms });
        fingerprints.push({ name: t.name, ...(await fingerprintOutput(r.out)) });
      }

      // Gửi dấu vân tay kết quả lên máy chủ chấm (so theo từ: "4 2" và "4\n2" như nhau)
      setProgress("Đang gửi kết quả lên máy chấm...");
      const gradeRes = await fetch('/api/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'HSG', strict, week, category, problem, code, results: fingerprints })
      });
      const grade = await gradeRes.json();
      if (!gradeRes.ok || !grade.token) {
          throw new Error(grade.error || "Máy chấm không phản hồi");
      }

      const fmt = (ms?: number) => (ms === undefined ? "" : (ms / 1000).toFixed(2) + "s");
      const verdictOf = new Map<string, any>((grade.tests || []).map((v: any) => [v.name, v]));
      const testResults: any[] = localRuns.map(run => {
          if (run.tle) {
              return {
                  name: run.name, status: "QUÁ THỜI GIAN", css: "bg-orange-50 border-orange-200 text-orange-700",
                  time: run.skipped ? "bỏ qua" : "> " + (limitMs / 1000) + "s",
                  note: run.skipped ? "Không chạy vì 2 test trước cùng subtask đã quá thời gian." : "Thuật toán chưa đủ nhanh với dữ liệu lớn."
              };
          }
          if (run.err !== undefined) {
              return { name: run.name, status: "LỖI CHẠY CODE", css: "bg-amber-50 border-amber-200 text-amber-700", err: run.err, time: fmt(run.ms) };
          }
          const v = verdictOf.get(run.name);
          if (v && v.status === "DUNG") {
              return { name: run.name, status: "ĐÚNG", css: "bg-emerald-50 border-emerald-200 text-emerald-700", time: fmt(run.ms) };
          }
          return { name: run.name, status: "SAI", css: "bg-rose-50 border-rose-200 text-rose-700", expected: v?.expected, actual: run.actual, time: fmt(run.ms) };
      });
      const passedCount = grade.passed;

      setResults(testResults);
      if (grade.subtasks) {
          setSubtaskSummary({ subtasks: grade.subtasks, score: grade.score, maxScore: grade.maxScore });
      }

      // Lưu lịch sử
      const history = JSON.parse(localStorage.getItem('submissionHistory') || '[]');
      history.unshift({ date: new Date().toLocaleString('vi-VN'), week, problem, score: strict ? grade.score : passedCount, maxScore: grade.maxScore, code });
      localStorage.setItem('submissionHistory', JSON.stringify(history.slice(0, 30)));

      const nTle = testResults.filter((r: any) => r.status === "QUÁ THỜI GIAN").length;
      const subtaskNote = grade.subtasks
          ? grade.subtasks.map((st: any) => `${st.ten}: ${st.dung}/${st.tong} test (${st.dat}/${st.diem}đ)`).join("; ") + (nTle ? `; ${nTle} test quá thời gian` : "") + ". "
          : "";
      const firstError = subtaskNote + ((testResults.find((r: any) => r.err)?.err || "").slice(0, 300) || (passedCount < grade.total ? "Sai Logic / Không khớp Output" : "Hoàn hảo"));

      await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              studentName,
              mode,
              week,
              category,
              problem,
              score: grade.score,
              maxScore: grade.maxScore,
              errorMsg: firstError,
              code: code,
              gradedCode: code,
              gradeToken: grade.token
          })
      });

    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setIsLoading(false);
      setProgress("");
    }
  };

  const exportResults = () => {
      let content = `=======================================\n`;
      content += `PHIẾU CHẤM BÀI - HỆ THỐNG THI HSG\n`;
      content += `=======================================\n`;
      content += `Học sinh: ${studentName}\n`;
      content += `Tuần: ${week} | Loại: ${category === "TL_TU_HOC" ? "Tự Học" : "Đề Thi"}\n`;
      content += `Bài thi: ${problem}\n`;
      content += `Thời gian nộp: ${new Date().toLocaleString('vi-VN')}\n`;
      content += `---------------------------------------\n`;
      content += `Số test đúng: ${results.filter(r => r.status.includes('ĐÚNG')).length} / ${results.length}\n`;
      if (subtaskSummary) {
          content += `Điểm: ${subtaskSummary.score} / ${subtaskSummary.maxScore}\n`;
          subtaskSummary.subtasks.forEach((st: any) => {
              content += `   ${st.ten}: ${st.dung}/${st.tong} test -> ${st.dat}/${st.diem} điểm\n`;
          });
      }
      content += `---------------------------------------\n`;
      content += `CHI TIẾT TEST CASES:\n`;
      results.forEach(res => {
          content += `[${res.name}] - ${res.status}\n`;
          if (res.expected) {
              content += `   + Mẫu:    ${res.expected.replace(/\n/g, ' ')}\n`;
              content += `   + Lỗi do: ${res.actual.replace(/\n/g, ' ')}\n`;
          }
          if (res.err) {
              content += `   + Lỗi:    ${res.err}\n`;
          }
      });
      content += `=======================================\n`;
      content += `MÃ NGUỒN (SOURCE CODE):\n`;
      content += `${code}\n`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PhieuCham_${studentName}_${problem}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-slate-800 selection:bg-indigo-500/20">
      
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* Panel trái: Cài đặt */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-2xl shadow-indigo-100/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">ProCoder VIP</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Nền tảng thi đua HSG</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HỌC SINH</label>
                    {students.length > 0 ? (
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)}>
                        {students.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nhập tên..." />
                    )}
                  </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tuần</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-slate-700 font-semibold cursor-pointer shadow-sm" value={week} onChange={(e) => setWeek(e.target.value)}>
                    {Object.keys(structure).filter(w => w !== 'DE_KTGK').map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Loại Bài</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-slate-700 font-semibold cursor-pointer shadow-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="TL_TU_HOC">Tự học</option>
                    <option value="DE_THI">Đề thi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chọn Bài Thi</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-700 font-mono font-bold cursor-pointer shadow-sm" value={problem} onChange={(e) => setProblem(e.target.value)}>
                  {structure[week]?.[category]?.map((p: string) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 bg-indigo-50/80 border border-indigo-100 p-5 rounded-2xl relative overflow-hidden group hover:bg-indigo-100/50 transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <h3 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Trình chấm Serverless
              </h3>
              <p className="text-xs text-indigo-700/80 leading-relaxed font-medium">Mã nguồn được biên dịch và chạy an toàn qua môi trường WebAssembly (Pyodide). Điểm số được tự động đồng bộ lên hệ thống Google Sheets của giáo viên.</p>
            </div>
          </div>
        </div>

        {/* Panel phải: Editor & Kết quả */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-indigo-100/40 flex flex-col overflow-hidden">
            
            {/* Thanh công cụ / Top Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="flex gap-3">
                {category === 'DE_THI' ? (
                  <button onClick={() => {
                    const exam = examsList.find((e: any) => e.week === week);
                    if (exam && exam.pdfUrl) {
                      setTheoryUrl(exam.pdfUrl);
                      setModalTitle('Đề Thi ' + week + ' - ' + exam.title);
                      setShowTheoryModal(true);
                    } else if (exam && exam.docxUrl) {
                      window.open(exam.docxUrl, '_blank');
                    } else {
                      alert('Chưa có đề thi cho tuần này');
                    }
                  }} className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
                    📄 Đọc Đề Thi
                  </button>
                ) : (
                  <button onClick={() => {
                    const weekDocs = docsTree[week] || [];
                    const doc = weekDocs.find((d: any) => d.mode === 'ALL' || d.mode === mode) || weekDocs[0];
                    if(doc) {
                      setTheoryUrl(doc.url);
                      setModalTitle('Lý thuyết đang học');
                      setShowTheoryModal(true);
                    } else {
                      alert('Chưa có lý thuyết cho tuần này');
                    }
                  }} className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
                    📖 Lý Thuyết
                  </button>
                )}
                {results.length > 0 && (
                  <button onClick={exportResults} className="flex items-center gap-2 bg-white hover:bg-slate-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-200 shadow-sm hover:shadow">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Xuất Phiếu Điểm
                  </button>
                )}
                <button 
                    onClick={submitCode} 
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      {progress || "Đang chấm..."}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Chạy Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Editor (Giữ giao diện tối mờ cho giống VS Code) */}
            <div className="h-96 w-full relative">
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(val) => {
                  setCode(val || "");
                  // Bắt đầu tải Python ngầm khi học sinh bắt đầu gõ code, lúc chấm không phải chờ
                  getRunner().warmup().catch(() => {});
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 16 }
                }}
              />
            </div>
          </div>

          {/* Bảng kết quả chia 2 cột */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-indigo-100/40 p-6 flex flex-col max-h-[28rem]">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              Báo Cáo Test Cases {results.length > 0 && <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">(Đạt {results.filter(r => r.status === "ĐÚNG").length}/{results.length})</span>}
            </h3>
            
            {strictMode && (
              <div className="mb-3 text-xs font-semibold text-orange-800 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 shrink-0">
                ⏱️ Chấm chuẩn HSG: giới hạn {(timeLimitMs / 1000).toLocaleString('vi-VN')} giây/test, điểm tính theo subtask (thang 10). Python trên trình duyệt chạy chậm hơn máy thi nên giới hạn đã được nới.
              </div>
            )}

            {subtaskSummary && (
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                <div className="p-3 rounded-2xl bg-indigo-600 text-white flex flex-col justify-center shadow">
                  <span className="text-xs font-semibold opacity-80">Tổng điểm</span>
                  <span className="text-2xl font-black">{subtaskSummary.score} / {subtaskSummary.maxScore}</span>
                </div>
                {subtaskSummary.subtasks.map((st: any) => (
                  <div key={st.ten} className={"p-3 rounded-2xl border flex flex-col justify-center " + (st.dung === st.tong ? "bg-emerald-50 border-emerald-200 text-emerald-800" : st.dung === 0 ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-amber-50 border-amber-200 text-amber-800")}>
                    <span className="text-xs font-bold">{st.ten}</span>
                    <span className="text-lg font-black">{st.dat} / {st.diem} điểm</span>
                    <span className="text-xs font-semibold opacity-80">{st.dung}/{st.tong} test đúng</span>
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full flex-1 text-slate-400">
                <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                <p className="text-sm font-medium">Kết quả chạy code sẽ hiển thị tại đây...</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
                {results.map((res, i) => (
                    <div key={i} className={"p-4 rounded-2xl border " + res.css + " transition-all hover:scale-[1.02] flex flex-col shadow-sm"}>
                        <div className="font-bold flex items-center gap-2 text-sm">
                            {res.status === "ĐÚNG" ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            )}
                            {res.name}: {res.status}
                            {res.time && <span className="ml-auto text-xs font-mono font-semibold opacity-70">{res.time}</span>}
                        </div>
                        {res.note && <div className="mt-2 text-xs font-semibold opacity-80">{res.note}</div>}
                        {res.expected && (
                            <div className="mt-3 text-xs bg-white/60 p-3 rounded-xl border border-black/5 space-y-2 flex-1 shadow-inner">
                                <div className="flex gap-2">
                                  <span className="opacity-60 font-semibold w-16 shrink-0">Mẫu:</span>
                                  <span className="whitespace-pre-wrap font-mono font-bold flex-1 text-emerald-700">{res.expected}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="opacity-60 font-semibold w-16 shrink-0">Output:</span>
                                  <span className="whitespace-pre-wrap font-mono font-bold flex-1 text-rose-700">{res.actual}</span>
                                </div>
                            </div>
                        )}
                        {!res.expected && res.status === "SAI" && (
                            <div className="mt-3 text-xs bg-white/60 p-3 rounded-xl border border-black/5 flex-1 shadow-inner">
                                <span className="opacity-60 font-semibold">Output của em: </span>
                                <span className="whitespace-pre-wrap font-mono font-bold text-rose-700">{(res.actual || "(trống)").slice(0, 500)}</span>
                            </div>
                        )}
                        {res.err && <div className="mt-3 text-xs font-mono bg-white/60 p-3 rounded-xl border border-black/5 whitespace-pre-wrap flex-1 shadow-inner font-semibold">{res.err}</div>}
                    </div>
                ))}
            </div>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    {showTheoryModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowTheoryModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">{modalTitle}</h3>
              <button onClick={() => setShowTheoryModal(false)} className="text-slate-400 hover:text-rose-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <iframe src={theoryUrl + '#toolbar=1&navpanes=0'} className="w-full flex-1 border-0" />
          </div>
        </div>
      )}
</main>
  );
}
