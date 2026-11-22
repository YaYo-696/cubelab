/// <reference types="vite-plugin-pwa/client" />
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './ui/styles.css';
import './ui/preferences.css';

createRoot(document.getElementById('root')!).render(<App />);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    // The install precache can download lazily evaluated features after the first paint.
    const prepareOffline = () => {
        void import('virtual:pwa-register')
            .then(({ registerSW }) => {
                registerSW({
                    immediate: true,
                    onRegisterError: (error) => console.error('CubeLab service worker', error),
                });
            })
            .catch((error) => console.error('CubeLab service worker', error));
    };
    const afterLoad = () => {
        if (typeof requestIdleCallback === 'function')
            requestIdleCallback(prepareOffline, { timeout: 1500 });
        else setTimeout(prepareOffline, 0);
    };
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, { once: true });
}
