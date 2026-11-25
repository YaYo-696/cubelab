import { test as freshTest } from "@playwright/test";
import { Alg } from "cubing/alg";
import { expect, test } from "./fixtures";

test("los videos de Academia se desactivan sin conexión y las mezclas nuevas siguen disponibles", async ({
  page,
  context,
}) => {
  await page.goto("/#settings");
  await expect(
    page.getByText("Listo para usar sin conexión.", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole("link", { name: "Academia", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Evento", exact: true })
    .selectOption("pyram");
  await page.goto("/#academy/pyram-l4e/pyram");
  const videos = page.getByRole("region", {
    name: "Videos recomendados",
    exact: true,
  });
  const search = videos.getByRole("link", {
    name: "Buscar más en YouTube",
    exact: true,
  });
  await expect(search).toHaveAttribute("target", "_blank");
  await expect(search).toHaveAttribute("rel", "noopener noreferrer");
  await context.setOffline(true);
  await expect(
    videos.getByText("Requiere internet", { exact: true }),
  ).toBeVisible();
  await expect(search).toHaveAttribute("aria-disabled", "true");
  await expect(videos.locator("a, iframe")).toHaveCount(0);
  await page.reload();
  await expect(search).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("link", { name: "Timer", exact: true }).click();
  const event = page.getByRole("combobox", { name: "Evento", exact: true });
  for (const id of ["666", "777", "minx", "sq1", "clock"]) {
    await event.selectOption(id);
    await expect(
      page.getByRole("button", { name: "Siguiente mezcla", exact: true }),
    ).toBeEnabled({ timeout: id === "sq1" ? 30000 : 15000 });
    await expect(page.getByTestId("scramble")).not.toBeEmpty();
  }
});

test("la demo de Pyraminx sin setup parte de cero y avanza un giro", async ({
  page,
}) => {
  await page.goto("/#academy");
  await page
    .getByRole("combobox", { name: "Evento", exact: true })
    .selectOption("pyram");
  await page
    .getByRole("button", { name: "Notación del Pyraminx", exact: true })
    .click();
  const player = page.getByTestId("academy-player").locator("twisty-player");
  const timestamp = () =>
    player.evaluate(async (node: HTMLElementTagNameMap["twisty-player"]) =>
      Number(await node.experimentalGet.timestamp()),
    );
  await expect.poll(timestamp).toBe(0);
  await page
    .getByRole("button", { name: "Paso siguiente", exact: true })
    .click();
  await expect.poll(timestamp).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Paso anterior", exact: true })
    .click();
  await expect.poll(timestamp).toBe(0);
});

freshTest(
  "respalda, exporta CSV y restaura resultados de FMC y Multi-Blind juntos",
  async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Saltar introducción", exact: true })
      .click();
    const event = page.getByRole("combobox", { name: "Evento", exact: true });
    const prepare = page.getByRole("button", {
      name: "Preparar intento",
      exact: true,
    });
    const start = page.getByRole("button", {
      name: "Iniciar intento",
      exact: true,
    });
    await event.selectOption("333fm");
    await prepare.click();
    await expect(start).toBeEnabled({ timeout: 15000 });
    await start.click();
    const scramble = await page.getByTestId("scramble").innerText();
    const alg = new Alg(scramble).invert().toString();
    await page
      .getByRole("textbox", { name: "Solución escrita", exact: true })
      .fill(alg);
    await page
      .getByRole("button", { name: "Entregar solución", exact: true })
      .click();
    const fmc = alg.split(/\s+/).length + " mov.";
    await expect(page.getByTestId("modality-result")).toHaveText(fmc);
    await event.selectOption("333mbf");
    await prepare.click();
    await expect(start).toBeEnabled({ timeout: 15000 });
    await start.click();
    await page
      .getByRole("button", { name: "Detener intento", exact: true })
      .click();
    await page
      .getByRole("spinbutton", { name: "Cubos resueltos", exact: true })
      .fill("2");
    await page
      .getByRole("button", { name: "Guardar resultado", exact: true })
      .click();
    await expect(page.getByTestId("modality-result")).toContainText(
      "2/2 · 2 pts",
    );
    await page.getByRole("link", { name: "Estadísticas", exact: true }).click();
    await expect(page.getByTestId("history-solve")).toHaveCount(1);
    const download = async (name: string) => {
      const request = page.waitForEvent("download");
      await page.getByRole("button", { name, exact: true }).click();
      return await request;
    };
    const file = await (await download("Exportar JSON")).path();
    const csv = await (await download("Exportar CSV")).createReadStream();
    let text = "";
    for await (const chunk of csv) text += chunk.toString();
    expect(text).toContain('"moves","solved","attempted","points","solution"');
    expect(text).toContain('"333fm"');
    expect(text).toContain('"333mbf"');
    expect(text).toContain('"","2","2","2",""');
    await page.getByRole("link", { name: "Ajustes", exact: true }).click();
    await page
      .getByRole("button", { name: "Borrar todos los datos", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar borrado", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Saltar introducción", exact: true })
      .click();
    await page.getByRole("link", { name: "Estadísticas", exact: true }).click();
    await event.selectOption("333fm");
    await expect(page.getByTestId("history-solve")).toHaveCount(0);
    await page.getByLabel("Importar JSON").setInputFiles(file);
    await expect(
      page.getByRole("status").filter({ hasText: /^Respaldo importado\.$/ }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByTestId("history-solve").locator("summary"),
    ).toContainText(fmc, { timeout: 15000 });
    await expect(
      page.getByRole("rowheader", { name: "Mo3", exact: true }),
    ).toBeVisible();
    await event.selectOption("333mbf");
    await expect(
      page.getByTestId("history-solve").locator("summary"),
    ).toContainText("2/2 · 2 pts", { timeout: 15000 });
    await page.getByTestId("history-solve").locator("summary").click();
    await expect(
      page.getByRole("link", { name: "Ver en el solucionador", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Solucionador", exact: true }).click();
    await page
      .getByRole("button", { name: "Mezcla del último solve", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Mezcla", exact: true }),
    ).toHaveValue(scramble.trim());
    await page.getByRole("link", { name: "Ajustes", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Idioma", exact: true })
      .selectOption("en");
    await page.getByRole("link", { name: "Statistics", exact: true }).click();
    await expect(
      page.getByRole("rowheader", { name: "Score", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Event", exact: true })
      .selectOption("333fm");
    await expect(
      page.getByRole("rowheader", { name: "Mo3", exact: true }),
    ).toBeVisible();
  },
);
