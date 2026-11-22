import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import console from 'node:console';

const root = path.resolve(process.argv[2] ?? 'dist');
const read = (file) => fs.readFileSync(path.join(root, file));
const manifest = JSON.parse(read('manifest.webmanifest'));
const sw = read('sw.js').toString();
const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};
assert(
    manifest.name && manifest.short_name && manifest.display === 'standalone',
    'Missing standalone manifest fields',
);
assert(
    manifest.id === './' && manifest.start_url === './' && manifest.scope === './',
    'Manifest scope is not local to its deployment',
);
for (const size of [192, 512]) {
    const icon = manifest.icons?.find((entry) => entry.sizes === size + 'x' + size);
    assert(icon?.src && icon.type === 'image/png', 'Missing PNG icon (' + size + ')');
    const binary = read(icon.src);
    assert(
        binary.readUInt32BE(16) === size && binary.readUInt32BE(20) === size,
        'Unexpected PNG dimensions for ' + icon.src,
    );
    assert(sw.includes(icon.src), 'Icon not in precache: ' + icon.src);
}
const files = fs.readdirSync(path.join(root, 'assets'));
for (const feature of [
    'Timer-',
    'Academy-',
    'Solver-',
    'Trainer-',
    'puzzle.worker-',
    'case.worker-',
    'solver.worker-',
    'twisty-dynamic-3d-',
]) {
    const match = files.find((file) => file.startsWith(feature) && file.endsWith('.js'));
    assert(match && sw.includes('assets/' + match), 'Feature not in precache: ' + feature);
}
assert(sw.includes('index.html'), 'Offline start page is missing from precache');
console.log('Manifest, icon sizes and offline precache verified.');
