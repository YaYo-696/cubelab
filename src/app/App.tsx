import { devFlags } from '../config/devFlags';
import { lazy, Suspense, useEffect, useState } from 'react';
import { translate } from '../i18n/translate';
import { Timer } from './Timer';
import { useApp } from './state';
import { events, registry } from '../puzzles/registry';
import { CubePreview } from '../ui/CubePreview';
import { db } from '../core/storage/db';
import type { PuzzleModule } from '../core/contracts';
const Evaluation = lazy(() => import('./Evaluation').then(m => ({default:m.Evaluation})));
const Academy = lazy(() => import('./Academy').then(m => ({default:m.Academy})));
const Statistics = lazy(() => import('./Statistics').then(m => ({default:m.Statistics})));
const SolverView = lazy(() => import('./Solver').then(m => ({default:m.SolverView})));
const routes = ['timer', 'academy', 'evaluation', 'trainer', 'solver', 'stats', 'settings'] as const;
function routeFromHash() { return routes.find(r => '#' + r === location.hash.split('/')[0]) ?? 'timer'; }
type T = (key: string, params?: Record<string,string|number>) => string;
function Trainer({ mod, eventId, t }: {
    mod: PuzzleModule<string>;
    eventId: string;
    t: T;
}) {
    const [scramble, setScramble] = useState(''), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);

    function editScramble(value: string) {
        try {
            setScramble(mod.notation.normalize(value));

            setFailed(false);
        }
        catch {
            setFailed(true);
        }
    }
    const [control] = useState(() => new AbortController());
    useEffect(() => () => control.abort(), [control]);
    async function load() {
        setBusy(true);
        setFailed(false);
        try {
            const set = await mod.loadAlgSet(mod.algSets[0]);
            const result = await mod.caseGenerators[set.id](set.cases[0].id, control.signal);
            setScramble(result.scramble);
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
    <div className="sheet"><h2>{t('basic')}</h2>
    <p>{t('train')}</p>
    {scramble && <p className="sequence" dir="ltr">{scramble}</p>}

    <button disabled={busy} onClick={load}>{t(busy ? 'busy' : 'case')}</button>
    {failed && <p role="alert">{t('failed')}</p>}
    <Suspense>{InputPanel && <InputPanel eventId={eventId} scramble={scramble} onChange={editScramble}/>}</Suspense>
    </div><figure><Suspense>{Preview ? <Preview eventId={eventId} scramble={scramble} onChange={editScramble}/> : <CubePreview state={mod.applyAlg(mod.solvedState(), scramble)} label={t('preview')}/>}</Suspense><figcaption>{t('preview')}</figcaption></figure>
  </section>;
}
export default function App() {
    const { lang, setLang } = useApp();
    const [eventId, setEvent] = useState<string>(()=>{try {const saved=localStorage.getItem('cubelab.event');return events.find(e=>e.rules.id===saved)?.rules.id??'333'}catch{return '333'}});
    const puzzle = events.find(e => e.rules.id === eventId)!.puzzleId;
    const [route, setRoute] = useState(routeFromHash), [mod, setMod] = useState<PuzzleModule<string>>();
    const [lessonLink,setLessonLink]=useState(()=>location.hash.split('/')[1]);
    const [failed, setFailed] = useState(false);
    const t: T = (key,params) => translate(lang,key,params);
    useEffect(() => { const change = () => {setRoute(routeFromHash());const [,link,cube] = location.hash.split('/');setLessonLink(link);if (location.hash.startsWith('#academy/') && (cube==='222'||cube==='333')) setEvent(cube)}; window.addEventListener('hashchange', change); change(); return () => window.removeEventListener('hashchange', change); }, []);
    useEffect(() => { let active = true; setFailed(false); registry[puzzle]().then(m => { if (active)
        setMod(m); }).catch(() => { if (active)
        setFailed(true); }); return () => { active = false; }; }, [puzzle]);
    useEffect(() => { db.settings.get('language').then(row => { if (row?.value === 'en' || row?.value === 'es')
        setLang(row.value); }).catch(() => setFailed(true)); }, [setLang]);
    useEffect(() => { document.documentElement.lang = lang; document.title = t(route) + ' · CubeLab'; }, [lang, route]);
    return <><header><a className="brand" href="#timer"><span aria-hidden="true">◇</span> CubeLab{Object.values(devFlags).some(Boolean) && <small className="dev-badge">DEV</small>}</a><nav>{routes.map(r => <a href={'#' + r} key={r} aria-current={r === route ? 'page' : undefined}>{t(r)}</a>)}</nav></header>
    <main><div className="heading"><h1>{t(route)}</h1>{['timer', 'trainer', 'academy', 'evaluation', 'stats'].includes(route) && <label>{t('event')} <select value={eventId} onChange={e=>{setEvent(e.target.value);try{localStorage.setItem('cubelab.event',e.target.value)}catch{/* storage unavailable */}e.target.blur()}}>{events.map(({ rules }) => <option key={rules.id} value={rules.id}>{t(rules.nameKey)}</option>)}</select></label>}</div>
    {failed && <p role="alert">{t('failed')}</p>}
    {route==='timer' && mod?.id===puzzle && <Timer key={eventId} mod={mod} rules={events.find(e=>e.rules.id===eventId)!.rules} t={t}/>}
    {mod?.id === puzzle && route==='trainer' && <Trainer key={eventId} eventId={eventId} mod={mod} t={t}/>}
    {mod?.id === puzzle && route==='academy' && <Suspense><Academy key={puzzle} mod={mod} t={t} lessonLink={lessonLink}/></Suspense>}
    {mod?.id === puzzle && route==='evaluation' && <Suspense><Evaluation key={puzzle} mod={mod} t={t}/></Suspense>}
    {route === 'settings' && <section className="sheet"><label>{t('language')} <select value={lang} onChange={e => { const value = e.target.value as 'es' | 'en'; setLang(value); db.settings.put({ key: 'language', value }).catch(() => setFailed(true)); }}><option value="es">{t('es')}</option><option value="en">{t('en')}</option></select></label></section>}
    {route === 'stats' && <Suspense><Statistics key={eventId} rules={events.find(e=>e.rules.id===eventId)!.rules} puzzleId={puzzle} t={t}/></Suspense>}{route === 'solver' && <Suspense><SolverView key={lessonLink ?? 'direct'} initialPuzzle={puzzle} solveId={lessonLink} t={t}/></Suspense>}
    </main></>;
}
