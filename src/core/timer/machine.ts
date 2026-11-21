import type { EventRules } from '../contracts';
import type { Solve } from '../storage/db';

export type Phase = 'idle' | 'inspecting' | 'holding' | 'ready' | 'running' | 'stopped';
export type Penalty = Solve['penalty'];
export type Finish = { timeMs: number; penalty: Penalty };

export class TimerMachine {
    phase: Phase = 'idle';
    inspectionStart: number | null = null;
    heldAt = 0;
    startedAt = 0;
    result: Finish | null = null;
    private owner: string | null = null;
    private stored = false;
    private inspectMs = 0;
    private threshold = 300;
    constructor(private readonly now: () => number) {}

    down(id: string, rules: EventRules, inspection: boolean, holdMs: number, repeat = false) {
        if (repeat) return;
        const now = this.now();
        if (this.phase === 'running') {
            this.result = {
                timeMs: Math.max(0, Math.floor(now - this.startedAt)),
                penalty: this.penalty(this.startedAt),
            };
            this.owner = id;
            this.phase = 'stopped';
            return;
        }
        if (id.startsWith('ptr:') && this.owner?.startsWith('ptr:') && id !== this.owner) {
            this.cancelPreparation();
            return;
        }
        if (this.owner !== null || (this.phase !== 'idle' && this.phase !== 'inspecting')) return;
        this.owner = id;
        if (this.phase === 'idle') {
            this.threshold = holdMs;
            this.inspectMs = inspection ? (rules.inspectionSeconds ?? 0) * 1000 : 0;
            if (this.inspectMs) {
                this.inspectionStart = now;
                this.phase = 'inspecting';
                return;
            }
        }
        this.heldAt = now;
        this.phase = 'holding';
    }
    tick(at = this.now()) {
        if (this.phase === 'holding' && at - this.heldAt >= this.threshold) this.phase = 'ready';
    }
    up(id: string) {
        if (this.owner !== id) return;
        this.owner = null;
        const releasedAt = this.now();
        this.tick(releasedAt);
        if (this.phase === 'holding') this.cancelPreparation();
        else if (this.phase === 'ready') {
            this.startedAt = releasedAt;
            this.phase = 'running';
        } else if (this.phase === 'stopped') this.resetIfStored();
    }
    cancelPreparation() {
        this.owner = null;
        if (this.phase === 'ready' || this.phase === 'holding')
            this.phase = this.inspectionStart === null ? 'idle' : 'inspecting';
        if (this.phase === 'stopped') this.resetIfStored();
    }
    penalty(at: number): Penalty {
        if (this.inspectionStart === null) return 'none';
        const elapsed = at - this.inspectionStart;
        return elapsed >= this.inspectMs + 2000 ? 'dnf' : elapsed >= this.inspectMs ? '+2' : 'none';
    }
    saved() {
        this.stored = true;
        this.resetIfStored();
    }
    private resetIfStored() {
        if (!this.stored || this.owner !== null) return;
        this.phase = 'idle';
        this.inspectionStart = null;
        this.result = null;
        this.stored = false;
    }
}
