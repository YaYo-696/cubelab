import { db, type CubeDatabase } from '../storage/db';
import {
    fresh,
    keyFor,
    reviewCase,
    type CaseKey,
    type TrainerAttempt,
    type TrainerStatus,
} from './model';

export function saveTrainingAttempt(attempt: TrainerAttempt, targetMs: number, database = db) {
    return database.transaction('rw', database.trainerCases, database.trainerAttempts, async () => {
        if (await database.trainerAttempts.get(attempt.id)) return;
        const id = keyFor(attempt);
        const prior = (await database.trainerCases.get(id)) ?? fresh(attempt);
        await database.trainerAttempts.add(attempt);
        await database.trainerCases.put(reviewCase(prior, attempt, targetMs));
    });
}
export function setTrainingStatus(key: CaseKey, status: TrainerStatus, database = db) {
    return database.transaction('rw', database.trainerCases, async () => {
        const prior = (await database.trainerCases.get(keyFor(key))) ?? fresh(key);
        const intervalDays = status === 'learned' ? Math.max(prior.intervalDays ?? 0, 1) : 0;
        await database.trainerCases.put({
            ...prior,
            status,
            intervalDays,
            streak: 0,
            dueAt: intervalDays ? Date.now() + intervalDays * 86400000 : 0,
        });
    });
}
export function trainingCases(database: CubeDatabase, puzzle: string, set?: string) {
    return database.trainerCases
        .where(set ? { puzzleId: puzzle, setId: set } : { puzzleId: puzzle })
        .toArray();
}
