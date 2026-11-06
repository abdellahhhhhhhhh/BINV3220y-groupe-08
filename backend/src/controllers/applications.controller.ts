import { Router } from "express";
import { toApplicationDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { HttpError } from "../utils/httpError.ts";

interface CreateApplicationBody {
  offerId: number;
  message: string | null;
}

const isCreateApplicationBody = (value: unknown): value is CreateApplicationBody => {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Record<string, unknown>;
  return (
    typeof body.offerId === "number" &&
    Number.isInteger(body.offerId) &&
    body.offerId > 0 &&
    (body.message === undefined || body.message === null || typeof body.message === "string")
  );
};

export const createApplicationsRouter = (applicationsService: ApplicationsService) => {
  const router = Router();

  router.delete("/:id", (req, res) => {
    const applicationId = Number(req.params.id);
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      throw new HttpError(
        400,
        "INVALID_QUERY",
        "L'identifiant de candidature doit être un entier positif",
      );
    }
    applicationsService.withdrawApplication(getCurrentUser(req), applicationId);
    res.status(204).send();
  });

  router.get("/", (req, res) => {
    res.json(
      applicationsService.listApplications(getCurrentUser(req)).map(toApplicationDto),
    );
  });

  router.post("/", (req, res) => {
    const body: unknown = req.body;
    if (!isCreateApplicationBody(body)) {
      throw new HttpError(
        400,
        "INVALID_BODY",
        "Le corps doit contenir offerId (entier positif) et un message facultatif",
      );
    }

    const application = applicationsService.createApplication(
      getCurrentUser(req),
      body.offerId,
      body.message ?? null,
    );
    res.status(201).json(toApplicationDto(application));
  });

  return router;
};
