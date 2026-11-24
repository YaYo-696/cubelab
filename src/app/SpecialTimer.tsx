import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { EventRules, PuzzleModule } from '../core/contracts';
import { evaluateFmc, fmcTimeLimit } from '../core/events/fmc';
import { multiBlindLimit, scoreMultiBlind } from '../core/events/multiBlind';
import { resultText, wholeSeconds } from '../core/events/results';
import { db, type Session, type Solve } from '../core/storage/db';
import { attempts, persistAttempt, replayAttempts } from '../core/storage/attempts';
import type { T } from './App';
import '../ui/timer.css';

type Phase = 'setup' | 'generating' | 'ready' | 'running' | 'score' | 'saving' | 'saved';
type Running = { started: number; limit: number; session: string };
const validCount = (n: number) => Number.isSafeInteger(n) && n >= 2;
const elapsed = (started: number) => Math.max(0, Math.floor(performance.now() - started));

export function SpecialTimer({
    mod,
    rules,
    t,
}: {
    mod: PuzzleModule<string>;
    rules: EventRules;
    t: T;
}) {
    const fmc = rules.scoring === 'moves';
    const [phase, setPhase] = useState<Phase>('setup');
    const [count, setCount] = useState('2');
    const [scrambles, setScrambles] = useState<string[]>([]);
    const [generated, setGenerated] = useState(0);
    const [draft, setDraft] = useState('');
    const [stoppedAt, setStoppedAt] = useState(0);
    const [remaining, setRemaining] = useState(fmcTimeLimit);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [session, setSession] = useState('');
    const [notice, setNotice] = useState<{ key: string; position?: number }>();
    const [pending, setPending] = useState<Solve>();
    const [writeFailed, setWriteFailed] = useState(false);
    const [last, setLast] = useState<Solve>();
    const request = useRef<AbortController>();
    const running = useRef<Running>();
    const finalizing = useRef(false);
    const inFlight = useRef(false);
    const solution = useRef<HTMLTextAreaElement>(null);
    const stopButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        let active = true;
        void (async () => {
            await replayAttempts();
            const list = await attempts.sessions(rules.id, mod.id);
            const saved = await db.settings.get('session:' + rules.id);
            if (!active) return;
            setSessions(list);
            setSession(list.find((item) => item.id === saved?.value)?.id ?? list[0].id);
        })().catch(() => {
            if (active) setNotice({ key: 'storageError' });
        });
        return () => {
            active = false;
            request.current?.abort();
        };
    }, [mod.id, rules.id]);

    async function prepare(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (request.current) return;
        const target = fmc ? 1 : Number(count);
        if (!fmc && !validCount(target)) {
            setNotice({ key: 'invalidMultiBlind' });
            return;
        }
        const control = new AbortController();
        request.current = control;
        setLast(undefined);
        setNotice(undefined);
        setDraft('');
        setGenerated(0);
        setPhase('generating');
        const list: string[] = [];
        try {
            for (let index = 0; index < target; index++) {
                list.push(await mod.generateScramble(rules.id, control.signal));
                control.signal.throwIfAborted();
                setGenerated(list.length);
            }
            setScrambles(list);
            setRemaining(fmc ? fmcTimeLimit : multiBlindLimit(list.length));
            setPhase('ready');
        } catch {
            if (!control.signal.aborted) {
                setNotice({ key: 'modalityMixError' });
                setPhase('setup');
            }
        } finally {
            if (request.current === control) request.current = undefined;
        }
    }

    function start() {
        if (!session || phase !== 'ready') return;
        running.current = { started: performance.now(), limit: remaining, session };
        finalizing.current = false;
        setPhase('running');
    }

    async function save(row: Solve) {
        if (inFlight.current) return;
        inFlight.current = true;
        setPending(row);
        setWriteFailed(false);
        setPhase('saving');
        try {
            await persistAttempt(row);
            setPending(undefined);
            setLast(row);
            setPhase('saved');
        } catch {
            // Keep the exact row and UUID for retry, as in the regular Timer.
            setWriteFailed(true);
        } finally {
            inFlight.current = false;
        }
    }

    function createRow(
        active: Running,
        result: Solve['result'],
        penalty: Solve['penalty'],
        reconstruction?: string,
    ): Solve {
        return {
            id: crypto.randomUUID(),
            sessionId: active.session,
            eventId: rules.id,
            puzzleId: mod.id,
            createdAt: Date.now(),
            source: 'timer',
            scramble: scrambles.join('\n'),
            result,
            penalty,
            reconstruction,
        };
    }

    async function finishFmc(time: number, text: string) {
        const active = running.current;
        if (!active || finalizing.current) return;
        finalizing.current = true;
        try {
            const result = await evaluateFmc(scrambles[0], text, time);
            setNotice(
                result.reason
                    ? {
                          key: result.reason,
                          position: 'position' in result ? result.position : undefined,
                      }
                    : undefined,
            );
            await save(
                createRow(
                    active,
                    { kind: 'moves', moves: result.moves },
                    result.reason ? 'dnf' : 'none',
                    'alg' in result ? result.alg : text,
                ),
            );
        } catch {
            finalizing.current = false;
            setNotice({ key: 'fmcVerificationError' });
        }
    }

    function stopMulti(time: number) {
        const active = running.current;
        if (!active || finalizing.current) return;
        finalizing.current = true;
        const stopped = Math.min(time, active.limit);
        setStoppedAt(stopped);
        setRemaining(active.limit - stopped);
        setPhase('score');
    }

    useEffect(() => {
        const active = running.current;
        if (phase !== 'running' || !active) return;
        const { started, limit } = active;
        function tick() {
            const time = elapsed(started);
            setRemaining(Math.max(0, limit - time));
            if (time >= limit) {
                if (fmc) void finishFmc(time, solution.current?.value ?? '');
                else stopMulti(time);
            }
        }
        const interval = setInterval(tick, 150);
        if (fmc) solution.current?.focus();
        else stopButton.current?.focus();
        return () => clearInterval(interval);
    }, [phase]); // The running attempt fixes the scramble, event and session.

    function score(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const active = running.current;
        if (!active || inFlight.current) return;
        const fields = new FormData(e.currentTarget);
        const solved = Number(fields.get('solved'));
        try {
            const outcome = scoreMultiBlind(
                solved,
                scrambles.length,
                stoppedAt,
                Number(fields.get('penalties')),
            );
            setNotice(undefined);
            void save(
                createRow(
                    active,
                    {
                        kind: 'multiBlind',
                        solved,
                        attempted: scrambles.length,
                        timeMs: outcome.timeMs,
                    },
                    outcome.dnf ? 'dnf' : 'none',
                ),
            );
        } catch {
            setNotice({ key: 'invalidMultiBlind' });
        }
    }

    return (
        <div className="timer-page">
            <section className="mix-board">
                <h2>{t(rules.nameKey)}</h2>
                <label>
                    {t('session')}{' '}
                    <select
                        value={session}
                        disabled={phase !== 'setup' && phase !== 'saved'}
                        onChange={(e) => {
                            setSession(e.target.value);
                            void db.settings
                                .put({ key: 'session:' + rules.id, value: e.target.value })
                                .catch(() => setNotice({ key: 'storageError' }));
                        }}
                    >
                        {sessions.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name || t('defaultSession')}
                            </option>
                        ))}
                    </select>
                </label>
                {(phase === 'setup' || phase === 'saved') && (
                    <form onSubmit={(e) => void prepare(e)}>
                        {!fmc && (
                            <label>
                                {t('multiAttempted')}{' '}
                                <input
                                    type="number"
                                    min={2}
                                    step={1}
                                    required
                                    value={count}
                                    onChange={(e) => setCount(e.target.value)}
                                />
                            </label>
                        )}
                        <button disabled={!session}>{t('prepareModality')}</button>
                    </form>
                )}
                {phase === 'generating' && (
                    <div>
                        <p role="status">
                            {t('modalityGenerating', {
                                count: generated,
                                total: fmc ? 1 : Number(count),
                            })}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                request.current?.abort();
                                request.current = undefined;
                                setPhase('setup');
                            }}
                        >
                            {t('solveCancel')}
                        </button>
                    </div>
                )}
                {phase === 'ready' && (
                    <>
                        {!fmc && (
                            <ol data-testid="multi-scrambles">
                                {scrambles.map((mix, i) => (
                                    <li key={i} className="sequence">
                                        {mix}
                                    </li>
                                ))}
                            </ol>
                        )}
                        <button type="button" onClick={start}>
                            {t('startModality')}
                        </button>
                    </>
                )}
                {(phase === 'ready' || phase === 'running') && (
                    <p className="digits" data-testid="modality-countdown">
                        {wholeSeconds(Math.ceil(remaining / 1000) * 1000)}
                    </p>
                )}
                {phase === 'running' &&
                    (fmc ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (running.current)
                                    void finishFmc(elapsed(running.current.started), draft);
                            }}
                        >
                            <p className="sequence" data-testid="scramble">
                                {scrambles[0]}
                            </p>
                            <label>
                                {t('fmcSolution')}{' '}
                                <textarea
                                    ref={solution}
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    rows={5}
                                />
                            </label>
                            <button>{t('submitFmc')}</button>
                        </form>
                    ) : (
                        <button
                            type="button"
                            ref={stopButton}
                            onClick={() => {
                                if (running.current) stopMulti(elapsed(running.current.started));
                            }}
                        >
                            {t('stopModality')}
                        </button>
                    ))}
                {phase === 'score' && (
                    <form onSubmit={score}>
                        <p>{t('multiStopped', { time: wholeSeconds(stoppedAt) })}</p>
                        <label>
                            {t('multiSolved')}{' '}
                            <input
                                name="solved"
                                type="number"
                                min={0}
                                max={scrambles.length}
                                step={1}
                                required
                            />
                        </label>
                        <label>
                            {t('multiPenalties')}{' '}
                            <input
                                name="penalties"
                                type="number"
                                min={0}
                                step={1}
                                defaultValue={0}
                                required
                            />
                        </label>
                        <button>{t('submitMulti')}</button>
                    </form>
                )}
                {pending && (
                    <div role="status">
                        <p>{t(writeFailed ? 'pendingSave' : 'saving')}</p>
                        {writeFailed && (
                            <button type="button" onClick={() => void save(pending)}>
                                {t('retry')}
                            </button>
                        )}
                    </div>
                )}
                {last && (
                    <p role="status" data-testid="modality-result">
                        {resultText(last, t)}
                    </p>
                )}
                {notice && <p role="alert">{t(notice.key, { position: notice.position ?? 1 })}</p>}
            </section>
        </div>
    );
}
