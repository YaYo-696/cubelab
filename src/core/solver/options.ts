export type SolveMethod =
    | 'shortest'
    | 'beginner'
    | 'ortega'
    | 'cfop4'
    | 'cfopFull'
    | 'cllPractice'
    | 'egPractice';
export interface SolveOptions {
    neutral?: boolean;
    onProgress?: (value: SolveProgress) => void;
}
export interface SolveProgress {
    key: string;
    value: number;
}
