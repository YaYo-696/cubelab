import { create } from 'zustand';
export const useApp = create<{
    timerMix?: { puzzle: string; scramble: string };
    rememberMix: (puzzle: string, scramble: string) => void;
    lang: 'es' | 'en';
    setLang: (value: 'es' | 'en') => void;
}>(set => ({ lang: 'es', rememberMix: (puzzle, scramble) => set({timerMix: {puzzle, scramble}}), setLang: lang => set({ lang }) }));
