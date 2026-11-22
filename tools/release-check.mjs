import console from 'node:console';
import process from 'node:process';
import { devFlags } from '../src/config/devFlags.ts';

const active = Object.entries(devFlags)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);
if (active.length) {
    console.error('DEV-FLAG activos: ' + active.join(', '));
    process.exitCode = 1;
} else {
    console.log('DEV-FLAG: todos apagados.');
}
