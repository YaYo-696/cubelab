/** DEV-FLAG entries must be false before release. */
export const devFlags = {
    // DEV-FLAG: bypass all progress gates while still recording real progress.
    UNLOCK_ALL: true,
};

export function unlockAllProgress() {
    if (!devFlags.UNLOCK_ALL) return false;
    // A development browser test can exercise the release gates. This cannot unlock a release.
    try {
        return (
            typeof sessionStorage === 'undefined' ||
            sessionStorage.getItem('cubelab.test.progressGates') !== 'on'
        );
    } catch {
        return true;
    }
}
