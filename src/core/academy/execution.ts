import { Alg, Move } from 'cubing/alg';

const rotations = new Set(['x', 'y', 'z']);

export function finalRotation(algorithm: Alg) {
    const moves = [...algorithm.experimentalExpand()].filter(
        (node): node is Move => node instanceof Move && rotations.has(node.quantum.toString()),
    );
    return new Alg(moves);
}

export function inverseInInitialFrame(algorithm: Alg) {
    // If A = fixed-frame moves followed by G, then G A⁻¹ sets up the case
    // with the same top and front as the solved cube before the opening moves.
    return finalRotation(algorithm).concat(algorithm.invert());
}

export function openingMoves(sequence: string) {
    const nodes = [...new Alg(sequence).childAlgNodes()];
    const steps: { key: 'aRotateCube' | 'aAdjustUpper'; move: string }[] = [];
    for (const node of nodes) {
        if (!(node instanceof Move)) break;
        const face = node.quantum.toString();
        if (rotations.has(face)) steps.push({ key: 'aRotateCube', move: node.toString() });
        else if (face === 'U') steps.push({ key: 'aAdjustUpper', move: node.toString() });
        else break;
    }
    return { steps, body: new Alg(nodes.slice(steps.length)).toString() };
}
