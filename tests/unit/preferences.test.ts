import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { CubeDatabase } from '../../src/core/storage/db';
import { clearAllData, defaults, readPreferences } from '../../src/core/storage/preferences';
import { storageKey } from '../../src/config/storageScope';

it('conserva preferencias válidas y normaliza valores heredados o inválidos', () => {
    expect(readPreferences([])).toEqual(defaults);
    expect(
        readPreferences([
            { key: 'holdMs', value: '0' },
            { key: 'inspection', value: 'off' },
            { key: 'theme', value: 'light' },
            { key: 'timerPreview', value: '3D' },
            { key: 'sounds', value: 'off' },
            { key: 'language', value: 'unsupported' },
        ]),
    ).toMatchObject({
        holdMs: 0,
        inspection: 'off',
        theme: 'light',
        timerPreview: '3D',
        sounds: 'off',
        language: 'es',
    });
    expect(readPreferences([{ key: 'holdMs', value: '' }]).holdMs).toBe(300);
    expect(readPreferences([{ key: 'holdMs', value: '3001' }]).holdMs).toBe(300);
});

it('borra todas las tablas y solo las claves locales de esta instalación', async () => {
    const db = new CubeDatabase('preferences-clear');
    const keys = new Map([
        [storageKey('onboarded'), 'yes'],
        [storageKey('pending.123'), '{}'],
        ['other-app.item', 'keep'],
    ]);
    const storage: Storage = {
        get length() {
            return keys.size;
        },
        key: (i) => [...keys.keys()][i] ?? null,
        getItem: (k) => keys.get(k) ?? null,
        setItem: (k, v) => {
            keys.set(k, v);
        },
        removeItem: (k) => {
            keys.delete(k);
        },
        clear: () => keys.clear(),
    };
    try {
        await db.settings.add({ key: 'theme', value: 'light' });
        await db.sessions.add({
            id: 'default:333',
            name: '',
            eventId: '333',
            puzzleId: '333',
            createdAt: 0,
        });
        await clearAllData(db, storage);
        expect(await Promise.all(db.tables.map((t) => t.count()))).toEqual(db.tables.map(() => 0));
        expect([...keys]).toEqual([['other-app.item', 'keep']]);
    } finally {
        await db.delete();
    }
});
