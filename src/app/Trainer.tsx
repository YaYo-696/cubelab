import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../core/storage/db';
import type { AlgCase, AlgSet, Course, EventRules, PuzzleModule, VerifiedCase } from '../core/contracts';
import { type Completion } from '../core/academy/progress';
import { openingMoves } from '../core/academy/execution';
import { isFullPattern } from '../core/academy/lastLayer';
import type { AcademyCase } from '../core/academy/cases';
import { isTetra } from '../puzzles/events';
import { LastLayerImage } from './LastLayerImage';
import type { TrainingSet } from '../core/trainer/catalog';
import {
    caseStats,
    choices,
    dueChoice,
    groupFor,
    groupOpen,
    slowest,
    type TrainerAttempt,
    type TrainerCase,
    type TrainerStatus,
} from '../core/trainer/model';
import { saveTrainingAttempt, setTrainingStatus, trainingCases } from '../core/trainer/storage';
import { formatTime } from '../core/timer/times';
import { useTimerInput } from './useTimerInput';
import '../ui/timer.css';
import './academy.css';
import './trainer.css';

const Player = lazy(() => import('./AcademyPlayer').then((m) => ({ default: m.AcademyPlayer })));
type T = (key: string, params?: Record<string, string | number>) => string;
type Props = { mod: PuzzleModule<string>; rules: EventRules; t: T };
type Card = { entry: AlgCase; mix: VerifiedCase; options: AlgCase[] };
type Mode = TrainerAttempt['mode'];

const decode = (text?: string) => {
    try {
        return text ? decodeURIComponent(text) : undefined;
    } catch {
        return undefined;
    }
};

