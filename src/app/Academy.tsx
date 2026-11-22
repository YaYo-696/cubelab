import { isFullPattern } from '../core/academy/lastLayer';
import { LastLayerImage } from './LastLayerImage';
import { lazy, Suspense, useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import type { Course, Lesson, PuzzleModule, AlgSet } from '../core/contracts';
import { db } from '../core/storage/db';
import { unlocked, submitLesson, type Completion } from '../core/academy/progress';
import { glossary } from '../core/academy/glossary';
import { predefinedPractice } from '../core/academy/practice';
import { caseSetup, type AcademyCase } from '../core/academy/cases';
import { openingMoves } from '../core/academy/execution';
import './academy.css';

const Player = lazy(() => import('./AcademyPlayer').then((m) => ({ default: m.AcademyPlayer })));
type T = (key: string, params?: Record<string, string | number>) => string;
type Props = { mod: PuzzleModule<string>; t: T };

function LessonView({
    mod,
    t,
    course,
    lesson,
    completed,
}: { course: Course; lesson: Lesson; completed: boolean } & Props) {
    const [set, setSet] = useState<AlgSet>(),
        [caseId, setCase] = useState(lesson.caseIds[0]);
    const [position, setPosition] = useState<{ setup: string; caseId: string; variant: number }>(),
        [variant, setVariant] = useState(lesson.demos.length ? -1 : 0),
        [move, setMove] = useState('');
    const [answers, setAnswers] = useState<number[]>([]),
        [result, setResult] = useState<number>(),
        [error, setError] = useState(false);
    useEffect(() => {
        let active = true;
        mod.loadAlgSet(lesson.setId)
            .then((data) => {
                if (active) setSet(data);
            })
            .catch(() => {
                if (active) setError(true);
            });
        return () => {
            active = false;
        };
    }, [mod, lesson.setId]);
    useEffect(() => {
        if (!set || !caseId) return;
        let active = true;
        predefinedPractice(lesson, set, caseId, variant)
            .then((data) => {
                if (active) setPosition({ ...data, variant });
            })
            .catch(() => {
                if (active) setError(true);
            });
        return () => {
            active = false;
        };
    }, [lesson, set, caseId, variant]);
    const setup =
        position?.caseId === caseId && position?.variant === variant ? position?.setup : undefined;
    const cases = set?.cases.filter((c) => lesson.caseIds.includes(c.id));
    const full = cases?.some((raw) => {
        const item = raw as AcademyCase;
        return item.pattern && isFullPattern(item.pattern);
    });
    const selectCase = (id: string) => {
        setCase(id);
        setVariant(0);
        setMove('');
    };
    const selected = cases?.find((c) => c.id === caseId);
    const puzzle = mod.id === '222' ? '2x2x2' : '3x3x3';
    const symbol = glossary(mod.id, lesson.glossary).find((entry) => entry.move === move);
    const demo = lesson.demos[0];
    const alg = symbol?.alg ?? (variant === -1 ? demo?.alg : selected?.algorithms[variant]);
    const playerSetup = symbol ? '' : variant === -1 ? demo?.setup : setup;
    const opening = full && alg && !symbol && variant >= 0 ? openingMoves(alg) : undefined;
    return (
        <section className="academy-card">
            <h2>{t(lesson.titleKey)}</h2>
            {completed && <p role="status">{t('aCompleted')}</p>}
            <p>
                <strong>{t('aGoal')}</strong> · {t(lesson.objectiveKey)}
            </p>
            <p>{t(lesson.bodyKey)}</p>
            {lesson.glossary && (
                <section>
                    <h3>
                        {t(
                            lesson.glossary === 'basic'
                                ? 'aBasicGlossary'
                                : mod.id === '222'
                                  ? 'aAdvancedGlossary2'
                                  : 'aAdvancedGlossary',
                        )}
                    </h3>
                    <div className="actions">
                        {glossary(mod.id, lesson.glossary).map((entry) => (
                            <button
                                key={entry.move}
                                onClick={() => setMove(entry.move)}
                                aria-pressed={entry.move === move}
                            >
                                {entry.move}
                            </button>
                        ))}
                    </div>
                    {symbol && <p>{t(symbol.descriptionKey)}</p>}
                </section>
            )}
            {cases && cases.length > 1 && !full && (
                <label>
                    {t('aCase')}{' '}
                    <select
                        value={caseId}
                        onChange={(e) => {
                            setCase(e.target.value);
                            setVariant(0);
                        }}
                    >
                        {cases.map((c) => (
                            <option value={c.id} key={c.id}>
                                {t(c.nameKey)}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            {full && (
                <div className="case-grid">
                    {cases?.map((raw) => {
                        const entry = raw as AcademyCase;
                        if (!isFullPattern(entry.pattern)) return null;
                        return (
                            <button
                                key={entry.id}
                                type="button"
                                aria-label={t(entry.nameKey)}
                                aria-pressed={caseId === entry.id}
                                onClick={() => selectCase(entry.id)}
                            >
                                <LastLayerImage
                                    puzzle={mod.id}
                                    setup={caseSetup(entry, caseId === entry.id ? variant : 0)}
                                    pattern={entry.pattern}
                                    label={t('aTopCase')}
                                />
                                <span>{t(entry.nameKey)}</span>
                            </button>
                        );
                    })}
                </div>
            )}
            {lesson.milestones?.length ? (
                <ol>
                    {lesson.milestones.map((row) => (
                        <li key={row.textKey}>
                            <strong>{t(row.textKey)}</strong>
                            <ul>
                                {row.lessons.map((id) => {
                                    const link = course.modules
                                        .flatMap((m) => m.lessons)
                                        .find((l) => l.id === id);
                                    return link ? (
                                        <li key={id}>
                                            <a href={'#academy/' + id}>{t(link.titleKey)}</a>
                                        </li>
                                    ) : null;
                                })}
                            </ul>
                        </li>
                    ))}
                </ol>
            ) : null}
            {selected && !selected.algorithms.length && <p>{t('aPendingCase')}</p>}
            {alg !== undefined && playerSetup !== undefined && (
                <Suspense fallback={<p>{t('aLoading')}</p>}>
                    <Player puzzle={puzzle} setup={playerSetup} alg={alg} autoplay={!!symbol} t={t} />
                </Suspense>
            )}
            {selected && (
                <section>
                    <h3>{t('aAlgorithms')}</h3>
                    <div className="actions">
                        {selected.algorithms.map((sequence, i) => (
                            <button
                                key={sequence}
                                aria-pressed={variant === i && !symbol}
                                onClick={() => {
                                    setVariant(i);
                                    setMove('');
                                }}
                            >
                                {t(i === 0 ? 'aMain' : 'aRealAlternative')} · <code>{sequence}</code>
                            </button>
                        ))}
                    </div>
                    {opening && opening.steps.length > 0 && (
                        <ol className="algorithm-opening" aria-label={t('aOpeningMoves')}>
                            {opening.steps.map(({ key, move }, i) => (
                                <li key={i}>
                                    {t(key)} · <code>{move}</code>
                                </li>
                            ))}
                            <li>
                                {t('aExecuteSequence')} · <code>{opening.body}</code>
                            </li>
                        </ol>
                    )}
                    <p>{t((selected as Partial<AcademyCase>).fingertrickKey ?? 'fingerUpper')}</p>
                </section>
            )}
            <h3>{t('aPractice')}</h3>
            <p>{t('aFrame')}</p>
            <p>{t(lesson.exerciseKey)}</p>
            {setup && (
                <p>
                    {t('aSetup')} · <code>{setup}</code>
                </p>
            )}
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    setError(false);
                    try {
                        setResult(await submitLesson(db, course, lesson.id, answers));
                    } catch {
                        setError(true);
                    }
                }}
            >
                <h3>{t('aQuiz')}</h3>
                {lesson.quiz.map((question, index) => {
                    const picture = cases?.find((c) => c.id === question.caseId) as
                        | AcademyCase
                        | undefined;
                    return (
                        <fieldset key={question.promptKey} data-testid={'academy-question-' + index}>
                            <legend>{t(question.promptKey)}</legend>
                            {picture && isFullPattern(picture.pattern) ? (
                                <div className="quiz-case">
                                    <LastLayerImage
                                        puzzle={mod.id}
                                        setup={picture.referenceSetup}
                                        pattern={picture.pattern}
                                        label={t('aTopCase')}
                                    />
                                </div>
                            ) : (
                                picture && (
                                    <Suspense fallback={<p>{t('aLoading')}</p>}>
                                        <Player
                                            puzzle={puzzle}
                                            setup={picture.referenceSetup}
                                            alg=""
                                            still
                                            flatOnly
                                            t={t}
                                        />
                                    </Suspense>
                                )
                            )}
                            {question.optionKeys.map((key, value) => (
                                <label key={key}>
                                    <input
                                        required
                                        name={'q' + index}
                                        type="radio"
                                        checked={answers[index] === value}
                                        onChange={() =>
                                            setAnswers((old) =>
                                                Object.assign([...old], { [index]: value }),
                                            )
                                        }
                                    />{' '}
                                    {t(key)}
                                </label>
                            ))}
                        </fieldset>
                    );
                })}
                <button>{t('aCheck')}</button>
                {result !== undefined && (
                    <p role="status">{t('aScore', { correct: result, total: lesson.quiz.length })}</p>
                )}
            </form>
            {error && <p role="alert">{t('failed')}</p>}
        </section>
    );
}

export function Academy({ mod, t, lessonLink }: Props & { lessonLink?: string }) {
    const [course, setCourse] = useState<Course>(),
        [progress, setProgress] = useState<Completion[]>([]);
    const [selected, setSelected] = useState(''),
        [error, setError] = useState(false);
    useEffect(() => {
        let active = true;
        mod.loadCourse(mod.courses[0])
            .then((data) => {
                if (active) setCourse(data);
            })
            .catch(() => {
                if (active) setError(true);
            });
        return () => {
            active = false;
        };
    }, [mod]);
    useEffect(() => {
        if (!course) return;
        const sub = liveQuery(() =>
            db.lessons
                .where('[courseId+lessonId]')
                .between([course.id, ''], [course.id, '\uffff'], true, true)
                .toArray(),
        ).subscribe({ next: setProgress, error: () => setError(true) });
        return () => sub.unsubscribe();
    }, [course]);
    if (!course) return <p>{t(error ? 'failed' : 'aLoading')}</p>;
    const lesson = course.modules
        .flatMap((m) => m.lessons)
        .find((l) => l.id === (lessonLink ?? selected));
    const done = (id: string) =>
        progress.some(
            (r) => r.revision === course.revision && r.lessonId === id && r.completedAt !== undefined,
        );
    return (
        <div className="academy">
            <section className="academy-card">
                <h2>{t(course.titleKey)}</h2>
                {course.modules.map((module) => (
                    <div key={module.id}>
                        <h3>{t(module.titleKey)}</h3>
                        <ul>
                            {module.lessons.map((l) => (
                                <li key={l.id}>
                                    <button
                                        onClick={() => {
                                            setSelected(l.id);
                                            if (lessonLink) location.hash = 'academy/' + l.id;
                                        }}
                                        disabled={!unlocked(course, l, progress)}
                                        aria-pressed={(lessonLink ?? selected) === l.id}
                                    >
                                        {t(l.titleKey)}
                                    </button>
                                    {done(l.id) ? (
                                        <small>{t('aCompleted')}</small>
                                    ) : !unlocked(course, l, progress) ? (
                                        <small>{t('aLocked')}</small>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>
            {lesson && unlocked(course, lesson, progress) && (
                <LessonView
                    key={lesson.id}
                    course={course}
                    lesson={lesson}
                    completed={done(lesson.id)}
                    mod={mod}
                    t={t}
                />
            )}
            {lesson && !unlocked(course, lesson, progress) && <p>{t('aLocked')}</p>}
            {error && <p role="alert">{t('failed')}</p>}
        </div>
    );
}
