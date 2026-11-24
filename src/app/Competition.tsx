import { useEffect, useRef, useState, type FormEvent } from 'react';
import { registry } from '../puzzles/registry';
import { db } from '../core/storage/db';
import type { Preferences } from '../core/storage/preferences';
import {
    asSolve,
    attemptCount,
    attemptLimit,
    currentScrambles,
    cutoffOptions,
    extraCount,
    judgeAttempt,
    nextExtra,
    prepareRound,
    roundStatus,
    rulesRevision,
    type Competition,
    type CompetitionRound,
    type RoundConfig,
    type RoundFormat,
} from '../core/competition/round';
import {
    availableRound,
    competitionEvents,
    updateCompetition,
    updateRound,
} from '../core/competition/storage';
import { resultText } from '../core/events/results';
import { formatTime } from '../core/timer/times';
import { CompetitionAttempt, type AttemptDraft } from './CompetitionAttempt';
import { CompetitionResults, formatRound, roundNumber, useCompetitions } from './CompetitionResults';
import type { T } from './App';
import './competition.css';
import './statistics.css';

type Event = (typeof competitionEvents)[number];

function RoundForm({
    competition,
    onCreate,
    t,
}: {
    competition: Competition;
    onCreate: (config: RoundConfig, event: Event) => Promise<void>;
    t: T;
}) {
    const [eventId, setEventId] = useState<string>('333');
    const selection = competitionEvents.find(({ rules }) => rules.id === eventId)!;
    const { rules } = selection;
    const [selectedFormat, setFormat] = useState<RoundFormat>();
    const format = selectedFormat ?? rules.officialFormats[0];
    const allowed = cutoffOptions(format, rules.scoring);
    const [showCutoff, setCutoff] = useState(false);
    const counts = attemptCount[format];
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const optional = (name: string, scale = 1) => {
            const value = data.get(name);
            return value ? Math.round(Number(value) * scale) : undefined;
        };
        const cutoff =
            showCutoff && allowed.length
                ? {
                      attempts: Number(data.get('cutoffAttempts')),
                      threshold: optional('threshold', rules.scoring === 'time' ? 1000 : 1) ?? 0,
                  }
                : undefined;
        void onCreate(
            {
                eventId,
                format,
                cutoff,
                timeLimitMs: optional('limit', 1000),
                cumulativeMs: optional('cumulative', 1000),
                cubes:
                    rules.scoring === 'multiBlind'
                        ? Array.from({ length: counts }, (_, i) => Number(data.get('cubes' + i)))
                        : undefined,
            },
            selection,
        );
    }
    const full = competition.rounds.filter((round) => round.eventId === eventId).length >= 4;
    return (
        <form onSubmit={submit}>
            <label>
                {t('event')}{' '}
                <select
                    value={eventId}
                    onChange={(e) => {
                        setEventId(e.target.value);
                        setFormat(undefined);
                        setCutoff(false);
                    }}
                >
                    {competitionEvents.map(({ rules }) => (
                        <option value={rules.id} key={rules.id}>
                            {t(rules.nameKey)}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                {t('competitionFormat')}{' '}
                <select
                    value={format}
                    onChange={(e) => {
                        setFormat(e.target.value as RoundFormat);
                        setCutoff(false);
                    }}
                >
                    {rules.officialFormats.map((value) => (
                        <option value={value} key={value}>
                            {formatRound(value, t)}
                        </option>
                    ))}
                </select>
            </label>
            {rules.scoring === 'time' && (
                <>
                    <label>
                        {t('competitionLimitSeconds')}{' '}
                        <input type="number" name="limit" min="0.01" step="0.01" defaultValue={600} />
                    </label>
                    <label>
                        {t('competitionCumulativeSeconds')}{' '}
                        <input type="number" name="cumulative" min="0.01" step="0.01" />
                    </label>
                </>
            )}
            {rules.scoring === 'multiBlind' &&
                Array.from({ length: counts }, (_, i) => (
                    <label key={i}>
                        {t('competitionCubes', { number: i + 1 })}
                        <input
                            type="number"
                            name={'cubes' + i}
                            min="2"
                            max="100"
                            defaultValue="2"
                            required
                        />
                    </label>
                ))}
            {!!allowed.length && (
                <>
                    <label>
                        <span>
                            <input
                                type="checkbox"
                                checked={showCutoff}
                                onChange={(e) => setCutoff(e.target.checked)}
                            />{' '}
                            {t('competitionCutoff')}
                        </span>
                    </label>
                    {showCutoff && (
                        <>
                            <label>
                                {t('competitionCutoffPhase')}{' '}
                                <select name="cutoffAttempts">
                                    {allowed.map((amount) => (
                                        <option value={amount} key={amount}>
                                            {t('competitionBestOf', { count: amount })}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                {t(
                                    rules.scoring === 'time'
                                        ? 'competitionCutoffSeconds'
                                        : rules.scoring === 'moves'
                                          ? 'competitionCutoffMoves'
                                          : 'competitionCutoffPoints',
                                )}
                                <input
                                    type="number"
                                    name="threshold"
                                    min={
                                        rules.scoring === 'time'
                                            ? '0.01'
                                            : rules.scoring === 'moves'
                                              ? '1'
                                              : '0'
                                    }
                                    step={rules.scoring === 'time' ? '0.01' : '1'}
                                    required
                                />
                            </label>
                        </>
                    )}
                </>
            )}
            <button disabled={full}>{t('competitionAddRound')}</button>
            {full && <p>{t('competitionMaxRounds')}</p>}
        </form>
    );
}

function PlayRound({
    competition,
    round,
    prefs,
    t,
}: {
    competition: Competition;
    round: CompetitionRound;
    prefs: Preferences;
    t: T;
}) {
    const { rules } = competitionEvents.find(({ rules }) => rules.id === round.eventId)!;
    const [revealed, reveal] = useState(false);
    const [draft, setDraft] = useState<AttemptDraft>();
    const [penalty, setPenalty] = useState<'none' | '+2' | 'dnf'>('none');
    const [failed, fail] = useState('');
    const [busy, setBusy] = useState(false);
    const saving = useRef(false);
    async function accept(extra: boolean) {
        if (!draft || saving.current) return;
        saving.current = true;
        setBusy(true);
        fail('');
        try {
            await updateRound(competition.id, round, (current) =>
                extra ? nextExtra(current) : judgeAttempt(current, draft, penalty),
            );
        } catch (error) {
            fail(
                error instanceof Error && error.message === 'competitionChanged'
                    ? 'competitionChanged'
                    : 'storageError',
            );
        } finally {
            saving.current = false;
            setBusy(false);
        }
    }
    const limit = attemptLimit(round);
    return (
        <section className="stats-card">
            <h3>
                {t('competitionAttempt', { number: round.attempts.length + 1 })}
                {round.currentExtra !== undefined && ' · ' + t('competitionExtra')}
            </h3>
            {Number.isFinite(limit) && rules.scoring === 'time' && (
                <p>{t('competitionEffectiveLimit', { time: formatTime(limit) })}</p>
            )}
            {!revealed && !draft && (
                <button type="button" onClick={() => reveal(true)}>
                    {t(rules.scoring === 'moves' ? 'prepareModality' : 'competitionReveal')}
                </button>
            )}
            {revealed && !draft && (
                <CompetitionAttempt
                    rules={rules}
                    prefs={prefs}
                    limit={limit}
                    t={t}
                    scrambles={currentScrambles(round)}
                    finish={setDraft}
                />
            )}
            {draft && (
                <>
                    <p>{resultText(asSolve({ ...draft, scramble: [] }), t)}</p>
                    <div className="actions">
                        <label>
                            {t('competitionJudge')}{' '}
                            <select
                                value={penalty}
                                disabled={busy}
                                onChange={(e) => setPenalty(e.target.value as typeof penalty)}
                            >
                                <option value="none">{t('competitionNoPenalty')}</option>
                                {rules.scoring !== 'moves' && <option value="+2">+2</option>}
                                <option value="dnf">DNF</option>
                            </select>
                        </label>
                        <button type="button" disabled={busy} onClick={() => void accept(false)}>
                            {t('competitionRecord')}
                        </button>
                        <button
                            type="button"
                            disabled={busy || round.extrasUsed >= extraCount}
                            onClick={() => void accept(true)}
                        >
                            {t('competitionRepeat')}
                        </button>
                    </div>
                    <p>
                        {t('competitionExtrasRemaining', {
                            count: extraCount - round.extrasUsed,
                        })}
                    </p>
                </>
            )}
            {failed && <p role="alert">{t(failed)}</p>}
        </section>
    );
}

export function CompetitionView({
    initialId,
    prefs,
    t,
}: {
    initialId?: string;
    prefs: Preferences;
    t: T;
}) {
    const { competitions, failed } = useCompetitions();
    const [selected, select] = useState<string>();
    const [roundId, selectRound] = useState<string>();
    const [generation, setGeneration] = useState<{
        count: number;
        total: number;
    }>();
    const [notice, setNotice] = useState('');
    const request = useRef<AbortController>();
    const creating = useRef(false);
    useEffect(() => () => request.current?.abort(), []);
    const competition = competitions.find(({ id }) => id === (selected ?? initialId)) ?? competitions[0];
    const round = competition?.rounds.find(({ id }) => id === roundId) ?? competition?.rounds[0];

    async function create(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (creating.current || request.current) return;
        const form = event.currentTarget;
        const name = String(new FormData(form).get('name') ?? '').trim();
        if (!name) return;
        creating.current = true;
        setNotice('');
        try {
            const id = crypto.randomUUID();
            await db.competitions.add({
                id,
                name,
                createdAt: Date.now(),
                rulesRevision,
                rounds: [],
            });
            select(id);
            selectRound(undefined);
            form.reset();
        } catch {
            setNotice('storageError');
        } finally {
            creating.current = false;
        }
    }

    async function addRound(config: RoundConfig, event: Event) {
        if (!competition || request.current) return;
        const control = new AbortController();
        request.current = control;
        setNotice('');
        setGeneration({ count: 0, total: 0 });
        try {
            const mod = await registry[event.puzzleId]();
            const prepared = await prepareRound(
                config,
                event.rules,
                () => mod.generateScramble(config.eventId, control.signal),
                control.signal,
                (count, total) => setGeneration({ count, total }),
            );
            control.signal.throwIfAborted();
            await updateCompetition(competition.id, (current) => {
                control.signal.throwIfAborted();
                if (current.rounds.filter((item) => item.eventId === config.eventId).length >= 4)
                    throw new Error('competitionMaxRounds');
                return { ...current, rounds: [...current.rounds, prepared] };
            });
            selectRound(prepared.id);
        } catch (error) {
            if (!control.signal.aborted) {
                const key = error instanceof Error ? error.message : '';
                setNotice(
                    ['competitionMaxRounds', 'competitionChanged', 'competitionInvalid'].includes(key)
                        ? key
                        : 'competitionGenerateError',
                );
            }
        } finally {
            request.current = undefined;
            setGeneration(undefined);
        }
    }

    return (
        <div className="competition-page">
            <section className="stats-card">
                <h2>{t('competitionCreate')}</h2>
                <p>{t('competitionLocal')}</p>
                <form onSubmit={(e) => void create(e)}>
                    <label>
                        {t('competitionName')} <input name="name" required maxLength={100} />
                    </label>
                    <button disabled={!!generation}>{t('competitionCreate')}</button>
                </form>
                {!!competitions.length && (
                    <div className="competition-picker">
                        <label>
                            {t('competitionSelect')}{' '}
                            <select
                                value={competition?.id ?? ''}
                                disabled={!!generation}
                                onChange={(e) => {
                                    select(e.target.value);
                                    selectRound(undefined);
                                    setNotice('');
                                }}
                            >
                                {competitions.map(({ id, name }) => (
                                    <option value={id} key={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}
                {failed && <p role="alert">{t('storageError')}</p>}
            </section>
            {competition && (
                <section className="stats-card">
                    <h2>{t('competitionRounds')}</h2>
                    {generation ? (
                        <div className="actions">
                            <span role="status">
                                {generation.total ? t('modalityGenerating', generation) : t('aLoading')}
                            </span>
                            <button type="button" onClick={() => request.current?.abort()}>
                                {t('cancel')}
                            </button>
                        </div>
                    ) : (
                        <RoundForm
                            key={competition.id}
                            competition={competition}
                            t={t}
                            onCreate={addRound}
                        />
                    )}
                    {notice && <p role="alert">{t(notice)}</p>}
                    {!!competition.rounds.length && (
                        <div className="competition-picker">
                            <label>
                                {t('competitionRound')}{' '}
                                <select
                                    value={round?.id ?? ''}
                                    disabled={!!generation}
                                    onChange={(e) => selectRound(e.target.value)}
                                >
                                    {competition.rounds.map((item) => (
                                        <option value={item.id} key={item.id}>
                                            {t(item.eventId)} ·{' '}
                                            {t('competitionRoundNumber', {
                                                number: roundNumber(competition, item),
                                            })}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    )}
                </section>
            )}
            {competition && round && (
                <>
                    {roundStatus(round) === 'active' &&
                        (availableRound(competition, round) ? (
                            <PlayRound
                                key={round.id + '/' + round.attempts.length + '/' + round.extrasUsed}
                                competition={competition}
                                round={round}
                                prefs={prefs}
                                t={t}
                            />
                        ) : (
                            <p role="status">{t('competitionPriorRound')}</p>
                        ))}
                    <CompetitionResults competition={competition} round={round} t={t} />
                </>
            )}
        </div>
    );
}
