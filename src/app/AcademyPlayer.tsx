import { useEffect, useRef, useState } from 'react';
import { TwistyPlayer } from 'cubing/twisty';
import { Alg } from 'cubing/alg';
type T = (key: string) => string;
export function AcademyPlayer({
    puzzle,
    setup,
    alg,
    autoplay = false,
    still = false,
    t,
}: {
    puzzle: '2x2x2' | '3x3x3';
    setup: string;
    alg: string;
    autoplay?: boolean;
    still?: boolean;
    t: T;
}) {
    const target = useRef<HTMLDivElement>(null);
    const player = useRef<TwistyPlayer>();
    const [speed, setSpeed] = useState(1);
    const rate = useRef(1);
    useEffect(() => {
        const node = new TwistyPlayer({
            puzzle,
            alg,
            experimentalSetupAlg: ('z2 ' + setup).trim(),
            visualization: '2D',
            controlPanel: 'none',
            background: 'none',
            tempoScale: rate.current,
        });
        player.current = node;
        target.current?.append(node);
        if (autoplay) node.play();
        return () => {
            node.pause();
            node.remove();
            player.current = undefined;
        };
    }, [puzzle, setup, alg, autoplay]);
    async function step(direction: number) {
        const node = player.current;
        if (!node) return;
        node.pause();
        const [indexer, time] = await Promise.all([
            node.experimentalModel.indexer.get(),
            node.experimentalGet.timestamp(),
        ]);
        const moves = Array.from(new Alg(alg).expand().childAlgNodes()).length;
        const boundaries = [
            ...Array.from({ length: moves }, (_, i) =>
                indexer.indexToMoveStartTimestamp(
                    i as Parameters<typeof indexer.indexToMoveStartTimestamp>[0],
                ),
            ),
        ];
        if (player.current !== node) return;
        node.timestamp =
            direction > 0
                ? (boundaries.find((at) => at > time) ?? 'end')
                : (boundaries.filter((at) => at < time).at(-1) ?? 'start');
    }
    return (
        <div className="academy-player">
            <div ref={target} data-testid="academy-player" data-alg={alg} aria-label={t('aAnimation')} />
            {!still && (
                <div className="actions">
                    <button onClick={() => player.current?.play()}>{t('aPlay')}</button>
                    <button onClick={() => player.current?.pause()}>{t('aPause')}</button>
                    <button onClick={() => void step(-1)}>{t('aBack')}</button>
                    <button onClick={() => void step(1)}>{t('aStep')}</button>
                    <button onClick={() => player.current?.jumpToStart()}>{t('aReset')}</button>
                    <label>
                        {t('aSpeed')}{' '}
                        <select
                            value={speed}
                            onChange={(e) => {
                                const value = Number(e.target.value);
                                setSpeed(value);
                                rate.current = value;
                                if (player.current) player.current.tempoScale = value;
                            }}
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
