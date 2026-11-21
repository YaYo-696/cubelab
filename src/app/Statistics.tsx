import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { liveQuery } from 'dexie';
import { db, solvesForEvent, type Session, type Solve } from '../core/storage/db';
import { attempts } from '../core/storage/attempts';
import { sessionActions } from '../core/storage/sessions';
import { exportBackup, exportCsv, importBackup } from '../core/storage/backup';
import { adjusted, breakdown, principal, type Metric } from '../core/stats';
import type { EventRules } from '../core/contracts';
import { formatTime } from '../core/timer/times';
import { StatisticsCharts } from './StatisticsCharts';
import { useStatistics } from './useStatistics';
import './statistics.css';

type T = (key: string, params?: Record<string, string | number>) => string;
function display(ms: number | null | undefined) {
    return ms == null ? '—' : ms === Infinity ? 'DNF' : formatTime(ms);
}
function download(text: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Statistics({ rules, puzzleId, t }: { rules: EventRules; puzzleId: string; t: T }) {
    const [data, setData] = useState<{ sessions: Session[]; event: Solve[] }>();
    const [sessionId, setSession] = useState(''),
        [destination, setDestination] = useState('');
    const [pbPages, setPbPages] = useState(1);
    const [selected, setSelected] = useState<string[]>([]),
        [page, setPage] = useState(0);
    const [notice, setNotice] = useState(''),
        [busy, setBusy] = useState(false),
        [deleted, setDeleted] = useState('');
    const [detail, setDetail] = useState<{ metric: Metric; solveId: string } | null>(null);
    useEffect(() => {
        const sub = liveQuery(() =>
            db.transaction('r', db.sessions, db.solves, async () => ({
                sessions: await db.sessions.where('eventId').equals(rules.id).toArray(),
                event: await solvesForEvent(rules.id),
            })),
        ).subscribe({ next: setData, error: () => setNotice('storageError') });
        return () => sub.unsubscribe();
    }, [rules.id]);
    const session =
        data?.sessions.find((s) => s.id === sessionId) ??
        data?.sessions.find((s) => s.archivedAt === undefined) ??
        data?.sessions[0];
    const id = session?.id;
    useEffect(() => {
        setSelected([]);
        setPage(0);
        setDetail(null);
        setDestination('');
    }, [id]);
    const input = useMemo(
        () =>
            data && id
                ? { event: data.event, session: data.event.filter((s) => s.sessionId === id) }
                : undefined,
        [data, id],
    );
    const computation = useStatistics(input, id);
    const solves = input?.session ?? [];
    const reverse = useMemo(() => [...solves].reverse(), [solves]);
    const maxPage = Math.max(0, Math.ceil(reverse.length / 25) - 1);
    const shown = Math.min(page, maxPage);
    const date = (s: Solve) => new Date(s.createdAt).toLocaleString(document.documentElement.lang);
    const label = (s: Session) => s.name || t('defaultSession');
    const target = data?.sessions.find(
        (s) => s.id === destination && s.id !== id && s.archivedAt === undefined,
    );
    async function action(fn: () => Promise<unknown>, success = '', failure = 'storageError') {
        setBusy(true);
        setNotice('');
        try {
            await fn();
            setNotice(success);
        } catch {
            setNotice(failure);
        } finally {
            setBusy(false);
        }
    }
    function named(event: FormEvent<HTMLFormElement>, rename: boolean) {
        event.preventDefault();
        const form = event.currentTarget;
        const name = String(new FormData(form).get('name') ?? '').trim();
        if (!name) return;
        void action(async () => {
            if (rename && id) await sessionActions.rename(id, name);
            else {
                const newId = await sessionActions.create(rules.id, puzzleId, name);
                setSession(newId);
                form.reset();
            }
        });
    }
    const endpoint = data?.event.find((s) => s.id === detail?.solveId);
    const detailSolves = endpoint ? data!.event.filter((s) => s.sessionId === endpoint.sessionId) : [];
    const detailIndex = detailSolves.findIndex((s) => s.id === endpoint?.id);
    const details =
        detail && detailIndex >= 0
            ? breakdown(detailSolves.slice(0, detailIndex + 1), detail.metric)
            : null;
    const main = principal(rules);
    const bestByEvent = useMemo(
        () => new Map(computation?.records.map((r) => [r.metric, r])),
        [computation],
    );
    const eventBest = (metric: Metric) => bestByEvent.get(metric);
    return (
        <div className="stats-page">
            <section className="stats-card">
                <h2>{t('sessionsTitle')}</h2>
                <label>
                    {t('session')}{' '}
                    <select value={id ?? ''} onChange={(e) => setSession(e.target.value)}>
                        {data?.sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {label(s)}
                                {s.archivedAt !== undefined ? ' · ' + t('archived') : ''}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="session-forms">
                    <form onSubmit={(e) => named(e, false)}>
                        <label>
                            {t('newName')} <input name="name" required maxLength={100} />
                        </label>
                        <button disabled={busy}>{t('createSession')}</button>
                    </form>
                    {session && (
                        <form key={id} onSubmit={(e) => named(e, true)}>
                            <label>
                                {t('rename')}{' '}
                                <input
                                    name="name"
                                    required
                                    maxLength={100}
                                    defaultValue={label(session)}
                                />
                            </label>
                            <button disabled={busy}>{t('rename')}</button>
                        </form>
                    )}
                </div>
                {session && (
                    <div className="actions">
                        <button
                            disabled={busy}
                            onClick={() => {
                                const archive = session.archivedAt === undefined;
                                if (!archive || window.confirm(t('confirmArchive')))
                                    void action(() => sessionActions.archive(session.id, archive));
                            }}
                        >
                            {t(session.archivedAt === undefined ? 'archive' : 'restore')}
                        </button>
                        <label>
                            {t('destination')}{' '}
                            <select value={destination} onChange={(e) => setDestination(e.target.value)}>
                                <option value="">{t('choose')}</option>
                                {data?.sessions
                                    .filter((s) => s.id !== id && s.archivedAt === undefined)
                                    .map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {label(s)}
                                        </option>
                                    ))}
                            </select>
                        </label>
                        <button
                            disabled={!target || busy}
                            onClick={() => {
                                if (target && window.confirm(t('confirmMerge')))
                                    void action(async () => {
                                        await sessionActions.merge(session.id, target.id);
                                        setSession(target.id);
                                    });
                            }}
                        >
                            {t('merge')}
                        </button>
                        <button
                            disabled={!target || !selected.length || busy}
                            onClick={() => {
                                if (target && window.confirm(t('confirmMove')))
                                    void action(async () => {
                                        await sessionActions.move(session.id, target.id, selected);
                                        setSelected([]);
                                    });
                            }}
                        >
                            {t('move')}
                        </button>
                    </div>
                )}
            </section>
            <section className="stats-card">
                <h2>{t('summary')}</h2>
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
                        {computation?.stats.results.map((r) => (
                            <tr key={r.metric} className={main === r.metric ? 'main-metric' : undefined}>
                                <th scope="row">
                                    {t(r.metric)}
                                    {main === r.metric && rules.officialFormats.includes('bo5')
                                        ? ' · Bo5'
                                        : ''}
                                    {rules.officialFormats.includes('bo5') &&
                                        ['ao5', 'mo3'].includes(r.metric) && (
                                            <small> · {t('informational')}</small>
                                        )}
                                </th>
                                <td data-testid={'current-' + r.metric}>
                                    {r.current !== null && ['ao5', 'ao12'].includes(r.metric) ? (
                                        <button
                                            onClick={() =>
                                                setDetail({
                                                    metric: r.metric,
                                                    solveId: solves.at(-1)!.id,
                                                })
                                            }
                                        >
                                            {display(r.current)}
                                        </button>
                                    ) : (
                                        display(r.current)
                                    )}
                                </td>
                                <td>
                                    {r.best && ['ao5', 'ao12'].includes(r.metric) ? (
                                        <button
                                            onClick={() =>
                                                setDetail({
                                                    metric: r.metric,
                                                    solveId: solves[r.best!.end].id,
                                                })
                                            }
                                        >
                                            {display(r.best.value)}
                                        </button>
                                    ) : (
                                        display(r.best?.value)
                                    )}
                                </td>
                                <td>
                                    {eventBest(r.metric) && ['ao5', 'ao12'].includes(r.metric) ? (
                                        <button
                                            onClick={() =>
                                                setDetail({
                                                    metric: r.metric,
                                                    solveId: eventBest(r.metric)!.solve.id,
                                                })
                                            }
                                        >
                                            {display(eventBest(r.metric)?.value)}
                                        </button>
                                    ) : (
                                        display(eventBest(r.metric)?.value)
                                    )}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <th scope="row">{t('sessionMean')}</th>
                            <td>{display(computation?.stats.mean)}</td>
                            <td>—</td>
                            <td>—</td>
                        </tr>
                    </tbody>
                </table>
                {details && (
                    <section className="stats-breakdown">
                        <h3>
                            {t(detail!.metric)} · {display(details.value)}
                        </h3>
                        <button onClick={() => setDetail(null)}>{t('close')}</button>
                        <ol>
                            {details.rows.map((row) => (
                                <li key={row.solve.id}>
                                    {row.discarded ? '(' + display(row.value) + ')' : display(row.value)}
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
                {computation && <StatisticsCharts stats={computation.stats} solves={solves} t={t} />}
                {computation && (
                    <details>
                        <summary>{t('pbHistory')}</summary>
                        <ol>
                            {computation.records
                                .slice()
                                .reverse()
                                .slice(0, pbPages * 25)
                                .map((r) => (
                                    <li key={r.metric + r.solve.id}>
                                        {t(r.metric)} · {display(r.value)} · {date(r.solve)}
                                    </li>
                                ))}
                        </ol>
                        {computation.records.length > pbPages * 25 && (
                            <button onClick={() => setPbPages((p) => p + 1)}>{t('more')}</button>
                        )}
                    </details>
                )}
            </section>
            <section className="stats-card">
                <h2>{t('history')}</h2>
                {deleted && (
                    <button
                        disabled={busy}
                        onClick={() =>
                            void action(async () => {
                                await attempts.edit(deleted, { deletedAt: undefined });
                                setDeleted('');
                            })
                        }
                    >
                        {t('undo')}
                    </button>
                )}
                {reverse.slice(shown * 25, shown * 25 + 25).map((s) => (
                    <details key={s.id} data-testid="history-solve">
                        <summary>
                            <strong>
                                {display(adjusted(s))}
                                {s.penalty === '+2' ? ' (+2)' : ''}
                            </strong>{' '}
                            · {date(s)}
                        </summary>
                        <p>{s.scramble}</p>
                        <p>
                            {t('penalty')} ·{' '}
                            {s.penalty === 'none' ? t('none') : s.penalty === 'dnf' ? 'DNF' : '+2'}
                        </p>
                        <label>
                            <input
                                type="checkbox"
                                checked={selected.includes(s.id)}
                                onChange={(e) =>
                                    setSelected((ids) =>
                                        e.target.checked
                                            ? [...ids, s.id]
                                            : ids.filter((v) => v !== s.id),
                                    )
                                }
                            />{' '}
                            {t('selectSolve')}
                        </label>
                        <div className="actions">
                            <button
                                disabled={busy}
                                aria-pressed={s.penalty === '+2'}
                                onClick={() =>
                                    void action(() =>
                                        attempts.edit(s.id, {
                                            penalty: s.penalty === '+2' ? 'none' : '+2',
                                        }),
                                    )
                                }
                            >
                                +2
                            </button>
                            <button
                                disabled={busy}
                                aria-pressed={s.penalty === 'dnf'}
                                onClick={() =>
                                    void action(() =>
                                        attempts.edit(s.id, {
                                            penalty: s.penalty === 'dnf' ? 'none' : 'dnf',
                                        }),
                                    )
                                }
                            >
                                DNF
                            </button>
                            <button
                                disabled={busy}
                                onClick={() =>
                                    void action(
                                        () => navigator.clipboard.writeText(s.scramble),
                                        'copied',
                                        'copyFailed',
                                    )
                                }
                            >
                                {t('copy')}
                            </button>
                            <button
                                disabled={busy}
                                onClick={() => {
                                    if (window.confirm(t('confirmDelete')))
                                        void action(async () => {
                                            await attempts.edit(s.id, { deletedAt: Date.now() });
                                            setDeleted(s.id);
                                            setSelected((ids) => ids.filter((v) => v !== s.id));
                                        });
                                }}
                            >
                                {t('deleteSolve')}
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const comment = String(
                                    new FormData(e.currentTarget).get('comment') ?? '',
                                ).trim();
                                void action(() => attempts.edit(s.id, { comment }));
                            }}
                        >
                            <label>
                                {t('comment')} <input name="comment" defaultValue={s.comment ?? ''} />
                            </label>
                            <button disabled={busy}>{t('saveComment')}</button>
                        </form>
                    </details>
                ))}
                {!reverse.length && <p>{t('noTimes')}</p>}
                <div className="actions">
                    <button disabled={shown === 0} onClick={() => setPage(shown - 1)}>
                        {t('previous')}
                    </button>
                    <span>
                        {shown + 1} / {maxPage + 1}
                    </span>
                    <button disabled={shown >= maxPage} onClick={() => setPage(shown + 1)}>
                        {t('nextPage')}
                    </button>
                </div>
            </section>
            <section className="stats-card">
                <h2>{t('backup')}</h2>
                <div className="actions">
                    <button
                        disabled={busy}
                        onClick={() =>
                            void action(async () =>
                                download(await exportBackup(), 'cubelab.json', 'application/json'),
                            )
                        }
                    >
                        {' '}
                        {t('exportJson')}
                    </button>
                    <button
                        disabled={busy}
                        onClick={() =>
                            void action(async () =>
                                download(await exportCsv(), 'cubelab.csv', 'text/csv;charset=utf-8'),
                            )
                        }
                    >
                        {t('exportCsv')}
                    </button>
                    <label>
                        {t('importJson')}{' '}
                        <input
                            type="file"
                            accept=".json,application/json"
                            disabled={busy}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                if (file)
                                    void action(
                                        async () => importBackup(await file.text()),
                                        'imported',
                                        'invalidBackup',
                                    );
                            }}
                        />
                    </label>
                </div>
            </section>
            {notice && (
                <p className="stats-notice" role="status">
                    {t(notice)}
                </p>
            )}
        </div>
    );
}
