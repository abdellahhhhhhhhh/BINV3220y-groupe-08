import type { Offer, PeriodCode } from "../models/offer.ts";
import { API_URL, readJson } from "../utils/api.ts";
import { isOfferList } from "../utils/guards.ts";

export const getOffers = async (
  token: string,
  signal?: AbortSignal,
  period?: PeriodCode,
  search?: string,
): Promise<Offer[]> => {
  const params = [
    search ? `q=${encodeURIComponent(search)}` : "",
    period ? `period=${encodeURIComponent(period)}` : "",
  ].filter(Boolean);
  const query = params.length > 0 ? `?${params.join("&")}` : "";
  const response = await fetch(`${API_URL}/offers${query}`, {
    headers: { Authorization: token },
    signal,
  });
  return readJson(response, isOfferList, "Chargement des offres impossible");
};
