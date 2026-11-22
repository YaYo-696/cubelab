import { useEffect, useRef, useState } from 'react';
import { clearAllData, savePreference, type Preferences } from '../core/storage/preferences';
import { exportBackup } from '../core/storage/backup';
import type { T } from './App';

export function Settings({ prefs, t }: { prefs: Preferences; t: T }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);
    const [draft, setDraft] = useState<Partial<Preferences>>({});
    const display = { ...prefs, ...draft };
    const [offline, setOffline] = useState(false);
    useEffect(() => {
        let active = true;
        if ('serviceWorker' in navigator)
            void navigator.serviceWorker.ready.then(() => {
                if (active) setOffline(true);
            });
        return () => {
            active = false;
        };
    }, []);
    const [hold, setHold] = useState(String(display.holdMs));
    const focusHold = useRef(false);
    function change<K extends keyof Preferences>(key: K, value: Preferences[K]) {
        setStatus('');
        setDraft((old) => ({ ...old, [key]: value }));
        void savePreference(key, value).catch(() => {
            setDraft((old) => {
                if (old[key] !== value) return old;
                const next = { ...old };
                delete next[key];
                return next;
            });
            setStatus('storageError');
        });
    }
    async function download() {
        setBusy(true);
        setStatus('');
        try {
            const url = URL.createObjectURL(
                new Blob([await exportBackup()], { type: 'application/json' }),
            );
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cubelab-backup.json';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
            setStatus('storageError');
        } finally {
            setBusy(false);
        }
    }
    async function erase() {
        setBusy(true);
        setStatus('');
        try {
            await clearAllData();
            history.replaceState(null, '', import.meta.env.BASE_URL);
            location.reload();
        } catch {
            setStatus('storageError');
            setBusy(false);
        }
    }
    const settings = [
        ['language', 'language', ['es', 'en']],
        ['theme', 'settingsTheme', ['dark', 'light']],
        ['timerSize', 'settingsTimerSize', ['compact', 'normal', 'large']],
        ['cubeColors', 'settingsCubeColors', ['wca', 'contrast']],
        ['timerPreview', 'settingsPreview', ['2D', '3D']],
    ] as const;
    return (
        <section className="settings-grid">
            <section className="settings-card" aria-labelledby="settings-display">
                <h2 id="settings-display">{t('settingsDisplay')}</h2>
                {settings.map(([key, label, values]) => (
                    <label key={key} className="settings-control">
                        {t(label)}
                        <select
                            value={display[key]}
                            onChange={(e) => change(key, e.target.value as Preferences[typeof key])}
                        >
                            {values.map((value) => (
                                <option key={value} value={value}>
                                    {t(key === 'language' ? value : 'settingsOption_' + value)}
                                </option>
                            ))}
                        </select>
                    </label>
                ))}
            </section>
            <section className="settings-card" aria-labelledby="settings-timing">
                <h2 id="settings-timing">{t('settingsTiming')}</h2>
                <label className="settings-control">
                    {t('holdMs')}
                    <input
                        type="number"
                        min={0}
                        max={3000}
                        step={1}
                        value={focusHold.current ? hold : display.holdMs}
                        onFocus={() => {
                            focusHold.current = true;
                            setHold(String(display.holdMs));
                        }}
                        onChange={(e) => {
                            setHold(e.currentTarget.value);
                            if (e.currentTarget.validity.valid && e.currentTarget.value !== '')
                                change('holdMs', e.currentTarget.valueAsNumber);
                        }}
                        onBlur={() => {
                            focusHold.current = false;
                            setHold(String(display.holdMs));
                        }}
                    />
                </label>
                {(
                    [
                        ['inspection', 'settingsInspection'],
                        ['sounds', 'settingsSounds'],
                        ['vibration', 'settingsVibration'],
                    ] as const
                ).map(([key, name]) => (
                    <label key={key} className="settings-control">
                        {t(name)}
                        <input
                            type="checkbox"
                            checked={display[key] === 'on'}
                            onChange={(e) => change(key, e.target.checked ? 'on' : 'off')}
                        />
                    </label>
                ))}
            </section>
            <section className="settings-card" aria-labelledby="settings-data">
                <h2 id="settings-data">{t('settingsData')}</h2>
                {import.meta.env.PROD && 'serviceWorker' in navigator && (
                    <p role="status">{t(offline ? 'offlineReady' : 'offlinePreparing')}</p>
                )}
                <div className="intro-actions">
                    <button className="secondary" disabled={busy} onClick={() => void download()}>
                        {t('exportJson')}
                    </button>
                    <button
                        className="danger"
                        disabled={busy}
                        onClick={() => dialog.current?.showModal()}
                    >
                        {t('settingsErase')}
                    </button>
                </div>
            </section>
            {status && <p role="alert">{t(status)}</p>}
            <dialog
                ref={dialog}
                className="settings-dialog"
                aria-labelledby="erase-title"
                onCancel={(e) => {
                    if (busy) e.preventDefault();
                }}
            >
                <h2 id="erase-title">{t('settingsErase')}</h2>
                <p>{t('settingsErasePrompt')}</p>
                {status && <p role="alert">{t(status)}</p>}
                <div className="intro-actions">
                    <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => dialog.current?.close()}
                    >
                        {t('cancel')}
                    </button>
                    <button className="secondary" disabled={busy} onClick={() => void download()}>
                        {t('exportJson')}
                    </button>
                    <button className="danger" disabled={busy} onClick={() => void erase()}>
                        {t('settingsEraseConfirm')}
                    </button>
                </div>
            </dialog>
        </section>
    );
}
