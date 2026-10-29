"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

import Script from "next/script";

// Kiểu dữ liệu đề thi từ API
interface ExamItem {
  file: string;        // "1.docx"
  deFolderName: string; // "De01"
  problemName: string;  // "DIEM"
  templateCode?: string; // Code mẫu điền khuyết
}

// BẢNG DỮ LIỆU ĐỀ THI GỐC (RENDER TRỰC TIẾP CHỮ TO RÕ NÉT, TÁCH BẠCH 2 DÒNG OUTPUT ĐẦU RA)
const EXAM_PREVIEW_DATA: Record<string, { title: string; desc: string; sampleIn: string; outLine1: string; outLine2: string }> = {
  "NHAPAM": {
    title: "ĐỀ SỐ 01: ĐIỀU KHIỂN NHẬP SỐ NGUYÊN ÂM",
    desc: "Viết chương trình yêu cầu nhập một số nguyên âm x từ bàn phím (kiểu int). Nếu người dùng nhập số không phải là số âm thì phải yêu cầu nhập lại liên tục cho đến khi nhận được một số nguyên âm thì dừng và in ra thông báo cùng giá trị x.",
    sampleIn: "5 3 2 -1",
    outLine1: "DA NHAP SO AM",
    outLine2: "-1"
  },
  "NHAPKHONGAM": {
    title: "ĐỀ SỐ 02: ĐIỀU KHIỂN NHẬP SỐ NGUYÊN KHÔNG ÂM",
    desc: "Viết chương trình yêu cầu nhập một số nguyên không âm y từ bàn phím (kiểu int). Nếu người dùng nhập số âm thì phải yêu cầu nhập lại liên tục cho đến khi nhận được một số không âm thì dừng và in ra thông báo cùng giá trị y.",
    sampleIn: "-5 -1 -3 4",
    outLine1: "DA NHAP SO KHONG AM",
    outLine2: "4"
  },
  "NHAPCANH": {
    title: "ĐỀ SỐ 03: NHẬP CẠNH HÌNH VUÔNG",
    desc: "Viết chương trình nhập vào độ dài cạnh của một hình vuông a từ bàn phím (kiểu float). Nếu độ dài cạnh không hợp lệ (không phải số dương) thì phải yêu cầu nhập lại liên tục cho đến khi nhận được giá trị hợp lệ thì dừng và in ra thông báo cùng giá trị a.",
    sampleIn: "-5.0 -2.0 -1.0 3.0",
    outLine1: "DA NHAP CANH HINH VUONG",
    outLine2: "3.0"
  },
  "NHAPBANKINH": {
    title: "ĐỀ SỐ 04: NHẬP BÁN KÍNH HÌNH TRÒN",
    desc: "Viết chương trình nhập vào bán kính của một hình tròn r từ bàn phím (kiểu float). Nếu bán kính không hợp lệ (không phải số dương) thì phải yêu cầu nhập lại liên tục cho đến khi nhận được giá trị hợp lệ thì dừng và in ra thông báo cùng giá trị r.",
    sampleIn: "-5.0 -2.0 -1.0 3.0",
    outLine1: "DA NHAP BAN KINH HINH TRON",
    outLine2: "3.0"
  },
  "NHAPCHAN": {
    title: "ĐỀ SỐ 05: NHẬP SỐ CHẴN",
    desc: "Viết chương trình yêu cầu nhập vào một số nguyên chẵn a từ bàn phím (kiểu int). Nếu người dùng nhập số lẻ thì phải yêu cầu nhập lại liên tục cho đến khi nhận được một số chẵn thì dừng và in ra thông báo cùng giá trị a.",
    sampleIn: "5 3 -7 2",
    outLine1: "DA NHAP SO CHAN",
    outLine2: "2"
  },
  "NHAPLE": {
    title: "ĐỀ SỐ 06: NHẬP SỐ LẺ",
    desc: "Viết chương trình yêu cầu nhập vào một số nguyên lẻ b từ bàn phím (kiểu int). Nếu người dùng nhập số chẵn thì phải yêu cầu nhập lại liên tục cho đến khi nhận được một số lẻ thì dừng và in ra thông báo cùng giá trị b.",
    sampleIn: "6 2 -4 1",
    outLine1: "DA NHAP SO LE",
    outLine2: "1"
  },
  "NHAPLECHUC": {
    title: "ĐỀ SỐ 07: NHẬP SỐ LẺ CHỤC (không chia hết cho 10)",
    desc: "Viết chương trình yêu cầu nhập vào một số lẻ chục c từ bàn phím (số nguyên không chia hết cho 10, kiểu int). Nếu người dùng nhập số tròn chục thì phải yêu cầu nhập lại liên tục cho đến khi nhận được một số lẻ chục thì dừng và in ra thông báo cùng giá trị c.",
    sampleIn: "60 20 -30 11",
    outLine1: "DA NHAP SO LE CHUC",
    outLine2: "11"
  },
  "NHAPTRONCHUC": {
    title: "ĐỀ SỐ 08: NHẬP SỐ TRÒN CHỤC",
    desc: "Viết chương trình yêu cầu nhập vào một số tròn chục d từ bàn phím (số nguyên chia hết cho 10, kiểu int). Nếu người dùng nhập số không tròn chục thì phải yêu cầu nhập lại liên tục cho đến khi nhận được một số tròn chục thì dừng và in ra thông báo cùng giá trị d.",
    sampleIn: "6 2 -7 10",
    outLine1: "DA NHAP SO TRON CHUC",
    outLine2: "10"
  },
  "NHAPDUONG": {
    title: "ĐỀ SỐ 09: NHẬP SỐ NGUYÊN DƯƠNG",
    desc: "Viết chương trình yêu cầu nhập vào một số nguyên dương n từ bàn phím (kiểu int). Nếu người dùng nhập số không phải là số dương thì phải yêu cầu nhập lại liên tục cho đến khi nhận được một số nguyên dương thì dừng và in ra thông báo cùng giá trị n.",
    sampleIn: "-5 -3 -1 7",
    outLine1: "DA NHAP SO DUONG",
    outLine2: "7"
  },
  "NHAPSOKHAC0": {
    title: "ĐỀ SỐ 10: NHẬP SỐ KHÁC 0",
    desc: "Viết chương trình yêu cầu nhập vào một số nguyên khác 0 n từ bàn phím (kiểu int). Nếu người dùng nhập số 0 thì phải yêu cầu nhập lại liên tục cho đến khi nhận được một số khác 0 thì dừng và in ra thông báo cùng giá trị n.",
    sampleIn: "0 0 5",
    outLine1: "DA NHAP SO KHAC 0",
    outLine2: "5"
  },
  "NHAPCHIA5": {
    title: "ĐỀ SỐ 11: NHẬP SỐ CHIA HẾT CHO 5",
    desc: "Viết chương trình yêu cầu nhập vào một số nguyên chia hết cho 5 n từ bàn phím (kiểu int). Nếu người dùng nhập số không chia hết cho 5 thì phải yêu cầu nhập lại liên tục cho đến khi nhận được một số chia hết cho 5 thì dừng và in ra thông báo cùng giá trị n.",
    sampleIn: "7 13 -8 25",
    outLine1: "DA NHAP SO CHIA HET CHO 5",
    outLine2: "25"
  },
  "NHAPCHIA3": {
    title: "ĐỀ SỐ 12: NHẬP SỐ CHIA HẾT CHO 3",
    desc: "Viết chương trình yêu cầu nhập vào một số nguyên chia hết cho 3 n từ bàn phím (kiểu int). Nếu người dùng nhập số không chia hết cho 3 thì phải yêu cầu nhập lại liên tục cho đến khi nhận được một số chia hết cho 3 thì dừng và in ra thông báo cùng giá trị n.",
    sampleIn: "8 10 -7 9",
    outLine1: "DA NHAP SO CHIA HET CHO 3",
    outLine2: "9"
  }
};

