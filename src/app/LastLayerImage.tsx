import { useEffect, useState } from 'react';
import { lastLayerStickers, patternFromVectors, type LastLayerPattern } from '../core/academy/lastLayer';
const colors: Record<string, string> = {
    y: '#ffd842',
    w: '#f3f3ee',
    g: '#49bb78',
    r: '#ed5a53',
    o: '#ff9e49',
    b: '#4180d8',
};
const models = new Map<string, Promise<import('cubing/kpuzzle').KPattern>>();
const cache = new Map<string, ReturnType<typeof lastLayerStickers>>();
export function LastLayerImage({
    puzzle,
    pattern,
    setup,
    label,
    includeLower = false,
}: {
    puzzle: string;
    pattern?: LastLayerPattern;
    includeLower?: boolean;
    setup: string;
    label: string;
}) {
    const key = JSON.stringify([puzzle, pattern, setup, includeLower]);
    const [image, setImage] = useState<{ key: string; state: ReturnType<typeof lastLayerStickers> }>();
    useEffect(() => {
        let active = true;
        const cached = cache.get(key);
        if (cached) {
            setImage({ key, state: cached });
            return;
        }
        let model = models.get(puzzle);
        if (!model) {
            model = import('cubing/puzzles').then(async ({ puzzles }) =>
                (await puzzles[puzzle === '222' ? '2x2x2' : '3x3x3'].kpuzzle()).defaultPattern(),
            );
            models.set(puzzle, model);
        }
        model
            .then((solved) => {
                const state = lastLayerStickers(
                    pattern && !setup ? patternFromVectors(solved, pattern) : solved.applyAlg(setup),
                    includeLower,
                );
                if (cache.size >= 256) cache.delete(cache.keys().next().value!);
                cache.set(key, state);
                if (active) setImage({ key, state });
            })
            .catch(() => {
                models.delete(puzzle);
            });
        return () => {
            active = false;
        };
    }, [key, puzzle, setup, pattern, includeLower]);
    if (!image || image.key !== key) return <svg viewBox="0 0 100 100" role="img" aria-label={label} />;
    const { size, top, strips, lower } = image.state,
        step = 66 / size;
    const fill = (c: string) =>
        pattern?.kind === 'fullOLL' && c !== 'y' ? '#6f7e88' : (colors[c] ?? '#788491');
    return (
        <svg viewBox={includeLower ? '0 0 100 132' : '0 0 100 100'} role="img" aria-label={label}>
            {[...top].map((v, i) => (
                <rect
                    key={i}
                    x={17 + (i % size) * step}
                    y={17 + Math.floor(i / size) * step}
                    width={step - 2}
                    height={step - 2}
                    rx="2"
                    fill={fill(v)}
                />
            ))}
            {strips.map((side, face) =>
                [...side].map((v, i) => {
                    const offset = 17 + (face === 1 || face === 2 ? size - 1 - i : i) * step;
                    const horizontal = face % 2 === 0;
                    return (
                        <rect
                            key={face + ':' + i}
                            x={horizontal ? offset : face === 1 ? 86 : 6}
                            y={horizontal ? (face === 0 ? 86 : 6) : offset}
                            width={horizontal ? step - 2 : 8}
                            height={horizontal ? 8 : step - 2}
                            rx="1"
                            fill={fill(v)}
                        />
                    );
                }),
            )}
            {lower.map((side, face) =>
                [...side].map((v, i) => (
                    <rect
                        key={'lower:' + face + ':' + i}
                        x={6 + face * 22 + i * 10}
                        y={110}
                        width={9}
                        height={12}
                        rx="1"
                        fill={fill(v)}
                    />
                )),
            )}
        </svg>
    );
}
