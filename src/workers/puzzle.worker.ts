import { generate } from './generate';
import { generateCase } from './case';
import type { CubeId } from '../puzzles/events';
export type Job = {
    id: number;
    kind: 'scramble' | 'case';
    puzzle: CubeId;
    input: string;
};
self.onmessage = async ({ data }: {
    data: Job;
}) => {
    const { id, kind, puzzle, input } = data;
    try {
        const signal = new AbortController().signal;
        const result = await (kind === 'scramble' ? generate(puzzle, input, signal) : generateCase(puzzle, input, signal));
        self.postMessage({ id, result });
    }
    catch (e) {
        self.postMessage({ id, error: e instanceof Error ? e.message : String(e) });
    }
};
