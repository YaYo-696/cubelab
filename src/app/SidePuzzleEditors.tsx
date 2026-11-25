import { useState } from 'react';
import type { ClockDials, ClockIssue } from '../core/fromColors/readClock';
import { square1Pieces, type Square1Input, type Square1Issue } from '../core/fromColors/readSquare1';
import type { ColorJob } from '../workers/fromColorsClient';
import './sideSolver.css';

type T = (key: string, params?: Record<string, number | string>) => string;
type EditorProps = { t: T; onEdit: () => void };
const linkedCorners: Record<number, number | undefined> = { 0: 2, 2: 0, 6: 8, 8: 6 };
const hours = Array.from({ length: 12 }, (_, i) => i + 1);

export function ClockEditor({ t, onEdit, issues, onSubmit }: EditorProps & {
    issues: ClockIssue[];
    onSubmit: (job: ColorJob<'readClock'>) => void;
}) {
    const [dials, setDials] = useState<ClockDials>(() => ({ front: Array(9).fill(0), back: Array(9).fill(0) }));
    const back = dials.back.map((value, index) => {
        const frontIndex = linkedCorners[index];
        return frontIndex === undefined ? value : (12 - dials.front[frontIndex]) % 12;
    });
    return (
        <>
            <p>{t('clockReadBack')}</p>
            <div className="clock-editor">
                {(['front', 'back'] as const).map((side) => (
                    <fieldset key={side}>
                        <legend>{t(side === 'front' ? 'clockFrontSide' : 'clockBackSide')}</legend>
                        <div className="clock-dials">
                            {(side === 'front' ? dials.front : back).map((value, index) => (
                                <select
                                    key={index}
                                    data-testid={'clock-' + side + '-' + index}
                                    aria-label={t(side === 'front' ? 'clockFrontDial' : 'clockBackDial', { dial: index + 1 })}
                                    aria-invalid={issues.some((issue) =>
                                        issue.dials.some((dial) => dial.side === side && (dial.index === index || dial.index === -1)),
                                    )}
                                    value={value || 12}
                                    disabled={side === 'back' && linkedCorners[index] !== undefined}
                                    onChange={(event) => {
                                        const hour = Number(event.target.value) % 12;
                                        setDials({ ...dials, [side]: dials[side].map((old, i) => i === index ? hour : old) });
                                        onEdit();
                                    }}
                                >
                                    {hours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                                </select>
                            ))}
                        </div>
                    </fieldset>
                ))}
            </div>
            <button type="button" onClick={() => onSubmit({ kind: 'readClock', dials: { front: dials.front, back } })}>
                {t('fromColorsSolve')}
            </button>
        </>
    );
}

type Layer = 'top' | 'bottom';
type Piece = (typeof square1Pieces)[number];
const piecesById = new Map(square1Pieces.map((piece) => [piece.id, piece]));
const layerName = { top: 'sq1Top', bottom: 'sq1Bottom' };
const paint: Record<string, string> = {
    white: '#fff', yellow: '#ffd928', blue: '#3878ec', red: '#e63642', green: '#2caa58', orange: '#ff8b32',
};

function PieceIcon({ piece }: { piece: Piece }) {
    const [face, left, right] = piece.colors;
    return (
        <svg aria-hidden="true" viewBox="0 0 40 38" className="sq1-piece-icon">
            {piece.kind === 'corner' ? (
                <>
                    <path d="M2 14 L20 3 L38 14 L20 27 Z" fill={paint[face]} />
                    <path d="M2 14 L20 27 L20 36 L2 23 Z" fill={paint[left]} />
                    <path d="M20 27 L38 14 L38 23 L20 36 Z" fill={paint[right]} />
                </>
            ) : (
                <>
                    <path d="M10 7 H30 L34 24 H6 Z" fill={paint[face]} />
                    <path d="M6 24 H34 V33 H6 Z" fill={paint[left]} />
                </>
            )}
        </svg>
    );
}

export function Square1Editor({ t, onEdit, issues, onSubmit }: EditorProps & {
    issues: Square1Issue[];
    onSubmit: (job: ColorJob<'readSquare1'>) => void;
}) {
    const [layer, setLayer] = useState<Layer>('top');
    const [order, setOrder] = useState<{ layer: Layer; piece: Piece }[]>([]);
    const [middleSquare, setMiddleSquare] = useState(true);
    const input: Square1Input = {
        top: order.filter((item) => item.layer === 'top').map(({ piece }) => piece.id),
        bottom: order.filter((item) => item.layer === 'bottom').map(({ piece }) => piece.id),
        middleSquare,
    };
    const marked = new Set(issues.flatMap((issue) => issue.pieces));
    return (
        <>
            <p>{t('sq1Intro')}</p>
            <div className="solver-controls" role="group" aria-label={t('sq1ChooseLayer')}>
                {(['top', 'bottom'] as const).map((name) => (
                    <button key={name} type="button" aria-pressed={layer === name} onClick={() => setLayer(name)}>
                        {t(layerName[name])}
                    </button>
                ))}
            </div>
            <div className="sq1-layers">
                {(['top', 'bottom'] as const).map((name) => {
                    const width = input[name].reduce((count, id) => count + (piecesById.get(id)?.kind === 'corner' ? 2 : 1), 0);
                    return (
                        <div key={name} data-testid={'sq1-layer-' + name}>
                            <strong>{t(layerName[name])}</strong>{' '}
                            <span aria-live="polite">{width}/12</span>
                            <ol className="sq1-placed" aria-label={t(layerName[name])}>
                                {input[name].map((id, index) => (
                                    <li key={index} data-invalid={marked.has(id) || undefined}>
                                        <PieceIcon piece={piecesById.get(id)!} />
                                        <span>{id}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    );
                })}
            </div>
            <div className="sq1-palette" role="group" aria-label={t('sq1Palette')}>
                {square1Pieces.map((piece) => (
                    <button key={piece.id} type="button" data-testid={'sq1-piece-' + piece.id}
                        data-invalid={marked.has(piece.id) || undefined}
                        aria-label={t('sq1Piece', {
                            id: piece.id,
                            kind: t(piece.kind === 'corner' ? 'sq1Corner' : 'sq1Edge'),
                            colors: piece.colors.map((color) => t('fromColorsColor_' + color)).join(', '),
                        })}
                        onClick={() => {
                            setOrder([...order, { layer, piece }]);
                            onEdit();
                        }}>
                        <PieceIcon piece={piece} />
                        <span>{piece.id}</span>
                    </button>
                ))}
            </div>
            <label className="sq1-middle">
                <input type="checkbox" checked={middleSquare} onChange={(event) => {
                    setMiddleSquare(event.target.checked);
                    onEdit();
                }} />
                {t('sq1Middle')}
            </label>
            <div className="solver-controls">
                <button type="button" disabled={order.length === 0} onClick={() => {
                    setOrder(order.slice(0, -1));
                    onEdit();
                }}>{t('sq1Undo')}</button>
                <button type="button" onClick={() => {
                    setOrder([]);
                    setLayer('top');
                    setMiddleSquare(true);
                    onEdit();
                }}>{t('fromColorsClear')}</button>
                <button type="button" onClick={() => onSubmit({ kind: 'readSquare1', pieces: input })}>
                    {t('fromColorsSolve')}
                </button>
            </div>
        </>
    );
}
