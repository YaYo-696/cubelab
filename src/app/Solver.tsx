import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Dexie from 'dexie';
import type { PuzzleModule, SearchResult } from '../core/contracts';
import type { SolveProgress } from '../core/solver/options';
import { db } from '../core/storage/db';
import { events, isPuzzleId, registry } from '../puzzles/registry';
import { NotationError } from '../puzzles/notation';
import type { PuzzleId } from '../puzzles/events';
import { useApp } from './state';
import './academy.css';
import './solver.css';

const Player = lazy(() => import('./AcademyPlayer').then((m) => ({ default: m.AcademyPlayer })));
type T = (key: string, params?: Record<string, string | number>) => string;
type Solved = Extract<SearchResult, { status: 'solved' }>;

async function latest(puzzle: PuzzleId) {
    const modalities = events.filter((event) => event.puzzleId === puzzle);
    const rows = await Promise.all(
        modalities.map(({ rules: { id: event } }) =>
            db.solves
                .where('[eventId+createdAt]')
                .between([event, Dexie.minKey], [event, Dexie.maxKey])
                .reverse()
                .filter((row) => !row.deletedAt && !!row.scramble)
                .first(),
        ),
    );
    return rows.sort((a, b) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0))[0]?.scramble;
}
export function SolverView({
    initialPuzzle,
    solveId,
    t,
}: {
    initialPuzzle: PuzzleId;
    solveId?: string;
    t: T;
}) {
    const [cube, setCube] = useState(initialPuzzle);
    const [mod, setMod] = useState<PuzzleModule<string>>();
    const [method, setMethod] = useState('shortest');
    const [input, setInput] = useState('');
    const [neutral, setNeutral] = useState(false);
    const [last, setLast] = useState<string>();
    const timer = useApp((state) => state.timerMix);
    const [result, setResult] = useState<Solved>();
    const [comparison, setComparison] = useState<number>();
    const [compareFailed, setCompareFailed] = useState(false);
    const [progress, setProgress] = useState<SolveProgress>();
    const [status, setStatus] = useState('');
    const [position, setPosition] = useState<number>();
    const [stageIndex, setStage] = useState(0);
    const [practicing, setPracticing] = useState(false);
    const [verifiedInput, setVerifiedInput] = useState('');
    const running = useRef<AbortController>();
    const current = timer?.puzzle === cube ? timer.scramble : undefined;
    const unavailable = mod?.id === cube && !mod.solvers?.shortestKnown;

    useEffect(
        () => () => {
            running.current?.abort();
        },
        [],
    );
    useEffect(() => {
        let active = true;
        registry[cube]()
            .then((m) => {
                if (active) setMod(m);
            })
            .catch(() => {
                if (active) setStatus('solveError');
            });
        latest(cube)
            .then((value) => {
                if (active) setLast(value);
            })
            .catch(() => {
                if (active) setLast(undefined);
            });
        return () => {
            active = false;
        };
    }, [cube]);
    useEffect(() => {
        if (!solveId) return;
        let active = true;
        db.solves
            .get(solveId)
            .then((row) => {
                if (!active) return;
                if (!row || row.deletedAt || !isPuzzleId(row.puzzleId)) {
                    setStatus('solveMissing');
                    return;
                }
                setCube(row.puzzleId);
                setInput(row.scramble);
            })
            .catch(() => {
                if (active) setStatus('solveError');
            });
        return () => {
            active = false;
        };
    }, [solveId]);

    function reset() {
        running.current?.abort();
        running.current = undefined;
        setResult(undefined);
        setComparison(undefined);
        setCompareFailed(false);
        setProgress(undefined);
        setPosition(undefined);
        setStatus('');
        setPracticing(false);
    }
    function replaceInput(value: string) {
        reset();
        setInput(value);
    }

    async function run() {
        reset();
        const shortest = mod?.solvers?.shortestKnown;
        const solver = method === 'shortest' ? shortest : mod?.solvers?.byMethod?.[method];
        if (!shortest || !solver || mod?.id !== cube) return;
        let scramble: string;
        try {
            scramble = input.trim() ? mod.notation.normalize(input) : '';
        } catch (error) {
            if (error instanceof NotationError) setPosition(error.offset + 1);
            setStatus('solveNotation');
            return;
        }
        const control = new AbortController();
        running.current = control;
        setStatus('solveRunning');
        const active = () => running.current === control && !control.signal.aborted;
        const comparison =
            method === 'shortest'
                ? Promise.resolve(undefined)
                : shortest(scramble, control.signal).catch(() => undefined);
        try {
            const answer = await solver(scramble, control.signal, {
                neutral,
                onProgress: (value) => {
                    if (active()) setProgress(value);
                },
            });
            if (!active()) return;
            if (answer.status !== 'solved') {
                setStatus('solveStatus_' + answer.status);
                return;
            }
            setVerifiedInput(scramble);
            setStage(0);
            setResult(answer);
            setStatus('');
            if (method !== 'shortest') {
                const other = await comparison;
                if (active() && other?.status === 'solved') setComparison(other.moves);
                else if (active()) setCompareFailed(true);
            }
        } catch (error) {
            if (active()) {
                console.error('CubeLab solver', error);
                setStatus('solveError');
            }
        } finally {
            if (running.current === control) {
                running.current = undefined;
                control.abort();
                setProgress(undefined);
            }
        }
    }
    function stageText(item: Solved['stages'][number], key: string) {
        const parameters = Object.fromEntries(
            Object.entries(item.explanationParams).map(([name, value]) => [
                name,
                /^color[12]?$/.test(name) ? t(String(value)) : value,
            ]),
        );
        return t(key, parameters);
    }
    const stage = result?.stages[stageIndex];
    const setup =
        result &&
        [verifiedInput, ...result.stages.slice(0, stageIndex).map((item) => item.alg)]
            .filter(Boolean)
            .join(' ');
    return (
        <section className="solver-view academy-card">
            <div className="solver-controls">
                <label>
                    {t('solvePuzzle')}{' '}
                    <select
                        value={cube}
                        onChange={(e) => {
                            reset();
                            setMethod('shortest');
                            setLast(undefined);
                            setCube(e.target.value as PuzzleId);
                        }}
                    >
                        {Object.keys(registry).map((id) => <option key={id} value={id}>{t(id)}</option>)}
                    </select>
                </label>
                {!unavailable && <label>
                    {t('solveMethod')}{' '}
                    <select
                        value={method}
                        onChange={(e) => {
                            reset();
                            setMethod(e.target.value);
                        }}
                    >
                        <option value="shortest">
                            {t(cube === '333' ? 'solveNear' : 'solveOptimal')}
                        </option>
                        {Object.keys(mod?.id === cube ? (mod.solvers?.byMethod ?? {}) : {}).map((id) => (
                            <option key={id} value={id}>
                                {t(cube === 'pyramduo' && id === 'beginner' ? 'duoLesson' : 'solveMethod_' + id)}
                            </option>
                        ))}
                    </select>
                </label>}
                {cube === '333' && method !== 'shortest' && (
                    <label>
                        <input
                            type="checkbox"
                            checked={neutral}
                            onChange={(e) => {
                                reset();
                                setNeutral(e.target.checked);
                            }}
                        />
                        {t('solveNeutral')}
                    </label>
                )}
            </div>
            {unavailable && <p role="status">{t('solveUnavailable', { puzzle: t(cube) })}</p>}
            <div className="solver-controls">
                <button type="button" disabled={!last} onClick={() => replaceInput(last ?? '')}>
                    {t('solveSourceLast')}
                </button>
                <button type="button" disabled={!current} onClick={() => replaceInput(current ?? '')}>
                    {t('solveSourceCurrent')}
                </button>
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void run();
                }}
            >
                <label>
                    {t('scramble')}{' '}
                    <textarea
                        value={input}
                        onChange={(e) => replaceInput(e.target.value)}
                        aria-invalid={status === 'solveNotation'}
                        rows={3}
                    />
                </label>
                <div className="solver-controls">
                    <button disabled={!mod || mod.id !== cube || unavailable || status === 'solveRunning'}>
                        {t('solveStart')}
                    </button>
                    {status === 'solveRunning' && (
                        <button
                            type="button"
                            onClick={() => {
                                reset();
                                setStatus('solveStatus_cancelled');
                            }}
                        >
                            {t('solveCancel')}
                        </button>
                    )}
                </div>
            </form>
            {status && <p role="status">{t(status, { position: position ?? 1 })}</p>}
            {progress && <p aria-live="polite">{t(progress.key, { value: progress.value })}</p>}
            {result && stage && setup !== undefined && (
                <div className="academy">
                    <div>
                        <h2>{t('solveStages')}</h2>
                        <p data-testid="solver-total" data-moves={result.moves}>
                            {t('solveTotal', { moves: result.moves })} · {result.metric}
                        </p>
                        <p>
                            {t(
                                result.quality === 'provenOptimal'
                                    ? 'solveOptimal'
                                    : method === 'shortest'
                                      ? 'solveNear'
                                      : cube === 'pyramduo' && method === 'beginner'
                                        ? 'duoLesson'
                                        : 'solveMethod_' + method,
                            )}
                        </p>
                        {method !== 'shortest' && (
                            <p>
                                {comparison === undefined
                                    ? t(compareFailed ? 'solveCompareFailed' : 'solveComparePending')
                                    : t('solveComparison', { moves: comparison })}
                            </p>
                        )}
                        <ol>
                            {result.stages.map((item, i) => (
                                <li key={item.id} data-testid="solver-stage" data-moves={item.moves}>
                                    <button
                                        type="button"
                                        aria-pressed={i === stageIndex}
                                        onClick={() => {
                                            setStage(i);
                                            setPracticing(false);
                                        }}
                                    >
                                        {stageText(item, item.nameKey)} · {item.moves}
                                    </button>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div>
                        <h2>{stageText(stage, stage.nameKey)}</h2>
                        <Suspense fallback={<p>{t('aLoading')}</p>}>
                            <Player
                                puzzle={mod?.visualization.twistyPuzzleId ?? '3x3x3'}
                                setup={setup}
                                alg={practicing ? '' : stage.alg}
                                still={practicing}
                                t={t}
                            />
                        </Suspense>
                        {practicing ? (
                            <p>{t('solvePracticePrompt')}</p>
                        ) : (
                            <>
                                <p>{stageText(stage, stage.explanationKey)}</p>
                                <p>
                                    <code>{stage.alg || t('solveAlready')}</code>
                                </p>
                            </>
                        )}
                        <div className="solver-controls">
                            <button type="button" onClick={() => setPracticing(!practicing)}>
                                {t(practicing ? 'solveReveal' : 'solvePractice')}
                            </button>
                            {stage.lessonId && (
                                <a href={'#academy/' + stage.lessonId + '/' + cube}>
                                    {t('solveLesson')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
