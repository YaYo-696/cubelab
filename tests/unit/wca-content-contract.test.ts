import { expect, it } from 'vitest';
import { puzzles } from 'cubing/puzzles';
import { registry } from '../../src/puzzles/registry';
import { verifyCase, type AcademyCase } from '../../src/core/academy/cases';
import { glossary } from '../../src/core/academy/glossary';
import { videoTopicAssociations, videoTopicForLesson, videoTopics } from '../../src/content/videoTopics';
import es from '../../src/i18n/es.json';
import en from '../../src/i18n/en.json';

const globalMessages: Record<'es' | 'en', Record<string, string>> = { es, en };

it('verifica el contrato de contenido de todos los módulos WCA', async () => {
    const failures: string[] = [];
    const coverage = { puzzles: 0, courses: 0, sets: 0, cases: 0, algorithms: 0, lessons: 0 };
    const catalog = new Map<string, { puzzle: string; lessons: Set<string> }>();
    function check(condition: unknown, where: string, reason: string) {
        if (!condition) failures.push(where + ': ' + reason);
    }

    for (const [id, load] of Object.entries(registry)) {
        try {
            const mod = await load();
            check(mod.category === load.category, id, 'categorías del registro y del módulo distintas');
            if (mod.category !== 'wca') continue;
            coverage.puzzles++;
            // Drop loaders call their own rules.verify for every case and variant before returning.
            const info = await mod.loadContentInfo?.();
            const training = info?.trainingSets ?? mod.trainingSets ?? [];
            const courses = await Promise.all(mod.courses.map((course) => mod.loadCourse(course)));
            const allLessons = courses.flatMap((course) =>
                course.modules.flatMap((module) => module.lessons),
            );
            const setIds = new Set(
                [
                    ...mod.algSets,
                    ...(info?.algSets ?? []),
                    ...allLessons.flatMap((lesson) => [lesson.setId, ...(lesson.algSetRefs ?? [])]),
                    ...training.map((set) => set.id),
                ].filter(Boolean),
            );
            const sets = new Map<string, Set<string>>();
            function text(key: string, where: string) {
                for (const lang of ['es', 'en'] as const) {
                    const value = info?.messages?.[lang][key] ?? globalMessages[lang][key];
                    check(
                        key && typeof value === 'string' && value.trim(),
                        where,
                        'falta ' + lang + ': ' + key,
                    );
                }
            }

            text(mod.nameKey, id);
            for (const event of mod.events) text(event.nameKey, id + '/' + event.id);
            const solved =
                id === '222' || id === '333'
                    ? (await puzzles[id === '222' ? '2x2x2' : '3x3x3'].kpuzzle()).defaultPattern()
                    : undefined;
            check(solved || info || !setIds.size, id, 'sets sin verificador de contenido');
            for (const setId of setIds) {
                let set;
                try {
                    set = await mod.loadAlgSet(setId);
                } catch (error) {
                    check(false, id + '/' + setId, String(error));
                    continue;
                }
                const location = id + '/' + setId;
                sets.set(setId, new Set(set.cases.map((entry) => entry.id)));
                coverage.sets++;
                check(set.id === setId, location, 'ID de set distinto al solicitado');
                check(sets.get(setId)?.size === set.cases.length, location, 'ID de caso duplicado');
                text(set.nameKey, location);
                for (const entry of set.cases) {
                    coverage.cases++;
                    const where = location + '/' + entry.id;
                    text(entry.nameKey, where);
                    check(entry.algorithms.length, where, 'caso sin algoritmos');
                    if (solved) text((entry as AcademyCase).fingertrickKey, where);
                    for (const [index, alg] of entry.algorithms.entries()) {
                        coverage.algorithms++;
                        if (!solved) continue;
                        try {
                            check(
                                verifyCase(solved, entry as AcademyCase, alg),
                                where,
                                'no verifica algoritmo #' + (index + 1),
                            );
                        } catch (error) {
                            check(false, where, 'algoritmo #' + (index + 1) + ': ' + String(error));
                        }
                    }
                }
            }

            const lessonsById = new Map(allLessons.map((lesson) => [lesson.id, lesson]));
            check(lessonsById.size === allLessons.length, id, 'ID de lección duplicado');
            for (const course of courses) {
                coverage.courses++;
                text(course.titleKey, id + '/' + course.id);
                const lessonIds = new Set(
                    course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)),
                );
                catalog.set(course.id, { puzzle: id, lessons: lessonIds });
                const done = new Set<string>();
                const visiting = new Set<string>();
                function visit(lessonId: string) {
                    if (done.has(lessonId)) return;
                    if (visiting.has(lessonId)) {
                        check(
                            false,
                            id + '/' + course.id + '/' + lessonId,
                            'ciclo de prerrequisitos: ' + [...visiting, lessonId].join(' → '),
                        );
                        return;
                    }
                    const lesson = lessonsById.get(lessonId)!;
                    visiting.add(lessonId);
                    for (const required of lesson.requires) {
                        check(
                            lessonIds.has(required),
                            id + '/' + lessonId,
                            'prerrequisito inexistente: ' + required,
                        );
                        if (lessonIds.has(required)) visit(required);
                    }
                    visiting.delete(lessonId);
                    done.add(lessonId);
                }
                for (const module of course.modules) {
                    text(module.titleKey, id + '/' + course.id + '/' + module.id);
                    for (const lesson of module.lessons) {
                        coverage.lessons++;
                        const where = id + '/' + lesson.id;
                        visit(lesson.id);
                        for (const key of [lesson.titleKey, lesson.objectiveKey, lesson.bodyKey])
                            text(key, where);
                        if (lesson.exerciseKey) text(lesson.exerciseKey, where);
                        if (lesson.glossary)
                            for (const item of glossary(id, lesson.glossary))
                                text(item.descriptionKey, where);
                        const refs = [lesson.setId, ...(lesson.algSetRefs ?? [])].filter(Boolean);
                        for (const set of refs) check(sets.has(set), where, 'set inexistente: ' + set);
                        for (const caseId of new Set([
                            ...lesson.caseIds,
                            ...(lesson.caseId ? [lesson.caseId] : []),
                        ]))
                            check(
                                refs.some((set) => sets.get(set)?.has(caseId)),
                                where,
                                'caso inexistente en sets de la lección: ' + caseId,
                            );
                        for (const [index, quiz] of lesson.quiz.entries()) {
                            for (const key of [quiz.promptKey, ...quiz.optionKeys])
                                text(key, where + '/quiz ' + (index + 1));
                            const caseId = quiz.caseId;
                            if (caseId)
                                check(
                                    [...sets.values()].some((cases) => cases.has(caseId)),
                                    where,
                                    'caso de quiz inexistente: ' + caseId,
                                );
                        }
                        for (const milestone of lesson.milestones ?? []) {
                            text(milestone.textKey, where);
                            for (const link of milestone.lessons)
                                check(
                                    lessonIds.has(link),
                                    where,
                                    'lección de meta inexistente: ' + link,
                                );
                        }
                    }
                }
            }
            for (const trainingSet of training) {
                text(trainingSet.nameKey, id + '/' + trainingSet.id);
                const cases = sets.get(trainingSet.id);
                for (const group of trainingSet.groups) {
                    const where = id + '/trainer/' + trainingSet.id + '/' + group.id;
                    const lesson = group.lessonId && lessonsById.get(group.lessonId);
                    check(lesson, where, 'lección del grupo inexistente: ' + group.lessonId);
                    text(group.nameKey ?? 'aTitle_' + group.lessonId, where);
                    for (const caseId of group.ids ?? cases ?? [])
                        check(cases?.has(caseId), where, 'caso inexistente: ' + caseId);
                }
            }
        } catch (error) {
            check(false, id, String(error));
        }
    }

    for (const { topic } of videoTopics) {
        const association = videoTopicAssociations[topic];
        const course = association && catalog.get(association.courseId);
        check(course, 'video/' + topic, 'curso inexistente: ' + association?.courseId);
        if (!course) continue;
        check(
            association.lessonIds.length,
            course.puzzle + '/video/' + topic,
            'sin lecciones asociadas',
        );
        for (const lesson of association.lessonIds) {
            check(
                course.lessons.has(lesson),
                course.puzzle + '/video/' + topic,
                'lección inexistente: ' + lesson,
            );
            check(
                videoTopicForLesson(association.courseId, lesson)?.topic === topic,
                course.puzzle + '/video/' + topic,
                'asociación oculta para ' + lesson,
            );
        }
    }
    console.log('Cobertura contrato WCA', JSON.stringify(coverage));
    expect(failures, failures.join('\n')).toEqual([]);
}, 120_000);
