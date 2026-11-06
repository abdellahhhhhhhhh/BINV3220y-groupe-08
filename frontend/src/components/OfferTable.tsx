import { useState } from "react";
import type { Offer } from "../models/offer.ts";
import { OFFER_STATUS_LABELS, OFFER_STATUS_TONES, PERIOD_LABELS } from "../utils/labels.ts";
import StatusBadge from "./StatusBadge.tsx";

interface OfferTableProps {
  offers: Offer[];
  canApply?: boolean;
  appliedOfferIds?: ReadonlySet<number>;
  onApply?: (offerId: number, message: string) => Promise<void>;
  applyingOfferId?: number | null;
  applicationError?: string | null;
}

const OfferTable = ({
  offers,
  canApply = false,
  appliedOfferIds = new Set<number>(),
  onApply,
  applyingOfferId = null,
  applicationError = null,
}: OfferTableProps) => {
  const [openOfferId, setOpenOfferId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const submitApplication = async (offerId: number) => {
    if (onApply === undefined) return;
    try {
      await onApply(offerId, message);
      setOpenOfferId(null);
      setMessage("");
    } catch {
      // The parent displays the API error and keeps the form available.
    }
  };

  return (
    <div className="table-wrapper">
      <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Titre</th>
          <th scope="col">Entreprise</th>
          <th scope="col">Année</th>
          <th scope="col">Période</th>
          <th scope="col">Statut</th>
          {canApply && <th scope="col">Action</th>}
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => (
          <tr key={offer.id}>
            <td>{offer.title}</td>
            <td>{offer.companyShortName}</td>
            <td>{offer.academicYear}</td>
            <td>{PERIOD_LABELS[offer.period]}</td>
            <td>
              <StatusBadge
                label={OFFER_STATUS_LABELS[offer.status]}
                tone={OFFER_STATUS_TONES[offer.status]}
              />
            </td>
            {canApply && (
              <td>
                {offer.hasActiveApplication === true || appliedOfferIds.has(offer.id) ? (
                  <span className="status-badge status-badge-success">Déjà candidaté</span>
                ) : openOfferId === offer.id ? (
                  <form
                    className="application-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitApplication(offer.id);
                    }}
                  >
                    <label htmlFor={`application-message-${offer.id}`}>Message (facultatif)</label>
                    <textarea
                      id={`application-message-${offer.id}`}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                    />
                    <button type="submit" disabled={applyingOfferId === offer.id}>
                      {applyingOfferId === offer.id ? "Envoi…" : "Envoyer"}
                    </button>
                    <button type="button" onClick={() => setOpenOfferId(null)}>
                      Annuler
                    </button>
                    {applicationError && <p role="alert">{applicationError}</p>}
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenOfferId(offer.id);
                      setMessage("");
                    }}
                  >
                    Candidater
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
};

export default OfferTable;
