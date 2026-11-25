import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ColorIssue, ColorLayout, ColorPuzzle, ColorReading, Painted } from '../core/fromColors/readColors';
import { requestColorReading } from '../workers/fromColorsClient';
import './fromColors.css';

type T = (key: string, params?: Record<string, string | number>) => string;
type ValidColors = Extract<ColorReading, { ok: true }>;

function StickerNet({ layout, painted, issues, disabled, paint, t }: {
    layout: ColorLayout;
    painted: Painted;
    issues: ColorIssue[];
    disabled: boolean;
    paint: (id: string) => void;
    t: T;
}) {
    const host = useRef<HTMLDivElement>(null);
    const targets = useRef<{ primary: SVGElement; surfaces: SVGElement[] }[]>([]);

    useLayoutEffect(() => {
        const node = host.current;
        if (!node) return;
        // Only the bundled cubing.js net is parsed as markup.
        const svg = new DOMParser().parseFromString(layout.svg, 'image/svg+xml').documentElement;
        node.replaceChildren(svg);
        const copies = [...node.querySelectorAll<SVGElement>('[data-copy-id]')];
        const elements = new Map([...node.querySelectorAll<SVGElement>('[id]')].map((el) => [el.id, el]));
        targets.current = layout.stickers.map(({ id, aliases }) => {
            const primary = elements.get(id)!;
            const ids = new Set([id, ...aliases]);
            const surfaces = [
                primary,
                ...aliases.map((alias) => elements.get(alias)!),
                ...copies.filter((copy) => ids.has(copy.getAttribute('data-copy-id')!)),
            ];
            primary.setAttribute('role', 'button');
            primary.dataset.colorSticker = id;
            for (const surface of surfaces) surface.dataset.paintSticker = id;
            return { primary, surfaces };
        });
    }, [layout]);

    useLayoutEffect(() => {
        const marked = new Set(issues.flatMap((issue) => issue.stickers));
        layout.stickers.forEach(({ id, aliases }, index) => {
            const { primary, surfaces } = targets.current[index];
            const color = painted[id];
            const highlight = marked.has(id) || aliases.some((alias) => marked.has(alias));
            primary.setAttribute('tabindex', disabled ? '-1' : '0');
            primary.setAttribute('aria-disabled', String(disabled));
            primary.setAttribute('aria-label', t('fromColorsSticker', {
                number: index + 1,
                color: color ? t('fromColorsColor_' + layout.names[color]) : t('fromColorsUnpainted'),
            }));
            for (const surface of surfaces) {
                surface.style.fill = color ?? '#808080';
                surface.toggleAttribute('data-color-issue', highlight);
            }
        });
    }, [disabled, issues, layout, painted, t]);

    function paintTarget(target: EventTarget) {
        if (disabled || !(target instanceof Element)) return;
        const id = target.closest<SVGElement>('[data-paint-sticker]')?.dataset.paintSticker;
        if (id) paint(id);
    }

    return (
        <div className="color-net" role="group" aria-label={t('fromColorsNet')} data-testid="from-colors-net"
            ref={host} onClick={(e) => paintTarget(e.target)}
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof Element
                    && e.target.hasAttribute('data-color-sticker')) {
                    e.preventDefault();
                    if (!e.repeat) paintTarget(e.target);
                }
            }}
        />
    );
}

export function ColorEditor({ puzzle, disabled, onRead, onEdit, t }: {
    puzzle: ColorPuzzle;
    disabled: boolean;
    onRead: (colors: ValidColors) => void;
    onEdit: () => void;
    t: T;
}) {
    const [layout, setLayout] = useState<ColorLayout>();
    const [painted, setPainted] = useState<Painted>({});
    const [selected, setSelected] = useState('');
    const [issues, setIssues] = useState<ColorIssue[]>([]);
    const [failed, setFailed] = useState(false);
    const [reading, setReading] = useState(false);
    const pending = useRef<AbortController>();
    const onReadLatest = useRef(onRead);
    useLayoutEffect(() => {
        onReadLatest.current = onRead;
    }, [onRead]);

    useEffect(() => {
        let active = true;
        import('../core/fromColors/readColors')
            .then(async ({ colorLayout }) => {
                const layout = await colorLayout(puzzle);
                if (active) {
                    setSelected(layout.palette[0]);
                    setLayout(layout);
                }
            })
            .catch((error: unknown) => {
                if (active) {
                    console.error('CubeLab color editor', error);
                    setFailed(true);
                }
            });
        return () => {
            active = false;
            pending.current?.abort();
            pending.current = undefined;
        };
    }, [puzzle]);

    if (!layout) return failed
        ? <p role="alert">{t('fromColorsReadError')}</p>
        : <p role="status">{t('aLoading')}</p>;

    const busy = disabled || reading;
    const name = (color: string) => t('fromColorsColor_' + layout.names[color]);
    function update(next: Painted) {
        setPainted(next);
        setIssues([]);
        setFailed(false);
        onEdit();
    }

    async function solve() {
        if (disabled || pending.current) return;
        const request = new AbortController();
        pending.current = request;
        setReading(true);
        setFailed(false);
        setIssues([]);
        onEdit();
        try {
            const result = await requestColorReading({ kind: 'readColors', puzzle, painted }, request.signal);
            if (request.signal.aborted) return;
            if (result.ok) onReadLatest.current(result);
            else setIssues(result.issues);
        } catch (error) {
            if (!request.signal.aborted) {
                console.error('CubeLab color reading', error);
                setFailed(true);
            }
        } finally {
            if (pending.current === request) {
                pending.current = undefined;
                setReading(false);
            }
        }
    }

    return (
        <div className="color-editor">
            <div className="color-palette" role="group" aria-label={t('fromColorsPalette')}>
                {layout.palette.map((color) => (
                    <button key={color} type="button" disabled={busy} aria-pressed={selected === color}
                        onClick={() => setSelected(color)}>
                        <span aria-hidden="true" style={{ backgroundColor: color }} />
                        {name(color)}
                    </button>
                ))}
            </div>
            <p aria-live="polite">{t('fromColorsSelected', { color: name(selected) })}</p>
            <StickerNet layout={layout} painted={painted} issues={issues} disabled={busy} t={t}
                paint={(id) => update({ ...painted, [id]: selected })} />
            <div className="solver-controls">
                <button type="button" disabled={busy}
                    onClick={() => update(Object.fromEntries(layout.stickers.map(({ id, solved }) => [id, solved])))}>
                    {t('fromColorsSolved')}
                </button>
                <button type="button" disabled={busy} onClick={() => update({})}>{t('fromColorsClear')}</button>
                <button type="button" disabled={busy} onClick={() => void solve()}>{t('fromColorsSolve')}</button>
            </div>
            {reading && <p role="status">{t('fromColorsReading')}</p>}
            {failed && <p role="alert">{t('fromColorsReadError')}</p>}
            {issues.length > 0 && (
                <ul role="alert">
                    {issues.map(({ key, params }, index) => (
                        <li key={key + index}>
                            {t(key, typeof params?.color === 'string'
                                ? { ...params, color: t('fromColorsColor_' + params.color) }
                                : params)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
