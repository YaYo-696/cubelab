import { storageKey } from '../../config/storageScope';
import { db, type CubeDatabase } from './db';

const options = {
    language: ['es', 'en'],
    theme: ['dark', 'light'],
    timerSize: ['normal', 'large', 'compact'],
    inspection: ['on', 'off'],
    sounds: ['on', 'off'],
    vibration: ['on', 'off'],
    cubeColors: ['wca', 'contrast'],
    timerPreview: ['2D', '3D'],
    onboardingDone: ['yes', 'no'],
} as const;
export type Preferences = { [K in keyof typeof options]: (typeof options)[K][number] } & {
    holdMs: number;
};
export const defaults: Preferences = {
    language: 'es',
    theme: 'dark',
    timerSize: 'normal',
    holdMs: 300,
    inspection: 'on',
    sounds: 'on',
    vibration: 'on',
    cubeColors: 'wca',
    timerPreview: '2D',
    onboardingDone: 'no',
};
type Stored = { key: string; value: string };
export function readHoldMs(value?: string) {
    const ms = Number(value ?? defaults.holdMs);
    return Number.isInteger(ms) && ms >= 0 && ms <= 3000 && value !== '' ? ms : defaults.holdMs;
}
function preference<K extends keyof typeof options>(
    key: K,
    values: Map<string, string>,
): Preferences[K] {
    const label = values.get(key) as Preferences[K];
    return (options[key] as readonly string[]).includes(label) ? label : defaults[key];
}
export function readPreferences(rows: readonly Stored[]): Preferences {
    const values = new Map(rows.map(({ key, value }) => [key, value]));
    return {
        language: preference('language', values),
        theme: preference('theme', values),
        timerSize: preference('timerSize', values),
        holdMs: readHoldMs(values.get('holdMs')),
        inspection: preference('inspection', values),
        sounds: preference('sounds', values),
        vibration: preference('vibration', values),
        cubeColors: preference('cubeColors', values),
        timerPreview: preference('timerPreview', values),
        onboardingDone: preference('onboardingDone', values),
    };
}
export function savePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    return db.settings.put({ key, value: String(value) });
}
export function finishOnboarding() {
    return savePreference('onboardingDone', 'yes');
}
export async function clearAllData(database: CubeDatabase = db, storage?: Storage) {
    await database.transaction('rw', database.tables, async () => {
        await Promise.all(database.tables.map((table) => table.clear()));
    });
    let local: Storage | undefined;
    try {
        local = storage ?? globalThis.localStorage;
    } catch {
        return;
    }
    if (local) {
        const prefix = storageKey('');
        const keys = Array.from({ length: local.length }, (_, index) => local.key(index));
        for (const key of keys) if (key?.startsWith(prefix)) local.removeItem(key);
    }
}
