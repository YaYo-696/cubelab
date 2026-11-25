import type { ColorJob, ColorReply } from './fromColorsClient';

self.addEventListener('message', async ({ data }: MessageEvent<ColorJob>) => {
    try {
        // Keep cubing.js's search chunks independent of this entry point's message listener.
        const { readColorJob } = await import('./fromColorsJobs');
        self.postMessage({ result: await readColorJob(data) } satisfies ColorReply);
    } catch (error) {
        console.error('CubeLab color worker', error);
        self.postMessage({ error: error instanceof Error ? error.message : String(error) } satisfies ColorReply);
    }
});
