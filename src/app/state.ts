import { create } from 'zustand';
export const useApp = create<{
    lang: 'es' | 'en';
    setLang: (value: 'es' | 'en') => void;
}>(set => ({ lang: 'es', setLang: lang => set({ lang }) }));