export function Trainer({
    mod,
    rules,
    t,
    link,
    linkedCase,
}: Props & { link?: string; linkedCase?: string }) {
    const [course, setCourse] = useState<Course>();
    const [progress, setProgress] = useState<Completion[]>();
    const [selected, setSelected] = useState(() => decode(link));
    const [error, setError] = useState('');
    const [catalogs, setCatalogs] = useState<readonly TrainingSet[]>(mod.trainingSets ?? []);
    const [sessionLocked, setSessionLocked] = useState(false);
    useEffect(() => {
        let active = true;
        Promise.all([mod.loadCourse(mod.courses[0]), mod.loadContentInfo?.()])
            .then(([value, info]) => {
                if (active) { setCourse(value); setCatalogs(info?.trainingSets ?? mod.trainingSets ?? []); }
            })
            .catch((reason: unknown) => {
                if (active) setError(reason instanceof Error ? reason.message : String(reason));
            });
        return () => { active = false; };
    }, [mod]);
    useEffect(() => {
        if (!course) return;
        const sub = liveQuery(() =>
            db.lessons
                .where({
                    courseId: course.id,
                })
                .toArray(),
        ).subscribe({ next: setProgress, error: () => setError('storage') });
        return () => sub.unsubscribe();
    }, [course]);
    const available =
        course &&
        progress &&
        catalogs.filter((set) =>
            set.groups.some((group) => groupOpen(course, progress, group.lessonId)),
        );
    const config = available?.find((set) => set.id === selected) ?? available?.[0];
    if (error) return <p role="alert">{error === 'storage' ? t('failed') : error}</p>;
    if (!available || !course || !progress) return <p>{t('aLoading')}</p>;
    if (!config) return <p>{t(catalogs.length ? 'trainerLocked' : 'trainerNoSets')}</p>;
    return (
        <section className="academy-card trainer">
            <label>
                {t('trainerSet')}{' '}
                <select
                    value={config.id}
                    disabled={sessionLocked}
                    onChange={(e) => setSelected(e.target.value)}
                >
                    {available.map((set) => (
                        <option key={set.id} value={set.id}>
                            {t(set.nameKey)}
                        </option>
                    ))}
                </select>
            </label>
            <Session
                key={config.id}
                onLock={setSessionLocked}
                config={config}
                course={course}
                progress={progress}
                requested={config.id === decode(link) ? decode(linkedCase) : undefined}
                mod={mod}
                rules={rules}
                t={t}
            />
        </section>
    );
}
function Session({
    config,
    course,
    progress,
    requested,
    mod,
    rules,
    t,
    onLock,
}: Props & {
    config: TrainingSet;
    course: Course;
    progress: Completion[];
    requested?: string;
    onLock: (locked: boolean) => void;
}) {
    const [catalog, setCatalog] = useState<AlgSet>();
    const [records, setRecords] = useState<TrainerCase[]>();
    const [history, setHistory] = useState<TrainerAttempt[]>([]);
    const [threshold, setThreshold] = useState(300);
    const [filter, setFilter] = useState('all');
    const [specific, setSpecific] = useState(requested ?? '');
    const [mode, setMode] = useState<Mode>('timed');
    const [card, setCard] = useState<Card>();
    const [hidden, setHidden] = useState(false);
    const [view3d, setView] = useState(false);
    const [helped, setHelped] = useState(false);
    const [answer, setAnswer] = useState<TrainerAttempt>();
    const [pending, setPending] = useState<TrainerAttempt>();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState('');
    const [detail, setDetail] = useState('');
    const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });
    const request = useRef<AbortController>();
    const busyStore = useRef(false);
    const started = useRef(false);
    const rows = useMemo(() => new Map(records?.map((row) => [row.caseId, row])), [records]);
    const unlocked =
        catalog?.cases.filter((entry) => {
            const group = groupFor(config, entry.id);
            return group && groupOpen(course, progress, group.lessonId);
        }) ?? [];
    const rank = slowest(
        (records ?? []).filter((row) => unlocked.some((item) => item.id === row.caseId)),
    );
    const entries = unlocked.filter((entry) => {
        if (filter === 'learning') return rows.get(entry.id)?.status === 'learning';
        if (filter === 'slow') return rank.some((row) => row.caseId === entry.id);
        return filter === 'all' || groupFor(config, entry.id)?.id === filter;
    });
    const entryName = (id: string) => t(catalog?.cases.find((entry) => entry.id === id)?.nameKey ?? id);
    const timer = useTimerInput({
        rules,
        inspection: false,
        threshold,
        enabled: mode === 'timed' && !!card && !answer && !pending && !loading,
        finish: ({ timeMs }) => {
            if (card) void record({ mode: 'timed', correct: true, timeMs, assisted: helped });
        },
    });
    const phase = timer.machine.phase;
    const timing = ['holding', 'ready', 'running'].includes(phase);
    const locked = timing || saving || !!pending;
    useEffect(() => {
        onLock(locked);
        return () => onLock(false);
    }, [locked, onLock]);
    useEffect(() => {
        let active = true;
        mod.loadAlgSet(config.id)
            .then((value) => {
                if (active) setCatalog(value);
            })
            .catch(() => {
                if (active) setNotice('failed');
            });
        db.settings
            .get('holdMs')
            .then((value) => {
                const hold = Number(value?.value ?? 300);
                if (active && Number.isInteger(hold) && hold >= 0 && hold <= 3000) setThreshold(hold);
            })
            .catch(() => {});
        const cases = liveQuery(() => trainingCases(db, mod.id, config.id)).subscribe({
            next: setRecords,
            error: () => setNotice('failed'),
        });
        const attempts = liveQuery(() =>
            db.trainerAttempts
                .where('[puzzleId+setId+createdAt]')
                .between(
                    [mod.id, config.id, 0],
                    [mod.id, config.id, Number.MAX_SAFE_INTEGER],
                    true,
                    true,
                )
                .reverse()
                .limit(8)
                .toArray(),
        ).subscribe({ next: setHistory, error: () => setNotice('failed') });
        return () => {
            active = false;
            request.current?.abort();
            cases.unsubscribe();
            attempts.unsubscribe();
        };
    }, [mod, config.id]);
    useEffect(() => {
        // Initial generation goes through the same action as subsequent cases.
        if (!started.current && catalog && records && entries.length) {
            started.current = true;
            void next();
        }
    }, [catalog, records, entries.length]);

    async function next() {
        if (!catalog || locked) return;
        const candidates =
            entries.length > 1 && card && !specific
                ? entries.filter((entry) => entry.id !== card.entry.id)
                : entries;
        const entry =
            candidates.find((item) => item.id === specific) ?? dueChoice(candidates, rows, Date.now());
        if (!entry) return;
        request.current?.abort();
        const control = new AbortController();
        request.current = control;
        setLoading(true);
        setCard(undefined);
        setAnswer(undefined);
        setHelped(false);
        setNotice('');
        setDetail('');
        try {
            const mix = await mod.caseGenerators[config.id](entry.id, control.signal);
            if (control.signal.aborted) return;
            if (!mix.verified) throw new Error('trainerCaseVerification');
            setCard({ entry, mix, options: choices(entry, catalog.cases) });
            if (mode === 'timed') timer.area.current?.focus({ preventScroll: true });
        } catch (reason) {
            if (!control.signal.aborted) {
                setDetail(reason instanceof Error ? reason.message : String(reason));
                setNotice('trainerGenerateError');
            }
        } finally {
            if (!control.signal.aborted) setLoading(false);
        }
    }
    function resetCard() {
        request.current?.abort();
        setLoading(false);
        setCard(undefined);
        setAnswer(undefined);
        setHelped(false);
        setNotice('');
    }
    type Result =
        | { mode: 'timed'; timeMs?: number; assisted: boolean; correct: boolean }
        | { mode: 'recognition'; answerId: string; correct: boolean };
    async function record(result: Result) {
        if (!card || busyStore.current || answer || pending) return;
        const attempt: TrainerAttempt = {
            id: crypto.randomUUID(),
            puzzleId: mod.id,
            setId: config.id,
            caseId: card.entry.id,
            scramble: card.mix.scramble,
            createdAt: Date.now(),
            ...result,
        };
        await persist(attempt);
    }
    async function persist(attempt: TrainerAttempt) {
        if (busyStore.current) return;
        busyStore.current = true;
        setSaving(true);
        setPending(attempt);
        setNotice('');
        try {
            await saveTrainingAttempt(attempt, config.targetMs);
            setAnswer(attempt);
            setPending(undefined);
            if (attempt.mode === 'recognition')
                setScore((old) => ({
                    correct: old.correct + Number(attempt.correct),
                    total: old.total + 1,
                    streak: attempt.correct ? old.streak + 1 : 0,
                }));
            else timer.saved();
        } catch {
            setNotice('trainerSaveError');
        } finally {
            busyStore.current = false;
            setSaving(false);
        }
    }

    const pattern = (card?.entry as AcademyCase | undefined)?.pattern;
    const main = card?.entry.algorithms[0] ?? '';
    const prep = card?.mix.preAdjustment;
    const opening = helped ? openingMoves(main) : undefined;
    const showPicture = card && (mode === 'recognition' || (!hidden && !helped));
    const time =
        phase === 'running'
            ? Math.max(0, performance.now() - timer.machine.startedAt)
            : (timer.machine.result?.timeMs ?? 0);
    const activeStatus = card ? (rows.get(card.entry.id)?.status ?? 'new') : 'new';
    return (
        <>
            <div className="trainer-controls">
                <label>
                    {t('trainerMode')}{' '}
                    <select
                        value={mode}
                        disabled={locked}
                        onChange={(e) => {
                            const value = e.target.value as Mode;
                            setMode(value);
                            resetCard();
                            if (value === 'recognition') setSpecific('');
                        }}
                    >
                        <option value="timed">{t('trainerTimed')}</option>
                        <option value="recognition">{t('trainerRecognition')}</option>
                    </select>
                </label>
                <label>
                    {t('trainerFilter')}{' '}
                    <select
                        value={filter}
                        disabled={locked}
                        onChange={(e) => {
                            setFilter(e.target.value);
                            setSpecific('');
                            resetCard();
                        }}
                    >
                        <option value="all">{t('trainerAll')}</option>
                        {config.groups
                            .filter((group) => groupOpen(course, progress, group.lessonId))
                            .map((group) => (
                                <option key={group.id} value={group.id}>
                                    {t(group.nameKey ?? ('aTitle_' + group.lessonId))}
                                </option>
                            ))}
                        <option value="learning">{t('trainerStatus_learning')}</option>
                        <option value="slow">{t('trainerSlow')}</option>
                    </select>
                </label>
                {mode === 'timed' && (
                    <label>
                        {t('aCase')}{' '}
                        <select
                            value={specific}
                            disabled={locked}
                            onChange={(e) => {
                                setSpecific(e.target.value);
                                resetCard();
                            }}
                        >
                            <option value="">{t('trainerAuto')}</option>
                            {entries.map((entry) => (
                                <option key={entry.id} value={entry.id}>
                                    {t(entry.nameKey)}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <button
                    type="button"
                    disabled={locked || loading || !entries.length}
                    onClick={() => void next()}
                >
                    {t('trainerNext')}
                </button>
            </div>
            {loading && <p role="status">{t('busy')}</p>}
            {notice && <p role="alert">{t(notice, { detail })}</p>}
            {pending && !saving && (
                <button type="button" onClick={() => void persist(pending)}>
                    {t('retry')}
                </button>
            )}
            {catalog && records && !entries.length && <p>{t('trainerEmpty')}</p>}
            {card && mode === 'timed' && (
                <section className="trainer-case">
                    <h2>{t(card.entry.nameKey)}</h2>
                    <p className="sequence" data-testid="trainer-scramble">
                        {card.mix.scramble}
                    </p>
                    <div className="trainer-controls">
                        <button
                            type="button"
                            disabled={locked || helped}
                            onClick={() => setHidden(!hidden)}
                        >
                            {t(hidden ? 'trainerShowTop' : 'trainerHideTop')}
                        </button>
                        <button
                            type="button"
                            disabled={locked || !!answer || helped}
                            onClick={() => {
                                setHelped(true);
                                timer.area.current?.focus({ preventScroll: true });
                            }}
                        >
                            {t('trainerShowAlgorithm')}
                        </button>
                        <button
                            type="button"
                            disabled={locked || !!answer}
                            onClick={() =>
                                void record({ mode: 'timed', correct: false, assisted: helped })
                            }
                        >
                            {t('trainerFailed')}
                        </button>
                        <label>
                            {t('trainerStatus')}{' '}
                            <select
                                value={activeStatus}
                                disabled={locked}
                                onChange={(e) => {
                                    const key = {
                                        puzzleId: mod.id,
                                        setId: config.id,
                                        caseId: card.entry.id,
                                    };
                                    void setTrainingStatus(key, e.target.value as TrainerStatus).catch(
                                        () => setNotice('failed'),
                                    );
                                }}
                            >
                                {(['new', 'learning', 'learned'] as const).map((status) => (
                                    <option key={status} value={status}>
                                        {t('trainerStatus_' + status)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </section>
            )}
            {mode === 'recognition' && (
                <>
                    <p>{t('trainerScore', score)}</p>
                    {card && mod.visualization.twistyPuzzleId !== 'pyraminx-duo' && (
                        <button type="button" onClick={() => setView(!view3d)}>
                            {t(view3d ? 'trainerShowTop' : 'trainerShow3d')}
                        </button>
                    )}
                </>
            )}
            {showPicture && (mode !== 'recognition' || !view3d) && (
                <div className="trainer-diagram">
                    {isTetra(mod.id) ? <Suspense fallback={<p>{t('aLoading')}</p>}>
                        <Player puzzle={mod.visualization.twistyPuzzleId} setup={card.mix.scramble} alg="" still flatOnly t={t} />
                    </Suspense> : <LastLayerImage
                        puzzle={mod.id}
                        pattern={pattern && isFullPattern(pattern) ? pattern : undefined}
                        setup={card.mix.scramble}
                        includeLower={config.lowerFace}
                        label={t('aTopCase')}
                    />}
                    {config.lowerFace && <small>{t('trainerLower')}</small>}
                </div>
            )}
            {card && (helped || (mode === 'recognition' && view3d)) && (
                <Suspense fallback={<p>{t('aLoading')}</p>}>
                    <Player
                        puzzle={mod.visualization.twistyPuzzleId}
                        setup={card.mix.scramble}
                        alg={helped ? [prep, main].filter(Boolean).join(' ') : ''}
                        still={!helped}
                        t={t}
                    />
                </Suspense>
            )}
            {helped && (
                <>
                    <p>
                        <strong>{t('aMain')}</strong> · <code>{main}</code>
                    </p>
                    {prep && (
                        <p>
                            {t('aAdjustUpper')} · <code>{prep}</code>
                        </p>
                    )}
                    {!!opening?.steps.length && (
                        <ol aria-label={t('aOpeningMoves')}>
                            {opening.steps.map(({ key, move }, index) => (
                                <li key={index}>
                                    {t(key)} · <code>{move}</code>
                                </li>
                            ))}
                            <li>
                                {t('aExecuteSequence')} · <code>{opening.body}</code>
                            </li>
                        </ol>
                    )}
                </>
            )}
            {mode === 'recognition' && card && (
                <div className="trainer-controls">
                    {card.options.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            disabled={!!answer || locked}
                            onClick={() =>
                                void record({
                                    mode: 'recognition',
                                    answerId: entry.id,
                                    correct: entry.id === card.entry.id,
                                })
                            }
                        >
                            {t(entry.nameKey)}
                        </button>
                    ))}
                    {answer?.mode === 'recognition' && (
                        <p role="status">
                            {t(answer.correct ? 'trainerCorrect' : 'trainerWrong', {
                                caseName: t(card.entry.nameKey),
                            })}
                        </p>
                    )}
                </div>
            )}
            <div hidden={mode !== 'timed'} className="trainer-timer">
                <div className={'timer-stage phase-' + phase + (timing ? ' expanded' : '')}>
                    <div
                        role="group"
                        tabIndex={0}
                        ref={timer.area}
                        className="touch-zone"
                        aria-label={t('touchZone')}
                        data-testid="trainer-timer"
                        data-phase={phase}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <span>{t('phase_' + phase)}</span>
                        <strong className="digits">{formatTime(time)}</strong>
                        {phase === 'idle' && card && !answer && <span>{t('startHold')}</span>}
                    </div>
                </div>
            </div>
            {history.length > 0 && (
                <section>
                    <h2>{t('trainerRecent')}</h2>
                    <ol aria-label={t('trainerRecent')}>
                        {history.map((attempt) => (
                            <li data-testid="trainer-attempt" key={attempt.id}>
                                {entryName(attempt.caseId)} ·{' '}
                                {attempt.mode === 'timed' && attempt.timeMs !== undefined
                                    ? formatTime(attempt.timeMs)
                                    : t(attempt.correct ? 'trainerCorrect' : 'trainerAttemptFailed')}
                                {attempt.mode === 'timed' && attempt.assisted && (
                                    <>
                                        {' '}
                                        · <strong>{t('trainerAssisted')}</strong>
                                    </>
                                )}
                            </li>
                        ))}
                    </ol>
                </section>
            )}
            {records && catalog && (
                <section className="trainer-stats">
                    <h2>{t('trainerStats')}</h2>
                    <table>
                        <thead>
                            <tr>
                                {[
                                    'aCase',
                                    'trainerStatus',
                                    'trainerAverage',
                                    'trainerBest',
                                    'trainerAttempts',
                                    'trainerAssisted',
                                ].map((label) => (
                                    <th key={label} scope="col">
                                        {t(label)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {unlocked.map((entry) => {
                                const row = rows.get(entry.id);
                                const stats = caseStats(row);
                                return (
                                    <tr key={entry.id}>
                                        <th scope="row">{t(entry.nameKey)}</th>
                                        <td>{t('trainerStatus_' + (row?.status ?? 'new'))}</td>
                                        <td>
                                            {stats.average === undefined
                                                ? '—'
                                                : formatTime(stats.average)}
                                        </td>
                                        <td>
                                            {stats.best === undefined ? '—' : formatTime(stats.best)}
                                        </td>
                                        <td>{stats.attempts}</td>
                                        <td>{Math.round(stats.assistedRate * 100)} %</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {!!rank.length && (
                        <>
                            <h3>{t('trainerSlow')}</h3>
                            <ol>
                                {rank.map((row) => (
                                    <li key={row.caseId}>
                                        {entryName(row.caseId)} · {formatTime(caseStats(row).average!)}
                                    </li>
                                ))}
                            </ol>
                        </>
                    )}
                </section>
            )}
        </>
    );
}
