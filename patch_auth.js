const fs = require('fs');

let thi = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

// 1. Add new states
const stateInjection = `  const [hasDrawn, setHasDrawn] = useState(false);
  
  // Security Layer States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [examConfig, setExamConfig] = useState<any>({});

  const handleAuth = async () => {
    if (!roomCodeInput) return setAuthError("Vui l\u00F2ng nh\u1EADp M\u00E3 Ph\u00F2ng Thi!");
    setIsCheckingCode(true);
    setAuthError("");
    try {
        const res = await fetch("/api/exam-config?t=" + Date.now());
        const data = await res.json();
        if (data.error) {
            setAuthError("L\u1ED7i: " + data.error);
        } else {
            if (data["MaPhongThi"] === roomCodeInput) {
                setExamConfig(data);
                if (data["ThoiGianThi"]) {
                    setTimeLeft(parseInt(data["ThoiGianThi"]) * 60);
                }
                if (data["LopDangThi"]) {
                    setClassName(data["LopDangThi"]);
                }
                setIsAuthorized(true);
            } else {
                setAuthError("M\u00E3 Ph\u00F2ng Thi kh\u00F4ng \u0111\u00FAng!");
            }
        }
    } catch(e) {
        setAuthError("L\u1ED7i k\u1EBFt n\u1ED1i m\u00E1y ch\u1EE7!");
    }
    setIsCheckingCode(false);
  };
`;
thi = thi.replace('  const [hasDrawn, setHasDrawn] = useState(false);', stateInjection);

// 2. Modify drawExam
const oldDrawExam = `  const drawExam = () => {
    let all: {folder: string, item: ExamItem}[] = [];
    Object.keys(structure).forEach(folder => {
      if (folder.startsWith('DE_') && Array.isArray(structure[folder]["DE_THI"])) {
        structure[folder]["DE_THI"].forEach((item: ExamItem) => all.push({folder, item}));
      }
    });
    if (all.length === 0) return alert("Chua tim thay bai thi nao!");
    const r = all[Math.floor(Math.random() * all.length)];
    setExamItem(r.item); setTestFolder(r.folder); setHasDrawn(true);
  };`;

const newDrawExam = `  const drawExam = () => {
    let all: {folder: string, item: ExamItem}[] = [];
    const requiredTopic = examConfig["Ch\u1EE7 \u0111\u1EC1"];
    
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
    if (all.length === 0) return alert("Kh\u00F4ng t\u00ECm th\u1EA5y b\u00E0i thi n\u00E0o cho ch\u1EE7 \u0111\u1EC1: " + (requiredTopic || 'T\u1EA5t c\u1EA3'));
    const r = all[Math.floor(Math.random() * all.length)];
    setExamItem(r.item); setTestFolder(r.folder); setHasDrawn(true);
  };`;
thi = thi.replace(oldDrawExam, newDrawExam);

// 3. Add Auth Screen at the top of the return block
const authScreen = `  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-center mb-2">L\u1EDAP B\u1EA2O M\u1EACT</h2>
          <p className="text-slate-400 text-center mb-8">Vui l\u00F2ng nh\u1EADp M\u00E3 Ph\u00F2ng Thi \u0111\u1EC3 v\u00E0o thi.</p>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Nh\u1EADp m\u00E3 ph\u00F2ng thi..." 
              value={roomCodeInput}
              onChange={e => setRoomCodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-center text-2xl font-black tracking-widest text-indigo-400 focus:outline-none focus:border-indigo-500 uppercase"
            />
            
            {authError && <div className="text-rose-400 text-sm font-bold text-center">{authError}</div>}
            
            <button 
              onClick={handleAuth}
              disabled={isCheckingCode}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              {isCheckingCode ? "\u0110ANG KI\u1EC2M TRA..." : "X\u00C1C NH\u1EACN V\u00C0O PH\u00D2NG"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (`;
thi = thi.replace('  return (', authScreen);

fs.writeFileSync('src/app/thi/page.tsx', thi, 'utf8');
