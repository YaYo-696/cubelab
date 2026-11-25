import type { Page } from '@playwright/test';
import { puzzles } from 'cubing/puzzles';
import { clockDialsOf } from '../../src/core/fromColors/readClock';
import { clockPlayerAlg } from '../../src/puzzles/sideEvents/clock';
import { square1Solved, square1State } from '../../src/puzzles/sideEvents/square1';
import { expect, test } from './fixtures';

const clockMix = 'UR3+ DR1- DL6+ UL2- U4+ R5- D0+ L1+ ALL2- y2 U3- R6+ D1+ L4- ALL5+';
const squareMix = '(0, -1) /';

async function openSolver(page: Page, puzzle: 'clock' | 'sq1') {
    await page.goto('/');
    await page.getByRole('link', { name: 'Solucionador', exact: true }).click();
    await page.getByRole('combobox', { name: 'Puzzle', exact: true }).selectOption(puzzle);
}

async function useMix(page: Page, mix: string) {
    await page.getByRole('textbox', { name: 'Mezcla', exact: true }).fill(mix);
    await page.getByRole('button', { name: 'Resolver', exact: true }).click();
}

async function solutionOf(page: Page) {
    const output = page.getByTestId('side-solution');
    await expect(output).toBeVisible({ timeout: 35000 });
    await expect(page.getByTestId('academy-player')).toHaveAttribute('data-visualization', '2D');
    return (await output.getAttribute('data-alg')) ?? '';
}

async function expectClockSolved(solution: string) {
    expect(solution).not.toBe('');
    const clock = await puzzles.clock.kpuzzle();
    const final = clock.defaultPattern().applyAlg(clockMix).applyAlg(solution);
    expect(final.patternData.DIALS.orientation).toEqual(Array(18).fill(0));
}

test('resuelve Clock desde esferas y deriva las cuatro esquinas del reverso', async ({ page }) => {
    await openSolver(page, 'clock');
    await page.getByRole('combobox', { name: 'Entrada del solucionador', exact: true }).selectOption('pieces');
    const dials = await clockDialsOf(clockMix);
    for (const [index, value] of dials.front.entries()) {
        await expect(page.getByTestId('clock-front-' + index)).toHaveValue('12');
        await page.getByTestId('clock-front-' + index).selectOption(String(value || 12));
    }
    for (const [index, value] of dials.back.entries()) {
        const dial = page.getByTestId('clock-back-' + index);
        if ([0, 2, 6, 8].includes(index)) {
            await expect(dial).toBeDisabled();
            await expect(dial).toHaveValue(String(value || 12));
        } else {
            await dial.selectOption(String(value || 12));
        }
    }
    await page.getByRole('button', { name: 'Resolver mi puzzle', exact: true }).click();
    await expectClockSolved(await solutionOf(page));
});

test('resuelve Clock desde mezcla con pines al final', async ({ page }) => {
    await openSolver(page, 'clock');
    await useMix(page, clockMix + ' UR DR');
    expect(await clockDialsOf(clockPlayerAlg(clockMix + ' UR DR'))).toEqual(await clockDialsOf(clockMix));
    await expectClockSolved(await solutionOf(page));
});

test('resuelve Square-1 desde mezcla y muestra la vista plana', async ({ page }) => {
    await openSolver(page, 'sq1');
    await useMix(page, squareMix);
    const solution = await solutionOf(page);
    expect(solution).not.toBe('');
    expect(square1State(squareMix + ' ' + solution)).toBe(square1Solved);
    await expect(page.getByText(/Compara tu puzzle con la vista plana/)).toBeVisible();
});

async function placePieces(page: Page, state: string) {
    for (const [layer, label, start] of [
        ['top', 'Capa de arriba', 0],
        ['bottom', 'Capa de abajo', 12],
    ] as const) {
        await page.getByRole('button', { name: label, exact: true }).click();
        const slots = [...state.slice(start, start + 12)];
        for (const piece of slots.filter((id, index) => index === 0 || slots[index - 1] !== id)) {
            await page.getByTestId('sq1-piece-' + piece).click();
        }
        await expect(page.getByTestId('sq1-layer-' + layer)).toContainText('12/12');
    }
    await page.getByRole('checkbox', { name: /capa del medio está alineada/i }).setChecked(state[24] === '0');
}

test('resuelve Square-1 desde piezas en estado resuelto y mezclado, y señala duplicados', async ({ page }) => {
    await openSolver(page, 'sq1');
    await page.getByRole('combobox', { name: 'Entrada del solucionador', exact: true }).selectOption('pieces');
    const solve = page.getByRole('button', { name: 'Resolver mi puzzle', exact: true });
    await placePieces(page, square1Solved);
    await solve.click();
    expect(await solutionOf(page)).toBe('');

    await page.getByRole('button', { name: 'Limpiar', exact: true }).click();
    await placePieces(page, square1State(squareMix));
    await solve.click();
    const solution = await solutionOf(page);
    expect(solution).not.toBe('');
    expect(square1State(squareMix + ' ' + solution)).toBe(square1Solved);

    await page.getByTestId('sq1-piece-A').click();
    await solve.click();
    await expect(page.getByRole('alert')).toContainText('Hay piezas que aparecen dos veces: A');
    await expect(page.getByTestId('sq1-piece-A')).toHaveAttribute('data-invalid', 'true');
    await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
});
