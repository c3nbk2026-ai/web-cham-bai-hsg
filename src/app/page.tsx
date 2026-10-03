"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

import Script from "next/script";
import { useMode } from "@/components/ModeContext";

export default function Home() {
  const { mode } = useMode();
  const [structure, setStructure] = useState<any>({});
  const [week, setWeek] = useState("");
  const [category, setCategory] = useState("TL_TU_HOC");
  const [problem, setProblem] = useState("");
  const [code, setCode] = useState("# Viết code tại đây\n");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [studentClass, setStudentClass] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentsData, setStudentsData] = useState<Record<string, string[]>>({});
  const [docsTree, setDocsTree] = useState<any>({});
  const [showTheoryModal, setShowTheoryModal] = useState(false);
  const [theoryUrl, setTheoryUrl] = useState('');

  useEffect(() => {
    fetch("/api/tests")
      .then((res) => res.json())
      .then((data) => {
        setStructure(data);
        const weeks = Object.keys(data).filter(w => w !== 'DE_KTGK');
        if (weeks.length > 0) {
          setWeek(weeks[0]);
        }
      });

    fetch("/api/docs")
      .then(res => res.json())
      .then(data => setDocsTree(data))
      .catch(() => console.log("Không thể tải tài liệu lý thuyết"));

    fetch("/data/students.json")
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

  const initPyodide = async () => {
    if (pyodide) return pyodide;
    if (!(window as any).loadPyodide) return null;
    const py = await (window as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
    });
    setPyodide(py);
    return py;
  };

  const getTestUrl = (testName: string, ext: string) => {
    const subfolder = category === "TL_TU_HOC" ? "BO_TEST" : "TestCases";
    const problemName = problem.replace("TEST_", "");
    return `/data/${week}/${category}/${subfolder}/${problem}/${testName}/${problemName}.${ext}`;
  };

  const submitCode = async () => {
    if (!problem) return alert("Vui lòng chọn bài!");
    setIsLoading(true);
    setResults([]);

    try {
      const py = await initPyodide();
      if (!py) throw new Error("Chưa tải được trình biên dịch Python.");

      const testCases = [];
      const maxTests = category === "TL_TU_HOC" ? 10 : 20;
      for (let i = 1; i <= maxTests; i++) {
        const testFolder = `Test${i.toString().padStart(2, "0")}`;
        try {
          const inpRes = await fetch(getTestUrl(testFolder, "INP"));
          const outRes = await fetch(getTestUrl(testFolder, "OUT"));
          
          if (!inpRes.ok || !outRes.ok) break;
          
          testCases.push({
            name: testFolder,
            inp: await inpRes.text(),
            out: (await outRes.text()).trim(),
          });
        } catch(e) {
          break;
        }
      }

      if (testCases.length === 0) {
        throw new Error("Không tìm thấy dữ liệu Test Case cho bài này.");
      }

      let passedCount = 0;
      const testResults = [];

      for (const t of testCases) {
        const pName = problem.replace("TEST_", "");
        
        try {
            let smartInp = t.inp;
        if (mode === 'DAI_TRA' && !code.includes('split(') && !code.includes('split()') && !code.includes('sys.stdin.read')) {
            smartInp = (t.inp || "").trim().replace(/[ \t]+/g, '\n');
        }
        py.globals.set("test_input_data", smartInp);
            await py.runPythonAsync(`
import sys
import io
sys.stdin = io.StringIO(test_input_data)
sys.stdout = io.StringIO()
            `);
            
            try { py.FS.writeFile(pName + ".INP", smartInp); } catch(e) {}
            try { py.FS.writeFile(pName + ".inp", smartInp); } catch(e) {}
            try { py.FS.writeFile(pName + ".OUT", ""); } catch(e) {}
            try { py.FS.writeFile(pName + ".out", ""); } catch(e) {}

            await py.runPythonAsync(code);

            let actualOut = "";
            try { actualOut = py.FS.readFile(pName + ".OUT", { encoding: "utf8" }).trim(); } catch(e) {}
            if (!actualOut) {
                try { actualOut = py.FS.readFile(pName + ".out", { encoding: "utf8" }).trim(); } catch(e) {}
            }
            if (!actualOut) {
                actualOut = await py.runPythonAsync("sys.stdout.getvalue().strip()");
            }
            
            const normalize = (s: string) => (s || "").replace(/\r/g, "").split("\n").map(l => l.trimEnd()).join("\n").trim();
            
            if (normalize(actualOut) === normalize(t.out)) {
                testResults.push({ name: t.name, status: "ĐÚNG", css: "bg-emerald-50 border-emerald-200 text-emerald-700" });
                passedCount++;
            } else {
                testResults.push({ name: t.name, status: "SAI", css: "bg-rose-50 border-rose-200 text-rose-700", expected: t.out, actual: actualOut });
            }
        } catch (e: any) {
            testResults.push({ name: t.name, status: "LỖI CHẠY CODE", css: "bg-amber-50 border-amber-200 text-amber-700", err: e.message });
        }
      }

      setResults(testResults);

      // Lưu lịch sử
      const history = JSON.parse(localStorage.getItem('submissionHistory') || '[]');
      history.unshift({ date: new Date().toLocaleString('vi-VN'), week, problem, score: passedCount, maxScore: testCases.length, code });
      localStorage.setItem('submissionHistory', JSON.stringify(history.slice(0, 30)));

      const firstError = testResults.find(r => r.err)?.err || (passedCount < testCases.length ? "Sai Logic / Không khớp Output" : "Hoàn hảo");

      await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              studentName,
              mode,
              week,
              category,
              problem,
              score: passedCount,
              maxScore: testCases.length,
              errorMsg: firstError,
              code: code
          })
      });

    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setIsLoading(false);
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
      content += `Tổng điểm: ${results.filter(r => r.status.includes('ĐÚNG')).length} / ${results.length}\n`;
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
      <Script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js" />
      
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
              <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">L?p</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentClass} onChange={(e) => {
                      const newClass = e.target.value;
                      setStudentClass(newClass);
                      if (studentsData[newClass] && studentsData[newClass].length > 0) {
                        setStudentName(studentsData[newClass][0]);
                      } else {
                        setStudentName("");
                      }
                    }}>
                      {Object.keys(studentsData).sort().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">H?c Sinh</label>
                    {studentClass && studentsData[studentClass] && studentsData[studentClass].length > 0 ? (
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)}>
                        {studentsData[studentClass].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nh?p t�n..." />
                    )}
                  </div>
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
                <button onClick={() => {
                  const weekDocs = docsTree[week] || [];
                  const doc = weekDocs.find((d: any) => d.mode === 'ALL' || d.mode === mode) || weekDocs[0];
                  if(doc) { setTheoryUrl(doc.url); setShowTheoryModal(true); } else { alert('Chưa có lý thuyết cho tuần này'); }
                }} className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">📖 Lý Thuyết</button>
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
                      Đang chấm...
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
                onChange={(val) => setCode(val || "")}
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
                        </div>
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
              <h3 className="font-bold text-lg text-slate-800">Lý thuyết đang học</h3>
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
