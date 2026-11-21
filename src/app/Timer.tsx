import '../ui/timer.css';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import type { EventRules, PuzzleModule } from '../core/contracts';
import { formatTime, parseTime } from '../core/timer/times';
import { attempts, persistAttempt, replayAttempts } from '../core/storage/attempts';
import { adjusted, breakdown } from '../core/stats';
import { useStatistics } from './useStatistics';
import { db, solvesForEvent, type Solve, type Session } from '../core/storage/db';
import { NotationError } from '../puzzles/notation';
import { CubeNet } from '../ui/CubeNet';
import { useScrambles } from './useScrambles';
import { useTimerInput } from './useTimerInput';

const Cube3D = lazy(() => import('./AcademyPlayer').then((m) => ({ default: m.AcademyPlayer })));
type T = (key: string, params?: Record<string, string | number>) => string;
type Props = { mod: PuzzleModule<string>; rules: EventRules; t: T };

export function Timer({ mod, rules, t }: Props) {
    const mix = useScrambles(mod, rules.id);
    const [sessions, setSessions] = useState<Session[]>([]),
        [session, setSession] = useState('');
    const [inspection, setInspection] = useState(true),
        [threshold, setThreshold] = useState(300);
    const [ready, setReady] = useState(false),
        [boot, setBoot] = useState(0);
    const [recent, setRecent] = useState<Solve[]>([]),
        [deleted, setDeleted] = useState('');
    const [pbInput, setPbInput] = useState<{ session: Solve[]; event: Solve[] }>();
    const [lastSaved, setLastSaved] = useState('');
    const pbStats = useStatistics(pbInput);
    const [total, setTotal] = useState(0);
    const [message, setMessage] = useState(''),
        [custom, setCustom] = useState(''),
        [offset, setOffset] = useState<number>();
    const [manual, setManual] = useState(''),
        [penalty, setPenalty] = useState<Solve['penalty']>('none');
    const [manualError, setManualError] = useState(false),
        [touchMode, setTouchMode] = useState(false);
    const [pending, setPending] = useState<Solve | null>(null),
        [writeFailed, setWriteFailed] = useState(false);
    const inFlight = useRef(false),
        alive = useRef(true),
        customInput = useRef<HTMLTextAreaElement>(null);
    const activeSession = useRef('');
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useEffect(() => {
        let current = true;
        async function init() {
            await replayAttempts();
            const list = await attempts.sessions(rules.id, mod.id);
            const [choice, inspect, hold] = await db.settings.bulkGet([
                'session:' + rules.id,
                'inspection',
                'holdMs',
            ]);
            if (!current) return;
            const id = list.find((s) => s.id === choice?.value)?.id ?? list[0].id;
            setSessions(list);
            setSession(id);
            activeSession.current = id;
            setInspection(inspect?.value !== 'off');
            const ms = Number(hold?.value);
            setThreshold(Number.isInteger(ms) && ms >= 0 && ms <= 3000 ? ms : 300);
            setMessage('');
            setReady(true);
        }
        init().catch(() => {
            if (current) setMessage('storageError');
        });
        return () => {
            current = false;
        };
    }, [rules.id, mod.id, boot]);
    useEffect(() => {
        if (!session) return;
        const sub = liveQuery(() =>
            db.transaction('r', db.solves, () =>
                Promise.all([attempts.recent(session), attempts.count(session)]),
            ),
        ).subscribe({
            next: ([list, count]) => {
                if (activeSession.current === session) {
                    setRecent(list);
                    setTotal(count);
                }
            },
            error: () => setMessage('storageError'),
        });
        return () => sub.unsubscribe();
    }, [session]);

    function preference(key: string, value: string) {
        db.settings.put({ key, value }).catch(() => setMessage('storageError'));
    }
    const timer = useTimerInput({
        rules,
        inspection,
        threshold,
        enabled: ready && !!mix.current && !pending && !inFlight.current,
        finish: (result) => record(result.timeMs, result.penalty, 'timer'),
    });
    const { machine } = timer;

    async function store(solve: Solve) {
        if (inFlight.current) return;
        inFlight.current = true;
        setPending(solve);
        setWriteFailed(false);
        try {
            await persistAttempt(solve);
            if (!alive.current) return;
            setPending(null);
            setLastSaved(solve.id);
            setPbInput(undefined);
            void solvesForEvent(rules.id)
                .then((event) => {
                    if (alive.current) setPbInput({ session: [], event });
                })
                .catch(() => {});
            setMessage('');
            if (solve.source === 'timer') timer.saved();
            setManual('');
            setPenalty('none');
            mix.next();
        } catch {
            if (alive.current) setWriteFailed(true);
        } finally {
            inFlight.current = false;
        }
    }
    useEffect(() => {
        if (!writeFailed || !pending) return;
        const timeout = window.setTimeout(() => void store(pending), 3000);
        return () => clearTimeout(timeout);
    }, [writeFailed, pending]); // retries retain the original UUID, session and scramble
    function record(timeMs: number, p: Solve['penalty'], source: Solve['source']) {
        if (!mix.current || !session || pending || inFlight.current) return;
        void store({
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            eventId: rules.id,
            puzzleId: mod.id,
            sessionId: session,
            scramble: mix.current.text,
            result: { kind: 'time', timeMs },
            penalty: p,
            source,
        });
    }
    const now = performance.now(),
        phase = machine.phase;
    const inspecting =
        machine.inspectionStart !== null && ['inspecting', 'holding', 'ready'].includes(phase);
    const active = phase !== 'idle' && phase !== 'stopped';
    const elapsed =
        phase === 'running'
            ? now - machine.startedAt
            : (machine.result?.timeMs ??
              (recent[0]?.result.kind === 'time' ? recent[0].result.timeMs : 0));
    const during = inspecting ? machine.penalty(now) : 'none';
    const display = inspecting
        ? during === 'none'
            ? String(
                  Math.max(
                      0,
                      Math.ceil(
                          (rules.inspectionSeconds ?? 0) - (now - machine.inspectionStart!) / 1000,
                      ),
                  ),
              )
            : during === '+2'
              ? '+2'
              : 'DNF'
        : formatTime(elapsed);
    const locked = !ready || active || !!pending || phase === 'stopped';
    const ao = useMemo(() => breakdown([...recent].reverse(), 'ao5')?.value ?? null, [recent]);
    const newPbs = pbStats?.records.filter(
        (r) => r.solve.id === lastSaved && ['single', 'ao5', 'ao12'].includes(r.metric),
    );
    const last = recent[0];
    const show = (s: Solve) =>
        s.penalty === 'dnf' ? 'DNF' : formatTime(adjusted(s)) + (s.penalty === '+2' ? ' (+2)' : '');
    async function edit(id: string, change: Parameters<typeof attempts.edit>[1]) {
        try {
            await attempts.edit(id, change);
            setMessage('');
            return true;
        } catch {
            setMessage('storageError');
            return false;
        }
    }
    function applyCustom(input = custom) {
        try {
            mix.custom(mod.notation.normalize(input));
            setOffset(undefined);
            setMessage('');
            customInput.current?.blur();
        } catch (e) {
            const pos = e instanceof NotationError ? e.offset : 0;
            setOffset(pos);
            customInput.current?.focus();
            customInput.current?.setSelectionRange(pos, pos + 1);
        }
    }
    const [showCube3d, setCube3d] = useState(false);
    const Preview = mod.ui?.preview,
        InputPanel = mod.ui?.inputPanel;
    const preview = useMemo(
        () => mod.applyAlg(mod.solvedState(), mix.current?.text ?? ''),
        [mod, mix.current?.text],
    );
    return (
        <div className="timer-page">
            <div className="session-bar">
                <label>
                    {t('session')}{' '}
                    <select
                        value={session}
                        disabled={locked}
                        onChange={(e) => {
                            const id = e.target.value;
                            activeSession.current = id;
                            setSession(id);
                            setRecent([]);
                            setTotal(0);
                            setDeleted('');
                            preference('session:' + rules.id, id);
                            e.target.blur();
                        }}
                    >
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name || t('defaultSession')}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={!!rules.inspectionSeconds && inspection}
                        disabled={locked || !rules.inspectionSeconds}
                        onChange={(e) => {
                            setInspection(e.target.checked);
                            preference('inspection', e.target.checked ? 'on' : 'off');
                            e.target.blur();
                        }}
                    />{' '}
                    {t('inspection')}
                </label>
                <label>
                    {t('holdMs')}{' '}
                    <input
                        type="number"
                        min="0"
                        max="3000"
                        step="1"
                        value={threshold}
                        disabled={locked}
                        onChange={(e) => {
                            const ms = e.target.valueAsNumber;
                            if (Number.isInteger(ms) && ms >= 0 && ms <= 3000) {
                                setThreshold(ms);
                                preference('holdMs', String(ms));
                            }
                        }}
                    />
                </label>
            </div>

            <div className="mix-board">
                <div>
                    <h2>{t('scramble')}</h2>
                    <p className="sequence" data-testid="scramble">
                        {mix.current?.text ?? t('busy')}
                    </p>
                    {mix.current && <small>{t(mix.current.generated ? 'criteria' : 'customMix')}</small>}
                    <div className="actions">
                        <button
                            disabled={locked || !mix.hasNext}
                            onClick={() => {
                                mix.next();
                                setMessage('');
                                timer.area.current?.focus({ preventScroll: true });
                            }}
                        >
                            {t('nextMix')}
                        </button>
                        <button
                            disabled={!mix.current || locked}
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(mix.current!.text);
                                    setMessage('copied');
                                } catch {
                                    setMessage('copyFailed');
                                }
                            }}
                        >
                            {t('copy')}
                        </button>
                    </div>
                    {!Preview && (
                        <button
                            type="button"
                            aria-pressed={showCube3d}
                            onClick={() => setCube3d((v) => !v)}
                        >
                            {t(showCube3d ? 'aFlatView' : 'aView3d')}
                        </button>
                    )}
                    {mix.failed && <button onClick={mix.retry}>{t('retryMix')}</button>}
                </div>
                <Suspense>
                    {Preview ? (
                        <Preview
                            eventId={rules.id}
                            scramble={mix.current?.text ?? ''}
                            onChange={applyCustom}
                        />
                    ) : showCube3d && !active ? (
                        <Cube3D
                            puzzle={mod.id === '222' ? '2x2x2' : '3x3x3'}
                            setup={mix.current?.text ?? ''}
                            alg=""
                            still
                            timerPreview
                            t={t}
                        />
                    ) : (
                        <CubeNet state={preview} label={t('preview')} />
                    )}
                </Suspense>
            </div>

            <div
                className={'timer-stage ' + (touchMode || active ? 'expanded ' : '') + 'phase-' + phase}
            >
                <div
                    className="touch-zone"
                    tabIndex={0}
                    role="group"
                    ref={timer.area}
                    data-testid="touch-zone"
                    aria-label={t('touchZone')}
                    data-phase={phase}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <span className={phase === 'running' ? 'screen-reader' : 'phase-name'}>
                        {phase === 'idle' && (!ready || !mix.current) ? t('busy') : t('phase_' + phase)}
                    </span>
                    <strong className="digits" data-testid="digits">
                        {display}
                    </strong>
                    {phase === 'idle' && (
                        <span>
                            {t(rules.inspectionSeconds && inspection ? 'startInspect' : 'startHold')}
                        </span>
                    )}
                    {phase === 'inspecting' && <span>{t('startHold')}</span>}
                </div>
                {touchMode && !active && (
                    <button className="exit-touch" onClick={() => setTouchMode(false)}>
                        {t('exitTouch')}
                    </button>
                )}
            </div>
            {!touchMode && (
                <button disabled={locked} onClick={() => setTouchMode(true)}>
                    {t('touchMode')}
                </button>
            )}
            {pending && (
                <div role="status">
                    <p>{t(writeFailed ? 'pendingSave' : 'saving')}</p>
                    {writeFailed && <button onClick={() => void store(pending)}>{t('retry')}</button>}
                </div>
            )}
            {message && (
                <p role="status">
                    {t(message)}{' '}
                    {!ready && <button onClick={() => setBoot((n) => n + 1)}>{t('retry')}</button>}
                </p>
            )}

            <details>
                <summary>{t('customMix')}</summary>
                <Suspense>
                    {InputPanel && (
                        <InputPanel eventId={rules.id} scramble={custom} onChange={setCustom} />
                    )}
                </Suspense>
                <label>
                    {t('notationInput')}
                    <textarea
                        ref={customInput}
                        value={custom}
                        disabled={locked}
                        aria-invalid={offset !== undefined}
                        onChange={(e) => {
                            setCustom(e.target.value);
                            setOffset(undefined);
                        }}
                    />
                </label>
                {offset !== undefined && (
                    <p role="alert">{t('notationError', { position: offset + 1 })}</p>
                )}
                <button disabled={locked} onClick={() => applyCustom()}>
                    {t('applyMix')}
                </button>
            </details>
            <details>
                <summary>{t('manual')}</summary>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const ms = parseTime(manual);
                        setManualError(ms === null);
                        if (ms !== null) record(ms, penalty, 'manual');
                    }}
                >
                    <label>
                        {t('timeInput')}{' '}
                        <input
                            value={manual}
                            onChange={(e) => {
                                setManual(e.target.value);
                                setManualError(false);
                            }}
                            placeholder="1:02.34"
                        />
                    </label>
                    <label>
                        {t('penalty')}{' '}
                        <select
                            value={penalty}
                            onChange={(e) => setPenalty(e.target.value as Solve['penalty'])}
                        >
                            <option value="none">{t('none')}</option>
                            <option>+2</option>
                            <option value="dnf">DNF</option>
                        </select>
                    </label>
                    <button disabled={locked || !mix.current}>{t('saveTime')}</button>
                    {manualError && <p role="alert">{t('invalidTime')}</p>}
                </form>
            </details>

            <section className="times">
                <h2>{t('latestFive')}</h2>
                <span data-testid="session-count">{t('sessionCount', { count: total })}</span>
                <p>
                    ao5 <strong>{ao === null ? '—' : ao === Infinity ? 'DNF' : formatTime(ao)}</strong>
                </p>
                {newPbs?.length ? (
                    <p role="status">
                        {t('newPb')} {newPbs.map((r) => t(r.metric)).join(', ')}
                    </p>
                ) : null}
                <ol data-testid="recent">
                    {recent.map((s) => (
                        <li key={s.id}>
                            <b>{show(s)}</b>
                            {s.comment && <span>{s.comment}</span>}
                        </li>
                    ))}
                </ol>
                {!last && <p>{t('noTimes')}</p>}
                {last && (
                    <div className="actions" aria-label={t('lastSolve')}>
                        <button
                            aria-pressed={last.penalty === '+2'}
                            onClick={() =>
                                void edit(last.id, { penalty: last.penalty === '+2' ? 'none' : '+2' })
                            }
                        >
                            +2
                        </button>
                        <button
                            aria-pressed={last.penalty === 'dnf'}
                            onClick={() =>
                                void edit(last.id, { penalty: last.penalty === 'dnf' ? 'none' : 'dnf' })
                            }
                        >
                            DNF
                        </button>
                        <button
                            onClick={async () => {
                                if (await edit(last.id, { deletedAt: Date.now() })) setDeleted(last.id);
                            }}
                        >
                            {t('deleteLast')}
                        </button>
                        <form
                            key={last.id}
                            onSubmit={(e) => {
                                e.preventDefault();
                                void edit(last.id, {
                                    comment: String(
                                        new FormData(e.currentTarget).get('comment') ?? '',
                                    ).trim(),
                                });
                            }}
                        >
                            <label>
                                {t('comment')} <input name="comment" defaultValue={last.comment ?? ''} />
                            </label>
                            <button>{t('saveComment')}</button>
                        </form>
                    </div>
                )}
                {deleted && (
                    <button
                        onClick={async () => {
                            if (await edit(deleted, { deletedAt: undefined })) setDeleted('');
                        }}
                    >
                        {t('undo')}
                    </button>
                )}
            </section>
        </div>
    );
}
