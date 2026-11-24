import type { AlgSet, Course, Lesson } from '../../core/contracts';
import type { TrainingSet } from '../../core/trainer/catalog';
import { inverse, normalizeTetra, pyrModel } from './model';

type Messages = Record<'es' | 'en', Record<string, string>>;

const fail = (where: string, problem: string): never => {
    throw new Error('content-drop/pyram · ' + where + ': ' + problem);
};
const record = (value: unknown, where: string) =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : fail(where, 'expected an object');
const rows = (value: unknown, where: string): unknown[] =>
    Array.isArray(value) ? value : fail(where, 'expected an array');
const str = (value: unknown, where: string, empty = false) =>
    typeof value === 'string' && (empty || Boolean(value.trim()))
        ? value
        : fail(where, 'expected text');
const identifier = (value: unknown, where: string) => {
    const id = str(value, where);
    return /^[a-zA-Z0-9_-]+$/.test(id) ? id : fail(where, 'invalid ID ' + id);
};
function algorithm(value: unknown, where: string, empty = false) {
    const text = str(value, where, empty);
    try {
        return !text.trim() && empty ? '' : normalizeTetra(text, true);
    } catch {
        return fail(where, 'invalid WCA Pyraminx notation: ' + text);
    }
}
function verifyVersion(input: unknown, file: string) {
    const data = record(input, file);
    if (data.version !== 1) fail(file, 'expected version 1');
    return data;
}

export async function parsePyramDrop(algsets: unknown, lessons: unknown, fixture = false) {
    const setsFile = verifyVersion(algsets, 'algsets.json');
    const lessonsFile = verifyVersion(lessons, 'lessons.json');
    const messages: Messages = { es: {}, en: {} };
    function local(value: unknown, key: string) {
        const bilingual = record(value, key);
        for (const locale of ['es', 'en'] as const)
            messages[locale][key] = str(bilingual[locale], key + '.' + locale);
        return key;
    }

    const model = await pyrModel();
    const solved = model.defaultPattern();
    const sets = new Map<string, AlgSet>();
    const groups = new Map<string, Map<string, string[]>>();
    const caseIds = new Set<string>();
    for (const raw of rows(setsFile.sets, 'sets')) {
        const data = record(raw, 'set');
        const id = identifier(data.id, 'set.id');
        if ((id !== 'l3e' && id !== 'l4e') || sets.has(id)) fail(id, 'unknown or duplicate set');
        const nameKey = local(data.name, 'pyram.set.' + id);
        const stage = str(data.stage, id + '.stage');
        const caseGroups = new Map<string, string[]>();
        const cases = rows(data.cases, id + '.cases').map((item) => {
            const entry = record(item, id + '.case');
            const caseId = identifier(entry.id, id + '.case.id');
            const where = id + '/' + caseId;
            if (caseIds.has(caseId)) fail(where, 'duplicate case ID');
            caseIds.add(caseId);
            const group = str(entry.group, where + '.group');
            if (!caseGroups.has(group)) caseGroups.set(group, []);
            caseGroups.get(group)!.push(caseId);
            const referenceSetup = algorithm(entry.setup, where + '.setup', true);
            const target = solved.applyAlg(referenceSetup);
            const source = str(entry.source, where + '.source');
            if (!/^https?:\/\/[^\s/]+/i.test(source)) fail(where, 'expected an HTTP(S) source URL');
            const list = rows(entry.algs, where + '.algs');
            if (!list.length) fail(where, 'missing principal algorithm');
            const algorithms = list.map((variant, index) => {
                const label = where + ' alg #' + (index + 1);
                const alg = algorithm(variant, label);
                if (!target.applyAlg(alg).isIdentical(solved))
                    fail(label, '(a) algorithm does not solve the declared setup');
                if (!solved.applyAlg(inverse(alg)).isIdentical(target))
                    fail(label, '(b) inverse does not match the declared setup');
                return alg;
            });
            return {
                id: caseId,
                nameKey: local(entry.name, 'pyram.case.' + caseId),
                referenceSetup,
                algorithms,
                source,
            };
        });
        sets.set(id, { id, revision: 1, nameKey, cases, stage });
        groups.set(id, caseGroups);
    }
    const entries = new Map<string, Lesson>();
    for (const raw of rows(lessonsFile.lessons, 'lessons')) {
        const data = record(raw, 'lesson');
        const id = identifier(data.id, 'lesson.id');
        if (entries.has(id)) fail(id, 'duplicate lesson');
        const key = 'pyram.lesson.' + id;
        const algSetRefs = rows(data.algSetRefs, id + '.algSetRefs').map((ref) => {
            const set = identifier(ref, id + '.algSetRefs');
            if (!sets.has(set)) fail(id, 'unknown set ' + set);
            return set;
        });
        if (new Set(algSetRefs).size !== algSetRefs.length) fail(id, 'duplicate set reference');
        const demos = rows(data.demos, id + '.demos').map((demo) => {
            const item = record(demo, id + '.demo');
            return {
                setup: algorithm(item.setup, id + '.demo.setup', true),
                alg: algorithm(item.alg, id + '.demo.alg', true),
            };
        });
        const requires = rows(data.prerequisites, id + '.prerequisites').map((ref) =>
            identifier(ref, id + '.prerequisites'),
        );
        entries.set(id, {
            id,
            titleKey: local(data.title, key + '.title'),
            objectiveKey: local(data.objective, key + '.objective'),
            bodyKey: local(data.body, key + '.body'),
            markdown: true,
            exerciseKey: '',
            requires,
            demos,
            setId: algSetRefs[0] ?? '',
            algSetRefs,
            caseIds: algSetRefs.flatMap((ref) => sets.get(ref)!.cases.map((item) => item.id)),
            quiz: [],
        });
    }
    const checked = new Set<string>();
    function visit(id: string, path: ReadonlySet<string>) {
        if (checked.has(id)) return;
        if (path.has(id)) fail(id, 'cyclic prerequisites');
        const lesson = entries.get(id) ?? fail(id, 'unknown prerequisite');
        lesson.requires.forEach((ref) => visit(ref, new Set([...path, id])));
        checked.add(id);
    }
    for (const id of entries.keys()) visit(id, new Set());

    const trainingSets: TrainingSet[] = [...sets.values()].map((set) => ({
        id: set.id,
        nameKey: set.nameKey,
        targetMs: 5000,
        skill: 'steps',
        groups: [...groups.get(set.id)!].map(([group, ids], i) => {
            const nameKey = 'pyram.group.' + set.id + '.' + i;
            messages.es[nameKey] = messages.en[nameKey] = group;
            const lessonId = [...entries.values()].find((lesson) =>
                lesson.algSetRefs?.includes(set.id),
            )?.id;
            return { id: String(i), nameKey, lessonId, ids };
        }),
    }));
    const course: Course = {
        id: fixture ? 'academy-pyram-fixture' : 'academy-pyram',
        titleKey: 'pyram',
        revision: 1,
        modules: [
            {
                id: 'pyram-content',
                titleKey: fixture ? 'pyramFixture' : 'pyramContent',
                lessons: [...entries.values()],
            },
        ],
    };
    return { sets, course, messages, trainingSets };
}
