import { expect, test } from "./fixtures";

for (const id of ["333", "222", "pyram", "skewb"]) {
  test("Resolver produce etapas para " + id, async ({ page }) => {
    await page.goto("/#solver");
    await page
      .getByRole("combobox", { name: "Puzzle", exact: true })
      .selectOption(id);
    await page
      .getByRole("textbox", { name: "Mezcla", exact: true })
      .fill("R U");
    const resolve = page.getByRole("button", { name: "Resolver", exact: true });
    await resolve.click();
    await expect(page.getByTestId("solver-total")).toHaveAttribute(
      "data-moves",
      "2",
      {
        timeout: 35000,
      },
    );
    await expect(resolve).toBeEnabled();
  });
}

test("abre 333 OH desde Estadísticas si un respaldo usa el ID de modalidad como puzzle", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Evento", exact: true })
    .selectOption("333oh");
  await expect(
    page.getByRole("button", { name: "Siguiente mezcla", exact: true }),
  ).toBeEnabled({
    timeout: 15000,
  });
  const scramble = (await page.getByTestId("scramble").innerText()).trim();
  await page
    .getByRole("checkbox", { name: "Inspección", exact: true })
    .uncheck();
  const zone = page.getByTestId("touch-zone");
  await page.keyboard.down("Space");
  await expect(zone).toHaveAttribute("data-phase", "ready");
  await page.keyboard.up("Space");
  await expect(zone).toHaveAttribute("data-phase", "running");
  await expect(page.getByTestId("digits")).not.toHaveText("0.00");
  await page.keyboard.press("KeyS");
  await expect(page.getByTestId("session-count")).toHaveText(
    "Intentos en la sesión: 1",
  );
  await page.evaluate(
    () =>
      new Promise<void>((done, fail) => {
        const open = indexedDB.open("cubelab");
        open.onerror = () => fail(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction("solves", "readwrite");
          const cursor = tx.objectStore("solves").openCursor();
          cursor.onsuccess = () => {
            const row = cursor.result;
            if (row?.value.eventId === "333oh")
              row.update({ ...row.value, puzzleId: "333oh" });
            else row?.continue();
          };
          tx.oncomplete = () => {
            db.close();
            done();
          };
          tx.onabort = () => {
            db.close();
            fail(tx.error);
          };
        };
      }),
  );
  await page.getByRole("link", { name: "Estadísticas", exact: true }).click();
  const attempt = page.getByTestId("history-solve");
  await attempt.locator("summary").click();
  await attempt
    .getByRole("link", { name: "Ver en el solucionador", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Mezcla", exact: true }),
  ).toHaveValue(scramble);
  await page.getByRole("button", { name: "Resolver", exact: true }).click();
  await expect(page.getByTestId("solver-total")).toBeVisible({
    timeout: 35000,
  });
});
test("Resolver admite otro cálculo mientras la comparación anterior sigue pendiente", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const postMessage = Worker.prototype.postMessage;
    let holdFirstComparison = true;
    Worker.prototype.postMessage = function (
      message: unknown,
      ...options: unknown[]
    ) {
      if (
        holdFirstComparison &&
        message &&
        typeof message === "object" &&
        "kind" in message &&
        message.kind === "solve" &&
        "method" in message &&
        message.method === "shortest"
      ) {
        holdFirstComparison = false;
        return;
      }
      Reflect.apply(postMessage, this, [message, ...options]);
    };
  });
  await page.goto("/#solver");
  await page
    .getByRole("combobox", { name: "Puzzle", exact: true })
    .selectOption("333");
  await page
    .getByRole("combobox", { name: "Método", exact: true })
    .selectOption("cfopFull");
  await page.getByRole("textbox", { name: "Mezcla", exact: true }).fill("R U");
  const solve = page.getByRole("button", { name: "Resolver", exact: true });
  await solve.click();
  await expect(page.getByTestId("solver-total")).toBeVisible();
  await expect(
    page.getByText("Calculando la solución corta para comparar…", {
      exact: true,
    }),
  ).toBeVisible();
  await solve.click();
  await expect(
    page.getByText("Solución corta · 2 movimientos", { exact: true }),
  ).toBeVisible();
});
