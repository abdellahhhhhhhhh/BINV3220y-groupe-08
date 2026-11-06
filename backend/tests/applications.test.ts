import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { OFFER, STUDENT, CONTACT } from "../src/db/seed/seedIds.ts";
import type { UserKind } from "../src/models/user.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const applyAs = (kind: UserKind, id: number, body: object) =>
  request(app)
    .post("/applications")
    .set("Authorization", tokenFor(kind, id))
    .send(body);

const listAs = (kind: UserKind, id: number) =>
  request(app).get("/applications").set("Authorization", tokenFor(kind, id));

const withdrawAs = (kind: UserKind, id: number, applicationId: string | number) =>
  request(app)
    .delete(`/applications/${applicationId}`)
    .set("Authorization", tokenFor(kind, id));

describe("DELETE /applications/:id : retrait", () => {
  it("retire une candidature en cours et conserve la ligne", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, 1);

    expect(response.status).toBe(204);
    const applications = await listAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(applications.body.find((application: { id: number }) => application.id === 1).status)
      .toBe("WITHDRAWN");
  });

  it("refuse une candidature d'un autre étudiant en masquant son existence (404)", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, 2);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("refuse le retrait d'une candidature retenue (400)", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.MATEUSZ_KOWALSKI, 3);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_APPLICATION");
  });

  it("refuse le retrait d'une candidature non retenue appartenant à un autre étudiant (404)", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.MATEUSZ_KOWALSKI, 4);

    expect(response.status).toBe(404);
  });

  it("refuse le retrait d'une candidature déjà retirée (400)", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.INES_HADDAD, 5);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_APPLICATION");
  });

  it("refuse un identifiant invalide (400)", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, "abc");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_QUERY");
  });

  it("refuse un utilisateur qui n'est pas étudiant (403)", async () => {
    const response = await withdrawAs("CONTACT", CONTACT.MARC_LEJEUNE, 1);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("refuse une requête sans session (401)", async () => {
    const response = await request(app).delete("/applications/1");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });
});

describe("GET /applications : consultation", () => {
  it("refuse une requête sans session (401)", async () => {
    const response = await request(app).get("/applications");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("refuse un utilisateur qui n'est pas étudiant (403)", async () => {
    const response = await listAs("CONTACT", CONTACT.MARC_LEJEUNE);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("retourne uniquement les candidatures de l'étudiant avec les informations de l'offre", async () => {
    const response = await listAs("STUDENT", STUDENT.INES_HADDAD);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((application: { offerId: number }) => application.offerId)).toEqual([
      OFFER.FLEET_APP,
      OFFER.BILLING_API,
    ]);
    expect(
      response.body.find(
        (application: { offerId: number }) => application.offerId === OFFER.BILLING_API,
      ),
    ).toMatchObject({
      studentId: STUDENT.INES_HADDAD,
      status: "WITHDRAWN",
      offer: {
        title: "API REST de facturation",
        companyShortName: "Orbis",
        academicYear: "2026-2027",
        period: "P2",
      },
    });
  });

  it("retourne une liste vide pour un étudiant sans candidature", async () => {
    const response = await listAs("STUDENT", STUDENT.DMYTRO_KOVALENKO);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe("POST /applications : accès et validation", () => {
  it("refuse une requête sans session (401)", async () => {
    const response = await request(app).post("/applications").send({ offerId: OFFER.BILLING_API });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("refuse un utilisateur qui n'est pas étudiant (403)", async () => {
    const response = await applyAs("CONTACT", CONTACT.MARC_LEJEUNE, {
      offerId: OFFER.BILLING_API,
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("refuse un corps invalide (400)", async () => {
    const response = await applyAs("STUDENT", STUDENT.DMYTRO_KOVALENKO, {
      offerId: "3",
      message: 42,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_BODY");
  });

  it("refuse une offre inexistante (404)", async () => {
    const response = await applyAs("STUDENT", STUDENT.DMYTRO_KOVALENKO, { offerId: 999 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("refuse une offre qui n'est pas publiée (400)", async () => {
    const response = await applyAs("STUDENT", STUDENT.DMYTRO_KOVALENKO, { offerId: OFFER.E2E_TESTS });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_APPLICATION");
  });
});

describe("POST /applications : création et doublons", () => {
  it("crée une candidature avec un message facultatif", async () => {
    const response = await applyAs("STUDENT", STUDENT.DMYTRO_KOVALENKO, {
      offerId: OFFER.BILLING_API,
      message: "Je suis très intéressé.",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      offerId: OFFER.BILLING_API,
      studentId: STUDENT.DMYTRO_KOVALENKO,
      message: "Je suis très intéressé.",
      status: "IN_PROGRESS",
    });
    expect(response.body).not.toHaveProperty("offer_id");
  });

  it("crée une candidature sans message", async () => {
    const response = await applyAs("STUDENT", STUDENT.DMYTRO_KOVALENKO, {
      offerId: OFFER.INTERNAL_CHATBOT,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBeNull();
  });

  it.each([
    ["en cours", STUDENT.LUCAS_DUPONT, OFFER.FLEET_APP],
    ["retenue", STUDENT.MATEUSZ_KOWALSKI, OFFER.CLOUD_MIGRATION],
  ])("refuse un doublon %s", async (_status, studentId, offerId) => {
    const response = await applyAs("STUDENT", studentId, { offerId });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("DUPLICATE_APPLICATION");
  });
});
