import type { ComponentType, LazyExoticComponent } from 'react';
export interface EventRules {
    id: string;
    wcaEventId?: string;
    nameKey: string;
    officialFormats: readonly ('ao5' | 'mo3' | 'bo1' | 'bo2' | 'bo3' | 'bo5')[];
    inspectionSeconds: number | null;
    scoring: 'time' | 'moves' | 'multiBlind';
    minSolveDistance: number;
    randomOrientation: boolean;
}
export interface AlgCase {
    id: string;
    nameKey: string;
    referenceSetup: string;
    algorithms: readonly string[];
}
export interface AlgSet {
    id: string;
    revision: number;
    nameKey: string;
    cases: readonly AlgCase[];
}
export interface QuizQuestion {
    promptKey: string;
    optionKeys: readonly string[];
    correct: number;
    caseId?: string;
}
export interface Lesson {
    id: string;
    titleKey: string;
    bodyKey: string;
    objectiveKey: string;
    exerciseKey: string;
    requires: readonly string[];
    demos: readonly { setup: string; alg: string }[];
    setId: string;
    caseIds: readonly string[];
    quiz: readonly QuizQuestion[];
    milestones?: readonly { textKey: string; lessons: readonly string[] }[];
    glossary?: 'basic' | 'advanced';
    caseId?: string;
}
export interface Course {
    id: string;
    revision: number;
    titleKey: string;
    modules: readonly {
        id: string;
        titleKey: string;
        lessons: readonly Lesson[];
    }[];
}
export interface Stage {
    id: string;
    nameKey: string;
    alg: string;
    moves: number;
    explanationKey: string;
    explanationParams: Record<string, string | number>;
    lessonId?: string;
    caseId?: string;
}
export type SearchResult =
    | {
          status: 'solved';
          alg: string;
          metric: string;
          moves: number;
          quality: 'provenOptimal' | 'heuristic';
          stages: readonly Stage[];
      }
    | {
          status: 'timeout' | 'cancelled' | 'invalidInput';
      };
export type WorkerTask<Result> = (input: string, signal: AbortSignal) => Promise<Result>;
export type Solver = WorkerTask<SearchResult>;
export type VerifiedCase = {
    scramble: string;
    verified: true;
};
export type CaseGenerator = WorkerTask<VerifiedCase>;
export type Panel = LazyExoticComponent<
    ComponentType<{
        eventId: string;
        scramble: string;
        onChange: (input: string) => void;
    }>
>;
export interface PuzzleModule<State> {
    id: string;
    nameKey: string;
    category: 'wca' | 'unofficial';
    events: readonly EventRules[];
    notation: {
        normalize: (input: string) => string;
    };
    visualization: {
        twistyPuzzleId: string;
        defaultView: '2D' | '3D';
    };
    generateScramble: WorkerTask<string>;
    solvedState: () => State;
    applyAlg: (state: State, alg: string) => State;
    isSolved: (state: State) => boolean;
    solvers?: {
        shortestKnown?: Solver;
        byMethod?: Readonly<Record<string, Solver>>;
    };
    algSets: readonly string[];
    courses: readonly string[];
    loadAlgSet: (id: string) => Promise<AlgSet>;
    loadCourse: (id: string) => Promise<Course>;
    caseGenerators: Readonly<Record<string, CaseGenerator>>;
    ui?: {
        preview?: Panel;
        inputPanel?: Panel;
    };
}
