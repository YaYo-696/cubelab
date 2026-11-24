import { useEffect, useState } from 'react';
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { axes, tetraModel, turns } from '../puzzles/tetra/model';
import type { PlayerProps } from './AcademyPlayer';

const colors = ['#ffdf36', '#22894a', '#e03539', '#3059d8'];
const corners = ['0,60 17.3,30 34.6,60', '34.6,0 17.3,30 52,30', '69.3,60 34.6,60 52,30'];
const faceVertices = [
    [2, 3, 1],
    [1, 0, 2],
    [0, 1, 3],
    [3, 2, 0],
] as const;
const center = '17.3,30 52,30 34.6,60';

function DuoNet({ model, pattern, label }: { model: KPuzzle; pattern: KPattern; label: string }) {
    const { CORNERS, CENTERS } = pattern.patternData;
    return (
        <svg className="duo-net" viewBox="0 0 146 128" role="img" aria-label={label}>
            {axes.map((face, i) => (
                <g
                    key={face}
                    transform={
                        i === 0
                            ? 'translate(38 64) rotate(180 34.6 30)'
                            : ['translate(38 4)', 'translate(3.4 64)', 'translate(72.6 64)'][i - 1]
                    }
                    stroke="#19232c"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                >
                    <polygon points={center} fill={colors[CENTERS.pieces[face]]} />
                    {faceVertices[i].map((axis, slot) => {
                        const move = turns[axes.findIndex((value) => value === axis)];
                        const permutation =
                            model.moveToTransformation(move).transformationData.CENTERS.permutation;
                        let color = face as number;
                        for (let count = 0; count < CORNERS.orientation[axis]; count++)
                            color = permutation[color];
                        return <polygon key={axis} points={corners[slot]} fill={colors[color]} />;
                    })}
                </g>
            ))}
        </svg>
    );
}

export function DuoPlayer(props: PlayerProps) {
    return <Position key={JSON.stringify([props.setup, props.alg, props.autoplay])} {...props} />;
}

function Position({ setup, alg, still, autoplay, t }: PlayerProps) {
    const [model, setModel] = useState<KPuzzle>();
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(Boolean(autoplay));
    const [speed, setSpeed] = useState(1);
    const moves = alg.split(/\s+/).filter(Boolean);
    useEffect(() => {
        let active = true;
        void tetraModel('pyramduo').then((value) => {
            if (active) setModel(value);
        });
        return () => {
            active = false;
        };
    }, []);
    useEffect(() => {
        if (!playing || index >= moves.length) return;
        const timeout = setTimeout(() => setIndex(index + 1), 450 / speed);
        return () => clearTimeout(timeout);
    }, [index, moves.length, playing, speed]);
    const seek = (step: number) => {
        setPlaying(false);
        setIndex(Math.min(moves.length, Math.max(0, step)));
    };
    return (
        <div className="academy-player">
            <div
                className="duo-primary"
                data-testid="academy-player"
                data-alg={alg}
                data-visualization="2D"
            >
                {model && (
                    <DuoNet
                        model={model}
                        pattern={model
                            .defaultPattern()
                            .applyAlg(setup)
                            .applyAlg(moves.slice(0, index).join(' '))}
                        label={t('aAnimation')}
                    />
                )}
            </div>
            {!still && (
                <div className="actions">
                    <button
                        onClick={() => {
                            if (index === moves.length) setIndex(0);
                            setPlaying(true);
                        }}
                    >
                        {t('aPlay')}
                    </button>
                    <button onClick={() => setPlaying(false)}>{t('aPause')}</button>
                    <button onClick={() => seek(index - 1)}>{t('aBack')}</button>
                    <button onClick={() => seek(index + 1)}>{t('aStep')}</button>
                    <button onClick={() => seek(0)}>{t('aReset')}</button>
                    <label>
                        {t('aSpeed')}{' '}
                        <select
                            value={speed}
                            onChange={(event) => setSpeed(Number(event.target.value))}
                        >
                            {[0.25, 0.5, 1, 1.5, 2].map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
        </div>
    );
}
