import './academy.css';
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
    flatOnly = false,
    timerPreview = false,
    t,
}: {
    puzzle: '2x2x2' | '3x3x3';
    setup: string;
    alg: string;
    autoplay?: boolean;
    still?: boolean;
    flatOnly?: boolean;
    timerPreview?: boolean;
    t: T;
}) {
    const target = useRef<HTMLDivElement>(null);
    const net = useRef<HTMLDivElement>(null);
    const player = useRef<TwistyPlayer>();
    const [hidden, setHidden] = useState(false);
    const hiddenRef = useRef(false);
    const [speed, setSpeed] = useState(1);
    const rate = useRef(1);
    useEffect(() => {
        const config = {
            puzzle,
            alg,
            experimentalSetupAlg: timerPreview ? setup : ('z2 ' + setup).trim(),
            controlPanel: 'none' as const,
            background: 'none' as const,
            tempoScale: rate.current,
        };
        const node = new TwistyPlayer({
            ...config,
            visualization: flatOnly ? '2D' : '3D',
            experimentalDragInput: flatOnly ? 'none' : 'auto',
            hintFacelets: hiddenRef.current ? 'floating' : 'none',
        });
        const comparison =
            !flatOnly && !still ? new TwistyPlayer({ ...config, visualization: '2D' }) : undefined;
        const timeline = node.experimentalModel.detailedTimelineInfo;
        const synchronize = ({
            timestamp,
        }: {
            timestamp: Awaited<ReturnType<typeof node.experimentalGet.timestamp>>;
        }) => {
            if (comparison) comparison.timestamp = timestamp;
        };
        player.current = node;
        target.current?.append(node);
        if (comparison) {
            net.current?.append(comparison);
            timeline.addFreshListener(synchronize);
        }
        if (autoplay) node.play();
        return () => {
            timeline.removeFreshListener(synchronize);
            node.pause();
            node.remove();
            comparison?.remove();
            player.current = undefined;
        };
    }, [puzzle, setup, alg, autoplay, flatOnly, still, timerPreview]);
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
            <div className={'cube-views ' + (!still && !flatOnly ? 'cube-views-pair' : '')}>
                <div
                    ref={target}
                    className="cube-primary"
                    data-testid="academy-player"
                    data-alg={alg}
                    data-visualization={flatOnly ? '2D' : '3D'}
                    aria-label={t('aAnimation')}
                />
                {!still && !flatOnly && (
                    <div className="cube-secondary">
                        <small>{t('aFlatView')}</small>
                        <div ref={net} data-testid="academy-net" />
                    </div>
                )}
            </div>
            {!flatOnly && !timerPreview && (
                <button
                    aria-pressed={hidden}
                    onClick={() => {
                        const next = !hidden;
                        hiddenRef.current = next;
                        setHidden(next);
                        if (player.current) player.current.hintFacelets = next ? 'floating' : 'none';
                    }}
                >
                    {t('aHiddenFaces')}
                </button>
            )}
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
