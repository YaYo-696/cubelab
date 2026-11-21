const colors: Record<string, string> = { R: '#ed6749', L: '#ffab53', U: '#f5e9ce', D: '#f8d460', F: '#72cfb1', B: '#509be0' };
// Project the up, front and right sticker grids onto three rhombi.
export function CubePreview({ state, label }: {
    state: string;
    label: string;
}) {
    const n = Math.sqrt(state.length / 6);
    const group = (offset: number, index: (row: number, col: number) => number, transform: string) => <g transform={transform}>{Array.from({ length: n * n }, (_, i) => {
            const r = Math.floor(i / n), c = i % n;
            return <rect key={i} x={c * 100 / n + 1} y={r * 100 / n + 1} width={100 / n - 2} height={100 / n - 2} rx="2" fill={colors[state[offset * n * n + index(r, c)]]}/>;
        })}</g>;
    return <svg viewBox="0 0 208 210" role="img" aria-label={label}>
    {group(2, (r, c) => r * n + c, 'matrix(.88 .45 -.88 .45 104 15)')}
    {group(4, (r, c) => c * n + n - 1 - r, 'matrix(.88 .45 0 1 16 60)')}
    {group(0, (r, c) => (n - 1 - r) * n + n - 1 - c, 'matrix(.88 -.45 0 1 104 105)')}
  </svg>;
}
