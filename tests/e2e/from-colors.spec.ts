import type { Page } from '@playwright/test';
import { colorLayout, colorsOf, type ColorPuzzle } from '../../src/core/fromColors/readColors';
import { expect, test } from './fixtures';

test.beforeEach(({ page }) => {
    page.on('console', (message) => {
        if (message.type() === 'error' && message.text().startsWith('CubeLab color'))
            console.error(message.text());
    });
    page.on('pageerror', (error) => console.error(error.stack ?? error.message));
});

async function openEditor(page: Page, puzzle: ColorPuzzle) {
    await page.goto('/');
    await page.getByRole('link', { name: 'Solucionador', exact: true }).click();
    await page.getByRole('combobox', { name: 'Puzzle', exact: true }).selectOption(puzzle);
    await page.getByRole('combobox', { name: 'Entrada del solucionador', exact: true }).selectOption('colors');
    const net = page.getByTestId('from-colors-net');
    await expect(net.locator('svg')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resolver mi puzzle', exact: true })).toBeEnabled();
    return net;
}

const spanishColor = { white: 'blanco', yellow: 'amarillo', green: 'verde', blue: 'azul', red: 'rojo', orange: 'naranja' };

async function paintPosition(page: Page, puzzle: ColorPuzzle, position: Awaited<ReturnType<typeof colorsOf>>) {
    const layout = await colorLayout(puzzle);
    const net = page.getByTestId('from-colors-net');
    await page.getByRole('button', { name: 'Empezar resuelto', exact: true }).click();
    for (const color of layout.palette) {
        const changes = layout.stickers.filter(({ id, solved }) => position[id] === color && solved !== color);
        if (changes.length === 0) continue;
        const name = spanishColor[layout.names[color]];
        await page.getByRole('button', { name, exact: true }).click();
        for (const { id } of changes) {
            const sticker = net.locator('[data-color-sticker="' + id + '"]');
            // A painted center may be covered by another SVG surface of the same sticker.
            await sticker.click({ force: true });
            await expect(sticker).toHaveAttribute('aria-label', new RegExp(': ' + name + '$'));
        }
    }
}

const solveColors = (page: Page) => page.getByRole('button', { name: 'Resolver mi puzzle', exact: true }).click();
const equivalent = (page: Page) => page.getByRole('textbox', { name: 'Mezcla equivalente', exact: true });

test('resuelve un 3×3 pintado con otra orientación e indica cómo sujetarlo', async ({ page }) => {
    await openEditor(page, '333');
    await page.getByRole('combobox', { name: 'Método', exact: true }).selectOption('cfopFull');
    await paintPosition(page, '333', await colorsOf('333', "x y R U R' F2 U"));
    await solveColors(page);
    await expect(page.getByTestId('solver-stage')).toHaveCount(7, { timeout: 35000 });
    await expect(equivalent(page)).toHaveValue(/^[RULDFB]['2]?(?: [RULDFB]['2]?)*$/);
    await expect(page.getByTestId('from-colors-hold')).toHaveText(/centro blanco arriba y el verde al frente/);
    await expect(page.getByTestId('from-colors-rotation')).toHaveText(/gíralo completo así: [xyz]/);
    await expect(page.locator('[data-visualization="3D"]')).toBeVisible();
    await expect(page.getByTestId('academy-net').locator('twisty-player')).toBeVisible();
});

test('identifica una esquina del 3×3 girada a mano', async ({ page }) => {
    await openEditor(page, '333');
    const painted = await colorsOf('333', '');
    const layout = await colorLayout('333');
    const corner = layout.stickers.filter(({ orbit, location }) => orbit === 'CORNERS' && location === 0);
    expect(corner).toHaveLength(3);
    const colors = corner.map(({ id }) => painted[id]);
    corner.forEach(({ id }, i) => { painted[id] = colors[(i + 1) % colors.length]; });
    await paintPosition(page, '333', painted);
    await solveColors(page);
    await expect(page.getByRole('alert')).toHaveText(/Una esquina está girada de una forma imposible/);
    await expect(page.getByTestId('solver-total')).toHaveCount(0);
});

test('resuelve un Pyraminx pintado con cuatro colores', async ({ page }) => {
    await openEditor(page, 'pyram');
    await expect(page.getByRole('group', { name: 'Paleta de colores' }).getByRole('button')).toHaveCount(4);
    await paintPosition(page, 'pyram', await colorsOf('pyram', "R U' L b"));
    await solveColors(page);
    await expect(page.getByTestId('solver-total')).toHaveAttribute('data-moves', /^[1-9]\d*$/, { timeout: 35000 });
    await expect(page.getByTestId('from-colors-hold')).toHaveText(/la cara amarilla abajo y la verde al frente/);
    await expect(page.getByTestId('from-colors-rotation')).toHaveCount(0);
});

test('permite pintar con el teclado, marcar adhesivos vacíos y resolver desde la red resuelta', async ({ page }) => {
    const net = await openEditor(page, '333');
    await page.getByRole('button', { name: 'rojo', exact: true }).click();
    const sticker = net.getByRole('button', { name: 'Adhesivo 1: sin pintar', exact: true });
    await sticker.press('Space');
    await expect(net.getByRole('button', { name: 'Adhesivo 1: rojo', exact: true })).toBeFocused();

    await page.getByRole('button', { name: 'Limpiar', exact: true }).click();
    await solveColors(page);
    await expect(page.getByRole('alert')).toHaveText(/Faltan adhesivos por pintar/);
    await expect(net.locator('[data-color-sticker][data-color-issue]')).toHaveCount(54);

    await page.getByRole('button', { name: 'Empezar resuelto', exact: true }).click();
    await solveColors(page);
    await expect(page.getByTestId('solver-total')).toHaveAttribute('data-moves', '0', { timeout: 35000 });
    await expect(equivalent(page)).toHaveValue('');
    await expect(page.getByTestId('from-colors-hold')).toHaveText(/centro blanco arriba y el verde al frente/);
    await expect(page.getByText('La etapa ya estaba resuelta.', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(net.locator('[data-color-issue]')).toHaveCount(0);
});
