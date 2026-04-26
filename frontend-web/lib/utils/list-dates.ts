/** Affichage court FR pour listes (jour + heure). */
export function formatDateTimeFr(
  value: string | Date | null | undefined,
): string {
  if (value == null) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

/** Jour seulement (listes serrées). */
export function formatDateFr(value: string | Date | null | undefined): string {
  if (value == null) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
}