export default function ExamRoom() {
  const [structure, setStructure] = useState<any>({});
  const [className, setClassName] = useState("10A1");
  const [testFolder, setTestFolder] = useState("");
  const [examItem, setExamItem] = useState<ExamItem | null>(null);
  const [code, setCode] = useState("# Viết code tại đây\n");
  const [stdin, setStdin] = useState("");
  const [stdout, setStdout] = useState("");
  const [isOutputError, setIsOutputError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [studentClass, setStudentClass] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentsData, setStudentsData] = useState<Record<string, string[]>>({});
  const [isStudentLocked, setIsStudentLocked] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [violationCount, setViolationCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submissionSuccessData, setSubmissionSuccessData] = useState<any>(null);
  const [isCheckingStudent, setIsCheckingStudent] = useState(false);
  const [examFontSize, setExamFontSize] = useState<number>(16);
  
  // Security Layer States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [examConfig, setExamConfig] = useState<any>({});
  const [autoSubmitNotice, setAutoSubmitNotice] = useState<string>("");
  
  // State cho Modal Mật khẩu Giáo viên (Bảo mật ô B6 tab CauHinh)
  const [showTeacherUnlockModal, setShowTeacherUnlockModal] = useState(false);
  const [teacherPassInput, setTeacherPassInput] = useState("");
  const [teacherUnlockError, setTeacherUnlockError] = useState("");
  const [isVerifyingTeacherPass, setIsVerifyingTeacherPass] = useState(false);

  // State cho Modal Khôi phục Code Mẫu (In-app, chống mất Fullscreen)
  const [showResetCodeModal, setShowResetCodeModal] = useState(false);

  // Refs chống Stale Closure và phục vụ tự động nộp bài khi tắt trình duyệt / hết giờ
  const codeRef = useRef(code);
  const examItemRef = useRef(examItem);
  const studentNameRef = useRef(studentName);
  const classNameRef = useRef(className);
  const testFolderRef = useRef(testFolder);
  const violationCountRef = useRef(violationCount);
  const isFinishedRef = useRef(isFinished);
  const isSubmittingRef = useRef(isSubmitting);
  const stdoutRef = useRef(stdout);
  const isExamStartedRef = useRef(isExamStarted);
  const latestGradedScoreRef = useRef<{ score: string, maxScore: string, msg: string } | null>(null);

  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { examItemRef.current = examItem; }, [examItem]);
  useEffect(() => { studentNameRef.current = studentName; }, [studentName]);
  useEffect(() => { classNameRef.current = className; }, [className]);
  useEffect(() => { testFolderRef.current = testFolder; }, [testFolder]);
  useEffect(() => { violationCountRef.current = violationCount; }, [violationCount]);
  useEffect(() => { isFinishedRef.current = isFinished; }, [isFinished]);
  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  useEffect(() => { stdoutRef.current = stdout; }, [stdout]);
  useEffect(() => { isExamStartedRef.current = isExamStarted; }, [isExamStarted]);

  // Hàm tự động thu bài khẩn cấp khi học sinh đóng tab / tắt trình duyệt
  const submitEmergencyOnExit = () => {
    if (!isExamStartedRef.current || isFinishedRef.current) return;
    const curStudent = studentNameRef.current;
    const curClass = classNameRef.current;
    const curExam = examItemRef.current;
    if (!curStudent || !curExam) return;

    // Đánh dấu ngay lập tức
    isFinishedRef.current = true;
    isSubmittingRef.current = true;

    const curCode = codeRef.current || "";
    const fullSub = "--- MA NGUON (TU DONG THU KHI DONG TAB / TRINH DUYET) ---\n" + curCode + "\n\n--- KET QUA CHAY TAY ---\n" + (stdoutRef.current || "");
    const scoreObj = latestGradedScoreRef.current;
    const finalScore = scoreObj ? scoreObj.score : "0";
    const finalMax = scoreObj ? scoreObj.maxScore : "3";
    const finalMsg = "Tự động thu bài khi tắt trình duyệt. Vi phạm: " + violationCountRef.current + " lần." + (scoreObj ? (" [" + scoreObj.msg + "]") : " [Chờ GV chấm]");

    const payload = JSON.stringify({
      studentName: curStudent,
      mode: 'DE_THI',
      week: curClass,
      category: 'DE_THI',
      problem: curExam.problemName,
      score: finalScore,
      maxScore: finalMax,
      errorMsg: finalMsg,
      code: fullSub
    });

    // Ưu tiên navigator.sendBeacon chuẩn W3C cho việc gửi dữ liệu khi đóng trang
    let sent = false;
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        sent = navigator.sendBeacon('/api/sheets', blob);
      } catch(e) {}
    }

    if (!sent && typeof fetch !== 'undefined') {
      try {
        fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        });
      } catch(e) {}
    }

    // Lưu dự phòng bản nháp vào localStorage để nếu học sinh tải lại trang (F5) thì khôi phục được ngay
    try {
      if (curCode && curClass && curStudent) {
        localStorage.setItem("draft_code_" + curClass + "_" + curStudent, curCode);
      }
    } catch(e) {}
  };

  const handleAuth = async () => {
    if (!roomCodeInput) return setAuthError("Vui lòng nhập Mã Phòng Thi!");
    setIsCheckingCode(true);
    setAuthError("");
    try {
        const res = await fetch("/api/exam-config?t=" + Date.now());
        const data = await res.json();
        if (data.error) {
            setAuthError("Lỗi: " + data.error);
        } else {
            const cleanInput = (roomCodeInput || "").trim().toUpperCase();
            const cleanTarget = (data["MaPhongThi"] || "").trim().toUpperCase();
            if (cleanTarget && cleanInput === cleanTarget) {
                setExamConfig(data);
                if (data["ThoiGianThi"]) {
                    setTimeLeft(parseInt(data["ThoiGianThi"]) * 60);
                }
                if (data["LopDangThi"]) {
                    const activeClass = data["LopDangThi"].trim();
                    setClassName(activeClass);
                    if (studentsData[activeClass] && studentsData[activeClass].length > 0) {
                        setStudentName(studentsData[activeClass][0]);
                    }
                }
                // Xóa trạng thái nộp bài cũ của ca trước nếu có
                try {
                  sessionStorage.removeItem("exam_completed_submission");
                  localStorage.removeItem("exam_device_locked_student");
                } catch(e) {}
                setIsAuthorized(true);
            } else {
                setAuthError("Mã Phòng Thi không đúng!");
            }
        }
    } catch(e: any) {
        setAuthError("Lỗi kết nối máy chủ!");
    }
    setIsCheckingCode(false);
  };


  // Hàm thực hiện chuyển máy/đăng xuất nhường máy cho thí sinh tiếp theo (Ca 2)
  const handleLogoutForNextStudent = async () => {
    try {
      sessionStorage.clear();
      sessionStorage.removeItem("exam_completed_submission");
      localStorage.removeItem("exam_device_locked_student");
      if (className && studentName) {
        localStorage.removeItem(getAssignedExamKey(className, studentName));
        localStorage.removeItem("draft_code_" + className + "_" + studentName);
        localStorage.removeItem("exam_end_time_" + className + "_" + studentName.trim().toLowerCase());
      }
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch(e) {}

    // Reset toàn bộ trạng thái để thí sinh ca mới vào bốc đề
    setSubmissionSuccessData(null);
    setIsExamStarted(false);
    setIsFinished(false);
    setIsSubmitting(false);
    isFinishedRef.current = false;
    isSubmittingRef.current = false;
    setHasDrawn(false);
    setExamItem(null);
    setCode("# Viết code tại đây\n");
    setStdout("");
    setStdin("");
    setViolationCount(0);
    setIsStudentLocked(false);
    setAutoSubmitNotice("");

    // Tự động tải lại cấu hình phòng thi mới nhất từ Google Sheets (Lớp đang thi ca 2, thời gian thi)
    try {
      const res = await fetch("/api/exam-config?t=" + Date.now());
      const cfg = await res.json();
      if (!cfg.error) {
        setExamConfig(cfg);
        const duration = parseInt(cfg["ThoiGianThi"]) || 45;
        setTimeLeft(duration * 60);
        if (cfg["LopDangThi"]) {
          const activeClass = cfg["LopDangThi"].trim();
          setClassName(activeClass);
          if (studentsData[activeClass] && studentsData[activeClass].length > 0) {
            setStudentName(studentsData[activeClass][0]);
          }
        }
      }
    } catch(e) {
      setTimeLeft(45 * 60);
    }
  };

  const handleTeacherUnlock = async () => {
    if (!teacherPassInput.trim()) {
      setTeacherUnlockError("Vui lòng nhập mật khẩu Giáo viên!");
      return;
    }
    setIsVerifyingTeacherPass(true);
    setTeacherUnlockError("");
    try {
      const res = await fetch("/api/exam-config?t=" + Date.now());
      const cfg = await res.json();
      const correctPass = (cfg["MatKhauGiamThi"] || cfg["AdminPassword"] || "gv2026").trim();
      
      if (teacherPassInput.trim() === correctPass) {
        try {
          sessionStorage.clear();
          sessionStorage.removeItem("exam_completed_submission");
          localStorage.removeItem("exam_device_locked_student");
          if (className && studentName) {
            localStorage.removeItem(getAssignedExamKey(className, studentName));
            localStorage.removeItem("draft_code_" + className + "_" + studentName);
            localStorage.removeItem("exam_end_time_" + className + "_" + studentName.trim().toLowerCase());
          }
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch(e) {}
        setSubmissionSuccessData(null);
        setIsExamStarted(false);
        setIsFinished(false);
        setIsSubmitting(false);
        isFinishedRef.current = false;
        isSubmittingRef.current = false;
        setHasDrawn(false);
        setExamItem(null);
        setCode("# Viết code tại đây\n");
        setStdout("");
        setStdin("");
        setViolationCount(0);
        setIsStudentLocked(false);
        setAutoSubmitNotice("");

        // Reset thời gian làm bài từ cấu hình
        const duration = parseInt(cfg["ThoiGianThi"]) || 45;
        setTimeLeft(duration * 60);
        if (cfg["LopDangThi"]) {
          const activeClass = cfg["LopDangThi"].trim();
          setClassName(activeClass);
          if (studentsData[activeClass] && studentsData[activeClass].length > 0) {
            setStudentName(studentsData[activeClass][0]);
          }
        }

        setShowTeacherUnlockModal(false);
        setTeacherPassInput("");
        alert("Đã mở khóa phòng thi thành công! Thí sinh có thể chọn tên và bắt đầu thi.");
      } else {
        setTeacherUnlockError("Mật khẩu Giáo viên không chính xác (kiểm tra ô B6 tab CauHinh)!");
      }
    } catch(e) {
      setTeacherUnlockError("Lỗi kết nối máy chủ để xác thực mật khẩu!");
    } finally {
      setIsVerifyingTeacherPass(false);
    }
  };

  const renderTeacherUnlockModal = () => {
    if (!showTeacherUnlockModal) return null;
    return (
      <div className="fixed inset-0 z-[99999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Xác thực Giáo viên / Giám thị</h3>
              <p className="text-xs text-slate-400">Mật khẩu quy định tại ô B6 tab CauHinh</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 mb-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
            Nhập Mật khẩu Giáo viên để mở khóa máy tính cho học sinh thi lại hoặc chuyển máy cho thí sinh ca sau.
          </p>

          <div className="space-y-3 mb-5">
            <input 
              type="password" 
              autoFocus
              placeholder="Nhập mật khẩu Giáo viên..." 
              value={teacherPassInput}
              onChange={e => {
                setTeacherPassInput(e.target.value);
                setTeacherUnlockError("");
              }}
              onKeyDown={e => e.key === 'Enter' && handleTeacherUnlock()}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            {teacherUnlockError && (
              <div className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                {teacherUnlockError}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => {
                setShowTeacherUnlockModal(false);
                setTeacherPassInput("");
                setTeacherUnlockError("");
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button 
              type="button"
              onClick={handleTeacherUnlock}
              disabled={isVerifyingTeacherPass}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
            >
              {isVerifyingTeacherPass ? "Đang xác thực..." : "Xác nhận mở khóa"}
            </button>
          </div>
        </div>
      </div>
    );
  };


    const classes = ["10A1","10A2","10A3","10A4","10A5","10A6","10A7","10A8","10A9","10A10"];

  useEffect(() => {
    // 0. Dọn sạch cache đề cũ và khóa máy cục bộ để các ca thi dùng chung máy không bị chặn
    const BANK_VERSION = "2026_KTGK_V5_CLEAN_TEMPLATES";
    try {
      localStorage.removeItem("exam_device_locked_student");
      const currentVer = typeof window !== 'undefined' ? localStorage.getItem("exam_bank_version") : null;
      if (currentVer !== BANK_VERSION) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith("assigned_exam_") || key.startsWith("draft_code_") || key.startsWith("exam_device_locked_student")) {
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem("exam_bank_version", BANK_VERSION);
      }
    } catch(e) {}

    // 1. Khôi phục trạng thái đã nộp từ sessionStorage (chỉ trong cùng phiên tab hiện tại, không khóa máy cho học sinh sau)
    try {
      const savedSub = typeof window !== 'undefined' ? sessionStorage.getItem("exam_completed_submission") : null;
      if (savedSub) {
        const parsed = JSON.parse(savedSub);
        if (parsed && parsed.studentName) {
          setSubmissionSuccessData(parsed);
          setStudentName(parsed.studentName);
          if (parsed.className) setClassName(parsed.className);
          setIsAuthorized(true);
          setIsExamStarted(true);
          setIsFinished(true);
          return;
        }
      }
    } catch(e) {}

    fetch("/api/tests").then(r => r.json()).then(setStructure);

    // Tự động tải cấu hình ca thi mới nhất từ Google Sheets (LopDangThi, ThoiGianThi)
    fetch("/api/exam-config?t=" + Date.now())
      .then(r => r.json())
      .then(cfg => {
        if (!cfg.error) {
          setExamConfig(cfg);
          if (cfg["ThoiGianThi"]) {
            setTimeLeft(parseInt(cfg["ThoiGianThi"]) * 60);
          }
          if (cfg["LopDangThi"]) {
            setClassName(cfg["LopDangThi"].trim());
          }
        }
      })
      .catch(() => {});
    
    const params = new URLSearchParams(window.location.search);
    const studentParam = params.get('student');
    const classParam = params.get('class');
    if (studentParam) { setStudentName(studentParam); setIsStudentLocked(true); }
    if (classParam) { setClassName(classParam); }

    // Xóa query param trên URL sau khi nạp để tránh học sinh ca sau bị kẹt cứng tên học sinh cũ
    if (typeof window !== 'undefined' && (studentParam || classParam)) {
      try {
        window.history.replaceState({}, '', window.location.pathname);
      } catch(e) {}
    }

    fetch("/api/students?t=" + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.error) {
            console.error("Lỗi từ Google Sheets:", data.error);
            setStudentsData({"LỖI: Chưa cấp quyền": ["Vui lòng Share file cho email Bot"]});
            setStudentClass("LỖI: Chưa cấp quyền");
            setStudentName("Vui lòng Share file cho email Bot");
            return;
        }
        setStudentsData(data);
        const classes = Object.keys(data).sort();
        if (classes.length > 0) {
          if (classParam && data[classParam]) {
            setClassName(classParam);
            if (!studentParam && data[classParam].length > 0) {
              setStudentName(data[classParam][0]);
            }
          } else {
            setClassName(classes[0]);
            if (!studentParam && data[classes[0]].length > 0) {
              setStudentName(data[classes[0]][0]);
            }
          }
        }
        if (studentParam) {
          setStudentName(studentParam);
          setIsStudentLocked(true);
        }
      })
      .catch(() => console.log("Lỗi tải danh sách học sinh"));
  }, []);

  const findExamByProblemName = (pName: string) => {
    if (!pName) return null;
    const clean = pName.trim().toUpperCase();
    for (const folder of Object.keys(structure)) {
      if (Array.isArray(structure[folder]["DE_THI"])) {
        const found = structure[folder]["DE_THI"].find((it: ExamItem) => it.problemName.toUpperCase() === clean);
        if (found) return { folder, item: found };
      }
    }
    return null;
  };

  const checkStudentSubmissionStatus = async (targetStudent: string, targetClass: string) => {
    // 1. Cho phép dùng máy chung cho các ca thi khác nhau trong phòng máy (Google Sheets sẽ kiểm soát theo tên từng học sinh)

    // 2. Tra cứu tab DanhSachHS (cột F: MaDe) để kiểm tra lệnh mở khóa của Giáo viên
    let assignInfo = { found: false, assignedExam: null as string | null, rowIndex: 0 };
    try {
      const resAssign = await fetch(`/api/exam-assign?studentName=${encodeURIComponent(targetStudent)}&className=${encodeURIComponent(targetClass)}&t=${Date.now()}`);
      const assignData = await resAssign.json();
      if (assignData.found) {
        assignInfo = assignData;
      }
    } catch(err) {
      console.error("Lỗi kiểm tra mã đề trên DanhSachHS:", err);
    }

    // NẾU GIÁO VIÊN ĐÃ XÓA MÃ ĐỀ Ở CỘT F TRÊN TAB DanhSachHS HOẶC ĐÃ ĐƯỢC MỞ KHÓA -> CHO PHÉP THI LẠI!
    const isRetestUnlocked = typeof window !== "undefined" && sessionStorage.getItem("exam_retest_unlocked") === (targetStudent || "").trim().toLowerCase();

    if ((assignInfo.found && !assignInfo.assignedExam) || isRetestUnlocked) {
      try {
        sessionStorage.setItem("exam_retest_unlocked", (targetStudent || "").trim().toLowerCase());
        sessionStorage.removeItem("exam_completed_submission");
        localStorage.removeItem("exam_device_locked_student");
        localStorage.removeItem(getAssignedExamKey(targetClass, targetStudent));
        localStorage.removeItem("exam_end_time_" + targetClass + "_" + targetStudent.trim().toLowerCase());
      } catch(e) {}
      setSubmissionSuccessData(null);
      return { blocked: false, isUnlocked: true, rowIndex: assignInfo.rowIndex };
    }

    // 3. Nếu cột MaDe trên sheet vẫn còn -> Kiểm tra xem đã nộp bài trên sheet DiemThucHanh chưa
    try {
      const res = await fetch(`/api/sheets?studentName=${encodeURIComponent(targetStudent)}&className=${encodeURIComponent(targetClass)}&t=${Date.now()}`);
      const result = await res.json();
      if (result.submitted && result.data) {
        const d = result.data;
        alert(`CẢNH BÁO: Học sinh "${targetStudent}" (${targetClass}) ĐÃ NỘP BÀI THI vào lúc ${d.timestamp} (Đạt ${d.score}/3.0 điểm).\n\n(Nếu cần thi lại, vui lòng báo Giáo viên xóa ô Mã Đề tại cột F trong Google Sheet để mở khóa!)`);
        const subData = {
          score: d.score,
          maxScore: "3.0",
          problem: d.problem,
          passed: `${d.score}/3.0`,
          totalTests: 3,
          submittedAt: d.timestamp,
          studentName: targetStudent,
          className: targetClass
        };
        setSubmissionSuccessData(subData);
        try {
          sessionStorage.setItem("exam_completed_submission", JSON.stringify(subData));
        } catch(e) {}
        return { blocked: true, reason: "ALREADY_SUBMITTED" };
      }
    } catch (err) {
      console.error("Lỗi tra cứu bài nộp:", err);
    }

    return { blocked: false, assignedExam: assignInfo.assignedExam, rowIndex: assignInfo.rowIndex };
  };

  // Đảm bảo tên học sinh luôn thuộc lớp đang chọn, không bao giờ bị lệch sang lớp khác
  useEffect(() => {
    if (className && studentsData[className] && studentsData[className].length > 0) {
      if (!studentName || !studentsData[className].includes(studentName)) {
        setStudentName(studentsData[className][0]);
      }
    }
  }, [className, studentsData, studentName]);

  // HÀM TỐI GIẢN CODE MẪU: Bỏ các dòng chú thích rườm rà, chỉ giữ lại code sạch và làm nổi bật dòng điều kiện lặp
  const cleanTemplateCode = (raw: string) => {
    if (!raw) return raw;
    const lines = raw.split("\n");
    const cleaned: string[] = [];
    for (const line of lines) {
      if (line.startsWith("# ĐỀ SỐ") || line.startsWith("# Điền biểu thức")) continue;
      if (line.includes("# Bước 2:") || line.includes("ĐIỀN ĐIỀU KIỆN")) {
        cleaned.push("# 👇 ĐIỀN ĐIỀU KIỆN LẶP DƯỚI ĐÂY:");
        continue;
      }
      if (line.startsWith("# Bước 1:") || line.startsWith("# Bước 3:")) continue;
      cleaned.push(line);
    }
    return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  };

  // HÀM LÀM MỚI VÀ CẤP ĐỦ 100% THỜI GIAN THI QUY ĐỊNH (15 PHÚT)
  const resetTimerToFull = () => {
    const durationMinutes = parseInt(examConfig["ThoiGianThi"] || "15", 10) || 15;
    const totalSeconds = durationMinutes * 60;
    const timerKey = "exam_end_time_" + className + "_" + (studentName || "").trim().toLowerCase();
    try {
      const newEndTime = Date.now() + totalSeconds * 1000;
      localStorage.setItem(timerKey, newEndTime.toString());
    } catch(e) {}
    setTimeLeft(totalSeconds);
  };

  // Tự động nạp code mẫu điền khuyết khi có đề thi (chỉ khôi phục bản nháp khi học sinh đang thi bị F5)
  useEffect(() => {
    if (examItem && examItem.templateCode) {
      if (isExamStarted) {
        try {
          const savedDraft = localStorage.getItem("draft_code_" + className + "_" + studentName);
          if (savedDraft && savedDraft.trim() && savedDraft !== "# Viết code tại đây\n") {
            if (savedDraft.includes("# ĐỀ SỐ") || savedDraft.includes("# Bước 1:")) {
              const cleaned = cleanTemplateCode(savedDraft);
              setCode(cleaned);
              return;
            }
            setCode(savedDraft);
            return;
          }
        } catch(e) {}
      }
      // Khi mới bốc đề hoặc chưa bắt đầu thi: LUÔN LUÔN nạp code mẫu tối giản chỉ 8 dòng
      setCode(cleanTemplateCode(examItem.templateCode));
    }
  }, [examItem, isExamStarted]);

  useEffect(() => {
    if (!isExamStarted || isFinished) return;
    const handleVisibility = () => {
      if (document.hidden) { setViolationCount(c => c + 1); alert("CANH BAO GIAN LAN: Ban vua chuyen tab! Vi pham da duoc ghi lai."); }
    };
    const handleFullscreen = () => {
      if (!document.fullscreenElement) { setViolationCount(c => c + 1); alert("CANH BAO GIAN LAN: Ban vua thoat toan man hinh! Vi pham da duoc ghi lai."); }
    };
    const handleContext = (e: Event) => e.preventDefault();
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("contextmenu", handleContext);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("contextmenu", handleContext);
    };
  }, [isExamStarted, isFinished]);

  
  // BẢO VỆ BÀI THI: CẢNH BÁO KHI TẢI LẠI TRANG / THOÁT VÀ TỰ ĐỘNG LƯU NHÁP REAL-TIME
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExamStartedRef.current && !isFinishedRef.current) {
        // Lưu khẩn cấp bản nháp code vào localStorage
        try {
          if (classNameRef.current && studentNameRef.current && codeRef.current) {
            localStorage.setItem("draft_code_" + classNameRef.current + "_" + studentNameRef.current, codeRef.current);
          }
        } catch(err) {}

        const msg = "⚠️ BÀI THI ĐANG DIỄN RA! Bạn có chắc chắn muốn tải lại trang hoặc thoát không?";
        e.preventDefault();
        e.returnValue = msg;
        return msg;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!isExamStarted || isFinished) return;
    const timerKey = "exam_end_time_" + className + "_" + (studentName || "").trim().toLowerCase();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        try {
          const savedEndTime = localStorage.getItem(timerKey);
          if (savedEndTime) {
            const actualRemaining = Math.max(0, Math.floor((parseInt(savedEndTime, 10) - Date.now()) / 1000));
            if (actualRemaining <= 1) {
              clearInterval(timer);
              if (!isFinishedRef.current && !isSubmittingRef.current) {
                submitCode(true, "Hết thời gian làm bài");
              }
              return 0;
            }
            return actualRemaining;
          }
        } catch(e) {}

        if (prev <= 1) {
          clearInterval(timer);
          if (!isFinishedRef.current && !isSubmittingRef.current) {
            submitCode(true, "Hết thời gian làm bài");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExamStarted, isFinished, className, studentName]);

  const getAssignedExamKey = (cls: string, name: string) => "assigned_exam_" + (cls || "").trim() + "_" + (name || "").trim().toLowerCase();

  const loadSampleInput = async (itemToLoad = examItem, folderToLoad = testFolder) => {
    if (!itemToLoad || !folderToLoad) return;
    try {
      const sampleInpUrl = `/data/${folderToLoad}/Test_Case/${itemToLoad.deFolderName}/Test01/${itemToLoad.problemName}.INP`;
      const txt = await tryFetch(sampleInpUrl) || await tryFetch(sampleInpUrl.toLowerCase());
      if (txt && txt.trim()) {
        setStdin(txt.trim());
      }
    } catch(e) {}
  };

  // Tự động đối chiếu với Google Sheet (cột F) khi học sinh chọn tên hoặc F5 trang
  useEffect(() => {
    if (!className || !studentName || Object.keys(structure).length === 0) return;
    let isCancelled = false;

    const syncExamAssignment = async () => {
      try {
        const resAssign = await fetch(`/api/exam-assign?studentName=${encodeURIComponent(studentName)}&className=${encodeURIComponent(className)}&t=${Date.now()}`);
        const assignData = await resAssign.json();
        if (isCancelled) return;

        // 1. NẾU GIÁO VIÊN ĐÃ XÓA MÃ ĐỀ Ở CỘT F (để mở khóa thi lại hoặc chưa bốc đề bao giờ):
        if (assignData.found && !assignData.assignedExam) {
          try {
            localStorage.removeItem(getAssignedExamKey(className, studentName));
            localStorage.removeItem("draft_code_" + className + "_" + studentName);
            localStorage.removeItem("exam_end_time_" + className + "_" + studentName.trim().toLowerCase());
            sessionStorage.removeItem("exam_completed_submission");
            sessionStorage.setItem("exam_retest_unlocked", studentName.trim().toLowerCase());
          } catch(e) {}
          setHasDrawn(false);
          setExamItem(null);
          setSubmissionSuccessData(null);
          return;
        }

        // 2. NẾU CỘT F TRÊN GOOGLE SHEET ĐÃ CÓ MÃ ĐỀ: Cố định đúng mã đề đó!
        if (assignData.found && assignData.assignedExam) {
          const freshExam = findExamByProblemName(assignData.assignedExam);
          if (freshExam) {
            setExamItem(freshExam.item);
            setTestFolder(freshExam.folder);
            setHasDrawn(true);
            loadSampleInput(freshExam.item, freshExam.folder);
            return;
          }
        }
      } catch(err) {
        console.warn("Lỗi kiểm tra mã đề từ máy chủ:", err);
      }

      // 3. Fallback kiểm tra localStorage nếu mất kết nối mạng
      try {
        const savedExamStr = localStorage.getItem(getAssignedExamKey(className, studentName));
        if (savedExamStr) {
          const savedExam = JSON.parse(savedExamStr);
          const pName = savedExam?.item?.problemName || savedExam?.problemName;
          if (pName) {
            const freshExam = findExamByProblemName(pName);
            if (freshExam) {
              setExamItem(freshExam.item);
              setTestFolder(freshExam.folder);
              setHasDrawn(true);
              loadSampleInput(freshExam.item, freshExam.folder);
              return;
            }
          }
        }
      } catch(e) {}

      setHasDrawn(false);
      setExamItem(null);
    };

    syncExamAssignment();
    return () => { isCancelled = true; };
  }, [className, studentName, structure]);

  const drawExam = async () => {
    if (!studentName) return alert("Vui lòng chọn tên học sinh!");
    setIsCheckingStudent(true);
    const check = await checkStudentSubmissionStatus(studentName, className);
    setIsCheckingStudent(false);
    if (check.blocked) return;

    // 1. Nếu trên Google Sheet (cột F) ĐÃ CÓ MÃ ĐỀ: Cố định mã đề đó cho học sinh!
    if (check.assignedExam) {
      const found = findExamByProblemName(check.assignedExam);
      if (found) {
        setExamItem(found.item);
        setTestFolder(found.folder);
        setHasDrawn(true);
        if (found.item.templateCode && found.item.templateCode.trim()) {
          setCode(found.item.templateCode);
        }
        loadSampleInput(found.item, found.folder);
        alert(`Hệ thống ghi nhận bạn đã được giao bài: "${found.item.problemName}" (Đã lưu cố định trên Google Sheet).\nKhông thể đổi đề bằng cách tải lại trang!`);
        return;
      }
    }

    // 2. Nếu cột F trên Google Sheet ĐANG TRỐNG (chưa bốc lần nào hoặc vừa được Giáo viên xóa ô MaDe để mở khóa):
    let all: {folder: string, item: ExamItem}[] = [];
    const requiredTopic = examConfig["Chủ đề"];
    
    Object.keys(structure).forEach(folder => {
      let isMatch = false;
      if (requiredTopic) {
         isMatch = folder.includes(requiredTopic);
      } else {
         isMatch = folder.startsWith('DE_');
      }
      
      if (isMatch && Array.isArray(structure[folder]["DE_THI"])) {
        structure[folder]["DE_THI"].forEach((item: ExamItem) => all.push({folder, item}));
      }
    });
    
    if (all.length === 0) return alert(`Không tìm thấy bài thi nào ${requiredTopic ? 'cho chủ đề ' + requiredTopic : ''}!`);
    const r = all[Math.floor(Math.random() * all.length)];
    // Xóa sạch bản nháp cũ của thí sinh này để đảm bảo vào thi với code mẫu nguyên bản
    try {
      localStorage.removeItem("draft_code_" + className + "_" + studentName);
    } catch(e) {}
    setExamItem(r.item); 
    setTestFolder(r.folder); 
    setHasDrawn(true);
    if (r.item.templateCode && r.item.templateCode.trim()) {
      setCode(r.item.templateCode);
    }
    loadSampleInput(r.item, r.folder);

    // Tự động đồng bộ mã đề vừa bốc lên cột F tab DanhSachHS trên Google Sheet của Giáo viên!
    fetch('/api/exam-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName,
        className,
        examName: r.item.problemName,
        rowIndex: check.rowIndex
      })
    }).catch(err => console.error("Lỗi đồng bộ mã đề lên Google Sheet:", err));

    // Lưu dự phòng vào localStorage
    try {
      localStorage.setItem(getAssignedExamKey(className, studentName), JSON.stringify({ item: r.item, folder: r.folder }));
    } catch(e) {}
  };

  const startExam = async () => {
    if (!studentName) return alert("Vui lòng chọn tên học sinh!");
    if (!examItem) return alert("Vui lòng bốc thăm đề thi trước!");
    // Nếu chưa từng bốc đề trong phiên thì mới kiểm tra trạng thái thí sinh
    if (!hasDrawn) {
      setIsCheckingStudent(true);
      const check = await checkStudentSubmissionStatus(studentName, className);
      setIsCheckingStudent(false);
      if (check.blocked) return;
    }

    if (examItem && examItem.templateCode && (!code || code === "# Viết code tại đây\n" || code.includes("# ĐỀ SỐ"))) {
      setCode(cleanTemplateCode(examItem.templateCode));
    }

    // ĐẢM BẢO QUYỀN LỢI THỜI GIAN THI CHO CA 2 THEO ĐÚNG TAB CAUHINH TRÊN GOOGLE SHEETS
    let durationMinutes = parseInt(examConfig?.["ThoiGianThi"]) || 45;
    try {
      const res = await fetch("/api/exam-config?t=" + Date.now());
      const latestCfg = await res.json();
      if (!latestCfg.error && latestCfg["ThoiGianThi"]) {
        durationMinutes = parseInt(latestCfg["ThoiGianThi"]) || 45;
        setExamConfig(latestCfg);
      }
    } catch(err) {
      console.warn("Dùng cấu hình thời gian hiện tại:", err);
    }

    const totalSeconds = durationMinutes * 60;
    const timerKey = "exam_end_time_" + className + "_" + studentName.trim().toLowerCase();
    
    // Dọn sạch mọi timestamp của học sinh ca trước trên máy tính này để đảm bảo không bị trừ giờ oan
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("exam_end_time_") && k !== timerKey) {
          localStorage.removeItem(k);
        }
      });
    } catch(e) {}

    const isRetestUnlocked = typeof window !== "undefined" && sessionStorage.getItem("exam_retest_unlocked") === studentName.trim().toLowerCase();

    let currentRemaining = totalSeconds;
    try {
      if (isRetestUnlocked) {
        // Thí sinh được Giáo viên mở khóa cho thi lại: CẤP MỚI TRỌN VẸN 100% THỜI GIAN THI!
        const newEndTime = Date.now() + totalSeconds * 1000;
        localStorage.setItem(timerKey, newEndTime.toString());
        sessionStorage.removeItem("exam_retest_unlocked");
        currentRemaining = totalSeconds;
      } else {
        const savedEndTime = localStorage.getItem(timerKey);
        if (savedEndTime) {
          const diff = Math.floor((parseInt(savedEndTime, 10) - Date.now()) / 1000);
          // Nếu chính thí sinh này đang làm dở mà bị F5/reload: giữ nguyên số giây còn lại
          if (diff > 5 && diff <= totalSeconds) {
            currentRemaining = diff;
          } else {
            // Nếu mốc cũ đã hết hoặc không hợp lệ: cấp mới thời gian thi
            const newEndTime = Date.now() + totalSeconds * 1000;
            localStorage.setItem(timerKey, newEndTime.toString());
            currentRemaining = totalSeconds;
          }
        } else {
          // Lần đầu vào thi: cấp mới thời gian thi
          const newEndTime = Date.now() + totalSeconds * 1000;
          localStorage.setItem(timerKey, newEndTime.toString());
          currentRemaining = totalSeconds;
        }
      }
    } catch(e) {
      currentRemaining = totalSeconds;
    }

    setTimeLeft(currentRemaining);
    isFinishedRef.current = false;
    isSubmittingRef.current = false;
    setIsFinished(false);
    setIsSubmitting(false);

    document.documentElement.requestFullscreen().then(() => setIsExamStarted(true)).catch(() => setIsExamStarted(true));
  };

  const initPyodide = async () => {
    if (pyodide) return pyodide;
    if (!(window as any).loadPyodide) return null;
    const py = await (window as any).loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
    setPyodide(py); return py;
  };

  const runCode = async () => {
    if (!code.trim()) return;

    // 0. Kiểm tra nếu học sinh chưa điền điều kiện lặp (vẫn còn dấu ba chấm "..." trong chính câu lệnh while)
    const lines = code.split("\n");
    const hasEllipsisInWhile = lines.some(l => {
      const trimmed = l.trim();
      if (trimmed.startsWith("#")) return false; // Tuyệt đối bỏ qua dòng chú thích
      return trimmed.startsWith("while") && (trimmed.includes("...") || trimmed.includes("…"));
    });

    if (hasEllipsisInWhile) {
      setIsOutputError(true);
      setStdout(
        "⚠️ BẠN CHƯA ĐIỀN ĐIỀU KIỆN LẶP CHO VÒNG LẶP 'while':\n\n" +
        "👉 Hiện tại bạn vẫn đang để dấu ba chấm '...' ở dòng câu lệnh 'while ...:'.\n" +
        "👉 Hãy xóa dấu '...' và điền biểu thức điều kiện lặp thích hợp của đề bài trước khi bấm 'CHẠY CODE'!\n\n" +
        "💡 Lưu ý: Khi chưa điền điều kiện mà để dấu '...', máy tính sẽ coi điều kiện luôn Đúng và lặp vô tận khiến cạn kiệt dữ liệu."
      );
      return;
    }

    setIsLoading(true); setIsOutputError(false); setStdout("Đang nạp dữ liệu mẫu và chạy thử chương trình...");
    try {
      const py = await initPyodide();
      if (!py) throw new Error("Chưa tải được Python.");

      let currentStdin = stdin;
      let sampleInputData = "";

      // 1. Tự động lấy dữ liệu Test 01 của đề thi làm dữ liệu mẫu
      if (examItem && testFolder) {
        try {
          const sampleInpUrl = `/data/${testFolder}/Test_Case/${examItem.deFolderName}/Test01/${examItem.problemName}.INP`;
          const fetchedInp = await tryFetch(sampleInpUrl) || await tryFetch(sampleInpUrl.toLowerCase());
          if (fetchedInp && fetchedInp.trim()) {
            sampleInputData = fetchedInp.trim();
          }
        } catch(e) {}
      }

      // Nếu ô STDIN đang trống, tự động nạp Test 01 mẫu
      if (!currentStdin.trim() && sampleInputData) {
        currentStdin = sampleInputData;
        setStdin(currentStdin);
      }

      py.globals.set("custom_input_data", currentStdin);
      py.globals.set("sample_input_data", sampleInputData);
      py.globals.set("student_code", code);

      await py.runPythonAsync(`
import sys, io, traceback, json

custom_input = str(custom_input_data or "")
fallback_input = str(sample_input_data or "")

def execute_code(inp_text):
    sys.stdin = io.StringIO(inp_text)
    sys.stdout = io.StringIO()
    exec(student_code, {})
    return sys.stdout.getvalue()

output_body = ""
used_input = custom_input
is_fallback_used = False
is_err = False

try:
    output_body = execute_code(custom_input)
except EOFError:
    is_err = True
    if "..." in student_code or "…" in student_code:
        output_body = (
            "⚠️ BẠN CHƯA ĐIỀN ĐIỀU KIỆN LẶP (Dòng while vẫn còn dấu '...'):\\n\\n"
            "Trong Python, cú pháp 'while ...:' tương đương với 'while True:' khiến chương trình bị lặp vô tận và nuốt sạch dữ liệu.\\n"
            "👉 Hãy xóa dấu '...' và điền biểu thức điều kiện lặp đúng của đề bài!"
        )
    else:
        output_body = (
            "⚠️ VÒNG LẶP KHÔNG THỂ DỪNG LẠI (EOFError):\\n\\n"
            "Chương trình đã đọc hết tất cả các số trong 'Dữ liệu đầu vào' nhưng vòng lặp 'while' vẫn tiếp tục đòi nhập thêm.\\n"
            "👉 NGUYÊN NHÂN: Điều kiện lặp sau câu lệnh 'while' của bạn chưa chính xác (bị ngược hoặc luôn Đúng), khiến máy tính lặp vô tận không có điểm dừng!\\n"
            "👉 Hãy kiểm tra lại biểu thức điều kiện lặp của bạn."
        )
except SyntaxError as se:
    is_err = True
    msg = f"❌ LỖI CÚ PHÁP (SyntaxError): {se.msg} (dòng {se.lineno})"
    if "=" in student_code and "==" not in student_code:
        msg += "\\n👉 Lưu ý: So sánh bằng trong Python phải dùng hai dấu bằng '==' chứ không dùng một dấu '=' bạn nhé!"
    output_body = msg
except IndentationError as ie:
    is_err = True
    output_body = f"❌ LỖI THỤT ĐẦU DÒNG (IndentationError): {ie.msg} (dòng {ie.lineno})\\n👉 Bạn hãy kiểm tra lại khoảng cách thụt lề sau câu lệnh while."
except NameError as ne:
    is_err = True
    output_body = f"❌ LỖI TÊN BIẾN (NameError): {ne}\\n👉 Biến bạn dùng trong vòng lặp không trùng với biến đề bài đã cho ở Bước 1. Hãy kiểm tra lại!"
except Exception:
    is_err = True
    buf = io.StringIO()
    traceback.print_exc(file=buf)
    output_body = "--- CHƯƠNG TRÌNH BÁO LỖI ---\\n" + buf.getvalue()

formatted_res = ""
if not is_err:
    input_lines = [line.strip() for line in used_input.splitlines() if line.strip()]
    formatted_res = ">>> DỮ LIỆU ĐÃ NHẬP VÀO:\\n"
    if input_lines:
        for line in input_lines:
            formatted_res += f"  > {line}\\n"
    else:
        formatted_res += "  (Không có dữ liệu nhập)\\n"
    formatted_res += "----------------------------------------\\n"
    formatted_res += ">>> KẾT QUẢ CHƯƠNG TRÌNH XUẤT RA:\\n"
    formatted_res += (output_body.strip() if output_body.strip() else "<Chương trình không in ra kết quả nào>")
    if is_fallback_used:
        formatted_res += "\\n----------------------------------------\\n💡 Đã tự động dùng Test 01 của đề để chạy hoàn tất cho bạn."
else:
    formatted_res = output_body

py_run_result = json.dumps({"is_err": is_err, "output": formatted_res})
`);

      const jsonStr = await py.runPythonAsync("py_run_result");
      const parsed = JSON.parse(jsonStr);
      setIsOutputError(parsed.is_err);
      setStdout(parsed.output);
    } catch(e: any) { 
      setIsOutputError(true); 
      setStdout("LỖI HỆ THỐNG:\n" + e.toString()); 
    }
    finally { setIsLoading(false); }
  };

  const tryFetch = async (url: string) => {
    try { const r = await fetch(url); if (r.ok) return await r.text(); } catch(e: any) {}
    return null;
  };

  const getPyodideWithTimeout = async (timeoutMs = 8000) => {
    try {
      return await Promise.race([
        initPyodide(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
      ]);
    } catch(e) {
      return null;
    }
  };

  const submitCode = async (isAutoSubmit = false, autoReason = "") => {
    const curExam = examItem || examItemRef.current;
    if (!curExam) return;
    if (isFinishedRef.current && !isSubmitting) return;

    if (!isAutoSubmit) {
      const lines = code.split("\n");
      const hasEllipsisInWhile = lines.some(l => {
        const trimmed = l.trim();
        if (trimmed.startsWith("#")) return false; // Tuyệt đối bỏ qua dòng chú thích
        return trimmed.startsWith("while") && (trimmed.includes("...") || trimmed.includes("…"));
      });
      if (hasEllipsisInWhile) {
        if (!confirm("⚠️ CẢNH BÁO: Dòng lệnh 'while' của bạn VẪN CÒN DẤU BA CHẤM '...' (chưa điền điều kiện lặp)!\n\nNếu nộp bài lúc này, bài thi sẽ bị 0 điểm. Bạn có chắc chắn muốn nộp không?")) {
          return;
        }
      } else {
        if (!confirm("Bạn có chắc chắn muốn nộp bài? Hệ thống sẽ tự động chấm điểm và bạn KHÔNG THỂ sửa lại!")) return;
      }
    } else {
      setAutoSubmitNotice(autoReason || "Đã hết giờ làm bài! Hệ thống đang tự động thu bài và chấm điểm...");
    }

    setIsSubmitting(true);
    setIsFinished(true);
    isSubmittingRef.current = true;
    isFinishedRef.current = true;

    const { deFolderName, problemName } = curExam;
    // Tìm test cases: /data/DE_KTGK/Test_Case/De01/Test01/DIEM.INP
    const testCaseBase = "/data/" + testFolder + "/Test_Case/" + deFolderName;
    
    const testCases = [];
    for (let i = 1; i <= 20; i++) {
      const pad = i.toString().padStart(2, "0");
      const base = testCaseBase + "/Test" + pad + "/" + problemName;
      const inp = await tryFetch(base + ".INP") ?? await tryFetch(base + ".inp");
      const out = await tryFetch(base + ".OUT") ?? await tryFetch(base + ".out");
      if (inp === null || out === null) break;
      testCases.push({ name: "Test" + pad, inp, out: out.trim() });
    }

    let finalScore = "Cho cham";
    let finalMax = "N/A";
    let finalMsg = "Vi pham: " + violationCount + " lan.";

    if (testCases.length > 0) {
      let passed = 0;
      try {
        const py = await getPyodideWithTimeout(8000);
        if (py) {
          for (const t of testCases) {
            try {
              let smartInp = t.inp;
              if (!code.includes('split(') && !code.includes('split()') && !code.includes('sys.stdin.read')) {
                  smartInp = (t.inp || "").trim().replace(/[ \t]+/g, '\n');
              }
              py.globals.set("test_input_data", smartInp);
              py.globals.set("student_code", code);

              const runPromise = (async () => {
                await py.runPythonAsync("import sys, io\nsys.stdin = io.StringIO(test_input_data)\nsys.stdout = io.StringIO()");
                await py.runPythonAsync("try:\n    exec(student_code, {})\nexcept:\n    pass");
                return await py.runPythonAsync("sys.stdout.getvalue()");
              })();

              // Mỗi test case tối đa 3 giây tránh treo nếu code học sinh lặp vô tận
              const actual = await Promise.race([
                runPromise,
                new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
              ]);

              const norm = (s: string) => (s || "").replace(/\r/g, "").split("\n").map((l: string) => l.trimEnd()).join("\n").trim();
              const extractNums = (s: string) => (s || "").match(/-?\d+(\.\d+)?/g) || [];
              const actualNums = extractNums(actual);
              const expectedNums = extractNums(t.out);
              const isSmartMatch = actualNums.length > 0 && actualNums.join(",") === expectedNums.join(",");

              if (norm(actual) === norm(t.out)) {
                passed++;
              } else if (isSmartMatch) {
                passed += 0.5; // Diem vot nếu sai định dạng nhưng đúng kết quả số
              }
            } catch(e: any) {}
          }
        }
      } catch(e: any) {}
      const scoreOnScale3 = (testCases.length > 0) ? (passed / testCases.length * 3).toFixed(1) : passed.toString();
      finalScore = scoreOnScale3;
      finalMax = "3";
      finalMsg += " (Tu dong cham: " + passed + "/" + testCases.length + " Test dung -> " + scoreOnScale3 + "/3.0 diem)";
    } else {
      finalMsg += " (Cham thu cong. Output: " + stdout.substring(0, 100).replace(/\n/g, " ") + ")";
    }

    const fullSub = "--- MA NGUON ---\n" + code + "\n\n--- KET QUA CHAY TAY ---\n" + stdout;
    let success = false;
    let lastError = "Lỗi mạng hoặc Server";

    for (let retries = 2; retries > 0; retries--) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout cho nộp bài

        const res = await fetch('/api/sheets', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ 
            studentName, 
            mode: 'DE_THI', 
            week: className, 
            category: 'DE_THI', 
            problem: problemName, 
            score: finalScore, 
            maxScore: finalMax, 
            errorMsg: finalMsg, 
            code: fullSub 
          })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          success = true;
          break;
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData.error || ("Lỗi HTTP " + res.status);
        }
      } catch(e: any) {
        lastError = e.name === 'AbortError' ? "Kết nối quá hạn (Timeout)" : e.message;
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    if (!success) {
      alert("LỖI LƯU ĐIỂM LÊN MÁY CHỦ: " + lastError + "\n\nVui lòng báo Giám thị/Giáo viên để ghi nhận mã nguồn!");
    } else {
      const successObj = {
        score: finalScore,
        maxScore: finalMax,
        problem: problemName,
        passed: testCases.length > 0 ? (finalScore + "/3.0") : "Đã nộp",
        totalTests: testCases.length,
        submittedAt: new Date().toLocaleTimeString('vi-VN') + " - " + new Date().toLocaleDateString('vi-VN'),
        studentName,
        className
      };
      setSubmissionSuccessData(successObj);
      try {
        sessionStorage.setItem("exam_completed_submission", JSON.stringify(successObj));
        localStorage.removeItem("draft_code_" + className + "_" + studentName);
        localStorage.removeItem("exam_end_time_" + className + "_" + studentName.trim().toLowerCase());
      } catch(e) {}
    }
    setIsSubmitting(false);
  };

  const formatTime = (s: number) => Math.floor(s/60).toString().padStart(2,'0') + ':' + (s%60).toString().padStart(2,'0');

  // MÀN HÌNH KHÓA CỨNG GIAO DIỆN SAU KHI NỘP BÀI THÀNH CÔNG
  if (submissionSuccessData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4 relative z-[999999] select-none">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"></div>
          
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
          </div>

          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">ĐÃ NỘP BÀI THÀNH CÔNG!</h2>
          <div className="text-emerald-400 font-bold mb-6 flex items-center justify-center gap-2 bg-emerald-500/10 py-2 px-4 rounded-xl border border-emerald-500/20 max-w-fit mx-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            GIAO DIỆN PHÒNG THI ĐÃ ĐƯỢC KHÓA CỨNG
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 mb-6 text-left space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 text-sm">Học sinh:</span>
              <span className="font-bold text-white text-base">{submissionSuccessData.studentName || studentName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 text-sm">Lớp:</span>
              <span className="font-bold text-indigo-400">{submissionSuccessData.className || className}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 text-sm">Điểm Thực Hành:</span>
              <span className="font-bold text-emerald-400 text-lg">
                {submissionSuccessData.score} / 3.0 điểm
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 text-sm">Kết quả làm bài:</span>
              <span className="font-bold text-indigo-400">
                {submissionSuccessData.totalTests > 0 
                  ? `${submissionSuccessData.passed}/${submissionSuccessData.totalTests} Test đúng` 
                  : (submissionSuccessData.passed || 'Đã nộp bài')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Thời gian nộp:</span>
              <span className="font-mono text-slate-300 text-sm">{submissionSuccessData.submittedAt}</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-sm leading-relaxed text-left">
            <div className="font-bold mb-1 flex items-center gap-1.5 text-emerald-400">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              HOÀN THÀNH BÀI THI:
            </div>
            Bài làm và kết quả của em đã được đồng bộ an toàn về máy chủ Google Sheets. Nếu em đã xem xong kết quả hoặc là <b>thí sinh của ca thi tiếp theo</b>, hãy bấm nút xanh bên dưới để bàn giao máy và vào thi.
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col items-center justify-center gap-3">
            <button 
              onClick={handleLogoutForNextStudent}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 transition-all transform active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-400/40"
            >
              <svg className="w-6 h-6 text-emerald-200 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              BÀN GIAO MÁY CHO BẠN TIẾP THEO / VÀO THI CA MỚI
            </button>

            <button 
              onClick={() => {
                setTeacherPassInput("");
                setTeacherUnlockError("");
                setShowTeacherUnlockModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-indigo-400 hover:text-indigo-300 font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm mt-1"
            >
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Giám thị: Mở khóa quyền thi / Chuyển máy cho HS khác
            </button>
          </div>
        </div>
        {renderTeacherUnlockModal()}
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500"></div>
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-center mb-2 tracking-tight text-white">LỚP BẢO MẬT</h2>
          <p className="text-slate-400 text-center mb-8">Vui lòng nhập Mã Phòng Thi do giáo viên cung cấp để truy cập.</p>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Nhập mã phòng thi..." 
              value={roomCodeInput}
              onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-center text-2xl font-black tracking-widest text-indigo-400 focus:outline-none focus:border-indigo-500 uppercase shadow-inner"
            />
            
            {authError && <div className="text-rose-400 text-sm font-bold text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">{authError}</div>}
            
            <button 
              onClick={handleAuth}
              disabled={isCheckingCode}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-transform active:scale-95"
            >
              {isCheckingCode ? "ĐANG KIỂM TRA..." : "XÁC NHẬN VÀO PHÒNG"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isExamStarted) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative z-[99999]">
      <Script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js" />
      <div className="bg-white p-10 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-600">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Phong Thi Khep Kin</h1>
        <p className="text-slate-500 text-center text-sm font-medium mb-8">Moi hanh vi thoat toan man hinh hoac chuyen ung dung deu bi ghi lai va tru diem.</p>
        <div className="w-full space-y-4">
          <div className="flex gap-4 w-full">
            <div className="w-1/3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CHỌN LỚP</label>
              {isStudentLocked ? (
                <div className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 flex items-center justify-between opacity-70">
                  <span>{className}</span>
                </div>
              ) : (
                <select className="w-full p-3 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold cursor-pointer shadow-sm" value={className} onChange={(e) => {
                  const newClass = e.target.value;
                  setClassName(newClass);
                  setHasDrawn(false);
                  if (studentsData[newClass] && studentsData[newClass].length > 0) {
                    setStudentName(studentsData[newClass][0]);
                  } else {
                    setStudentName("");
                  }
                }}>
                  {Object.keys(studentsData).sort().map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
            <div className="w-2/3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HỌC SINH</label>
              {isStudentLocked ? (
                <div className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 flex items-center justify-between">
                  <span>{studentName}</span>
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
              ) : (
                <>
                  {className && studentsData[className] && studentsData[className].length > 0 ? (
                    <select className="w-full p-3 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold cursor-pointer shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)}>
                      {studentsData[className].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nhập tên..." />
                  )}
                </>
              )}
            </div>
          </div>
          {!hasDrawn ? (
            <button 
              onClick={drawExam} 
              disabled={isCheckingStudent}
              className="w-full mt-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/30 transition-transform active:scale-95 text-lg flex justify-center items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              {isCheckingStudent ? "ĐANG KIỂM TRA BÀI THI..." : "BỐC THĂM ĐỀ THI"}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mt-4 text-center">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Đề thi của bạn:</div>
              <div className="text-2xl font-black text-emerald-700">{examItem?.problemName}</div>
              <div className="text-xs text-emerald-500 mt-1">{examItem?.file}</div>
              <button 
                onClick={startExam} 
                disabled={isCheckingStudent}
                className="w-full mt-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-600/30 transition-transform active:scale-95 text-lg"
              >
                {isCheckingStudent ? "ĐANG KIỂM TRA BÀI THI..." : "VÀO PHÒNG THI"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  let viewerUrl = "";
  if (examItem) {
    if (examItem.file.toLowerCase().endsWith('.docx')) {
      viewerUrl = "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(window.location.origin + "/data/" + testFolder + "/" + examItem.file) + "&wdZoom=100";
    } else {
      viewerUrl = "/data/" + testFolder + "/" + examItem.file + "#toolbar=0&navpanes=0&zoom=110";
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 p-4 font-sans text-white select-none relative z-[99999]">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-4 h-[calc(100vh-2rem)]">
        <div className="bg-slate-800 rounded-2xl p-4 flex justify-between items-center border border-slate-700 shadow-xl shrink-0">
          {autoSubmitNotice && (
              <div className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-sm animate-pulse flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {autoSubmitNotice}
              </div>
            )}
            <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-indigo-500/20 text-indigo-300 font-bold rounded-xl border border-indigo-500/30">{studentName} - {className}</div>
            <div className="px-4 py-2 bg-slate-700/50 text-slate-300 font-bold font-mono rounded-xl border border-slate-600">Bài: {examItem?.problemName}</div>
            {violationCount > 0 && (
              <div className="px-4 py-2 bg-rose-500/20 text-rose-400 font-bold rounded-xl border border-rose-500/30 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Vi pham: {violationCount} lan
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
              <div className={"text-3xl font-mono font-black " + (timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-emerald-400')}>{formatTime(timeLeft)}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quy định: {examConfig?.["ThoiGianThi"] || 15} phút</div>
            </div>
            <button onClick={runCode} disabled={isLoading || isFinished} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900 transition-all disabled:opacity-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {isLoading ? 'Đang chạy...' : 'CHẠY CODE'}
            </button>
            <button onClick={() => submitCode(false)} disabled={isSubmitting || isFinished} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-rose-900 transition-all disabled:opacity-50">
              {isSubmitting ? 'Đang chấm...' : (isFinished ? 'Đã nộp bài' : 'NỘP BÀI')}
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* 1. KHUNG CODE PYTHON: Chiều cao cố định 285px hiển thị ĐỦ 9 DÒNG code, không bị che khuất dòng cuối */}
          <div className="h-[285px] shrink-0 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 text-xs font-bold text-slate-400 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-bold">Trình soạn thảo Python (Pyodide)</span>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  👉 Điền điều kiện LẶP vào dấu ...
                </span>
              </div>
              {examItem?.templateCode && (
                <button
                  type="button"
                  onClick={() => setShowResetCodeModal(true)}
                  disabled={isFinished}
                  className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 font-medium px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-600/40 hover:bg-amber-900/50 cursor-pointer"
                  title="Khôi phục lại code mẫu điền khuyết của đề thi"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Khôi phục code mẫu
                </button>
              )}
            </div>
            <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(val) => {
                  const newCode = val || "";
                  setCode(newCode);
                  if (className && studentName) {
                    try { localStorage.setItem("draft_code_" + className + "_" + studentName, newCode); } catch(e) {}
                  }
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  lineHeight: 24,
                  wordWrap: 'on',
                  readOnly: isFinished,
                  scrollBeyondLastLine: false,
                  padding: { top: 8, bottom: 8 }
                }}
              />
          </div>

          {/* 2. HÀNG DƯỚI: Chiếm toàn bộ không gian còn lại (flex-1), Đề thi to rõ, STDIN và Console rộng rãi */}
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Khung đề thi chữ to rõ ràng (~38% chiều ngang), có nút tăng giảm cỡ chữ A- / A+ */}
            <div className="w-[38%] shrink-0 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl min-h-0">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 text-xs font-bold text-slate-400 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span className="text-white font-bold">Nội dung Đề Thi — {examItem?.problemName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-normal">Cỡ chữ:</span>
                  <button 
                    type="button" 
                    onClick={() => setExamFontSize(s => Math.max(14, s - 1))}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition-colors"
                    title="Thu nhỏ cỡ chữ đề thi"
                  >
                    A-
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setExamFontSize(s => Math.min(24, s + 1))}
                    className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-400 transition-colors"
                    title="Phóng to cỡ chữ đề thi"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Nội dung đề thi render trực tiếp văn bản to rõ nét (không bị co nhỏ như nhúng iframe) */}
              <div className="w-full flex-1 p-4 overflow-y-auto bg-slate-900/60 text-slate-100 flex flex-col gap-3 select-text">
                {examItem && EXAM_PREVIEW_DATA[examItem.problemName] ? (
                  <>
                    <div className="p-3 bg-indigo-950/50 border border-indigo-500/50 rounded-xl">
                      <h2 className="font-black text-indigo-300 tracking-tight flex items-center gap-2" style={{ fontSize: `${examFontSize + 2}px` }}>
                        <span>📌</span> {EXAM_PREVIEW_DATA[examItem.problemName].title}
                      </h2>
                    </div>

                    <div className="p-4 bg-slate-800/95 border border-slate-700 rounded-xl shadow-inner">
                      <div className="text-amber-400 font-bold mb-2 flex items-center gap-2" style={{ fontSize: `${examFontSize}px` }}>
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Yêu cầu đề bài:
                      </div>
                      <p className="text-slate-100 font-medium leading-relaxed text-justify tracking-normal" style={{ fontSize: `${examFontSize}px`, lineHeight: `${Math.round(examFontSize * 1.6)}px` }}>
                        {EXAM_PREVIEW_DATA[examItem.problemName].desc}
                      </p>
                    </div>

                    <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl">
                      <div className="text-emerald-400 font-bold mb-2 flex items-center gap-2" style={{ fontSize: `${examFontSize}px` }}>
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        Ví dụ Test Case mẫu:
                      </div>
                      <div className="space-y-2" style={{ fontSize: `${examFontSize}px` }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-300 font-medium">👉 <b>Đầu vào (Input):</b></span>
                          <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 text-amber-300 font-mono font-bold tracking-wide">
                            {EXAM_PREVIEW_DATA[examItem.problemName].sampleIn}
                          </span>
                        </div>
                        <div className="text-slate-300 font-medium">
                          <div className="mb-1">👉 <b>Kết quả in ra màn hình (Output gồm 2 dòng):</b></div>
                          <div className="bg-slate-950/90 p-2.5 rounded-lg border border-emerald-500/40 text-emerald-300 font-mono text-sm leading-relaxed space-y-0.5">
                            <div>{EXAM_PREVIEW_DATA[examItem.problemName].outLine1}</div>
                            <div className="text-amber-300 font-bold flex items-center gap-2">
                              <span>{EXAM_PREVIEW_DATA[examItem.problemName].outLine2}</span>
                              <span className="text-[11px] text-slate-400 font-sans font-normal">(giá trị biến hợp lệ được in ra)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <iframe src={viewerUrl} className="w-full h-full border-0 bg-white rounded-lg" title="Noi dung de thi" />
                )}
              </div>
            </div>

            {/* Dữ liệu đầu vào STDIN (~26% chiều ngang, xếp NGANG cạnh Đề thi) */}
            <div className="w-[26%] shrink-0 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl min-h-0">
              <div className="bg-slate-900 px-3 py-2 border-b border-slate-700 text-xs font-bold text-slate-400 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span>Dữ liệu đầu vào</span>
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 px-1.5 py-0.5 rounded font-normal">Test 01</span>
                </div>
                {examItem && (
                  <button 
                    type="button" 
                    onClick={() => loadSampleInput()}
                    disabled={isFinished}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline flex items-center gap-1 disabled:opacity-50"
                    title="Nạp lại bộ dữ liệu mẫu có sẵn của Test 01"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Nạp lại
                  </button>
                )}
              </div>
              <textarea className="w-full flex-1 p-3 bg-slate-900/50 text-slate-300 font-mono text-sm focus:outline-none resize-none" spellCheck={false} placeholder="Dữ liệu mẫu Test 01 tự nạp..." value={stdin} onChange={e => setStdin(e.target.value)} disabled={isFinished} />
            </div>

            {/* Màn hình kết quả Console STDOUT (~39% chiều ngang, xếp NGANG bên phải cùng) */}
            <div className="flex-1 min-w-0 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl min-h-0">
              <div className="bg-slate-900 px-3 py-2 border-b border-slate-700 text-xs font-bold text-slate-400 shrink-0 flex items-center justify-between">
                <span>Màn hình chạy (Console)</span>
                <span className="text-[10px] text-slate-500 font-normal">IDLE / Thonny</span>
              </div>
              <textarea className={"w-full flex-1 p-3 font-mono text-xs focus:outline-none resize-none " + (isOutputError ? 'bg-rose-900/20 text-rose-400' : 'bg-slate-900/50 text-emerald-400')} spellCheck={false} readOnly placeholder="Bấm 'CHẠY CODE' để xem máy tính nạp dữ liệu và xuất kết quả..." value={stdout} />
            </div>
          </div>
        </div>
      </div>
      {/* MODAL 1: Mở khóa Giáo viên */}
      {renderTeacherUnlockModal()}

      {/* MODAL 2: Xác nhận Khôi phục Code Mẫu (In-app, nằm trọn vẹn trong Fullscreen) */}
      {showResetCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Khôi phục code mẫu ban đầu?</h3>
                <p className="text-xs text-amber-400 font-medium">Đề thi: {examItem?.problemName}</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/50 leading-relaxed">
              Toàn bộ code bạn đang viết sẽ được làm mới lại theo khung code mẫu điền khuyết ban đầu của đề thi. Bạn có muốn tiếp tục?
            </p>

            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowResetCodeModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (examItem?.templateCode) {
                    setCode(examItem.templateCode);
                    try {
                      localStorage.removeItem("draft_code_" + className + "_" + studentName);
                    } catch(e) {}
                  }
                  setShowResetCodeModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
