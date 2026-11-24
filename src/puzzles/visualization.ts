// In cubing.js 0.63.8 Clock and Square-1 resolve even a 3D request to SVG.
export function supportsTwisty3d(puzzle: string) {
    return puzzle !== 'clock' && puzzle !== 'square1' && puzzle !== 'pyraminx-duo';
}
