import 'fake-indexeddb/auto';
import { expect, it, vi } from 'vitest';
import { cubeEvent, bigCubeEvent, modality, tetraEvent } from '../../src/puzzles/events';
import { TimerMachine } from '../../src/core/timer/machine';
import {
    attemptCount,
    attemptLimit,
    currentScrambles,
    cutoffOptions,
    judgeAttempt,
    nextExtra,
    prepareRound,
    remainingTime,
    roundResults,
    roundStatus,
    rulesRevision,
    validConfig,
    type Competition,
    type CompetitionRound,
    type RoundAttempt,
    type RoundConfig,
} from '../../src/core/competition/round';
import { availableRound, updateRound } from '../../src/core/competition/storage';
import { exportBackup, importBackup } from '../../src/core/storage/backup';
import { CubeDatabase } from '../../src/core/storage/db';
import type { EventRules } from '../../src/core/contracts';

const rules = cubeEvent('333');
const config = { eventId: '333', format: 'ao5', timeLimitMs: 600_000 } as const;
const signal = new AbortController().signal;
function timed(timeMs: number, dnf = false, additions = 0): Omit<RoundAttempt, 'scramble'> {
    return {
        result: { kind: 'time', timeMs },
        elapsedMs: timeMs,
        additions,
        dnf,
    };
}
async function prepared(settings: RoundConfig = config, event: EventRules = rules) {
    let calls = 0;
    return prepareRound(
        settings,
        event,
        async () => 'mix-' + ++calls,
        signal,
        () => {},
    );
}
function record(round: CompetitionRound, ...times: number[]) {
    return times.reduce((current, time) => judgeAttempt(current, timed(time), 'none'), round);
}

it('uses only the round and cutoff formats defined for each WCA event', () => {
    expect(attemptCount).toEqual({
        ao5: 5,
        mo3: 3,
        bo1: 1,
        bo2: 2,
        bo3: 3,
        bo5: 5,
    });
    expect(cutoffOptions('ao5', 'time')).toEqual([2]);
    expect(cutoffOptions('mo3', 'time')).toEqual([1]);
    expect(cutoffOptions('bo5', 'time')).toEqual([]);
    expect(cutoffOptions('bo3', 'time')).toEqual([]);
    expect(cutoffOptions('bo2', 'moves')).toEqual([1]);
    expect(cutoffOptions('mo3', 'moves')).toEqual([1, 2]);
    expect(cutoffOptions('bo1', 'multiBlind')).toEqual([]);
    expect(cutoffOptions('bo3', 'multiBlind')).toEqual([1, 2]);
    expect(validConfig({ ...config, format: 'mo3' }, rules)).toBe(false);
    expect(validConfig({ ...config, eventId: '666', format: 'mo3' }, bigCubeEvent('666'))).toBe(true);
    expect(validConfig({ ...config, eventId: 'pyramduo' }, tetraEvent('pyramduo'))).toBe(false);
    expect(validConfig({ ...config, cumulativeMs: 10_000 }, rules)).toBe(false);
});

it('applies a strictly better cutoff, preserves the two attempts and trims Ao5', async () => {
    const round = await prepared({
        ...config,
        cutoff: { attempts: 2, threshold: 12_000 },
    });
    let blocked = record(round, 12000, 13000);
    expect(roundStatus(blocked)).toBe('cutoff');
    expect(roundResults(blocked).average).toBeUndefined();
    expect(currentScrambles(blocked)).toEqual([]);
    expect(() => judgeAttempt(blocked, timed(1000), 'none')).toThrow();
    blocked = judgeAttempt(record(round, 13500), timed(10000), '+2');
    expect(roundStatus(blocked)).toBe('cutoff');
    const complete = record(round, 11990, 15000, 16000, 17000, 18000);
    expect(roundStatus(complete)).toBe('complete');
    expect(roundResults(complete).average).toBe(16000);
    expect(roundResults(complete).best?.elapsedMs).toBe(11990);
});

it('uses adjusted results and raw DNF time for the cumulative limit and marks eligible DNS', async () => {
    let round = await prepared({
        ...config,
        timeLimitMs: 15_000,
        cumulativeMs: 23_000,
    });
    round = judgeAttempt(round, timed(7000, false, 1), '+2');
    expect(remainingTime(round)).toBe(12_000);
    expect(attemptLimit(round)).toBe(12_000);
    round = judgeAttempt(round, timed(10_000), '+2');
    expect(round.attempts[1].dnf).toBe(true);
    expect(remainingTime(round)).toBe(2_000);
    round = record(round, 2_000);
    expect(round.attempts[2].dnf).toBe(true);
    expect(roundStatus(round)).toBe('limit');
    expect(roundResults(round).attempts.map((attempt) => !!attempt.dns)).toEqual([
        false,
        false,
        false,
        true,
        true,
    ]);
    expect(roundResults(round).average).toBe(Infinity);
});

