import { toApplication } from "../mappers/application.mapper.ts";
import type { Application } from "../models/application.ts";
import type { User } from "../models/user.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import { HttpError } from "../utils/httpError.ts";
import { isStudent } from "./permissions.ts";

export const createApplicationsService = (repository: ApplicationsRepository) => ({
  withdrawApplication: (viewer: User, applicationId: number): void => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut retirer une candidature");
    }

    const application = repository.findOwned(applicationId, viewer.id);
    if (application === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Candidature introuvable");
    }
    if (application.status !== "IN_PROGRESS") {
      throw new HttpError(
        400,
        "INVALID_APPLICATION",
        "Cette candidature a déjà été traitée et ne peut plus être retirée",
      );
    }
    if (!repository.withdraw(applicationId, viewer.id)) {
      throw new HttpError(400, "INVALID_APPLICATION", "La candidature ne peut plus être retirée");
    }
  },

  listApplications: (viewer: User): Application[] => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut consulter ses candidatures");
    }
    return repository.findByStudent(viewer.id).map(toApplication);
  },

  createApplication: (
    viewer: User,
    offerId: number,
    message: string | null,
  ): Application => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut candidater");
    }

    const offer = repository.findOfferStatus(offerId);
    if (offer === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }
    if (repository.findActive(offerId, viewer.id) !== undefined) {
      throw new HttpError(400, "DUPLICATE_APPLICATION", "Vous avez déjà candidaté à cette offre");
    }
    if (offer.status !== "PUBLISHED") {
      throw new HttpError(400, "INVALID_APPLICATION", "L'offre n'est pas publiée");
    }

    const application = repository.insert(offerId, viewer.id, message);
    if (application === undefined) {
      throw new HttpError(400, "DUPLICATE_APPLICATION", "Vous avez déjà candidaté à cette offre");
    }
    return toApplication(application);
  },
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
