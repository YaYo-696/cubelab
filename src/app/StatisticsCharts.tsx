import { memo } from 'react';
import type { Solve } from '../core/storage/db';
import { formatTime } from '../core/timer/times';
import type { analyze } from '../core/stats';

export const StatisticsCharts = memo(function StatisticsCharts({
    stats,
    solves,
    t,
}: {
    stats: ReturnType<typeof analyze>;
    solves: readonly Solve[];
    t: (key: string) => string;
}) {
    const valid = stats.times.filter(Number.isFinite);
    if (!valid.length) return null;
    let min = Infinity,
        max = 0;
    for (const v of valid) {
        min = Math.min(min, v);
        max = Math.max(max, v);
    }
    const buckets = Array<number>(12).fill(0),
        step = Math.max(10, Math.ceil((max - min + 1) / 12 / 10) * 10);
    for (const v of valid) buckets[Math.floor((v - min) / step)]++;
    const peak = Math.max(...buckets);
    const first = solves[0].createdAt,
        last = solves.at(-1)!.createdAt;
    const x = (i: number) =>
        36 +
        550 *
            (last > first
                ? (solves[i].createdAt - first) / (last - first)
                : i / Math.max(1, solves.length - 1));
    const date = (value: number) => new Date(value).toLocaleDateString(document.documentElement.lang);

    const y = (v: number) => 150 - ((v - min) * 128) / Math.max(10, max - min);
    const stride = Math.max(1, Math.ceil(stats.times.length / 500));
    return (
        <div className="stats-charts">
            <figure>
                <figcaption>{t('trend')}</figcaption>
                <svg viewBox="0 0 620 185" role="img" aria-label={t('trend')}>
                    <path d="M36 12V150H590" fill="none" stroke="#9baeb7" />
                    <text x="37" y="12">
                        {formatTime(max)}
                    </text>
                    <text x="37" y="168">
                        {formatTime(min)}
                    </text>
                    <text x="590" y="168" textAnchor="end">
                        {date(last)}
                    </text>
                    {stats.results
                        .filter((r) => ['single', 'ao5', 'ao12'].includes(r.metric))
                        .map(({ metric, series }) => {
                            let path = '',
                                linked = false;
                            for (let i = 0; i < series.length; i++) {
                                const value = series[i];
                                if (value === null || !Number.isFinite(value)) {
                                    linked = false;
                                    continue;
                                }
                                if (i % stride !== 0 && i !== series.length - 1) continue;
                                path +=
                                    (linked && metric !== 'single' ? 'L' : 'M') +
                                    x(i).toFixed(1) +
                                    ' ' +
                                    y(value).toFixed(1);
                                if (metric === 'single') path += 'h1';
                                linked = true;
                            }
                            return (
                                <path
                                    key={metric}
                                    className={'chart-' + metric}
                                    d={path}
                                    fill="none"
                                    strokeWidth="2"
                                />
                            );
                        })}
                </svg>
                <div className="actions">
                    <span>{t('single')}</span>
                    <span className="legend-five">ao5</span>
                    <span className="legend-twelve">ao12</span>
                </div>
            </figure>
            <figure>
                <figcaption>{t('distribution')}</figcaption>
                <svg viewBox="0 0 620 185" role="img" aria-label={t('distribution')}>
                    <text x="12" y="17">
                        {peak}
                    </text>
                    <path d="M36 12V150H590" fill="none" stroke="#9baeb7" />
                    {buckets.map((count, i) => (
                        <rect
                            key={i}
                            x={38 + i * 46}
                            y={150 - (count / peak) * 125}
                            width="40"
                            height={(count / peak) * 125}
                            fill="#79d5b5"
                        >
                            <title>
                                {formatTime(min + i * step)} – {formatTime(min + (i + 1) * step - 10)} ·{' '}
                                {count}
                            </title>
                        </rect>
                    ))}
                    <text x="38" y="168">
                        {formatTime(min)}
                    </text>
                    <text x="520" y="168">
                        {formatTime(min + 12 * step)}
                    </text>
                </svg>
            </figure>
        </div>
    );
});
