const common = ['R', 'L', 'U', 'D', 'F', 'B', "R'", 'R2', 'x', 'y', 'z'];
export function glossary(puzzle: string) {
    return [...common, ...(puzzle === '333' ? ['Rw', 'r', 'M', 'E', 'S'] : [])].map((move) => ({
        move,
        alg: move,
        descriptionKey: 'aMove_' + (move === "R'" ? 'prime' : move),
    }));
}
