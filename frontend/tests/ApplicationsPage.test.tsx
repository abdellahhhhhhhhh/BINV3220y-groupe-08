import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApplicationsPage from "../src/pages/ApplicationsPage.tsx";
import { studentUser, stubFetch } from "./helpers/fetchMock.ts";

const applications = [
  {
    id: 1,
    offerId: 1,
    studentId: 3,
    message: null,
    status: "IN_PROGRESS",
    appliedAt: "2026-10-02 18:10:00",
    offer: {
      title: "Application React de gestion de flotte",
      companyShortName: "Lumen Digital",
      academicYear: "2026-2027",
      period: "P2",
    },
  },
  {
    id: 2,
    offerId: 6,
    studentId: 3,
    message: null,
    status: "SELECTED",
    appliedAt: "2026-09-22 12:00:00",
    offer: {
      title: "Migration d'une application vers le cloud",
      companyShortName: "Datavia",
      academicYear: "2026-2027",
      period: "P2",
    },
  },
  {
    id: 3,
    offerId: 7,
    studentId: 3,
    message: null,
    status: "REJECTED",
    appliedAt: "2026-09-23 17:25:00",
    offer: {
      title: "Assistant conversationnel interne",
      companyShortName: "Nexalis",
      academicYear: "2026-2027",
      period: "OTHER",
    },
  },
  {
    id: 4,
    offerId: 3,
    studentId: 3,
    message: null,
    status: "WITHDRAWN",
    appliedAt: "2026-09-30 10:30:00",
    offer: {
      title: "API REST de facturation",
      companyShortName: "Orbis",
      academicYear: "2026-2027",
      period: "P2",
    },
  },
];

describe("ApplicationsPage", () => {
  it("affiche les offres et les quatre libellés de statut", async () => {
    stubFetch({ "/api/applications": () => Response.json(applications) });

    render(<ApplicationsPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Application React de gestion de flotte")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(screen.getByText("Retenue")).toBeInTheDocument();
    expect(screen.getByText("Non retenue")).toBeInTheDocument();
    expect(screen.getByText("Retirée")).toBeInTheDocument();
  });

  it("affiche l'état vide", async () => {
    stubFetch({ "/api/applications": () => Response.json([]) });

    render(<ApplicationsPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Vous n'avez encore aucune candidature.")).toBeInTheDocument();
  });

  it("signale une session expirée", async () => {
    stubFetch({ "/api/applications": () => new Response(null, { status: 401 }) });
    const onUnauthorized = vi.fn();

    render(<ApplicationsPage user={studentUser} token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it("permet de retirer une candidature en cours et met à jour son statut", async () => {
    const fetchMock = stubFetch({
      "/api/applications/1": () => new Response(null, { status: 204 }),
      "/api/applications": () => Response.json([applications[0]]),
    });

    render(<ApplicationsPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("En cours")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/applications/1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
    expect(await screen.findByText("Retirée")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retirer" })).not.toBeInTheDocument();
  });

  it("n'affiche pas de bouton pour une candidature traitée", async () => {
    stubFetch({ "/api/applications": () => Response.json([applications[1]]) });

    render(<ApplicationsPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);

    await screen.findByText("Retenue");
    expect(screen.queryByRole("button", { name: "Retirer" })).not.toBeInTheDocument();
  });
});
