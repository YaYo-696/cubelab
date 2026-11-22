import { useEffect, useRef, useState } from 'react';
import type { T } from './App';

export function Onboarding({
    t,
    initialPuzzle,
    finish,
}: {
    t: T;
    initialPuzzle: '222' | '333';
    finish: (puzzle: '222' | '333', knows: boolean) => void;
}) {
    const [step, setStep] = useState(0);
    const [puzzle, setPuzzle] = useState(initialPuzzle);
    const title = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        if (step) title.current?.focus({ preventScroll: true });
    }, [step]);
    return (
        <main id="main" tabIndex={-1} className="onboarding">
            <section className="intro-panel" aria-labelledby="onboarding-title">
                {step === 0 && (
                    <img src={import.meta.env.BASE_URL + 'icon-192.png'} width="76" height="76" alt="" />
                )}
                <p className="intro-step">{t('onboardProgress', { step: step + 1 })}</p>
                <h1 id="onboarding-title" tabIndex={-1} ref={title}>
                    {t('onboardTitle' + step)}
                </h1>
                <p>{t('onboardBody' + step)}</p>
                {step === 1 && (
                    <fieldset>
                        <legend>{t('solvePuzzle')}</legend>
                        {(['222', '333'] as const).map((id) => (
                            <label key={id}>
                                <input
                                    type="radio"
                                    name="onboard-puzzle"
                                    checked={puzzle === id}
                                    onChange={() => setPuzzle(id)}
                                />
                                {t(id)}
                            </label>
                        ))}
                    </fieldset>
                )}
                <div className="intro-actions">
                    {step > 0 && (
                        <button className="secondary" onClick={() => setStep(step - 1)}>
                            {t('onboardBack')}
                        </button>
                    )}
                    {step < 2 ? (
                        <button onClick={() => setStep(step + 1)}>{t('onboardNext')}</button>
                    ) : (
                        <>
                            <button onClick={() => finish(puzzle, true)}>{t('onboardKnow')}</button>
                            <button className="secondary" onClick={() => finish(puzzle, false)}>
                                {t('onboardLearn')}
                            </button>
                        </>
                    )}
                </div>
                <button className="text-button" onClick={() => finish(puzzle, true)}>
                    {t('onboardSkip')}
                </button>
            </section>
        </main>
    );
}
