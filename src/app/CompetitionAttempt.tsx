import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { EventRules } from '../core/contracts';
import type { Preferences } from '../core/storage/preferences';
import type { RoundAttempt } from '../core/competition/round';
import { evaluateFmc } from '../core/events/fmc';
import { scoreMultiBlind } from '../core/events/multiBlind';
import { wholeSeconds } from '../core/events/results';
import { formatTime } from '../core/timer/times';
import { useTimerInput } from './useTimerInput';
import type { T } from './App';
import '../ui/timer.css';

export type AttemptDraft = Omit<RoundAttempt, 'scramble'>;
type Props = {
    rules: EventRules;
    prefs: Preferences;
    limit: number;
    scrambles: string[];
    finish: (draft: AttemptDraft) => void;
    t: T;
};

function Scrambles({ scrambles, t }: Pick<Props, 'scrambles' | 't'>) {
    return scrambles.length === 1 ? (
        <p className="sequence competition-scrambles" data-testid="competition-scramble">
            {scrambles[0]}
        </p>
    ) : (
        <ol
            aria-label={t('scramble')}
            className="competition-scrambles"
            data-testid="competition-scramble"
        >
            {scrambles.map((mix) => (
                <li key={mix}>
                    <code>{mix}</code>
                </li>
            ))}
        </ol>
    );
}

function TimedAttempt({ rules, prefs, limit, scrambles, finish, t }: Props) {
    const timer = useTimerInput({
        rules,
        inspection: rules.inspectionSeconds !== null,
        threshold: prefs.holdMs,
        enabled: true,
        competitionLimitMs: limit,
        sound: prefs.sounds === 'on',
        vibration: prefs.vibration === 'on',
        finish: ({ timeMs, penalty }) =>
            finish({
                result: { kind: 'time', timeMs },
                elapsedMs: timeMs,
                additions: Number(penalty === '+2'),
                dnf: penalty === 'dnf',
            }),
    });
    const { phase, inspectionStart, startedAt } = timer.machine;
    const current = performance.now();
    const milliseconds =
        phase === 'running'
            ? Math.max(0, current - startedAt)
            : inspectionStart === null
              ? 0
              : Math.max(0, current - inspectionStart);
    return (
        <>
            {phase !== 'running' && <Scrambles scrambles={scrambles} t={t} />}
            <div className={'timer-stage competition-timer phase-' + phase}>
                <div
                    className="touch-zone"
                    tabIndex={0}
                    role="group"
                    ref={timer.area}
                    data-phase={phase}
                    data-testid="competition-timer"
                    aria-label={t('touchZone')}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <span className="phase-name">{t('phase_' + phase)}</span>
                    <strong className="digits">{formatTime(milliseconds)}</strong>
                    {phase === 'idle' && (
                        <span>{t(rules.inspectionSeconds ? 'startInspect' : 'startHold')}</span>
                    )}
                    {phase === 'inspecting' && <span>{t('startHold')}</span>}
                </div>
            </div>
        </>
    );
}

function WrittenOrBatchAttempt({ rules, limit, scrambles, finish, t }: Props) {
    const fmc = rules.scoring === 'moves';
    const [started, setStarted] = useState<number>();
    const [remaining, setRemaining] = useState(limit);
    const [elapsed, setElapsed] = useState<number>();
    const [notice, setNotice] = useState<{ key: string; position?: number }>();
    const [checking, setChecking] = useState(false);
    const inFlight = useRef(false);
    const active = useRef(true);
    const input = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        active.current = true;
        return () => {
            active.current = false;
        };
    }, []);

    async function submitFmc() {
        if (started === undefined || inFlight.current) return;
        const time = Math.floor(performance.now() - started);
        const draft = input.current?.value ?? '';
        inFlight.current = true;
        setChecking(true);
        try {
            const result = await evaluateFmc(scrambles[0], draft, time);
            if (active.current) {
                finish({
                    result: { kind: 'moves', moves: result.moves },
                    elapsedMs: time,
                    additions: 0,
                    dnf: result.reason !== null,
                    reconstruction: 'alg' in result ? result.alg : draft,
                });
            }
        } catch {
            if (active.current) setNotice({ key: 'fmcVerificationError' });
        } finally {
            inFlight.current = false;
            if (active.current) setChecking(false);
        }
    }

    useEffect(() => {
        if (started === undefined || elapsed !== undefined) return;
        const tick = () => {
            const time = performance.now() - started;
            setRemaining(Math.max(0, limit - time));
            if (time < limit) return;
            if (fmc && !inFlight.current)
                finish({
                    result: { kind: 'moves', moves: 0 },
                    elapsedMs: limit,
                    additions: 0,
                    dnf: true,
                    reconstruction: input.current?.value,
                });
            else if (!fmc) setElapsed(limit);
        };
        const interval = window.setInterval(tick, 100);
        return () => window.clearInterval(interval);
    }, [elapsed, finish, fmc, limit, started]);

    function score(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (elapsed === undefined) return;
        const data = new FormData(event.currentTarget);
        const solved = Number(data.get('solved'));
        const penalties = Number(data.get('penalties'));
        try {
            const result = scoreMultiBlind(solved, scrambles.length, elapsed, penalties);
            finish({
                result: {
                    kind: 'multiBlind',
                    solved,
                    attempted: scrambles.length,
                    timeMs: result.timeMs,
                },
                elapsedMs: elapsed,
                additions: 0,
                dnf: result.dnf,
            });
        } catch {
            setNotice({ key: 'invalidMultiBlind' });
        }
    }

    return (
        <>
            <strong className="digits" data-testid="competition-countdown">
                {wholeSeconds(remaining)}
            </strong>
            {started === undefined && (
                <>
                    {!fmc && <Scrambles scrambles={scrambles} t={t} />}
                    <button type="button" onClick={() => setStarted(performance.now())}>
                        {t('startModality')}
                    </button>
                </>
            )}
            {started !== undefined && fmc && (
                <>
                    <Scrambles scrambles={scrambles} t={t} />
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void submitFmc();
                        }}
                    >
                        <label>
                            {t('fmcSolution')} <textarea ref={input} rows={3} disabled={checking} />
                        </label>
                        <button disabled={checking}>{t('submitFmc')}</button>
                    </form>
                </>
            )}
            {started !== undefined && !fmc && elapsed === undefined && (
                <button
                    type="button"
                    onClick={() => {
                        const time = Math.min(Math.floor(performance.now() - started), limit);
                        setElapsed(time);
                        setRemaining(limit - time);
                    }}
                >
                    {t('stopModality')}
                </button>
            )}
            {elapsed !== undefined && (
                <form onSubmit={score}>
                    <label>
                        {t('multiSolved')}{' '}
                        <input type="number" name="solved" min="0" max={scrambles.length} required />
                    </label>
                    <label>
                        {t('multiPenalties')}{' '}
                        <input type="number" name="penalties" min="0" defaultValue="0" required />
                    </label>
                    <button>{t('submitMulti')}</button>
                </form>
            )}
            {notice && <p role="alert">{t(notice.key, { position: notice.position ?? 1 })}</p>}
        </>
    );
}

export function CompetitionAttempt(props: Props) {
    return props.rules.scoring === 'time' ? (
        <TimedAttempt {...props} />
    ) : (
        <WrittenOrBatchAttempt {...props} />
    );
}
