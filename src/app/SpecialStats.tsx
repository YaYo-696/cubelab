import { useMemo, useState } from 'react';
import type { Solve } from '../core/storage/db';
import { fmcStats, moveText, resultText } from '../core/events/results';
import { compareMultiBlind, rankedMultiBlind } from '../core/events/multiBlind';
import type { T } from './App';

export function SpecialStats({
    kind,
    session,
    event,
    t,
}: {
    kind: 'moves' | 'multiBlind';
    session: readonly Solve[];
    event: readonly Solve[];
    t: T;
}) {
    const [limit, setLimit] = useState(25);
    const ranking = useMemo(
        () => (kind === 'multiBlind' ? rankedMultiBlind(event) : []),
        [event, kind],
    );
    const current = useMemo(
        () => (kind === 'moves' ? fmcStats(session) : undefined),
        [session, kind],
    );
    const all = useMemo(() => (kind === 'moves' ? fmcStats(event) : undefined), [event, kind]);
    const result = (row: Solve | undefined) => (row ? resultText(row, t) : '—');
    let rank = 0;

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>{t('metric')}</th>
                        <th>{t('current')}</th>
                        <th>{t('bestSession')}</th>
                        <th>{t('bestEvent')}</th>
                    </tr>
                </thead>
                <tbody>
                    {current ? (
                        <>
                            <tr>
                                <th scope="row">{t('single')}</th>
                                <td>{moveText(current.latest, t)}</td>
                                <td>{moveText(current.best, t)}</td>
                                <td>{moveText(all?.best, t)}</td>
                            </tr>
                            <tr className="main-metric">
                                <th scope="row">{t('mo3')}</th>
                                <td>{moveText(current.mean, t)}</td>
                                <td>{moveText(current.bestMean, t)}</td>
                                <td>{moveText(all?.bestMean, t)}</td>
                            </tr>
                        </>
                    ) : (
                        <tr className="main-metric">
                            <th scope="row">{t('multiPointsLabel')}</th>
                            <td>{result(session.at(-1))}</td>
                            <td>
                                {result(
                                    ranking.find(
                                        (entry) => entry.solve.sessionId === session[0]?.sessionId,
                                    )?.solve,
                                )}
                            </td>
                            <td>{result(ranking[0]?.solve)}</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {ranking.length > 0 && (
                <details>
                    <summary>{t('multiRanking')}</summary>
                    <ol>
                        {ranking.slice(0, limit).map(({ solve, result: raw }, i) => {
                            if (i === 0 || compareMultiBlind(ranking[i - 1].result, raw) !== 0)
                                rank = i + 1;
                            return (
                                <li value={rank} key={solve.id}>
                                    {result(solve)}
                                </li>
                            );
                        })}
                    </ol>
                    {limit < ranking.length && (
                        <button type="button" onClick={() => setLimit(limit + 25)}>
                            {t('more')}
                        </button>
                    )}
                </details>
            )}
        </>
    );
}
