const basic = ['R', 'L', 'U', 'D', 'F', 'B', "R'", 'R2'];
export function glossary(puzzle: string, group?: 'basic' | 'advanced') {
    const advanced = ['x', 'y', 'z', ...(puzzle === '222' ? [] : ['Rw', 'r', 'M', 'E', 'S'])];
    const moves = group === 'basic' ? basic : group === 'advanced' ? advanced : [...basic, ...advanced];
    return moves.map((move) => ({
        move,
        alg: move,
        descriptionKey: 'aMove_' + (move === "R'" ? 'prime' : move),
    }));
}
export function family(move: string) {
    const name = move.replace(/(?:2'?|')$/, '');
    return name.length === 1 && /[rludfb]/.test(name) ? name.toUpperCase() + 'w' : name;
}
export function taughtFamilies(puzzle: string, group: 'basic' | 'advanced') {
    return new Set([
        ...glossary(puzzle, group).map((entry) => family(entry.move)),
        ...(group === 'advanced' && puzzle !== '222' ? ['Lw', 'Uw', 'Dw', 'Fw', 'Bw'] : []),
    ]);
}
