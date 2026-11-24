import { devFlags } from '../config/devFlags';
import { storageKey } from '../config/storageScope';
import { lazy, Suspense, useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { translate } from '../i18n/translate';
import { isCubePuzzle } from '../puzzles/events';
import { visibleEvent, visibleEvents, visiblePuzzle, registry } from '../puzzles/registry';
import { db } from '../core/storage/db';
import {
    defaults,
    finishOnboarding,
    readPreferences,
    type Preferences,
} from '../core/storage/preferences';
import type { PuzzleModule } from '../core/contracts';
import { Onboarding } from './Onboarding';

const SpecialTimer = lazy(() => import('./SpecialTimer').then((m) => ({ default: m.SpecialTimer })));
const Timer = lazy(() => import('./Timer').then((m) => ({ default: m.Timer })));
const Evaluation = lazy(() => import('./Evaluation').then((m) => ({ default: m.Evaluation })));
const Academy = lazy(() => import('./Academy').then((m) => ({ default: m.Academy })));
const Statistics = lazy(() => import('./Statistics').then((m) => ({ default: m.Statistics })));
const SolverView = lazy(() => import('./Solver').then((m) => ({ default: m.SolverView })));
const Trainer = lazy(() => import('./Trainer').then((m) => ({ default: m.Trainer })));
const CompetitionView = lazy(() => import('./Competition').then((m) => ({ default: m.CompetitionView })));
const Settings = lazy(() => import('./Settings').then((m) => ({ default: m.Settings })));
const routes = ['timer', 'academy', 'evaluation', 'trainer', 'solver', 'stats', 'competition', 'settings'] as const;
function routeFromHash() {
    const [name, id, extra] = location.hash.slice(1).split('/') as [string, string?, string?];
    return { route: routes.find((r) => r === name) ?? 'timer', id, extra };
}
function read(key: string) {
    try {
        return localStorage.getItem(storageKey(key));
    } catch {
        return null;
    }
}
function remember(key: string, value: string) {
    try {
        localStorage.setItem(storageKey(key), value);
    } catch {
        /* IndexedDB can still store preferences */
    }
}
export type T = (key: string, params?: Record<string, string | number>) => string;

export default function App() {
    const [prefs, setPrefs] = useState<Preferences>();
    const [onboarded, setOnboarded] = useState(() => read('onboarded') === 'yes');
    const [eventId, setEvent] = useState(() => {
        const saved = read('event');
        return visibleEvent(saved).rules.id;
    });
    const { puzzleId: puzzle, rules } = visibleEvent(eventId);
    const [{ route, id, extra }, setPath] = useState(routeFromHash);
    const [mod, setMod] = useState<PuzzleModule<string>>();
    const [failed, setFailed] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const appearance = prefs ?? defaults;
    const [contentMessages, setContentMessages] = useState<{ puzzle: string; messages: Record<'es' | 'en', Record<string, string>> }>();
    const t: T = (key, params) =>
        (contentMessages?.puzzle === puzzle ? contentMessages.messages[appearance.language][key] : undefined)
        ?? translate(appearance.language, key, params);
    useEffect(() => {
        if (mod?.id !== puzzle || !mod.loadContentInfo || !['academy', 'trainer'].includes(route)) return;
        let active = true;
        void mod.loadContentInfo().then(({ messages }) => {
            if (active && messages) setContentMessages({ puzzle, messages });
        }).catch(() => { /* The active content screen reports the import error. */ });
        return () => { active = false; };
    }, [mod, puzzle, route]);

    useEffect(() => {
        function change() {
            const path = routeFromHash();
            if (path.route === 'academy' && path.extra) {
                if (!visiblePuzzle(path.extra)) {
                    setPath({ route: 'academy', id: undefined, extra: undefined });
                    return;
                }
                setEvent(path.extra);
            }
            setPath(path);
        }
        change();
        window.addEventListener('hashchange', change);
        return () => window.removeEventListener('hashchange', change);
    }, []);
    useEffect(() => {
        const sub = liveQuery(() => db.settings.toArray()).subscribe({
            next(rows) {
                const value = readPreferences(rows);
                setPrefs(value);
                if (value.onboardingDone === 'yes') setOnboarded(true);
            },
            error() {
                setPrefs(defaults);
                setFailed(true);
            },
        });
        return () => sub.unsubscribe();
    }, []);
    useEffect(() => {
        if (!onboarded) return;
        let active = true;
        setLoadFailed(false);
        registry[puzzle]()
            .then((m) => {
                if (active) setMod(m);
            })
            .catch(() => {
                if (active) setLoadFailed(true);
            });
        return () => {
            active = false;
        };
    }, [puzzle, onboarded]);
    useEffect(() => {
        const root = document.documentElement;
        root.lang = appearance.language;
        root.dataset.theme = appearance.theme;
        root.dataset.timerSize = appearance.timerSize;
        root.dataset.cubeColors = appearance.cubeColors;
        document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', appearance.theme === 'light' ? '#f0f4f6' : '#111a22');
        document.title =
            translate(appearance.language, onboarded ? route : 'onboardTitle0') + ' · CubeLab';
    }, [appearance, onboarded, route]);
    function chooseEvent(value: string) {
        setEvent(value);
        remember('event', value);
    }
    function complete(choice: '222' | '333', knows: boolean) {
        chooseEvent(choice);
        remember('onboarded', 'yes');
        setOnboarded(true);
        location.hash = knows ? '#timer' : '#academy/notationB/' + choice;
        setPath(routeFromHash());
        void finishOnboarding().catch(() => setFailed(true));
    }
    const ready = mod?.id === puzzle ? mod : undefined;

    return (
        <>
            <a
                className="skip-link"
                href="#main"
                onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('main')?.focus();
                }}
            >
                {t('skipMain')}
            </a>
            <header>
                <a className="brand" href="#timer">
                    <span aria-hidden="true">◇</span> CubeLab
                    {Object.values(devFlags).some(Boolean) && <small className="dev-badge">DEV</small>}
                </a>
                {onboarded && (
                    <nav aria-label={t('navigation')}>
                        {routes.map((r) => (
                            <a href={'#' + r} key={r} aria-current={r === route ? 'page' : undefined}>
                                {t(r)}
                            </a>
                        ))}
                    </nav>
                )}
            </header>
            {!onboarded && prefs && <Onboarding t={t} initialPuzzle={puzzle === '222' ? '222' : '333'} finish={complete} />}
            {onboarded && prefs && (
                <main id="main" tabIndex={-1}>
                    <div className="heading">
                        <h1>{t(route)}</h1>
                        {['timer', 'trainer', 'academy', 'evaluation', 'stats'].includes(route) && (
                            <label>
                                {t('event')}{' '}
                                <select
                                    value={eventId}
                                    onChange={(e) => {
                                        chooseEvent(e.target.value);
                                        e.target.blur();
                                    }}
                                >
                                    {visibleEvents().map(({ rules }) => (
                                        <option key={rules.id} value={rules.id}>
                                            {t(rules.nameKey)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                    </div>
                    {(failed || loadFailed) && <p role="alert">{t('failed')}</p>}
                    <Suspense fallback={<p role="status">{t('aLoading')}</p>}>
                        {route === 'timer' && ready && (
                            rules.scoring === 'time'
                                ? <Timer key={eventId} mod={ready} rules={rules} prefs={prefs} t={t} />
                                : <SpecialTimer key={eventId} mod={ready} rules={rules} t={t} />
                        )}
                        {route === 'trainer' && ready && (
                            !ready.courses.length ? <p>{t('trainerNoSets')}</p> : <Trainer
                                key={eventId + (id ?? '') + (extra ?? '')}
                                mod={ready}
                                rules={rules}
                                t={t}
                                link={id}
                                linkedCase={extra}
                            />
                        )}
                        {route === 'academy' && ready && (
                            !ready.courses.length ? <p>{t('aNoCourse')}</p> : <Academy key={puzzle} mod={ready} t={t} language={appearance.language} lessonLink={id} />
                        )}
                        {route === 'evaluation' && ready && (
                            !isCubePuzzle(puzzle) ? <p>{t('evaluationNoQuestions')}</p> : <Evaluation key={puzzle} mod={ready} t={t} />
                        )}
                        {route === 'competition' && <CompetitionView prefs={prefs} t={t} initialId={id} />}
                        {route === 'settings' && <Settings prefs={prefs} t={t} />}
                        {route === 'stats' && (
                            <Statistics key={eventId} rules={rules} puzzleId={puzzle} t={t} />
                        )}
                        {route === 'solver' && (
                            <SolverView key={id ?? 'direct'} initialPuzzle={puzzle} solveId={id} t={t} />
                        )}
                    </Suspense>
                </main>
            )}
        </>
    );
}
