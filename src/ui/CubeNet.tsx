const colors: Record<string, string> = {
    U: '#fff',
    D: '#ffda34',
    F: '#21ae69',
    B: '#3883dd',
    R: '#db4840',
    L: '#ff973c',
};
// sticker index follows the positive coordinate axes in cubeModel.
const faces = [
    { face: 2, x: 1, y: 0, index: (r: number, c: number, n: number) => r * n + c },
    { face: 1, x: 0, y: 1, index: (r: number, c: number, n: number) => (n - 1 - r) * n + c },
    { face: 4, x: 1, y: 1, index: (r: number, c: number, n: number) => c * n + n - 1 - r },
    { face: 0, x: 2, y: 1, index: (r: number, c: number, n: number) => (n - 1 - r) * n + n - 1 - c },
    { face: 5, x: 3, y: 1, index: (r: number, c: number, n: number) => (n - 1 - c) * n + n - 1 - r },
    { face: 3, x: 1, y: 2, index: (r: number, c: number, n: number) => (n - 1 - r) * n + c },
];
export function CubeNet({ state, label }: { state: string; label: string }) {
    const n = Math.sqrt(state.length / 6);
    return (
        <svg viewBox="0 0 160 120" role="img" aria-label={label}>
            {faces.map(({ face, x, y, index }) => (
                <g key={face} transform={`translate(${40 * x} ${40 * y})`}>
                    {Array.from({ length: n * n }, (_, i) => {
                        const r = Math.floor(i / n),
                            c = i % n;
                        return (
                            <rect
                                key={i}
                                x={(c * 40) / n + 0.8}
                                y={(r * 40) / n + 0.8}
                                width={40 / n - 1.6}
                                height={40 / n - 1.6}
                                rx="1"
                                fill={colors[state[face * n * n + index(r, c, n)]]}
                            />
                        );
                    })}
                </g>
            ))}
        </svg>
    );
}
