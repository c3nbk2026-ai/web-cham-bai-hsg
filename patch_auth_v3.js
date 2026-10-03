const fs = require('fs');

let thi = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

const targetString = `  if (!isExamStarted) return (`;

const authScreen = `  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500"></div>
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-center mb-2 tracking-tight text-white">L\u1EDAP B\u1EA2O M\u1EACT</h2>
          <p className="text-slate-400 text-center mb-8">Vui l\u00F2ng nh\u1EADp M\u00E3 Ph\u00F2ng Thi do gi\u00E1o vi\u00EAn cung c\u1EA5p \u0111\u1EC3 truy c\u1EADp.</p>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Nh\u1EADp m\u00E3 ph\u00F2ng thi..." 
              value={roomCodeInput}
              onChange={e => setRoomCodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-center text-2xl font-black tracking-widest text-indigo-400 focus:outline-none focus:border-indigo-500 uppercase shadow-inner"
            />
            
            {authError && <div className="text-rose-400 text-sm font-bold text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">{authError}</div>}
            
            <button 
              onClick={handleAuth}
              disabled={isCheckingCode}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-transform active:scale-95"
            >
              {isCheckingCode ? "\u0110ANG KI\u1EC2M TRA..." : "X\u00C1C NH\u1EACN V\u00C0O PH\u00D2NG"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isExamStarted) return (`;

thi = thi.replace(targetString, authScreen);

fs.writeFileSync('src/app/thi/page.tsx', thi, 'utf8');
