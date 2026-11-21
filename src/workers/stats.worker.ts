import { analyze, eventRecords } from '../core/stats';
import type { Solve } from '../core/storage/db';
export type StatsRequest = { session: Solve[]; event: Solve[] };
export type StatsResponse = {
    stats: ReturnType<typeof analyze>;
    records: ReturnType<typeof eventRecords>;
    ms: number;
};
self.onmessage = ({ data }: { data: StatsRequest }) => {
    const start = performance.now();
    const stats = analyze(data.session),
        records = eventRecords(data.event);
    self.postMessage({ stats, records, ms: performance.now() - start } satisfies StatsResponse);
};
