import { useEffect, useLayoutEffect, useRef, useReducer, useState } from 'react';
import type { EventRules } from '../core/contracts';
import { TimerMachine, type Finish } from '../core/timer/machine';

interface Options {
    rules: EventRules;
    inspection: boolean;
    threshold: number;
    enabled: boolean;
    sound?: boolean;
    splits?: boolean;
    vibration?: boolean;
    finish: (result: Finish) => void;
}
export function useTimerInput(options: Options) {
    const [machine] = useState(() => new TimerMachine(() => performance.now()));
    const [, render] = useReducer((x) => x + 1, 0);
    const area = useRef<HTMLDivElement>(null);
    const latest = useRef(options);
    useLayoutEffect(() => {
        latest.current = options;
    });
    const active = ['inspecting', 'holding', 'ready', 'running'].includes(machine.phase);

    useEffect(() => {
        const element = area.current!;
        const pointers = new Set<number>();
        let audio: AudioContext | undefined;
        // Bind session and scramble to the initial press, including inspection.
        let finishAttempt: Options['finish'] | undefined;
        let alerts = 0,
            frame = 0;
        function redraw() {
            machine.tick();
            if (machine.phase === 'idle' || machine.inspectionStart === null) alerts = 0;
            if (
                machine.inspectionStart !== null &&
                ['inspecting', 'holding', 'ready'].includes(machine.phase)
            ) {
                const elapsed = performance.now() - machine.inspectionStart;
                const mark = elapsed >= 12000 ? 2 : elapsed >= 8000 ? 1 : 0;
                if (mark > alerts) {
                    alerts = mark;
                    try {
                        if (latest.current.sound !== false && audio?.state === 'running') {
                            const tone = audio.createOscillator(),
                                gain = audio.createGain();
                            gain.gain.value = 0.09;
                            tone.frequency.value = mark === 1 ? 740 : 960;
                            tone.connect(gain);
                            gain.connect(audio.destination);
                            tone.start();
                            tone.stop(audio.currentTime + 0.12);
                            tone.onended = () => {
                                tone.disconnect();
                                gain.disconnect();
                            };
                        }
                        if (latest.current.vibration !== false) navigator.vibrate?.(100);
                    } catch {
                        /* optional feedback */
                    }
                }
            }
            render();
        }
        function animate() {
            frame = 0;
            redraw();
            if (['inspecting', 'holding', 'ready', 'running'].includes(machine.phase))
                frame = requestAnimationFrame(animate);
        }
        function down(id: string, repeat = false) {
            const opt = latest.current;
            if (!opt.enabled && machine.phase === 'idle') return;
            const before = machine.phase;
            machine.down(id, opt.rules, opt.inspection, opt.threshold, repeat);
            if (before === 'idle' && machine.phase !== 'idle') finishAttempt = opt.finish;
            if (before === 'idle' && machine.phase === 'inspecting' && opt.sound !== false) {
                try {
                    audio ??= new AudioContext();
                    void audio.resume().catch(() => {});
                } catch {
                    /* optional audio */
                }
            }
            if (before === 'running' && machine.result) finishAttempt?.(machine.result);
            redraw();
            if (!frame && machine.phase !== 'idle') frame = requestAnimationFrame(animate);
        }
        const key = (e: KeyboardEvent) => {
            if (e.isComposing) return;
            if (machine.phase === 'running') {
                if (e.target instanceof Element && e.target.closest('[data-timer-split]') &&
                    (e.code === 'Space' || e.code === 'Enter')) return;
                e.preventDefault();
                if (latest.current.splits && e.code === 'KeyM' && !e.repeat) {
                    machine.markExecution();
                    redraw();
                    return;
                }
                down('key:' + e.code, e.repeat);
                return;
            }
            if (
                e.code !== 'Space' ||
                (e.target instanceof Element &&
                    e.target.closest('input,textarea,select,button,a,summary,[contenteditable=true]'))
            )
                return;
            e.preventDefault();
            down('key:Space', e.repeat);
        };
        const up = (e: KeyboardEvent) => {
            machine.up('key:' + e.code);
            redraw();
        };
        const press = (e: PointerEvent) => {
            if (e.target instanceof Element && e.target.closest('[data-timer-split]')) return;
            const inside = element.contains(e.target as Node);
            if (!inside && !pointers.size && machine.phase !== 'running') return;
            e.preventDefault();
            pointers.add(e.pointerId);
            if (pointers.size > 1) {
                if (machine.phase === 'holding' || machine.phase === 'ready') down('ptr:' + e.pointerId);
                else machine.cancelPreparation();
                redraw();
                return;
            }
            try {
                element.setPointerCapture(e.pointerId);
            } catch {
                /* pointer already lost */
            }
            element.focus({ preventScroll: true });
            down('ptr:' + e.pointerId);
        };
        const release = (e: PointerEvent) => {
            if (!pointers.delete(e.pointerId)) return;
            machine.up('ptr:' + e.pointerId);
            redraw();
        };
        const cancel = (e: PointerEvent) => {
            if (pointers.delete(e.pointerId)) {
                machine.cancelPreparation();
                redraw();
            }
        };
        const blur = () => {
            pointers.clear();
            machine.cancelPreparation();
            redraw();
        };
        window.addEventListener('keydown', key, true);
        window.addEventListener('keyup', up, true);
        window.addEventListener('pointerdown', press, { capture: true, passive: false });
        window.addEventListener('pointerup', release, true);
        window.addEventListener('pointercancel', cancel, true);
        element.addEventListener('lostpointercapture', cancel);
        window.addEventListener('blur', blur);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('keydown', key, true);
            window.removeEventListener('keyup', up, true);
            window.removeEventListener('pointerdown', press, true);
            window.removeEventListener('pointerup', release, true);
            window.removeEventListener('pointercancel', cancel, true);
            element.removeEventListener('lostpointercapture', cancel);
            window.removeEventListener('blur', blur);
            void audio?.close().catch(() => {});
        };
    }, [machine]);

    useEffect(() => {
        if (!active || !navigator.wakeLock) return;
        let disposed = false,
            lock: WakeLockSentinel | undefined;
        async function acquire() {
            if (document.visibilityState !== 'visible' || (lock && !lock.released)) return;
            try {
                const acquired = await navigator.wakeLock.request('screen');
                if (disposed) await acquired.release();
                else lock = acquired;
            } catch {
                /* optional browser capability */
            }
        }
        void acquire();
        document.addEventListener('visibilitychange', acquire);
        return () => {
            disposed = true;
            document.removeEventListener('visibilitychange', acquire);
            void lock?.release().catch(() => {});
        };
    }, [active]);
    return {
        machine,
        area,
        markExecution: () => { machine.markExecution(); render(); },
        saved: () => {
            machine.saved();
            render();
        },
    };
}
