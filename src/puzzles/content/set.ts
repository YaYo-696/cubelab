import type { AlgSet } from '../../core/contracts';
import type { AcademyCase } from '../../core/academy/cases';
const right: AcademyCase = {
    id: 'right',
    nameKey: 'right',
    standardName: 'R',
    referenceSetup: 'R',
    pattern: { kind: 'setup', setup: 'R' },
    goal: 'exact',
    algorithms: ["R'"],
    fingertrickKey: 'fingerRight',
};
export default { id: 'basic', revision: 3, nameKey: 'basic', cases: [right] } satisfies AlgSet;
