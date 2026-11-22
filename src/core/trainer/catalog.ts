import type { Skill } from '../academy/questions';

export type TrainingSet = {
    id: string;
    nameKey: string;
    skill: Skill;
    targetMs: number;
    groups: readonly { id: string; lessonId: string; ids?: readonly string[] }[];
    lowerFace?: boolean;
};
