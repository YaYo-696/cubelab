import { lazy, Suspense, useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../core/storage/db';
import type { PuzzleModule, Course } from '../core/contracts';
import {
    levelQuestions,
    questionBank,
    questionSetup,
    type Level,
    type Question,
} from '../core/academy/questions';
import {
    answersToEvidence,
    recommendations,
    saveEvaluation,
    type EvaluationAttempt,
} from '../core/academy/evaluation';
import './academy.css';

const Player = lazy(() => import('./AcademyPlayer').then((m) => ({ default: m.AcademyPlayer })));
type T = (key: string, params?: Record<string, string | number>) => string;

function AssessmentPicture({
    mod,
    question,
    t,
}: {
    mod: PuzzleModule<string>;
    question: Question;
    t: T;
}) {
    const [setup, setSetup] = useState<string>();
    const [error, setError] = useState(false);
    useEffect(() => {
        let active = true;
        questionSetup(question, mod.loadAlgSet)
            .then((value) => {
                if (active) setSetup(value);
            })
            .catch(() => {
                if (active) setError(true);
            });
        return () => {
            active = false;
        };
    }, [mod, question]);
    if (error) return <p role="alert">{t('failed')}</p>;
    if (setup === undefined) return <p>{t('aLoading')}</p>;
    return (
        <Suspense fallback={<p>{t('aLoading')}</p>}>
            <Player puzzle={mod.id === '222' ? '2x2x2' : '3x3x3'} setup={setup} alg="" still t={t} />
        </Suspense>
    );
}
export function Evaluation({ mod, t }: { mod: PuzzleModule<string>; t: T }) {
    const [level, setLevel] = useState<Level>('beginner');
    const [course, setCourse] = useState<Course>();
    const [history, setHistory] = useState<EvaluationAttempt[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<number[]>([]);
    const [index, setIndex] = useState(0),
        [result, setResult] = useState<EvaluationAttempt>();
    const [error, setError] = useState(false),
        [saving, setSaving] = useState(false);
    useEffect(() => {
        let active = true;
        mod.loadCourse(mod.courses[0])
            .then((value) => {
                if (active) setCourse(value);
            })
            .catch(() => {
                if (active) setError(true);
            });
        const sub = liveQuery(() =>
            db.evaluations
                .where('[puzzleId+createdAt]')
                .between([mod.id, 0], [mod.id, Number.MAX_SAFE_INTEGER], true, true)
                .reverse()
                .toArray(),
        ).subscribe({ next: setHistory, error: () => setError(true) });
        return () => {
            active = false;
            sub.unsubscribe();
        };
    }, [mod]);
    const question = questions[index];
    const lessonName = (id: string) =>
        course?.modules.flatMap((m) => m.lessons).find((l) => l.id === id)?.titleKey;
    const evidence = result
        ? result.questionIds.flatMap((id, i) => {
              const q = questionBank.find((entry) => entry.id === id);
              return q ? answersToEvidence([q], [result.answers[i]]) : [];
          })
        : [];
    function start() {
        setQuestions(levelQuestions(mod.id, level));
        setAnswers([]);
        setIndex(0);
        setResult(undefined);
        setError(false);
    }
    async function next() {
        if (saving || answers[index] === undefined) return;
        if (index + 1 < questions.length) {
            setIndex(index + 1);
            return;
        }
        setSaving(true);
        setError(false);
        try {
            setResult(await saveEvaluation(db, mod.id, level, questions, answers));
            setQuestions([]);
        } catch {
            setError(true);
        } finally {
            setSaving(false);
        }
    }
    return (
        <div className="evaluation">
            <section className="academy-card">
                {!question && (
                    <div className="actions">
                        <label>
                            {t('aLevel')}{' '}
                            <select value={level} onChange={(e) => setLevel(e.target.value as Level)}>
                                <option value="beginner">{t('aLevel_beginner')}</option>
                                <option value="intermediate">{t('aLevel_intermediate')}</option>
                            </select>
                        </label>
                        <button onClick={start}>{t('aStartEvaluation')}</button>
                    </div>
                )}
                {question && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void next();
                        }}
                    >
                        <p>{t('aQNumber', { index: index + 1, total: questions.length })}</p>
                        <fieldset
                            data-testid="evaluation-question"
                            data-skill={question.skill}
                            data-question-id={question.id}
                        >
                            <legend>{t(question.promptKey)}</legend>
                            {question.picture && (
                                <AssessmentPicture
                                    key={question.id}
                                    mod={mod}
                                    question={question}
                                    t={t}
                                />
                            )}
                            {question.optionKeys.map((option, i) => (
                                <label key={option}>
                                    <input
                                        name="evaluation-answer"
                                        type="radio"
                                        checked={answers[index] === i}
                                        onChange={() =>
                                            setAnswers((old) => Object.assign([...old], { [index]: i }))
                                        }
                                    />
                                    {question.picture?.kind === 'move' ? option : t(option)}
                                </label>
                            ))}
                        </fieldset>
                        <div className="actions">
                            <button
                                type="button"
                                disabled={index === 0 || saving}
                                onClick={() => setIndex(index - 1)}
                            >
                                {t('previous')}
                            </button>
                            <button disabled={answers[index] === undefined || saving}>
                                {t(index + 1 < questions.length ? 'nextPage' : 'aFinishEvaluation')}
                            </button>
                        </div>
                    </form>
                )}
                {result && !question && (
                    <div>
                        <h2>{t('aResult')}</h2>
                        <ul>
                            {result.skills.map((row) => (
                                <li key={row.skill}>
                                    {t('aSkill_' + row.skill)} · {t('aScore', row)}
                                </li>
                            ))}
                        </ul>
                        <h3>{t('aRecommendations')}</h3>
                        <ul>
                            {recommendations(evidence).map((row) => {
                                const key = lessonName(row.lessonId);
                                return key ? (
                                    <li key={row.lessonId}>
                                        <a href={'#academy/' + row.lessonId}>
                                            {t('aReview', { lesson: t(key) })}
                                        </a>
                                    </li>
                                ) : null;
                            })}
                        </ul>
                        {!recommendations(evidence).length && <p>{t('aNoReview')}</p>}
                    </div>
                )}
                {error && <p role="alert">{t('failed')}</p>}
            </section>
            <section className="academy-card">
                <h2>{t('aEvaluationHistory')}</h2>
                <ul>
                    {history.map((row) => (
                        <li key={row.id}>
                            <button disabled={!!question} onClick={() => setResult(row)}>
                                {t('aLevel_' + row.level)} ·{' '}
                                {new Date(row.createdAt).toLocaleString(document.documentElement.lang)} ·{' '}
                                {t('aScore', {
                                    correct: row.skills.reduce(
                                        (total, skill) => total + skill.correct,
                                        0,
                                    ),
                                    total: row.questionIds.length,
                                })}
                            </button>
                        </li>
                    ))}
                </ul>
                {!history.length && <p>{t('aEmptyHistory')}</p>}
            </section>
        </div>
    );
}
