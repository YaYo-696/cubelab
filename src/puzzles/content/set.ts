import type { AlgSet } from '../../core/contracts';
import type { AcademyCase } from '../../core/academy/cases';
const right: AcademyCase = {
    id: 'right',
    nameKey: 'right',
    standardName: 'R',
    referenceSetup: 'R',
    pattern: { kind: 'setup', setup: 'R' },
    goal: 'exact',
    algorithms: ["R'", "y F' y'"],
    fingertrickKey: 'fingerRight',
};
export default { id: 'basic', revision: 2, nameKey: 'basic', cases: [right] } satisfies AlgSet;
