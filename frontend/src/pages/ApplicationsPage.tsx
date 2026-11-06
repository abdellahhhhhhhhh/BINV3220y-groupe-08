import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import StatusBadge from "../components/StatusBadge.tsx";
import { useApplications } from "../hooks/useApplications.ts";
import type { ApplicationStatus } from "../models/application.ts";
import type { User } from "../models/user.ts";
import { PERIOD_LABELS, type StatusTone } from "../utils/labels.ts";
import { isUnauthorized } from "../utils/api.ts";

interface ApplicationsPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  IN_PROGRESS: "En cours",
  SELECTED: "Retenue",
  REJECTED: "Non retenue",
  WITHDRAWN: "Retirée",
};

const APPLICATION_STATUS_TONES: Record<ApplicationStatus, StatusTone> = {
  IN_PROGRESS: "warning",
  SELECTED: "success",
  REJECTED: "neutral",
  WITHDRAWN: "neutral",
};

const ApplicationsPage = ({ token, onUnauthorized }: ApplicationsPageProps) => {
  const { applications, isLoading, error, withdrawApplication } = useApplications(
    token,
    onUnauthorized,
  );
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);

  const handleWithdraw = async (applicationId: number) => {
    setWithdrawingId(applicationId);
    setWithdrawalError(null);
    try {
      await withdrawApplication(applicationId);
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else {
        setWithdrawalError(reason instanceof Error ? reason.message : "Erreur inconnue");
      }
    } finally {
      setWithdrawingId(null);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (isLoading) return <LoadingState />;
  if (applications.length === 0) {
    return (
      <section>
        <h1>Mes candidatures</h1>
        <EmptyState message="Vous n'avez encore aucune candidature." />
      </section>
    );
  }

  return (
    <section>
      <h1>Mes candidatures</h1>
      {withdrawalError && <ErrorState message={withdrawalError} />}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Offre</th>
              <th scope="col">Entreprise</th>
              <th scope="col">Année</th>
              <th scope="col">Période</th>
              <th scope="col">Statut</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.offer?.title ?? `Offre #${application.offerId}`}</td>
                <td>{application.offer?.companyShortName ?? "—"}</td>
                <td>{application.offer?.academicYear ?? "—"}</td>
                <td>
                  {application.offer ? PERIOD_LABELS[application.offer.period] : "—"}
                </td>
                <td>
                  <StatusBadge
                    label={APPLICATION_STATUS_LABELS[application.status]}
                    tone={APPLICATION_STATUS_TONES[application.status]}
                  />
                </td>
                <td>
                  {application.status === "IN_PROGRESS" && (
                    <button
                      type="button"
                      onClick={() => void handleWithdraw(application.id)}
                      disabled={withdrawingId === application.id}
                    >
                      {withdrawingId === application.id ? "Retrait…" : "Retirer"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ApplicationsPage;
import { useState } from "react";
