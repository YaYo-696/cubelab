import { Suspense, useEffect, useState } from 'react';
import { translate } from '../i18n/translate';
import { useApp } from './state';
import { events, registry } from '../puzzles/registry';
import { CubePreview } from '../ui/CubePreview';
import { db } from '../core/storage/db';
import type { PuzzleModule, Lesson } from '../core/contracts';
const routes = ['timer', 'academy', 'trainer', 'solver', 'stats', 'settings'] as const;
type Route = typeof routes[number];
function routeFromHash() { return routes.find(r => '#' + r === location.hash) ?? 'timer'; }
type T = (key: string) => string;
function Workspace({ mod, eventId, route, t }: {
    mod: PuzzleModule<string>;
    eventId: string;
    route: Route;
    t: T;
}) {
    const [scramble, setScramble] = useState(''), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
    const [accepted, setAccepted] = useState(false);
    function editScramble(value: string) {
        try {
            setScramble(mod.notation.normalize(value));
            setAccepted(false);
            setFailed(false);
        }
        catch {
            setFailed(true);
        }
    }
    const [lesson, setLesson] = useState<Lesson>();
    const [control] = useState(() => new AbortController());
    useEffect(() => () => control.abort(), [control]);
    async function load() {
        setBusy(true);
        setFailed(false);
        try {
            if (route === 'academy')
                setLesson((await mod.loadCourse(mod.courses[0])).modules[0].lessons[0]);
            else if (route === 'trainer') {
                const set = await mod.loadAlgSet(mod.algSets[0]);
                const result = await mod.caseGenerators[set.id](set.cases[0].id, control.signal);
                setScramble(result.scramble);
            }
            else {
                setScramble(await mod.generateScramble(eventId, control.signal));
                setAccepted(true);
            }
        }
        catch {
            if (!control.signal.aborted)
                setFailed(true);
        }
        finally {
            if (!control.signal.aborted)
                setBusy(false);
        }
    }
    const Preview = mod.ui?.preview, InputPanel = mod.ui?.inputPanel;
    return <section className="board">
    <div className="sheet"><h2>{t(route === 'timer' ? 'scramble' : route === 'trainer' ? 'basic' : 'notation')}</h2>
    {route === 'academy' && lesson && <><h3>{t(lesson.titleKey)}</h3><p>{t(lesson.bodyKey)}</p><code>{lesson.exampleAlg}</code></>}
    {route === 'trainer' && <p>{t('train')}</p>}
    {scramble && <><p className="sequence" dir="ltr">{scramble}</p>{route === 'timer' && accepted && <small className="accepted">{t('criteria')}</small>}</>}
    {route === 'timer' && !scramble && <p>{t('initial')}</p>}
    <button disabled={busy} onClick={load}>{t(busy ? 'busy' : route === 'academy' ? 'load' : route === 'trainer' ? 'case' : 'newMix')}</button>
    {failed && <p role="alert">{t('failed')}</p>}
    <Suspense>{InputPanel && <InputPanel eventId={eventId} scramble={scramble} onChange={editScramble}/>}</Suspense>
    </div><figure><Suspense>{Preview ? <Preview eventId={eventId} scramble={scramble} onChange={editScramble}/> : <CubePreview state={mod.applyAlg(mod.solvedState(), scramble)} label={t('preview')}/>}</Suspense><figcaption>{t('preview')}</figcaption></figure>
  </section>;
}
export default function App() {
    const { lang, setLang } = useApp();
    const [eventId, setEvent] = useState<string>('333');
    const puzzle = events.find(e => e.rules.id === eventId)!.puzzleId;
    const [route, setRoute] = useState(routeFromHash), [mod, setMod] = useState<PuzzleModule<string>>();
    const [failed, setFailed] = useState(false);
    const t: T = k => translate(lang, k);
    useEffect(() => { const change = () => setRoute(routeFromHash()); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
    useEffect(() => { let active = true; setFailed(false); registry[puzzle]().then(m => { if (active)
        setMod(m); }).catch(() => { if (active)
        setFailed(true); }); return () => { active = false; }; }, [puzzle]);
    useEffect(() => { db.settings.get('language').then(row => { if (row?.value === 'en' || row?.value === 'es')
        setLang(row.value); }).catch(() => setFailed(true)); }, [setLang]);
    useEffect(() => { document.documentElement.lang = lang; document.title = t(route) + ' · CubeLab'; }, [lang, route]);
    return <><header><a className="brand" href="#timer"><span aria-hidden="true">◇</span> CubeLab</a><nav>{routes.map(r => <a href={'#' + r} key={r} aria-current={r === route ? 'page' : undefined}>{t(r)}</a>)}</nav></header>
    <main><div className="heading"><h1>{t(route)}</h1>{['timer', 'trainer', 'academy'].includes(route) && <label>{t('event')} <select value={eventId} onChange={e => setEvent(e.target.value)}>{events.map(({ rules }) => <option key={rules.id} value={rules.id}>{t(rules.nameKey)}</option>)}</select></label>}</div>
    {failed && <p role="alert">{t('failed')}</p>}
    {mod?.id === puzzle && ['timer', 'trainer', 'academy'].includes(route) && <Workspace key={eventId + route} eventId={eventId} mod={mod} route={route} t={t}/>}
    {route === 'settings' && <section className="sheet"><label>{t('language')} <select value={lang} onChange={e => { const value = e.target.value as 'es' | 'en'; setLang(value); db.settings.put({ key: 'language', value }).catch(() => setFailed(true)); }}><option value="es">{t('es')}</option><option value="en">{t('en')}</option></select></label></section>}
    {route === 'stats' && <p>{t('noStats')}</p>}{route === 'solver' && <p>{t('solverText')}</p>}
    </main></>;
}
