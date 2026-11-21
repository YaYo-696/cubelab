import { describe, expect, it } from 'vitest';
import { TimerMachine } from '../../src/core/timer/machine';
import { cubeEvent } from '../../src/puzzles/events';

function setup(inspect = false, blind = false) {
    let now = 0;
    const timer = new TimerMachine(() => now);
    const down = (id = 'key:Space', repeat = false) =>
        timer.down(id, cubeEvent('333', blind), inspect, 300, repeat);
    return {
        timer,
        down,
        up: (id = 'key:Space') => timer.up(id),
        at: (ms: number) => {
            now = ms;
        },
    };
}
describe('cronómetro con reloj monótono simulado', () => {
    it('suelta un ms antes del umbral, y arranca exactamente a 300 ms sin esperar otro frame', () => {
        const { timer, down, up, at } = setup();
        down();
        at(299);
        up();
        expect(timer.phase).toBe('idle');
        down();
        at(599);
        up();
        expect(timer.phase).toBe('running');
        at(1833);
        down('key:Q');
        expect(timer.result).toEqual({ timeMs: 1234, penalty: 'none' });
        timer.saved();
        expect(timer.phase).toBe('stopped');
        up('key:Q');
        expect(timer.phase).toBe('idle');
    });
    it.each([
        [14999, 'none'],
        [15000, '+2'],
        [16999, '+2'],
        [17000, 'dnf'],
    ] as const)('inspección %i ms → %s', (elapsed, penalty) => {
        const { timer, down, up, at } = setup(true);
        down();
        up();
        expect(timer.phase).toBe('inspecting');
        at(elapsed - 300);
        down();
        at(elapsed);
        timer.tick();
        expect(timer.phase).toBe('ready');
        up();
        expect(timer.phase).toBe('running');
        at(elapsed + 45);
        down();
        up();
        expect(timer.result).toEqual({ timeMs: 45, penalty });
        timer.saved();
        expect(timer.phase).toBe('idle');
    });
    it('ignora autorepetición durante preparación y carrera', () => {
        const { timer, down, up, at } = setup();
        down();
        at(170);
        down('key:Space', true);
        at(300);
        up();
        down('key:Space', true);
        expect(timer.phase).toBe('running');
    });
    it.each([false, true])('cancelación de toque conserva el origen, inspección=%s', (inspection) => {
        const { timer, down, up, at } = setup(inspection);
        if (inspection) {
            down('ptr:1');
            up('ptr:1');
        }
        at(100);
        down('ptr:1');
        at(400);
        timer.tick();
        timer.cancelPreparation();
        up('ptr:1');
        expect(timer.phase).toBe(inspection ? 'inspecting' : 'idle');
        expect(timer.inspectionStart).toBe(inspection ? 0 : null);
    });
    it('un segundo dedo cancela la preparación y ambas liberaciones son inocuas', () => {
        const { timer, down, up, at } = setup();
        down('ptr:1');
        at(300);
        timer.tick();
        down('ptr:2');
        up('ptr:2');
        up('ptr:1');
        expect(timer.phase).toBe('idle');
        expect(timer.result).toBeNull();
    });
    it('333bf omite inspección aunque esté activada', () => {
        const { timer, down, up, at } = setup(true, true);
        down();
        expect(timer.phase).toBe('holding');
        at(300);
        up();
        expect(timer.phase).toBe('running');
        expect(timer.inspectionStart).toBeNull();
    });
});