it('prepares two unique extras, replaces the same slot and keeps later mixes concealed', async () => {
    const progress = vi.fn();
    const source = ['A', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const mix = vi.fn(async () => source.shift()!);
    let round = await prepareRound(config, rules, mix, signal, progress);
    expect(mix).toHaveBeenCalledTimes(8);
    expect(progress).toHaveBeenLastCalledWith(7, 7);
    expect(currentScrambles(round)).toEqual(['A']);
    round = nextExtra(round);
    expect(currentScrambles(round)).toEqual(['F']);
    round = nextExtra(round);
    expect(currentScrambles(round)).toEqual(['G']);
    expect(() => nextExtra(round)).toThrow('competitionNoExtra');
    round = record(round, 9999);
    expect(round.attempts.map((attempt) => attempt.scramble)).toEqual([['G']]);
    expect(round.attempts).toHaveLength(1);
    expect(currentScrambles(round)).toEqual(['B']);
});

it('retains FMC Mo3 and scores Multi-Blind through its time cap', async () => {
    let fmc = await prepared({ eventId: '333fm', format: 'mo3' }, modality('333fm'));
    for (const moves of [24, 25, 26])
        fmc = judgeAttempt(
            fmc,
            {
                result: { kind: 'moves', moves },
                elapsedMs: 1000,
                additions: 0,
                dnf: false,
            },
            'none',
        );
    expect(roundResults(fmc).average).toBe(25);
    let batch = await prepared(
        {
            eventId: '333mbf',
            format: 'bo2',
            cubes: [2, 3],
            cutoff: { attempts: 1, threshold: 1 },
        },
        modality('333mbf'),
    );
    expect(batch.scrambles.map((mixes) => mixes.length)).toEqual([2, 3, 3, 3]);
    expect(attemptLimit(batch)).toBe(1_200_000);
    batch = judgeAttempt(
        batch,
        {
            result: {
                kind: 'multiBlind',
                attempted: 2,
                solved: 2,
                timeMs: 1_200_000,
            },
            elapsedMs: 1_200_000,
            additions: 0,
            dnf: false,
        },
        'none',
    );
    expect(roundStatus(batch)).toBe('active');
    expect(roundResults(batch).best?.dnf).toBe(false);
    expect(attemptLimit(batch)).toBe(1_800_000);
});

it('automatically judges the inspection and stop boundaries for competition only', () => {
    let time = 0;
    const timer = new TimerMachine(() => time);
    timer.down('key', rules, true, 0);
    timer.up('key');
    time = 15_000;
    expect(timer.penalty(time)).toBe('+2');
    expect(timer.enforceCompetitionLimit(500)).toBeUndefined();
    time = 17_000;
    expect(timer.enforceCompetitionLimit(500)).toEqual({
        timeMs: 0,
        penalty: 'dnf',
    });
    timer.saved();
    timer.down('key', rules, false, 0);
    timer.up('key');
    time += 500;
    expect(timer.enforceCompetitionLimit(500)).toEqual({
        timeMs: 500,
        penalty: 'dnf',
    });
});

it('keeps competitions separate, rejects stale writes and round-trips a v4 backup', async () => {
    const database = new CubeDatabase('competition-source');
    const restored = new CubeDatabase('competition-restored');
    try {
        const first = await prepared(),
            second = await prepared();
        const competition: Competition = {
            id: crypto.randomUUID(),
            name: 'Local',
            createdAt: 1,
            rulesRevision,
            rounds: [first, second],
        };
        await database.competitions.add(competition);
        expect(availableRound(competition, second)).toBe(false);
        await expect(
            updateRound(competition.id, second, (round) => record(round, 10000), database),
        ).rejects.toThrow('competitionChanged');
        await updateRound(competition.id, first, (round) => nextExtra(round), database);
        await expect(
            updateRound(competition.id, first, (round) => record(round, 10000), database),
        ).rejects.toThrow('competitionChanged');
        const current = (await database.competitions.get(competition.id))!.rounds[0];
        await updateRound(competition.id, current, (round) => record(round, 10000), database);
        expect(await database.solves.count()).toBe(0);
        const file = await exportBackup(database);
        await importBackup(file, restored);
        expect(await restored.competitions.toArray()).toEqual(await database.competitions.toArray());
        const invalid = JSON.parse(file);
        invalid.tables.competitions[0].rounds[0].attempts[0].scramble = ['future'];
        await expect(importBackup(JSON.stringify(invalid), restored)).rejects.toThrow('invalidBackup');
        const legacy = JSON.parse(file);
        legacy.version = 3;
        delete legacy.tables.competitions;
        await expect(importBackup(JSON.stringify(legacy), restored)).resolves.toBeUndefined();
    } finally {
        await Promise.all([database.delete(), restored.delete()]);
    }
});
