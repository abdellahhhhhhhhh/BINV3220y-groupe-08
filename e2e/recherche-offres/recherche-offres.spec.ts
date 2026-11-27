import { expect, test, type Page } from "@playwright/test";

const publishedOfferTitles = [
  "Application React de gestion de flotte",
  "API REST de facturation",
  "Tableau de bord de qualité des données",
  "Assistant conversationnel interne",
];
const submittedOfferTitle = "Refonte du portail client";

async function openOffersAsLucas(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Connexion de démonstration" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Étudiants", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lucas Dupont", exact: true }).click();
  await page.getByRole("link", { name: "Offres", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Offres de stage", exact: true }),
  ).toBeVisible();
}

async function expectInitialPublishedOffers(page: Page) {
  await expect(page.getByText("4 offres", { exact: true })).toBeVisible();

  for (const title of publishedOfferTitles) {
    await expect(
      page.getByRole("cell", { name: title, exact: true }),
    ).toBeVisible();
  }

  await expect(
    page.getByRole("cell", { name: submittedOfferTitle, exact: true }),
  ).toBeHidden();
}

test("Scénario 1 — recherche avec résultat", async ({ page }) => {
  await openOffersAsLucas(page);
  await expectInitialPublishedOffers(page);

  await page.getByRole("searchbox", { name: "Recherche" }).fill("api rest");

  await expect(page.getByText("1 offre", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "API REST de facturation", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Orbis", exact: true })).toBeVisible();

  for (const title of publishedOfferTitles.filter(
    (title) => title !== "API REST de facturation",
  )) {
    await expect(
      page.getByRole("cell", { name: title, exact: true }),
    ).toBeHidden();
  }
});

test("Scénario 2 — recherche d’une offre non publiée", async ({ page }) => {
  await openOffersAsLucas(page);
  await expectInitialPublishedOffers(page);

  await page.getByRole("searchbox", { name: "Recherche" }).fill("portail");

  await expect(page.getByText(/^\d+ offres?$/)).toHaveCount(0);
  await expect(
    page.getByText("Aucune offre ne correspond à votre recherche.", {
      exact: true,
    }),
  ).toBeVisible();

  for (const title of [...publishedOfferTitles, submittedOfferTitle]) {
    await expect(page.getByText(title, { exact: true })).toBeHidden();
  }
});
