import type { TrainerCase, TrainerAttempt } from '../trainer/model';
import type { EvaluationAttempt } from '../academy/evaluation';
import Dexie, { type Table } from 'dexie';
export interface Session {
    id: string;
    eventId: string;
    puzzleId: string;
    name: string;
    createdAt: number;
    archivedAt?: number;
}
type Result =
    | {
          kind: 'time';
          timeMs: number;
      }
    | {
          kind: 'moves';
          moves: number;
      }
    | {
          kind: 'multiBlind';
          solved: number;
          attempted: number;
          timeMs: number;
      };
export interface Solve {
    id: string;
    sessionId: string;
    puzzleId: string;
    eventId: string;
    createdAt: number;
    scramble: string;
    result: Result;
    penalty: 'none' | '+2' | 'dnf';
    source: 'manual' | 'timer' | 'smartcube' | 'stackmat';
    deletedAt?: number;
    comment?: string;
    splitsMs?: number[];
    reconstruction?: string;
}
interface LessonProgress {
    courseId: string;
    lessonId: string;
    revision: number;
    completedAt?: number;
    quizScore?: number;
}
interface CompetitionRound {
    id: string;
    eventId: string;
    createdAt: number;
    rulesRevision: string;
    format: string;
    cutoffMs?: number;
    timeLimitMs?: number;
    scrambles: string[];
    solveIds: string[];
}
export class CubeDatabase extends Dexie {
    evaluations!: Table<EvaluationAttempt, string>;
    sessions!: Table<Session, string>;
    solves!: Table<Solve, string>;
    trainerAttempts!: Table<TrainerAttempt, string>;
    trainerCases!: Table<TrainerCase, [string, string, string]>;
    lessons!: Table<LessonProgress, [string, string]>;
    rounds!: Table<CompetitionRound, string>;
    settings!: Table<
        {
            key: string;
            value: string;
        },
        string
    >;
    constructor(name = 'cubelab') {
        super(name);
        this.version(1).stores({
            sessions: 'id,eventId',
            solves: 'id,[sessionId+createdAt],[eventId+createdAt]',
            trainerCases: '[puzzleId+setId+caseId],dueAt',
            lessons: '[courseId+lessonId]',
            rounds: 'id,[eventId+createdAt]',
            settings: 'key',
        });
        this.version(2).stores({ evaluations: 'id,[puzzleId+createdAt]' });
        this.version(3).stores({
            trainerCases: '[puzzleId+setId+caseId],dueAt,puzzleId,[puzzleId+setId]',
            trainerAttempts: 'id,[puzzleId+setId+createdAt]',
        });
    }
}
export const db = new CubeDatabase();
export function solvesForEvent(eventId: string) {
    return db.solves
        .where('[eventId+createdAt]')
        .between([eventId, Dexie.minKey], [eventId, Dexie.maxKey])
        .filter((s) => s.deletedAt === undefined)
        .toArray();
}
