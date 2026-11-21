export function parseTime(input: string): number | null {
    const match = /^(?:(\d+):([0-5]\d)|(\d+))(?:\.(\d{1,2}))?$/.exec(input.trim());
    if (!match) return null;
    const seconds = match[3] ? Number(match[3]) : Number(match[1]) * 60 + Number(match[2]);
    const ms = seconds * 1000 + Number((match[4] ?? '').padEnd(2, '0')) * 10;
    return ms > 0 && Number.isSafeInteger(ms) ? ms : null;
}

export function formatTime(ms: number) {
    const cs = Math.floor(Math.max(0, ms) / 10);
    const sec = Math.floor(cs / 100);
    return (
        (sec >= 60 ? Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0') : String(sec)) +
        '.' +
        String(cs % 100).padStart(2, '0')
    );
}
