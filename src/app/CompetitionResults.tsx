import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import {
    asSolve,
    attemptCount,
    attemptLimit,
    roundResults,
    roundStatus,
    type Competition,
    type CompetitionRound,
    type RoundAttempt,
} from '../core/competition/round';
import { resultText, moveText, wholeSeconds } from '../core/events/results';
import { db } from '../core/storage/db';
import { formatTime } from '../core/timer/times';
import type { T } from './App';

const recordedTime = (ms: number) => (ms >= 600_000 ? wholeSeconds(ms) : formatTime(ms));

function displayResult(row: RoundAttempt | undefined, t: T, showDnfTime = false) {
    if (!row) return '—';
    if (row.dns) return 'DNS';
    if (row.result.kind !== 'time') return resultText(asSolve(row), t);
    if (row.dnf) return showDnfTime ? 'DNF (' + recordedTime(row.elapsedMs) + ')' : 'DNF';
    const text = recordedTime(row.result.timeMs + row.additions * 2000);
    return row.additions ? text + ' (+' + 2 * row.additions + ')' : text;
}

export function formatRound(format: CompetitionRound['format'], t: T) {
    return t(format === 'mo3' || format === 'ao5' ? format : 'competitionBestOf', {
        count: attemptCount[format],
    });
}

function download(name: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function cutoffText(round: CompetitionRound, t: T) {
    if (!round.cutoff) return '—';
    const threshold =
        round.eventId === '333fm'
            ? moveText(round.cutoff.threshold, t)
            : round.cubes
              ? t('competitionPoints', { count: round.cutoff.threshold })
              : formatTime(round.cutoff.threshold);
    return (
        (round.cubes ? '> ' : '< ') +
        threshold +
        ' · ' +
        t('competitionBestOf', { count: round.cutoff.attempts })
    );
}

export function CompetitionResults({
    competition,
    round,
    t,
}: {
    competition: Competition;
    round: CompetitionRound;
    t: T;
}) {
    const { attempts, best, average } = roundResults(round);
    const bestText = displayResult(best, t);
    const averageText =
        round.eventId === '333fm'
            ? moveText(average, t)
            : average === undefined
              ? '—'
              : average === Infinity
                ? 'DNF'
                : recordedTime(average);
    const status = roundStatus(round);
    const format = formatRound(round.format, t);
    const cells = Array.from({ length: attemptCount[round.format] }, (_, index) =>
        displayResult(attempts[index], t, round.cumulativeMs !== undefined),
    );
    function exportSheet(type: 'csv' | 'json') {
        if (type === 'json') {
            download(
                'cubelab-round.json',
                JSON.stringify(
                    {
                        version: 1,
                        competition: {
                            id: competition.id,
                            name: competition.name,
                            rulesRevision: competition.rulesRevision,
                        },
                        round: {
                            id: round.id,
                            eventId: round.eventId,
                            format: round.format,
                            status,
                            cutoff: round.cutoff,
                            timeLimitMs: round.timeLimitMs,
                            cumulativeMs: round.cumulativeMs,
                            attempts: cells.map((value, index) => ({
                                number: index + 1,
                                result: value === '—' ? null : value,
                                attempt: attempts[index],
                            })),
                            best: bestText === '—' ? null : bestText,
                            average: averageText === '—' ? null : averageText,
                        },
                    },
                    null,
                    2,
                ),
                'application/json',
            );
            return;
        }
        const rows = [
            [
                t('competition'),
                t('event'),
                t('competitionRound'),
                t('competitionFormat'),
                t('competitionStatus'),
                ...cells.map((_, i) => t('competitionAttempt', { number: i + 1 })),
                t('competitionBest'),
                t('competitionAverage'),
            ],
            [
                competition.name,
                t(round.eventId),
                roundNumber(competition, round),
                format,
                t('competitionState_' + status),
                ...cells,
                bestText,
                averageText,
            ],
        ];
        const csv = rows
            .map((row) =>
                row
                    .map((value) => {
                        const text = String(value);
                        return (
                            '"' +
                            (/^[\s]*[=+\-@\t\r]/.test(text) ? "'" : '') +
                            text.replaceAll('"', '""') +
                            '"'
                        );
                    })
                    .join(','),
            )
            .join('\r\n');
        download('cubelab-round.csv', csv, 'text/csv;charset=utf-8');
    }
    return (
        <section className="stats-card">
            <h3>{t('competitionSheet')}</h3>
            <p>
                {competition.name} · {t(round.eventId)} ·{' '}
                {t('competitionRoundNumber', {
                    number: roundNumber(competition, round),
                })}{' '}
                · {format}
            </p>
            <p role="status" data-testid="competition-round-status">
                {t('competitionState_' + status)}
            </p>
            <dl className="competition-rules">
                <div>
                    <dt>{t('competitionCutoff')}</dt>
                    <dd>{cutoffText(round, t)}</dd>
                </div>
                <div>
                    <dt>{t('competitionTimeLimit')}</dt>
                    <dd>
                        {round.cubes
                            ? t('competitionMultiLimit')
                            : round.eventId === '333fm'
                              ? wholeSeconds(attemptLimit(round))
                              : round.timeLimitMs
                                ? formatTime(round.timeLimitMs)
                                : '—'}
                    </dd>
                </div>
                <div>
                    <dt>{t('competitionCumulative')}</dt>
                    <dd>{round.cumulativeMs ? formatTime(round.cumulativeMs) : '—'}</dd>
                </div>
            </dl>
            <div className="competition-table">
                <table>
                    <thead>
                        <tr>
                            {cells.map((_, i) => (
                                <th scope="col" key={i}>
                                    {t('competitionAttempt', { number: i + 1 })}
                                </th>
                            ))}
                            <th scope="col">{t('competitionBest')}</th>
                            <th scope="col">{t('competitionAverage')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {cells.map((value, index) => (
                                <td data-testid="competition-attempt-result" key={index}>
                                    {value}
                                </td>
                            ))}
                            <td data-testid="competition-best">{bestText}</td>
                            <td data-testid="competition-average">{averageText}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="actions">
                <button type="button" onClick={() => exportSheet('csv')}>
                    {t('exportCsv')}
                </button>
                <button type="button" onClick={() => exportSheet('json')}>
                    {t('exportJson')}
                </button>
            </div>
        </section>
    );
}

export function roundNumber(competition: Competition, round: CompetitionRound) {
    return (
        competition.rounds
            .filter(({ eventId }) => eventId === round.eventId)
            .findIndex(({ id }) => id === round.id) + 1
    );
}
export function useCompetitions() {
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        const subscription = liveQuery(() =>
            db.competitions.orderBy('createdAt').reverse().toArray(),
        ).subscribe({ next: setCompetitions, error: () => setFailed(true) });
        return () => subscription.unsubscribe();
    }, []);
    return { competitions, failed };
}

export function CompetitionStatistics({ eventId, t }: { eventId: string; t: T }) {
    const { competitions, failed } = useCompetitions();
    const entries = competitions.flatMap((competition) =>
        competition.rounds
            .filter((round) => round.eventId === eventId && round.attempts.length)
            .map((round) => ({ competition, round })),
    );
    return (
        <section className="stats-card">
            {failed && <p role="alert">{t('storageError')}</p>}
            {entries.length ? (
                entries.map(({ competition, round }) => (
                    <CompetitionResults key={round.id} competition={competition} round={round} t={t} />
                ))
            ) : (
                <p>{t('competitionNoResults')}</p>
            )}
        </section>
    );
}
