/**
 * Avertissement si la réservation couvre une période commençant dans le passé
 * (saisie historique / rétroactive). Ne bloque pas la soumission.
 */
export function getPastBookingPeriodWarning(
  startDateStr: string,
  endDateStr: string | undefined,
): string | null {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  if (Number.isNaN(start.getTime())) return null;
  const now = Date.now();
  if (start.getTime() >= now) return null;

  let msg =
    "Attention : la date de début est dans le passé. Utilisez cela pour une saisie historique ou une correction. Vérifiez le planning et le permis du client.";

  if (endDateStr) {
    const end = new Date(endDateStr);
    if (!Number.isNaN(end.getTime()) && end.getTime() < now) {
      msg +=
        " La date de fin est également passée : la location est entièrement dans le passé.";
    }
  }

  return msg;
}
