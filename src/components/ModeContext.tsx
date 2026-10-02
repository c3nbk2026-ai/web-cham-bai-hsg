"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type Mode = 'DAI_TRA' | 'DOI_TUYEN';

interface ModeContextType {
    mode: Mode;
    setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<Mode>('DAI_TRA');

    useEffect(() => {
        const savedMode = localStorage.getItem('app_mode') as Mode;
        if (savedMode && (savedMode === 'DAI_TRA' || savedMode === 'DOI_TUYEN')) {
            setModeState(savedMode);
        }
    }, []);

    const setMode = (newMode: Mode) => {
        setModeState(newMode);
        localStorage.setItem('app_mode', newMode);
    };

    return (
        <ModeContext.Provider value={{ mode, setMode }}>
            <div className={mode === 'DOI_TUYEN' ? 'theme-doituyen' : 'theme-daitra'}>
                {children}
            </div>
        </ModeContext.Provider>
    );
}

export function useMode() {
    const context = useContext(ModeContext);
    if (context === undefined) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
}
