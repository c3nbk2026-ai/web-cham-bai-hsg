"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Mode = 'DAI_TRA' | 'DOI_TUYEN' | 'LUYEN_DE';

interface ModeContextType {
    mode: Mode;
    setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<Mode>('DAI_TRA');

    useEffect(() => {
        const savedMode = localStorage.getItem('app_mode') as Mode;
        if (savedMode && (savedMode === 'DAI_TRA' || savedMode === 'DOI_TUYEN' || savedMode === 'LUYEN_DE')) {
            setModeState(savedMode);
        }
    }, []);

    const setMode = (newMode: Mode) => {
        setModeState(newMode);
        localStorage.setItem('app_mode', newMode);
    };

    const themeClass = mode === 'DOI_TUYEN'
        ? 'theme-doituyen'
        : mode === 'LUYEN_DE'
            ? 'theme-luyende'
            : 'theme-daitra';

    return (
        <ModeContext.Provider value={{ mode, setMode }}>
            <div className={themeClass}>
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
